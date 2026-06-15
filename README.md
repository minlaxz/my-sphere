# my-sphere

Vite + TypeScript + Tailwind CSS + Three.js starter.

## Stack

- [Vite](https://vite.dev) (vanilla-ts template)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS v4](https://tailwindcss.com) via the official Vite plugin
- [Three.js](https://threejs.org)

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the built bundle
```

## Layout

```
src/
  main.ts    # entry — mounts the canvas and the overlay
  scene.ts   # Three.js scene factory (renderer, camera, mesh, RAF loop)
  style.css  # @import "tailwindcss";
```
