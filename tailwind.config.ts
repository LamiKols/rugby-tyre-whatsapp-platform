import type { Config } from "tailwindcss";

export default {
  content: ["./dashboard/index.html", "./dashboard/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          50: "#ecfdf3",
          100: "#d1fae0",
          500: "#25d366",
          600: "#128c4a",
          700: "#075e54"
        },
        charcoal: "#172026"
      },
      boxShadow: {
        soft: "0 12px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;

