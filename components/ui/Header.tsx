"use client";

import PrivacyToggle from "./PrivacyToggle";
import Avatar from "./Avatar";

interface HeaderProps {
  children?: React.ReactNode;
}

export default function Header({ children }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 bg-bg-card border-b border-slate-700/50 sticky top-0 z-40">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Mobile logo */}
        <div className="md:hidden">
          <span className="font-pixel text-[8px] text-accent-blue">EXP</span>
        </div>
        {children}
      </div>
      <div className="flex items-center gap-2">
        <PrivacyToggle />
        <Avatar />
      </div>
    </header>
  );
}
