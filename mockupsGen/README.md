# Mockup Editor Pro 🎨

A powerful, browser-based mockup editor for applying designs to product mockups. Built with Fabric.js and IndexedDB for offline-first performance.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Functionality
- 📦 **Predefined Mockup Library** - T-shirts, hoodies, mugs, tote bags, and more
- 🖼️ **Custom Mockup Upload** - Add your own product mockup images
- 🎯 **Smart Placeholders** - Define areas where designs will be applied
- 🎨 **Design Library** - Upload and manage multiple design files
- 🔄 **One-Click Apply** - Instantly apply designs to placeholders
- 💾 **Offline Storage** - All data stored locally in IndexedDB
- 📥 **High-Quality Export** - Export at up to 4x resolution with custom DPI

### Advanced Editor Features
- ✂️ **Transform Tools** - Resize, rotate, move, and scale objects
- 📐 **Aspect Ratio Control** - Predefined ratios (1:1, 4:3, 16:9) or free-form
- 🔒 **Lock Objects** - Prevent accidental modifications
- 🧲 **Smart Snapping** - Snap to grid and canvas center
- 📊 **Grid Overlay** - Visual guide for precise alignment
- 🎭 **Filters & Effects** - Brightness, contrast, blur adjustments
- 🔀 **Layer Management** - Bring forward, send backward
- 📋 **Duplicate Objects** - Quick copy functionality
- ⌨️ **Keyboard Shortcuts** - Speed up your workflow

### Technical Features
- 🌐 **Mobile-Responsive** - Works on tablets and mobile devices
- ⚡ **Fast Performance** - Canvas-based rendering
- 💽 **Persistent Storage** - Changes saved automatically to IndexedDB
- 🔄 **State Management** - Undo/redo support (via canvas)
- 📦 **No Backend Required** - 100% client-side application
- 🚀 **GitHub Pages Ready** - Deploy anywhere static hosting works

---

## 🚀 Quick Start

### Installation

1. **Clone or download** this repository
2. **No build step required** - pure HTML/CSS/JS
3. **Open \`index.html\`** in a modern browser

### Deploy to GitHub Pages

1. Push code to GitHub repository
2. Go to **Settings** → **Pages**
3. Select **Source**: Deploy from a branch
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**
6. Your app will be live at \`https://[username].github.io/[repo-name]\`

---

## 📖 Usage Guide

### 1. Loading a Mockup

1. Click on any mockup from the **Mockup Library** (left sidebar)
2. The mockup will load on the canvas
3. Use category filters to browse: All, Apparel, Accessories, Custom

### 2. Adding Custom Mockups

1. Click **+ Add Custom Mockup** button
2. Select image file(s) from your computer
3. Supported formats: PNG, JPEG, WebP, SVG
4. Your mockup appears in the "Custom" category

### 3. Creating Placeholders

1. Click **➕ Placeholder** in the toolbar
2. A blue placeholder rectangle appears on canvas
3. **Resize** - Drag corner handles
4. **Rotate** - Drag corner handle while holding
5. **Move** - Drag the object
6. Edit properties in the right **Properties Panel**

### 4. Uploading Designs

1. Click **+ Upload Design** in the Design Library section
2. Select your design files (PNG/JPEG with transparency)
3. Designs appear as thumbnails below

### 5. Applying Designs to Placeholders

1. **Select a placeholder** on the canvas (blue dashed rectangle)
2. **Click a design** from the Design Library (it highlights green)
3. Click **🎨 Apply Selected Design** button
4. Your design replaces the placeholder with proper sizing

### 6. Adjusting Design Properties

Use the **Properties Panel** (right sidebar) to modify:

- **Transform**: X, Y position, width, height, rotation
- **Aspect Ratio**: Lock to 1:1, 4:3, 16:9, or custom
- **Appearance**: Opacity, brightness, contrast, blur
- **Layer Control**: Lock object to prevent editing
- **Metadata**: Name and type for organization

### 7. Saving Your Work

- Click **💾 Save All Changes** in the header
- All placeholders and settings stored in browser's IndexedDB
- Changes persist even after closing browser

### 8. Exporting Final Mockup

1. Click **📥 Export Mockup** button
2. Configure export settings:
   - **Format**: PNG (transparent) or JPEG
   - **Quality**: 70% - 100%
   - **DPI**: 72 (screen) to 600 (high print)
   - **Scale**: 1x to 4x resolution multiplier
   - **Filename**: Custom name
3. Click **Export** to download

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| \`Ctrl/Cmd + S\` | Save all changes |
| \`Ctrl/Cmd + E\` | Open export modal |
| \`Ctrl/Cmd + D\` | Duplicate selected object |
| \`Delete\` / \`Backspace\` | Remove selected object |
| \`Ctrl/Cmd + ]\` | Bring object forward |
| \`Ctrl/Cmd + [\` | Send object backward |

---

## 🛠️ Technical Architecture

### File Structure

\`\`\`
mockup-editor-pro/
│
├── index.html          # Main HTML structure
├── styles.css          # All styling (responsive)
├── app.js             # Main application logic
├── storage.js         # IndexedDB manager (Dexie)
└── README.md          # This file
\`\`\`

### Dependencies (CDN)

- **Fabric.js v5.3.0** - Canvas manipulation library
- **Dexie.js v3.2.4** - IndexedDB wrapper

### Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE11 not supported (uses ES6 modules)

### Storage Limits

- **IndexedDB**: Typically 50% of available disk space per origin
- **Practical limit**: ~1-2 GB before performance degrades
- **Recommendation**: Keep mockup library under 500 MB

---

## 🎯 Use Cases

### E-commerce Product Mockups
Upload product photos → Add design placeholders → Apply customer artwork → Export for listings

### Print-on-Demand
Maintain template library → Quick mockup generation → Bulk design application → Export print-ready files

### Client Presentations
Showcase designs on real products → Multiple variations → Professional exports

### Design Portfolio
Display artwork in realistic settings → Interactive presentations → Easy updates

---

## 🔧 Advanced Configuration

### Custom Grid Size

Edit \`app.js\` line ~14:
\`\`\`javascript
this.gridSize = 20; // Change to 10, 25, 50, etc.
\`\`\`

### Default Canvas Size

Edit \`app.js\` in \`initCanvas()\` method:
\`\`\`javascript
this.canvas = new fabric.Canvas(canvasEl, {
    width: 1200,  // Your width
    height: 800,  // Your height
    // ...
});
\`\`\`

### Adding More Default Mockups

Edit \`storage.js\` in \`seedDefaultMockups()\` method:
\`\`\`javascript
const defaultMockups = [
    // ... existing mockups
    {
        name: 'Your Mockup Name',
        category: 'apparel', // or 'accessories'
        isUserCreated: false,
        imageData: 'data:image/png;base64,...', // Your base64 image
        width: 800,
        height: 1000,
        createdAt: Date.now()
    }
];
\`\`\`

---

## 🐛 Troubleshooting

### Issue: Canvas not loading
**Solution**: Check browser console for errors. Ensure CDN libraries loaded.

### Issue: Images not saving
**Solution**: Check browser storage quota. Clear IndexedDB in DevTools → Application → Storage.

### Issue: Export produces low quality
**Solution**: Increase Scale multiplier to 2x-4x and set DPI to 300+.

### Issue: Mobile layout broken
**Solution**: Ensure viewport meta tag present. Test in browser DevTools mobile view.

### Issue: Designs not applying
**Solution**: Ensure placeholder is selected (blue highlight) and design is clicked (green border).

---

## 🔒 Privacy & Data

- ✅ **100% Client-Side** - No data sent to servers
- ✅ **Local Storage Only** - IndexedDB in your browser
- ✅ **No Cookies** - No tracking or analytics
- ✅ **Offline-First** - Works without internet after first load
- ⚠️ **Clear browser data = Lost work** - Export backups regularly

---

## 📝 License

MIT License - Free to use, modify, and distribute.

---

## 🤝 Contributing

Contributions welcome! Ideas for improvement:

- [ ] Vector shape placeholders (circles, polygons)
- [ ] Warp/perspective transform tools
- [ ] Batch export multiple designs
- [ ] Template marketplace
- [ ] Undo/redo stack
- [ ] Cloud sync (optional)
- [ ] Mobile app version
- [ ] AI-powered auto-placement

---

## 📧 Support

For issues or questions, open a GitHub issue in the repository.

---

## 🎉 Credits

Built with:
- [Fabric.js](http://fabricjs.com/) - Canvas library
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper

---

**Happy Mockup Editing! 🚀**
