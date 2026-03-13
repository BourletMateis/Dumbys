/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF2D7D", // Fuchsia Defi
          light: "#FF5A9E",
          dark: "#D4135F",
        },
        sarcelle: {
          DEFAULT: "#3FD0C9", // Sarcelle Dumbys
          dark: "#2BB5AE",
        },
        jaune: {
          DEFAULT: "#FDB813", // Jaune Sourire
          dark: "#D97706",
        },
        surface: {
          DEFAULT: "#1F1F1F", // Gris Ardoise
          elevated: "#2C2C2C", // Gris Plomb
          overlay: "rgba(0,0,0,0.6)",
        },
        charbon: "#121212",
        accent: {
          blue: "#3B82F6",
          red: "#EF4444",
          green: "#22C55E",
          amber: "#F59E0B",
          pink: "#EC4899",
          purple: "#8B5CF6",
        },
      },
      borderRadius: {
        card: "20px",
        pill: "999px",
      },
      spacing: {
        "safe-bottom": "34px",
      },
      fontSize: {
        hero: ["28px", { lineHeight: "34px", fontWeight: "800" }],
        title: ["20px", { lineHeight: "26px", fontWeight: "700" }],
      },
    },
  },
  plugins: [],
};
