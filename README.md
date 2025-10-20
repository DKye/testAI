# Tetris (Vanilla JS + Vite)

Playable Tetris built with vanilla HTML/CSS/JS, canvas rendering, and Vite.

## Features
- Keyboard controls: ← → move, ↑ rotate, ↓ soft drop, Space hard drop, P pause, R restart
- 10×20 board, 7 standard tetrominoes
- Line clears with scoring and level progression (level up every 10 lines)
- Soft/hard drop scoring (+1 per soft drop cell, +2 per hard drop cell)
- Next piece preview
- Best score persisted in localStorage
- Responsive canvas scaling and subtle grid

## Development

Prerequisites: Node.js 18+

```bash
npm install
npm run dev
```

Open the local server URL printed by Vite.

## Build

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)

If deploying to GitHub Pages at `https://<user>.github.io/<repo>/`, set the `base` in `vite.config.js` to `'/<repo>/'`, then:

```bash
npm run build
# push the dist/ folder to the gh-pages branch or configure GitHub Pages to use it
```

## Accessibility
- The app root is focusable and captures keyboard input; visible instructions are provided
- Status elements (score, lines, level, best) are in a live region
