export const Theme = {
  colors: {
    primary: '#0E9F6E',       // Modern Islamic Emerald Green
    primaryDark: '#046C4E',   // Deep Forest Green
    primaryLight: '#E6F4EA',  // Soft Mint Tint
    accent: '#F59E0B',        // Gold / Amber
    accentDark: '#D97706',    // Dark Gold
    background: '#F6F9F8',    // Very soft off-white mint background
    surface: '#FFFFFF',       // Clean white cards
    surfaceLight: '#F3F4F6',  // Lighter gray surface
    text: '#0F172A',          // Slate 900 (dark charcoal text)
    textSecondary: '#475569', // Slate 600 (medium gray text)
    textMuted: '#94A3B8',     // Slate 400 (light gray text)
    border: '#E2E8F0',        // Very soft border gray
    error: '#EF4444',         // Red 500
    success: '#0E9F6E',       // Green 500
    white: '#FFFFFF',
    overlay: 'rgba(15, 23, 42, 0.4)',
  },
  
  gradients: {
    primary: ['#0E9F6E', '#10B981'] as const,   // Emerald gradient
    accent: ['#F59E0B', '#D97706'] as const,    // Gold to Amber
    dark: ['#F6F9F8', '#FFFFFF'] as const,      // Light background to white
    goldCard: ['#FFFBEB', '#FEF3C7'] as const,  // Light gold cards
  },

  typography: {
    fonts: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
      arabic: 'Georgia',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      title: 32,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },

  radius: {
    sm: 6,
    md: 12,
    lg: 18,
    xl: 24,
    round: 9999,
  },
};
