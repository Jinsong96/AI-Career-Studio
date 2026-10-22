import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#3B4CCA", 50: "#EEF0FB", 100: "#DCE0F7", 200: "#B5BDEE", 500: "#3B4CCA", 600: "#2F3DA8", 700: "#253086", 900: "#151B4D" },
        accent: { DEFAULT: "#FF8A3D", 50: "#FFF3EA", 100: "#FFE2CC", 500: "#FF8A3D", 600: "#E8701F" },
        ideal: { 50: "#ECFDF5", 100: "#D1FAE5", 500: "#10B981", 700: "#047857" },
        typical: { 50: "#EFF6FF", 100: "#DBEAFE", 500: "#3B82F6", 700: "#1D4ED8" },
        worst: { 50: "#FFFBEB", 100: "#FEF3C7", 500: "#F59E0B", 700: "#B45309" },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
