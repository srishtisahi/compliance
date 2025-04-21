/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      spacing: {
        // Using Tailwind's default spacing scale
        // We can extend it or customize if needed
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  // Add safelist to ensure critical CSS includes important classes
  safelist: [
    // Layout containment classes
    'contain-layout',
    // Critical animation classes
    'transition-transform',
    'transition-opacity',
    'scale-95',
    'scale-100',
    // Critical mobile navigation classes
    'flex',
    'flex-col',
    'items-center',
    'justify-between',
  ],
  plugins: [],
  // Enable CSS extraction optimizations
  future: {
    hoverOnlyWhenSupported: true,
    respectDefaultRingColorOpacity: true,
    disableColorOpacityUtilitiesByDefault: true,
    purgeLayersByDefault: true,
  },
} 