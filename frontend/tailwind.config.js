/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /**
         * SEMANTIC COLOR TOKEN ARCHITECTURE
         * ===================================
         *
         * 3-Tier System:
         * - Layer 1 (Primitives): Tailwind default palette (green, red, yellow, blue, gray)
         * - Layer 2 (Semantic): action.* and status.* tokens defined below
         * - Layer 3 (Component): Applied in component-specific styles
         *
         * Usage Guidelines:
         * - action.* tokens: For interactive elements (buttons, links, form controls)
         * - status.* tokens: For non-interactive indicators (badges, alerts, status dots)
         */

        /**
         * ACTION COLORS
         * For buttons, links, and interactive elements.
         * Each variant includes DEFAULT, hover, and text colors.
         *
         * Usage:
         * - bg-action-primary, hover:bg-action-primary-hover, text-action-primary-text
         * - bg-action-secondary, hover:bg-action-secondary-hover
         * - bg-action-danger (destructive actions)
         * - bg-action-ghost (minimal visual weight)
         */
        action: {
          primary: {
            DEFAULT: '#16a34a',      // green-600 - main action color
            hover: '#15803d',        // green-700 - hover state
            text: '#ffffff',         // white text on primary bg
          },
          secondary: {
            DEFAULT: '#f3f4f6',      // gray-100 - subtle background
            hover: '#e5e7eb',        // gray-200 - hover state
            text: '#374151',         // gray-700 - readable on light bg
            border: '#d1d5db',       // gray-300 - border color
          },
          danger: {
            DEFAULT: '#dc2626',      // red-600 - destructive action
            hover: '#b91c1c',        // red-700 - hover state
            text: '#ffffff',         // white text on danger bg
          },
          ghost: {
            DEFAULT: 'transparent',  // no background
            hover: '#f3f4f6',        // gray-100 - subtle hover
            text: '#374151',         // gray-700 - readable text
          },
        },

        /**
         * STATUS COLORS
         * For non-interactive indicators, badges, and alerts.
         * Each status includes DEFAULT, light (background), and text colors.
         *
         * Usage:
         * - bg-status-success-light text-status-success-text (success badge)
         * - border-status-warning (warning indicator)
         * - bg-status-error-light text-status-error-text (error alert)
         *
         * WCAG AA compliant: text colors meet 4.5:1 contrast on light backgrounds.
         */
        status: {
          success: {
            DEFAULT: '#22c55e',      // green-500 - positive indicator
            light: '#dcfce7',        // green-100 - background
            text: '#166534',         // green-800 - WCAG AA on light bg
          },
          warning: {
            DEFAULT: '#eab308',      // yellow-500 - caution indicator
            light: '#fef9c3',        // yellow-100 - background
            text: '#854d0e',         // yellow-800 - WCAG AA on light bg
          },
          error: {
            DEFAULT: '#ef4444',      // red-500 - error indicator
            light: '#fee2e2',        // red-100 - background
            text: '#991b1b',         // red-800 - WCAG AA on light bg
          },
          info: {
            DEFAULT: '#3b82f6',      // blue-500 - info indicator
            light: '#dbeafe',        // blue-100 - background
            text: '#1e40af',         // blue-800 - WCAG AA on light bg
          },
          neutral: {
            DEFAULT: '#9ca3af',      // gray-400 - neutral indicator
            light: '#f3f4f6',        // gray-100 - background
            text: '#374151',         // gray-700 - WCAG AA on light bg
          },
        },
      },
    },
  },
  plugins: [],
}
