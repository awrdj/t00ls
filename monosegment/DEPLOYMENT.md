# MonoSegment Deployment Guide

Follow these exact steps to host and update the MonoSegment app on GitHub Pages.

## 🛠️ Phase 1: First-Time Setup Only

Do this once to set up the local environment in your `t00ls/monosegment` folder.
*Requirement: Make sure you have [Node.js](https://nodejs.org/) installed.*

### 1. Initialize the Project

Open your terminal, navigate to your `t00ls` folder, and run these commands one by one:

npm create vite@latest monosegment -- --template react
cd monosegment
npm install lucide-react firebase postcss autoprefixer
npm install tailwindcss@3
npx tailwindcss init -p

### 2. Configure Tailwind CSS

Open `tailwind.config.js` and replace everything inside with this:

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

Open `src/index.css` and replace everything inside with this:

@tailwind base;
@tailwind components;
@tailwind utilities;

### 3. Configure Vite

Open `vite.config.js` and replace everything inside with this exact code. *The base path is critical so GitHub knows it's inside a subfolder.*

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/t00ls/monosegment/',
})

---

## 🔄 Phase 2: Updating the App (Do this every time!)

Whenever you make updates in the AI Canvas and want to push the new version live, follow these steps using the simple drag-and-drop method:

### 1. Copy the Code
1. Copy the full, final code of `App.jsx` from the AI Canvas.
2. Open your local file at `t00ls/monosegment/src/App.jsx`.
3. Replace everything inside it with the copied code and save.

### 2. Build the App
Open your terminal, make sure you are inside the `t00ls/monosegment` folder, and run:

npm run build

*This command squishes your code and creates a hidden `dist` (distribution) folder on your computer.*

### 3. Drag and Drop to GitHub
1. Open your computer's file explorer (Finder) and go to `/Users/mac/React Canvas2Github/monosegment/dist/`.
2. Open your web browser and go to your `t00ls` repository on GitHub.
3. Navigate inside the `monosegment` folder on the GitHub website.
4. Click **Add file** -> **Upload files**.
5. Drag and drop **everything inside** your local `dist` folder (the `index.html` file, the `assets` folder, etc.) directly into the GitHub webpage.
6. Scroll down and click **Commit changes**.

*(Note: If you haven't turned on GitHub pages yet: Go to Settings -> Pages -> Source: Deploy from branch -> Branch: main / root -> Save).*

---

## ⚠️ Troubleshooting Common Problems

If you run into issues during setup, here is how to fix the exact problems you might encounter:

**Problem 1: Terminal gets "stuck" after the first `npm create vite` command.**
* **Why:** You accidentally started a live local web server by pressing "Yes" to start.
* **Fix:** Click inside the terminal and press `Ctrl + C` on your keyboard. This kills the server and gives you your standard typing prompt back.

**Problem 2: `npm error could not determine executable to run` when setting up Tailwind.**
* **Why:** The newest version of Tailwind (v4) changed how installation works and broke the standard config command.
* **Fix:** Force install version 3 by running `npm install tailwindcss@3`, and then run `npx tailwindcss init -p` again.

**Problem 3: `Error: Failed to get remote.origin.url` when trying to run `npm run deploy`.**
* **Why:** This happens if you try to use the automated terminal deployment, but your local folder isn't fully linked to your GitHub repository using Git. 
* **Fix:** Skip the terminal deploy command entirely! Instead, use the **Drag and Drop** method outlined in Phase 2 above. It relies on `npm run build` instead, which works perfectly without Git setup.
