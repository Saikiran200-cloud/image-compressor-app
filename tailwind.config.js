/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html", // For Vite, this is your main HTML file
        "./src/**/*.{js,ts,jsx,tsx}", // Scan all JS, TS, JSX, TSX files in src
    ],
    theme: {
        extend: {
            fontFamily: {
                inter: ['Inter', 'sans-serif'], // Add Inter font if you used it
            },
        },
    },
    plugins: [],
}