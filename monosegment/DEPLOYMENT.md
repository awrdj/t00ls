MonoSegment Deployment GuideFollow these exact steps to host and update the MonoSegment app on GitHub Pages.🛠️ Phase 1: First-Time Setup OnlyDo this once to set up the local environment in your t00ls/monosegment folder.Requirement: Make sure you have Node.js installed.1. Initialize the ProjectOpen your terminal, navigate to your t00ls folder, and run these commands one by one:npm create vite@latest monosegment -- --template react
cd monosegment
npm install
npm install lucide-react firebase tailwindcss postcss autoprefixer
npm install gh-pages --save-dev
npx tailwindcss init -p
2. Configure Tailwind CSSOpen tailwind.config.js and replace everything inside with this:/** @type {import('tailwindcss').Config} */
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
Open src/index.css and replace everything inside with this:@tailwind base;
@tailwind components;
@tailwind utilities;
3. Configure Vite & GitHub PagesOpen vite.config.js and replace everything inside with this (assuming your repository is exactly named t00ls):import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/t00ls/',
})
Open package.json. Find the "scripts" section and add the deploy line so it looks exactly like this:  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview",
    "deploy": "gh-pages -d dist"
  },
🔄 Phase 2: Updating the App (Do this every time!)Whenever you make updates in the AI Canvas and want to push the new version live, follow these two simple steps:1. Copy the CodeCopy the full, final code of App.jsx from the AI Canvas.Open your local file at t00ls/monosegment/src/App.jsx.Replace everything inside it with the copied code.Save the file.2. Deploy to GitHubOpen your terminal, make sure you are inside the t00ls/monosegment folder, and run:npm run build
npm run deploy
Note: It usually takes GitHub Pages 1-2 minutes to update the live website after you run the deploy command. You may need to refresh your live webpage (Ctrl+F5) to see the changes.
