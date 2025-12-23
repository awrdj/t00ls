/* ============================================
   Mockup Editor Pro - Main Application
   ============================================ */

import { storage } from './storage.js';

class MockupEditor {
    constructor() {
        this.canvas = null;
        this.currentMockup = null;
        this.currentMockupId = null;
        this.selectedDesign = null;
        this.selectedDesignId = null;
        this.snapEnabled = true;
        this.gridEnabled = false;
        this.gridSize = 20;
        this.currentCategory = 'all';

        this.init();
    }

    async init() {
        try {
            // Initialize storage
            await storage.initialize();

            // Initialize Fabric.js canvas
            this.initCanvas();

            // Load initial data
            await this.loadMockups();
            await this.loadDesigns();

            // Setup event listeners
            this.setupEventListeners();

            // Show toast
            this.showToast('Mockup Editor loaded successfully!', 'success');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showToast('Failed to initialize editor', 'error');
        }
    }

    initCanvas() {
        const canvasEl = document.getElementById('mainCanvas');
        this.canvas = new fabric.Canvas(canvasEl, {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true
        });

        // Canvas event listeners
        this.canvas.on('selection:created', () => this.updatePropertiesPanel());
        this.canvas.on('selection:updated', () => this.updatePropertiesPanel());
        this.canvas.on('selection:cleared', () => this.updatePropertiesPanel());
        this.canvas.on('object:modified', () => this.updatePropertiesPanel());
        this.canvas.on('object:moving', (e) => this.handleSnapping(e));
        this.canvas.on('object:scaling', (e) => this.handleAspectRatio(e));

        console.log('✅ Canvas initialized');
    }

    setupEventListeners() {
        // Header actions
        document.getElementById('saveAllBtn').addEventListener('click', () => this.saveAll());
        document.getElementById('exportBtn').addEventListener('click', () => this.openExportModal());

        // Mockup management
        document.getElementById('addMockupBtn').addEventListener('click', () => {
            document.getElementById('mockupUpload').click();
        });
        document.getElementById('mockupUpload').addEventListener('change', (e) => this.handleMockupUpload(e));

        // Design management
        document.getElementById('addDesignBtn').addEventListener('click', () => {
            document.getElementById('designUpload').click();
        });
        document.getElementById('designUpload').addEventListener('change', (e) => this.handleDesignUpload(e));

        // Category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.filterByCategory(e.target.dataset.category));
        });

        // Toolbar actions
        document.getElementById('addPlaceholderBtn').addEventListener('click', () => this.addPlaceholder());
        document.getElementById('removePlaceholderBtn').addEventListener('click', () => this.removeSelected());
        document.getElementById('duplicatePlaceholderBtn').addEventListener('click', () => this.duplicateSelected());
        document.getElementById('toggleGridBtn').addEventListener('click', () => this.toggleGrid());
        document.getElementById('toggleSnapBtn').addEventListener('click', (e) => this.toggleSnap(e.target));
        document.getElementById('centerObjectBtn').addEventListener('click', () => this.centerSelected());
        document.getElementById('layerUpBtn').addEventListener('click', () => this.bringForward());
        document.getElementById('layerDownBtn').addEventListener('click', () => this.sendBackward());

        // Properties panel
        this.setupPropertiesListeners();

        // Export modal
        document.getElementById('exportConfirmBtn').addEventListener('click', () => this.exportMockup());
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => this.closeModals());
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    setupPropertiesListeners() {
        // Transform properties
        ['propX', 'propY', 'propWidth', 'propHeight', 'propRotation'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => this.updateSelectedObject());
            }
        });

        // Opacity
        const opacityInput = document.getElementById('propOpacity');
        opacityInput.addEventListener('input', (e) => {
            document.getElementById('opacityValue').textContent = e.target.value + '%';
            this.updateSelectedObject();
        });

        // Brightness
        const brightnessInput = document.getElementById('propBrightness');
        brightnessInput.addEventListener('input', (e) => {
            document.getElementById('brightnessValue').textContent = e.target.value;
            this.applyFilters();
        });

        // Contrast
        const contrastInput = document.getElementById('propContrast');
        contrastInput.addEventListener('input', (e) => {
            document.getElementById('contrastValue').textContent = e.target.value;
            this.applyFilters();
        });

        // Blur
        const blurInput = document.getElementById('propBlur');
        blurInput.addEventListener('input', (e) => {
            document.getElementById('blurValue').textContent = e.target.value;
            this.applyFilters();
        });

        // Aspect ratio
        document.getElementById('aspectRatioSelect').addEventListener('change', () => {
            this.applyAspectRatio();
        });

        document.getElementById('lockAspectRatio').addEventListener('change', (e) => {
            const obj = this.canvas.getActiveObject();
            if (obj) {
                obj.lockAspectRatio = e.target.checked;
            }
        });

        // Lock object
        document.getElementById('lockObject').addEventListener('change', (e) => {
            const obj = this.canvas.getActiveObject();
            if (obj) {
                obj.set({
                    lockMovementX: e.target.checked,
                    lockMovementY: e.target.checked,
                    lockRotation: e.target.checked,
                    lockScalingX: e.target.checked,
                    lockScalingY: e.target.checked,
                    selectable: !e.target.checked,
                    evented: !e.target.checked
                });
                this.canvas.renderAll();
            }
        });

        // Placeholder metadata
        document.getElementById('placeholderName').addEventListener('input', (e) => {
            const obj = this.canvas.getActiveObject();
            if (obj && obj.isPlaceholder) {
                obj.placeholderName = e.target.value;
            }
        });

        document.getElementById('placeholderType').addEventListener('input', (e) => {
            const obj = this.canvas.getActiveObject();
            if (obj && obj.isPlaceholder) {
                obj.placeholderType = e.target.value;
            }
        });

        // Apply design button
        document.getElementById('applyDesignBtn').addEventListener('click', () => this.applyDesignToPlaceholder());
    }

    // ===== MOCKUP MANAGEMENT =====
    async loadMockups(category = 'all') {
        try {
            const mockups = await storage.getMockups(category);
            const mockupList = document.getElementById('mockupList');
            mockupList.innerHTML = '';

            mockups.forEach(mockup => {
                const item = this.createMockupItem(mockup);
                mockupList.appendChild(item);
            });
        } catch (error) {
            console.error('Failed to load mockups:', error);
        }
    }

    createMockupItem(mockup) {
        const div = document.createElement('div');
        div.className = 'mockup-item';
        div.dataset.id = mockup.id;

        const img = document.createElement('img');
        img.src = mockup.imageData;
        img.alt = mockup.name;

        const info = document.createElement('div');
        info.className = 'mockup-item-info';

        const name = document.createElement('div');
        name.className = 'mockup-item-name';
        name.textContent = mockup.name;

        const meta = document.createElement('div');
        meta.className = 'mockup-item-meta';
        meta.textContent = `${mockup.width} × ${mockup.height}`;

        info.appendChild(name);
        info.appendChild(meta);

        div.appendChild(img);
        div.appendChild(info);

        // Delete button for user-created mockups
        if (mockup.isUserCreated) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'mockup-item-delete';
            deleteBtn.innerHTML = '×';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteMockup(mockup.id);
            };
            div.appendChild(deleteBtn);
        }

        div.addEventListener('click', () => this.loadMockupToCanvas(mockup));

        return div;
    }

    async handleMockupUpload(e) {
        const files = e.target.files;
        if (!files.length) return;

        this.showLoading(true);

        for (const file of files) {
            try {
                const imageData = await this.fileToBase64(file);
                const img = await this.loadImage(imageData);

                await storage.addMockup({
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    category: 'custom',
                    isUserCreated: true,
                    imageData: imageData,
                    width: img.width,
                    height: img.height
                });
            } catch (error) {
                console.error('Failed to upload mockup:', error);
                this.showToast(`Failed to upload ${file.name}`, 'error');
            }
        }

        await this.loadMockups(this.currentCategory);
        this.showLoading(false);
        this.showToast('Mockup(s) uploaded successfully!', 'success');
        e.target.value = '';
    }

    async loadMockupToCanvas(mockup) {
        try {
            this.showLoading(true);

            // Clear canvas
            this.canvas.clear();

            // Set canvas size
            this.canvas.setDimensions({
                width: mockup.width,
                height: mockup.height
            });

            // Load mockup image as background
            const imgObj = await this.loadImage(mockup.imageData);
            const fabricImage = new fabric.Image(imgObj, {
                left: 0,
                top: 0,
                selectable: false,
                evented: false,
                width: mockup.width,
                height: mockup.height
            });

            this.canvas.setBackgroundImage(fabricImage, this.canvas.renderAll.bind(this.canvas));

            // Load saved placeholders
            const placeholders = await storage.getPlaceholdersByMockup(mockup.id);
            for (const ph of placeholders) {
                await this.recreatePlaceholder(ph);
            }

            this.currentMockup = mockup;
            this.currentMockupId = mockup.id;

            // Update UI
            document.querySelectorAll('.mockup-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`[data-id="${mockup.id}"]`)?.classList.add('active');

            document.getElementById('canvasSize').textContent = `${mockup.width} × ${mockup.height}`;

            this.showLoading(false);
            this.showToast(`Loaded: ${mockup.name}`, 'success');
        } catch (error) {
            console.error('Failed to load mockup:', error);
            this.showLoading(false);
            this.showToast('Failed to load mockup', 'error');
        }
    }

    async deleteMockup(id) {
        if (!confirm('Delete this mockup? This cannot be undone.')) return;

        try {
            await storage.deleteMockup(id);
            await this.loadMockups(this.currentCategory);

            if (this.currentMockupId === id) {
                this.canvas.clear();
                this.currentMockup = null;
                this.currentMockupId = null;
            }

            this.showToast('Mockup deleted', 'success');
        } catch (error) {
            console.error('Failed to delete mockup:', error);
            this.showToast('Failed to delete mockup', 'error');
        }
    }

    filterByCategory(category) {
        this.currentCategory = category;
        document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        this.loadMockups(category);
    }

    // ===== DESIGN MANAGEMENT =====
    async loadDesigns() {
        try {
            const designs = await storage.getDesigns();
            const designList = document.getElementById('designList');
            designList.innerHTML = '';

            designs.forEach(design => {
                const item = this.createDesignItem(design);
                designList.appendChild(item);
            });
        } catch (error) {
            console.error('Failed to load designs:', error);
        }
    }

    createDesignItem(design) {
        const div = document.createElement('div');
        div.className = 'design-item';
        div.dataset.id = design.id;

        const img = document.createElement('img');
        img.src = design.imageData;
        img.alt = design.name;

        div.appendChild(img);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'design-item-delete';
        deleteBtn.innerHTML = '×';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.deleteDesign(design.id);
        };
        div.appendChild(deleteBtn);

        div.addEventListener('click', () => this.selectDesign(design));

        return div;
    }

    async handleDesignUpload(e) {
        const files = e.target.files;
        if (!files.length) return;

        this.showLoading(true);

        for (const file of files) {
            try {
                const imageData = await this.fileToBase64(file);

                await storage.addDesign({
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    imageData: imageData
                });
            } catch (error) {
                console.error('Failed to upload design:', error);
                this.showToast(`Failed to upload ${file.name}`, 'error');
            }
        }

        await this.loadDesigns();
        this.showLoading(false);
        this.showToast('Design(s) uploaded successfully!', 'success');
        e.target.value = '';
    }

    selectDesign(design) {
        this.selectedDesign = design;
        this.selectedDesignId = design.id;

        document.querySelectorAll('.design-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`.design-item[data-id="${design.id}"]`)?.classList.add('selected');

        this.showToast(`Selected: ${design.name}`, 'success');
    }

    async deleteDesign(id) {
        if (!confirm('Delete this design? This cannot be undone.')) return;

        try {
            await storage.deleteDesign(id);
            await this.loadDesigns();

            if (this.selectedDesignId === id) {
                this.selectedDesign = null;
                this.selectedDesignId = null;
            }

            this.showToast('Design deleted', 'success');
        } catch (error) {
            console.error('Failed to delete design:', error);
            this.showToast('Failed to delete design', 'error');
        }
    }

    // ===== PLACEHOLDER MANAGEMENT =====
    addPlaceholder() {
        if (!this.currentMockup) {
            this.showToast('Please load a mockup first', 'warning');
            return;
        }

        const rect = new fabric.Rect({
            left: this.canvas.width / 2 - 150,
            top: this.canvas.height / 2 - 150,
            width: 300,
            height: 300,
            fill: 'rgba(59, 130, 246, 0.3)',
            stroke: '#3b82f6',
            strokeWidth: 3,
            strokeDashArray: [10, 5],
            cornerColor: '#3b82f6',
            cornerSize: 12,
            transparentCorners: false,
            isPlaceholder: true,
            placeholderName: 'Placeholder ' + (this.canvas.getObjects().length + 1),
            placeholderType: 'design'
        });

        this.canvas.add(rect);
        this.canvas.setActiveObject(rect);
        this.canvas.renderAll();
        this.updatePropertiesPanel();
    }

    async recreatePlaceholder(data) {
        const rect = new fabric.Rect({
            left: data.x,
            top: data.y,
            width: data.width,
            height: data.height,
            angle: data.rotation || 0,
            fill: 'rgba(59, 130, 246, 0.3)',
            stroke: '#3b82f6',
            strokeWidth: 3,
            strokeDashArray: [10, 5],
            cornerColor: '#3b82f6',
            cornerSize: 12,
            transparentCorners: false,
            isPlaceholder: true,
            placeholderName: data.name || 'Placeholder',
            placeholderType: data.type || 'design',
            lockMovementX: data.locked || false,
            lockMovementY: data.locked || false,
            lockRotation: data.locked || false,
            lockScalingX: data.locked || false,
            lockScalingY: data.locked || false,
            selectable: !data.locked,
            evented: !data.locked,
            dbId: data.id
        });

        this.canvas.add(rect);
    }

    removeSelected() {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) {
            this.showToast('No object selected', 'warning');
            return;
        }

        if (confirm('Delete selected object?')) {
            this.canvas.remove(activeObject);
            this.canvas.renderAll();
            this.updatePropertiesPanel();
        }
    }

    duplicateSelected() {
        const activeObject = this.canvas.getActiveObject();
        if (!activeObject) {
            this.showToast('No object selected', 'warning');
            return;
        }

        activeObject.clone((cloned) => {
            cloned.set({
                left: cloned.left + 20,
                top: cloned.top + 20
            });
            this.canvas.add(cloned);
            this.canvas.setActiveObject(cloned);
            this.canvas.renderAll();
        });
    }

    centerSelected() {
        const obj = this.canvas.getActiveObject();
        if (!obj) {
            this.showToast('No object selected', 'warning');
            return;
        }

        obj.center();
        this.canvas.renderAll();
        this.updatePropertiesPanel();
    }

    bringForward() {
        const obj = this.canvas.getActiveObject();
        if (obj) {
            this.canvas.bringForward(obj);
            this.canvas.renderAll();
        }
    }

    sendBackward() {
        const obj = this.canvas.getActiveObject();
        if (obj) {
            this.canvas.sendBackwards(obj);
            this.canvas.renderAll();
        }
    }


    
    // ===== DESIGN APPLICATION =====
    async applyDesignToPlaceholder() {
        const placeholder = this.canvas.getActiveObject();

        if (!placeholder || !placeholder.isPlaceholder) {
            this.showToast('Please select a placeholder first', 'warning');
            return;
        }

        if (!this.selectedDesign) {
            this.showToast('Please select a design first', 'warning');
            return;
        }

        try {
            this.showLoading(true);

            const imgObj = await this.loadImage(this.selectedDesign.imageData);
            const fabricImage = new fabric.Image(imgObj, {
                left: placeholder.left,
                top: placeholder.top,
                angle: placeholder.angle,
                scaleX: placeholder.width / imgObj.width,
                scaleY: placeholder.height / imgObj.height,
                opacity: placeholder.opacity || 1
            });

            // Copy filters from placeholder
            if (placeholder.filters && placeholder.filters.length > 0) {
                fabricImage.filters = [...placeholder.filters];
                fabricImage.applyFilters();
            }

            // Remove placeholder and add image
            const index = this.canvas.getObjects().indexOf(placeholder);
            this.canvas.remove(placeholder);
            this.canvas.insertAt(fabricImage, index);
            this.canvas.setActiveObject(fabricImage);
            this.canvas.renderAll();

            this.showLoading(false);
            this.showToast('Design applied successfully!', 'success');
        } catch (error) {
            console.error('Failed to apply design:', error);
            this.showLoading(false);
            this.showToast('Failed to apply design', 'error');
        }
    }

    // ===== PROPERTIES PANEL =====
    updatePropertiesPanel() {
        const obj = this.canvas.getActiveObject();
        const noSelection = document.getElementById('noSelectionMsg');
        const content = document.getElementById('propertiesContent');
        const metadataGroup = document.getElementById('placeholderMetadataGroup');

        if (!obj) {
            noSelection.style.display = 'block';
            content.style.display = 'none';
            return;
        }

        noSelection.style.display = 'none';
        content.style.display = 'block';

        // Transform
        document.getElementById('propX').value = Math.round(obj.left);
        document.getElementById('propY').value = Math.round(obj.top);
        document.getElementById('propWidth').value = Math.round(obj.width * obj.scaleX);
        document.getElementById('propHeight').value = Math.round(obj.height * obj.scaleY);
        document.getElementById('propRotation').value = Math.round(obj.angle);

        // Opacity
        const opacity = Math.round((obj.opacity || 1) * 100);
        document.getElementById('propOpacity').value = opacity;
        document.getElementById('opacityValue').textContent = opacity + '%';

        // Lock state
        document.getElementById('lockObject').checked = obj.lockMovementX || false;
        document.getElementById('lockAspectRatio').checked = obj.lockAspectRatio || false;

        // Placeholder metadata
        if (obj.isPlaceholder) {
            metadataGroup.style.display = 'block';
            document.getElementById('placeholderName').value = obj.placeholderName || '';
            document.getElementById('placeholderType').value = obj.placeholderType || '';
        } else {
            metadataGroup.style.display = 'none';
        }
    }

    updateSelectedObject() {
        const obj = this.canvas.getActiveObject();
        if (!obj) return;

        const x = parseFloat(document.getElementById('propX').value);
        const y = parseFloat(document.getElementById('propY').value);
        const width = parseFloat(document.getElementById('propWidth').value);
        const height = parseFloat(document.getElementById('propHeight').value);
        const rotation = parseFloat(document.getElementById('propRotation').value);
        const opacity = parseFloat(document.getElementById('propOpacity').value) / 100;

        obj.set({
            left: x,
            top: y,
            scaleX: width / obj.width,
            scaleY: height / obj.height,
            angle: rotation,
            opacity: opacity
        });

        obj.setCoords();
        this.canvas.renderAll();
    }

    applyFilters() {
        const obj = this.canvas.getActiveObject();
        if (!obj || !obj.filters) return;

        const brightness = parseFloat(document.getElementById('propBrightness').value) / 100;
        const contrast = parseFloat(document.getElementById('propContrast').value) / 100;
        const blur = parseFloat(document.getElementById('propBlur').value);

        obj.filters = [];

        if (brightness !== 0) {
            obj.filters.push(new fabric.Image.filters.Brightness({ brightness }));
        }

        if (contrast !== 0) {
            obj.filters.push(new fabric.Image.filters.Contrast({ contrast }));
        }

        if (blur > 0) {
            obj.filters.push(new fabric.Image.filters.Blur({ blur }));
        }

        obj.applyFilters();
        this.canvas.renderAll();
    }

    applyAspectRatio() {
        const obj = this.canvas.getActiveObject();
        if (!obj) return;

        const ratio = document.getElementById('aspectRatioSelect').value;
        if (ratio === 'free') return;

        const [w, h] = ratio.split(':').map(Number);
        const currentWidth = obj.width * obj.scaleX;
        const newHeight = (currentWidth / w) * h;

        obj.set({
            scaleY: newHeight / obj.height
        });

        obj.setCoords();
        this.canvas.renderAll();
        this.updatePropertiesPanel();
    }

    handleAspectRatio(e) {
        const obj = e.target;
        if (obj.lockAspectRatio) {
            const scaleX = obj.scaleX;
            const scaleY = obj.scaleY;
            const scale = Math.max(scaleX, scaleY);
            obj.set({ scaleX: scale, scaleY: scale });
        }
    }

    // ===== SNAPPING & GRID =====
    handleSnapping(e) {
        if (!this.snapEnabled) return;

        const obj = e.target;
        const snapZone = this.gridSize;

        // Snap to grid
        obj.set({
            left: Math.round(obj.left / snapZone) * snapZone,
            top: Math.round(obj.top / snapZone) * snapZone
        });

        // Snap to canvas center
        const canvasCenterX = this.canvas.width / 2;
        const canvasCenterY = this.canvas.height / 2;
        const objCenterX = obj.left + (obj.width * obj.scaleX) / 2;
        const objCenterY = obj.top + (obj.height * obj.scaleY) / 2;

        if (Math.abs(objCenterX - canvasCenterX) < snapZone) {
            obj.set({ left: canvasCenterX - (obj.width * obj.scaleX) / 2 });
        }

        if (Math.abs(objCenterY - canvasCenterY) < snapZone) {
            obj.set({ top: canvasCenterY - (obj.height * obj.scaleY) / 2 });
        }
    }

    toggleSnap(btn) {
        this.snapEnabled = !this.snapEnabled;
        btn.classList.toggle('active', this.snapEnabled);
        this.showToast(`Snapping ${this.snapEnabled ? 'enabled' : 'disabled'}`, 'success');
    }

    toggleGrid() {
        this.gridEnabled = !this.gridEnabled;

        if (this.gridEnabled) {
            this.drawGrid();
            document.getElementById('toggleGridBtn').classList.add('active');
        } else {
            this.canvas.overlayImage = null;
            this.canvas.renderAll();
            document.getElementById('toggleGridBtn').classList.remove('active');
        }
    }

    drawGrid() {
        const gridCanvas = document.createElement('canvas');
        gridCanvas.width = this.canvas.width;
        gridCanvas.height = this.canvas.height;
        const ctx = gridCanvas.getContext('2d');

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += this.gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }

        const gridImage = new fabric.Image(gridCanvas, {
            selectable: false,
            evented: false
        });

        this.canvas.setOverlayImage(gridImage, this.canvas.renderAll.bind(this.canvas));
    }

    // ===== SAVE & EXPORT =====
    async saveAll() {
        if (!this.currentMockupId) {
            this.showToast('No mockup loaded', 'warning');
            return;
        }

        try {
            this.showLoading(true);

            // Save all placeholders
            const objects = this.canvas.getObjects().filter(obj => obj.isPlaceholder);

            for (const obj of objects) {
                await storage.savePlaceholder({
                    id: obj.dbId,
                    mockupId: this.currentMockupId,
                    name: obj.placeholderName || 'Placeholder',
                    type: obj.placeholderType || 'design',
                    x: obj.left,
                    y: obj.top,
                    width: obj.width * obj.scaleX,
                    height: obj.height * obj.scaleY,
                    rotation: obj.angle,
                    locked: obj.lockMovementX || false
                });
            }

            this.showLoading(false);
            this.showToast('All changes saved!', 'success');
        } catch (error) {
            console.error('Failed to save:', error);
            this.showLoading(false);
            this.showToast('Failed to save changes', 'error');
        }
    }

    openExportModal() {
        if (!this.currentMockup) {
            this.showToast('Please load a mockup first', 'warning');
            return;
        }

        document.getElementById('exportModal').classList.add('active');
        document.getElementById('exportFilename').value = 
            this.currentMockup.name.toLowerCase().replace(/\s+/g, '-');
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    async exportMockup() {
        try {
            this.closeModals();
            this.showLoading(true);

            const format = document.getElementById('exportFormat').value;
            const quality = parseFloat(document.getElementById('exportQuality').value);
            const dpi = parseInt(document.getElementById('exportDPI').value);
            const scale = parseInt(document.getElementById('exportScale').value);
            const filename = document.getElementById('exportFilename').value || 'mockup-export';

            // Hide placeholders temporarily
            const placeholders = this.canvas.getObjects().filter(obj => obj.isPlaceholder);
            placeholders.forEach(ph => ph.set('visible', false));
            this.canvas.renderAll();

            // Export with scale
            const dataURL = this.canvas.toDataURL({
                format: format,
                quality: quality,
                multiplier: scale
            });

            // Restore placeholders
            placeholders.forEach(ph => ph.set('visible', true));
            this.canvas.renderAll();

            // Download
            const link = document.createElement('a');
            link.download = `${filename}.${format}`;
            link.href = dataURL;
            link.click();

            this.showLoading(false);
            this.showToast(`Exported as ${format.toUpperCase()} at ${dpi} DPI`, 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showLoading(false);
            this.showToast('Export failed', 'error');
        }
    }

    // ===== KEYBOARD SHORTCUTS =====
    handleKeyboard(e) {
        // Ctrl/Cmd + S: Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveAll();
        }

        // Ctrl/Cmd + E: Export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            this.openExportModal();
        }

        // Delete/Backspace: Remove selected
        if ((e.key === 'Delete' || e.key === 'Backspace') && this.canvas.getActiveObject()) {
            e.preventDefault();
            this.removeSelected();
        }

        // Ctrl/Cmd + D: Duplicate
        if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
            e.preventDefault();
            this.duplicateSelected();
        }

        // Ctrl/Cmd + ]: Bring forward
        if ((e.ctrlKey || e.metaKey) && e.key === ']') {
            e.preventDefault();
            this.bringForward();
        }

        // Ctrl/Cmd + [: Send backward
        if ((e.ctrlKey || e.metaKey) && e.key === '[') {
            e.preventDefault();
            this.sendBackward();
        }
    }

    // ===== UTILITY METHODS =====
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mockupEditor = new MockupEditor();
});
