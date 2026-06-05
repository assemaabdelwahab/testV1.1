'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const PRIVACY_KEY = 'scenario:privacy';

interface PrivacyCtx {
  privacy: boolean;
  togglePrivacy: () => void;
  /** Wrap a pre-formatted sensitive string — returns '••••' when privacy is on */
  s: (value: string) => string;
}

const Ctx = createContext<PrivacyCtx>({
  privacy: false,
  togglePrivacy: () => {},
  s: (v) => v,
});

export function usePrivacy() {
  return useContext(Ctx);
}

export default function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [privacy, setPrivacy] = useState(false);

  useEffect(() => {
    try {
      setPrivacy(localStorage.getItem(PRIVACY_KEY) === '1');
    } catch {}
  }, []);

  const togglePrivacy = useCallback(() => {
    setPrivacy(p => {
      const next = !p;
      try { localStorage.setItem(PRIVACY_KEY, next ? '1' : '0'); } catch {}
      return next;
    });
  }, []);

  const s = useCallback((value: string): string => {
    return privacy ? '••••' : value;
  }, [privacy]);

  return (
    <Ctx.Provider value={{ privacy, togglePrivacy, s }}>
      {children}
    </Ctx.Provider>
  );
}
