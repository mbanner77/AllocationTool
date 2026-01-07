// Core Types for the Allocation Tool

// ============ Allocation Runs ============
export type RunType = 'initial' | 'replenishment' | 'manual';
export type RunStatus = 'planned' | 'running' | 'completed' | 'with_exceptions';

export interface AllocationRun {
  id: string;
  type: RunType;
  status: RunStatus;
  startDate: string;
  endDate?: string;
  articleCount: number;
  storeCount: number;
  progress?: number;
  user: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Articles ============
export interface Article {
  id: string;
  articleNumber: string;
  description: string;
  color: string;
  colorHex: string;
  season: string;
  brand: string;
  productGroup: string;
  purchaseArea: string;
  sizeRange: string[];
  price: number;
  createdAt: string;
}

// ============ Stores ============
export type ClusterType = 'Urban Premium' | 'Urban Standard' | 'Regional' | 'Outlet';

export interface Store {
  id: string;
  name: string;
  description: string;
  cluster: ClusterType;
  region: string;
  address: string;
  totalCapacity: number;
  isActive: boolean;
  createdAt: string;
}

// ============ Capacity ============
export type Season = 'HW 2025' | 'SW 2025' | 'HW 2026' | 'SW 2026' | 'NOS';
export type AllocationType = 'initial' | 'replenishment';
export type CapacityStatus = 'ok' | 'over' | 'under';

export interface CapacityData {
  id: string;
  storeId: string;
  productNumber: string;
  product: string;
  brand: string;
  productGroup: string;
  purchaseArea: string;
  season: Season;
  allocationType: AllocationType;
  totalCapacity: number;
  actualCapacity: number;
  targetCapacity: number;
  forecastSuggestion: number;
  inventory: number;
}

// ============ Scenarios ============
export type ScenarioStatus = 'draft' | 'simulated' | 'approved' | 'rejected';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  status: ScenarioStatus;
  allocationType: 'initial' | 'replenishment';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  parameters: ScenarioParameters;
  results?: SimulationResults;
}

export interface ScenarioParameters {
  forecastWeight: number;
  historicalWeight: number;
  safetyStockFactor: number;
  minAllocationQty: number;
  maxAllocationQty: number;
  clusterPriority: Record<ClusterType, number>;
}

export interface SimulationResults {
  totalAllocated: number;
  storesCovered: number;
  expectedFillRate: number;
  capacityUtilization: number;
  exceptions: number;
  simulatedAt: string;
}

// ============ Exceptions ============
export type ExceptionType = 'capacity' | 'stock' | 'forecast' | 'manual';
export type ExceptionSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ExceptionStatus = 'open' | 'in_progress' | 'resolved' | 'ignored';

export interface Exception {
  id: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  description: string;
  storeId?: string;
  articleId?: string;
  runId?: string;
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
}

// ============ Parameters ============
export interface AllocationParameter {
  id: string;
  category: 'capacity' | 'presentation' | 'control' | 'blocking';
  name: string;
  key: string;
  value: number | string | boolean;
  unit?: string;
  description: string;
  minValue?: number;
  maxValue?: number;
  updatedAt: string;
  updatedBy: string;
}

// ============ Tasks / Work Items ============
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'allocation' | 'review' | 'approval' | 'exception';
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string;
  dueDate: string;
  relatedRunId?: string;
  relatedScenarioId?: string;
  createdAt: string;
  completedAt?: string;
}

// ============ Analytics ============
export interface KPIData {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  period: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  category?: string;
}

// ============ User ============
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  department: string;
}

// ============ App State ============
export interface AppState {
  runs: AllocationRun[];
  articles: Article[];
  stores: Store[];
  capacityData: CapacityData[];
  scenarios: Scenario[];
  exceptions: Exception[];
  parameters: AllocationParameter[];
  tasks: Task[];
  currentUser: User | null;
  isLoading: boolean;
}
