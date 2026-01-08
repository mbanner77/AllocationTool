import { useState, useEffect, useMemo } from 'react';
import { 
  Database, RefreshCw, Settings, Upload, Download, 
  CheckCircle, XCircle, Clock, AlertTriangle, Key,
  Globe, Webhook, Save, RotateCcw, FileJson, History,
  Plus, Trash2, Edit2, Eye, Table, HardDrive, RotateCw,
  Activity, Zap, Shield, Copy, FileUp, AlertCircle, Info,
  Languages, Search, ChevronDown, ChevronRight, RotateCw as Reload,
  Filter, ArrowUpDown, CheckSquare, Square, BarChart3, TrendingUp, Layers
} from 'lucide-react';
import { useToast } from '../ui/Toast';
import { api } from '../../services/api';
import { dataService } from '../../services/dataService';
import { useLanguage } from '../../i18n';
import { translationsService, TranslationEntry } from '../../services/translationsService';
import { translations, Language } from '../../i18n/translations';
import { CmsTranslationsTab } from './CmsTranslationsTab';

interface DataManagerScreenProps {
  onNavigate: (screen: string) => void;
}

interface DataConfig {
  id: string;
  entity_name: string;
  data_category: 'master' | 'transaction';
  inbound_enabled: boolean;
  outbound_enabled: boolean;
  api_key: string | null;
  webhook_url: string | null;
  sync_interval_minutes: number | null;
  last_sync_at: string | null;
}

interface SyncLog {
  id: string;
  direction: 'inbound' | 'outbound';
  status: 'success' | 'failed' | 'partial';
  records_processed: number;
  records_failed: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

// Entity labels are now dynamic via translations - see getEntityLabel function

const CATEGORY_COLORS = {
  master: { bg: 'var(--status-info)' },
  transaction: { bg: 'var(--status-success)' }
};

// Fallback mock data when API is not available
const MOCK_CONFIGS: DataConfig[] = [
  { id: '1', entity_name: 'stores', data_category: 'master', inbound_enabled: true, outbound_enabled: false, api_key: null, webhook_url: null, sync_interval_minutes: null, last_sync_at: null },
  { id: '2', entity_name: 'articles', data_category: 'master', inbound_enabled: true, outbound_enabled: false, api_key: null, webhook_url: null, sync_interval_minutes: null, last_sync_at: null },
  { id: '3', entity_name: 'allocation_runs', data_category: 'transaction', inbound_enabled: true, outbound_enabled: true, api_key: null, webhook_url: null, sync_interval_minutes: 60, last_sync_at: '2025-01-07T10:00:00Z' },
  { id: '4', entity_name: 'scenarios', data_category: 'transaction', inbound_enabled: true, outbound_enabled: true, api_key: null, webhook_url: null, sync_interval_minutes: null, last_sync_at: null },
  { id: '5', entity_name: 'exceptions', data_category: 'transaction', inbound_enabled: true, outbound_enabled: true, api_key: null, webhook_url: null, sync_interval_minutes: 30, last_sync_at: '2025-01-07T11:30:00Z' },
  { id: '6', entity_name: 'tasks', data_category: 'transaction', inbound_enabled: true, outbound_enabled: true, api_key: null, webhook_url: null, sync_interval_minutes: null, last_sync_at: null },
];

export function DataManagerScreen({ onNavigate }: DataManagerScreenProps) {
  const { t } = useLanguage();
  
  // Dynamic entity labels based on current language
  const getEntityLabel = (entityName: string) => {
    const labels: Record<string, { name: string; description: string }> = {
      stores: { name: t.dataManager.stores, description: t.dataManager.storesDesc },
      articles: { name: t.dataManager.articles, description: t.dataManager.articlesDesc },
      allocation_runs: { name: t.dataManager.allocationRuns, description: t.dataManager.allocationRunsDesc },
      scenarios: { name: t.dataManager.scenariosEntity, description: t.dataManager.scenariosDesc },
      exceptions: { name: t.dataManager.exceptionsEntity, description: t.dataManager.exceptionsDesc },
      tasks: { name: t.dataManager.tasksEntity, description: t.dataManager.tasksDesc },
    };
    return labels[entityName] || { name: entityName, description: '' };
  };
  
  const getCategoryLabel = (category: 'master' | 'transaction') => {
    return category === 'master' ? t.dataManager.masterData : t.dataManager.transactionData;
  };

  const [configs, setConfigs] = useState<DataConfig[]>(MOCK_CONFIGS);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editConfig, setEditConfig] = useState<Partial<DataConfig>>({});
  const [activeTab, setActiveTab] = useState<'data' | 'config' | 'logs' | 'import' | 'export' | 'db' | 'cms'>('data');
  
  // CMS State
  const [cmsSelectedSection, setCmsSelectedSection] = useState<string>('');
  const [cmsSearchQuery, setCmsSearchQuery] = useState('');
  const [cmsEditingKey, setCmsEditingKey] = useState<string | null>(null);
  const [cmsEditValues, setCmsEditValues] = useState<{ de: string; en: string }>({ de: '', en: '' });
  const [cmsCustomEntries, setCmsCustomEntries] = useState<TranslationEntry[]>([]);
  const [cmsLoading, setCmsLoading] = useState(false);
  const [cmsExpandedSections, setCmsExpandedSections] = useState<Set<string>>(new Set());
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<{ processed: number; failed: number; errors: string[] } | null>(null);
  const [entityData, setEntityData] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editJson, setEditJson] = useState('');
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    database?: string;
    serverTime?: string;
    tables?: Record<string, number>;
    environment?: string;
    error?: string;
    loading: boolean;
  }>({ connected: false, loading: true });
  const [dbActionLoading, setDbActionLoading] = useState<string | null>(null);
  const [dbHealth, setDbHealth] = useState<{
    latency_ms?: number;
    database_size?: string;
    active_connections?: number;
    table_sizes?: Array<{ table_name: string; size: string }>;
    table_stats?: Array<{ table_name: string; live_rows: number; dead_rows: number }>;
  } | null>(null);
  const [showTableDetail, setShowTableDetail] = useState<string | null>(null);
  const [tableDetail, setTableDetail] = useState<{
    columns?: Array<{ column_name: string; data_type: string; is_nullable: string }>;
    row_count?: number;
    size?: string;
    recent_records?: any[];
  } | null>(null);
  const [backupData, setBackupData] = useState<string | null>(null);
  
  // Search, filter, sort state
  const [dataSearchQuery, setDataSearchQuery] = useState('');
  const [dataSortField, setDataSortField] = useState<string>('id');
  const [dataSortDirection, setDataSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);
  
  // Toast notifications
  const toast = useToast();

  // Load entity data based on selected entity
  const loadEntityData = async (entityName: string) => {
    setLoadingData(true);
    try {
      let data: any[] = [];
      switch (entityName) {
        case 'stores':
          data = await dataService.getStores();
          break;
        case 'articles':
          // Articles don't have a dedicated endpoint yet, use empty
          data = [];
          break;
        case 'allocation_runs':
          data = await dataService.getRuns();
          break;
        case 'scenarios':
          data = await dataService.getScenarios();
          break;
        case 'exceptions':
          data = await dataService.getExceptions();
          break;
        case 'tasks':
          data = await dataService.getTasks();
          break;
      }
      setEntityData(data);
    } catch (error) {
      console.error('Failed to load entity data:', error);
      setEntityData([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Reset all data to defaults
  const handleResetToDefaults = () => {
    if (confirm('Alle lokalen Daten auf Standardwerte zurücksetzen? Dies kann nicht rückgängig gemacht werden.')) {
      dataService.resetToDefaults();
      if (selectedEntity) {
        loadEntityData(selectedEntity);
      }
      toast.success('Daten zurückgesetzt', 'Alle lokalen Daten wurden auf die Standardwerte zurückgesetzt.');
    }
  };

  // Filtered and sorted entity data
  const filteredEntityData = useMemo(() => {
    let filtered = entityData;
    
    // Search filter
    if (dataSearchQuery) {
      const query = dataSearchQuery.toLowerCase();
      filtered = filtered.filter((item: any) => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(query)
        )
      );
    }
    
    // Sort
    filtered = [...filtered].sort((a: any, b: any) => {
      const aVal = a[dataSortField] ?? '';
      const bVal = b[dataSortField] ?? '';
      const comparison = String(aVal).localeCompare(String(bVal));
      return dataSortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  }, [entityData, dataSearchQuery, dataSortField, dataSortDirection]);

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredEntityData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredEntityData.map((item: any) => item.id)));
    }
  };

  // Bulk delete selected items
  const handleBulkDelete = () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`${selectedItems.size} Einträge wirklich löschen?`)) return;
    
    setEntityData(prev => prev.filter((item: any) => !selectedItems.has(item.id)));
    toast.success('Einträge gelöscht', `${selectedItems.size} Einträge wurden erfolgreich gelöscht.`);
    setSelectedItems(new Set());
  };

  // Copy selected items to clipboard
  const handleCopySelected = () => {
    const selectedData = entityData.filter((item: any) => selectedItems.has(item.id));
    navigator.clipboard.writeText(JSON.stringify(selectedData, null, 2));
    toast.success('Kopiert', `${selectedItems.size} Einträge in die Zwischenablage kopiert.`);
  };

  // Save edited item
  const handleSaveItem = () => {
    if (!editingItem || !editJson) return;
    try {
      const updated = JSON.parse(editJson);
      setEntityData(prev => prev.map(item => item.id === editingItem.id ? updated : item));
      setEditingItem(null);
      setEditJson('');
    } catch (e) {
      alert('Ungültiges JSON-Format');
    }
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    if (confirm(t.actions.deleteConfirm)) {
      setEntityData(prev => prev.filter(item => item.id !== id));
    }
  };

  // Load database status
  const loadDbStatus = async () => {
    setDbStatus(prev => ({ ...prev, loading: true }));
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
    const baseUrl = apiUrl.replace('/api', '');
    
    try {
      // First check if API is reachable at all (health check)
      const healthResponse = await fetch(`${baseUrl}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!healthResponse.ok) {
        setDbStatus({ 
          connected: false, 
          error: `API nicht erreichbar (Status: ${healthResponse.status})`, 
          loading: false 
        });
        return;
      }
      
      // Now check database status
      const response = await fetch(`${apiUrl}/db/status`, {
        signal: AbortSignal.timeout(10000)
      });
      const result = await response.json();
      
      if (result.success) {
        setDbStatus({ ...result.data, loading: false });
      } else {
        setDbStatus({ connected: false, error: result.data?.error || 'DB-Verbindung fehlgeschlagen', loading: false });
      }
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = 'Zeitüberschreitung - API antwortet nicht';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = `API nicht erreichbar (${baseUrl}). Render-Service möglicherweise nicht gestartet.`;
      }
      setDbStatus({ connected: false, error: errorMessage, loading: false });
    }
  };

  // Run database migration
  const handleMigrateDb = async () => {
    if (!confirm('Datenbank-Tabellen erstellen? Dies erstellt alle fehlenden Tabellen.')) return;
    setDbActionLoading('migrate');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/db/migrate`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert('Migration erfolgreich! Tabellen wurden erstellt.');
        loadDbStatus();
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (error: any) {
      alert('Fehler: ' + error.message);
    } finally {
      setDbActionLoading(null);
    }
  };

  // Re-seed database
  const handleReseedDb = async () => {
    if (!confirm('Testdaten einfügen? Bestehende Daten bleiben erhalten.')) return;
    setDbActionLoading('seed');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/db/seed`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert('Testdaten erfolgreich eingefügt!');
        loadDbStatus();
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (error: any) {
      alert('Fehler: ' + error.message);
    } finally {
      setDbActionLoading(null);
    }
  };

  // Clear a specific table
  const handleClearTable = async (table: string) => {
    if (!confirm(`Tabelle "${table}" wirklich leeren? Diese Aktion kann nicht rückgängig gemacht werden.`)) return;
    setDbActionLoading(`clear-${table}`);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/db/truncate/${table}`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert(`Tabelle "${table}" wurde geleert.`);
        loadDbStatus();
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (error: any) {
      alert('Fehler: ' + error.message);
    } finally {
      setDbActionLoading(null);
    }
  };

  // Load detailed database health metrics
  const loadDbHealth = async () => {
    setDbActionLoading('health');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/db/health`);
      const result = await response.json();
      if (result.success) {
        setDbHealth(result.data);
      }
    } catch (error: any) {
      console.error('Health check failed:', error);
    } finally {
      setDbActionLoading(null);
    }
  };

  // Create and download database backup
  const handleBackup = async () => {
    setDbActionLoading('backup');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/db/backup`);
      const result = await response.json();
      if (result.success) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        alert('Backup erfolgreich heruntergeladen!');
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (error: any) {
      alert('Fehler: ' + error.message);
    } finally {
      setDbActionLoading(null);
    }
  };

  // Restore database from backup file
  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!confirm('Datenbank aus Backup wiederherstellen? Bestehende Daten werden überschrieben.')) {
      event.target.value = '';
      return;
    }
    
    setDbActionLoading('restore');
    try {
      const content = await file.text();
      const backup = JSON.parse(content);
      
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/db/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: backup.tables })
      });
      const result = await response.json();
      if (result.success) {
        alert('Backup erfolgreich wiederhergestellt!');
        loadDbStatus();
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (error: any) {
      alert('Fehler beim Wiederherstellen: ' + error.message);
    } finally {
      setDbActionLoading(null);
      event.target.value = '';
    }
  };

  // Optimize database (vacuum/analyze)
  const handleOptimize = async () => {
    if (!confirm('Datenbank optimieren? Dies kann einige Sekunden dauern.')) return;
    setDbActionLoading('optimize');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/db/vacuum`, { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        alert('Datenbank-Optimierung abgeschlossen!');
        loadDbHealth();
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (error: any) {
      alert('Fehler: ' + error.message);
    } finally {
      setDbActionLoading(null);
    }
  };

  // Complete database reset
  const handleDbReset = async () => {
    const confirmation = prompt('ACHTUNG: Alle Daten werden gelöscht!\n\nGeben Sie "RESET" ein um fortzufahren:');
    if (confirmation !== 'RESET') {
      alert('Reset abgebrochen.');
      return;
    }
    
    setDbActionLoading('reset');
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/db/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESET_ALL_DATA' })
      });
      const result = await response.json();
      if (result.success) {
        alert('Datenbank zurückgesetzt. Bitte führen Sie die Migration erneut aus.');
        loadDbStatus();
      } else {
        alert('Fehler: ' + result.error);
      }
    } catch (error: any) {
      alert('Fehler: ' + error.message);
    } finally {
      setDbActionLoading(null);
    }
  };

  // Load table details
  const loadTableDetail = async (table: string) => {
    setShowTableDetail(table);
    setTableDetail(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
      const response = await fetch(`${apiUrl}/db/table/${table}/info`);
      const result = await response.json();
      if (result.success) {
        setTableDetail(result.data);
      }
    } catch (error: any) {
      console.error('Failed to load table details:', error);
    }
  };

  useEffect(() => {
    loadConfigs();
    loadDbStatus();
  }, []);

  useEffect(() => {
    if (selectedEntity) {
      loadEntityData(selectedEntity);
    }
  }, [selectedEntity]);

  useEffect(() => {
    if (selectedEntity) {
      loadSyncLogs(selectedEntity);
      const config = configs.find(c => c.entity_name === selectedEntity);
      if (config) {
        setEditConfig({
          inbound_enabled: config.inbound_enabled,
          outbound_enabled: config.outbound_enabled,
          api_key: config.api_key,
          webhook_url: config.webhook_url,
          sync_interval_minutes: config.sync_interval_minutes
        });
      }
    }
  }, [selectedEntity, configs]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const result = await api.dataManager.fetchConfigs();
      if (result.success && result.data && result.data.length > 0) {
        setConfigs(result.data);
        if (!selectedEntity) {
          setSelectedEntity(result.data[0].entity_name);
        }
      } else {
        // Fallback to mock data
        setConfigs(MOCK_CONFIGS);
        if (!selectedEntity) {
          setSelectedEntity(MOCK_CONFIGS[0].entity_name);
        }
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
      // Fallback to mock data
      setConfigs(MOCK_CONFIGS);
      if (!selectedEntity) {
        setSelectedEntity(MOCK_CONFIGS[0].entity_name);
      }
    }
    setLoading(false);
  };

  const loadSyncLogs = async (entityName: string) => {
    const result = await api.dataManager.fetchLogs(entityName);
    if (result.success && result.data) {
      setSyncLogs(result.data);
    }
  };

  const saveConfig = async () => {
    if (!selectedEntity) return;
    setSaving(true);
    
    const result = await api.dataManager.updateConfig(selectedEntity, editConfig);
    if (result.success) {
      await loadConfigs();
    }
    setSaving(false);
  };

  const handleImport = async () => {
    if (!selectedEntity || !importData) return;
    
    try {
      const data = JSON.parse(importData);
      const config = configs.find(c => c.entity_name === selectedEntity);
      const result = await api.dataManager.import(selectedEntity, Array.isArray(data) ? data : [data], config?.api_key || undefined);
      
      if (result.success && result.data) {
        setImportResult(result.data);
        await loadSyncLogs(selectedEntity);
      }
    } catch (e: any) {
      setImportResult({ processed: 0, failed: 1, errors: ['Invalid JSON: ' + e.message] });
    }
  };

  const handleExport = async () => {
    if (!selectedEntity) return;
    
    const config = configs.find(c => c.entity_name === selectedEntity);
    const result = await api.dataManager.export(selectedEntity, {}, config?.api_key || undefined);
    
    if (result.success && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedEntity}_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const selectedConfig = configs.find(c => c.entity_name === selectedEntity);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
          <Database className="inline mr-2" size={24} />
          {t.dataManager.title}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {t.dataManager.selectEntity}
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Entity List */}
        <div className="col-span-3">
          <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-default)' }}>
              <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>{t.common.all}</h2>
            </div>
            <div className="p-2">
              {configs.map(config => (
                <button
                  key={config.entity_name}
                  onClick={() => setSelectedEntity(config.entity_name)}
                  className="w-full text-left p-3 rounded-lg mb-1 transition-colors"
                  style={{
                    background: selectedEntity === config.entity_name ? 'var(--brand-primary-light)' : 'transparent',
                    border: selectedEntity === config.entity_name ? '1px solid var(--brand-primary)' : '1px solid transparent'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                      {getEntityLabel(config.entity_name).name}
                    </span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ 
                        background: CATEGORY_COLORS[config.data_category].bg,
                        color: 'white'
                      }}
                    >
                      {getCategoryLabel(config.data_category)}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {getEntityLabel(config.entity_name).description}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {config.inbound_enabled && (
                      <span className="flex items-center text-xs" style={{ color: 'var(--status-success)' }}>
                        <Download size={12} className="mr-1" /> Inbound
                      </span>
                    )}
                    {config.outbound_enabled && (
                      <span className="flex items-center text-xs" style={{ color: 'var(--status-info)' }}>
                        <Upload size={12} className="mr-1" /> Outbound
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Config Panel */}
        <div className="col-span-9">
          {selectedConfig && (
            <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
              {/* Tabs */}
              <div style={{ borderBottom: '1px solid var(--border-default)', padding: 'var(--space-2) var(--space-4)' }}>
                <div className="flex gap-2">
                  {(['data', 'config', 'logs', 'import', 'export', 'db', 'cms'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-4 py-2 rounded-lg transition-colors"
                      style={{
                        background: activeTab === tab ? 'var(--brand-primary)' : 'transparent',
                        color: activeTab === tab ? 'white' : 'var(--text-primary)'
                      }}
                    >
                      {tab === 'data' && <><Table size={16} className="inline mr-2" />{t.dataManager.tabData}</>}
                      {tab === 'config' && <><Settings size={16} className="inline mr-2" />{t.dataManager.tabConfig}</>}
                      {tab === 'logs' && <><History size={16} className="inline mr-2" />{t.dataManager.tabLogs}</>}
                      {tab === 'import' && <><Download size={16} className="inline mr-2" />{t.dataManager.tabImport}</>}
                      {tab === 'export' && <><Upload size={16} className="inline mr-2" />{t.dataManager.tabExport}</>}
                      {tab === 'db' && <><HardDrive size={16} className="inline mr-2" />{t.dataManager.tabDb}</>}
                      {tab === 'cms' && <><Languages size={16} className="inline mr-2" />CMS</>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {/* Data Tab */}
                {activeTab === 'data' && (
                  <div>
                    {/* Statistics Cards */}
                    {showStats && entityData.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <Layers size={16} style={{ color: 'var(--brand-primary)' }} />
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Gesamt</span>
                          </div>
                          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>{entityData.length}</div>
                        </div>
                        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <Filter size={16} style={{ color: 'var(--status-info)' }} />
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Gefiltert</span>
                          </div>
                          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>{filteredEntityData.length}</div>
                        </div>
                        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <CheckSquare size={16} style={{ color: 'var(--status-success)' }} />
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Ausgewählt</span>
                          </div>
                          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>{selectedItems.size}</div>
                        </div>
                        <div className="p-4 rounded-lg" style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}>
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={16} style={{ color: 'var(--status-warning)' }} />
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Kategorie</span>
                          </div>
                          <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>{getCategoryLabel(selectedConfig?.data_category || 'master')}</div>
                        </div>
                      </div>
                    )}

                    {/* Header with actions */}
                    <div className="flex justify-between items-center mb-4">
                      <h3 style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        <Table size={18} className="inline mr-2" />
                        {getEntityLabel(selectedEntity!).name}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowStats(!showStats)}
                          className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                          style={{ border: '1px solid var(--border-default)', background: showStats ? 'var(--brand-primary-light)' : 'transparent' }}
                          title="Statistiken ein/ausblenden"
                        >
                          <BarChart3 size={14} />
                        </button>
                        <button
                          onClick={() => loadEntityData(selectedEntity!)}
                          className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                          style={{ border: '1px solid var(--border-default)' }}
                        >
                          <RefreshCw size={14} />
                          {t.common.refresh}
                        </button>
                        <button
                          onClick={() => {
                            const newItem = { id: `new-${Date.now()}`, name: 'Neuer Eintrag' };
                            setEditingItem(newItem);
                            setEditJson(JSON.stringify(newItem, null, 2));
                          }}
                          className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                          style={{ background: 'var(--brand-primary)', color: 'white' }}
                        >
                          <Plus size={14} />
                          Neu
                        </button>
                      </div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          placeholder="Suchen..."
                          value={dataSearchQuery}
                          onChange={(e) => setDataSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 rounded-lg"
                          style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)' }}
                        />
                      </div>
                      <select
                        value={dataSortField}
                        onChange={(e) => setDataSortField(e.target.value)}
                        className="px-3 py-2 rounded-lg"
                        style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)' }}
                      >
                        <option value="id">ID</option>
                        <option value="name">Name</option>
                        <option value="status">Status</option>
                        <option value="created_at">Erstellt</option>
                      </select>
                      <button
                        onClick={() => setDataSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
                        className="px-3 py-2 rounded-lg flex items-center gap-1"
                        style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)' }}
                        title={dataSortDirection === 'asc' ? 'Aufsteigend' : 'Absteigend'}
                      >
                        <ArrowUpDown size={14} />
                        {dataSortDirection === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>

                    {/* Bulk Actions Bar */}
                    {selectedItems.size > 0 && (
                      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: 'var(--brand-primary-light)', border: '1px solid var(--brand-primary)' }}>
                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          {selectedItems.size} ausgewählt
                        </span>
                        <div className="flex gap-2 ml-auto">
                          <button
                            onClick={handleCopySelected}
                            className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                            style={{ background: 'white', border: '1px solid var(--border-default)' }}
                          >
                            <Copy size={14} />
                            Kopieren
                          </button>
                          <button
                            onClick={handleBulkDelete}
                            className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                            style={{ background: 'var(--status-danger)', color: 'white' }}
                          >
                            <Trash2 size={14} />
                            Löschen
                          </button>
                          <button
                            onClick={() => setSelectedItems(new Set())}
                            className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                            style={{ background: 'white', border: '1px solid var(--border-default)' }}
                          >
                            Auswahl aufheben
                          </button>
                        </div>
                      </div>
                    )}

                    {loadingData ? (
                      <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
                        <p>{t.common.loading}</p>
                      </div>
                    ) : entityData.length === 0 ? (
                      <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <Database size={32} className="mx-auto mb-2 opacity-50" />
                        <p>{t.common.noData}</p>
                      </div>
                    ) : filteredEntityData.length === 0 ? (
                      <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <Search size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Keine Ergebnisse für "{dataSearchQuery}"</p>
                        <button 
                          onClick={() => setDataSearchQuery('')}
                          className="mt-2 text-sm underline"
                          style={{ color: 'var(--brand-primary)' }}
                        >
                          Filter zurücksetzen
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {/* Select All Header */}
                        <div className="flex items-center gap-3 px-3 py-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
                          <button onClick={toggleSelectAll} className="p-1">
                            {selectedItems.size === filteredEntityData.length ? (
                              <CheckSquare size={18} style={{ color: 'var(--brand-primary)' }} />
                            ) : (
                              <Square size={18} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </button>
                          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                            {filteredEntityData.length} Einträge
                          </span>
                        </div>
                        
                        {filteredEntityData.map((item: any) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-lg flex items-center gap-3"
                            style={{ 
                              background: selectedItems.has(item.id) ? 'var(--brand-primary-light)' : 'var(--surface-page)', 
                              border: `1px solid ${selectedItems.has(item.id) ? 'var(--brand-primary)' : 'var(--border-default)'}` 
                            }}
                          >
                            <button onClick={() => toggleItemSelection(item.id)} className="p-1">
                              {selectedItems.has(item.id) ? (
                                <CheckSquare size={18} style={{ color: 'var(--brand-primary)' }} />
                              ) : (
                                <Square size={18} style={{ color: 'var(--text-muted)' }} />
                              )}
                            </button>
                            <div className="flex-1">
                              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                                {item.name || item.title || item.id}
                              </div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                ID: {item.id} {item.status && `| Status: ${item.status}`}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setEditJson(JSON.stringify(item, null, 2));
                                }}
                                className="p-2 rounded hover:bg-gray-100"
                                title={t.actions.edit}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 rounded hover:bg-red-50"
                                style={{ color: 'var(--status-danger)' }}
                                title={t.actions.delete}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Edit Modal */}
                    {editingItem && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                          <h3 className="text-lg font-semibold mb-4">
                            {editingItem.id?.startsWith('new-') ? t.actions.newEntry : t.actions.editEntry}
                          </h3>
                          <textarea
                            value={editJson}
                            onChange={(e) => setEditJson(e.target.value)}
                            className="w-full h-64 p-3 rounded-lg font-mono text-sm mb-4"
                            style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}
                          />
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => { setEditingItem(null); setEditJson(''); }}
                              className="px-4 py-2 rounded-lg"
                              style={{ border: '1px solid var(--border-default)' }}
                            >
                              {t.actions.cancel}
                            </button>
                            <button
                              onClick={handleSaveItem}
                              className="px-4 py-2 rounded-lg flex items-center gap-2"
                              style={{ background: 'var(--brand-primary)', color: 'white' }}
                            >
                              <Save size={16} />
                              {t.actions.save}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Config Tab */}
                {activeTab === 'config' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Inbound Settings */}
                      <div style={{ padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                        <h3 className="flex items-center gap-2 mb-4" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          <Download size={18} style={{ color: 'var(--status-success)' }} />
                          Inbound (Eingehend)
                        </h3>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                          {selectedConfig.data_category === 'master' 
                            ? 'Stammdaten können nur von externen Systemen eingespielt werden'
                            : 'Daten von externen Systemen empfangen'}
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editConfig.inbound_enabled || false}
                            onChange={e => setEditConfig({ ...editConfig, inbound_enabled: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span>Inbound aktiviert</span>
                        </label>
                      </div>

                      {/* Outbound Settings */}
                      <div style={{ padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                        <h3 className="flex items-center gap-2 mb-4" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          <Upload size={18} style={{ color: 'var(--status-info)' }} />
                          Outbound (Ausgehend)
                        </h3>
                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                          {selectedConfig.data_category === 'master' 
                            ? 'Stammdaten können nicht nach außen übertragen werden'
                            : 'Daten an externe Systeme senden'}
                        </p>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editConfig.outbound_enabled || false}
                            onChange={e => setEditConfig({ ...editConfig, outbound_enabled: e.target.checked })}
                            disabled={selectedConfig.data_category === 'master'}
                            className="w-4 h-4"
                          />
                          <span style={{ color: selectedConfig.data_category === 'master' ? 'var(--text-muted)' : 'inherit' }}>
                            Outbound aktiviert
                          </span>
                        </label>
                        {selectedConfig.data_category === 'master' && (
                          <div className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--status-warning)' }}>
                            <AlertTriangle size={12} />
                            Für Stammdaten nicht verfügbar
                          </div>
                        )}
                      </div>
                    </div>

                    {/* API Key */}
                    <div>
                      <label className="flex items-center gap-2 mb-2" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        <Key size={16} />
                        API-Schlüssel
                      </label>
                      <input
                        type="text"
                        value={editConfig.api_key || ''}
                        onChange={e => setEditConfig({ ...editConfig, api_key: e.target.value || null })}
                        placeholder="Optional: Authentifizierungsschlüssel für API-Zugriffe"
                        className="w-full px-3 py-2 rounded-lg"
                        style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}
                      />
                    </div>

                    {/* Webhook URL */}
                    <div>
                      <label className="flex items-center gap-2 mb-2" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        <Webhook size={16} />
                        Webhook URL
                      </label>
                      <input
                        type="url"
                        value={editConfig.webhook_url || ''}
                        onChange={e => setEditConfig({ ...editConfig, webhook_url: e.target.value || null })}
                        placeholder="https://example.com/webhook"
                        className="w-full px-3 py-2 rounded-lg"
                        style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}
                        disabled={!editConfig.outbound_enabled}
                      />
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                        Wird bei Änderungen an dieser Entität aufgerufen (nur bei aktiviertem Outbound)
                      </p>
                    </div>

                    {/* Sync Interval */}
                    <div>
                      <label className="flex items-center gap-2 mb-2" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        <RefreshCw size={16} />
                        Sync-Intervall (Minuten)
                      </label>
                      <input
                        type="number"
                        value={editConfig.sync_interval_minutes || ''}
                        onChange={e => setEditConfig({ ...editConfig, sync_interval_minutes: e.target.value ? parseInt(e.target.value) : null })}
                        placeholder="Optional: Automatisches Sync-Intervall"
                        className="w-full px-3 py-2 rounded-lg"
                        style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}
                        min={1}
                      />
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--border-default)' }}>
                      <button
                        onClick={() => {
                          const config = configs.find(c => c.entity_name === selectedEntity);
                          if (config) {
                            setEditConfig({
                              inbound_enabled: config.inbound_enabled,
                              outbound_enabled: config.outbound_enabled,
                              api_key: config.api_key,
                              webhook_url: config.webhook_url,
                              sync_interval_minutes: config.sync_interval_minutes
                            });
                          }
                        }}
                        className="px-4 py-2 rounded-lg flex items-center gap-2"
                        style={{ border: '1px solid var(--border-default)' }}
                      >
                        <RotateCcw size={16} />
                        Zurücksetzen
                      </button>
                      <button
                        onClick={saveConfig}
                        disabled={saving}
                        className="px-4 py-2 rounded-lg flex items-center gap-2"
                        style={{ background: 'var(--brand-primary)', color: 'white' }}
                      >
                        <Save size={16} />
                        {saving ? t.actions.saving : t.actions.save}
                      </button>
                    </div>
                  </div>
                )}

                {/* Logs Tab */}
                {activeTab === 'logs' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 style={{ fontWeight: 'var(--font-weight-medium)' }}>Synchronisations-Protokoll</h3>
                      <button
                        onClick={() => loadSyncLogs(selectedEntity!)}
                        className="px-3 py-1 rounded flex items-center gap-1 text-sm"
                        style={{ border: '1px solid var(--border-default)' }}
                      >
                        <RefreshCw size={14} />
                        Aktualisieren
                      </button>
                    </div>
                    
                    {syncLogs.length === 0 ? (
                      <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={32} className="mx-auto mb-2 opacity-50" />
                        <p>Keine Sync-Einträge vorhanden</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {syncLogs.map(log => (
                          <div
                            key={log.id}
                            className="p-3 rounded-lg flex items-center justify-between"
                            style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}
                          >
                            <div className="flex items-center gap-3">
                              {log.status === 'success' && <CheckCircle size={18} style={{ color: 'var(--status-success)' }} />}
                              {log.status === 'failed' && <XCircle size={18} style={{ color: 'var(--status-danger)' }} />}
                              {log.status === 'partial' && <AlertTriangle size={18} style={{ color: 'var(--status-warning)' }} />}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span style={{ fontWeight: 'var(--font-weight-medium)' }}>
                                    {log.direction === 'inbound' ? 'Import' : 'Export'}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 rounded" style={{
                                    background: log.status === 'success' ? 'var(--status-success)' : 
                                               log.status === 'failed' ? 'var(--status-danger)' : 'var(--status-warning)',
                                    color: 'white'
                                  }}>
                                    {log.status}
                                  </span>
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                  {log.records_processed} verarbeitet, {log.records_failed} fehlgeschlagen
                                </div>
                                {log.error_message && (
                                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--status-danger)' }}>
                                    {log.error_message}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                              {new Date(log.started_at).toLocaleString('de-CH')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Import Tab */}
                {activeTab === 'import' && (
                  <div>
                    <h3 className="mb-4" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                      <FileJson size={18} className="inline mr-2" />
                      Daten importieren
                    </h3>
                    
                    {!selectedConfig.inbound_enabled ? (
                      <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <AlertTriangle size={32} className="mx-auto mb-2" style={{ color: 'var(--status-warning)' }} />
                        <p>Inbound ist für diese Entität deaktiviert</p>
                        <p className="text-sm">Aktivieren Sie Inbound in der Konfiguration</p>
                      </div>
                    ) : (
                      <>
                        <textarea
                          value={importData}
                          onChange={e => setImportData(e.target.value)}
                          placeholder='JSON-Daten hier einfügen, z.B.:\n[\n  { "id": "...", "name": "..." }\n]'
                          className="w-full h-64 p-3 rounded-lg font-mono text-sm"
                          style={{ background: 'var(--surface-page)', border: '1px solid var(--border-default)' }}
                        />
                        
                        {importResult && (
                          <div 
                            className="mt-4 p-4 rounded-lg"
                            style={{ 
                              background: importResult.failed > 0 ? 'var(--status-danger-light)' : 'var(--status-success-light)',
                              border: `1px solid ${importResult.failed > 0 ? 'var(--status-danger)' : 'var(--status-success)'}`
                            }}
                          >
                            <p style={{ fontWeight: 'var(--font-weight-medium)' }}>
                              Import abgeschlossen: {importResult.processed} erfolgreich, {importResult.failed} fehlgeschlagen
                            </p>
                            {importResult.errors.length > 0 && (
                              <ul className="mt-2 text-sm">
                                {importResult.errors.map((err, i) => (
                                  <li key={i} style={{ color: 'var(--status-danger)' }}>{err}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-end mt-4">
                          <button
                            onClick={handleImport}
                            disabled={!importData}
                            className="px-4 py-2 rounded-lg flex items-center gap-2"
                            style={{ background: 'var(--brand-primary)', color: 'white', opacity: !importData ? 0.5 : 1 }}
                          >
                            <Download size={16} />
                            Importieren
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Export Tab */}
                {activeTab === 'export' && (
                  <div>
                    <h3 className="mb-4" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                      <Upload size={18} className="inline mr-2" />
                      Daten exportieren
                    </h3>
                    
                    {selectedConfig.data_category === 'master' || !selectedConfig.outbound_enabled ? (
                      <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                        <AlertTriangle size={32} className="mx-auto mb-2" style={{ color: 'var(--status-warning)' }} />
                        <p>
                          {selectedConfig.data_category === 'master' 
                            ? 'Stammdaten können nicht exportiert werden'
                            : 'Outbound ist für diese Entität deaktiviert'}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Globe size={48} className="mx-auto mb-4" style={{ color: 'var(--brand-primary)' }} />
                        <p className="mb-4">Exportieren Sie alle Daten dieser Entität als JSON-Datei</p>
                        <button
                          onClick={handleExport}
                          className="px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                          style={{ background: 'var(--brand-primary)', color: 'white' }}
                        >
                          <Download size={20} />
                          JSON exportieren
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* DB Management Tab */}
                {activeTab === 'db' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 style={{ fontWeight: 'var(--font-weight-medium)' }}>
                        <HardDrive size={18} className="inline mr-2" />
                        Datenbank-Verwaltung
                      </h3>
                      <button
                        onClick={loadDbStatus}
                        disabled={dbStatus.loading}
                        className="px-3 py-1.5 rounded-lg flex items-center gap-2"
                        style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-default)' }}
                      >
                        <RefreshCw size={14} className={dbStatus.loading ? 'animate-spin' : ''} />
                        Aktualisieren
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* Database Connection Status */}
                      <div style={{ padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: `1px solid ${dbStatus.connected ? 'var(--status-success)' : 'var(--status-danger)'}` }}>
                        <h4 className="flex items-center gap-2 mb-3" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          <Database size={18} style={{ color: dbStatus.connected ? 'var(--status-success)' : 'var(--status-danger)' }} />
                          PostgreSQL Datenbank
                        </h4>
                        {dbStatus.loading ? (
                          <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                            <RefreshCw size={14} className="animate-spin" /> Verbindung wird geprüft...
                          </div>
                        ) : (
                          <div style={{ fontSize: 'var(--font-size-sm)' }}>
                            <div className="flex justify-between mb-2">
                              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                              <span className="flex items-center gap-1" style={{ color: dbStatus.connected ? 'var(--status-success)' : 'var(--status-danger)' }}>
                                {dbStatus.connected ? <><CheckCircle size={14} /> Verbunden</> : <><XCircle size={14} /> Nicht verbunden</>}
                              </span>
                            </div>
                            {dbStatus.connected && (
                              <>
                                <div className="flex justify-between mb-2">
                                  <span style={{ color: 'var(--text-muted)' }}>Datenbank:</span>
                                  <span className="font-mono">{dbStatus.database}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                  <span style={{ color: 'var(--text-muted)' }}>Umgebung:</span>
                                  <span>{dbStatus.environment}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span style={{ color: 'var(--text-muted)' }}>Server-Zeit:</span>
                                  <span>{dbStatus.serverTime ? new Date(dbStatus.serverTime).toLocaleString('de-CH') : '-'}</span>
                                </div>
                              </>
                            )}
                            {dbStatus.error && (
                              <div className="mt-2 p-2 rounded" style={{ background: 'var(--status-danger-light)', color: 'var(--status-danger)', fontSize: 'var(--font-size-xs)' }}>
                                Fehler: {dbStatus.error}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* API Connection Info */}
                      <div style={{ padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                        <h4 className="flex items-center gap-2 mb-3" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          <Globe size={18} style={{ color: 'var(--status-info)' }} />
                          API-Verbindung
                        </h4>
                        <div style={{ fontSize: 'var(--font-size-sm)' }}>
                          <div className="flex justify-between mb-2">
                            <span style={{ color: 'var(--text-muted)' }}>API URL:</span>
                            <span className="font-mono text-xs">{import.meta.env.VITE_API_URL || 'localhost:3002'}</span>
                          </div>
                          <div className="flex justify-between mb-2">
                            <span style={{ color: 'var(--text-muted)' }}>Modus:</span>
                            <span style={{ color: dbStatus.connected ? 'var(--status-success)' : 'var(--status-warning)' }}>
                              {dbStatus.connected ? 'Live-Datenbank' : 'Fallback (localStorage)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Table Statistics */}
                      <div style={{ padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                        <h4 className="flex items-center gap-2 mb-3" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          <Table size={18} style={{ color: 'var(--brand-primary)' }} />
                          Tabellen-Statistik
                        </h4>
                        {dbStatus.tables ? (
                          <div style={{ fontSize: 'var(--font-size-sm)' }}>
                            <div className="space-y-2">
                              {Object.entries(dbStatus.tables).map(([table, count]) => (
                                <div key={table} className="flex justify-between items-center">
                                  <span style={{ color: 'var(--text-muted)' }}>{table}:</span>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono">{count === -1 ? '—' : count}</span>
                                    {count > 0 && ['allocation_runs', 'scenarios', 'exceptions', 'tasks'].includes(table) && (
                                      <button
                                        onClick={() => handleClearTable(table)}
                                        disabled={dbActionLoading === `clear-${table}`}
                                        className="p-1 rounded hover:bg-red-100"
                                        style={{ color: 'var(--status-danger)' }}
                                        title="Tabelle leeren"
                                      >
                                        {dbActionLoading === `clear-${table}` ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            {dbStatus.loading ? 'Wird geladen...' : 'Keine Verbindung zur Datenbank'}
                          </p>
                        )}
                      </div>

                      {/* Database Actions */}
                      <div style={{ padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                        <h4 className="flex items-center gap-2 mb-3" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          <Settings size={18} style={{ color: 'var(--status-warning)' }} />
                          Schema & Daten
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={handleMigrateDb}
                            disabled={!dbStatus.connected || dbActionLoading === 'migrate'}
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 justify-center text-sm"
                            style={{ 
                              background: dbStatus.connected ? 'var(--brand-primary)' : 'var(--surface-subtle)', 
                              color: dbStatus.connected ? 'white' : 'var(--text-muted)',
                              cursor: dbStatus.connected ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {dbActionLoading === 'migrate' ? <RefreshCw size={14} className="animate-spin" /> : <Table size={14} />}
                            Tabellen erstellen (Migration)
                          </button>
                          <button
                            onClick={handleReseedDb}
                            disabled={!dbStatus.connected || dbActionLoading === 'seed'}
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 justify-center text-sm"
                            style={{ 
                              background: dbStatus.connected ? 'var(--status-info)' : 'var(--surface-subtle)', 
                              color: dbStatus.connected ? 'white' : 'var(--text-muted)',
                              cursor: dbStatus.connected ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {dbActionLoading === 'seed' ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                            Testdaten laden (Seed)
                          </button>
                        </div>
                      </div>

                      {/* Health & Performance */}
                      <div style={{ padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                        <h4 className="flex items-center gap-2 mb-3" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          <Activity size={18} style={{ color: 'var(--status-success)' }} />
                          Gesundheit & Performance
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={loadDbHealth}
                            disabled={!dbStatus.connected || dbActionLoading === 'health'}
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 justify-center text-sm"
                            style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-default)' }}
                          >
                            {dbActionLoading === 'health' ? <RefreshCw size={14} className="animate-spin" /> : <Activity size={14} />}
                            Health-Check ausführen
                          </button>
                          {dbHealth && (
                            <div className="mt-2 p-2 rounded text-xs" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-default)' }}>
                              <div className="flex justify-between mb-1">
                                <span style={{ color: 'var(--text-muted)' }}>Latenz:</span>
                                <span style={{ color: (dbHealth.latency_ms || 0) < 100 ? 'var(--status-success)' : 'var(--status-warning)' }}>
                                  {dbHealth.latency_ms}ms
                                </span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span style={{ color: 'var(--text-muted)' }}>DB-Größe:</span>
                                <span>{dbHealth.database_size}</span>
                              </div>
                              <div className="flex justify-between">
                                <span style={{ color: 'var(--text-muted)' }}>Verbindungen:</span>
                                <span>{dbHealth.active_connections}</span>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={handleOptimize}
                            disabled={!dbStatus.connected || dbActionLoading === 'optimize'}
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 justify-center text-sm"
                            style={{ background: 'var(--surface-subtle)', border: '1px solid var(--border-default)' }}
                          >
                            {dbActionLoading === 'optimize' ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                            Datenbank optimieren
                          </button>
                        </div>
                      </div>

                      {/* Backup & Restore */}
                      <div style={{ padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                        <h4 className="flex items-center gap-2 mb-3" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                          <Shield size={18} style={{ color: 'var(--status-info)' }} />
                          Backup & Wiederherstellung
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={handleBackup}
                            disabled={!dbStatus.connected || dbActionLoading === 'backup'}
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 justify-center text-sm"
                            style={{ background: 'var(--status-info)', color: 'white' }}
                          >
                            {dbActionLoading === 'backup' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                            Backup herunterladen
                          </button>
                          <label 
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 justify-center text-sm cursor-pointer"
                            style={{ 
                              background: dbStatus.connected ? 'var(--surface-subtle)' : 'var(--surface-page)', 
                              border: '1px solid var(--border-default)',
                              color: dbStatus.connected ? 'inherit' : 'var(--text-muted)',
                              cursor: dbStatus.connected ? 'pointer' : 'not-allowed'
                            }}
                          >
                            {dbActionLoading === 'restore' ? <RefreshCw size={14} className="animate-spin" /> : <FileUp size={14} />}
                            Backup wiederherstellen
                            <input 
                              type="file" 
                              accept=".json"
                              onChange={handleRestore}
                              disabled={!dbStatus.connected || dbActionLoading === 'restore'}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>

                      {/* Danger Zone */}
                      <div style={{ padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--status-danger)' }}>
                        <h4 className="flex items-center gap-2 mb-3" style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--status-danger)' }}>
                          <AlertCircle size={18} />
                          Gefahrenzone
                        </h4>
                        <div className="space-y-2">
                          <button
                            onClick={handleDbReset}
                            disabled={!dbStatus.connected || dbActionLoading === 'reset'}
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 justify-center text-sm"
                            style={{ background: 'var(--status-danger)', color: 'white' }}
                          >
                            {dbActionLoading === 'reset' ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            Datenbank komplett zurücksetzen
                          </button>
                          <button
                            onClick={handleResetToDefaults}
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 justify-center text-sm"
                            style={{ background: 'var(--status-warning)', color: 'white' }}
                          >
                            <RotateCcw size={14} />
                            Lokale Daten zurücksetzen
                          </button>
                        </div>
                      </div>

                      {/* Table Details Modal */}
                      {showTableDetail && (
                        <div style={{ gridColumn: 'span 2', padding: 'var(--space-4)', background: 'var(--surface-page)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="flex items-center gap-2" style={{ fontWeight: 'var(--font-weight-medium)' }}>
                              <Info size={18} style={{ color: 'var(--brand-primary)' }} />
                              Tabellendetails: {showTableDetail}
                            </h4>
                            <button onClick={() => setShowTableDetail(null)} className="p-1 rounded hover:bg-gray-100">
                              <XCircle size={18} />
                            </button>
                          </div>
                          {tableDetail ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium mb-2">Spalten</h5>
                                <div className="space-y-1 text-xs">
                                  {tableDetail.columns?.map((col) => (
                                    <div key={col.column_name} className="flex justify-between p-1 rounded" style={{ background: 'var(--surface-raised)' }}>
                                      <span className="font-mono">{col.column_name}</span>
                                      <span style={{ color: 'var(--text-muted)' }}>{col.data_type}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium mb-2">Statistiken</h5>
                                <div className="text-sm">
                                  <div className="flex justify-between mb-1">
                                    <span style={{ color: 'var(--text-muted)' }}>Zeilen:</span>
                                    <span>{tableDetail.row_count}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span style={{ color: 'var(--text-muted)' }}>Größe:</span>
                                    <span>{tableDetail.size}</span>
                                  </div>
                                </div>
                                {tableDetail.recent_records && tableDetail.recent_records.length > 0 && (
                                  <div className="mt-3">
                                    <h5 className="text-sm font-medium mb-2">Letzte Einträge</h5>
                                    <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                                      {tableDetail.recent_records.map((rec: any, i: number) => (
                                        <div key={i} className="p-1 rounded truncate" style={{ background: 'var(--surface-raised)' }}>
                                          {rec.name || rec.title || rec.id}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                              <RefreshCw size={14} className="animate-spin" /> Lade Details...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CMS Tab - Translation Management */}
                {activeTab === 'cms' && (
                  <CmsTranslationsTab
                    t={t}
                    cmsSelectedSection={cmsSelectedSection}
                    setCmsSelectedSection={setCmsSelectedSection}
                    cmsSearchQuery={cmsSearchQuery}
                    setCmsSearchQuery={setCmsSearchQuery}
                    cmsEditingKey={cmsEditingKey}
                    setCmsEditingKey={setCmsEditingKey}
                    cmsEditValues={cmsEditValues}
                    setCmsEditValues={setCmsEditValues}
                    cmsLoading={cmsLoading}
                    setCmsLoading={setCmsLoading}
                    cmsExpandedSections={cmsExpandedSections}
                    setCmsExpandedSections={setCmsExpandedSections}
                  />
                )}
              </div>

              {/* Last Sync Info */}
              {selectedConfig.last_sync_at && (
                <div className="px-6 py-3" style={{ background: 'var(--surface-page)', borderTop: '1px solid var(--border-default)' }}>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    <Clock size={12} className="inline mr-1" />
                    Letzte Synchronisation: {new Date(selectedConfig.last_sync_at).toLocaleString('de-CH')}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
