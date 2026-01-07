// Data Types - Stammdaten (Master Data) vs Bewegungsdaten (Transaction Data)

// ============ STAMMDATEN (Master Data) - External read only ============

export interface Store {
  id: string;
  name: string;
  description: string;
  cluster: 'Urban Premium' | 'Urban Standard' | 'Regional' | 'Outlet';
  region: string;
  address: string;
  total_capacity: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Article {
  id: string;
  article_number: string;
  description: string;
  color: string;
  color_hex: string;
  brand: string;
  product_group: string;
  purchase_area: string;
  season: string;
  size_range: string[];
  price: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductHierarchy {
  id: string;
  name: string;
  level: 'company' | 'division' | 'category' | 'productGroup' | 'article';
  parent_id: string | null;
  path: string[];
  created_at: Date;
}

// ============ BEWEGUNGSDATEN (Transaction Data) - Bi-directional ============

export type RunStatus = 'planned' | 'running' | 'completed' | 'with_exceptions';
export type RunType = 'initial' | 'replenishment' | 'manual';

export interface AllocationRun {
  id: string;
  type: RunType;
  status: RunStatus;
  start_date: Date;
  end_date: Date | null;
  article_count: number;
  store_count: number;
  progress: number | null;
  user_name: string;
  created_at: Date;
  updated_at: Date;
}

export type ScenarioStatus = 'draft' | 'simulated' | 'approved' | 'rejected';

export interface Scenario {
  id: string;
  name: string;
  description: string;
  status: ScenarioStatus;
  allocation_type: 'initial' | 'replenishment';
  created_by: string;
  parameters: ScenarioParameters;
  results: SimulationResults | null;
  created_at: Date;
  updated_at: Date;
}

export interface ScenarioParameters {
  forecast_weight: number;
  historical_weight: number;
  safety_stock_factor: number;
  min_allocation_qty: number;
  max_allocation_qty: number;
  cluster_priority: Record<string, number>;
}

export interface SimulationResults {
  total_allocated: number;
  stores_covered: number;
  expected_fill_rate: number;
  capacity_utilization: number;
  exceptions: number;
  simulated_at: Date;
}

export type ExceptionType = 'capacity' | 'stock' | 'forecast' | 'manual' | 'lot_conflict' | 'delivery_conflict';
export type ExceptionSeverity = 'info' | 'critical' | 'blocking';
export type ExceptionStatus = 'open' | 'in_progress' | 'resolved' | 'ignored';

export interface Exception {
  id: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  description: string;
  store_id: string | null;
  article_id: string | null;
  run_id: string | null;
  assigned_to: string | null;
  recommended_action: string | null;
  created_at: Date;
  resolved_at: Date | null;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'allocation' | 'review' | 'approval' | 'exception';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string;
  due_date: Date;
  related_run_id: string | null;
  related_scenario_id: string | null;
  created_at: Date;
  completed_at: Date | null;
}

export type ParameterCategory = 'capacity' | 'presentation' | 'control' | 'blocking' | 'forecast' | 'governance';

export interface AllocationParameter {
  id: string;
  category: ParameterCategory;
  name: string;
  key: string;
  value: string | number | boolean;
  unit: string | null;
  description: string;
  min_value: number | null;
  max_value: number | null;
  hierarchy_level: string | null;
  hierarchy_id: string | null;
  updated_at: Date;
  updated_by: string;
}

export interface CapacityData {
  id: string;
  store_id: string;
  article_id: string;
  season: string;
  allocation_type: 'initial' | 'replenishment';
  total_capacity: number;
  actual_capacity: number;
  target_capacity: number;
  forecast_suggestion: number;
  inventory: number;
  updated_at: Date;
}

// ============ Data Manager Configuration ============

export type DataDirection = 'inbound' | 'outbound' | 'bidirectional';
export type DataCategory = 'master' | 'transaction';

export interface DataManagerConfig {
  id: string;
  entity_name: string;
  data_category: DataCategory;
  inbound_enabled: boolean;
  outbound_enabled: boolean;
  api_key: string | null;
  webhook_url: string | null;
  sync_interval_minutes: number | null;
  last_sync_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface SyncLog {
  id: string;
  config_id: string;
  direction: 'inbound' | 'outbound';
  status: 'success' | 'failed' | 'partial';
  records_processed: number;
  records_failed: number;
  error_message: string | null;
  started_at: Date;
  completed_at: Date | null;
}

// ============ API Response Types ============

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
