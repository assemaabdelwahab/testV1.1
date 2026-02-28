"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: "📊" },
  { href: "/trends", label: "Trends", icon: "📈" },
  { href: "/categories", label: "Categories", icon: "🍕" },
  { href: "/budget", label: "Budget", icon: "🎯" },
];

export default function NavBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-bg-card border-r border-slate-700/50 p-4 gap-1 fixed h-full z-10">
        <div className="mb-6 px-3">
          <h1 className="font-pixel text-xs text-accent-blue">EXPENSE</h1>
          <h1 className="font-pixel text-xs text-accent-green mt-1">TRACKER</h1>
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(item.href) ? "nav-item-active" : "nav-item"}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-slate-700/50 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                isActive(item.href)
                  ? "text-accent-blue"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
