import React, { useState } from "react";
import { ArtworkSearch } from "./ArtworkSearch";
import { AdvancedSearchFilters, SearchFilters } from "./AdvancedSearchFilters";

interface AdvancedArtworkSearchProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
  categories?: string[];
}

export function AdvancedArtworkSearch({
  onSearch,
  loading = false,
  categories = [],
}: AdvancedArtworkSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    search: "",
    minPrice: "",
    maxPrice: "",
    artist: "",
    style: "",
    dateFrom: "",
    dateTo: "",
    category: "",
    isListed: undefined,
    sortBy: "-createdAt",
  });

  const handleBasicSearch = (query: string) => {
    const newFilters = { ...filters, search: query };
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    onSearch(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: "",
      minPrice: "",
      maxPrice: "",
      artist: "",
      style: "",
      dateFrom: "",
      dateTo: "",
      category: "",
      isListed: undefined,
      sortBy: "-createdAt",
    };
    setFilters(resetFilters);
    onSearch(resetFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([key, value]) => 
      key !== 'isListed' && 
      value !== '' && 
      value !== undefined && 
      value !== null
  );

  return (
    <div className="space-y-4">
      {/* Basic Search Bar */}
      <ArtworkSearch onSearch={handleBasicSearch} />
      
      {/* Advanced Filters */}
      <AdvancedSearchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onReset={handleReset}
        categories={categories}
      />

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-secondary-600">Active filters:</span>
          {filters.search && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Search: "{filters.search}"
            </span>
          )}
          {filters.minPrice && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Min: {filters.minPrice}
            </span>
          )}
          {filters.maxPrice && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Max: {filters.maxPrice}
            </span>
          )}
          {filters.artist && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Artist: {filters.artist.slice(0, 8)}...
            </span>
          )}
          {filters.style && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              Style: {filters.style}
            </span>
          )}
          {filters.dateFrom && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              From: {new Date(filters.dateFrom).toLocaleDateString()}
            </span>
          )}
          {filters.dateTo && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              To: {new Date(filters.dateTo).toLocaleDateString()}
            </span>
          )}
          {filters.isListed !== undefined && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
              {filters.isListed ? "Listed" : "Not Listed"}
            </span>
          )}
          <button
            onClick={handleReset}
            className="text-xs text-secondary-500 hover:text-secondary-700 transition-colors underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-sm text-secondary-600">Searching...</span>
        </div>
      )}
    </div>
  );
}
