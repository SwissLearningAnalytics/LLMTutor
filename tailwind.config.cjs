const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontSize: {
      xl: ["2rem", "2.5rem"],
      lg: ["1.5rem", "1.875rem"],
      base: ["1.125rem", "1.5rem"],
      sm: ["1rem", "1.375rem"],
      xs: ["0.875rem", "1.125rem"],
      button: ["1rem", "1.375rem"],
    },
    colors: {
      white:
        "hsl(var(--white) / <alpha-value>) /* hsl(0 0% 100% / <alpha-value>) */",
      black:
        "hsl(var(--black) / <alpha-value>) /* hsl(0 0% 0% / <alpha-value>) */",
      charcoal:
        "hsl(var(--charcoal) / <alpha-value>) /* hsl(0 0% 13% / <alpha-value>) */",
      mango:
        "hsl(var(--mango) / <alpha-value>) /* hsl(50 98% 64% / <alpha-value>) */",
      lime: "hsl(var(--lime) / <alpha-value>) /* hsl(89 78% 46% / <alpha-value>) */",
      strawberry:
        "hsl(var(--strawberry) / <alpha-value>) /* hsl(0 86% 66% / <alpha-value>) */",
      bubblegum:
        "hsl(var(--bubblegum) / <alpha-value>) /* hsl(205 98% 57% / <alpha-value>) */",
      "dark-bubblegum":
        "hsl(var(--dark-bubblegum) / <alpha-value>) /* hsl(205 79% 51% / <alpha-value>) */",
      gray: {
        950: "hsl(var(--gray-950) / <alpha-value>) /* hsl(225 14% 11% / <alpha-value>) */",
        900: "hsl(var(--gray-900) / <alpha-value>) /* hsl(213 15% 14% / <alpha-value>) */",
        800: "hsl(var(--gray-800) / <alpha-value>) /* hsl(212 13% 20% / <alpha-value>) */",
        600: "hsl(var(--gray-600) / <alpha-value>) /* hsl(212 10% 35% / <alpha-value>) */",
        500: "hsl(var(--gray-500) / <alpha-value>) /* hsl(220 9% 46% / <alpha-value>) */",
        400: "hsl(var(--gray-400) / <alpha-value>) /* hsl(219 7% 58% / <alpha-value>) */",
        250: "hsl(var(--gray-250) / <alpha-value>) /* hsl(0 0% 85% / <alpha-value>) */",
        200: "hsl(var(--gray-200) / <alpha-value>) /* hsl(220 13% 91% / <alpha-value>) */",
        "050":
          "hsl(var(--gray-050) / <alpha-value>) /* hsl(0 0% 97% / <alpha-value>) */",
      },
      green: {
        150: "hsl(var(--green-150) / <alpha-value>) /* hsl(155 51% 88% / <alpha-value>) */",
        200: "hsl(var(--green-200) / <alpha-value>) /* hsl(112 46% 83% / <alpha-value>) */",
        600: "hsl(var(--green-600) / <alpha-value>) /* hsl(155 75% 40% / <alpha-value>) */",
      },
      blue: {
        200: "hsl(var(--blue-200) / <alpha-value>) /* hsl(213 97% 87% / <alpha-value>) */",
        800: "hsl(var(--blue-800) / <alpha-value>) /* hsl(226 71% 40% / <alpha-value>) */",
      },
      red: {
        100: "hsl(var(--red-100) / <alpha-value>) /* hsl(0 93% 94% / <alpha-value>) */",
        600: "hsl(var(--red-600) / <alpha-value>) /* hsl(0 72% 51% / <alpha-value>) */",
      },
      orange: {
        200: "hsl(var(--orange-200) / <alpha-value>) /* hsl(32 98% 83% / <alpha-value>) */",
      },
      primary:
        "hsl(var(--text-primary) / <alpha-value>) /* hsl(0 0% 13% / <alpha-value>) */",
      secondary:
        "hsl(var(--text-secondary) / <alpha-value>) /* hsl(220 9% 46% / <alpha-value>) */",
      tertiary:
        "hsl(var(--text-tertiary) / <alpha-value>) /* hsl(212 10% 35% / <alpha-value>) */",
      invert:
        "hsl(var(--text-invert) / <alpha-value>) /* hsl(0 0% 100% / <alpha-value>) */",
      button: {
        outline:
          "hsl(var(--text-button-outline) / <alpha-value>) /* hsl(0 0% 13% / <alpha-value>) */",
      },
      feedback: {
        negative:
          "hsl(var(--text-feedback-negative) / <alpha-value>) /* hsl(0 72% 51% / <alpha-value>) */",
        positive:
          "hsl(var(--text-feedback-positive) / <alpha-value>) /* hsl(155 75% 40% / <alpha-value>) */",
        info: "hsl(var(--text-feedback-info) / <alpha-value>) /* hsl(226 71% 40% / <alpha-value>) */",
      },
      surface: {
        primary:
          "hsl(var(--surface-primary) / <alpha-value>) /* hsl(0 0% 100% / <alpha-value>) */",
        secondary:
          "hsl(var(--surface-secondary) / <alpha-value>) /* hsl(0 0% 13% / <alpha-value>) */",
        lime: "hsl(var(--surface-lime) / <alpha-value>) /* hsl(89 78% 46% / <alpha-value>) */",
        bubblegum:
          "hsl(var(--surface-bubblegum) / <alpha-value>) /* hsl(205 98% 57% / <alpha-value>) */",
        "dark-bubblegum":
          "hsl(var(--surface-dark-bubblegum) / <alpha-value>) /* hsl(205 79% 51% / <alpha-value>) */",
        button: {
          primary:
            "hsl(var(--surface-button-primary) / <alpha-value>) /* hsl(0 0% 13% / <alpha-value>) */",
          secondary:
            "hsl(var(--surface-button-secondary) / <alpha-value>) /* hsl(220 13% 91% / <alpha-value>) */",
          accent:
            "hsl(var(--surface-button-accent) / <alpha-value>) /* hsl(50 98% 64% / <alpha-value>) */",
          outline:
            "hsl(var(--surface-button-outline) / <alpha-value>) /* hsl(0 0% 100% / <alpha-value>) */",
        },
        background: {
          primary:
            "hsl(var(--surface-background-primary) / <alpha-value>) /* hsl(0 0% 97% / <alpha-value>) */",
          secondary:
            "hsl(var(--surface-background-secondary) / <alpha-value>) /* hsl(0 0% 13% / <alpha-value>) */",
          tertiary:
            "hsl(var(--surface-background-tertiary) / <alpha-value>) /* hsl(220 13% 91% / <alpha-value>) */",
        },
        feedback: {
          positive: {
            light: {
              DEFAULT:
                "hsl(var(--surface-feedback-positive-light) / <alpha-value>) /* hsl(155 51% 88% / <alpha-value>) */",
              secondary:
                "hsl(var(--surface-feedback-positive-light-secondary) / <alpha-value>) /* hsl(112 46% 83% / <alpha-value>) */",
            },
            dark: "hsl(var(--surface-feedback-positive-dark) / <alpha-value>) /* hsl(155 75% 40% / <alpha-value>) */",
          },
          negative: {
            light:
              "hsl(var(--surface-feedback-negative-light) / <alpha-value>) /* hsl(0 93% 94% / <alpha-value>) */",
            dark: "hsl(var(--surface-feedback-negative-dark) / <alpha-value>) /* hsl(0 72% 51% / <alpha-value>) */",
          },
          pending: {
            light:
              "hsl(var(--surface-feedback-pending-light) / <alpha-value>) /* hsl(32 98% 83% / <alpha-value>) */",
          },
          info: {
            light:
              "hsl(var(--surface-feedback-info-light) / <alpha-value>) /* hsl(213 97% 87% / <alpha-value>) */",
          },
          neutral: {
            light:
              "hsl(var(--surface-feedback-neutral-light) / <alpha-value>) /* hsl(220 13% 91% / <alpha-value>) */",
          },
        },
      },
      border: {
        primary: {
          DEFAULT:
            "hsl(var(--border-primary) / <alpha-value>) /* hsl(0 0% 97% / <alpha-value>) */",
          hover:
            "hsl(var(--border-primary-hover) / <alpha-value>) /* hsl(220 9% 46% / <alpha-value>) */",
        },
        card: {
          active:
            "hsl(var(--border-card-active) / <alpha-value>) /* hsl(0 0% 13% / <alpha-value>) */",
        },
        feedback: {
          negative:
            "hsl(var(--border-feedback-negative) / <alpha-value>) /* hsl(0 72% 51% / <alpha-value>) */",
          positive:
            "hsl(var(--border-feedback-positive) / <alpha-value>) /* hsl(155 75% 40% / <alpha-value>) */",
        },
      },
      current: "currentColor",
      transparent: "transparent",
    },
    boxShadow: {
      DEFAULT: "0 2px 12px 0 rgba(0, 0, 0, 0.05)",
      hover: "0 2px 12px 0 rgba(0, 0, 0, 0.15)",
      floating:
        "0 4px 6px -2px rgba(0, 0, 0, 0.05), 0px 10px 15px -3px rgba(0, 0, 0, 0.10)",
      focus: "0px 0px 6px 0px rgba(33, 116, 225, 1)",
    },
    extend: {
      fontFamily: {
        sans: ["Hanken Grotesk Variable", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      borderWidth: {
        1.5: "1.5px",
      },
      backgroundImage: {
        "blue-gradient": "linear-gradient(90deg, #F7FCFF, #AEDDFF, #F7FCFF)",
        "dark-blue-gradient":
          "linear-gradient(90deg, #25A2FD 0%, #057CD3 100%)",
      },
      ringWidth: {
        1.5: "1.5px",
      },
      height: {
        5.5: "1.375rem",
      },
      margin: {
        5.5: "1.375rem",
      },
      animation: {
        "spin-slow": "spin 2s linear infinite",
        "loading-border": "spin 5s linear infinite",
        shine: "shine 5s ease infinite",
      },
      keyframes: {
        shine: {
          to: {
            backgroundPosition: "right -300px top 0",
          },
        },
      },
      colors: {
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/container-queries"),
    require("@tailwindcss/typography"),
  ],
};
