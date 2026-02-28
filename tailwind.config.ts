import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0F172A",
          card: "#1E293B",
          "card-hover": "#334155",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
        },
        accent: {
          green: "#10B981",
          red: "#EF4444",
          yellow: "#F59E0B",
          blue: "#3B82F6",
        },
        cat: {
          groceries: "#10B981",
          dining: "#F59E0B",
          delivery: "#EF4444",
          transport: "#3B82F6",
          bills: "#8B5CF6",
          health: "#EC4899",
          subscriptions: "#06B6D4",
          instapay: "#6366F1",
          cash: "#78716C",
          rent: "#F97316",
          loans: "#DC2626",
          fuel: "#14B8A6",
          others: "#A1A1AA",
          investments: "#22C55E",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        pixel: ["'Press Start 2P'", "cursive"],
      },
    },
  },
  plugins: [],
} satisfies Config;
