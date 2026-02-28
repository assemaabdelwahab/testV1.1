"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface PrivacyContextType {
  privacyMode: boolean;
  togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  privacyMode: false,
  togglePrivacy: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [privacyMode, setPrivacyMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("privacyMode");
    if (stored === "true") setPrivacyMode(true);
    setMounted(true);
  }, []);

  const togglePrivacy = () => {
    setPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem("privacyMode", String(next));
      return next;
    });
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <PrivacyContext.Provider value={{ privacyMode, togglePrivacy }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}
