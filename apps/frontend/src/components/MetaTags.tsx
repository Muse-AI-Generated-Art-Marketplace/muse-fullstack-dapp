import { Helmet } from 'react-helmet-async'

const SITE_NAME = 'Muse — AI Art Marketplace'
const DEFAULT_IMAGE = '/og-image.png'
const BASE_URL = import.meta.env.VITE_APP_URL || 'https://muse.art'

export interface StructuredData {
  '@context': string
  '@type': string
  [key: string]: unknown
}

interface MetaTagsProps {
  /** Page title — will be rendered as "Title | Muse — AI Art Marketplace" */
  title?: string
  description?: string
  image?: string
  /** Canonical URL for this page (full URL preferred) */
  canonicalUrl?: string
  /** Open Graph type, e.g. "website" | "article" */
  type?: string
  siteName?: string
  twitterCard?: 'summary' | 'summary_large_image'
  twitterSite?: string
  /** JSON-LD structured data object */
  structuredData?: StructuredData | StructuredData[]
  /** Set true to tell search engines not to index this page */
  noIndex?: boolean
  // Legacy prop kept for backwards compatibility with ArtworkPage
  url?: string
  additionalTags?: Record<string, string>
}

export const MetaTags = ({
  title,
  description,
  image,
  canonicalUrl,
  url, // legacy alias
  type = 'website',
  siteName = SITE_NAME,
  twitterCard = 'summary_large_image',
  twitterSite = '@museartmarket',
  structuredData,
  noIndex = false,
  additionalTags = {},
}: MetaTagsProps) => {
  const resolvedTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const resolvedImage = image || DEFAULT_IMAGE
  const resolvedCanonical = canonicalUrl || url

  return (
    <Helmet>
      {/* Basic */}
      <title>{resolvedTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

      {/* Open Graph */}
      <meta property="og:title" content={resolvedTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={resolvedImage} />
      {resolvedCanonical && <meta property="og:url" content={resolvedCanonical} />}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:title" content={resolvedTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={resolvedImage} />

      {/* Additional custom tags (legacy support) */}
      {Object.entries(additionalTags).map(([name, content]) => (
        <meta key={name} name={name} content={content} />
      ))}

      {/* JSON-LD Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(structuredData) ? structuredData : structuredData)}
        </script>
      )}
    </Helmet>
  )
}

// ─── Structured data factory helpers ──────────────────────────────────────────

/** WebSite schema — use on the home/explore page */
export function buildWebSiteSchema(): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description: 'Discover, collect, and mint AI-generated artwork on the decentralized art marketplace powered by Stellar.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/explore?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/** VisualArtwork schema — use on individual artwork pages */
export function buildArtworkSchema(artwork: {
  id: string
  title: string
  description?: string
  image?: string
  creator?: string
  price?: string
  currency?: string
}): StructuredData {
  return {
    '@context': 'https://schema.org',
    '@type': 'VisualArtwork',
    '@id': `${BASE_URL}/artwork/${artwork.id}`,
    name: artwork.title,
    description: artwork.description,
    image: artwork.image,
    url: `${BASE_URL}/artwork/${artwork.id}`,
    creator: artwork.creator
      ? {
          '@type': 'Person',
          identifier: artwork.creator,
          name: artwork.creator,
        }
      : undefined,
    artMedium: 'AI-Generated Digital Art',
    ...(artwork.price && artwork.price !== '0'
      ? {
          offers: {
            '@type': 'Offer',
            price: artwork.price,
            priceCurrency: artwork.currency || 'XLM',
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/artwork/${artwork.id}`,
          },
        }
      : {}),
  }
}
