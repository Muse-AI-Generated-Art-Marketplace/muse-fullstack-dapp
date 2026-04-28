#![no_std]
use stellar_contract_sdk::{
    contractimpl, contracttype, contracterror, contractfn, 
    Address, BigInt, BytesN, Env, Symbol, Vec, Map, String
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Artwork {
    pub id: u64,
    pub creator: Address,
    pub title: String,
    pub description: String,
    pub image_url: String,
    pub prompt: String,
    pub ai_model: String,
    pub price: BigInt,
    pub royalty_bps: u32, // Basis points (1/100 of a percent)
    pub created_at: u64,
    pub token_id: Option<BytesN<32>>, // Stellar asset code
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Listing {
    pub artwork_id: u64,
    pub seller: Address,
    pub price: BigInt,
    pub expires_at: u64,
    pub active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Offer {
    pub listing_id: u64,
    pub offeror: Address,
    pub amount: BigInt,
    pub expires_at: u64,
    pub active: bool,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum MuseError {
    Unauthorized = 1,
    InsufficientFunds = 2,
    ArtworkNotFound = 3,
    ListingNotFound = 4,
    OfferNotFound = 5,
    ListingExpired = 6,
    OfferExpired = 7,
    RoyaltyTooHigh = 8,
    InvalidPrice = 9,
    AlreadyListed = 10,
    NotOwner = 11,
}

// Storage keys
const ARTWORKS: Symbol = Symbol::new(&Env::current(), "ARTWORKS");
const LISTINGS: Symbol = Symbol::new(&Env::current(), "LISTINGS");
const OFFERS: Symbol = Symbol::new(&Env::current(), "OFFERS");
const USER_ARTWORKS: Symbol = Symbol::new(&Env::current(), "USER_ARTWORKS");
const USER_LISTINGS: Symbol = Symbol::new(&Env::current(), "USER_LISTINGS");
const COUNTER: Symbol = Symbol::new(&Env::current(), "COUNTER");
const ADMIN: Symbol = Symbol::new(&Env::current(), "ADMIN");
const MARKETPLACE_FEE_BPS: u32 = 250; // 2.5% marketplace fee
const MAX_ROYALTY_BPS: u32 = 1000; // 10% max royalty

pub struct MuseContract;

#[contractimpl]
impl MuseContract {
    // Initialize the contract
    pub fn initialize(env: &Env) -> Result<(), MuseError> {
        if env.storage().instance().has(&COUNTER) {
            return Err(MuseError::Unauthorized);
        }
        
        env.storage().instance().set(&COUNTER, &0u64);
        // In a real scenario, the deployer would be set as ADMIN here
        Ok(())
    }

    // Function to upgrade the contract's Wasm code
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) -> Result<(), MuseError> {
        // Administrative check (simplified for this implementation)
        // env.storage().instance().get::<_, Address>(&ADMIN).unwrap().require_auth();

        env.deployer().update_current_contract_wasm(new_wasm_hash.clone());

        // Emit upgrade event
        env.events().publish(
            (Symbol::new(&env, "contract_upgraded"),),
            new_wasm_hash
        );

        Ok(())
    }

    // Create a new artwork
    pub fn create_artwork(
        env: &Env,
        creator: Address,
        title: String,
        description: String,
        image_url: String,
        prompt: String,
        ai_model: String,
        price: BigInt,
        royalty_bps: u32,
    ) -> Result<u64, MuseError> {
        if royalty_bps > MAX_ROYALTY_BPS {
            return Err(MuseError::RoyaltyTooHigh);
        }
        
        if price <= 0.into() {
            return Err(MuseError::InvalidPrice);
        }

        let counter: u64 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        let artwork_id = counter + 1;
        
        let artwork = Artwork {
            id: artwork_id,
            creator: creator.clone(),
            title,
            description,
            image_url,
            prompt,
            ai_model,
            price,
            royalty_bps,
            created_at: env.ledger().timestamp(),
            token_id: None,
        };

        // Store artwork
        let mut artworks: Map<u64, Artwork> = env.storage().instance().get(&ARTWORKS).unwrap_or(Map::new(&env));
        artworks.set(artwork_id, artwork);
        env.storage().instance().set(&ARTWORKS, &artworks);

        // Update user artworks
        let mut user_artworks: Map<Address, Vec<u64>> = env.storage().instance().get(&USER_ARTWORKS).unwrap_or(Map::new(&env));
        let mut user_list = user_artworks.get(creator).unwrap_or(Vec::new(&env));
        user_list.push_back(artwork_id);
        user_artworks.set(creator, user_list);
        env.storage().instance().set(&USER_ARTWORKS, &user_artworks);

        // Update counter
        env.storage().instance().set(&COUNTER, &artwork_id);

        Ok(artwork_id)
    }

    // List artwork for sale
    pub fn list_artwork(
        env: &Env,
        seller: Address,
        artwork_id: u64,
        price: BigInt,
        duration: u64, // Duration in seconds
    ) -> Result<u64, MuseError> {
        let artworks: Map<u64, Artwork> = env.storage().instance().get(&ARTWORKS).unwrap_or(Map::new(&env));
        let artwork = artworks.get(artwork_id).ok_or(MuseError::ArtworkNotFound)?;

        if artwork.creator != seller {
            return Err(MuseError::NotOwner);
        }

        if price <= 0.into() {
            return Err(MuseError::InvalidPrice);
        }

        // Check if already listed
        let listings: Map<u64, Listing> = env.storage().instance().get(&LISTINGS).unwrap_or(Map::new(&env));
        for (_, listing) in listings.iter() {
            if listing.artwork_id == artwork_id && listing.active {
                return Err(MuseError::AlreadyListed);
            }
        }

        let counter: u64 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        let listing_id = counter + 1;

        let listing = Listing {
            artwork_id,
            seller: seller.clone(),
            price,
            expires_at: env.ledger().timestamp() + duration,
            active: true,
        };

        // Store listing
        let mut listings = listings;
        listings.set(listing_id, listing);
        env.storage().instance().set(&LISTINGS, &listings);

        // Update user listings
        let mut user_listings: Map<Address, Vec<u64>> = env.storage().instance().get(&USER_LISTINGS).unwrap_or(Map::new(&env));
        let mut user_list = user_listings.get(seller).unwrap_or(Vec::new(&env));
        user_list.push_back(listing_id);
        user_listings.set(seller, user_list);
        env.storage().instance().set(&USER_LISTINGS, &user_listings);

        // Update counter
        env.storage().instance().set(&COUNTER, &listing_id);

        Ok(listing_id)
    }

    // Buy artwork directly
    pub fn buy_artwork(
        env: &Env,
        buyer: Address,
        listing_id: u64,
        amount: BigInt,
    ) -> Result<(), MuseError> {
        let listings: Map<u64, Listing> = env.storage().instance().get(&LISTINGS).unwrap_or(Map::new(&env));
        let mut listing = listings.get(listing_id).ok_or(MuseError::ListingNotFound)?;

        if !listing.active {
            return Err(MuseError::ListingNotFound);
        }

        if env.ledger().timestamp() > listing.expires_at {
            return Err(MuseError::ListingExpired);
        }

        if amount < listing.price {
            return Err(MuseError::InsufficientFunds);
        }

        let artworks: Map<u64, Artwork> = env.storage().instance().get(&ARTWORKS).unwrap_or(Map::new(&env));
        let artwork = artworks.get(listing.artwork_id).ok_or(MuseError::ArtworkNotFound)?;

        // Calculate fees and royalties
        let marketplace_fee = (amount * MARKETPLACE_FEE_BPS.into()) / 10000.into();
        let royalty_fee = (amount * artwork.royalty_bps.into()) / 10000.into();
        let seller_amount = amount - marketplace_fee - royalty_fee;

        // In a real implementation, you would handle the actual token transfers here
        // For now, we'll just update the listing status
        
        listing.active = false;
        let mut listings = listings;
        listings.set(listing_id, listing);
        env.storage().instance().set(&LISTINGS, &listings);

        // Update artwork ownership logic would go here
        // For Stellar, this might involve transferring a custom token or updating ownership records

        Ok(())
    }

    // Make an offer on artwork
    pub fn make_offer(
        env: &Env,
        offeror: Address,
        listing_id: u64,
        amount: BigInt,
        duration: u64,
    ) -> Result<u64, MuseError> {
        let listings: Map<u64, Listing> = env.storage().instance().get(&LISTINGS).unwrap_or(Map::new(&env));
        let listing = listings.get(listing_id).ok_or(MuseError::ListingNotFound)?;

        if !listing.active {
            return Err(MuseError::ListingNotFound);
        }

        if env.ledger().timestamp() > listing.expires_at {
            return Err(MuseError::ListingExpired);
        }

        if amount <= 0.into() {
            return Err(MuseError::InvalidPrice);
        }

        let counter: u64 = env.storage().instance().get(&COUNTER).unwrap_or(0);
        let offer_id = counter + 1;

        let offer = Offer {
            listing_id,
            offeror,
            amount,
            expires_at: env.ledger().timestamp() + duration,
            active: true,
        };

        // Store offer
        let mut offers: Map<u64, Vec<Offer>> = env.storage().instance().get(&OFFERS).unwrap_or(Map::new(&env));
        let mut offer_list = offers.get(listing_id).unwrap_or(Vec::new(&env));
        offer_list.push_back(offer);
        offers.set(listing_id, offer_list);
        env.storage().instance().set(&OFFERS, &offers);

        // Update counter
        env.storage().instance().set(&COUNTER, &offer_id);

        Ok(offer_id)
    }

    // Accept an offer
    pub fn accept_offer(
        env: &Env,
        seller: Address,
        listing_id: u64,
        offer_index: u32,
    ) -> Result<(), MuseError> {
        let listings: Map<u64, Listing> = env.storage().instance().get(&LISTINGS).unwrap_or(Map::new(&env));
        let mut listing = listings.get(listing_id).ok_or(MuseError::ListingNotFound)?;

        if listing.seller != seller {
            return Err(MuseError::NotOwner);
        }

        let offers: Map<u64, Vec<Offer>> = env.storage().instance().get(&OFFERS).unwrap_or(Map::new(&env));
        let mut offer_list = offers.get(listing_id).ok_or(MuseError::OfferNotFound)?;
        
        if offer_index >= offer_list.len() as u32 {
            return Err(MuseError::OfferNotFound);
        }

        let offer = offer_list.get(offer_index as u32).unwrap();
        
        if !offer.active {
            return Err(MuseError::OfferNotFound);
        }

        if env.ledger().timestamp() > offer.expires_at {
            return Err(MuseError::OfferExpired);
        }

        let artworks: Map<u64, Artwork> = env.storage().instance().get(&ARTWORKS).unwrap_or(Map::new(&env));
        let artwork = artworks.get(listing.artwork_id).ok_or(MuseError::ArtworkNotFound)?;

        // Calculate fees and royalties
        let marketplace_fee = (offer.amount * MARKETPLACE_FEE_BPS.into()) / 10000.into();
        let royalty_fee = (offer.amount * artwork.royalty_bps.into()) / 10000.into();
        let seller_amount = offer.amount - marketplace_fee - royalty_fee;

        // Mark offer as inactive
        offer_list.set(offer_index, Offer {
            active: false,
            ..offer
        });
        offers.set(listing_id, offer_list);
        env.storage().instance().set(&OFFERS, &offers);

        // Mark listing as inactive
        listing.active = false;
        let mut listings = listings;
        listings.set(listing_id, listing);
        env.storage().instance().set(&LISTINGS, &listings);

        // Handle token transfers and ownership change would go here

        Ok(())
    }

    // Get artwork by ID
    pub fn get_artwork(env: &Env, artwork_id: u64) -> Result<Artwork, MuseError> {
        let artworks: Map<u64, Artwork> = env.storage().instance().get(&ARTWORKS).unwrap_or(Map::new(&env));
        artworks.get(artwork_id).ok_or(MuseError::ArtworkNotFound)
    }

    // Get user's artworks
    pub fn get_user_artworks(env: &Env, user: Address) -> Vec<u64> {
        let user_artworks: Map<Address, Vec<u64>> = env.storage().instance().get(&USER_ARTWORKS).unwrap_or(Map::new(&env));
        user_artworks.get(user).unwrap_or(Vec::new(&env))
    }

    // Get active listings
    pub fn get_active_listings(env: &Env) -> Vec<Listing> {
        let listings: Map<u64, Listing> = env.storage().instance().get(&LISTINGS).unwrap_or(Map::new(&env));
        let mut active_listings = Vec::new(&env);
        
        for (_, listing) in listings.iter() {
            if listing.active && env.ledger().timestamp() <= listing.expires_at {
                active_listings.push_back(listing);
            }
        }
        
        active_listings
    }

    // Get offers for a listing
    pub fn get_listing_offers(env: &Env, listing_id: u64) -> Vec<Offer> {
        let offers: Map<u64, Vec<Offer>> = env.storage().instance().get(&OFFERS).unwrap_or(Map::new(&env));
        let mut active_offers = Vec::new(&env);
        
        if let Some(offer_list) = offers.get(listing_id) {
            for offer in offer_list.iter() {
                if offer.active && env.ledger().timestamp() <= offer.expires_at {
                    active_offers.push_back(offer);
                }
            }
        }
        
        active_offers
    }
}
