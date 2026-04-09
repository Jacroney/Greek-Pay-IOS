/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#214384',
          soft: '#f0f4f9',
          50: '#f0f4f9',
          100: '#dce4f0',
          200: '#b9c9e1',
          300: '#96aed2',
          400: '#7393c3',
          500: '#3a5e9d',
          600: '#214384',
          700: '#1a3569',
          800: '#13274e',
          900: '#0c1a34',
        },
        surface: {
          bg: '#fbfcfd',
          panel: '#ffffff',
        },
        content: {
          primary: '#272735',
          subdued: '#535461',
        },
      },
    },
  },
  plugins: [],
};
