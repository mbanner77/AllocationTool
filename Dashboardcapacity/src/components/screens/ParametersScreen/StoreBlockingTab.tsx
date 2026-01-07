import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, AlertCircle, MapPin, Ban } from 'lucide-react';

type BlockingType = 'full' | 'initialOnly' | 'replenishmentOnly' | 'presentationOnly' | 'forecastIgnore';
type HierarchyLevel = 'company' | 'division' | 'category' | 'productGroup' | 'article';

interface StoreBlockingRule {
  id: string;
  storeId: string;
  storeName: string;
  cluster?: string;
  planningLevel: HierarchyLevel;
  productGroupId: string;
  productGroupName: string;
  blockingType: BlockingType;
  validFrom: string;
  validTo: string | null;
  source: 'direct' | 'inherited';
  inheritedFrom?: string;
  status: 'active' | 'inactive';
  reason?: string;
}

const BLOCKING_TYPE_LABELS: Record<BlockingType, string> = {
  'full': 'Vollständig blockiert',
  'initialOnly': 'Nur Erstallokation blockiert',
  'replenishmentOnly': 'Nur Nachschub blockiert',
  'presentationOnly': 'Nur Präsentation blockiert',
  'forecastIgnore': 'Prognose ignorieren'
};

const BLOCKING_TYPE_DESCRIPTIONS: Record<BlockingType, string> = {
  'full': 'Keine Allokation und kein Nachschub für diese Produktgruppe in dieser Filiale',
  'initialOnly': 'Nur die Erstallokation ist blockiert, Nachschub ist möglich',
  'replenishmentOnly': 'Nur Nachschub ist blockiert, bestehende Artikel können weiter präsentiert werden',
  'presentationOnly': 'Artikel dürfen nicht präsentiert werden',
  'forecastIgnore': 'Prognose für diese Produktgruppe wird ignoriert'
};

const BLOCKING_TYPE_COLORS: Record<BlockingType, string> = {
  'full': 'var(--status-error)',
  'initialOnly': 'var(--status-warning)',
  'replenishmentOnly': 'var(--status-warning)',
  'presentationOnly': 'var(--status-info)',
  'forecastIgnore': 'var(--text-muted)'
};

const MOCK_STORE_BLOCKING_RULES: StoreBlockingRule[] = [
  {
    id: 'sb-1',
    storeId: 'FL-001',
    storeName: 'BLICK Zürich HB',
    cluster: 'Urban Premium',
    planningLevel: 'productGroup',
    productGroupId: 'pg-running-shoes',
    productGroupName: 'Running Shoes',
    blockingType: 'replenishmentOnly',
    validFrom: '2025-01-01',
    validTo: null,
    source: 'direct',
    status: 'active',
    reason: 'Umbaumaßnahmen Schuh-Abteilung'
  },
  {
    id: 'sb-2',
    storeId: 'FL-003',
    storeName: 'BLICK Basel SBB',
    planningLevel: 'productGroup',
    productGroupId: 'pg-outdoor-jackets',
    productGroupName: 'Outdoor Jackets',
    blockingType: 'full',
    validFrom: '2025-02-01',
    validTo: '2025-03-31',
    source: 'direct',
    status: 'active',
    reason: 'Temporäre Schließung Outdoor-Bereich'
  },
  {
    id: 'sb-3',
    storeId: 'FL-002',
    storeName: 'BLICK Bern Zentrum',
    cluster: 'Urban Premium',
    planningLevel: 'category',
    productGroupId: 'category-schuhe',
    productGroupName: 'Warengruppe Schuhe',
    blockingType: 'presentationOnly',
    validFrom: '2024-12-15',
    validTo: '2025-02-28',
    source: 'inherited',
    inheritedFrom: 'Cluster Urban Premium Policy',
    status: 'active'
  },
  {
    id: 'sb-4',
    storeId: 'FL-005',
    storeName: 'BLICK Lausanne Centre',
    cluster: 'Urban Standard',
    planningLevel: 'productGroup',
    productGroupId: 'pg-jeans',
    productGroupName: 'Jeans',
    blockingType: 'initialOnly',
    validFrom: '2025-01-15',
    validTo: '2025-06-30',
    source: 'direct',
    status: 'active',
    reason: 'Überkapazität, kein Platz für Neuware'
  }
];

interface StoreBlockingTabProps {
  onAddStore: () => void;
}

export function StoreBlockingTab({ onAddStore }: StoreBlockingTabProps) {
  const [rules, setRules] = useState<StoreBlockingRule[]>(MOCK_STORE_BLOCKING_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('');
  const [blockingTypeFilter, setBlockingTypeFilter] = useState<BlockingType | ''>('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | ''>('');

  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!rule.storeName.toLowerCase().includes(query) &&
            !rule.productGroupName.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (storeFilter && rule.storeId !== storeFilter) return false;
      if (blockingTypeFilter && rule.blockingType !== blockingTypeFilter) return false;
      if (statusFilter && rule.status !== statusFilter) return false;
      return true;
    });
  }, [rules, searchQuery, storeFilter, blockingTypeFilter, statusFilter]);

  const getBlockingIcon = (type: BlockingType) => {
    switch (type) {
      case 'full': return <Ban size={16} />;
      case 'initialOnly': return <AlertCircle size={16} />;
      case 'replenishmentOnly': return <AlertCircle size={16} />;
      case 'presentationOnly': return <MapPin size={16} />;
      case 'forecastIgnore': return <AlertCircle size={16} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div
        className="p-4 rounded-lg flex items-start gap-3"
        style={{
          backgroundColor: 'var(--surface-info-subtle)',
          border: '1px solid var(--border-info)'
        }}
      >
        <AlertCircle size={20} style={{ color: 'var(--status-info)', flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
            Filialspezifische Einschränkungen
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            Definieren Sie Filialen- oder Cluster-spezifische Blockierungsregeln für Produktgruppen. 
            Diese Regeln verhindern Allokation, Nachschub oder Präsentation bestimmter Produktgruppen in ausgewählten Filialen.
            Blockierungen werden in der Explainability-Ansicht als limitierende Faktoren angezeigt.
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Filiale oder Produktgruppe suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 border rounded-lg w-full"
                style={{
                  borderColor: 'var(--border-input)',
                  height: 'var(--height-input-md)',
                  backgroundColor: 'var(--surface-page)',
                  fontSize: 'var(--font-size-sm)'
                }}
              />
            </div>

            {/* Blocking Type Filter */}
            <select
              value={blockingTypeFilter}
              onChange={(e) => setBlockingTypeFilter(e.target.value as BlockingType | '')}
              className="px-3 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <option value="">Alle Blockierungstypen</option>
              {Object.entries(BLOCKING_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'active' | 'inactive' | '')}
              className="px-3 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <option value="">Alle Status</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>

          {/* Add Store Button */}
          <button
            onClick={onAddStore}
            className="px-4 py-2 rounded-lg border flex items-center gap-2"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              borderColor: 'var(--button-secondary-border)',
              color: 'var(--button-secondary-text)',
              height: 'var(--height-button-md)',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={16} />
            Filiale hinzufügen
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
            Blockierungsregeln
          </h3>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {filteredRules.length} {filteredRules.length === 1 ? 'Regel' : 'Regeln'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '180px' }}>
                  Filiale / Cluster
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '120px' }}>
                  Planungsebene
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '180px' }}>
                  Produktgruppe
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '220px' }}>
                  Blockierungstyp
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '110px' }}>
                  Gültig von
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '110px' }}>
                  Gültig bis
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '150px' }}>
                  Herkunft
                </th>
                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', width: '90px' }}>
                  Status
                </th>
                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', width: '100px' }}>
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '32px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      Keine Blockierungsregeln gefunden
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRules.map(rule => (
                  <tr
                    key={rule.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      borderLeft: rule.blockingType === 'full' ? '3px solid var(--status-error)' : 
                                  rule.blockingType === 'initialOnly' || rule.blockingType === 'replenishmentOnly' ? '3px solid var(--status-warning)' : 
                                  'none'
                    }}
                    className="hover:bg-surface-tint"
                  >
                    <td style={{ padding: '12px 8px' }}>
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                          {rule.storeName}
                        </div>
                        {rule.cluster && (
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {rule.cluster}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <span
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--status-success)' + '15',
                          color: 'var(--status-success)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        {rule.planningLevel === 'productGroup' && 'Produktgruppe'}
                        {rule.planningLevel === 'category' && 'Warengruppe'}
                        {rule.planningLevel === 'division' && 'Einkaufsbereich'}
                        {rule.planningLevel === 'company' && 'Unternehmen'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {rule.productGroupName}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: BLOCKING_TYPE_COLORS[rule.blockingType] }}>
                          {getBlockingIcon(rule.blockingType)}
                        </span>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                            {BLOCKING_TYPE_LABELS[rule.blockingType]}
                          </div>
                          {rule.reason && (
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {rule.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 'var(--font-size-sm)' }}>
                      {new Date(rule.validFrom).toLocaleDateString('de-DE')}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: 'var(--font-size-sm)' }}>
                      {rule.validTo ? new Date(rule.validTo).toLocaleDateString('de-DE') : (
                        <span style={{ color: 'var(--text-muted)' }}>Unbegrenzt</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <div>
                        <span
                          className="px-2 py-1 rounded"
                          style={{
                            backgroundColor: rule.source === 'direct' ? 'var(--status-success)' + '15' : 'var(--status-info)' + '15',
                            color: rule.source === 'direct' ? 'var(--status-success)' : 'var(--status-info)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-medium)'
                          }}
                        >
                          {rule.source === 'direct' ? 'Direkt' : 'Geerbt'}
                        </span>
                        {rule.inheritedFrom && (
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                            von {rule.inheritedFrom}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span
                        className="px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: rule.status === 'active' ? 'var(--status-success)' : 'var(--border-default)',
                          color: rule.status === 'active' ? 'var(--text-inverse)' : 'var(--text-muted)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        {rule.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          className="p-1 hover:bg-surface-tint rounded"
                          title="Bearbeiten"
                        >
                          <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
                        </button>
                        <button
                          className="p-1 hover:bg-surface-tint rounded"
                          title="Löschen"
                        >
                          <Trash2 size={16} style={{ color: 'var(--status-error)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}