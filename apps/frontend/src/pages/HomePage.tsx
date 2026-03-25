import React, { useState } from "react";
import { ArtworkCard, Artwork } from "../components/artwork/ArtworkCard";

// 1. Mock Data for Testing Issue #26
const MOCK_ARTWORKS: Artwork[] = [
  {
    id: "1",
    title: "Cybernetic Dreams",
    creator: "Frank",
    description: "A neon future.",
    imageUrl: "https://via.placeholder.com/400",
    price: "0.8",
    currency: "ETH",
  },
  {
    id: "2",
    title: "Eternal Sands",
    creator: "Uche",
    description: "Desert landscape.",
    imageUrl: "https://via.placeholder.com/400",
    price: "1.5",
    currency: "ETH",
  },
  {
    id: "3",
    title: "Abstract Void",
    creator: "Dev",
    description: "Deep space art.",
    imageUrl: "https://via.placeholder.com/400",
    price: "2.0",
    currency: "ETH",
  },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  //  The Search Filtering Logic
  const filteredArtworks = MOCK_ARTWORKS.filter(
    (art) =>
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.creator?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Marketplace</h1>

      {/*  The Search Bar with HeroIcon */}
      <div className="relative max-w-md w-full mb-10 group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400 group-focus-within:text-primary-500 transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search by title or artist..."
          className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-secondary-200 bg-white shadow-sm focus:ring-2 focus:ring-primary-500 transition-all outline-none"
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 4. The Grid with Issue #23 Transitions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredArtworks.map((art) => (
          <ArtworkCard key={art.id} artwork={art} showCreator={true} />
        ))}
      </div>

      {filteredArtworks.length === 0 && (
        <p className="mt-10 text-center text-secondary-500">
          No results found for "{searchQuery}"
        </p>
      )}
    </div>
  );
}