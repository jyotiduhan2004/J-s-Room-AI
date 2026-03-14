import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#137fec",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      keyframes: {
        "audio-bar-1": {
          "0%, 100%": { height: "20%" },
          "50%": { height: "90%" },
        },
        "audio-bar-2": {
          "0%, 100%": { height: "60%" },
          "50%": { height: "30%" },
        },
        "audio-bar-3": {
          "0%, 100%": { height: "40%" },
          "50%": { height: "100%" },
        },
        "audio-bar-4": {
          "0%, 100%": { height: "70%" },
          "50%": { height: "20%" },
        },
      },
      animation: {
        "audio-bar-1": "audio-bar-1 0.8s ease-in-out infinite",
        "audio-bar-2": "audio-bar-2 0.6s ease-in-out infinite",
        "audio-bar-3": "audio-bar-3 0.9s ease-in-out infinite",
        "audio-bar-4": "audio-bar-4 0.7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
