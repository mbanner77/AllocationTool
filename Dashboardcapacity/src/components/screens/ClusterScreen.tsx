import { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n';
import { Search, Plus, MoreVertical, X, Building2, Sparkles, ChevronDown, ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { ClusterTable } from '../cluster/ClusterTable';

interface ClusterScreenProps {
  onNavigate: (screen: string) => void;
}

type ClusterSetStatus = 'Draft' | 'Active' | 'Archived';
type ClusterSetType = 'Manual' | 'System-generated' | 'Hybrid';

interface ClusterSet {
  id: string;
  name: string;
  description: string;
  clusterCount: number;
  storeCount: number;
  type: ClusterSetType;
  status: ClusterSetStatus;
  lastModified: string;
  owner: string;
  createdAt: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
  country: string;
  size: number;
}

// Store Select Modal
function StoreSelectModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (stores: string[]) => void }) {
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchCountry, setSearchCountry] = useState('');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);

  const MOCK_STORES: Store[] = [
    { id: 'ZH-001', name: 'Zürich HB', address: 'Bahnhofstrasse 1, 8001 Zürich', country: 'Schweiz', size: 850 },
    { id: 'BS-001', name: 'Basel SBB', address: 'Centralbahnplatz 1, 4051 Basel', country: 'Schweiz', size: 720 },
    { id: 'BE-001', name: 'Bern Westside', address: 'Riedbachstrasse 100, 3027 Bern', country: 'Schweiz', size: 650 },
    { id: 'GE-001', name: 'Genève Cornavin', address: 'Place de Cornavin, 1201 Genève', country: 'Schweiz', size: 780 },
    { id: 'LU-001', name: 'Luzern Bahnhof', address: 'Bahnhofplatz 1, 6003 Luzern', country: 'Schweiz', size: 580 },
  ];

  const filteredStores = MOCK_STORES.filter(store => {
    return store.id.toLowerCase().includes(searchId.toLowerCase()) &&
           store.name.toLowerCase().includes(searchName.toLowerCase()) &&
           store.country.toLowerCase().includes(searchCountry.toLowerCase());
  });

  const toggleStore = (id: string) => {
    setSelectedStores(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg border shadow-xl"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
            Filialen auswählen
          </h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="grid grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Filial-ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-alt)',
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
            <input
              type="text"
              placeholder="Name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-alt)',
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
            <input
              type="text"
              placeholder="Land"
              value={searchCountry}
              onChange={(e) => setSearchCountry(e.target.value)}
              className="px-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-alt)',
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-6">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th className="text-left pb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedStores.length === filteredStores.length && filteredStores.length > 0}
                    onChange={() => {
                      if (selectedStores.length === filteredStores.length) {
                        setSelectedStores([]);
                      } else {
                        setSelectedStores(filteredStores.map(s => s.id));
                      }
                    }}
                  />
                </th>
                <th className="text-left pb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Filial-ID</th>
                <th className="text-left pb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Name</th>
                <th className="text-left pb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Adresse</th>
                <th className="text-left pb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Land</th>
                <th className="text-right pb-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Größe (m²)</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map(store => (
                <tr key={store.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td className="py-3">
                    <input
                      type="checkbox"
                      checked={selectedStores.includes(store.id)}
                      onChange={() => toggleStore(store.id)}
                    />
                  </td>
                  <td className="py-3" style={{ fontSize: 'var(--font-size-sm)' }}>{store.id}</td>
                  <td className="py-3" style={{ fontSize: 'var(--font-size-sm)' }}>{store.name}</td>
                  <td className="py-3" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{store.address}</td>
                  <td className="py-3" style={{ fontSize: 'var(--font-size-sm)' }}>{store.country}</td>
                  <td className="py-3 text-right" style={{ fontSize: 'var(--font-size-sm)' }}>{store.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {selectedStores.length} Filialen ausgewählt
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-alt)',
                borderColor: 'var(--border-default)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Abbrechen
            </button>
            <button
              onClick={() => onConfirm(selectedStores)}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--text-inverse)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Bestätigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Attribute Select Modal
function AttributeSelectModal({ onClose, onCalculate }: { onClose: () => void; onCalculate: (attributes: string[], min: number, max: number) => void }) {
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(['Region', 'Umsatz (jährlich)', 'Verkaufsfläche (m²)']);
  const [minClusters, setMinClusters] = useState(3);
  const [maxClusters, setMaxClusters] = useState(7);

  const AVAILABLE_ATTRIBUTES = [
    'Region',
    'Land',
    'Umsatz (jährlich)',
    'Umsatz (rollierend)',
    'Verkaufsfläche (m²)',
    'Sortimentstiefe',
    'Umsatz je m²',
    'Abverkaufsrate',
    'Kapazitätsauslastung',
    'Kundensegmente',
    'Preisniveau',
    'Logistikdistanz'
  ];

  const toggleAttribute = (attr: string) => {
    setSelectedAttributes(prev =>
      prev.includes(attr) ? prev.filter(a => a !== attr) : [...prev, attr]
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg border shadow-xl"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)',
          width: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
            Attribute auswählen
          </h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            Diese Attribute werden für den systemgestützten Clustervorschlag verwendet.
          </p>

          {/* Attributes List */}
          <div className="space-y-2 mb-6">
            {AVAILABLE_ATTRIBUTES.map(attr => (
              <label key={attr} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer" style={{
                borderColor: selectedAttributes.includes(attr) ? 'var(--brand-primary)' : 'var(--border-subtle)',
                backgroundColor: selectedAttributes.includes(attr) ? 'var(--surface-subtle-tint)' : 'transparent'
              }}>
                <input
                  type="checkbox"
                  checked={selectedAttributes.includes(attr)}
                  onChange={() => toggleAttribute(attr)}
                />
                <span style={{ fontSize: 'var(--font-size-sm)' }}>{attr}</span>
              </label>
            ))}
          </div>

          {/* Cluster Range */}
          <div className="space-y-4">
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)', display: 'block' }}>
                Minimale Clusteranzahl: {minClusters}
              </label>
              <input
                type="range"
                min="2"
                max="10"
                value={minClusters}
                onChange={(e) => setMinClusters(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-2)', display: 'block' }}>
                Maximale Clusteranzahl: {maxClusters}
              </label>
              <input
                type="range"
                min="2"
                max="15"
                value={maxClusters}
                onChange={(e) => setMaxClusters(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {selectedAttributes.length} Attribute ausgewählt
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-alt)',
                borderColor: 'var(--border-default)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Abbrechen
            </button>
            <button
              onClick={() => onCalculate(selectedAttributes, minClusters, maxClusters)}
              disabled={selectedAttributes.length === 0}
              className="px-4 py-2 rounded-lg flex items-center gap-2"
              style={{
                backgroundColor: selectedAttributes.length > 0 ? 'var(--brand-primary)' : 'var(--surface-subtle)',
                color: selectedAttributes.length > 0 ? 'var(--text-inverse)' : 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)',
                cursor: selectedAttributes.length > 0 ? 'pointer' : 'not-allowed'
              }}
            >
              <Sparkles size={16} />
              Vorschlag berechnen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mock data
const MOCK_CLUSTER_SETS: ClusterSet[] = [
  {
    id: 'cs-001',
    name: 'Standard Cluster 2025',
    description: 'Hauptcluster für Allokation HW/SW 2025',
    clusterCount: 5,
    storeCount: 48,
    type: 'Hybrid',
    status: 'Active',
    lastModified: '2025-01-15T10:30:00',
    owner: 'John Doe',
    createdAt: '2024-11-20T09:00:00'
  },
  {
    id: 'cs-002',
    name: 'Umsatz-basiert Q1 2025',
    description: 'Systemvorschlag basierend auf Umsatz und Fläche',
    clusterCount: 6,
    storeCount: 48,
    type: 'System-generated',
    status: 'Active',
    lastModified: '2025-01-12T14:20:00',
    owner: 'Jane Smith',
    createdAt: '2025-01-10T11:00:00'
  },
  {
    id: 'cs-003',
    name: 'Regionale Cluster CH',
    description: 'Manuelle Gruppierung nach Regionen',
    clusterCount: 4,
    storeCount: 35,
    type: 'Manual',
    status: 'Draft',
    lastModified: '2025-01-08T16:45:00',
    owner: 'John Doe',
    createdAt: '2025-01-05T10:30:00'
  },
  {
    id: 'cs-004',
    name: 'Pilot Cluster Winter 2024',
    description: 'Test-Setup für Winter-Saison',
    clusterCount: 3,
    storeCount: 20,
    type: 'Manual',
    status: 'Archived',
    lastModified: '2024-12-15T10:00:00',
    owner: 'Jane Smith',
    createdAt: '2024-11-01T09:00:00'
  },
  {
    id: 'cs-005',
    name: 'Kapazitäts-optimiert',
    description: 'Systemvorschlag mit Fokus auf Verkaufsflächenoptimierung',
    clusterCount: 7,
    storeCount: 48,
    type: 'System-generated',
    status: 'Draft',
    lastModified: '2025-01-14T09:15:00',
    owner: 'John Doe',
    createdAt: '2025-01-13T08:00:00'
  }
];

const getStatusColor = (status: ClusterSetStatus): string => {
  switch (status) {
    case 'Active': return 'var(--status-success)';
    case 'Draft': return 'var(--status-warning)';
    case 'Archived': return 'var(--text-muted)';
    default: return 'var(--text-secondary)';
  }
};

const getTypeColor = (type: ClusterSetType): string => {
  switch (type) {
    case 'Manual': return 'var(--brand-primary)';
    case 'System-generated': return 'var(--status-info)';
    case 'Hybrid': return '#ec4899';
    default: return 'var(--text-secondary)';
  }
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `vor ${diffMinutes} Min.`;
    }
    return `vor ${diffHours} Std.`;
  }
  if (diffDays === 1) return 'gestern';
  if (diffDays < 7) return `vor ${diffDays} Tagen`;
  
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export function ClusterScreen({ onNavigate }: ClusterScreenProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClusterSetStatus | 'All'>('All');
  const [selectedClusterSet, setSelectedClusterSet] = useState<ClusterSet | null>(MOCK_CLUSTER_SETS[0]);
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [showStoreSelectModal, setShowStoreSelectModal] = useState(false);
  const [showAttributeSelectModal, setShowAttributeSelectModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const filteredClusterSets = useMemo(() => {
    return MOCK_CLUSTER_SETS.filter(cs => {
      const matchesSearch = cs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           cs.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || cs.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  return (
    <div className="flex h-full gap-6">
      {/* LEFT PANEL - CLUSTER SET LIST */}
      <div 
        className="flex flex-col border-r"
        style={{ 
          width: '25%',
          minWidth: '320px',
          backgroundColor: 'var(--surface-alt)',
          borderColor: 'var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)'
        }}
      >
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ 
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              Cluster Sets
            </h2>
            <button
              className="px-3 py-2 rounded-lg flex items-center gap-2 transition-colors"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--text-inverse)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <Plus size={16} />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>Neu</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)' 
              }} 
            />
            <input
              type="text"
              placeholder="Cluster-Set suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['All', 'Active', 'Draft', 'Archived'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className="px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: statusFilter === status ? 'var(--brand-primary)' : 'var(--surface-subtle)',
                  color: statusFilter === status ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  border: '1px solid',
                  borderColor: statusFilter === status ? 'var(--brand-primary)' : 'var(--border-subtle)'
                }}
              >
                {status === 'All' ? 'Alle' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Cluster Set List */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {filteredClusterSets.map(clusterSet => (
            <div
              key={clusterSet.id}
              onClick={() => setSelectedClusterSet(clusterSet)}
              className="w-full p-4 rounded-lg border transition-all text-left relative group cursor-pointer"
              style={{
                backgroundColor: selectedClusterSet?.id === clusterSet.id ? 'var(--surface-subtle-tint)' : 'var(--surface-page)',
                borderColor: selectedClusterSet?.id === clusterSet.id ? 'var(--brand-primary)' : 'var(--border-subtle)',
                borderWidth: selectedClusterSet?.id === clusterSet.id ? '2px' : '1px'
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: '4px'
                  }}>
                    {clusterSet.name}
                  </h3>
                  <p style={{ 
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    lineHeight: '1.4'
                  }}>
                    {clusterSet.description}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContextMenu(showContextMenu === clusterSet.id ? null : clusterSet.id);
                  }}
                  className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <MoreVertical size={14} />
                </button>
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span style={{ 
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)'
                }}>
                  {clusterSet.clusterCount} Cluster • {clusterSet.storeCount} Filialen
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${getTypeColor(clusterSet.type)}15`,
                    color: getTypeColor(clusterSet.type),
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  {clusterSet.type}
                </span>
                <span
                  className="px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${getStatusColor(clusterSet.status)}15`,
                    color: getStatusColor(clusterSet.status),
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  {clusterSet.status}
                </span>
              </div>

              <div style={{ 
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
                marginTop: '8px'
              }}>
                {formatDate(clusterSet.lastModified)}
              </div>

              {/* Context Menu */}
              {showContextMenu === clusterSet.id && (
                <div
                  className="absolute right-2 top-12 z-10 rounded-lg border shadow-lg py-1"
                  style={{
                    backgroundColor: 'var(--surface-page)',
                    borderColor: 'var(--border-default)',
                    minWidth: '150px'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {['Duplizieren', 'Umbenennen', 'Archivieren', 'Exportieren'].map(action => (
                    <button
                      key={action}
                      className="w-full px-3 py-2 text-left transition-colors"
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-primary)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--surface-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL - CLUSTER SET DETAIL */}
      <div 
        className="flex-1 flex flex-col"
        style={{
          backgroundColor: 'var(--surface-alt)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)'
        }}
      >
        {selectedClusterSet ? (
          <>
            {/* Header Section */}
            <div className="mb-6 pb-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={editName || selectedClusterSet.name}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl font-semibold mb-2 bg-transparent border-0 focus:outline-none w-full"
                    style={{
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <textarea
                    value={editDescription || selectedClusterSet.description}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Beschreibung hinzufügen..."
                    className="w-full bg-transparent border-0 focus:outline-none resize-none"
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-muted)',
                      minHeight: '40px'
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: 'var(--surface-page)',
                      borderColor: 'var(--border-default)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    Abbrechen
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg transition-colors"
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--text-inverse)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    Speichern
                  </button>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Erstellt:
                  </span>
                  <span style={{ fontSize: 'var(--font-size-xs)' }}>
                    {formatDate(selectedClusterSet.createdAt)} von {selectedClusterSet.owner}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Typ:
                  </span>
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${getTypeColor(selectedClusterSet.type)}15`,
                      color: getTypeColor(selectedClusterSet.type),
                      fontSize: 'var(--font-size-xs)'
                    }}
                  >
                    {selectedClusterSet.type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Status:
                  </span>
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: `${getStatusColor(selectedClusterSet.status)}15`,
                      color: getStatusColor(selectedClusterSet.status),
                      fontSize: 'var(--font-size-xs)'
                    }}
                  >
                    {selectedClusterSet.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setShowStoreSelectModal(true)}
                className="px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: 'var(--surface-page)',
                  borderColor: 'var(--border-default)',
                  fontSize: 'var(--font-size-sm)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <Building2 size={16} />
                Filialen auswählen
              </button>
              <button
                onClick={() => setShowAttributeSelectModal(true)}
                className="px-4 py-2 rounded-lg border flex items-center gap-2 transition-colors"
                style={{
                  backgroundColor: 'var(--surface-page)',
                  borderColor: 'var(--border-default)',
                  fontSize: 'var(--font-size-sm)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
              >
                <Sparkles size={16} />
                Attribute auswählen
              </button>
            </div>

            {/* Cluster Table */}
            <div className="flex-1 overflow-hidden">
              <ClusterTable onAddCluster={() => console.log('Add new cluster')} />
            </div>
          </>
        ) : (
          <div 
            className="flex-1 flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <p>Wählen Sie ein Cluster-Set aus der Liste</p>
          </div>
        )}
      </div>

      {/* Store Select Modal */}
      {showStoreSelectModal && (
        <StoreSelectModal
          onClose={() => setShowStoreSelectModal(false)}
          onConfirm={(selectedStores) => {
            console.log('Selected stores:', selectedStores);
            setShowStoreSelectModal(false);
          }}
        />
      )}

      {/* Attribute Select Modal */}
      {showAttributeSelectModal && (
        <AttributeSelectModal
          onClose={() => setShowAttributeSelectModal(false)}
          onCalculate={(attributes, minClusters, maxClusters) => {
            console.log('Calculate with:', attributes, minClusters, maxClusters);
            setShowAttributeSelectModal(false);
          }}
        />
      )}
    </div>
  );
}