'use client';
import { useEffect, useRef } from 'react';

/**
 * Polls `fetcher()` every `intervalMs` while the tab is visible AND when
 * the window regains focus. Returns a `refreshNow()` function callers can
 * invoke after a mutation (POST / PATCH) to update immediately, and a
 * `lastRefreshedAt` ref for "updated X seconds ago" UI hints.
 */
export function useAutoRefresh(
  fetcher: () => Promise<void> | void,
  intervalMs = 15000,
) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const lastRefreshedAt = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function tick() {
      if (cancelled) return;
      if (document.visibilityState === 'visible') {
        try {
          await fetcherRef.current();
          lastRefreshedAt.current = Date.now();
        } catch {
          /* swallow */
        }
      }
    }

    function start() {
      if (timer) return;
      timer = setInterval(tick, intervalMs);
    }
    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function onVisibility() {
      if (document.visibilityState === 'visible') tick();
    }
    function onFocus() {
      tick();
    }

    start();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [intervalMs]);

  return {
    refreshNow: async () => {
      try {
        await fetcherRef.current();
        lastRefreshedAt.current = Date.now();
      } catch {
        /* ignore */
      }
    },
    lastRefreshedAt,
  };
}
