import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F7F5F2",
        surface: "#FFFFFF",
        beige: "#EEEDEB",
        border: "var(--color-border, #E4E0DB)",
        fg: "#111111",
        muted: "var(--color-muted, #888888)",
        blue: "#2D5BE3",
        orange: "#ff8f27",
        green: "#1cb785",
        violet: "#9d89fc",
        red: "#ff4f3f",
        background: "rgb(var(--background-rgb, 247 245 242) / <alpha-value>)",
        foreground: "rgb(var(--foreground-rgb, 17 17 17) / <alpha-value>)",
        card: {
          DEFAULT: "rgb(var(--card-rgb, 255 255 255) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground-rgb, 17 17 17) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover-rgb, 255 255 255) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground-rgb, 17 17 17) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary-rgb, 157 137 252) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground-rgb, 255 255 255) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary-rgb, 238 237 235) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground-rgb, 17 17 17) / <alpha-value>)",
        },
        "muted-foreground": "rgb(var(--muted-foreground-rgb, 136 136 136) / <alpha-value>)",
        accent: {
          DEFAULT: "rgb(var(--accent-rgb, 238 237 235) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground-rgb, 17 17 17) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive-rgb, 255 79 63) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground-rgb, 255 255 255) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success-rgb, 28 183 133) / <alpha-value>)",
          foreground: "rgb(var(--success-foreground-rgb, 255 255 255) / <alpha-value>)",
        },
        input: "rgb(var(--input-rgb, 228 224 219) / <alpha-value>)",
        ring: "rgb(var(--ring-rgb, 157 137 252) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["DM Serif Display", "serif"],
        sans: ["DM Sans", "sans-serif"],
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "20px",
        "card-lg": "24px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
