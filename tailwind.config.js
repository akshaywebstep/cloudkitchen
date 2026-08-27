/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff6b6b',
          500: '#f83b3b',
          600: '#d91d1d',
          700: '#b41313',
          800: '#9e0d0d', // Main primary brand red
          900: '#7a1010',
          950: '#430404',
        },
        surface: {
          bg: '#f3f4f8',
          card: '#ffffff',
          sidebar: '#ffffff',
          hover: '#f8fafc',
        },
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
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        "card-hover": "0 10px 30px -4px rgba(158, 13, 13, 0.12)",
        brand: "0 4px 14px 0 rgba(158, 13, 13, 0.39)",
      },
      fontFamily: {
        sans: ["'Roboto'", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        roboto: ["'Roboto'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
