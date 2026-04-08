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
          DEFAULT: '#5266eb',
          soft: '#eef1fd',
          50: '#eef1fd',
          100: '#dce3fb',
          200: '#b9c7f7',
          300: '#96abf3',
          400: '#738fef',
          500: '#5266eb',
          600: '#4254c3',
          700: '#32409b',
          800: '#232d73',
          900: '#1f286c',
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
