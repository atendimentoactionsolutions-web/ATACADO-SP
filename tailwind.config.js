/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: "#f5f5f7",
          card: "#ffffff",
          dark: "#1d1d1f",
          gray: "#86868b",
          subtle: "#e8e8ed",
          border: "#d2d2d7",
          blue: "#0071e3",
          hoverBlue: "#0077ed",
          green: "#34c759",
          orange: "#ff9500",
          red: "#ff3b30"
        }
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif"
        ]
      }
    },
  },
  plugins: [],
};
