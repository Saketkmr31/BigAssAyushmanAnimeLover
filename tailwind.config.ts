import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090d",
        panel: "#13131b",
        line: "#272735",
        violet: "#8b5cf6",
        pink: "#ec4899"
      },
      boxShadow: {
        glow: "0 0 35px rgba(139,92,246,.24)"
      }
    },
  },
  plugins: [],
};
export default config;