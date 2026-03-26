import React, { useState } from "react";
import { ArtworkCard } from "../components/artwork/ArtworkCard";

const MOCK_DATA = [
  {
    id: "1",
    title: "Cybernetic Dreams",
    description: "A futuristic exploration of digital consciousness",
    creator: "Frank",
    imageUrl: "https://via.placeholder.com/300",
    price: "0.5",
    currency: "ETH",
  },
  {
    id: "2",
    title: "Neon Samurai",
    description: "A cyberpunk warrior in neon-lit streets",
    creator: "Uche",
    imageUrl: "https://via.placeholder.com/300",
    price: "1.2",
    currency: "ETH",
  },
];

export default function SearchTest() {
  const [query, setQuery] = useState("");

  const filtered = MOCK_DATA.filter(
    (art) =>
      art.title.toLowerCase().includes(query.toLowerCase()) ||
      art.creator?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="p-10 max-w-6xl mx-auto bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Issue #26 Verification Page</h1>
      <div className="relative mb-8 max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
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
        </span>
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 p-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((art) => (
          <ArtworkCard key={art.id} artwork={art} />
        ))}
      </div>
    </div>
  );
}
