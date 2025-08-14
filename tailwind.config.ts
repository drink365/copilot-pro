// tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#dcebff",
          200: "#bfe0ff",
          300: "#96cdff",
          400: "#5eb0ff",
          500: "#2e90ff",
          600: "#1f6fe0",
          700: "#1757b3",
          800: "#174a8e",
          900: "#163e73"
        }
      },
      boxShadow: {
        soft: "0 4px 14px rgba(15,23,42,0.08)"
      }
    }
  },
  plugins: [require("@tailwindcss/typography")] // ← 一定要有
}
export default config
