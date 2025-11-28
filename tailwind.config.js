/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./App.tsx",
        "./store/**/*.ts"
    ],
    theme: {
        extend: {
            colors: {
                primary: "hsl(210, 40%, 55%)",
                secondary: "hsl(340, 45%, 60%)",
                accent: "hsl(45, 80%, 55%)"
            }
        }
    },
    plugins: []
};
