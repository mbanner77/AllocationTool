// Unified Data Service - API with localStorage fallback
// This service provides data access with automatic fallback when API is unavailable

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

// ============ Types ============

export interface Store {
  id: string;
  name: string;
  description: string;
  cluster: string;
  region: string;
  address: string;
  total_capacity: number;
}

export interface Article {
  id: string;
  articleNumber: string;
  description: string;
  color: string;
  colorHex: string;
  brand: string;
  productGroup: string;
  season: string;
  price: number;
  stockDC?: number;
  sizeCount?: number;
}

export interface AllocationRun {
  id: string;
  type: 'initial' | 'replenishment' | 'manual';
  status: 'planned' | 'running' | 'completed' | 'with_exceptions';
  startDate: string;
  endDate?: string;
  articleCount: number;
  storeCount: number;
  progress?: number;
  userName: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'simulated' | 'approved' | 'rejected';
  allocationType: 'initial' | 'replenishment';
  createdBy: string;
  parameters: any;
  results?: any;
}

export interface Exception {
  id: string;
  type: string;
  severity: 'info' | 'critical' | 'blocking';
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  title: string;
  description: string;
  storeId?: string;
  articleId?: string;
  runId?: string;
  assignedTo?: string;
  recommendedAction?: string;
  createdAt: string;
  article?: string;
  category?: string;
  cause?: string;
  process?: string;
  source?: string;
  season?: string;
  cluster?: string;
  capacityDeviation?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  dueDate: string;
  relatedRunId?: string;
  relatedScenarioId?: string;
}

export interface Parameter {
  id: string;
  category: string;
  name: string;
  key: string;
  value: string | number | boolean;
  unit?: string;
  description: string;
}

export interface KPIs {
  openTasks: number;
  activeRuns: number;
  openExceptions: number;
  approvedScenarios: number;
  totalStores: number;
  totalArticles: number;
}

// ============ Initial/Fallback Data ============

const INITIAL_STORES: Store[] = [
  { id: 'store-zh-hb', name: 'Zürich HB', description: 'Hauptbahnhof Zürich', cluster: 'Urban Premium', region: 'Zürich', address: 'Bahnhofplatz 15', total_capacity: 500 },
  { id: 'store-bs-sbb', name: 'Basel SBB', description: 'Basel Bahnhof SBB', cluster: 'Urban Standard', region: 'Basel', address: 'Centralbahnplatz 1', total_capacity: 400 },
  { id: 'store-be-bhf', name: 'Bern', description: 'Bern Innenstadt', cluster: 'Regional', region: 'Bern', address: 'Bahnhofplatz 10', total_capacity: 350 },
  { id: 'store-lu', name: 'Luzern', description: 'Luzern Bahnhofstrasse', cluster: 'Regional', region: 'Zentralschweiz', address: 'Bahnhofstrasse 5', total_capacity: 300 },
  { id: 'store-ge', name: 'Genf', description: 'Genève Centre', cluster: 'Urban Premium', region: 'Romandie', address: 'Rue du Mont-Blanc 22', total_capacity: 450 },
  { id: 'store-ls', name: 'Lausanne', description: 'Lausanne Gare', cluster: 'Urban Standard', region: 'Romandie', address: 'Place de la Gare 9', total_capacity: 380 },
  { id: 'store-sg', name: 'St. Gallen', description: 'St. Gallen Zentrum', cluster: 'Regional', region: 'Ostschweiz', address: 'Multergasse 15', total_capacity: 280 },
  { id: 'store-wi', name: 'Winterthur', description: 'Winterthur Altstadt', cluster: 'Regional', region: 'Zürich', address: 'Marktgasse 25', total_capacity: 260 },
];

const INITIAL_RUNS: AllocationRun[] = [
  { id: 'RUN-2025-W50-001', type: 'initial', status: 'completed', startDate: '2025-12-16 09:30', endDate: '2025-12-16 11:45', articleCount: 156, storeCount: 12, userName: 'M. Weber' },
  { id: 'RUN-2025-W50-002', type: 'replenishment', status: 'completed', startDate: '2025-12-15 14:20', endDate: '2025-12-15 15:30', articleCount: 89, storeCount: 10, userName: 'S. Müller' },
  { id: 'RUN-2025-W50-003', type: 'manual', status: 'with_exceptions', startDate: '2025-12-14 10:15', endDate: '2025-12-14 12:00', articleCount: 45, storeCount: 8, userName: 'A. Schmidt' },
  { id: 'RUN-2025-W49-001', type: 'initial', status: 'completed', startDate: '2025-12-09 08:00', endDate: '2025-12-09 10:30', articleCount: 203, storeCount: 12, userName: 'M. Weber' },
  { id: 'RUN-2025-W49-002', type: 'replenishment', status: 'completed', startDate: '2025-12-08 13:45', endDate: '2025-12-08 14:50', articleCount: 67, storeCount: 9, userName: 'T. Fischer' },
  { id: 'RUN-2025-W48-001', type: 'manual', status: 'completed', startDate: '2025-12-02 11:30', endDate: '2025-12-02 13:15', articleCount: 34, storeCount: 6, userName: 'S. Müller' },
  { id: 'RUN-2025-W47-001', type: 'initial', status: 'running', startDate: '2025-11-25 09:00', articleCount: 178, storeCount: 12, userName: 'M. Weber', progress: 65 },
];

const INITIAL_EXCEPTIONS: Exception[] = [
  { id: 'EXC-001', type: 'overcapacity', severity: 'critical', status: 'open', title: 'Überkapazität Running Shoes', description: 'SOLL-Kapazität wird im Cluster "Urban Premium" um 23% überschritten', article: 'ART-10245 - Running Shoes Elite', category: 'Shoes › Running', cause: 'SOLL-Kapazität wird im Cluster "Urban Premium" um 23% überschritten', process: 'initial', source: 'simulation', recommendedAction: 'Liefertermin verschieben oder Artikel reduzieren', createdAt: '2025-12-16 09:45', season: 'SS 2026', cluster: 'Urban Premium', capacityDeviation: 23 },
  { id: 'EXC-002', type: 'lot-conflict', severity: 'blocking', status: 'open', title: 'LOT-Konflikt Casual Jacket', description: 'LOT-Zwang verletzt: Nur 4 von 6 Größen verfügbar', article: 'ART-10892 - Casual Jacket Spring', category: 'Apparel › Jackets', cause: 'LOT-Zwang verletzt: Nur 4 von 6 Größen verfügbar', process: 'initial', source: 'planning', recommendedAction: 'Artikel aus Lauf entfernen oder fehlende Größen beschaffen', createdAt: '2025-12-16 08:12', season: 'SS 2026' },
  { id: 'EXC-003', type: 'delivery-conflict', severity: 'critical', status: 'in_progress', title: 'Liefertermin-Konflikt Summer Dress', description: 'Zeitliche Verdichtung: 3 Kollektionen in KW 15', article: 'ART-11234 - Summer Dress Collection', category: 'Apparel › Dresses', cause: 'Zeitliche Verdichtung: 3 Kollektionen in KW 15', process: 'replenishment', source: 'simulation', recommendedAction: 'Liefertermin um 1 Woche verschieben', createdAt: '2025-12-15 14:30', season: 'SS 2026', cluster: 'Alle', capacityDeviation: 45, assignedTo: 'Maria Müller' },
  { id: 'EXC-004', type: 'undercapacity', severity: 'info', status: 'ignored', title: 'Untererfüllung Accessories', description: 'SOLL-Kapazität wird nur zu 78% ausgelastet', article: 'Kategorie: Accessories', category: 'Accessories', cause: 'SOLL-Kapazität wird nur zu 78% ausgelastet', process: 'initial', source: 'planning', recommendedAction: 'Zusätzliche Artikel einplanen oder Abweichung akzeptieren', createdAt: '2025-12-14 11:20', season: 'SS 2026', capacityDeviation: -22 },
  { id: 'EXC-005', type: 'parameter-conflict', severity: 'blocking', status: 'open', title: 'Parameter-Konflikt Premium Sneakers', description: 'Mindestpräsentationsmenge (8 Stk.) > verfügbare Kapazität (5 Stk.)', article: 'ART-10567 - Premium Sneakers', category: 'Shoes › Sneakers', cause: 'Mindestpräsentationsmenge (8 Stk.) > verfügbare Kapazität (5 Stk.)', process: 'initial', source: 'planning', recommendedAction: 'Parameter prüfen und anpassen', createdAt: '2025-12-16 10:05', season: 'SS 2026' },
  { id: 'EXC-006', type: 'manual-deviation', severity: 'info', status: 'ignored', title: 'Manuelle Abweichung Special Edition', description: 'Bewusste Überallokation für Marketingaktion', article: 'ART-10123 - Special Edition', category: 'Shoes › Limited', cause: 'Bewusste Überallokation für Marketingaktion', process: 'initial', source: 'production', recommendedAction: 'Keine Aktion erforderlich (akzeptiert)', createdAt: '2025-12-13 16:45', season: 'SS 2026', capacityDeviation: 15, assignedTo: 'Andreas Schmidt' },
  { id: 'EXC-007', type: 'overcapacity', severity: 'critical', status: 'in_progress', title: 'Überkapazität Electronics', description: 'Nachschub überschreitet verfügbare Lagerfläche', article: 'Kategorie: Electronics', category: 'Electronics', cause: 'Nachschub überschreitet verfügbare Lagerfläche', process: 'replenishment', source: 'simulation', recommendedAction: 'Mengereduktion oder zeitliche Staffelung', createdAt: '2025-12-15 09:30', season: 'AW 2025', cluster: 'Regional', capacityDeviation: 18, assignedTo: 'Julia Weber' },
  { id: 'EXC-008', type: 'delivery-conflict', severity: 'info', status: 'resolved', title: 'Liefertermin Winter Boots', description: 'Ursprünglicher Liefertermin zu spät', article: 'ART-10889 - Winter Boots', category: 'Shoes › Boots', cause: 'Ursprünglicher Liefertermin zu spät', process: 'initial', source: 'planning', recommendedAction: 'Liefertermin angepasst', createdAt: '2025-12-10 08:00', season: 'AW 2025' },
];

const INITIAL_TASKS: Task[] = [
  { id: 'task-001', title: 'HW 2025 Allokation prüfen', description: 'Überprüfung der initialen Allokation für die Herbst/Winter Saison', type: 'review', status: 'in_progress', priority: 'high', assignedTo: 'M. Weber', dueDate: '2025-01-10', relatedScenarioId: 'scenario-001' },
  { id: 'task-002', title: 'Exception Zürich HB bearbeiten', description: 'Kapazitätsüberschreitung in Zürich HB lösen', type: 'exception', status: 'pending', priority: 'urgent', assignedTo: 'S. Müller', dueDate: '2025-01-08', relatedRunId: 'RUN-2025-003' },
  { id: 'task-003', title: 'Nachschub-Szenario freigeben', description: 'NOS Nachschub Szenario zur Produktion freigeben', type: 'approval', status: 'pending', priority: 'medium', assignedTo: 'A. Schmidt', dueDate: '2025-01-09', relatedScenarioId: 'scenario-003' },
  { id: 'task-004', title: 'Prognose-Parameter optimieren', description: 'Forecast-Gewichtung basierend auf Q4 Ergebnissen anpassen', type: 'allocation', status: 'pending', priority: 'medium', assignedTo: 'M. Weber', dueDate: '2025-01-12' },
  { id: 'task-005', title: 'Neue Artikel SS26 einplanen', description: 'Spring/Summer 2026 Kollektion in Planung aufnehmen', type: 'allocation', status: 'pending', priority: 'low', assignedTo: 'T. Fischer', dueDate: '2025-01-15' },
];

const INITIAL_SCENARIOS: Scenario[] = [
  { id: 'scenario-001', name: 'Standard Allokation HW 2025', description: 'Standardszenario für die Herbst/Winter Saison 2025', status: 'approved', allocationType: 'initial', createdBy: 'M. Weber', parameters: { forecast_weight: 0.6, historical_weight: 0.4, safety_stock_factor: 1.2 }, results: { total_allocated: 15420, stores_covered: 8, expected_fill_rate: 94.5, capacity_utilization: 87.2, exceptions: 3 } },
  { id: 'scenario-002', name: 'Optimiert - Hohe Prognosegewichtung', description: 'Szenario mit erhöhter Gewichtung der Absatzprognose', status: 'simulated', allocationType: 'initial', createdBy: 'S. Müller', parameters: { forecast_weight: 0.8, historical_weight: 0.2, safety_stock_factor: 1.1 }, results: { total_allocated: 16800, stores_covered: 8, expected_fill_rate: 96.2, capacity_utilization: 91.5, exceptions: 5 } },
  { id: 'scenario-003', name: 'NOS Nachschub - Standard', description: 'Standardszenario für Never-out-of-Stock Nachschub', status: 'approved', allocationType: 'replenishment', createdBy: 'T. Fischer', parameters: { forecast_weight: 0.5, historical_weight: 0.5, safety_stock_factor: 1.5 }, results: { total_allocated: 8500, stores_covered: 8, expected_fill_rate: 98.1, capacity_utilization: 72.3, exceptions: 1 } },
  { id: 'scenario-004', name: 'SS 2026 Initial Draft', description: 'Erster Entwurf für Spring/Summer 2026', status: 'draft', allocationType: 'initial', createdBy: 'M. Weber', parameters: { forecast_weight: 0.7, historical_weight: 0.3, safety_stock_factor: 1.3 } },
];

const INITIAL_PARAMETERS: Parameter[] = [
  { id: 'param-001', category: 'capacity', name: 'Flächenbedarf pro Einheit', key: 'area_per_unit', value: 0.035, unit: 'm²', description: 'Durchschnittlicher Präsentationsflächenbedarf je Stück' },
  { id: 'param-002', category: 'capacity', name: 'Maximale Auslastung', key: 'max_utilization', value: 95, unit: '%', description: 'Maximale erlaubte Kapazitätsauslastung' },
  { id: 'param-003', category: 'presentation', name: 'Mindestpräsentationsmenge', key: 'min_presentation', value: 3, unit: 'Stück', description: 'Mindestmenge, um Artikel präsentieren zu dürfen' },
  { id: 'param-004', category: 'presentation', name: 'Mindestmenge je Größe', key: 'min_per_size', value: 2, unit: 'Stück', description: 'Mindestanzahl pro Größe für vollständige Darstellung' },
  { id: 'param-005', category: 'presentation', name: 'LOT-Zwang', key: 'lot_required', value: true, unit: '', description: 'Allokation nur bei vollständigem Größenlauf erlaubt' },
  { id: 'param-006', category: 'control', name: 'Prognose-Horizont', key: 'forecast_horizon', value: 8, unit: 'Wochen', description: 'Zeitraum für Absatzprognose' },
  { id: 'param-007', category: 'control', name: 'Sicherheitsbestand-Tage', key: 'safety_stock_days', value: 14, unit: 'Tage', description: 'Puffer für Nachschub-Verzögerungen' },
  { id: 'param-008', category: 'forecast', name: 'Prognose-Gewichtung', key: 'forecast_weight', value: 0.6, unit: '', description: 'Gewichtung der Absatzprognose vs. historische Daten' },
  { id: 'param-009', category: 'forecast', name: 'Saisonalitätsfaktor', key: 'seasonality_factor', value: 1.2, unit: '', description: 'Multiplikator für saisonale Schwankungen' },
  { id: 'param-010', category: 'governance', name: 'Freigabe-Schwellwert', key: 'approval_threshold', value: 10000, unit: '€', description: 'Ab diesem Wert ist eine Freigabe erforderlich' },
];

// ============ Storage Keys ============

const STORAGE_KEYS = {
  stores: 'allocation_stores',
  runs: 'allocation_runs',
  exceptions: 'allocation_exceptions',
  tasks: 'allocation_tasks',
  scenarios: 'allocation_scenarios',
  parameters: 'allocation_parameters',
};

// ============ Helper Functions ============

function getFromStorage<T>(key: string, initial: T[]): T[] {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  } catch {
    return initial;
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

async function tryApi<T>(apiCall: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (response.ok) {
      return await apiCall();
    }
  } catch {
    // API not available, use fallback
  }
  return fallback();
}

// ============ Data Service ============

export const dataService = {
  // ============ Stores ============
  async getStores(): Promise<Store[]> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE_URL}/stores`);
        const data = await res.json();
        return data.success ? data.data : INITIAL_STORES;
      },
      () => getFromStorage(STORAGE_KEYS.stores, INITIAL_STORES)
    );
  },

  async getStore(id: string): Promise<Store | undefined> {
    const stores = await this.getStores();
    return stores.find(s => s.id === id);
  },

  // ============ Runs ============
  async getRuns(): Promise<AllocationRun[]> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE_URL}/runs`);
        const data = await res.json();
        if (data.success) {
          return data.data.map((r: any) => ({
            id: r.id,
            type: r.type,
            status: r.status === 'with_exceptions' ? 'with_exceptions' : r.status,
            startDate: r.start_date,
            endDate: r.end_date,
            articleCount: r.article_count,
            storeCount: r.store_count,
            progress: r.progress,
            userName: r.user_name
          }));
        }
        return INITIAL_RUNS;
      },
      () => getFromStorage(STORAGE_KEYS.runs, INITIAL_RUNS)
    );
  },

  async getRun(id: string): Promise<AllocationRun | undefined> {
    const runs = await this.getRuns();
    return runs.find(r => r.id === id);
  },

  async createRun(run: Omit<AllocationRun, 'id'>): Promise<AllocationRun> {
    const newRun = { ...run, id: `RUN-${Date.now()}` };
    const runs = await this.getRuns();
    runs.unshift(newRun);
    saveToStorage(STORAGE_KEYS.runs, runs);
    return newRun;
  },

  async updateRun(id: string, updates: Partial<AllocationRun>): Promise<AllocationRun | undefined> {
    const runs = await this.getRuns();
    const index = runs.findIndex(r => r.id === id);
    if (index >= 0) {
      runs[index] = { ...runs[index], ...updates };
      saveToStorage(STORAGE_KEYS.runs, runs);
      return runs[index];
    }
    return undefined;
  },

  // ============ Exceptions ============
  async getExceptions(): Promise<Exception[]> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE_URL}/exceptions`);
        const data = await res.json();
        if (data.success) {
          return data.data.map((e: any) => ({
            ...e,
            createdAt: e.created_at || e.createdAt
          }));
        }
        return INITIAL_EXCEPTIONS;
      },
      () => getFromStorage(STORAGE_KEYS.exceptions, INITIAL_EXCEPTIONS)
    );
  },

  async updateException(id: string, updates: Partial<Exception>): Promise<Exception | undefined> {
    const exceptions = await this.getExceptions();
    const index = exceptions.findIndex(e => e.id === id);
    if (index >= 0) {
      exceptions[index] = { ...exceptions[index], ...updates };
      saveToStorage(STORAGE_KEYS.exceptions, exceptions);
      return exceptions[index];
    }
    return undefined;
  },

  // ============ Tasks ============
  async getTasks(): Promise<Task[]> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE_URL}/tasks`);
        const data = await res.json();
        if (data.success) {
          return data.data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            type: t.type,
            status: t.status,
            priority: t.priority,
            assignedTo: t.assigned_to,
            dueDate: t.due_date,
            relatedRunId: t.related_run_id,
            relatedScenarioId: t.related_scenario_id
          }));
        }
        return INITIAL_TASKS;
      },
      () => getFromStorage(STORAGE_KEYS.tasks, INITIAL_TASKS)
    );
  },

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const newTask = { ...task, id: `task-${Date.now()}` };
    const tasks = await this.getTasks();
    tasks.unshift(newTask);
    saveToStorage(STORAGE_KEYS.tasks, tasks);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | undefined> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === id);
    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...updates };
      saveToStorage(STORAGE_KEYS.tasks, tasks);
      return tasks[index];
    }
    return undefined;
  },

  async deleteTask(id: string): Promise<boolean> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length < tasks.length) {
      saveToStorage(STORAGE_KEYS.tasks, filtered);
      return true;
    }
    return false;
  },

  // ============ Scenarios ============
  async getScenarios(): Promise<Scenario[]> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE_URL}/scenarios`);
        const data = await res.json();
        if (data.success) {
          return data.data.map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            status: s.status,
            allocationType: s.allocation_type,
            createdBy: s.created_by,
            parameters: s.parameters,
            results: s.results
          }));
        }
        return INITIAL_SCENARIOS;
      },
      () => getFromStorage(STORAGE_KEYS.scenarios, INITIAL_SCENARIOS)
    );
  },

  async createScenario(scenario: Omit<Scenario, 'id'>): Promise<Scenario> {
    const newScenario = { ...scenario, id: `scenario-${Date.now()}` };
    const scenarios = await this.getScenarios();
    scenarios.unshift(newScenario);
    saveToStorage(STORAGE_KEYS.scenarios, scenarios);
    return newScenario;
  },

  async updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario | undefined> {
    const scenarios = await this.getScenarios();
    const index = scenarios.findIndex(s => s.id === id);
    if (index >= 0) {
      scenarios[index] = { ...scenarios[index], ...updates };
      saveToStorage(STORAGE_KEYS.scenarios, scenarios);
      return scenarios[index];
    }
    return undefined;
  },

  // ============ Parameters ============
  async getParameters(): Promise<Parameter[]> {
    return tryApi(
      async () => {
        const res = await fetch(`${API_BASE_URL}/parameters`);
        const data = await res.json();
        return data.success ? data.data : INITIAL_PARAMETERS;
      },
      () => getFromStorage(STORAGE_KEYS.parameters, INITIAL_PARAMETERS)
    );
  },

  async updateParameter(id: string, value: string | number | boolean): Promise<Parameter | undefined> {
    const parameters = await this.getParameters();
    const index = parameters.findIndex(p => p.id === id);
    if (index >= 0) {
      parameters[index] = { ...parameters[index], value };
      saveToStorage(STORAGE_KEYS.parameters, parameters);
      return parameters[index];
    }
    return undefined;
  },

  // ============ KPIs ============
  async getKPIs(): Promise<KPIs> {
    const [tasks, runs, exceptions, scenarios, stores] = await Promise.all([
      this.getTasks(),
      this.getRuns(),
      this.getExceptions(),
      this.getScenarios(),
      this.getStores()
    ]);

    return {
      openTasks: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
      activeRuns: runs.filter(r => r.status === 'running' || r.status === 'planned').length,
      openExceptions: exceptions.filter(e => e.status === 'open' || e.status === 'in_progress').length,
      approvedScenarios: scenarios.filter(s => s.status === 'approved').length,
      totalStores: stores.length,
      totalArticles: 156 // Placeholder
    };
  },

  // ============ Reset ============
  resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.stores, JSON.stringify(INITIAL_STORES));
    localStorage.setItem(STORAGE_KEYS.runs, JSON.stringify(INITIAL_RUNS));
    localStorage.setItem(STORAGE_KEYS.exceptions, JSON.stringify(INITIAL_EXCEPTIONS));
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(INITIAL_TASKS));
    localStorage.setItem(STORAGE_KEYS.scenarios, JSON.stringify(INITIAL_SCENARIOS));
    localStorage.setItem(STORAGE_KEYS.parameters, JSON.stringify(INITIAL_PARAMETERS));
  }
};

export default dataService;
