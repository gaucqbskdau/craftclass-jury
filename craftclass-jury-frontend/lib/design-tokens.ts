// Design tokens generated from seed: CraftClass Jury + Sepolia + 202511 + FHECraftJury
// Theme: Modern Craft Brutalism

export const designTokens = {
  // Color Palette
  colors: {
    // Primary - Leather tones
    primary: {
      50: "#FDF8F3",
      100: "#F9EEE3",
      200: "#F1D4BE",
      300: "#E8B999",
      400: "#D99E74",
      500: "#8B4513", // Saddle Brown - main
      600: "#703811",
      700: "#552A0D",
      800: "#3A1C09",
      900: "#1F0E04",
    },
    // Secondary - Walnut wood tones
    secondary: {
      50: "#F5F3F0",
      100: "#E8E4DD",
      200: "#CFC7B8",
      300: "#B5AA93",
      400: "#9C8D6E",
      500: "#5D4E37", // Walnut - main
      600: "#4A3E2C",
      700: "#382F21",
      800: "#251F16",
      900: "#13100B",
    },
    // Accent - Brass gold
    accent: {
      50: "#FCFBF5",
      100: "#F8F5E6",
      200: "#EEE8C4",
      300: "#E3DBA2",
      400: "#D9CE80",
      500: "#B5A642", // Brass Gold - main
      600: "#918535",
      700: "#6D6428",
      800: "#48421A",
      900: "#24210D",
    },
    // Success - Forest green
    success: {
      50: "#F3F9F3",
      100: "#E0F0E0",
      200: "#B8DEB8",
      300: "#90CC90",
      400: "#68BA68",
      500: "#228B22", // Forest Green - main
      600: "#1B6F1B",
      700: "#145314",
      800: "#0D380D",
      900: "#071C07",
    },
    // Grayscale
    gray: {
      50: "#F9F9F9",
      100: "#F0F0F0",
      200: "#E0E0E0",
      300: "#C0C0C0",
      400: "#A0A0A0",
      500: "#808080",
      600: "#606060",
      700: "#404040",
      800: "#282828",
      900: "#1A1A1A", // Deep Charcoal
    },
  },

  // Typography
  typography: {
    fontFamily: {
      sans: "'Inter', system-ui, -apple-system, sans-serif",
      display: "'Sora', 'Inter', system-ui, sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem", // 48px
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    lineHeight: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },

  // Spacing
  spacing: {
    0: "0",
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
  },

  // Density variants
  density: {
    comfortable: {
      padding: "1rem",
      gap: "1.5rem",
      fontSize: "1rem",
    },
    compact: {
      padding: "0.5rem",
      gap: "0.75rem",
      fontSize: "0.875rem",
    },
  },

  // Border Radius
  borderRadius: {
    none: "0",
    sm: "0.125rem", // 2px
    base: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    full: "9999px",
  },

  // Shadows
  shadows: {
    none: "none",
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  },

  // Transitions
  transitions: {
    duration: {
      fast: "150ms",
      base: "200ms",
      slow: "300ms",
    },
    timing: {
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  // Breakpoints
  breakpoints: {
    mobile: "375px",
    tablet: "768px",
    desktop: "1024px",
    wide: "1280px",
  },

  // Z-index layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modalBackdrop: 1300,
    modal: 1400,
    popover: 1500,
    tooltip: 1600,
  },

  // Dark mode colors
  darkMode: {
    background: "#1A1A1A",
    surface: "#282828",
    surfaceElevated: "#404040",
    text: {
      primary: "#F9F9F9",
      secondary: "#C0C0C0",
      muted: "#808080",
    },
    border: "#404040",
    // Adjusted primary colors for dark mode
    primary: "#D99E74",
    secondary: "#9C8D6E",
    accent: "#D9CE80",
    success: "#68BA68",
  },
} as const;

// Accessibility - WCAG AA compliant contrast ratios
export const a11y = {
  minContrastRatio: 4.5, // WCAG AA for normal text
  minContrastRatioLarge: 3.0, // WCAG AA for large text (18pt+ or 14pt+ bold)
  focusRingWidth: "2px",
  focusRingColor: designTokens.colors.accent[500],
  focusRingOffset: "2px",
} as const;

// Component-specific tokens
export const components = {
  card: {
    background: "#FFFFFF",
    border: designTokens.colors.gray[200],
    borderRadius: designTokens.borderRadius.lg,
    shadow: designTokens.shadows.base,
    padding: designTokens.spacing[6],
  },
  button: {
    primary: {
      background: designTokens.colors.primary[500],
      text: "#FFFFFF",
      hover: designTokens.colors.primary[600],
      active: designTokens.colors.primary[700],
    },
    secondary: {
      background: designTokens.colors.secondary[500],
      text: "#FFFFFF",
      hover: designTokens.colors.secondary[600],
      active: designTokens.colors.secondary[700],
    },
    borderRadius: designTokens.borderRadius.md,
    padding: `${designTokens.spacing[3]} ${designTokens.spacing[6]}`,
  },
  input: {
    background: "#FFFFFF",
    border: designTokens.colors.gray[300],
    borderFocus: designTokens.colors.primary[500],
    text: designTokens.colors.gray[900],
    placeholder: designTokens.colors.gray[400],
    borderRadius: designTokens.borderRadius.md,
    padding: designTokens.spacing[3],
  },
  badge: {
    gold: {
      background: "#FFD700",
      text: "#7B5F00",
      border: "#FFA500",
    },
    silver: {
      background: "#C0C0C0",
      text: "#404040",
      border: "#A0A0A0",
    },
    bronze: {
      background: "#CD7F32",
      text: "#FFFFFF",
      border: "#A0522D",
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
export type A11yTokens = typeof a11y;
export type ComponentTokens = typeof components;

