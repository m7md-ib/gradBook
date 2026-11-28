import { useSyncExternalStore } from 'react';
import type { AxiosInstance } from 'axios';

/*
 * The API runs on a free host that sleeps after ~15 minutes without traffic
 * and takes up to a minute to wake. Two things soften that:
 *  - warmUp(): pings the API as soon as the site opens, so it's usually awake
 *    by the time the visitor taps anything;
 *  - a "slow" flag, true while any request has been waiting more than a few
 *    seconds, which ServerWakeBanner turns into a friendly notice instead of
 *    a page that looks frozen.
 */

const SLOW_AFTER_MS = 2500;

let pending = 0;
let slowTimer: number | null = null;
let slow = false;
const listeners = new Set<() => void>();

function setSlow(value: boolean) {
  if (slow === value) return;
  slow = value;
  listeners.forEach((l) => l());
}

function started() {
  pending += 1;
  if (pending === 1 && slowTimer === null) {
    slowTimer = window.setTimeout(() => {
      slowTimer = null;
      if (pending > 0) setSlow(true);
    }, SLOW_AFTER_MS);
  }
}

function finished() {
  pending = Math.max(0, pending - 1);
  if (pending === 0) {
    if (slowTimer !== null) {
      window.clearTimeout(slowTimer);
      slowTimer = null;
    }
    setSlow(false);
  }
}

/** Counts in-flight requests on the client so a slow wake-up can be shown. */
export function trackServerWake(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    started();
    return config;
  });
  client.interceptors.response.use(
    (res) => {
      finished();
      return res;
    },
    (error) => {
      finished();
      return Promise.reject(error);
    },
  );
}

/** Fire-and-forget ping that starts waking the API right away. */
export function warmUp(client: AxiosInstance) {
  void client.get('/api/health', { timeout: 90_000 }).catch(() => undefined);
}

export function useServerWaking(): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => slow,
    () => false,
  );
}
