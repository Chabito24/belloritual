import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        cream: "rgb(var(--cream) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        gold: "rgb(var(--gold) / <alpha-value>)",
        goldSoft: "rgb(var(--gold-soft) / <alpha-value>)",
        blush: "rgb(var(--blush) / <alpha-value>)",
        rose: "rgb(var(--rose) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
      },
    },
  },
  plugins: [],
} satisfies Config;
