import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        growappy: {
          teal: {
            DEFAULT: '#00838F',
            light: '#E0F7FA',
            dark: '#005662',
            50: '#E0F7FA',
            100: '#B2EBF2',
            500: '#00838F',
            600: '#00695C',
            700: '#005662',
          },
          coral: {
            DEFAULT: '#FF7043',
            light: '#FFEBE5',
            dark: '#D84315',
          },
          gold: {
            DEFAULT: '#FFB300',
            light: '#FFF8E1',
            dark: '#F57F17',
          },
          green: {
            DEFAULT: '#2E7D32',
            light: '#E8F5E9',
          },
          surface: '#FFFFFF',
          bg: '#F6F8FA',
        },
      },
    },
  },
  plugins: [],
};

export default config;
