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
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "bounce-dot": {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "audio-bar-1": "audio-bar-1 0.8s ease-in-out infinite",
        "audio-bar-2": "audio-bar-2 0.6s ease-in-out infinite",
        "audio-bar-3": "audio-bar-3 0.9s ease-in-out infinite",
        "audio-bar-4": "audio-bar-4 0.7s ease-in-out infinite",
        "slide-up": "slide-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "bounce-dot-1": "bounce-dot 1.2s ease-in-out infinite",
        "bounce-dot-2": "bounce-dot 1.2s ease-in-out 0.15s infinite",
        "bounce-dot-3": "bounce-dot 1.2s ease-in-out 0.3s infinite",
      },
    },
  },
  plugins: [],
};
export default config;
