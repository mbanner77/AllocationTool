// Initial seed data for the application
import type { 
  AllocationRun, Store, Scenario, Exception, 
  AllocationParameter, Task, User, CapacityData 
} from '../types';

export const initialUser: User = {
  id: 'user-001',
  name: 'Max Mustermann',
  email: 'max.mustermann@company.ch',
  role: 'manager',
  department: 'Allocation Management'
};

export const initialStores: Store[] = [
  { id: 'store-zh-hb', name: 'Zürich HB', description: 'Hauptbahnhof Zürich', cluster: 'Urban Premium', region: 'Zürich', address: 'Bahnhofplatz 15, 8001 Zürich', totalCapacity: 500, isActive: true, createdAt: '2024-01-01' },
  { id: 'store-bs-sbb', name: 'Basel SBB', description: 'Basel Bahnhof SBB', cluster: 'Urban Standard', region: 'Basel', address: 'Centralbahnplatz 1, 4051 Basel', totalCapacity: 400, isActive: true, createdAt: '2024-01-01' },
  { id: 'store-be-bhf', name: 'Bern Bahnhof', description: 'Bern Hauptbahnhof', cluster: 'Regional', region: 'Bern', address: 'Bahnhofplatz 10, 3011 Bern', totalCapacity: 350, isActive: true, createdAt: '2024-01-01' },
  { id: 'store-lu', name: 'Luzern', description: 'Luzern Bahnhofstrasse', cluster: 'Regional', region: 'Zentralschweiz', address: 'Bahnhofstrasse 5, 6003 Luzern', totalCapacity: 300, isActive: true, createdAt: '2024-01-01' },
  { id: 'store-ge', name: 'Genf', description: 'Genève Centre', cluster: 'Urban Premium', region: 'Romandie', address: 'Rue du Mont-Blanc 22, 1201 Genève', totalCapacity: 450, isActive: true, createdAt: '2024-01-01' },
  { id: 'store-ls', name: 'Lausanne', description: 'Lausanne Gare', cluster: 'Urban Standard', region: 'Romandie', address: 'Place de la Gare 9, 1003 Lausanne', totalCapacity: 380, isActive: true, createdAt: '2024-01-01' },
  { id: 'store-sg', name: 'St. Gallen', description: 'St. Gallen Zentrum', cluster: 'Regional', region: 'Ostschweiz', address: 'Multergasse 15, 9000 St. Gallen', totalCapacity: 280, isActive: true, createdAt: '2024-01-01' },
  { id: 'store-wi', name: 'Winterthur', description: 'Winterthur Altstadt', cluster: 'Regional', region: 'Zürich', address: 'Marktgasse 25, 8400 Winterthur', totalCapacity: 260, isActive: true, createdAt: '2024-01-01' },
];

export const initialRuns: AllocationRun[] = [
  { id: 'RUN-2025-001', type: 'initial', status: 'completed', startDate: '2025-01-06T09:00:00', endDate: '2025-01-06T11:30:00', articleCount: 156, storeCount: 8, user: 'M. Weber', createdAt: '2025-01-06T09:00:00', updatedAt: '2025-01-06T11:30:00' },
  { id: 'RUN-2025-002', type: 'replenishment', status: 'completed', startDate: '2025-01-05T14:00:00', endDate: '2025-01-05T15:30:00', articleCount: 89, storeCount: 6, user: 'S. Müller', createdAt: '2025-01-05T14:00:00', updatedAt: '2025-01-05T15:30:00' },
  { id: 'RUN-2025-003', type: 'manual', status: 'with_exceptions', startDate: '2025-01-04T10:00:00', endDate: '2025-01-04T12:00:00', articleCount: 45, storeCount: 4, user: 'A. Schmidt', createdAt: '2025-01-04T10:00:00', updatedAt: '2025-01-04T12:00:00' },
  { id: 'RUN-2025-004', type: 'initial', status: 'running', startDate: '2025-01-07T08:00:00', articleCount: 203, storeCount: 8, progress: 65, user: 'M. Weber', createdAt: '2025-01-07T08:00:00', updatedAt: '2025-01-07T09:30:00' },
  { id: 'RUN-2025-005', type: 'replenishment', status: 'planned', startDate: '2025-01-08T09:00:00', articleCount: 120, storeCount: 8, user: 'T. Fischer', createdAt: '2025-01-06T16:00:00', updatedAt: '2025-01-06T16:00:00' },
];

export const initialScenarios: Scenario[] = [
  {
    id: 'scenario-001',
    name: 'Standard Allokation HW 2025',
    description: 'Standardszenario für die Herbst/Winter Saison 2025',
    status: 'approved',
    allocationType: 'initial',
    createdBy: 'M. Weber',
    createdAt: '2024-12-15T10:00:00',
    updatedAt: '2025-01-02T14:30:00',
    parameters: {
      forecastWeight: 0.6,
      historicalWeight: 0.4,
      safetyStockFactor: 1.2,
      minAllocationQty: 5,
      maxAllocationQty: 100,
      clusterPriority: { 'Urban Premium': 1, 'Urban Standard': 2, 'Regional': 3, 'Outlet': 4 }
    },
    results: {
      totalAllocated: 15420,
      storesCovered: 8,
      expectedFillRate: 94.5,
      capacityUtilization: 87.2,
      exceptions: 3,
      simulatedAt: '2025-01-02T14:30:00'
    }
  },
  {
    id: 'scenario-002',
    name: 'Optimiert - Hohe Prognosegewichtung',
    description: 'Szenario mit erhöhter Gewichtung der Absatzprognose',
    status: 'simulated',
    allocationType: 'initial',
    createdBy: 'S. Müller',
    createdAt: '2025-01-03T09:00:00',
    updatedAt: '2025-01-05T11:00:00',
    parameters: {
      forecastWeight: 0.8,
      historicalWeight: 0.2,
      safetyStockFactor: 1.1,
      minAllocationQty: 3,
      maxAllocationQty: 120,
      clusterPriority: { 'Urban Premium': 1, 'Urban Standard': 2, 'Regional': 3, 'Outlet': 4 }
    },
    results: {
      totalAllocated: 16800,
      storesCovered: 8,
      expectedFillRate: 96.2,
      capacityUtilization: 91.5,
      exceptions: 5,
      simulatedAt: '2025-01-05T11:00:00'
    }
  },
  {
    id: 'scenario-003',
    name: 'NOS Nachschub - Standard',
    description: 'Standardszenario für Never-out-of-Stock Nachschub',
    status: 'approved',
    allocationType: 'replenishment',
    createdBy: 'T. Fischer',
    createdAt: '2024-11-20T14:00:00',
    updatedAt: '2024-12-10T09:00:00',
    parameters: {
      forecastWeight: 0.5,
      historicalWeight: 0.5,
      safetyStockFactor: 1.5,
      minAllocationQty: 10,
      maxAllocationQty: 50,
      clusterPriority: { 'Urban Premium': 1, 'Urban Standard': 1, 'Regional': 2, 'Outlet': 3 }
    },
    results: {
      totalAllocated: 8500,
      storesCovered: 8,
      expectedFillRate: 98.1,
      capacityUtilization: 72.3,
      exceptions: 1,
      simulatedAt: '2024-12-10T09:00:00'
    }
  },
  {
    id: 'scenario-004',
    name: 'Konservativ - Niedriger Sicherheitsbestand',
    description: 'Testversion mit reduziertem Sicherheitsbestand',
    status: 'draft',
    allocationType: 'initial',
    createdBy: 'A. Schmidt',
    createdAt: '2025-01-06T15:00:00',
    updatedAt: '2025-01-06T15:00:00',
    parameters: {
      forecastWeight: 0.5,
      historicalWeight: 0.5,
      safetyStockFactor: 0.9,
      minAllocationQty: 5,
      maxAllocationQty: 80,
      clusterPriority: { 'Urban Premium': 1, 'Urban Standard': 2, 'Regional': 3, 'Outlet': 4 }
    }
  }
];

export const initialExceptions: Exception[] = [
  { id: 'exc-001', type: 'capacity', severity: 'high', status: 'open', title: 'Kapazitätsüberschreitung Zürich HB', description: 'Die geplante Allokation überschreitet die verfügbare Kapazität um 15%', storeId: 'store-zh-hb', runId: 'RUN-2025-003', createdAt: '2025-01-04T11:30:00' },
  { id: 'exc-002', type: 'stock', severity: 'medium', status: 'in_progress', title: 'Niedriger Lagerbestand Running Shoes', description: 'Der zentrale Lagerbestand reicht nicht für alle geplanten Allokationen', articleId: 'art-001', assignedTo: 'S. Müller', createdAt: '2025-01-05T09:00:00' },
  { id: 'exc-003', type: 'forecast', severity: 'low', status: 'open', title: 'Prognoseabweichung Basel SBB', description: 'Die Ist-Verkäufe weichen um mehr als 20% von der Prognose ab', storeId: 'store-bs-sbb', createdAt: '2025-01-06T14:00:00' },
  { id: 'exc-004', type: 'manual', severity: 'critical', status: 'open', title: 'Dringende Nachlieferung Winterjacken', description: 'Kundenanfrage für Sonderlieferung aufgrund hoher Nachfrage', storeId: 'store-ge', articleId: 'art-004', createdAt: '2025-01-07T08:30:00' },
  { id: 'exc-005', type: 'capacity', severity: 'medium', status: 'resolved', title: 'Warenträger-Konflikt Luzern', description: 'Zwei Produktgruppen beanspruchen denselben Warenträger', storeId: 'store-lu', resolvedAt: '2025-01-03T16:00:00', createdAt: '2025-01-02T10:00:00' },
];

export const initialTasks: Task[] = [
  { id: 'task-001', title: 'HW 2025 Allokation prüfen', description: 'Überprüfung der initialen Allokation für die Herbst/Winter Saison', type: 'review', status: 'in_progress', priority: 'high', assignedTo: 'M. Weber', dueDate: '2025-01-10', relatedScenarioId: 'scenario-001', createdAt: '2025-01-05T09:00:00' },
  { id: 'task-002', title: 'Exception Zürich HB bearbeiten', description: 'Kapazitätsüberschreitung in Zürich HB lösen', type: 'exception', status: 'pending', priority: 'urgent', assignedTo: 'S. Müller', dueDate: '2025-01-08', relatedRunId: 'RUN-2025-003', createdAt: '2025-01-04T12:00:00' },
  { id: 'task-003', title: 'Nachschub-Szenario freigeben', description: 'NOS Nachschub Szenario zur Produktion freigeben', type: 'approval', status: 'pending', priority: 'medium', assignedTo: 'A. Schmidt', dueDate: '2025-01-09', relatedScenarioId: 'scenario-003', createdAt: '2025-01-06T10:00:00' },
  { id: 'task-004', title: 'Neue Filiale St. Gallen einrichten', description: 'Kapazitäten und Parameter für neue Filiale konfigurieren', type: 'allocation', status: 'completed', priority: 'low', assignedTo: 'T. Fischer', dueDate: '2025-01-05', completedAt: '2025-01-04T15:00:00', createdAt: '2025-01-02T14:00:00' },
  { id: 'task-005', title: 'Prognose-Parameter optimieren', description: 'Forecast-Gewichtung basierend auf Q4 Ergebnissen anpassen', type: 'allocation', status: 'pending', priority: 'medium', assignedTo: 'M. Weber', dueDate: '2025-01-12', createdAt: '2025-01-06T11:00:00' },
];

export const initialParameters: AllocationParameter[] = [
  { id: 'param-001', category: 'capacity', name: 'Standard Kapazitätsfaktor', key: 'capacity_factor', value: 1.0, unit: 'Faktor', description: 'Multiplikator für die Basiskapazität', minValue: 0.5, maxValue: 2.0, updatedAt: '2025-01-01', updatedBy: 'System' },
  { id: 'param-002', category: 'capacity', name: 'Maximale Auslastung', key: 'max_utilization', value: 95, unit: '%', description: 'Maximale erlaubte Kapazitätsauslastung', minValue: 70, maxValue: 100, updatedAt: '2025-01-01', updatedBy: 'System' },
  { id: 'param-003', category: 'presentation', name: 'Mindest-Präsentationsmenge', key: 'min_presentation', value: 3, unit: 'Stück', description: 'Minimale Anzahl pro Größe auf der Fläche', minValue: 1, maxValue: 10, updatedAt: '2025-01-01', updatedBy: 'System' },
  { id: 'param-004', category: 'presentation', name: 'Größenspiegel-Faktor', key: 'size_curve_factor', value: 1.0, unit: 'Faktor', description: 'Anpassung der Standard-Größenverteilung', minValue: 0.5, maxValue: 1.5, updatedAt: '2025-01-01', updatedBy: 'System' },
  { id: 'param-005', category: 'control', name: 'Prognose-Horizont', key: 'forecast_horizon', value: 8, unit: 'Wochen', description: 'Zeitraum für Absatzprognose', minValue: 2, maxValue: 16, updatedAt: '2025-01-01', updatedBy: 'System' },
  { id: 'param-006', category: 'control', name: 'Sicherheitsbestand-Tage', key: 'safety_stock_days', value: 14, unit: 'Tage', description: 'Puffer für Nachschub-Verzögerungen', minValue: 7, maxValue: 30, updatedAt: '2025-01-01', updatedBy: 'System' },
  { id: 'param-007', category: 'blocking', name: 'Mindestverkaufstage', key: 'min_selling_days', value: 21, unit: 'Tage', description: 'Minimum Verkaufszeitraum vor Sperrung', minValue: 7, maxValue: 60, updatedAt: '2025-01-01', updatedBy: 'System' },
  { id: 'param-008', category: 'blocking', name: 'Abverkaufs-Schwelle', key: 'sellthrough_threshold', value: 30, unit: '%', description: 'Mindest-Abverkaufsrate für Nachschub', minValue: 10, maxValue: 80, updatedAt: '2025-01-01', updatedBy: 'System' },
];

export function initializeAppData() {
  return {
    user: initialUser,
    stores: initialStores,
    runs: initialRuns,
    scenarios: initialScenarios,
    exceptions: initialExceptions,
    tasks: initialTasks,
    parameters: initialParameters,
  };
}
