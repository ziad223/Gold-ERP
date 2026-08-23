import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
    "./i18n/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        panel: "rgb(var(--panel))",
        border: "rgb(var(--border))",
        muted: "rgb(var(--muted))",
        surface: "rgb(var(--surface))",
        "surface-elevated": "rgb(var(--surface-elevated))",
        "surface-muted": "rgb(var(--surface-muted))",
        card: "rgb(var(--card))",
        "card-foreground": "rgb(var(--card-foreground))",
        popover: "rgb(var(--popover))",
        "popover-foreground": "rgb(var(--popover-foreground))",
        primary: "rgb(var(--primary))",
        "primary-foreground": "rgb(var(--primary-foreground))",
        secondary: "rgb(var(--secondary))",
        "secondary-foreground": "rgb(var(--secondary-foreground))",
        "muted-foreground": "rgb(var(--muted-foreground))",
        accent: "rgb(var(--accent))",
        "accent-foreground": "rgb(var(--accent-foreground))",
        destructive: "rgb(var(--destructive))",
        "destructive-foreground": "rgb(var(--destructive-foreground))",
        warning: "rgb(var(--warning))",
        "warning-foreground": "rgb(var(--warning-foreground))",
        success: "rgb(var(--success))",
        "success-foreground": "rgb(var(--success-foreground))",
        info: "rgb(var(--info))",
        "info-foreground": "rgb(var(--info-foreground))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        "table-header": "rgb(var(--table-header))",
        "table-row-hover": "rgb(var(--table-row-hover))",
        "table-row-selected": "rgb(var(--table-row-selected))",
        sidebar: "rgb(var(--sidebar))",
        "sidebar-foreground": "rgb(var(--sidebar-foreground))",
        "sidebar-muted": "rgb(var(--sidebar-muted))",
        "sidebar-border": "rgb(var(--sidebar-border))",
        "sidebar-accent": "rgb(var(--sidebar-accent))",
        "sidebar-accent-foreground": "rgb(var(--sidebar-accent-foreground))",
        "sidebar-active": "rgb(var(--sidebar-active))",
        "sidebar-active-foreground": "rgb(var(--sidebar-active-foreground))",
        "sidebar-ring": "rgb(var(--sidebar-ring))",
        brand: {
          50: "#eefaf8",
          100: "#d5f3ee",
          200: "#afe6dd",
          300: "#7dd2c7",
          400: "#49b7aa",
          500: "#279b90",
          600: "#177d75",
          700: "#14645f",
          800: "#13514d",
          900: "#114440",
          950: "#082927"
        },
        navy: {
          50: "#f1f5f9",
          100: "#e2e8f0",
          200: "#cbd5e1",
          300: "#94a3b8",
          400: "#64748b",
          500: "#40536a",
          600: "#2e4056",
          700: "#213249",
          800: "#16283d",
          900: "#0b1f33",
          950: "#061522"
        },
        gold: {
          50: "#fcf9f1",
          100: "#f7efd9",
          200: "#efdfb0",
          300: "#e5ca7d",
          400: "#d8b252",
          500: "#c59d5f",
          600: "#aa7d3f",
          700: "#8a6034",
          800: "#704e31",
          900: "#5d412b"
        }
      },
      boxShadow: {
        soft: "0 22px 70px rgba(11, 31, 51, 0.10)",
        panel: "0 10px 32px rgba(11, 31, 51, 0.065)",
        float: "0 18px 45px rgba(11, 31, 51, 0.15)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;
