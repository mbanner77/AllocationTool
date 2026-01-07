// API Client for Backend Communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Request failed' };
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}

// ============ KPIs ============

export async function fetchKPIs() {
  return request<{
    openTasks: number;
    activeRuns: number;
    openExceptions: number;
    approvedScenarios: number;
    totalStores: number;
    totalArticles: number;
  }>('/kpis');
}

// ============ Stores ============

export async function fetchStores() {
  return request<any[]>('/stores');
}

export async function fetchStore(id: string) {
  return request<any>(`/stores/${id}`);
}

// ============ Articles ============

export async function fetchArticles(filters?: { product_group?: string; season?: string; brand?: string }) {
  const params = new URLSearchParams();
  if (filters?.product_group) params.append('product_group', filters.product_group);
  if (filters?.season) params.append('season', filters.season);
  if (filters?.brand) params.append('brand', filters.brand);
  
  const query = params.toString();
  return request<any[]>(`/articles${query ? `?${query}` : ''}`);
}

// ============ Allocation Runs ============

export async function fetchRuns(filters?: { type?: string; status?: string; user_name?: string }) {
  const params = new URLSearchParams();
  if (filters?.type) params.append('type', filters.type);
  if (filters?.status) params.append('status', filters.status);
  if (filters?.user_name) params.append('user_name', filters.user_name);
  
  const query = params.toString();
  return request<any[]>(`/runs${query ? `?${query}` : ''}`);
}

export async function fetchRun(id: string) {
  return request<any>(`/runs/${id}`);
}

export async function createRun(data: {
  type: string;
  user_name: string;
  article_count?: number;
  store_count?: number;
  start_date?: string;
}) {
  return request<any>('/runs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRun(id: string, data: Partial<{
  type: string;
  status: string;
  article_count: number;
  store_count: number;
  progress: number;
  end_date: string;
}>) {
  return request<any>(`/runs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRun(id: string) {
  return request<void>(`/runs/${id}`, { method: 'DELETE' });
}

// ============ Scenarios ============

export async function fetchScenarios(filters?: { status?: string; allocation_type?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.allocation_type) params.append('allocation_type', filters.allocation_type);
  
  const query = params.toString();
  return request<any[]>(`/scenarios${query ? `?${query}` : ''}`);
}

export async function fetchScenario(id: string) {
  return request<any>(`/scenarios/${id}`);
}

export async function createScenario(data: {
  name: string;
  description?: string;
  allocation_type: string;
  created_by: string;
  parameters?: any;
}) {
  return request<any>('/scenarios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateScenario(id: string, data: Partial<{
  name: string;
  description: string;
  status: string;
  parameters: any;
  results: any;
}>) {
  return request<any>(`/scenarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteScenario(id: string) {
  return request<void>(`/scenarios/${id}`, { method: 'DELETE' });
}

// ============ Exceptions ============

export async function fetchExceptions(filters?: { status?: string; severity?: string; type?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.severity) params.append('severity', filters.severity);
  if (filters?.type) params.append('type', filters.type);
  
  const query = params.toString();
  return request<any[]>(`/exceptions${query ? `?${query}` : ''}`);
}

export async function createException(data: {
  type: string;
  severity: string;
  title: string;
  description?: string;
  store_id?: string;
  article_id?: string;
  run_id?: string;
  recommended_action?: string;
}) {
  return request<any>('/exceptions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateException(id: string, data: Partial<{
  status: string;
  assigned_to: string;
}>) {
  return request<any>(`/exceptions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ============ Tasks ============

export async function fetchTasks(filters?: { status?: string; priority?: string; assigned_to?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.priority) params.append('priority', filters.priority);
  if (filters?.assigned_to) params.append('assigned_to', filters.assigned_to);
  
  const query = params.toString();
  return request<any[]>(`/tasks${query ? `?${query}` : ''}`);
}

export async function createTask(data: {
  title: string;
  description?: string;
  type: string;
  priority?: string;
  assigned_to: string;
  due_date: string;
  related_run_id?: string;
  related_scenario_id?: string;
}) {
  return request<any>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: string, data: Partial<{
  title: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string;
  due_date: string;
}>) {
  return request<any>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string) {
  return request<void>(`/tasks/${id}`, { method: 'DELETE' });
}

// ============ Parameters ============

export async function fetchParameters(category?: string) {
  const query = category ? `?category=${category}` : '';
  return request<any[]>(`/parameters${query}`);
}

export async function updateParameter(id: string, value: string | number | boolean, updatedBy: string) {
  return request<any>(`/parameters/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ value, updated_by: updatedBy }),
  });
}

// ============ Data Manager ============

export async function fetchDataManagerConfigs() {
  return request<any[]>('/data-manager/config');
}

export async function updateDataManagerConfig(entityName: string, data: {
  inbound_enabled?: boolean;
  outbound_enabled?: boolean;
  api_key?: string;
  webhook_url?: string;
  sync_interval_minutes?: number;
}) {
  return request<any>(`/data-manager/config/${entityName}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function fetchSyncLogs(entityName: string) {
  return request<any[]>(`/data-manager/logs/${entityName}`);
}

export async function importData(entityName: string, data: any[], apiKey?: string) {
  return request<{ processed: number; failed: number; errors: string[] }>(
    `/data-manager/import/${entityName}`,
    {
      method: 'POST',
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
      body: JSON.stringify({ data }),
    }
  );
}

export async function exportData(entityName: string, filters?: Record<string, any>, apiKey?: string) {
  const params = new URLSearchParams(filters as Record<string, string>);
  const query = params.toString();
  
  return request<any[]>(
    `/data-manager/export/${entityName}${query ? `?${query}` : ''}`,
    {
      headers: apiKey ? { 'X-API-Key': apiKey } : {},
    }
  );
}

// Export API object for convenience
export const api = {
  kpis: { fetch: fetchKPIs },
  stores: { fetch: fetchStores, fetchOne: fetchStore },
  articles: { fetch: fetchArticles },
  runs: { fetch: fetchRuns, fetchOne: fetchRun, create: createRun, update: updateRun, delete: deleteRun },
  scenarios: { fetch: fetchScenarios, fetchOne: fetchScenario, create: createScenario, update: updateScenario, delete: deleteScenario },
  exceptions: { fetch: fetchExceptions, create: createException, update: updateException },
  tasks: { fetch: fetchTasks, create: createTask, update: updateTask, delete: deleteTask },
  parameters: { fetch: fetchParameters, update: updateParameter },
  dataManager: { fetchConfigs: fetchDataManagerConfigs, updateConfig: updateDataManagerConfig, fetchLogs: fetchSyncLogs, import: importData, export: exportData },
};
