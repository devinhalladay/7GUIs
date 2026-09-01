import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function currentHash() {
  return window.location.hash.replace(/^#\/?/, "");
}

/** The current `#/slug` fragment, kept in sync with back/forward navigation. */
export function useHashRoute() {
  return useSyncExternalStore(subscribe, currentHash, () => "");
}
