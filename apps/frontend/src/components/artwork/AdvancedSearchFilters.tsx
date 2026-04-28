import React, { useState } from "react";

export interface SearchFilters {
  search: string;
  minPrice: string;
  maxPrice: string;
  artist: string;
  style: string;
  dateFrom: string;
  dateTo: string;
  category: string;
  isListed: boolean | undefined;
  sortBy: string;
}

interface AdvancedSearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onReset: () => void;
  categories?: string[];
}

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onReset,
  categories = [],
}: AdvancedSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof SearchFilters, value: string | boolean | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => 
      key !== 'isListed' && 
      value !== '' && 
      value !== undefined && 
      value !== null
  );

  return (
    <div className="bg-white rounded-xl border border-secondary-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-secondary-100">
        <div className="flex items-center space-x-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-5 h-5 text-secondary-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6h7.5a3 3 0 013 3v7.5a3 3 0 01-3 3h-7.5a3 3 0 01-3-3V9a3 3 0 013-3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 10.5h.01M6 13.5h.01"
            />
          </svg>
          <h3 className="font-semibold text-secondary-900">Advanced Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
              Active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-sm text-secondary-500 hover:text-secondary-700 transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-secondary-100 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className={`w-5 h-5 text-secondary-600 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Search
            </label>
            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search artworks, descriptions, prompts..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Artist */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Artist
            </label>
            <input
              type="text"
              placeholder="Artist wallet address or name"
              value={filters.artist}
              onChange={(e) => handleFilterChange('artist', e.target.value)}
              className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Style/Category */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Style
            </label>
            <select
              value={filters.style}
              onChange={(e) => handleFilterChange('style', e.target.value)}
              className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="">All Styles</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Creation Date Range */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Creation Date
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-secondary-500 mb-1">From</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-secondary-500 mb-1">To</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Listed Status */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Status
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="listedStatus"
                  checked={filters.isListed === undefined}
                  onChange={() => handleFilterChange('isListed', undefined)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">All</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="listedStatus"
                  checked={filters.isListed === true}
                  onChange={() => handleFilterChange('isListed', true)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Listed</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="listedStatus"
                  checked={filters.isListed === false}
                  onChange={() => handleFilterChange('isListed', false)}
                  className="mr-2 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-secondary-700">Not Listed</span>
              </label>
            </div>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full px-3 py-2 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="title">Title: A to Z</option>
              <option value="-title">Title: Z to A</option>
              <option value="-createdAt">Recently Updated</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
