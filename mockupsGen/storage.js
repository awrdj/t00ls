/* ============================================
   Storage Manager - Fixed Version
   ============================================ */

(function(window) {
    'use strict';

    // Initialize Dexie Database
    const db = new Dexie('MockupEditorDB');

    db.version(1).stores({
        mockups: '++id, name, category, isUserCreated, createdAt',
        designs: '++id, name, uploadedAt',
        placeholders: '++id, mockupId, createdAt',
        settings: 'key'
    });

    // Storage Manager Class
    class StorageManager {
        constructor() {
            this.db = db;
            this.initialized = false;
            this.maxFileSize = 10 * 1024 * 1024; // 10MB limit
        }

        async initialize() {
            try {
                await this.db.open();
                console.log('✅ Database opened successfully');

                // Seed default mockups if empty
                const count = await this.db.mockups.count();
                if (count === 0) {
                    await this.seedDefaultMockups();
                }

                this.initialized = true;
                return true;
            } catch (error) {
                console.error('Storage initialization failed:', error);
                return false;
            }
        }

        async seedDefaultMockups() {
            console.log('Seeding default mockups...');

            const defaultMockups = [
                {
                    name: 'White T-Shirt Front',
                    category: 'apparel',
                    isUserCreated: false,
                    imageData: this.generatePlaceholderImage(800, 1000, 'T-Shirt Front', '#ffffff'),
                    width: 800,
                    height: 1000,
                    createdAt: Date.now()
                },
                {
                    name: 'Black T-Shirt',
                    category: 'apparel',
                    isUserCreated: false,
                    imageData: this.generatePlaceholderImage(800, 1000, 'Black Tee', '#1a1a1a'),
                    width: 800,
                    height: 1000,
                    createdAt: Date.now()
                },
                {
                    name: 'Hoodie',
                    category: 'apparel',
                    isUserCreated: false,
                    imageData: this.generatePlaceholderImage(900, 1100, 'Hoodie', '#4a5568'),
                    width: 900,
                    height: 1100,
                    createdAt: Date.now()
                },
                {
                    name: 'White Mug',
                    category: 'accessories',
                    isUserCreated: false,
                    imageData: this.generatePlaceholderImage(600, 600, 'Mug', '#f5f5f5'),
                    width: 600,
                    height: 600,
                    createdAt: Date.now()
                },
                {
                    name: 'Tote Bag',
                    category: 'accessories',
                    isUserCreated: false,
                    imageData: this.generatePlaceholderImage(700, 800, 'Tote Bag', '#e8e8e8'),
                    width: 700,
                    height: 800,
                    createdAt: Date.now()
                }
            ];

            try {
                await this.db.mockups.bulkAdd(defaultMockups);
                console.log('✅ Default mockups seeded');
            } catch (error) {
                console.error('Failed to seed mockups:', error);
            }
        }

        generatePlaceholderImage(width, height, text, bgColor) {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, width, height);

            // Border
            ctx.strokeStyle = '#cccccc';
            ctx.lineWidth = 2;
            ctx.strokeRect(10, 10, width - 20, height - 20);

            // Text
            ctx.fillStyle = '#999999';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, width / 2, height / 2);

            ctx.font = '24px Arial';
            ctx.fillText(width + ' × ' + height, width / 2, height / 2 + 50);

            return canvas.toDataURL('image/png', 0.8);
        }

        // Compress image if too large
        async compressImage(imageData, maxWidth = 2500) {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    // Check if compression needed
                    if (img.width <= maxWidth && img.height <= maxWidth) {
                        resolve(imageData);
                        return;
                    }

                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > height && width > maxWidth) {
                        height = (height / width) * maxWidth;
                        width = maxWidth;
                    } else if (height > maxWidth) {
                        width = (width / height) * maxWidth;
                        height = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/png', 0.85));
                };
                img.src = imageData;
            });
        }

        // ===== MOCKUPS =====
        async addMockup(mockupData) {
            try {
                // Compress if needed
                if (mockupData.imageData) {
                    mockupData.imageData = await this.compressImage(mockupData.imageData);
                }

                const id = await this.db.mockups.add({
                    ...mockupData,
                    createdAt: Date.now()
                });
                console.log('✅ Mockup added:', id);
                return id;
            } catch (error) {
                console.error('Failed to add mockup:', error);
                throw error;
            }
        }

        async getMockups(category = 'all') {
            try {
                let mockups;
                if (category === 'all') {
                    mockups = await this.db.mockups.toArray();
                } else {
                    mockups = await this.db.mockups.where('category').equals(category).toArray();
                }
                return mockups;
            } catch (error) {
                console.error('Failed to get mockups:', error);
                return [];
            }
        }

        async getMockupById(id) {
            try {
                return await this.db.mockups.get(id);
            } catch (error) {
                console.error('Failed to get mockup:', error);
                return null;
            }
        }

        async deleteMockup(id) {
            try {
                await this.db.mockups.delete(id);
                await this.db.placeholders.where('mockupId').equals(id).delete();
                console.log('✅ Mockup deleted:', id);
                return true;
            } catch (error) {
                console.error('Failed to delete mockup:', error);
                return false;
            }
        }

        // ===== DESIGNS =====
        async addDesign(designData) {
            try {
                // Compress if needed
                if (designData.imageData) {
                    designData.imageData = await this.compressImage(designData.imageData, 2000);
                }

                const id = await this.db.designs.add({
                    ...designData,
                    uploadedAt: Date.now()
                });
                console.log('✅ Design added:', id);
                return id;
            } catch (error) {
                console.error('Failed to add design:', error);
                throw error;
            }
        }

        async getDesigns() {
            try {
                return await this.db.designs.orderBy('uploadedAt').reverse().toArray();
            } catch (error) {
                console.error('Failed to get designs:', error);
                return [];
            }
        }

        async getDesignById(id) {
            try {
                return await this.db.designs.get(id);
            } catch (error) {
                console.error('Failed to get design:', error);
                return null;
            }
        }

        async deleteDesign(id) {
            try {
                await this.db.designs.delete(id);
                console.log('✅ Design deleted:', id);
                return true;
            } catch (error) {
                console.error('Failed to delete design:', error);
                return false;
            }
        }

        // ===== PLACEHOLDERS =====
        async savePlaceholder(placeholderData) {
            try {
                const id = await this.db.placeholders.add({
                    ...placeholderData,
                    createdAt: Date.now()
                });
                return id;
            } catch (error) {
                console.error('Failed to save placeholder:', error);
                throw error;
            }
        }

        async getPlaceholdersByMockup(mockupId) {
            try {
                return await this.db.placeholders.where('mockupId').equals(mockupId).toArray();
            } catch (error) {
                console.error('Failed to get placeholders:', error);
                return [];
            }
        }

        async deletePlaceholder(id) {
            try {
                await this.db.placeholders.delete(id);
                return true;
            } catch (error) {
                console.error('Failed to delete placeholder:', error);
                return false;
            }
        }

        async deleteAllPlaceholders(mockupId) {
            try {
                await this.db.placeholders.where('mockupId').equals(mockupId).delete();
                return true;
            } catch (error) {
                console.error('Failed to delete placeholders:', error);
                return false;
            }
        }

        // ===== SETTINGS =====
        async saveSetting(key, value) {
            try {
                await this.db.settings.put({ key, value });
                return true;
            } catch (error) {
                console.error('Failed to save setting:', error);
                return false;
            }
        }

        async getSetting(key, defaultValue = null) {
            try {
                const setting = await this.db.settings.get(key);
                return setting ? setting.value : defaultValue;
            } catch (error) {
                console.error('Failed to get setting:', error);
                return defaultValue;
            }
        }

        // ===== UTILITY =====
        async clearAllData() {
            try {
                await this.db.mockups.where('isUserCreated').equals(true).delete();
                await this.db.designs.clear();
                await this.db.placeholders.clear();
                console.log('✅ User data cleared');
                return true;
            } catch (error) {
                console.error('Failed to clear data:', error);
                return false;
            }
        }

        async getStorageSize() {
            try {
                const mockups = await this.db.mockups.toArray();
                const designs = await this.db.designs.toArray();
                let size = 0;

                mockups.forEach(m => size += (m.imageData?.length || 0));
                designs.forEach(d => size += (d.imageData?.length || 0));

                return {
                    bytes: size,
                    mb: (size / (1024 * 1024)).toFixed(2),
                    mockupCount: mockups.length,
                    designCount: designs.length
                };
            } catch (error) {
                console.error('Failed to get storage size:', error);
                return { bytes: 0, mb: '0', mockupCount: 0, designCount: 0 };
            }
        }
    }

    // Create global instance
    window.storage = new StorageManager();
    console.log('✅ Storage manager loaded');

})(window);
