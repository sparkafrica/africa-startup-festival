import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type FloatingNavVisibilityContextValue = {
  suppressed: boolean;
  setFloatingNavSuppressed: (hidden: boolean) => void;
};

const FloatingNavVisibilityContext =
  createContext<FloatingNavVisibilityContextValue | null>(null);

export function FloatingNavVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [suppressed, setSuppressed] = useState(false);

  const setFloatingNavSuppressed = useCallback((hidden: boolean) => {
    setSuppressed(hidden);
  }, []);

  const value = useMemo(
    () => ({ suppressed, setFloatingNavSuppressed }),
    [suppressed, setFloatingNavSuppressed],
  );

  return (
    <FloatingNavVisibilityContext.Provider value={value}>
      {children}
    </FloatingNavVisibilityContext.Provider>
  );
}

export function useFloatingNavVisibility(): FloatingNavVisibilityContextValue {
  const ctx = useContext(FloatingNavVisibilityContext);
  if (!ctx) {
    throw new Error(
      "useFloatingNavVisibility must be used within FloatingNavVisibilityProvider",
    );
  }
  return ctx;
}
