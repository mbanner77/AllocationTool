import { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, Settings, Upload, Download, 
  CheckCircle, XCircle, Clock, AlertTriangle, Key,
  Globe, Webhook, Save, RotateCcw, FileJson, History
} from 'lucide-react';
import { api } from '../../services/api';

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

const ENTITY_LABELS: Record<string, { name: string; description: string }> = {
  stores: { name: 'Filialen', description: 'Stammdaten der Verkaufsstellen' },
  articles: { name: 'Artikel', description: 'Produktstammdaten' },
  allocation_runs: { name: 'Allocation Runs', description: 'Allokationsläufe und deren Status' },
  scenarios: { name: 'Szenarien', description: 'Planungsszenarien und Simulationen' },
  exceptions: { name: 'Exceptions', description: 'Ausnahmen und Warnungen' },
  tasks: { name: 'Tasks', description: 'Aufgaben und Workflows' },
};

const CATEGORY_COLORS = {
  master: { bg: 'var(--status-info)', label: 'Stammdaten' },
  transaction: { bg: 'var(--status-success)', label: 'Bewegungsdaten' }
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
  const [configs, setConfigs] = useState<DataConfig[]>(MOCK_CONFIGS);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editConfig, setEditConfig] = useState<Partial<DataConfig>>({});
  const [activeTab, setActiveTab] = useState<'config' | 'logs' | 'import' | 'export'>('config');
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<{ processed: number; failed: number; errors: string[] } | null>(null);

  useEffect(() => {
    loadConfigs();
  }, []);

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
          Datenmanager
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Konfigurieren Sie die Schnittstellen für Stamm- und Bewegungsdaten
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Entity List */}
        <div className="col-span-3">
          <div style={{ background: 'var(--surface-raised)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)' }}>
            <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--border-default)' }}>
              <h2 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>Entitäten</h2>
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
                      {ENTITY_LABELS[config.entity_name]?.name || config.entity_name}
                    </span>
                    <span 
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ 
                        background: CATEGORY_COLORS[config.data_category].bg,
                        color: 'white'
                      }}
                    >
                      {CATEGORY_COLORS[config.data_category].label}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {ENTITY_LABELS[config.entity_name]?.description}
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
                  {(['config', 'logs', 'import', 'export'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-4 py-2 rounded-lg transition-colors"
                      style={{
                        background: activeTab === tab ? 'var(--brand-primary)' : 'transparent',
                        color: activeTab === tab ? 'white' : 'var(--text-primary)'
                      }}
                    >
                      {tab === 'config' && <><Settings size={16} className="inline mr-2" />Konfiguration</>}
                      {tab === 'logs' && <><History size={16} className="inline mr-2" />Sync-Protokoll</>}
                      {tab === 'import' && <><Download size={16} className="inline mr-2" />Import</>}
                      {tab === 'export' && <><Upload size={16} className="inline mr-2" />Export</>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
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
                        {saving ? 'Speichern...' : 'Speichern'}
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
