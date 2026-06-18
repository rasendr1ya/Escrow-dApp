/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "obsidian-bg": "#0A0A0A",
        "obsidian-card": "#161616",
        "obsidian-surface": "#222222",
        "obsidian-neon": "#E1FF4A",
        "obsidian-neon-hover": "#cbe643",
      },
      fontFamily: {
        heading: ['"Be Vietnam Pro"', "sans-serif"],
        body: ['"Be Vietnam Pro"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      borderRadius: {
        "pill": "9999px",
      },
      maxWidth: {
        "app": "1300px",
      },
      spacing: {
        "gutter": "24px",
        "margin-mobile": "16px",
        "margin-desktop": "40px",
      },
    },
  },
  plugins: [],
}
