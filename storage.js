/* ============================================
   Storage Manager - IndexedDB with Dexie
   ============================================ */

// Initialize Dexie Database
const db = new Dexie('MockupEditorDB');

db.version(1).stores({
    mockups: '++id, name, category, isUserCreated, createdAt',
    designs: '++id, name, uploadedAt',
    placeholders: '++id, mockupId, x, y, width, height, rotation, locked',
    appliedDesigns: '++id, mockupId, designId, placeholderData, savedAt',
    settings: 'key'
});

// Storage Manager Class
class StorageManager {
    constructor() {
        this.db = db;
        this.initialized = false;
    }

    async initialize() {
        try {
            await this.db.open();
            await this.seedDefaultMockups();
            this.initialized = true;
            console.log('✅ Storage initialized');
            return true;
        } catch (error) {
            console.error('Storage initialization failed:', error);
            return false;
        }
    }

    // ===== MOCKUPS =====
    async seedDefaultMockups() {
        const count = await this.db.mockups.count();
        if (count > 0) return;

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
                name: 'Black T-Shirt Back',
                category: 'apparel',
                isUserCreated: false,
                imageData: this.generatePlaceholderImage(800, 1000, 'T-Shirt Back', '#1a1a1a'),
                width: 800,
                height: 1000,
                createdAt: Date.now()
            },
            {
                name: 'Hoodie Front',
                category: 'apparel',
                isUserCreated: false,
                imageData: this.generatePlaceholderImage(900, 1100, 'Hoodie', '#4a5568'),
                width: 900,
                height: 1100,
                createdAt: Date.now()
            },
            {
                name: 'Mug White',
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

        await this.db.mockups.bulkAdd(defaultMockups);
        console.log('✅ Default mockups seeded');
    }

    generatePlaceholderImage(width, height, text, bgColor) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, width - 20, height - 20);

        ctx.fillStyle = '#999999';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2);

        ctx.font = '24px Arial';
        ctx.fillText(`${width} × ${height}`, width / 2, height / 2 + 50);

        return canvas.toDataURL('image/png');
    }

    async addMockup(mockupData) {
        try {
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

    async updateMockup(id, updates) {
        try {
            await this.db.mockups.update(id, updates);
            console.log('✅ Mockup updated:', id);
            return true;
        } catch (error) {
            console.error('Failed to update mockup:', error);
            return false;
        }
    }

    async deleteMockup(id) {
        try {
            await this.db.mockups.delete(id);
            await this.db.placeholders.where('mockupId').equals(id).delete();
            await this.db.appliedDesigns.where('mockupId').equals(id).delete();
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
            if (placeholderData.id) {
                await this.db.placeholders.put(placeholderData);
                return placeholderData.id;
            } else {
                const id = await this.db.placeholders.add(placeholderData);
                return id;
            }
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

    // ===== APPLIED DESIGNS =====
    async saveAppliedDesign(appliedData) {
        try {
            const existing = await this.db.appliedDesigns
                .where('[mockupId+designId]')
                .equals([appliedData.mockupId, appliedData.designId])
                .first();

            if (existing) {
                await this.db.appliedDesigns.update(existing.id, {
                    ...appliedData,
                    savedAt: Date.now()
                });
                return existing.id;
            } else {
                const id = await this.db.appliedDesigns.add({
                    ...appliedData,
                    savedAt: Date.now()
                });
                return id;
            }
        } catch (error) {
            console.error('Failed to save applied design:', error);
            throw error;
        }
    }

    async getAppliedDesigns(mockupId) {
        try {
            return await this.db.appliedDesigns.where('mockupId').equals(mockupId).toArray();
        } catch (error) {
            console.error('Failed to get applied designs:', error);
            return [];
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
            await this.db.mockups.clear();
            await this.db.designs.clear();
            await this.db.placeholders.clear();
            await this.db.appliedDesigns.clear();
            await this.db.settings.clear();
            await this.seedDefaultMockups();
            console.log('✅ All data cleared and reseeded');
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

export const storage = new StorageManager();
