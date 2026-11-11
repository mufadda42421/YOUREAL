"use client";

import { useCallback, useEffect, useRef } from "react";

/** Returns a debounced version of fn that trailing-fires after `delay` ms. */
export function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => void,
  delay = 700
): (...args: A) => void {
  const timer = useRef<number | null>(null);
  const fnRef = useRef(fn);
  // Callback ref — updating it inside an effect avoids touching refs during render.
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return useCallback(
    (...args: A) => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => fnRef.current(...args), delay);
    },
    [delay]
  );
}
