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
          base: "#0A0A0F",
          card: "#141419",
          elevated: "#1C1C24",
        },
        ink: {
          primary: "#F0F0F5",
          secondary: "#6B7080",
          muted: "#3A3A48",
        },
        signal: {
          green: "#10B981",
          amber: "#F59E0B",
          red: "#EF4444",
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
        sans: ["Satoshi", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      maxWidth: {
        narrative: "480px",
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
} satisfies Config;
