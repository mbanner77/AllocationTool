import { useState, useMemo } from 'react';
import { ChevronRight, Plus, Search, X, Info, Edit2, History, ArrowUpRight, Check, ChevronDown, MapPin, AlertCircle, Filter } from 'lucide-react';
import type { Screen } from '../../App';
import { ArticleHierarchySelector, ARTICLE_HIERARCHY } from '../common/ArticleHierarchySelector';
import { LocationSelectionModal } from '../common/LocationSelectionModal';
import { StoreBlockingTab } from './ParametersScreen/StoreBlockingTab';

type TabKey = 'capacity' | 'presentation' | 'time' | 'logic' | 'forecast' | 'governance' | 'storeBlocking';
type ParameterStatus = 'active' | 'inactive' | 'overridden' | 'inherited';
type HierarchyLevel = 'company' | 'division' | 'category' | 'productGroup' | 'article';
type ParameterType = 'number' | 'percentage' | 'boolean' | 'enum' | 'text';
type BlockingType = 'full' | 'initialOnly' | 'replenishmentOnly' | 'presentationOnly' | 'forecastIgnore';

interface ArticleHierarchyNode {
  id: string;
  name: string;
  level: HierarchyLevel;
  path: string[];
  children?: ArticleHierarchyNode[];
}

interface Parameter {
  id: string;
  name: string;
  description: string;
  level: HierarchyLevel;
  value: any;
  unit?: string;
  type: ParameterType;
  enumValues?: string[];
  source: 'direct' | 'inherited' | 'default';
  inheritedFrom?: string;
  validFrom: string;
  validTo: string | null;
  hasOverride: boolean;
  category: TabKey;
  priority?: number;
  // NEW: Article hierarchy scope
  articleHierarchyScope?: string[]; // Array of node IDs
  planningLevel?: HierarchyLevel; // Which level is this defined for
}

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

const HIERARCHY_LEVELS = [
  { value: 'company', label: 'Unternehmen' },
  { value: 'division', label: 'Einkaufsbereich' },
  { value: 'category', label: 'Warengruppe' },
  { value: 'productGroup', label: 'Produktgruppe' },
  { value: 'article', label: 'Artikel' }
];

const SOURCE_COLORS = {
  'direct': 'var(--status-success)',
  'inherited': 'var(--status-info)',
  'default': 'var(--text-muted)'
};

// Mock Article Hierarchy
const MOCK_ARTICLE_HIERARCHY: ArticleHierarchyNode[] = [
  {
    id: 'unternehmen-1',
    name: 'BLICK Retail',
    level: 'company',
    path: ['BLICK Retail'],
    children: [
      {
        id: 'division-1',
        name: 'Einkaufsbereich Bekleidung',
        level: 'division',
        path: ['BLICK Retail', 'Einkaufsbereich Bekleidung'],
        children: [
          {
            id: 'category-1',
            name: 'Warengruppe Schuhe',
            level: 'category',
            path: ['BLICK Retail', 'Einkaufsbereich Bekleidung', 'Warengruppe Schuhe'],
            children: [
              {
                id: 'pg-1',
                name: 'Running Shoes',
                level: 'productGroup',
                path: ['BLICK Retail', 'Einkaufsbereich Bekleidung', 'Warengruppe Schuhe', 'Running Shoes']
              },
              {
                id: 'pg-2',
                name: 'Casual Sneakers',
                level: 'productGroup',
                path: ['BLICK Retail', 'Einkaufsbereich Bekleidung', 'Warengruppe Schuhe', 'Casual Sneakers']
              }
            ]
          },
          {
            id: 'category-2',
            name: 'Warengruppe Oberbekleidung',
            level: 'category',
            path: ['BLICK Retail', 'Einkaufsbereich Bekleidung', 'Warengruppe Oberbekleidung'],
            children: [
              {
                id: 'pg-3',
                name: 'Outdoor Jackets',
                level: 'productGroup',
                path: ['BLICK Retail', 'Einkaufsbereich Bekleidung', 'Warengruppe Oberbekleidung', 'Outdoor Jackets']
              }
            ]
          }
        ]
      }
    ]
  }
];

const BLOCKING_TYPE_LABELS = {
  'full': 'Vollständig blockiert',
  'initialOnly': 'Nur Erstallokation blockiert',
  'replenishmentOnly': 'Nur Nachschub blockiert',
  'presentationOnly': 'Nur Präsentation blockiert',
  'forecastIgnore': 'Prognose ignorieren'
};

// Mock Store Blocking Rules
const MOCK_STORE_BLOCKING_RULES: StoreBlockingRule[] = [
  {
    id: 'sb-1',
    storeId: 'store-101',
    storeName: 'BLICK Zürich HB',
    cluster: 'Cluster A',
    planningLevel: 'productGroup',
    productGroupId: 'pg-1',
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
    storeId: 'store-102',
    storeName: 'BLICK Basel',
    planningLevel: 'productGroup',
    productGroupId: 'pg-3',
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
    storeId: 'store-103',
    storeName: 'BLICK Bern',
    cluster: 'Cluster B',
    planningLevel: 'category',
    productGroupId: 'category-1',
    productGroupName: 'Warengruppe Schuhe',
    blockingType: 'presentationOnly',
    validFrom: '2024-12-15',
    validTo: '2025-02-28',
    source: 'inherited',
    inheritedFrom: 'Cluster B Policy',
    status: 'active'
  }
];

const MOCK_PARAMETERS: Parameter[] = [
  // Capacity & Space
  {
    id: '1',
    name: 'Flächenbedarf pro Einheit',
    description: 'Durchschnittlicher Präsentationsflächenbedarf je Stück.',
    level: 'productGroup',
    value: 0.035,
    unit: 'm²',
    type: 'number',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'capacity',
    articleHierarchyScope: ['pg-running-shoes', 'pg-casual-sneakers']
  },
  {
    id: '2',
    name: 'Flächenbedarf pro Größenlauf',
    description: 'Zusätzlicher Flächenbedarf für vollständige Größenläufe (LOTs).',
    level: 'category',
    value: 1.8,
    unit: 'm²',
    type: 'number',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'capacity',
    articleHierarchyScope: ['category-schuhe']
  },
  {
    id: '3',
    name: 'Max. Flächennutzung je Artikel',
    description: 'Obergrenze für Artikelanteil an Gesamtfläche.',
    level: 'productGroup',
    value: 2.5,
    unit: 'm²',
    type: 'number',
    source: 'inherited',
    inheritedFrom: 'Warengruppe Shoes',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: true,
    category: 'capacity',
    articleHierarchyScope: ['pg-outdoor-jackets']
  },
  {
    id: '4',
    name: 'Min. Flächenanteil je Kategorie',
    description: 'Garantierter Mindestflächenanteil.',
    level: 'category',
    value: 15,
    unit: '%',
    type: 'percentage',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'capacity',
    articleHierarchyScope: ['category-oberbekleidung']
  },
  // Presentation
  {
    id: '5',
    name: 'Mindestpräsentationsmenge',
    description: 'Mindestmenge, um Artikel präsentieren zu dürfen.',
    level: 'productGroup',
    value: 3,
    unit: 'Stück',
    type: 'number',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'presentation',
    articleHierarchyScope: ['pg-running-shoes']
  },
  {
    id: '6',
    name: 'Mindestmenge je Größe',
    description: 'Mindestanzahl pro Größe für vollständige Darstellung.',
    level: 'category',
    value: 2,
    unit: 'Stück',
    type: 'number',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'presentation',
    articleHierarchyScope: ['category-schuhe', 'category-oberbekleidung']
  },
  {
    id: '7',
    name: 'Präsentationspflicht',
    description: 'Artikel muss präsentiert werden, auch bei knapper Kapazität.',
    level: 'article',
    value: true,
    type: 'boolean',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'presentation'
  },
  {
    id: '8',
    name: 'LOT-Zwang',
    description: 'Allokation nur bei vollständigem Größenlauf erlaubt.',
    level: 'productGroup',
    value: true,
    type: 'boolean',
    source: 'inherited',
    inheritedFrom: 'Warengruppe Apparel',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'presentation',
    articleHierarchyScope: ['pg-casual-sneakers', 'pg-outdoor-jackets']
  },
  // Time
  {
    id: '9',
    name: 'Präsentationsdauer',
    description: 'Dauer, über die Artikel Fläche blockiert.',
    level: 'productGroup',
    value: 8,
    unit: 'Wochen',
    type: 'number',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'time',
    articleHierarchyScope: ['pg-running-shoes', 'pg-outdoor-jackets']
  },
  {
    id: '10',
    name: 'Zeitliche Verteilungslogik',
    description: 'Art der zeitlichen Verteilung der Kapazität.',
    level: 'category',
    value: 'Gleichmäßig',
    type: 'enum',
    enumValues: ['Gleichmäßig', 'Frontloaded', 'Backloaded'],
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'time',
    articleHierarchyScope: ['category-schuhe']
  },
  {
    id: '11',
    name: 'Lieferfenster-Toleranz',
    description: 'Spielraum für Simulationen.',
    level: 'company',
    value: 2,
    unit: 'Wochen (+/-)',
    type: 'number',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'time',
    articleHierarchyScope: ['division-bekleidung']
  },
  // Logic
  {
    id: '12',
    name: 'Allokationspriorität',
    description: 'Reihenfolge bei Kapazitätskonflikten.',
    level: 'productGroup',
    value: 7,
    unit: 'Rang (1-10)',
    type: 'number',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'logic',
    priority: 7,
    articleHierarchyScope: ['pg-running-shoes']
  },
  {
    id: '13',
    name: 'Kapazitätsgewichtung',
    description: 'Wie stark Kapazität den Algorithmus beeinflusst.',
    level: 'category',
    value: 60,
    unit: '%',
    type: 'percentage',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'logic',
    articleHierarchyScope: ['category-oberbekleidung']
  },
  {
    id: '14',
    name: 'Strategische Kategorie',
    description: 'Kategorie wird bevorzugt behandelt.',
    level: 'category',
    value: true,
    type: 'boolean',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'logic',
    articleHierarchyScope: ['category-schuhe', 'category-oberbekleidung']
  },
  // Forecast
  {
    id: '15',
    name: 'Forecast-Gewichtung',
    description: 'Einfluss der Absatzprognose.',
    level: 'category',
    value: 40,
    unit: '%',
    type: 'percentage',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'forecast',
    articleHierarchyScope: ['category-schuhe']
  },
  {
    id: '16',
    name: 'KPI-Fokus',
    description: 'Primärer KPI für Optimierung.',
    level: 'division',
    value: 'Abverkauf',
    type: 'enum',
    enumValues: ['Abverkauf', 'Marge', 'Lagerumschlag', 'Flächenproduktivität'],
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'forecast',
    articleHierarchyScope: ['division-bekleidung']
  },
  // Governance
  {
    id: '17',
    name: 'Max. Override-Ebene',
    description: 'Tiefste Ebene für manuelle Overrides.',
    level: 'company',
    value: 'Artikel',
    type: 'enum',
    enumValues: ['Produktgruppe', 'Artikel', 'Keine Overrides'],
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'governance'
  },
  {
    id: '18',
    name: 'Genehmigungspflicht bei Abweichung',
    description: 'Override muss genehmigt werden.',
    level: 'company',
    value: true,
    type: 'boolean',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'governance'
  },
  {
    id: '19',
    name: 'Max. zulässige Kapazitätsabweichung',
    description: 'Grenze für Simulation & Freigabe.',
    level: 'company',
    value: 15,
    unit: '%',
    type: 'percentage',
    source: 'direct',
    validFrom: '2025-01-01',
    validTo: null,
    hasOverride: false,
    category: 'governance',
    articleHierarchyScope: ['division-bekleidung']
  }
];

const TABS = [
  { key: 'capacity' as TabKey, label: 'Kapazität & Fläche' },
  { key: 'presentation' as TabKey, label: 'Präsentationsregeln' },
  { key: 'time' as TabKey, label: 'Zeit- & Verdichtungsparameter' },
  { key: 'logic' as TabKey, label: 'Allokationslogik & Priorisierung' },
  { key: 'forecast' as TabKey, label: 'Prognose- & KPI-Gewichtung' },
  { key: 'governance' as TabKey, label: 'Governance & Einschränkungen' },
  { key: 'storeBlocking' as TabKey, label: 'Filialspezifische Einschränkungen' }
];

const SOURCE_LABELS = {
  'direct': 'Direkt gepflegt',
  'inherited': 'Geerbt',
  'default': 'Default-Systemwert'
};

export function ParametersScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('capacity');
  const [parameters, setParameters] = useState<Parameter[]>(MOCK_PARAMETERS);
  const [selectedParameter, setSelectedParameter] = useState<Parameter | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Filters
  const [hierarchyFilter, setHierarchyFilter] = useState<HierarchyLevel | ''>('');
  const [statusFilter, setStatusFilter] = useState<ParameterStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [validFromFilter, setValidFromFilter] = useState('');
  const [validToFilter, setValidToFilter] = useState('');
  
  // Article Hierarchy & Store Selection Modals
  const [showArticleHierarchyModal, setShowArticleHierarchyModal] = useState(false);
  const [selectedArticleNodes, setSelectedArticleNodes] = useState<string[]>([]);
  const [showStoreSelectionModal, setShowStoreSelectionModal] = useState(false);
  const [articleHierarchyFilter, setArticleHierarchyFilter] = useState<string[]>([]);
  
  const handleArticleHierarchyConfirm = (selected: string[]) => {
    setSelectedArticleNodes(selected);
    setArticleHierarchyFilter(selected);
  };
  
  const handleAddStore = () => {
    setShowStoreSelectionModal(true);
  };
  
  const handleConfirmStoreSelection = (selected: any[]) => {
    // TODO: Add new store blocking rules
    setShowStoreSelectionModal(false);
  };
  
  // Filter parameters
  const filteredParameters = useMemo(() => {
    return parameters.filter(param => {
      if (param.category !== activeTab) return false;
      if (hierarchyFilter && param.level !== hierarchyFilter) return false;
      if (searchQuery && !param.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Article hierarchy filter
      if (articleHierarchyFilter.length > 0 && param.articleHierarchyScope) {
        const hasMatch = articleHierarchyFilter.some(filterId => 
          param.articleHierarchyScope?.includes(filterId)
        );
        if (!hasMatch) return false;
      }
      
      // Status filter
      if (statusFilter) {
        if (statusFilter === 'active' && param.validTo !== null) return false;
        if (statusFilter === 'inactive' && param.validTo === null) return false;
        if (statusFilter === 'overridden' && !param.hasOverride) return false;
        if (statusFilter === 'inherited' && param.source !== 'inherited') return false;
      }
      
      return true;
    });
  }, [parameters, activeTab, hierarchyFilter, statusFilter, searchQuery, articleHierarchyFilter]);
  
  const handleValueChange = (id: string, newValue: any) => {
    setParameters(prev => prev.map(param =>
      param.id === id ? { ...param, value: newValue } : param
    ));
  };
  
  const handleOpenDetail = (param: Parameter) => {
    setSelectedParameter(param);
    setShowDetailModal(true);
  };
  
  // Helper function to find a node in the hierarchy recursively
  const findNodeById = (nodeId: string, nodes: typeof ARTICLE_HIERARCHY = ARTICLE_HIERARCHY): any => {
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      if (node.children) {
        const found = findNodeById(nodeId, node.children as any);
        if (found) return found;
      }
    }
    return null;
  };
  
  const renderValue = (param: Parameter) => {
    if (isEditing === param.id) {
      switch (param.type) {
        case 'boolean':
          return (
            <select
              value={param.value ? 'true' : 'false'}
              onChange={(e) => handleValueChange(param.id, e.target.value === 'true')}
              onBlur={() => setIsEditing(null)}
              autoFocus
              className="px-2 py-1 border rounded"
              style={{
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--surface-page)'
              }}
            >
              <option value="true">Ja</option>
              <option value="false">Nein</option>
            </select>
          );
        case 'enum':
          return (
            <select
              value={param.value}
              onChange={(e) => handleValueChange(param.id, e.target.value)}
              onBlur={() => setIsEditing(null)}
              autoFocus
              className="px-2 py-1 border rounded"
              style={{
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--surface-page)'
              }}
            >
              {param.enumValues?.map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          );
        case 'number':
        case 'percentage':
          return (
            <input
              type="number"
              value={param.value}
              onChange={(e) => handleValueChange(param.id, parseFloat(e.target.value))}
              onBlur={() => setIsEditing(null)}
              autoFocus
              step={param.type === 'percentage' ? 1 : 0.001}
              className="px-2 py-1 border rounded w-24"
              style={{
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--surface-page)'
              }}
            />
          );
        default:
          return (
            <input
              type="text"
              value={param.value}
              onChange={(e) => handleValueChange(param.id, e.target.value)}
              onBlur={() => setIsEditing(null)}
              autoFocus
              className="px-2 py-1 border rounded"
              style={{
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--surface-page)'
              }}
            />
          );
      }
    }
    
    // Display mode
    if (param.type === 'boolean') {
      return (
        <span
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: param.value ? 'var(--status-success)' : 'var(--border-default)',
            color: param.value ? 'var(--text-inverse)' : 'var(--text-muted)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {param.value ? 'Ja' : 'Nein'}
        </span>
      );
    }
    
    return (
      <span style={{ fontSize: 'var(--font-size-sm)' }}>
        {param.value}
        {param.unit && ` ${param.unit}`}
      </span>
    );
  };
  
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        <span>Einstellungen</span>
        <ChevronRight size={16} />
        <span>Allokationsparameter</span>
      </div>
      
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-2)'
          }}
        >
          Allokationsparameter
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', maxWidth: '800px' }}>
          Zentrale Pflege steuerungsrelevanter Parameter für Kapazität, Präsentation, Zeitlogik
          und Allokationsalgorithmen. Änderungen wirken hierarchisch und overridefähig.
        </p>
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
                placeholder="Parameter suchen..."
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
            
            {/* Hierarchy Filter */}
            <select
              value={hierarchyFilter}
              onChange={(e) => setHierarchyFilter(e.target.value as HierarchyLevel | '')}
              className="px-3 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <option value="">Alle Ebenen</option>
              {HIERARCHY_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
            
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ParameterStatus | '')}
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
              <option value="overridden">Überschrieben</option>
              <option value="inherited">Geerbt</option>
            </select>
            
            {/* Article Hierarchy Filter Button */}
            <button
              onClick={() => setShowArticleHierarchyModal(true)}
              className="px-3 py-2 border rounded-lg flex items-center gap-2 whitespace-nowrap"
              style={{
                borderColor: articleHierarchyFilter.length > 0 ? 'var(--brand-primary)' : 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: articleHierarchyFilter.length > 0 ? 'var(--surface-info-subtle)' : 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)',
                color: articleHierarchyFilter.length > 0 ? 'var(--brand-primary)' : 'var(--text-secondary)'
              }}
            >
              <Filter size={16} />
              <span>
                {articleHierarchyFilter.length === 0 
                  ? 'Artikelhierarchie' 
                  : `${articleHierarchyFilter.length} Ebene${articleHierarchyFilter.length !== 1 ? 'n' : ''}`}
              </span>
              {articleHierarchyFilter.length > 0 && (
                <X 
                  size={14} 
                  onClick={(e) => {
                    e.stopPropagation();
                    setArticleHierarchyFilter([]);
                    setSelectedArticleNodes([]);
                  }}
                  className="hover:bg-surface-tint rounded-full p-0.5"
                />
              )}
            </button>
            
            {/* Date Filters */}
            <input
              type="date"
              placeholder="Gültig von"
              value={validFromFilter}
              onChange={(e) => setValidFromFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
            
            <input
              type="date"
              placeholder="Gültig bis"
              value={validToFilter}
              onChange={(e) => setValidToFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)'
              }}
            />
          </div>
          
          <button
            className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{
              backgroundColor: 'var(--button-primary-bg)',
              color: 'var(--button-primary-text)',
              height: 'var(--height-button-md)',
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={16} />
            Neuen Parameter anlegen
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div 
        className="sticky top-0 z-10 border-b"
        style={{ 
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-4 py-3 relative"
              style={{
                color: activeTab === tab.key ? 'var(--brand-primary)' : 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: activeTab === tab.key ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
                backgroundColor: 'transparent',
                borderBottom: activeTab === tab.key ? '2px solid var(--brand-primary)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Store Blocking Tab Content */}
      {activeTab === 'storeBlocking' ? (
        <StoreBlockingTab onAddStore={handleAddStore} />
      ) : (
      
      /* Parameter Table */
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
            {TABS.find(t => t.key === activeTab)?.label}
          </h3>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {filteredParameters.length} Parameter
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '200px' }}>
                  Parametername
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '120px' }}>
                  Ebene
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '180px' }}>
                  Artikelhierarchie
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '150px' }}>
                  Wert
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '180px' }}>
                  Herkunft
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '110px' }}>
                  Gültig von
                </th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '110px' }}>
                  Gültig bis
                </th>
                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', width: '80px' }}>
                  Override
                </th>
                <th style={{ textAlign: 'center', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', width: '100px' }}>
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredParameters.map(param => (
                <tr 
                  key={param.id} 
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  className="hover:bg-surface-tint"
                >
                  <td style={{ padding: '12px 8px' }}>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {param.name}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {param.description}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <span 
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'var(--surface-subtle-tint)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {HIERARCHY_LEVELS.find(l => l.value === param.level)?.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    {param.articleHierarchyScope && param.articleHierarchyScope.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {param.articleHierarchyScope.slice(0, 2).map(nodeId => {
                          const node = findNodeById(nodeId);
                          return node ? (
                            <span 
                              key={nodeId}
                              className="px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: 'var(--surface-info-subtle)',
                                color: 'var(--text-primary)',
                                fontSize: 'var(--font-size-xs)',
                                whiteSpace: 'nowrap'
                              }}
                              title={node.label}
                            >
                              {node.label.length > 20 ? `${node.label.substring(0, 20)}...` : node.label}
                            </span>
                          ) : null;
                        })}
                        {param.articleHierarchyScope.length > 2 && (
                          <span 
                            className="px-2 py-0.5 rounded"
                            style={{
                              backgroundColor: 'var(--surface-subtle-tint)',
                              color: 'var(--text-muted)',
                              fontSize: 'var(--font-size-xs)'
                            }}
                          >
                            +{param.articleHierarchyScope.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Alle
                      </span>
                    )}
                  </td>
                  <td 
                    style={{ padding: '12px 8px', cursor: 'pointer' }}
                    onClick={() => setIsEditing(param.id)}
                  >
                    {renderValue(param)}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <div>
                      <span 
                        className="px-2 py-1 rounded inline-flex items-center gap-1"
                        style={{
                          backgroundColor: `${SOURCE_COLORS[param.source]}15`,
                          color: SOURCE_COLORS[param.source],
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        {SOURCE_LABELS[param.source]}
                      </span>
                      {param.inheritedFrom && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                          von {param.inheritedFrom}
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 'var(--font-size-sm)' }}>
                    {new Date(param.validFrom).toLocaleDateString('de-DE')}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 'var(--font-size-sm)' }}>
                    {param.validTo ? new Date(param.validTo).toLocaleDateString('de-DE') : (
                      <span style={{ color: 'var(--text-muted)' }}>Unbegrenzt</span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    {param.hasOverride && (
                      <span 
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--status-warning)',
                          color: 'var(--text-inverse)',
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        Override
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setIsEditing(param.id)}
                        className="p-1 hover:bg-surface-tint rounded"
                        title="Bearbeiten"
                      >
                        <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
                      </button>
                      <button
                        onClick={() => handleOpenDetail(param)}
                        className="p-1 hover:bg-surface-tint rounded"
                        title="Details anzeigen"
                      >
                        <ArrowUpRight size={16} style={{ color: 'var(--text-secondary)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      
      {/* Detail Modal */}
      {showDetailModal && selectedParameter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            style={{
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="p-6 border-b flex items-start justify-between sticky top-0 bg-white"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div>
                <h2
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--space-1)'
                  }}
                >
                  {selectedParameter.name}
                </h2>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                  {selectedParameter.description}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-surface-tint rounded"
              >
                <X size={20} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Current Value */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                  Aktueller Wert
                </h3>
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--surface-subtle-tint)' }}
                >
                  <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {selectedParameter.type === 'boolean' ? (selectedParameter.value ? 'Ja' : 'Nein') : selectedParameter.value}
                    {selectedParameter.unit && <span style={{ fontSize: 'var(--font-size-md)', color: 'var(--text-muted)', marginLeft: '4px' }}>{selectedParameter.unit}</span>}
                  </div>
                </div>
              </div>
              
              {/* Inheritance Tree */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                  Vererbungsbaum
                </h3>
                <div className="space-y-2">
                  {HIERARCHY_LEVELS.map((level, idx) => (
                    <div 
                      key={level.value}
                      className="flex items-center gap-3 p-3 rounded-lg"
                      style={{ 
                        backgroundColor: level.value === selectedParameter.level ? 'var(--surface-info-subtle)' : 'var(--surface-subtle-tint)',
                        borderLeft: level.value === selectedParameter.level ? '3px solid var(--brand-primary)' : 'none',
                        marginLeft: `${idx * 16}px`
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                          {level.label}
                        </div>
                        {level.value === selectedParameter.level && (
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            Definiert hier
                          </div>
                        )}
                      </div>
                      {level.value === selectedParameter.level && (
                        <Check size={16} style={{ color: 'var(--brand-primary)', marginLeft: 'auto' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Source Info */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                  Herkunftsinformationen
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                      Quelle
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      {SOURCE_LABELS[selectedParameter.source]}
                    </div>
                  </div>
                  {selectedParameter.inheritedFrom && (
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                        Geerbt von
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {selectedParameter.inheritedFrom}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Validity Period */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                  Gültigkeitszeitraum
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                      Gültig von
                    </div>
                    <input
                      type="date"
                      value={selectedParameter.validFrom}
                      className="px-3 py-2 border rounded-lg w-full"
                      style={{
                        borderColor: 'var(--border-input)',
                        height: 'var(--height-input-md)',
                        backgroundColor: 'var(--surface-page)'
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                      Gültig bis
                    </div>
                    <input
                      type="date"
                      value={selectedParameter.validTo || ''}
                      placeholder="Unbegrenzt"
                      className="px-3 py-2 border rounded-lg w-full"
                      style={{
                        borderColor: 'var(--border-input)',
                        height: 'var(--height-input-md)',
                        backgroundColor: 'var(--surface-page)'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Override Section */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                  Override-Verwaltung
                </h3>
                <div 
                  className="p-4 rounded-lg flex items-center justify-between"
                  style={{ 
                    backgroundColor: selectedParameter.hasOverride ? 'var(--surface-warning-subtle)' : 'var(--surface-subtle-tint)',
                    border: selectedParameter.hasOverride ? '1px solid var(--border-warning)' : 'none'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      Override Status
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {selectedParameter.hasOverride ? 'Parameter wird überschrieben' : 'Kein Override aktiv'}
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: selectedParameter.hasOverride ? 'var(--button-danger-bg)' : 'var(--button-secondary-bg)',
                      borderColor: selectedParameter.hasOverride ? 'var(--button-danger-border)' : 'var(--button-secondary-border)',
                      color: selectedParameter.hasOverride ? 'var(--button-danger-text)' : 'var(--button-secondary-text)',
                      height: 'var(--height-button-md)'
                    }}
                  >
                    {selectedParameter.hasOverride ? 'Override entfernen' : 'Override setzen'}
                  </button>
                </div>
              </div>
              
              {/* History */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                  <div className="flex items-center gap-2">
                    <History size={16} />
                    Änderungshistorie
                  </div>
                </h3>
                <div className="space-y-2">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--surface-subtle-tint)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                        Aktuell
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {new Date().toLocaleDateString('de-DE')}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                      Wert: {selectedParameter.type === 'boolean' ? (selectedParameter.value ? 'Ja' : 'Nein') : selectedParameter.value}
                      {selectedParameter.unit && ` ${selectedParameter.unit}`}
                    </div>
                  </div>
                  
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--surface-subtle-tint)' }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                        Version 1
                      </span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        01.01.2025
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      Initiale Parameterdefinition
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div 
              className="p-6 border-t flex items-center justify-end gap-3 sticky bottom-0 bg-white"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                Schließen
              </button>
              <button
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-primary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                Änderungen speichern
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Location Selection Modal for Store Blocking */}
      <LocationSelectionModal
        isOpen={showStoreSelectionModal}
        onClose={() => setShowStoreSelectionModal(false)}
        title="Filiale für Blockierungsregel auswählen"
        availableLocations={[]}
        selectedLocations={[]}
        onConfirm={handleConfirmStoreSelection}
      />
      
      {/* Article Hierarchy Selection Modal */}
      <ArticleHierarchySelector
        isOpen={showArticleHierarchyModal}
        onClose={() => setShowArticleHierarchyModal(false)}
        selectedNodes={selectedArticleNodes}
        onConfirm={handleArticleHierarchyConfirm}
        title="Artikelhierarchie auswählen"
        description="Wählen Sie die Artikelhierarchieebenen aus, für die Sie Parameter filtern möchten"
      />
    </div>
  );
}