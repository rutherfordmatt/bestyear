import { useEffect, useState, useCallback } from "preact/hooks";
import { load, get, subscribe, update } from "./storage.js";
import { emptyState } from "./schema.js";

/*
  Islands read state through this hook. On the server (and on the very first
  client render) it returns an empty state, so server and client markup agree;
  the effect then loads from localStorage and re-renders.
*/
export function useStore() {
  const [state, setState] = useState(() =>
    typeof window === "undefined" ? emptyState() : emptyState()
  );

  useEffect(() => {
    setState({ ...load() });
    return subscribe((next) => setState({ ...next }));
  }, []);

  const set = useCallback((mutator, opts) => update(mutator, opts), []);

  return [state, set];
}

/** True once the client has hydrated and real answers are available. */
export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => { load(); setReady(true); }, []);
  return ready;
}
