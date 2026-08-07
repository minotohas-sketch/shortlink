/** @type {import('postcss-load-config').Config} */
// BUG FIX: ce fichier n'existait pas du tout. Sans lui, Vite ne sait pas
// qu'il doit passer le CSS par PostCSS, donc les directives @tailwind
// base/components/utilities de src/styles/globals.css ne sont jamais
// transformées en vraies règles CSS — elles restent des at-rules inconnues
// que le navigateur ignore silencieusement. Résultat : le HTML/JS
// fonctionne, les classes Tailwind (bg-gray-50, flex, etc.) sont bien
// présentes dans le DOM, mais aucune règle CSS ne les définit → rien n'est
// stylé. tailwindcss et autoprefixer étaient déjà en devDependencies,
// il ne manquait que ce fichier de configuration.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
