import type { Config } from "tailwindcss";

// 调色板走 CSS 变量：学生端为深色主题，家长报告为浅色，见 app/globals.css
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix: string, keys: (string | number)[]) => Object.fromEntries(keys.map((k) => [k, v(`${prefix}-${k}`)]));

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: v("white"),
        snow: "#FFFFFF",
        ink: "#0B0D1A",
        neutral: scale("n", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        brand: { DEFAULT: v("brand-500"), ...scale("brand", [50, 100, 200, 500, 600]), 700: "#253086", 900: "#151B4D" },
        accent: { DEFAULT: "#FF8A3D", ...scale("accent", [50, 100, 600]), 500: "#FF8A3D" },
        ideal: { ...scale("ideal", [50, 100, 700]), 500: "#10B981" },
        typical: { ...scale("typical", [50, 100, 700]), 500: "#3B82F6" },
        worst: { ...scale("worst", [50, 100, 700]), 500: "#F59E0B" },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
