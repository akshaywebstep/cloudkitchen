/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        kitchen: {
          50: "#fff5f5",
          100: "#ffe3e3",
          500: "#d31818",
          600: "#b90f15",
          700: "#93090f",
          900: "#5c070b",
        },
        ink: "#1f2933",
        muted: "#64748b",
        line: "#e5e7eb",
        warm: "#fff8ed",
      },
      boxShadow: {
        soft: "0 18px 45px rgba(28, 25, 23, 0.09)",
        panel: "0 10px 26px rgba(147, 9, 15, 0.08)",
      },
      fontFamily: {
        sans: ["'Roboto'", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        roboto: ["'Roboto'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
