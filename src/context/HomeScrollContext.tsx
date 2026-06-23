import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
} from "react";

type HomeScrollContextValue = {
  registerScrollToTop: (fn: () => void) => () => void;
  scrollHomeToTop: () => void;
};

const HomeScrollContext = createContext<HomeScrollContextValue | null>(null);

export function HomeScrollProvider({ children }: { children: React.ReactNode }) {
  const scrollToTopRef = useRef<(() => void) | null>(null);

  const registerScrollToTop = useCallback((fn: () => void) => {
    scrollToTopRef.current = fn;
    return () => {
      if (scrollToTopRef.current === fn) {
        scrollToTopRef.current = null;
      }
    };
  }, []);

  const scrollHomeToTop = useCallback(() => {
    scrollToTopRef.current?.();
  }, []);

  return (
    <HomeScrollContext.Provider
      value={{ registerScrollToTop, scrollHomeToTop }}
    >
      {children}
    </HomeScrollContext.Provider>
  );
}

export function useHomeScroll(): HomeScrollContextValue {
  const ctx = useContext(HomeScrollContext);
  if (!ctx) {
    throw new Error("useHomeScroll must be used within HomeScrollProvider");
  }
  return ctx;
}
