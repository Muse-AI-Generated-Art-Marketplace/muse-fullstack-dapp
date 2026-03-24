import { Link } from 'react-router-dom'
import { TrendingUp, Sparkles, Eye, Heart, ArrowRight, Palette, Users, Image, Coins } from 'lucide-react'
import { useFeaturedArtworks, useTrendingArtworks, usePlatformStats, type Artwork } from '@/services/artworkService'
import { ApiTest } from '@/components/ApiTest'

// ─── Stat Card Skeleton ───────────────────────────────────────────────────────
function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="w-10 h-10 rounded-xl bg-white/10 animate-pulse" />
      <div className="mt-3 h-7 w-20 bg-white/10 rounded animate-pulse" />
      <div className="mt-1 h-4 w-16 bg-white/10 rounded animate-pulse" />
    </div>
  )
}

// ─── Artwork Card Skeleton ────────────────────────────────────────────────────
function FeaturedCardSkeleton() {
  return (
    <div className="featured-card overflow-hidden">
      <div className="aspect-[4/5] bg-secondary-100 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-5 bg-secondary-100 rounded animate-pulse" />
        <div className="h-4 bg-secondary-100 rounded animate-pulse w-3/4" />
        <div className="flex justify-between pt-2">
          <div className="h-4 bg-secondary-100 rounded animate-pulse w-16" />
          <div className="h-4 bg-secondary-100 rounded animate-pulse w-12" />
        </div>
      </div>
    </div>
  )
}

function TrendingRowSkeleton() {
  return (
    <div className="trending-row">
      <div className="w-8 h-5 bg-secondary-100 rounded animate-pulse" />
      <div className="w-12 h-12 rounded-xl bg-secondary-100 animate-pulse" />
      <div className="flex-1 space-y-1">
        <div className="h-4 bg-secondary-100 rounded animate-pulse w-32" />
        <div className="h-3 bg-secondary-100 rounded animate-pulse w-20" />
      </div>
      <div className="h-5 bg-secondary-100 rounded animate-pulse w-16" />
    </div>
  )
}

// ─── Featured Artwork Card ───────────────────────────────────────────────────
function FeaturedCard({ artwork }: { artwork: Artwork }) {
  return (
    <Link to={`/artwork/${artwork.id}`} className="featured-card group">
      <div className="aspect-[4/5] overflow-hidden relative">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Hover overlay badges */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0">
          <span className="inline-flex items-center gap-1 text-xs text-white/90 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
            <Heart className="w-3 h-3" /> {artwork.likes ?? 0}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-white/90 bg-black/30 backdrop-blur-sm rounded-full px-2 py-1">
            <Eye className="w-3 h-3" /> {artwork.views ?? 0}
          </span>
        </div>

        {/* Category pill */}
        <span className="absolute top-3 left-3 text-[10px] uppercase tracking-wider font-semibold text-white bg-primary-600/80 backdrop-blur-sm rounded-full px-2.5 py-0.5">
          {artwork.category}
        </span>
      </div>

      <div className="p-4 space-y-1">
        <h3 className="font-semibold text-secondary-900 text-sm truncate group-hover:text-primary-600 transition-colors">
          {artwork.title}
        </h3>
        <p className="text-xs text-secondary-500 truncate">{artwork.creator}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-bold text-secondary-900">
            {artwork.price} <span className="text-xs font-normal text-secondary-400">{artwork.currency}</span>
          </span>
          {artwork.aiModel && (
            <span className="text-[10px] text-secondary-400 bg-secondary-50 rounded px-1.5 py-0.5">
              {artwork.aiModel}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Trending Row ─────────────────────────────────────────────────────────────
function TrendingRow({ artwork, rank }: { artwork: Artwork; rank: number }) {
  return (
    <Link to={`/artwork/${artwork.id}`} className="trending-row group">
      <span className="trending-rank">
        {rank}
      </span>
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-secondary-200 group-hover:ring-primary-300 transition-all">
        <img
          src={artwork.imageUrl}
          alt={artwork.title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-900 truncate group-hover:text-primary-600 transition-colors">
          {artwork.title}
        </p>
        <p className="text-xs text-secondary-400">{artwork.creator}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-secondary-900">{artwork.price} <span className="text-xs font-normal text-secondary-400">{artwork.currency}</span></p>
        <p className="text-[10px] text-secondary-400 flex items-center gap-0.5 justify-end">
          <Eye className="w-3 h-3" /> {(artwork.views ?? 0).toLocaleString()}
        </p>
      </div>
    </Link>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const STAT_ICONS = [
  { icon: Image, label: 'Artworks' },
  { icon: Palette, label: 'Artists' },
  { icon: Users, label: 'Collectors' },
  { icon: Coins, label: 'Volume' },
]

function StatCard({ value, label, icon: Icon }: { value: string | number; label: string; icon: typeof Image }) {
  return (
    <div className="stat-card group">
      <div className="stat-icon-wrap">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-white/60 mt-0.5">{label}</p>
    </div>
  )
}

// ─── Main HomePage ────────────────────────────────────────────────────────────
export function HomePage() {
  const { data: featured, isLoading: featuredLoading, error: featuredError } = useFeaturedArtworks()
  const { data: trending, isLoading: trendingLoading, error: trendingError } = useTrendingArtworks()
  const { data: stats, isLoading: statsLoading, error: statsError } = usePlatformStats()

  // Debug logging
  console.log('HomePage Debug:', {
    featured: { data: featured, loading: featuredLoading, error: featuredError },
    trending: { data: trending, loading: trendingLoading, error: trendingError },
    stats: { data: stats, loading: statsLoading, error: statsError }
  })

  // Show error state if any API calls fail
  if (featuredError || trendingError || statsError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-secondary-900 mb-4">Unable to load data</h2>
          <p className="text-secondary-600 mb-4">
            {featuredError?.message || trendingError?.message || statsError?.message || 'Unknown error occurred'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ─────────────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="relative z-10 max-w-5xl mx-auto text-center px-4 py-20 sm:py-28">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-primary-300 bg-primary-500/10 border border-primary-500/20 rounded-full px-3 py-1 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Art Marketplace
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Discover, Collect &<br />
            <span className="hero-gradient-text">Create AI Art</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-secondary-300 max-w-2xl mx-auto leading-relaxed">
            Explore one-of-a-kind AI-generated artworks minted on the Stellar blockchain.
            Every piece is unique, verifiable, and truly yours.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link to="/explore" className="btn-hero-primary">
              Explore Collection <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/mint" className="btn-hero-outline">
              Create Artwork
            </Link>
          </div>
        </div>
      </section>

      {/* ── Platform Stats ───────────────────────────────────────────── */}
      <section className="stats-bar">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statsLoading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : stats && [
              { value: stats.totalArtworks, label: 'Artworks' },
              { value: stats.totalArtists, label: 'Artists' },
              { value: stats.totalCollectors, label: 'Collectors' },
              { value: `${stats.totalVolume} ${stats.volumeCurrency}`, label: 'Volume Traded' },
            ].map((s, i) => (
              <StatCard key={i} value={s.value} label={s.label} icon={STAT_ICONS[i].icon} />
            ))
          }
        </div>
      </section>

      {/* ── Featured Artworks ────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              Featured Artworks
            </h2>
            <p className="text-sm text-secondary-500 mt-1">Hand-picked by our curators</p>
          </div>
          <Link to="/explore" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {featuredLoading
            ? Array.from({ length: 6 }).map((_, i) => <FeaturedCardSkeleton key={i} />)
            : featured?.map((artwork) => (
              <FeaturedCard key={artwork.id} artwork={artwork} />
            ))
          }
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link to="/explore" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600">
            View all artworks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Trending Section ─────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-secondary-50/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-secondary-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Trending Now
              </h2>
              <p className="text-sm text-secondary-500 mt-1">Most viewed artworks this week</p>
            </div>
            <Link to="/explore?sort=trending" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
              See more <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {trendingLoading
              ? Array.from({ length: 8 }).map((_, i) => <TrendingRowSkeleton key={i} />)
              : trending?.map((artwork, i) => (
                <TrendingRow key={artwork.id} artwork={artwork} rank={i + 1} />
              ))
            }
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link to="/explore?sort=trending" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600">
              See more trending <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── API Test Section (Temporary) ──────────────────────────────── */}
      <ApiTest />

      {/* ── CTA Section ──────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="cta-glow" />
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4 py-16 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Ready to create your masterpiece?
          </h2>
          <p className="mt-3 text-secondary-300 max-w-lg mx-auto">
            Use AI to generate stunning artwork, mint it on the blockchain, and join a growing community of digital artists.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/mint" className="btn-hero-primary">
              Start Creating <Sparkles className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/explore" className="btn-hero-outline">
              Browse Gallery
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
