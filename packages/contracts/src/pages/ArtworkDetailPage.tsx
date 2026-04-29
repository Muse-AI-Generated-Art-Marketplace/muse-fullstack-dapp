import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Bid {
  id: string;
  bidder: string;
  amount: number;
  timestamp: string;
}

interface Artwork {
  id: string;
  title: string;
  artist: string;
  artistAddress: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  isForSale: boolean;
  isAuction: boolean;
  auctionEndTime?: string;
  highestBid?: number;
  bids: Bid[];
  tags: string[];
  createdAt: string;
  edition: string;
  royalty: number;
  views: number;
  likes: number;
}

// ─── Mock Data (replace with real API/contract calls) ─────────────────────────

const MOCK_ARTWORK: Artwork = {
  id: "1",
  title: "Neon Genesis #004",
  artist: "0xArtist.eth",
  artistAddress: "0xAbCd1234...5678EfGh",
  description:
    "A generative exploration of cyberpunk dreamscapes rendered through adversarial neural networks. Each brushstroke is a probability distribution collapsed into color, birthed from 10,000 hours of latent space traversal. No two prints will ever exist.",
  imageUrl: "https://picsum.photos/seed/neon/800/900",
  price: 2.4,
  currency: "ETH",
  isForSale: true,
  isAuction: true,
  auctionEndTime: new Date(Date.now() + 3 * 60 * 60 * 1000 + 24 * 60 * 1000).toISOString(),
  highestBid: 2.1,
  bids: [
    { id: "b1", bidder: "0xCollector.eth", amount: 2.1, timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: "b2", bidder: "0xWhale.eth", amount: 1.85, timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
    { id: "b3", bidder: "0xArtLover.eth", amount: 1.5, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  ],
  tags: ["Generative", "Cyberpunk", "AI", "1/1"],
  createdAt: "2024-03-15T10:00:00Z",
  edition: "1 of 1",
  royalty: 10,
  views: 1284,
  likes: 347,
};

// ─── Countdown Hook ───────────────────────────────────────────────────────────

function useCountdown(targetISO?: string) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (!targetISO) return;
    const tick = () => {
      const diff = Math.max(0, new Date(targetISO).getTime() - Date.now());
      setTimeLeft({
        h: Math.floor(diff / 3_600_000),
        m: Math.floor((diff % 3_600_000) / 60_000),
        s: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [targetISO]);

  return timeLeft;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ArtworkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState<"bids" | "details">("bids");
  const countdown = useCountdown(artwork?.auctionEndTime);

  // Simulate fetching artwork by ID
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      // In production: fetch from API or call smart contract
      setArtwork({ ...MOCK_ARTWORK, id: id || "1" });
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [id]);

  const handleBid = () => {
    setBidError("");
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      setBidError("Please enter a valid bid amount.");
      return;
    }
    if (artwork && amount <= (artwork.highestBid ?? 0)) {
      setBidError(`Bid must exceed current highest bid of ${artwork.highestBid} ETH.`);
      return;
    }
    // In production: call smart contract placeBid()
    setBidSuccess(true);
    setTimeout(() => setBidSuccess(false), 3000);
    setBidAmount("");
  };

  const handleBuyNow = async () => {
    setPurchasing(true);
    // In production: call smart contract purchaseArtwork()
    await new Promise((r) => setTimeout(r, 1500));
    setPurchasing(false);
    alert(`Successfully purchased "${artwork?.title}"! Check your wallet.`);
  };

  const formatAddress = (addr: string) =>
    addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const pad = (n: number) => String(n).padStart(2, "0");

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.loadingPulse} />
        <p style={styles.loadingText}>Loading artwork…</p>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div style={styles.notFound}>
        <h2 style={styles.notFoundTitle}>Artwork not found</h2>
        <button style={styles.backBtn} onClick={() => navigate(-1)}>← Go Back</button>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* ── Back navigation ─────────────────────── */}
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        ← Back to Gallery
      </button>

      <div style={styles.grid}>
        {/* ── LEFT: Image ──────────────────────── */}
        <div style={styles.imageCol}>
          <div style={styles.imageFrame}>
            <img
              src={artwork.imageUrl}
              alt={artwork.title}
              style={styles.image}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://placehold.co/800x900/0d0d0d/ff6b35?text=Artwork";
              }}
            />
            <div style={styles.imageBadge}>{artwork.edition}</div>
          </div>

          {/* Stats row */}
          <div style={styles.statsRow}>
            <button
              style={{ ...styles.statBtn, color: liked ? "#ff6b35" : "#999" }}
              onClick={() => setLiked(!liked)}
            >
              {liked ? "♥" : "♡"} {artwork.likes + (liked ? 1 : 0)} likes
            </button>
            <span style={styles.statItem}>👁 {artwork.views.toLocaleString()} views</span>
            <span style={styles.statItem}>📅 {new Date(artwork.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* ── RIGHT: Details ───────────────────── */}
        <div style={styles.detailCol}>
          {/* Tags */}
          <div style={styles.tagsRow}>
            {artwork.tags.map((tag) => (
              <span key={tag} style={styles.tag}>{tag}</span>
            ))}
          </div>

          {/* Title */}
          <h1 style={styles.title}>{artwork.title}</h1>

          {/* Artist */}
          <div style={styles.artistRow}>
            <div style={styles.artistAvatar}>
              {artwork.artist.slice(2, 4).toUpperCase()}
            </div>
            <div>
              <p style={styles.artistLabel}>Created by</p>
              <p style={styles.artistName}>{artwork.artist}</p>
              <p style={styles.artistAddress}>{formatAddress(artwork.artistAddress)}</p>
            </div>
          </div>

          {/* Description */}
          <p style={styles.description}>{artwork.description}</p>

          {/* ── Auction / Price Block ── */}
          {artwork.isAuction ? (
            <div style={styles.auctionBlock}>
              <div style={styles.auctionHeader}>
                <div>
                  <p style={styles.priceLabel}>Current Bid</p>
                  <p style={styles.price}>{artwork.highestBid} <span style={styles.currency}>{artwork.currency}</span></p>
                </div>
                <div style={styles.countdownBox}>
                  <p style={styles.countdownLabel}>Ends in</p>
                  <p style={styles.countdown}>
                    {pad(countdown.h)}:{pad(countdown.m)}:{pad(countdown.s)}
                  </p>
                </div>
              </div>

              {/* Bid input */}
              <div style={styles.bidRow}>
                <div style={styles.bidInputWrapper}>
                  <span style={styles.bidCurrencyLabel}>ETH</span>
                  <input
                    type="number"
                    placeholder={`Min ${(artwork.highestBid ?? 0) + 0.01}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    style={styles.bidInput}
                  />
                </div>
                <button style={styles.primaryBtn} onClick={handleBid}>
                  Place Bid
                </button>
              </div>
              {bidError && <p style={styles.errorText}>{bidError}</p>}
              {bidSuccess && <p style={styles.successText}>✓ Bid placed successfully!</p>}
            </div>
          ) : null}

          {/* Buy Now */}
          {artwork.isForSale && (
            <div style={styles.buyBlock}>
              <div style={styles.buyPriceRow}>
                <div>
                  <p style={styles.priceLabel}>Buy Now Price</p>
                  <p style={styles.price}>{artwork.price} <span style={styles.currency}>{artwork.currency}</span></p>
                </div>
                <p style={styles.royaltyNote}>+{artwork.royalty}% creator royalty</p>
              </div>
              <button
                style={{ ...styles.primaryBtn, ...styles.buyBtn, opacity: purchasing ? 0.7 : 1 }}
                onClick={handleBuyNow}
                disabled={purchasing}
              >
                {purchasing ? "Processing…" : "Buy Now"}
              </button>
            </div>
          )}

          {/* ── Tabs: Bids / Details ── */}
          <div style={styles.tabs}>
            <button
              style={{ ...styles.tabBtn, ...(activeTab === "bids" ? styles.tabActive : {}) }}
              onClick={() => setActiveTab("bids")}
            >
              Bid History ({artwork.bids.length})
            </button>
            <button
              style={{ ...styles.tabBtn, ...(activeTab === "details" ? styles.tabActive : {}) }}
              onClick={() => setActiveTab("details")}
            >
              Details
            </button>
          </div>

          {activeTab === "bids" ? (
            <div style={styles.bidList}>
              {artwork.bids.length === 0 ? (
                <p style={styles.emptyBids}>No bids yet. Be the first!</p>
              ) : (
                artwork.bids.map((bid, i) => (
                  <div key={bid.id} style={{ ...styles.bidItem, borderLeftColor: i === 0 ? "#ff6b35" : "#333" }}>
                    <div>
                      <p style={styles.bidBidder}>{bid.bidder}</p>
                      <p style={styles.bidTime}>{formatTime(bid.timestamp)}</p>
                    </div>
                    <p style={{ ...styles.bidAmount, color: i === 0 ? "#ff6b35" : "#ccc" }}>
                      {bid.amount} ETH
                    </p>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={styles.detailsList}>
              {[
                ["Contract Address", formatAddress(artwork.artistAddress)],
                ["Token Standard", "ERC-721"],
                ["Blockchain", "Ethereum"],
                ["Edition", artwork.edition],
                ["Creator Royalty", `${artwork.royalty}%`],
                ["Minted", new Date(artwork.createdAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <div key={label} style={styles.detailRow}>
                  <span style={styles.detailLabel}>{label}</span>
                  <span style={styles.detailValue}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#080808",
    color: "#e8e8e8",
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    padding: "24px clamp(16px, 5vw, 64px) 64px",
    boxSizing: "border-box",
  },
  loadingWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    backgroundColor: "#080808",
    gap: 16,
  },
  loadingPulse: {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "3px solid #ff6b35",
    borderTopColor: "transparent",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#666", fontSize: 14 },
  notFound: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", minHeight: "100vh", backgroundColor: "#080808", gap: 16,
  },
  notFoundTitle: { color: "#e8e8e8", fontSize: 24 },
  backBtn: {
    background: "none",
    border: "1px solid #2a2a2a",
    color: "#999",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    marginBottom: 32,
    transition: "color 0.2s",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: "clamp(24px, 4vw, 64px)",
    alignItems: "start",
    maxWidth: 1280,
    margin: "0 auto",
  },
  imageCol: { display: "flex", flexDirection: "column", gap: 16 },
  imageFrame: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
    border: "1px solid #1e1e1e",
    boxShadow: "0 0 80px rgba(255,107,53,0.08)",
  },
  image: { width: "100%", display: "block", objectFit: "cover" },
  imageBadge: {
    position: "absolute",
    top: 16, right: 16,
    background: "rgba(255,107,53,0.15)",
    border: "1px solid rgba(255,107,53,0.4)",
    color: "#ff6b35",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    backdropFilter: "blur(8px)",
  },
  statsRow: { display: "flex", gap: 20, alignItems: "center" },
  statBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 13, padding: 0, transition: "color 0.2s",
  },
  statItem: { color: "#666", fontSize: 13 },
  detailCol: { display: "flex", flexDirection: "column", gap: 20 },
  tagsRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  tag: {
    background: "#141414",
    border: "1px solid #2a2a2a",
    color: "#888",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    letterSpacing: "0.04em",
  },
  title: {
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: 700,
    color: "#f0f0f0",
    margin: 0,
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
  },
  artistRow: { display: "flex", gap: 14, alignItems: "center" },
  artistAvatar: {
    width: 44, height: 44, borderRadius: "50%",
    background: "linear-gradient(135deg, #ff6b35, #ff3366)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
  },
  artistLabel: { color: "#555", fontSize: 11, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" },
  artistName: { color: "#e8e8e8", fontSize: 15, fontWeight: 600, margin: "2px 0 0" },
  artistAddress: { color: "#555", fontSize: 12, margin: "2px 0 0", fontFamily: "monospace" },
  description: {
    color: "#888",
    fontSize: 15,
    lineHeight: 1.7,
    margin: 0,
    borderLeft: "2px solid #1e1e1e",
    paddingLeft: 16,
  },
  auctionBlock: {
    background: "#0e0e0e",
    border: "1px solid #1e1e1e",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  auctionHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  priceLabel: { color: "#555", fontSize: 11, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" },
  price: { fontSize: 32, fontWeight: 800, margin: "4px 0 0", color: "#f0f0f0", letterSpacing: "-0.02em" },
  currency: { fontSize: 18, color: "#888", fontWeight: 400 },
  countdownBox: { textAlign: "right" },
  countdownLabel: { color: "#555", fontSize: 11, margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" },
  countdown: {
    fontFamily: "monospace",
    fontSize: 28,
    fontWeight: 700,
    color: "#ff6b35",
    margin: "4px 0 0",
    letterSpacing: "0.05em",
  },
  bidRow: { display: "flex", gap: 10 },
  bidInputWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    background: "#141414",
    border: "1px solid #2a2a2a",
    borderRadius: 8,
    padding: "0 12px",
    gap: 8,
  },
  bidCurrencyLabel: { color: "#555", fontSize: 13, fontWeight: 600 },
  bidInput: {
    flex: 1,
    background: "none",
    border: "none",
    outline: "none",
    color: "#e8e8e8",
    fontSize: 16,
    padding: "12px 0",
    fontFamily: "inherit",
  },
  primaryBtn: {
    background: "#ff6b35",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "opacity 0.2s, transform 0.1s",
  },
  errorText: { color: "#ff4444", fontSize: 13, margin: 0 },
  successText: { color: "#44dd88", fontSize: 13, margin: 0 },
  buyBlock: {
    background: "#0e0e0e",
    border: "1px solid #1e1e1e",
    borderRadius: 12,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  buyPriceRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  royaltyNote: { color: "#555", fontSize: 12 },
  buyBtn: { width: "100%", padding: "14px", fontSize: 16 },
  tabs: { display: "flex", gap: 0, borderBottom: "1px solid #1e1e1e" },
  tabBtn: {
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    color: "#555",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: -1,
    transition: "color 0.2s, border-color 0.2s",
    fontFamily: "inherit",
  },
  tabActive: { color: "#ff6b35", borderBottomColor: "#ff6b35" },
  bidList: { display: "flex", flexDirection: "column", gap: 8 },
  emptyBids: { color: "#555", fontSize: 14, textAlign: "center", padding: "24px 0" },
  bidItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 14px",
    background: "#0e0e0e",
    borderRadius: 8,
    borderLeft: "3px solid #333",
  },
  bidBidder: { color: "#ccc", fontSize: 14, margin: 0, fontWeight: 600 },
  bidTime: { color: "#555", fontSize: 12, margin: "2px 0 0" },
  bidAmount: { fontSize: 16, fontWeight: 700, margin: 0 },
  detailsList: { display: "flex", flexDirection: "column", gap: 0 },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #141414",
  },
  detailLabel: { color: "#555", fontSize: 14 },
  detailValue: { color: "#ccc", fontSize: 14, fontWeight: 500, fontFamily: "monospace" },
};

export default ArtworkDetailPage;