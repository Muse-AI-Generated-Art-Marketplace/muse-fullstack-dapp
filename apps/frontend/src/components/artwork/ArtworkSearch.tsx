import React from "react";

export function ArtworkSearch({
  onSearch,
}: {
  onSearch: (query: string) => void;
}) {
  return (
    <div className="relative max-w-md w-full mb-8 group">
      {/* THE SEARCH ICON */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400 group-focus-within:text-primary-500 transition-colors">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </div>

      {/* THE INPUT BAR */}
      <input
        type="text"
        placeholder="Search artworks..."
        className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-secondary-200 bg-white shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none text-secondary-900 placeholder:text-secondary-400"
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  );
}
