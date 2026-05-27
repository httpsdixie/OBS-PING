/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        maroon: {
          50:  "#fdf2f2",
          100: "#fce4e4",
          200: "#f9c0c0",
          300: "#f48a8a",
          400: "#ec4f4f",
          500: "#d92b2b",
          600: "#b91c1c",
          700: "#7B1C1C",  // primary brand
          800: "#5c1414",
          900: "#3d0d0d",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};
