import { useState, useMemo, useEffect } from 'react';
import { 
  ChevronRight, X, AlertTriangle, AlertCircle, Info, 
  ExternalLink, CheckCircle, Clock, ArrowRight, TrendingUp,
  Calendar, Package, Settings as SettingsIcon, MessageSquare,
  User, BarChart3, Filter, Search
} from 'lucide-react';
import type { Screen } from '../../App';
import { useLanguage } from '../../i18n';

interface ExceptionsScreenProps {
  onNavigate: (screen: Screen) => void;
}

type ExceptionType = 
  | 'overcapacity'
  | 'undercapacity'
  | 'delivery-conflict'
  | 'lot-conflict'
  | 'parameter-conflict'
  | 'manual-deviation';

type Severity = 'info' | 'critical' | 'blocking';
type ExceptionStatus = 'new' | 'in-progress' | 'accepted' | 'resolved';
type ProcessContext = 'initial' | 'replenishment';
type Source = 'planning' | 'simulation' | 'production';
type ViewMode = 'aggregated' | 'detail';

interface Exception {
  id: string;
  type: ExceptionType;
  severity: Severity;
  status: ExceptionStatus;
  process: ProcessContext;
  article: string;
  category: string;
  cause: string;
  affectedLevel: string;
  impact: string;
  source: Source;
  recommendedAction: string;
  createdAt: string;
  season: string;
  cluster?: string;
  capacityDeviation?: number;
  deliveryDate?: string;
  assignedTo?: string;
}

// Exception type labels are now dynamic - use getExceptionTypeLabel(type, t) function

const SEVERITY_CONFIG = {
  'info': { color: 'var(--status-info)', icon: Info },
  'critical': { color: 'var(--status-warning)', icon: AlertTriangle },
  'blocking': { color: 'var(--status-danger)', icon: AlertCircle }
};

const STATUS_CONFIG = {
  'new': { color: 'var(--status-info)' },
  'in-progress': { color: 'var(--status-warning)' },
  'accepted': { color: 'var(--brand-primary)' },
  'resolved': { color: 'var(--status-success)' }
};

// Helper functions for translated labels
const getExceptionTypeLabel = (type: ExceptionType, t: any) => {
  const labels: Record<ExceptionType, string> = {
    'overcapacity': t.exceptions.overcapacity,
    'undercapacity': t.exceptions.undercapacity,
    'delivery-conflict': t.exceptions.deliveryConflict,
    'lot-conflict': t.exceptions.lotConflict,
    'parameter-conflict': t.exceptions.parameterConflict,
    'manual-deviation': t.exceptions.manualDeviation
  };
  return labels[type];
};

const getSeverityLabel = (severity: Severity, t: any) => {
  const labels: Record<Severity, string> = {
    'info': t.exceptions.info,
    'critical': t.exceptions.critical,
    'blocking': t.exceptions.blocking
  };
  return labels[severity];
};

const getStatusLabel = (status: ExceptionStatus, t: any) => {
  const labels: Record<ExceptionStatus, string> = {
    'new': t.exceptions.new,
    'in-progress': t.exceptions.inProgress,
    'accepted': t.exceptions.accepted,
    'resolved': t.exceptions.resolved
  };
  return labels[status];
};

const MOCK_EXCEPTIONS: Exception[] = [
  {
    id: 'EXC-001',
    type: 'overcapacity',
    severity: 'critical',
    status: 'new',
    process: 'initial',
    article: 'ART-10245 - Running Shoes Elite',
    category: 'Shoes › Running',
    cause: 'SOLL-Kapazität wird im Cluster "Urban Premium" um 23% überschritten',
    affectedLevel: 'Store-Cluster: Urban Premium (3 Filialen)',
    impact: '+23% über SOLL',
    source: 'simulation',
    recommendedAction: 'Liefertermin verschieben oder Artikel reduzieren',
    createdAt: '2025-12-16 09:45',
    season: 'SS 2026',
    cluster: 'Urban Premium',
    capacityDeviation: 23,
    deliveryDate: 'KW 12/2026'
  },
  {
    id: 'EXC-002',
    type: 'lot-conflict',
    severity: 'blocking',
    status: 'new',
    process: 'initial',
    article: 'ART-10892 - Casual Jacket Spring',
    category: 'Apparel › Jackets',
    cause: 'LOT-Zwang verletzt: Nur 4 von 6 Größen verfügbar',
    affectedLevel: 'Produktgruppe: Casual Jackets',
    impact: 'Präsentation nicht regelkonform',
    source: 'planning',
    recommendedAction: 'Artikel aus Lauf entfernen oder fehlende Größen beschaffen',
    createdAt: '2025-12-16 08:12',
    season: 'SS 2026',
    deliveryDate: 'KW 10/2026'
  },
  {
    id: 'EXC-003',
    type: 'delivery-conflict',
    severity: 'critical',
    status: 'in-progress',
    process: 'replenishment',
    article: 'ART-11234 - Summer Dress Collection',
    category: 'Apparel › Dresses',
    cause: 'Zeitliche Verdichtung: 3 Kollektionen in KW 15',
    affectedLevel: 'Zeitfenster: KW 15/2026',
    impact: 'Kapazitätsüberlastung +45%',
    source: 'simulation',
    recommendedAction: 'Liefertermin um 1 Woche verschieben',
    createdAt: '2025-12-15 14:30',
    season: 'SS 2026',
    cluster: 'Alle',
    capacityDeviation: 45,
    deliveryDate: 'KW 15/2026',
    assignedTo: 'Maria Müller'
  },
  {
    id: 'EXC-004',
    type: 'undercapacity',
    severity: 'info',
    status: 'accepted',
    process: 'initial',
    article: 'Kategorie: Accessories',
    category: 'Accessories',
    cause: 'SOLL-Kapazität wird nur zu 78% ausgelastet',
    affectedLevel: 'Warengruppe: Accessories',
    impact: '-22% unter SOLL',
    source: 'planning',
    recommendedAction: 'Zusätzliche Artikel einplanen oder Abweichung akzeptieren',
    createdAt: '2025-12-14 11:20',
    season: 'SS 2026',
    capacityDeviation: -22
  },
  {
    id: 'EXC-005',
    type: 'parameter-conflict',
    severity: 'blocking',
    status: 'new',
    process: 'initial',
    article: 'ART-10567 - Premium Sneakers',
    category: 'Shoes › Sneakers',
    cause: 'Mindestpräsentationsmenge (8 Stk.) > verfügbare Kapazität (5 Stk.)',
    affectedLevel: 'Artikel-Ebene',
    impact: 'Allokation nicht möglich',
    source: 'planning',
    recommendedAction: 'Parameter prüfen und anpassen',
    createdAt: '2025-12-16 10:05',
    season: 'SS 2026'
  },
  {
    id: 'EXC-006',
    type: 'manual-deviation',
    severity: 'info',
    status: 'accepted',
    process: 'initial',
    article: 'ART-10123 - Special Edition',
    category: 'Shoes › Limited',
    cause: 'Bewusste Überallokation für Marketingaktion',
    affectedLevel: 'Filiale: Zürich HB',
    impact: '+15% über SOLL',
    source: 'production',
    recommendedAction: 'Keine Aktion erforderlich (akzeptiert)',
    createdAt: '2025-12-13 16:45',
    season: 'SS 2026',
    capacityDeviation: 15,
    assignedTo: 'Andreas Schmidt'
  },
  {
    id: 'EXC-007',
    type: 'overcapacity',
    severity: 'critical',
    status: 'in-progress',
    process: 'replenishment',
    article: 'Kategorie: Electronics',
    category: 'Electronics',
    cause: 'Nachschub überschreitet verfügbare Lagerfläche',
    affectedLevel: 'Store-Cluster: Regional',
    impact: '+18% über SOLL',
    source: 'simulation',
    recommendedAction: 'Mengereduktion oder zeitliche Staffelung',
    createdAt: '2025-12-15 09:30',
    season: 'AW 2025',
    cluster: 'Regional',
    capacityDeviation: 18,
    assignedTo: 'Julia Weber'
  },
  {
    id: 'EXC-008',
    type: 'delivery-conflict',
    severity: 'info',
    status: 'resolved',
    process: 'initial',
    article: 'ART-10889 - Winter Boots',
    category: 'Shoes › Boots',
    cause: 'Ursprünglicher Liefertermin zu spät',
    affectedLevel: 'Zeitfenster: KW 40/2025',
    impact: 'Verzögerung um 2 Wochen',
    source: 'planning',
    recommendedAction: 'Liefertermin angepasst',
    createdAt: '2025-12-10 08:00',
    season: 'AW 2025',
    deliveryDate: 'KW 38/2025'
  }
];

export function ExceptionsScreen({ onNavigate }: ExceptionsScreenProps) {
  const { t } = useLanguage();
  const [exceptions, setExceptions] = useState<Exception[]>(MOCK_EXCEPTIONS);
  const [loading, setLoading] = useState(true);
  const [selectedFilters, setSelectedFilters] = useState({
    process: [] as ProcessContext[],
    type: [] as ExceptionType[],
    severity: [] as Severity[],
    status: [] as ExceptionStatus[],
    season: [] as string[]
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('detail');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptReason, setAcceptReason] = useState('');

  // Load exceptions - use local MOCK_EXCEPTIONS directly for reliability
  useEffect(() => {
    setLoading(true);
    // Use local mock data directly to ensure screen always works
    setExceptions(MOCK_EXCEPTIONS);
    setLoading(false);
  }, []);
  
  // Filter exceptions
  const filteredExceptions = useMemo(() => {
    return exceptions.filter(exc => {
      if (selectedFilters.process.length > 0 && !selectedFilters.process.includes(exc.process)) return false;
      if (selectedFilters.type.length > 0 && !selectedFilters.type.includes(exc.type)) return false;
      if (selectedFilters.severity.length > 0 && !selectedFilters.severity.includes(exc.severity)) return false;
      if (selectedFilters.status.length > 0 && !selectedFilters.status.includes(exc.status)) return false;
      if (searchQuery && !exc.article.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !exc.category.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [exceptions, selectedFilters, searchQuery]);
  
  // Aggregated data grouped by type
  const aggregatedData = useMemo(() => {
    const grouped = filteredExceptions.reduce((acc, exc) => {
      const key = exc.type;
      if (!acc[key]) {
        acc[key] = {
          type: key,
          count: 0,
          critical: 0,
          blocking: 0,
          info: 0,
          new: 0,
          inProgress: 0,
          accepted: 0,
          resolved: 0,
          categories: new Set<string>()
        };
      }
      acc[key].count++;
      if (exc.severity === 'critical') acc[key].critical++;
      if (exc.severity === 'blocking') acc[key].blocking++;
      if (exc.severity === 'info') acc[key].info++;
      if (exc.status === 'new') acc[key].new++;
      if (exc.status === 'in-progress') acc[key].inProgress++;
      if (exc.status === 'accepted') acc[key].accepted++;
      if (exc.status === 'resolved') acc[key].resolved++;
      acc[key].categories.add(exc.category);
      return acc;
    }, {} as Record<ExceptionType, any>);
    
    return Object.values(grouped);
  }, [filteredExceptions]);
  
  // KPIs
  const kpis = useMemo(() => {
    const total = filteredExceptions.length;
    const criticalBlocking = filteredExceptions.filter(e => e.severity === 'critical' || e.severity === 'blocking').length;
    const accepted = filteredExceptions.filter(e => e.status === 'accepted').length;
    
    // Calculate average processing time from resolved exceptions
    const resolvedExceptions = filteredExceptions.filter(e => e.status === 'resolved');
    const avgDays = resolvedExceptions.length > 0 ? 2.5 : 0; // Mock calculation
    
    return { total, criticalBlocking, accepted, avgDays };
  }, [filteredExceptions]);
  
  const handleAcceptDeviation = () => {
    if (selectedException && acceptReason.trim()) {
      // Update exception status
      setExceptions(prev => prev.map(exc => 
        exc.id === selectedException.id 
          ? { ...exc, status: 'accepted' as ExceptionStatus }
          : exc
      ));
      alert(`Abweichung akzeptiert: ${selectedException.id}\nBegründung: ${acceptReason}`);
      setShowAcceptModal(false);
      setAcceptReason('');
      setSelectedException(null);
    }
  };
  
  const handleResolve = (exc: Exception) => {
    setExceptions(prev => prev.map(e => 
      e.id === exc.id 
        ? { ...e, status: 'resolved' as ExceptionStatus }
        : e
    ));
    alert(`Exception ${exc.id} als gelöst markiert`);
    setSelectedException(null);
  };
  
  const handleSetInProgress = (exc: Exception) => {
    setExceptions(prev => prev.map(e => 
      e.id === exc.id 
        ? { ...e, status: 'in-progress' as ExceptionStatus }
        : e
    ));
    setSelectedException(null);
  };
  
  const SeverityIcon = ({ severity }: { severity: Severity }) => {
    const config = SEVERITY_CONFIG[severity];
    const Icon = config.icon;
    return <Icon size={16} style={{ color: config.color }} />;
  };
  
  return (
    <div className="pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        <span>Cockpit</span>
        <ChevronRight size={16} />
        <span>{t.exceptionsScreen.title}</span>
      </div>
      
      {/* Header */}
      <div className="mb-6">
        <h1
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-2)'
          }}
        >
          {t.exceptions.title}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', maxWidth: '900px' }}>
          {t.exceptions.subtitle}
        </p>
      </div>
      
      {/* Filter & Context Bar */}
      <div
        className="p-4 rounded-lg border mb-6"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t.exceptions.searchPlaceholder}
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
            
            {/* Process Filter */}
            <select
              value={selectedFilters.process[0] || ''}
              onChange={(e) => {
                setSelectedFilters(prev => ({ 
                  ...prev, 
                  process: e.target.value ? [e.target.value as ProcessContext] : [] 
                }));
              }}
              className="px-3 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)',
                minWidth: '150px'
              }}
            >
              <option value="">{t.exceptionsScreen.processAll}</option>
              <option value="initial">{t.exceptionsScreen.initialAllocation}</option>
              <option value="replenishment">{t.exceptionsScreen.replenishment}</option>
            </select>
            
            {/* Severity Filter */}
            <select
              value={selectedFilters.severity[0] || ''}
              onChange={(e) => {
                setSelectedFilters(prev => ({ 
                  ...prev, 
                  severity: e.target.value ? [e.target.value as Severity] : [] 
                }));
              }}
              className="px-3 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)',
                minWidth: '150px'
              }}
            >
              <option value="">Severity: Alle</option>
              <option value="info">Hinweis</option>
              <option value="critical">{t.exceptions.critical}</option>
              <option value="blocking">Blockierend</option>
            </select>
            
            {/* Status Filter */}
            <select
              value={selectedFilters.status[0] || ''}
              onChange={(e) => {
                setSelectedFilters(prev => ({ 
                  ...prev, 
                  status: e.target.value ? [e.target.value as ExceptionStatus] : [] 
                }));
              }}
              className="px-3 py-2 border rounded-lg"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)',
                minWidth: '150px'
              }}
            >
              <option value="">Status: Alle</option>
              <option value="new">Neu</option>
              <option value="in-progress">In Bearbeitung</option>
              <option value="accepted">Akzeptiert</option>
              <option value="resolved">Gelöst</option>
            </select>
          </div>
          
          {/* View Toggle */}
          <div 
            className="flex items-center rounded-lg border overflow-hidden"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <button
              onClick={() => setViewMode('aggregated')}
              className="px-3 py-2"
              style={{
                backgroundColor: viewMode === 'aggregated' ? 'var(--brand-primary)' : 'var(--surface-page)',
                color: viewMode === 'aggregated' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)',
                borderRight: '1px solid var(--border-default)'
              }}
            >
              Aggregiert
            </button>
            <button
              onClick={() => setViewMode('detail')}
              className="px-3 py-2"
              style={{
                backgroundColor: viewMode === 'detail' ? 'var(--brand-primary)' : 'var(--surface-page)',
                color: viewMode === 'detail' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Detail
            </button>
          </div>
        </div>
        
        {/* Active Filters */}
        {(selectedFilters.process.length > 0 || selectedFilters.severity.length > 0 || selectedFilters.status.length > 0 || searchQuery) && (
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Aktive Filter:</span>
            {selectedFilters.process.map(p => (
              <span 
                key={p}
                className="px-2 py-1 rounded flex items-center gap-1"
                style={{ backgroundColor: 'var(--surface-info-subtle)', fontSize: 'var(--font-size-xs)' }}
              >
                {p === 'initial' ? t.exceptionsScreen.initial : t.exceptionsScreen.replenishment}
                <button onClick={() => setSelectedFilters(prev => ({ ...prev, process: prev.process.filter(x => x !== p) }))}>
                  <X size={12} />
                </button>
              </span>
            ))}
            {searchQuery && (
              <span 
                className="px-2 py-1 rounded flex items-center gap-1"
                style={{ backgroundColor: 'var(--surface-info-subtle)', fontSize: 'var(--font-size-xs)' }}
              >
                Suche: "{searchQuery}"
                <button onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
            {t.exceptionsScreen.openExceptions}
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            {kpis.total}
          </div>
        </div>
        
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-danger-subtle)',
            borderColor: 'var(--border-danger)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
            {t.exceptions.criticalBlocking}
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--status-danger)' }}>
            {kpis.criticalBlocking}
          </div>
        </div>
        
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
            {t.exceptions.acceptedDeviations}
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            {kpis.accepted}
          </div>
        </div>
        
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
            Ø Bearbeitungsdauer
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
            {kpis.avgDays} <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-regular)', color: 'var(--text-muted)' }}>Tage</span>
          </div>
        </div>
      </div>
      
      {/* Exception Table */}
      {viewMode === 'detail' ? (
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', width: '80px' }}>
                  Severity
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '180px' }}>
                  Exception-Typ
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '200px' }}>
                  {t.exceptions.articleCategory}
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '120px' }}>
                  {t.exceptions.process}
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '250px' }}>
                  {t.exceptions.cause}
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '150px' }}>
                  {t.exceptions.impact}
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '100px' }}>
                  {t.exceptions.source}
                </th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', minWidth: '120px' }}>
                  Status
                </th>
                <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', width: '100px' }}>
                  {t.exceptions.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExceptions.map(exc => (
                <tr 
                  key={exc.id}
                  onClick={() => setSelectedException(exc)}
                  style={{ 
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: 'pointer'
                  }}
                  className="hover:bg-surface-tint transition-colors"
                >
                  <td style={{ padding: '16px' }}>
                    <div className="flex items-center gap-2">
                      <SeverityIcon severity={exc.severity} />
                      <span 
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${SEVERITY_CONFIG[exc.severity].color}15`,
                          color: SEVERITY_CONFIG[exc.severity].color,
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        {getSeverityLabel(exc.severity, t)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 'var(--font-size-sm)' }}>
                    {getExceptionTypeLabel(exc.type, t)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {exc.article}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {exc.category}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span 
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor: exc.process === 'initial' ? 'var(--surface-info-subtle)' : 'var(--surface-success-subtle)',
                        color: exc.process === 'initial' ? 'var(--status-info)' : 'var(--status-success)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}
                    >
                      {exc.process === 'initial' ? t.exceptionsScreen.initial : t.exceptionsScreen.replenishment}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    {exc.cause}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span 
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: exc.capacityDeviation && exc.capacityDeviation > 0 ? 'var(--status-danger)' : 'var(--status-warning)'
                      }}
                    >
                      {exc.impact}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span 
                      className="px-2 py-1 rounded"
                      style={{
                        backgroundColor: 'var(--surface-subtle-tint)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {exc.source === 'planning' ? 'Planung' : exc.source === 'simulation' ? 'Simulation' : 'Produktiv'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span 
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: `${STATUS_CONFIG[exc.status].color}15`,
                        color: STATUS_CONFIG[exc.status].color,
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}
                    >
                      {STATUS_CONFIG[exc.status].label}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedException(exc);
                      }}
                      className="p-1 hover:bg-surface-tint rounded"
                    >
                      <ArrowRight size={16} style={{ color: 'var(--brand-primary)' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Aggregated View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aggregatedData.map((group: any) => (
            <div
              key={group.type}
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                    {getExceptionTypeLabel(group.type as ExceptionType, t)}
                  </h3>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    {group.categories.size} {t.exceptions.categoriesAffected}
                  </div>
                </div>
                <div 
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--surface-subtle-tint)',
                    fontSize: 'var(--font-size-xl)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}
                >
                  {group.count}
                </div>
              </div>
              
              <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    Severity
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {group.blocking > 0 && (
                      <span 
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--surface-danger-subtle)',
                          color: 'var(--status-danger)',
                          fontSize: 'var(--font-size-xs)'
                        }}
                      >
                        {group.blocking} Blockierend
                      </span>
                    )}
                    {group.critical > 0 && (
                      <span 
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--surface-warning-subtle)',
                          color: 'var(--status-warning)',
                          fontSize: 'var(--font-size-xs)'
                        }}
                      >
                        {group.critical} {t.exceptions.critical}
                      </span>
                    )}
                    {group.info > 0 && (
                      <span 
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--surface-info-subtle)',
                          color: 'var(--status-info)',
                          fontSize: 'var(--font-size-xs)'
                        }}
                      >
                        {group.info} Hinweis
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    Status
                  </span>
                  <div className="flex items-center gap-2 flex-wrap justify-end" style={{ fontSize: 'var(--font-size-xs)' }}>
                    {group.new > 0 && <span style={{ color: 'var(--status-info)' }}>{group.new} Neu</span>}
                    {group.inProgress > 0 && <span style={{ color: 'var(--status-warning)' }}>{group.inProgress} In Bearb.</span>}
                    {group.accepted > 0 && <span style={{ color: 'var(--brand-primary)' }}>{group.accepted} Akzept.</span>}
                    {group.resolved > 0 && <span style={{ color: 'var(--status-success)' }}>{group.resolved} Gelöst</span>}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setSelectedFilters(prev => ({ ...prev, type: [group.type as ExceptionType] }));
                  setViewMode('detail');
                }}
                className="mt-4 w-full px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                Details anzeigen
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Detail Side Panel - See next part due to length */}
      {selectedException && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setSelectedException(null)}
          style={{ backgroundColor: 'var(--bg-overlay)' }}
        >
          <div className="flex-1" />
          <div
            className="bg-white shadow-lg overflow-y-auto"
            style={{
              width: '600px',
              maxWidth: '100vw',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="p-6 border-b sticky top-0 bg-white z-10"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Exception-ID
                  </div>
                  <h2
                    style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}
                  >
                    {selectedException.id}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedException(null)}
                  className="p-1 hover:bg-surface-tint rounded"
                >
                  <X size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <SeverityIcon severity={selectedException.severity} />
                  <span 
                    className="px-2 py-1 rounded"
                    style={{
                      backgroundColor: `${SEVERITY_CONFIG[selectedException.severity].color}15`,
                      color: SEVERITY_CONFIG[selectedException.severity].color,
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    {getSeverityLabel(selectedException.severity, t)}
                  </span>
                </div>
                <span 
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${STATUS_CONFIG[selectedException.status].color}15`,
                    color: STATUS_CONFIG[selectedException.status].color,
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  {STATUS_CONFIG[selectedException.status].label}
                </span>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Section 1: Context */}
              <div>
                <h3 
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--space-3)'
                  }}
                >
                  Kontext
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Package size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                    <div className="flex-1">
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {t.exceptions.articleCategory}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {selectedException.article}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {selectedException.category}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <TrendingUp size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                    <div className="flex-1">
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        {t.exceptions.process}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {selectedException.process === 'initial' ? t.exceptionsScreen.initialAllocation : t.exceptionsScreen.replenishment}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                    <div className="flex-1">
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Saison
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {selectedException.season}
                      </div>
                    </div>
                  </div>
                  
                  {selectedException.deliveryDate && (
                    <div className="flex items-start gap-3">
                      <Clock size={16} style={{ color: 'var(--text-muted)', marginTop: '2px' }} />
                      <div className="flex-1">
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          Liefertermin
                        </div>
                        <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                          {selectedException.deliveryDate}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Section 2: Cause */}
              <div className="border-t pt-6" style={{ borderColor: 'var(--border-default)' }}>
                <h3 
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--space-3)'
                  }}
                >
                  {t.exceptions.causeDetails}
                </h3>
                
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface-warning-subtle)',
                    border: '1px solid var(--border-warning)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Beschreibung der Regelverletzung
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', lineHeight: '1.5' }}>
                    {selectedException.cause}
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      Betroffene Ebene
                    </span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      {selectedException.affectedLevel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      Exception-Typ
                    </span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      {getExceptionTypeLabel(selectedException.type, t)}
                    </span>
                  </div>
                </div>
                
                {selectedException.type === 'parameter-conflict' && (
                  <button
                    onClick={() => {
                      setSelectedException(null);
                      onNavigate('parameters');
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--button-secondary-bg)',
                      borderColor: 'var(--button-secondary-border)',
                      color: 'var(--button-secondary-text)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    <SettingsIcon size={16} />
                    Zur Parameterpflege
                  </button>
                )}
              </div>
              
              {/* Section 3: Impact */}
              {selectedException.capacityDeviation && (
                <div className="border-t pt-6" style={{ borderColor: 'var(--border-default)' }}>
                  <h3 
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: 'var(--space-3)'
                    }}
                  >
                    Kapazitätswirkung
                  </h3>
                  
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: selectedException.capacityDeviation > 0 ? 'var(--surface-danger-subtle)' : 'var(--surface-warning-subtle)',
                      border: `1px solid ${selectedException.capacityDeviation > 0 ? 'var(--border-danger)' : 'var(--border-warning)'}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                        Abweichung SOLL
                      </span>
                      <span 
                        style={{
                          fontSize: 'var(--font-size-xl)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: selectedException.capacityDeviation > 0 ? 'var(--status-danger)' : 'var(--status-warning)'
                        }}
                      >
                        {selectedException.capacityDeviation > 0 ? '+' : ''}{selectedException.capacityDeviation}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Mini Chart Placeholder */}
                  <div className="mt-4 flex items-end gap-2 h-24">
                    <div className="flex-1 bg-surface-subtle-tint rounded-t" style={{ height: '60%' }}>
                      <div className="h-full flex items-end justify-center pb-2">
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>SOLL</span>
                      </div>
                    </div>
                    <div 
                      className="flex-1 rounded-t" 
                      style={{ 
                        height: '85%',
                        backgroundColor: selectedException.capacityDeviation > 0 ? 'var(--status-danger)' : 'var(--status-warning)'
                      }}
                    >
                      <div className="h-full flex items-end justify-center pb-2">
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-inverse)' }}>IST</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Section 4: Recommendations */}
              <div className="border-t pt-6" style={{ borderColor: 'var(--border-default)' }}>
                <h3 
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--space-3)'
                  }}
                >
                  Handlungsempfehlungen
                </h3>
                
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface-info-subtle)',
                    border: '1px solid var(--border-info)'
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Info size={16} style={{ color: 'var(--status-info)', marginTop: '2px' }} />
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        Systemvorschlag
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        {selectedException.recommendedAction}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Primary Actions */}
              <div className="border-t pt-6 space-y-3" style={{ borderColor: 'var(--border-default)' }}>
                <button
                  onClick={() => {
                    setSelectedException(null);
                    onNavigate('capacity');
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--button-secondary-bg)',
                    borderColor: 'var(--button-secondary-border)',
                    color: 'var(--button-secondary-text)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <span>Zur Simulation springen</span>
                  <ExternalLink size={16} />
                </button>
                
                <button
                  onClick={() => setShowAcceptModal(true)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <span>Abweichung akzeptieren</span>
                  <CheckCircle size={16} />
                </button>
                
                <button
                  onClick={() => handleResolve(selectedException)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--status-success)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <span>{t.exceptionsScreen.resolveException}</span>
                  <CheckCircle size={16} />
                </button>
              </div>
              
              {/* Metadata */}
              <div className="border-t pt-6" style={{ borderColor: 'var(--border-default)' }}>
                <div className="flex items-center justify-between" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  <span>Erstellt: {selectedException.createdAt}</span>
                  {selectedException.assignedTo && (
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {selectedException.assignedTo}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Accept Modal */}
      {showAcceptModal && selectedException && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={() => setShowAcceptModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-md"
            style={{ boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <h3
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}
              >
                Abweichung akzeptieren
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                Sie sind dabei, die Exception <strong>{selectedException.id}</strong> als akzeptierte Abweichung zu kennzeichnen.
              </p>
              
              <div>
                <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', display: 'block', marginBottom: '8px' }}>
                  Begründung (Pflichtfeld)
                </label>
                <textarea
                  value={acceptReason}
                  onChange={(e) => setAcceptReason(e.target.value)}
                  placeholder="Bitte geben Sie eine Begründung für die Akzeptanz ein..."
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: 'var(--border-input)',
                    fontSize: 'var(--font-size-sm)',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>
            
            <div className="p-6 border-t flex items-center justify-end gap-3" style={{ borderColor: 'var(--border-default)' }}>
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  setAcceptReason('');
                }}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleAcceptDeviation}
                disabled={!acceptReason.trim()}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: acceptReason.trim() ? 'var(--brand-primary)' : 'var(--border-default)',
                  color: 'var(--text-inverse)',
                  height: 'var(--height-button-md)',
                  opacity: acceptReason.trim() ? 1 : 0.5,
                  cursor: acceptReason.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                Akzeptieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}