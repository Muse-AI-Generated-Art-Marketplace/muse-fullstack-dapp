import { useState, useRef, useEffect } from "react";
import { X, SlidersHorizontal, ChevronDown, Check } from "lucide-react";
import type { ArtworksFilters } from "@/services/artworkService";

// ── Data ─────────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  { label: "All", value: undefined },
  { label: "Abstract", value: "abstract" },
  { label: "Sci-Fi", value: "sci-fi" },
  { label: "Character", value: "character" },
  { label: "Landscape", value: "landscape" },
  { label: "Architecture", value: "architecture" },
  { label: "Nature", value: "nature" },
  { label: "Surreal", value: "surreal" },
  { label: "Portrait", value: "portrait" },
];

const PRICE_RANGES = [
  { label: "Any price", value: undefined },
  { label: "Under 1 XLM", value: "0-1" },
  { label: "1 – 2 XLM", value: "1-2" },
  { label: "2 – 5 XLM", value: "2-5" },
  { label: "5 XLM +", value: "5" },
];

const SORT_OPTIONS = [
  { label: "Most Recent", value: "recent" },
  { label: "Most Popular", value: "popular" },
  { label: "Trending", value: "trending" },
  { label: "Price: Low → High", value: "price-low" },
  { label: "Price: High → Low", value: "price-high" },
];

const AI_MODELS = ["Midjourney v6", "Stable Diffusion XL", "DALL·E 3"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function countActiveFilters(filters: ArtworksFilters): number {
  let n = 0;
  if (filters.category) n++;
  if (filters.priceRange) n++;
  if (filters.sortBy && filters.sortBy !== "recent") n++;
  return n;
}

// ── Dropdown primitive ────────────────────────────────────────────────────────

interface DropdownProps {
  label: string;
  active?: boolean;
  children: React.ReactNode;
}

function Dropdown({ label, active, children }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap
          ${
            active
              ? "bg-primary-600 border-primary-600 text-white"
              : "border-secondary-700 text-secondary-300 hover:border-secondary-500 hover:text-white bg-secondary-900"
          }`}
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 min-w-[180px] rounded-xl border border-secondary-700 bg-secondary-900 shadow-xl shadow-black/40 py-1 overflow-hidden">
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function DropdownItem({ selected, onClick, children }: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-4 px-4 py-2.5 text-sm transition-colors text-left
        ${
          selected
            ? "bg-secondary-800 text-white font-medium"
            : "text-secondary-300 hover:bg-secondary-800 hover:text-white"
        }`}
    >
      <span>{children}</span>
      {selected && (
        <Check className="h-3.5 w-3.5 text-primary-400 flex-shrink-0" />
      )}
    </button>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────────────────

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: ArtworksFilters;
  onChange: (filters: ArtworksFilters) => void;
  onClear: () => void;
}

function MobileDrawer({
  open,
  onClose,
  filters,
  onChange,
  onClear,
}: MobileDrawerProps) {
  const activeCount = countActiveFilters(filters);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary-950 border-t border-secondary-800 rounded-t-2xl max-h-[85dvh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-secondary-700" />
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-b border-secondary-800">
          <h3 className="text-base font-bold text-white">Filters</h3>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-primary-400 font-medium hover:text-primary-300"
              >
                Clear all ({activeCount})
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-secondary-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-6">
          {/* Category */}
          <div>
            <p className="text-xs uppercase tracking-widest text-secondary-500 font-medium mb-3">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(({ label, value }) => {
                const active = value
                  ? filters.category === value
                  : !filters.category;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onChange({ ...filters, category: value })}
                    className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors
                      ${
                        active
                          ? "bg-primary-600 border-primary-600 text-white font-medium"
                          : "border-secondary-700 text-secondary-300 hover:border-secondary-500"
                      }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price range */}
          <div>
            <p className="text-xs uppercase tracking-widest text-secondary-500 font-medium mb-3">
              Price Range
            </p>
            <div className="space-y-1">
              {PRICE_RANGES.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange({ ...filters, priceRange: value })}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm border transition-colors
                    ${
                      filters.priceRange === value ||
                      (!filters.priceRange && !value)
                        ? "bg-secondary-800 border-secondary-600 text-white font-medium"
                        : "border-transparent text-secondary-400 hover:bg-secondary-900 hover:text-white"
                    }`}
                >
                  {label}
                  {(filters.priceRange === value ||
                    (!filters.priceRange && !value)) && (
                    <Check className="h-4 w-4 text-primary-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <p className="text-xs uppercase tracking-widest text-secondary-500 font-medium mb-3">
              Sort By
            </p>
            <div className="space-y-1">
              {SORT_OPTIONS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ ...filters, sortBy: value })}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm border transition-colors
                    ${
                      (filters.sortBy ?? "recent") === value
                        ? "bg-secondary-800 border-secondary-600 text-white font-medium"
                        : "border-transparent text-secondary-400 hover:bg-secondary-900 hover:text-white"
                    }`}
                >
                  {label}
                  {(filters.sortBy ?? "recent") === value && (
                    <Check className="h-4 w-4 text-primary-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* AI Model */}
          <div>
            <p className="text-xs uppercase tracking-widest text-secondary-500 font-medium mb-3">
              AI Model
            </p>
            <div className="flex flex-wrap gap-2">
              {AI_MODELS.map((model) => (
                <button
                  key={model}
                  type="button"
                  className="px-3.5 py-1.5 rounded-full text-sm border border-secondary-700 text-secondary-400 hover:border-secondary-500 hover:text-white transition-colors"
                >
                  {model}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply button */}
        <div className="px-5 pb-8 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full py-3 text-sm font-semibold"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface FilterPanelProps {
  filters: ArtworksFilters;
  onChange: (filters: ArtworksFilters) => void;
  onClear: () => void;
}

export function FilterPanel({ filters, onChange, onClear }: FilterPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <>
      {/* ── Desktop: inline pill dropdowns ──────────────────────────────── */}
      <div className="hidden sm:flex items-center gap-2 flex-wrap">
        {/* Category */}
        <Dropdown
          label={
            filters.category
              ? (CATEGORIES.find((c) => c.value === filters.category)?.label ??
                "Category")
              : "Category"
          }
          active={Boolean(filters.category)}
        >
          {CATEGORIES.map(({ label, value }) => (
            <DropdownItem
              key={label}
              selected={value ? filters.category === value : !filters.category}
              onClick={() => onChange({ ...filters, category: value })}
            >
              {label}
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Price */}
        <Dropdown
          label={
            filters.priceRange
              ? (PRICE_RANGES.find((p) => p.value === filters.priceRange)
                  ?.label ?? "Price")
              : "Price"
          }
          active={Boolean(filters.priceRange)}
        >
          {PRICE_RANGES.map(({ label, value }) => (
            <DropdownItem
              key={label}
              selected={
                value ? filters.priceRange === value : !filters.priceRange
              }
              onClick={() => onChange({ ...filters, priceRange: value })}
            >
              {label}
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Sort */}
        <Dropdown
          label={
            SORT_OPTIONS.find((s) => s.value === (filters.sortBy ?? "recent"))
              ?.label ?? "Sort"
          }
          active={Boolean(filters.sortBy && filters.sortBy !== "recent")}
        >
          {SORT_OPTIONS.map(({ label, value }) => (
            <DropdownItem
              key={value}
              selected={(filters.sortBy ?? "recent") === value}
              onClick={() => onChange({ ...filters, sortBy: value })}
            >
              {label}
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Clear all badge */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-secondary-400 hover:text-white border border-secondary-700 hover:border-secondary-500 transition-colors"
          >
            <X className="h-3 w-3" />
            Clear ({activeCount})
          </button>
        )}
      </div>

      {/* ── Mobile: filter button that opens drawer ──────────────────────── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="sm:hidden flex items-center gap-2 btn-outline px-4 py-2 text-sm relative"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4.5 w-4.5 min-w-[18px] rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center px-1">
            {activeCount}
          </span>
        )}
      </button>

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        filters={filters}
        onChange={onChange}
        onClear={onClear}
      />
    </>
  );
}
