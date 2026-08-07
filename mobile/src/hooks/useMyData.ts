import { useCallback, useEffect, useState } from 'react';
import { hasSession } from '../store/session';

/**
 * Loads one of the `/me/*` collections for the signed-in user.
 *
 * These are the screens the audit flagged (N-02): they used to render local
 * demo rows, so a reviewer saw plausible bookings and receipts that belonged to
 * nobody. There is deliberately **no fallback to bundled data** here — for
 * account data an empty list with an explanation is the honest answer, and a
 * guest is told to sign in rather than shown someone else's sample rows.
 */
export interface MyData<T> {
  items: T[];
  loading: boolean;
  /** Server/network failure. Never set merely because the list is empty. */
  error: string | null;
  /** No session — the caller should show the sign-in prompt, not an error. */
  isGuest: boolean;
  reload: () => void;
}

export function useMyData<T>(
  fetcher: () => Promise<{ items: Record<string, any>[] }>,
  map: (row: Record<string, any>) => T,
): MyData<T> {
  const signedIn = hasSession();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(signedIn);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!signedIn) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetcher()
      .then(({ items: rows }) => {
        if (cancelled) return;
        setItems(rows.map(map));
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setItems([]);
        setError((e as Error)?.message ?? 'تعذّر تحميل البيانات من الخادم');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // `fetcher`/`map` are module-scope functions at every call site.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, tick]);

  return { items, loading, error, isGuest: !signedIn, reload };
}
