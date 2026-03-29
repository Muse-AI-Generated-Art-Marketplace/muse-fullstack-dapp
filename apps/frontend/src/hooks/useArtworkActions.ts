import { useCallback } from "react";
import { useErrorContext } from "@/contexts/ErrorContext";

export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  currency: string;
  creator?: string;
  createdAt?: string;
  category?: string;
}

export interface UseArtworkActionsProps {
  onPurchase?: (artwork: Artwork) => void | Promise<void>;
  onView?: (artwork: Artwork) => void;
  onShare?: (artwork: Artwork) => void;
  onFavorite?: (artwork: Artwork) => void;
}

export function useArtworkActions({
  onPurchase,
  onView,
  onShare,
  onFavorite,
}: UseArtworkActionsProps) {
  const { showError } = useErrorContext();

  const handlePurchase = useCallback(
    async (artwork: Artwork) => {
      try {
        await onPurchase?.(artwork);
      } catch (error) {
        showError(error);
      }
    },
    [onPurchase, showError],
  );

  const handleView = useCallback(
    (artwork: Artwork) => {
      onView?.(artwork);
    },
    [onView],
  );

  const handleShare = useCallback(
    (artwork: Artwork) => {
      if (onShare) {
        onShare(artwork);
      } else {
        // Default share behavior
        if (navigator.share) {
          navigator.share({
            title: artwork.title,
            text: artwork.description,
            url: window.location.origin + `/artwork/${artwork.id}`,
          });
        } else {
          // Fallback: copy to clipboard
          navigator.clipboard.writeText(
            window.location.origin + `/artwork/${artwork.id}`,
          );
        }
      }
    },
    [onShare],
  );

  const handleFavorite = useCallback(
    (artwork: Artwork) => {
      onFavorite?.(artwork);
    },
    [onFavorite],
  );

  return {
    handlePurchase,
    handleView,
    handleShare,
    handleFavorite,
  };
}
