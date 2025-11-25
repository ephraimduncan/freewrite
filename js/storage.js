const DB_NAME = 'FreewriteDB';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

export class StorageManager {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Error opening IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

                    objectStore.createIndex('createdAt', 'createdAt', { unique: false });
                    objectStore.createIndex('filename', 'filename', { unique: true });

                    console.log('Object store created successfully');
                }
            };
        });
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    formatDisplayDate(date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    }

    formatFilenameDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
    }

    createEntry(content = '', fontFamily = 'Lato', fontSize = 18) {
        const id = this.generateUUID();
        const now = new Date();
        const filenameDate = this.formatFilenameDate(now);
        const displayDate = this.formatDisplayDate(now);

        return {
            id,
            filename: `[${id}]-[${filenameDate}].md`,
            date: displayDate,
            createdAt: now.toISOString(),
            content,
            previewText: this.generatePreview(content),
            fontFamily,
            fontSize
        };
    }

    generatePreview(content) {
        const cleaned = content
            .replace(/\n/g, ' ')
            .trim();

        if (cleaned.length === 0) return '';
        if (cleaned.length <= 30) return cleaned;
        return cleaned.substring(0, 30) + '...';
    }

    async saveEntry(entry) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);

            entry.previewText = this.generatePreview(entry.content);

            const request = objectStore.put(entry);

            request.onsuccess = () => {
                console.log('Entry saved successfully:', entry.id);
                resolve(entry);
            };

            request.onerror = () => {
                console.error('Error saving entry:', request.error);
                reject(request.error);
            };
        });
    }

    async loadEntry(id) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Error loading entry:', request.error);
                reject(request.error);
            };
        });
    }

    async getAllEntries() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                const entries = request.result;
                entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                resolve(entries);
            };

            request.onerror = () => {
                console.error('Error getting all entries:', request.error);
                reject(request.error);
            };
        });
    }

    async deleteEntry(id) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const objectStore = transaction.objectStore(STORE_NAME);
            const request = objectStore.delete(id);

            request.onsuccess = () => {
                console.log('Entry deleted successfully:', id);
                resolve();
            };

            request.onerror = () => {
                console.error('Error deleting entry:', request.error);
                reject(request.error);
            };
        });
    }

    async hasEmptyEntryToday(entries) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return entries.some(entry => {
            const entryDate = new Date(entry.createdAt);
            return entryDate >= today &&
                   entryDate < tomorrow &&
                   entry.content.trim() === '';
        });
    }

    async getTodaysEmptyEntry(entries) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return entries.find(entry => {
            const entryDate = new Date(entry.createdAt);
            return entryDate >= today &&
                   entryDate < tomorrow &&
                   entry.content.trim() === '';
        });
    }
}
