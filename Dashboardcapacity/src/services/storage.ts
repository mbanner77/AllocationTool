// localStorage Service for data persistence

const STORAGE_KEYS = {
  RUNS: 'allocation_runs',
  ARTICLES: 'allocation_articles',
  STORES: 'allocation_stores',
  CAPACITY: 'allocation_capacity',
  SCENARIOS: 'allocation_scenarios',
  EXCEPTIONS: 'allocation_exceptions',
  PARAMETERS: 'allocation_parameters',
  TASKS: 'allocation_tasks',
  USER: 'allocation_user',
} as const;

// Generic storage functions
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage: ${key}`, error);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage: ${key}`, error);
  }
}

// Specific storage functions for each entity
export const storage = {
  // Runs
  getRuns: () => getFromStorage(STORAGE_KEYS.RUNS, []),
  saveRuns: (runs: any[]) => saveToStorage(STORAGE_KEYS.RUNS, runs),
  
  // Articles
  getArticles: () => getFromStorage(STORAGE_KEYS.ARTICLES, []),
  saveArticles: (articles: any[]) => saveToStorage(STORAGE_KEYS.ARTICLES, articles),
  
  // Stores
  getStores: () => getFromStorage(STORAGE_KEYS.STORES, []),
  saveStores: (stores: any[]) => saveToStorage(STORAGE_KEYS.STORES, stores),
  
  // Capacity
  getCapacity: () => getFromStorage(STORAGE_KEYS.CAPACITY, []),
  saveCapacity: (capacity: any[]) => saveToStorage(STORAGE_KEYS.CAPACITY, capacity),
  
  // Scenarios
  getScenarios: () => getFromStorage(STORAGE_KEYS.SCENARIOS, []),
  saveScenarios: (scenarios: any[]) => saveToStorage(STORAGE_KEYS.SCENARIOS, scenarios),
  
  // Exceptions
  getExceptions: () => getFromStorage(STORAGE_KEYS.EXCEPTIONS, []),
  saveExceptions: (exceptions: any[]) => saveToStorage(STORAGE_KEYS.EXCEPTIONS, exceptions),
  
  // Parameters
  getParameters: () => getFromStorage(STORAGE_KEYS.PARAMETERS, []),
  saveParameters: (parameters: any[]) => saveToStorage(STORAGE_KEYS.PARAMETERS, parameters),
  
  // Tasks
  getTasks: () => getFromStorage(STORAGE_KEYS.TASKS, []),
  saveTasks: (tasks: any[]) => saveToStorage(STORAGE_KEYS.TASKS, tasks),
  
  // User
  getUser: () => getFromStorage(STORAGE_KEYS.USER, null),
  saveUser: (user: any) => saveToStorage(STORAGE_KEYS.USER, user),
  
  // Clear all data
  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => removeFromStorage(key));
  },
  
  // Check if initialized
  isInitialized: () => {
    return localStorage.getItem(STORAGE_KEYS.RUNS) !== null;
  }
};

export { STORAGE_KEYS };
