/* ============================================
   Mockup Editor Pro - Fixed Application
   ============================================ */

(function(window) {
    'use strict';

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
            this.backgroundImage = null;
            this.isUpdatingProperties = false;
        }

        async init() {
            try {
                console.log('Initializing Mockup Editor...');

                // Check dependencies
                if (typeof fabric === 'undefined') {
                    throw new Error('Fabric.js not loaded');
                }
                if (typeof Dexie === 'undefined') {
                    throw new Error('Dexie.js not loaded');
                }
                if (typeof storage === 'undefined') {
                    throw new Error('Storage not loaded');
                }

                // Initialize storage
                const storageOk = await storage.initialize();
                if (!storageOk) {
                    throw new Error('Storage initialization failed');
                }

                // Initialize canvas
                this.initCanvas();

                // Load initial data
                await this.loadMockups();
                await this.loadDesigns();

                // Setup event listeners
                this.setupEventListeners();

                // Show success message
                this.showToast('Mockup Editor loaded successfully!', 'success');
                console.log('✅ Mockup Editor initialized');

            } catch (error) {
                console.error('Initialization failed:', error);
                this.showToast('Failed to initialize: ' + error.message, 'error');
            }
        }

        initCanvas() {
            try {
                const canvasEl = document.getElementById('mainCanvas');
                if (!canvasEl) {
                    throw new Error('Canvas element not found');
                }

                this.canvas = new fabric.Canvas('mainCanvas', {
                    width: 800,
                    height: 600,
                    backgroundColor: '#ffffff',
                    preserveObjectStacking: true,
                    selection: true
                });

                // Canvas event listeners
                this.canvas.on('selection:created', () => this.updatePropertiesPanel());
                this.canvas.on('selection:updated', () => this.updatePropertiesPanel());
                this.canvas.on('selection:cleared', () => this.updatePropertiesPanel());
                this.canvas.on('object:modified', () => this.updatePropertiesPanel());
                this.canvas.on('object:moving', (e) => this.handleSnapping(e));
                this.canvas.on('object:scaling', (e) => this.handleAspectRatio(e));

                console.log('✅ Canvas initialized');
            } catch (error) {
                console.error('Canvas initialization failed:', error);
                throw error;
            }
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
                btn.addEventListener('click', (e) => {
                    this.currentCategory = e.target.dataset.category;
                    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.loadMockups();
                });
            });

            // Toolbar actions
            document.getElementById('addPlaceholderBtn').addEventListener('click', () => this.addPlaceholder());
            document.getElementById('removePlaceholderBtn').addEventListener('click', () => this.removeSelected());
            document.getElementById('duplicatePlaceholderBtn').addEventListener('click', () => this.duplicateSelected());
            document.getElementById('toggleGridBtn').addEventListener('click', (e) => this.toggleGrid(e.target));
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

            console.log('✅ Event listeners setup');
        }

        setupPropertiesListeners() {
            // Transform properties with debounce
            ['propX', 'propY', 'propWidth', 'propHeight', 'propRotation'].forEach(id => {
                const input = document.getElementById(id);
                let timeout;
                input.addEventListener('input', () => {
                    clearTimeout(timeout);
                    timeout = setTimeout(() => this.updateSelectedObject(), 300);
                });
            });

            // Opacity
            const opacityInput = document.getElementById('propOpacity');
            opacityInput.addEventListener('input', (e) => {
                document.getElementById('opacityValue').textContent = e.target.value + '%';
                this.updateSelectedObject();
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
                    const locked = e.target.checked;
                    obj.set({
                        lockMovementX: locked,
                        lockMovementY: locked,
                        lockRotation: locked,
                        lockScalingX: locked,
                        lockScalingY: locked,
                        selectable: !locked,
                        evented: !locked
                    });
                    this.canvas.renderAll();
                }
            });

            // Apply design button
            document.getElementById('applyDesignBtn').addEventListener('click', () => this.applyDesignToPlaceholder());
        }

        // ===== MOCKUP MANAGEMENT =====
        async loadMockups() {
            try {
                const mockups = await storage.getMockups(this.currentCategory);
                const mockupList = document.getElementById('mockupList');
                mockupList.innerHTML = '';

                if (mockups.length === 0) {
                    mockupList.innerHTML = '<div class="empty-state">No mockups found</div>';
                    return;
                }

                mockups.forEach(mockup => {
                    const item = this.createMockupItem(mockup);
                    mockupList.appendChild(item);
                });

                console.log('✅ Loaded', mockups.length, 'mockups');
            } catch (error) {
                console.error('Failed to load mockups:', error);
                this.showToast('Failed to load mockups', 'error');
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
            meta.textContent = mockup.width + ' × ' + mockup.height;

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

            this.showLoading(true, 'Uploading mockups...');

            for (const file of files) {
                try {
                    // File size check (10MB limit)
                    if (file.size > 10 * 1024 * 1024) {
                        this.showToast('File too large: ' + file.name + ' (max 10MB)', 'error');
                        continue;
                    }

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

                    console.log('✅ Uploaded:', file.name);
                } catch (error) {
                    console.error('Failed to upload mockup:', error);
                    this.showToast('Failed to upload: ' + file.name, 'error');
                }
            }

            await this.loadMockups();
            this.showLoading(false);
            this.showToast('Mockup(s) uploaded successfully!', 'success');
            e.target.value = '';
        }

        async loadMockupToCanvas(mockup) {
            try {
                this.showLoading(true, 'Loading mockup...');

                // Clear canvas
                this.canvas.clear();
                this.canvas.backgroundColor = '#ffffff';

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
                this.backgroundImage = fabricImage;

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
                const activeItem = document.querySelector('[data-id="' + mockup.id + '"]');
                if (activeItem) {
                    activeItem.classList.add('active');
                }

                document.getElementById('canvasSize').textContent = mockup.width + ' × ' + mockup.height;

                this.showLoading(false);
                this.showToast('Loaded: ' + mockup.name, 'success');
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
                await this.loadMockups();

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


        // ===== DESIGN MANAGEMENT =====
        async loadDesigns() {
            try {
                const designs = await storage.getDesigns();
                const designList = document.getElementById('designList');
                designList.innerHTML = '';

                if (designs.length === 0) {
                    designList.innerHTML = '<div class="empty-state">No designs uploaded yet</div>';
                    return;
                }

                designs.forEach(design => {
                    const item = this.createDesignItem(design);
                    designList.appendChild(item);
                });

                console.log('✅ Loaded', designs.length, 'designs');
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

            this.showLoading(true, 'Uploading designs...');

            for (const file of files) {
                try {
                    // File size check
                    if (file.size > 10 * 1024 * 1024) {
                        this.showToast('File too large: ' + file.name, 'error');
                        continue;
                    }

                    const imageData = await this.fileToBase64(file);

                    await storage.addDesign({
                        name: file.name.replace(/\.[^/.]+$/, ''),
                        imageData: imageData
                    });

                    console.log('✅ Uploaded:', file.name);
                } catch (error) {
                    console.error('Failed to upload design:', error);
                    this.showToast('Failed to upload: ' + file.name, 'error');
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

            const selectedItem = document.querySelector('.design-item[data-id="' + design.id + '"]');
            if (selectedItem) {
                selectedItem.classList.add('selected');
            }

            this.showToast('Selected: ' + design.name, 'success');
        }

        async deleteDesign(id) {
            if (!confirm('Delete this design?')) return;

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
                lockAspectRatio: false
            });

            this.canvas.add(rect);
            this.canvas.setActiveObject(rect);
            this.canvas.renderAll();
            this.updatePropertiesPanel();

            this.showToast('Placeholder added', 'success');
        }

        async recreatePlaceholder(data) {
            const rect = new fabric.Rect({
                left: data.x || 0,
                top: data.y || 0,
                width: data.width || 300,
                height: data.height || 300,
                angle: data.rotation || 0,
                fill: 'rgba(59, 130, 246, 0.3)',
                stroke: '#3b82f6',
                strokeWidth: 3,
                strokeDashArray: [10, 5],
                cornerColor: '#3b82f6',
                cornerSize: 12,
                transparentCorners: false,
                isPlaceholder: true,
                lockAspectRatio: false,
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
                this.showToast('Object deleted', 'success');
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
                this.showToast('Object duplicated', 'success');
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
            this.showToast('Object centered', 'success');
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
                this.showLoading(true, 'Applying design...');

                const imgObj = await this.loadImage(this.selectedDesign.imageData);

                // Calculate scaling to fit placeholder
                const scaleX = placeholder.getScaledWidth() / imgObj.width;
                const scaleY = placeholder.getScaledHeight() / imgObj.height;

                const fabricImage = new fabric.Image(imgObj, {
                    left: placeholder.left,
                    top: placeholder.top,
                    angle: placeholder.angle,
                    scaleX: scaleX,
                    scaleY: scaleY,
                    opacity: placeholder.opacity || 1
                });

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
            if (this.isUpdatingProperties) return;

            const obj = this.canvas.getActiveObject();
            const noSelection = document.getElementById('noSelectionMsg');
            const content = document.getElementById('propertiesContent');

            if (!obj) {
                noSelection.style.display = 'block';
                content.style.display = 'none';
                document.getElementById('objectInfo').textContent = '';
                return;
            }

            noSelection.style.display = 'none';
            content.style.display = 'block';

            this.isUpdatingProperties = true;

            // Transform
            document.getElementById('propX').value = Math.round(obj.left);
            document.getElementById('propY').value = Math.round(obj.top);
            document.getElementById('propWidth').value = Math.round(obj.getScaledWidth());
            document.getElementById('propHeight').value = Math.round(obj.getScaledHeight());
            document.getElementById('propRotation').value = Math.round(obj.angle);

            // Opacity
            const opacity = Math.round((obj.opacity || 1) * 100);
            document.getElementById('propOpacity').value = opacity;
            document.getElementById('opacityValue').textContent = opacity + '%';

            // Lock state
            document.getElementById('lockObject').checked = obj.lockMovementX || false;
            document.getElementById('lockAspectRatio').checked = obj.lockAspectRatio || false;

            // Info
            const type = obj.isPlaceholder ? 'Placeholder' : 'Design';
            document.getElementById('objectInfo').textContent = type;

            this.isUpdatingProperties = false;
        }

        updateSelectedObject() {
            if (this.isUpdatingProperties) return;

            const obj = this.canvas.getActiveObject();
            if (!obj) return;

            try {
                const x = parseFloat(document.getElementById('propX').value) || 0;
                const y = parseFloat(document.getElementById('propY').value) || 0;
                const width = parseFloat(document.getElementById('propWidth').value) || 10;
                const height = parseFloat(document.getElementById('propHeight').value) || 10;
                const rotation = parseFloat(document.getElementById('propRotation').value) || 0;
                const opacity = parseFloat(document.getElementById('propOpacity').value) / 100 || 1;

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
            } catch (error) {
                console.error('Failed to update object:', error);
            }
        }

        applyAspectRatio() {
            const obj = this.canvas.getActiveObject();
            if (!obj) return;

            const ratio = document.getElementById('aspectRatioSelect').value;
            if (ratio === 'free') return;

            try {
                const [w, h] = ratio.split(':').map(Number);
                const currentWidth = obj.getScaledWidth();
                const newHeight = (currentWidth / w) * h;

                obj.set({
                    scaleY: newHeight / obj.height
                });

                obj.setCoords();
                this.canvas.renderAll();
                this.updatePropertiesPanel();
            } catch (error) {
                console.error('Failed to apply aspect ratio:', error);
            }
        }

        handleAspectRatio(e) {
            const obj = e.target;
            if (obj.lockAspectRatio) {
                const scale = Math.max(obj.scaleX, obj.scaleY);
                obj.set({ scaleX: scale, scaleY: scale });
            }
        }


        // ===== SNAPPING & GRID =====
        handleSnapping(e) {
            if (!this.snapEnabled) return;

            const obj = e.target;
            const snapZone = 10;
            const canvasWidth = this.canvas.width;
            const canvasHeight = this.canvas.height;

            // Snap to canvas edges
            if (Math.abs(obj.left) < snapZone) obj.left = 0;
            if (Math.abs(obj.top) < snapZone) obj.top = 0;
            if (Math.abs(obj.left + obj.getScaledWidth() - canvasWidth) < snapZone) {
                obj.left = canvasWidth - obj.getScaledWidth();
            }
            if (Math.abs(obj.top + obj.getScaledHeight() - canvasHeight) < snapZone) {
                obj.top = canvasHeight - obj.getScaledHeight();
            }

            // Snap to center
            const centerX = canvasWidth / 2;
            const centerY = canvasHeight / 2;
            const objCenterX = obj.left + obj.getScaledWidth() / 2;
            const objCenterY = obj.top + obj.getScaledHeight() / 2;

            if (Math.abs(objCenterX - centerX) < snapZone) {
                obj.left = centerX - obj.getScaledWidth() / 2;
            }
            if (Math.abs(objCenterY - centerY) < snapZone) {
                obj.top = centerY - obj.getScaledHeight() / 2;
            }

            obj.setCoords();
        }

        toggleSnap(btn) {
            this.snapEnabled = !this.snapEnabled;
            btn.classList.toggle('active');
            this.showToast('Snapping ' + (this.snapEnabled ? 'enabled' : 'disabled'), 'info');
        }

        toggleGrid(btn) {
            this.gridEnabled = !this.gridEnabled;
            btn.classList.toggle('active');

            if (this.gridEnabled) {
                this.drawGrid();
            } else {
                this.canvas.overlayImage = null;
                this.canvas.renderAll();
            }

            this.showToast('Grid ' + (this.gridEnabled ? 'enabled' : 'disabled'), 'info');
        }

        drawGrid() {
            const canvas = document.createElement('canvas');
            canvas.width = this.canvas.width;
            canvas.height = this.canvas.height;
            const ctx = canvas.getContext('2d');

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1;

            for (let i = 0; i < canvas.width; i += this.gridSize) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }

            for (let i = 0; i < canvas.height; i += this.gridSize) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }

            const gridImage = new fabric.Image(canvas, {
                selectable: false,
                evented: false
            });

            this.canvas.setOverlayImage(gridImage, this.canvas.renderAll.bind(this.canvas));
        }

        // ===== EXPORT =====
        openExportModal() {
            if (!this.currentMockup) {
                this.showToast('Please load a mockup first', 'warning');
                return;
            }
            document.getElementById('exportModal').style.display = 'flex';
        }

        closeModals() {
            document.getElementById('exportModal').style.display = 'none';
        }

        async exportMockup() {
            try {
                this.closeModals();
                this.showLoading(true, 'Exporting mockup...');

                const format = document.getElementById('exportFormat').value;
                const quality = parseFloat(document.getElementById('exportQuality').value);
                const scale = parseInt(document.getElementById('exportScale').value);
                const filename = document.getElementById('exportFilename').value || 'mockup-export';

                // Temporarily remove overlay (grid)
                const overlay = this.canvas.overlayImage;
                this.canvas.overlayImage = null;

                // Deselect all
                this.canvas.discardActiveObject();
                this.canvas.renderAll();

                // Export with scaling
                const dataURL = this.canvas.toDataURL({
                    format: format,
                    quality: quality,
                    multiplier: scale
                });

                // Restore overlay
                this.canvas.overlayImage = overlay;
                this.canvas.renderAll();

                // Download
                this.downloadDataURL(dataURL, filename + '.' + format);

                this.showLoading(false);
                this.showToast('Mockup exported successfully!', 'success');
            } catch (error) {
                console.error('Export failed:', error);
                this.showLoading(false);
                this.showToast('Export failed', 'error');
            }
        }

        // ===== SAVE =====
        async saveAll() {
            if (!this.currentMockup || !this.currentMockupId) {
                this.showToast('No mockup loaded', 'warning');
                return;
            }

            try {
                this.showLoading(true, 'Saving...');

                // Delete old placeholders
                await storage.deleteAllPlaceholders(this.currentMockupId);

                // Save current placeholders
                const objects = this.canvas.getObjects();
                for (const obj of objects) {
                    if (obj.isPlaceholder) {
                        await storage.savePlaceholder({
                            mockupId: this.currentMockupId,
                            x: obj.left,
                            y: obj.top,
                            width: obj.width * obj.scaleX,
                            height: obj.height * obj.scaleY,
                            rotation: obj.angle,
                            opacity: obj.opacity
                        });
                    }
                }

                this.showLoading(false);
                this.showToast('Changes saved successfully!', 'success');
            } catch (error) {
                console.error('Save failed:', error);
                this.showLoading(false);
                this.showToast('Save failed', 'error');
            }
        }

        // ===== KEYBOARD SHORTCUTS =====
        handleKeyboard(e) {
            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const obj = this.canvas.getActiveObject();
                if (obj && document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.removeSelected();
                }
            }

            // Ctrl+D - Duplicate
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                this.duplicateSelected();
            }

            // Ctrl+S - Save
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveAll();
            }

            // Arrow keys - Move object
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                const obj = this.canvas.getActiveObject();
                if (obj && document.activeElement.tagName !== 'INPUT') {
                    e.preventDefault();
                    const step = e.shiftKey ? 10 : 1;

                    switch(e.key) {
                        case 'ArrowUp': obj.top -= step; break;
                        case 'ArrowDown': obj.top += step; break;
                        case 'ArrowLeft': obj.left -= step; break;
                        case 'ArrowRight': obj.left += step; break;
                    }

                    obj.setCoords();
                    this.canvas.renderAll();
                    this.updatePropertiesPanel();
                }
            }
        }

        // ===== UTILITY FUNCTIONS =====
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

        downloadDataURL(dataURL, filename) {
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataURL;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

        showLoading(show, text = 'Loading...') {
            const overlay = document.getElementById('loadingOverlay');
            const loadingText = document.getElementById('loadingText');
            overlay.style.display = show ? 'flex' : 'none';
            loadingText.textContent = text;
        }

        showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            toast.className = 'toast toast-' + type;

            const icon = {
                success: '✓',
                error: '✗',
                warning: '⚠',
                info: 'ℹ'
            }[type] || 'ℹ';

            toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span>' + message + '</span>';

            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('toast-show');
            }, 10);

            setTimeout(() => {
                toast.classList.remove('toast-show');
                setTimeout(() => {
                    container.removeChild(toast);
                }, 300);
            }, 3000);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.mockupEditor = new MockupEditor();
            window.mockupEditor.init();
        });
    } else {
        window.mockupEditor = new MockupEditor();
        window.mockupEditor.init();
    }

})(window);
