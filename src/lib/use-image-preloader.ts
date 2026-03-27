"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Manages a sliding-window image preload cache.
 *
 * Key design decisions:
 * - Uses HTMLImageElement.decode() to ensure images are fully decoded
 *   (not just downloaded) before we report them as ready.
 * - Maintains a bounded LRU-like cache of Image objects so the browser
 *   keeps their decoded bitmap in memory (no re-decode on display).
 * - Returns a `waitForImage(url)` that resolves only when the image
 *   is fully decoded and ready to paint without any white flash.
 * - Preloads a configurable window around the current index, with
 *   a larger forward window during playback.
 */

interface CacheEntry {
  img: HTMLImageElement;
  status: "loading" | "ready" | "error";
  promise: Promise<HTMLImageElement>;
  lastAccess: number;
}

const MAX_CACHE_SIZE = 30; // keep at most 30 decoded images in memory

export function useImagePreloader(
  urls: string[], // full ordered list of image URLs
  currentIndex: number,
  isPlaying: boolean,
) {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  // Evict oldest entries when cache exceeds max size
  const evict = useCallback(() => {
    const cache = cacheRef.current;
    if (cache.size <= MAX_CACHE_SIZE) return;

    const entries = Array.from(cache.entries()).sort(
      (a, b) => a[1].lastAccess - b[1].lastAccess,
    );
    const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    for (const [key] of toRemove) {
      cache.delete(key);
    }
  }, []);

  // Core: load and decode a single image, returning a promise
  const loadImage = useCallback(
    (url: string): CacheEntry => {
      const existing = cacheRef.current.get(url);
      if (existing) {
        existing.lastAccess = Date.now();
        return existing;
      }

      const img = new Image();
      const promise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => {
          // decode() ensures the browser has decompressed the image
          // into a bitmap, so painting it is instant (no jank).
          img
            .decode()
            .then(() => {
              const entry = cacheRef.current.get(url);
              if (entry) entry.status = "ready";
              resolve(img);
            })
            .catch(() => {
              // decode() can fail on some browsers; treat loaded as ready
              const entry = cacheRef.current.get(url);
              if (entry) entry.status = "ready";
              resolve(img);
            });
        };
        img.onerror = () => {
          const entry = cacheRef.current.get(url);
          if (entry) entry.status = "error";
          reject(new Error(`Failed to load: ${url}`));
        };
      });

      const entry: CacheEntry = {
        img,
        status: "loading",
        promise,
        lastAccess: Date.now(),
      };
      cacheRef.current.set(url, entry);

      // Start the actual load
      img.src = url;

      evict();
      return entry;
    },
    [evict],
  );

  /**
   * Returns a promise that resolves with the HTMLImageElement once the
   * image at `url` is fully loaded and decoded. If already cached, resolves
   * immediately.
   */
  const waitForImage = useCallback(
    (url: string): Promise<HTMLImageElement> => {
      const entry = loadImage(url);
      return entry.promise;
    },
    [loadImage],
  );

  /**
   * Check if an image is already decoded and ready for instant display.
   */
  const isReady = useCallback((url: string): boolean => {
    const entry = cacheRef.current.get(url);
    return entry?.status === "ready";
  }, []);

  // Preload a window of images around currentIndex.
  // During playback, preload more aggressively forward.
  useEffect(() => {
    if (urls.length === 0) return;

    const behind = isPlaying ? 1 : 3;
    const ahead = isPlaying ? 8 : 4;

    const start = Math.max(0, currentIndex - behind);
    const end = Math.min(urls.length - 1, currentIndex + ahead);

    // Prioritize forward images (load them first)
    const toLoad: string[] = [];

    // Current image first (highest priority)
    if (urls[currentIndex]) toLoad.push(urls[currentIndex]);

    // Then forward images
    for (let i = currentIndex + 1; i <= end; i++) {
      toLoad.push(urls[i]);
    }

    // Then backward images
    for (let i = currentIndex - 1; i >= start; i--) {
      toLoad.push(urls[i]);
    }

    for (const url of toLoad) {
      loadImage(url);
    }
  }, [urls, currentIndex, isPlaying, loadImage]);

  return { waitForImage, isReady, cache: cacheRef };
}
