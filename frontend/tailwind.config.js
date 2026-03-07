/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: 'rgb(var(--brand-300) / <alpha-value>)',
                    400: 'rgb(var(--brand-400) / <alpha-value>)',
                    500: 'rgb(var(--brand-500) / <alpha-value>)',
                    600: 'rgb(var(--brand-600) / <alpha-value>)',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                dark: {
                    800: 'rgb(var(--dark-800) / <alpha-value>)',
                    700: 'rgb(var(--dark-700) / <alpha-value>)',
                    600: 'rgb(var(--dark-600) / <alpha-value>)',
                    500: 'rgb(var(--dark-500) / <alpha-value>)',
                },
                slate: {
                    100: 'rgb(var(--slate-100) / <alpha-value>)',
                    200: 'rgb(var(--slate-200) / <alpha-value>)',
                    300: 'rgb(var(--slate-300) / <alpha-value>)',
                    400: 'rgb(var(--slate-400) / <alpha-value>)',
                    500: 'rgb(var(--slate-500) / <alpha-value>)',
                    600: 'rgb(var(--slate-600) / <alpha-value>)',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
