/** Tailwind build config. Rebuild the CSS after changing classes in index.html or script.js:
 *    npx tailwindcss@3 -i ./input.css -o ./tailwind.css --minify
 */
module.exports = {
  content: ['./index.html', './script.js'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        night: '#0b0d12',
        panel: '#11141b',
        edge: 'rgba(255,255,255,0.08)',
        text: '#e6e8ec',
        muted: '#8f98a8',
        gold: '#c9a66b',
        steel: '#6f9fb0',
      },
    },
  },
};