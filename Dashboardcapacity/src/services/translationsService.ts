// Translations Service - IndexedDB storage for CMS translations
// Provides database storage with static translations fallback

import { translations, Language, TranslationKeys } from '../i18n/translations';

const DB_NAME = 'TranslationsDB';
const DB_VERSION = 1;
const STORE_NAME = 'translations';

interface TranslationEntry {
  id: string; // Format: "lang:section.key" e.g. "de:nav.home"
  language: Language;
  section: string;
  key: string;
  value: string;
  updatedAt: string;
}

// Helper to flatten translations object
function flattenTranslations(obj: any, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenTranslations(obj[key], newKey));
    } else {
      result[newKey] = String(obj[key]);
    }
  }
  
  return result;
}

// Helper to unflatten translations
function unflattenTranslations(flat: Record<string, string>): any {
  const result: any = {};
  
  for (const key in flat) {
    const parts = key.split('.');
    let current = result;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = flat[key];
  }
  
  return result;
}

class TranslationsService {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<boolean>;

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          console.warn('TranslationsDB: Failed to open database, using fallback');
          resolve(false);
        };

        request.onsuccess = () => {
          this.db = request.result;
          console.log('TranslationsDB: Connected');
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            store.createIndex('language', 'language', { unique: false });
            store.createIndex('section', 'section', { unique: false });
          }
        };
      } catch (error) {
        console.warn('TranslationsDB: IndexedDB not available, using fallback');
        resolve(false);
      }
    });
  }

  // Check if database is available
  async isAvailable(): Promise<boolean> {
    return this.dbReady;
  }

  // Get all translation entries for a language
  async getTranslations(language: Language): Promise<Record<string, string>> {
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      return flattenTranslations(translations[language]);
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('language');
        const request = index.getAll(language);

        request.onsuccess = () => {
          const entries = request.result as TranslationEntry[];
          if (entries.length === 0) {
            // No custom translations, return defaults
            resolve(flattenTranslations(translations[language]));
            return;
          }

          // Merge with defaults - custom overrides default
          const defaults = flattenTranslations(translations[language]);
          const custom: Record<string, string> = {};
          
          for (const entry of entries) {
            custom[`${entry.section}.${entry.key}`] = entry.value;
          }

          resolve({ ...defaults, ...custom });
        };

        request.onerror = () => {
          resolve(flattenTranslations(translations[language]));
        };
      } catch (error) {
        resolve(flattenTranslations(translations[language]));
      }
    });
  }

  // Get merged translations as nested object (for use in context)
  async getMergedTranslations(language: Language): Promise<TranslationKeys> {
    const flat = await this.getTranslations(language);
    return unflattenTranslations(flat) as TranslationKeys;
  }

  // Save a single translation
  async saveTranslation(
    language: Language,
    section: string,
    key: string,
    value: string
  ): Promise<boolean> {
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      console.warn('TranslationsDB: Cannot save - database not available');
      return false;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const entry: TranslationEntry = {
          id: `${language}:${section}.${key}`,
          language,
          section,
          key,
          value,
          updatedAt: new Date().toISOString(),
        };

        const request = store.put(entry);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (error) {
        resolve(false);
      }
    });
  }

  // Save multiple translations at once
  async saveTranslations(
    language: Language,
    entries: Array<{ section: string; key: string; value: string }>
  ): Promise<boolean> {
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        for (const { section, key, value } of entries) {
          const entry: TranslationEntry = {
            id: `${language}:${section}.${key}`,
            language,
            section,
            key,
            value,
            updatedAt: new Date().toISOString(),
          };
          store.put(entry);
        }

        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => resolve(false);
      } catch (error) {
        resolve(false);
      }
    });
  }

  // Delete a custom translation (reverts to default)
  async deleteTranslation(language: Language, section: string, key: string): Promise<boolean> {
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(`${language}:${section}.${key}`);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (error) {
        resolve(false);
      }
    });
  }

  // Get all custom translations (for CMS display)
  async getAllCustomTranslations(): Promise<TranslationEntry[]> {
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      return [];
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result as TranslationEntry[]);
        request.onerror = () => resolve([]);
      } catch (error) {
        resolve([]);
      }
    });
  }

  // Get all available sections from default translations
  getSections(): string[] {
    const flat = flattenTranslations(translations.de);
    const sections = new Set<string>();
    
    for (const key of Object.keys(flat)) {
      const parts = key.split('.');
      if (parts.length > 1) {
        sections.add(parts[0]);
      }
    }
    
    return Array.from(sections).sort();
  }

  // Get all keys in a section
  getKeysInSection(section: string): string[] {
    const flat = flattenTranslations(translations.de);
    const keys: string[] = [];
    
    for (const key of Object.keys(flat)) {
      if (key.startsWith(`${section}.`)) {
        keys.push(key.substring(section.length + 1));
      }
    }
    
    return keys.sort();
  }

  // Get default value for a key
  getDefaultValue(language: Language, section: string, key: string): string {
    const flat = flattenTranslations(translations[language]);
    return flat[`${section}.${key}`] || '';
  }

  // Export all translations (for backup)
  async exportTranslations(): Promise<string> {
    const custom = await this.getAllCustomTranslations();
    return JSON.stringify(custom, null, 2);
  }

  // Import translations from backup
  async importTranslations(jsonData: string): Promise<{ success: boolean; count: number; error?: string }> {
    try {
      const entries = JSON.parse(jsonData) as TranslationEntry[];
      
      if (!Array.isArray(entries)) {
        return { success: false, count: 0, error: 'Invalid format: expected array' };
      }

      const isReady = await this.dbReady;
      if (!isReady || !this.db) {
        return { success: false, count: 0, error: 'Database not available' };
      }

      return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        for (const entry of entries) {
          if (entry.id && entry.language && entry.section && entry.key && entry.value) {
            store.put({
              ...entry,
              updatedAt: new Date().toISOString(),
            });
          }
        }

        transaction.oncomplete = () => resolve({ success: true, count: entries.length });
        transaction.onerror = () => resolve({ success: false, count: 0, error: 'Transaction failed' });
      });
    } catch (error) {
      return { success: false, count: 0, error: 'Invalid JSON' };
    }
  }

  // Clear all custom translations
  async clearAllCustom(): Promise<boolean> {
    const isReady = await this.dbReady;
    if (!isReady || !this.db) {
      return false;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (error) {
        resolve(false);
      }
    });
  }
}

export const translationsService = new TranslationsService();
export type { TranslationEntry };
