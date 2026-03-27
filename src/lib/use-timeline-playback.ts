"use client";

import { useState, useCallback, useRef, useEffect } from "react";

/**
 * State machine for timeline playback.
 *
 * Key design: the interval does NOT blindly advance every 800ms.
 * Instead, it advances only when the NEXT image is confirmed ready
 * (decoded). This guarantees no white flash during playback.
 *
 * States:
 *   idle      - not playing
 *   waiting   - playing, but next image is still loading; shows subtle indicator
 *   ready     - next image decoded, will transition on next tick
 *
 * The hook exposes `requestAdvance` which the consumer calls with a
 * `canAdvance` callback. The interval only fires the advance when
 * canAdvance() returns true.
 */

interface UseTimelinePlaybackOptions {
  totalFrames: number;
  intervalMs?: number;
  onAdvance: (nextIndex: number) => void;
  canAdvance: (nextIndex: number) => boolean;
}

export function useTimelinePlayback({
  totalFrames,
  intervalMs = 800,
  onAdvance,
  canAdvance,
}: UseTimelinePlaybackOptions) {
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const currentIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playingRef = useRef(false);

  // Keep ref in sync
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const stop = useCallback(() => {
    setPlaying(false);
    setWaiting(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const updateCurrentIndex = useCallback((idx: number) => {
    currentIndexRef.current = idx;
  }, []);

  const start = useCallback(() => {
    if (totalFrames < 2) return;
    setPlaying(true);

    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (!playingRef.current) return;

      const nextIdx = currentIndexRef.current + 1;

      // Reached the end
      if (nextIdx >= totalFrames) {
        setPlaying(false);
        setWaiting(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      if (canAdvance(nextIdx)) {
        setWaiting(false);
        onAdvance(nextIdx);
      } else {
        // Image not ready yet -- show subtle waiting indicator
        // but do NOT advance. Next tick will retry.
        setWaiting(true);
      }
    }, intervalMs);
  }, [totalFrames, intervalMs, canAdvance, onAdvance]);

  const toggle = useCallback(() => {
    if (playing) {
      stop();
    } else {
      start();
    }
  }, [playing, stop, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    playing,
    waiting, // true when playback is paused waiting for next image to load
    toggle,
    stop,
    start,
    updateCurrentIndex,
  };
}
