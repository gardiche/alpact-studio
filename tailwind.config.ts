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
        border: "#E4E0DB",
        fg: "#111111",
        muted: "#888888",
        blue: "#2D5BE3",
        orange: "#ff8f27",
        green: "#1cb785",
        violet: "#9d89fc",
        red: "#ff4f3f",
      },
      fontFamily: {
        serif: ["DM Serif Display", "serif"],
        sans: ["DM Sans", "sans-serif"],
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
