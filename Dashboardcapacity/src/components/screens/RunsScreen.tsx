import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../i18n';
import { DataGrid, Column } from '../common/DataGrid';
import { ChevronLeft, TrendingUp, TrendingDown, Circle, Info, X, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { dataService } from '../../services/dataService';

interface RunsScreenProps {
  onNavigate: (screen: string, params?: { runId?: string }) => void;
  runId: string | null;
}

type RunType = 'initial' | 'replenishment' | 'manual';
type RunStatus = 'Geplant' | 'Läuft' | 'Abgeschlossen' | 'Mit Ausnahmen';
type CapacityImpact = 'Überkapazität' | 'Untererfüllung' | 'Ausgeglichen';

interface AllocationRun {
  id: string;
  type: RunType;
  status: RunStatus;
  startDate: string;
  articleCount: number;
  storeCount: number;
  progress?: number;
  user: string;
  endDate?: string;
}

interface RunArticle {
  id: string;
  articleNumber: string;
  description: string;
  color: string;
  colorHex: string;
  season: string;
  allocationFrom: string;
  allocationTo: string;
  storeCount: number;
  totalQuantity: number;
  capacityImpact: CapacityImpact;
  hasExceptions: boolean;
  sizeCount: number;
  allocationDate: string;
}

interface StoreAllocation {
  storeId: string;
  storeName: string;
  storeDescription: string;
  allocatedQuantity: number;
  demand: number;
  overUnder: number;
  targetStock: number;
  currentStock: number;
  salesLast2Weeks: number;
}

interface SizeDetail {
  size: string;
  allocatedQuantity: number;
  demand: number;
  currentStock: number;
  targetStock: number;
}

const MOCK_RUNS: AllocationRun[] = [
  {
    id: 'RUN-2025-W50-001',
    type: 'initial',
    status: 'Abgeschlossen',
    startDate: '2025-12-16 09:30',
    endDate: '2025-12-16 11:45',
    articleCount: 156,
    storeCount: 12,
    user: 'M. Weber'
  },
  {
    id: 'RUN-2025-W50-002',
    type: 'replenishment',
    status: 'Abgeschlossen',
    startDate: '2025-12-15 14:20',
    endDate: '2025-12-15 15:30',
    articleCount: 89,
    storeCount: 10,
    user: 'S. Müller'
  },
  {
    id: 'RUN-2025-W50-003',
    type: 'manual',
    status: 'Mit Ausnahmen',
    startDate: '2025-12-14 10:15',
    endDate: '2025-12-14 12:00',
    articleCount: 45,
    storeCount: 8,
    user: 'A. Schmidt'
  },
  {
    id: 'RUN-2025-W49-001',
    type: 'initial',
    status: 'Abgeschlossen',
    startDate: '2025-12-09 08:00',
    endDate: '2025-12-09 10:30',
    articleCount: 203,
    storeCount: 12,
    user: 'M. Weber'
  },
  {
    id: 'RUN-2025-W49-002',
    type: 'replenishment',
    status: 'Abgeschlossen',
    startDate: '2025-12-08 13:45',
    endDate: '2025-12-08 14:50',
    articleCount: 67,
    storeCount: 9,
    user: 'T. Fischer'
  },
  {
    id: 'RUN-2025-W48-001',
    type: 'manual',
    status: 'Abgeschlossen',
    startDate: '2025-12-02 11:30',
    endDate: '2025-12-02 13:15',
    articleCount: 34,
    storeCount: 6,
    user: 'S. Müller'
  },
  {
    id: 'RUN-2025-W47-001',
    type: 'initial',
    status: 'Läuft',
    startDate: '2025-11-25 09:00',
    articleCount: 178,
    storeCount: 12,
    user: 'M. Weber',
    progress: 65
  }
];

const MOCK_ARTICLES: RunArticle[] = [
  {
    id: '1',
    articleNumber: 'ART-20251001',
    description: 'Running Schuhe Pro Trail Max mit Dämpfung',
    color: 'Schwarz',
    colorHex: '#000000',
    season: 'Frühjahr/Sommer 2025',
    allocationFrom: '2025-03-01',
    allocationTo: '2025-03-15',
    storeCount: 8,
    totalQuantity: 240,
    capacityImpact: 'Überkapazität',
    hasExceptions: true,
    sizeCount: 12,
    allocationDate: '2025-12-16'
  },
  {
    id: '2',
    articleNumber: 'ART-20251002',
    description: 'Sport T-Shirt Performance Fit',
    color: 'Blau',
    colorHex: '#2563eb',
    season: 'Frühjahr/Sommer 2025',
    allocationFrom: '2025-02-15',
    allocationTo: '2025-02-28',
    storeCount: 12,
    totalQuantity: 560,
    capacityImpact: 'Ausgeglichen',
    hasExceptions: false,
    sizeCount: 5,
    allocationDate: '2025-12-16'
  },
  {
    id: '3',
    articleNumber: 'ART-20251003',
    description: 'Winterjacke Premium Isolation',
    color: 'Rot',
    colorHex: '#dc2626',
    season: 'Herbst/Winter 2025',
    allocationFrom: '2025-10-01',
    allocationTo: '2025-10-15',
    storeCount: 10,
    totalQuantity: 180,
    capacityImpact: 'Untererfüllung',
    hasExceptions: false,
    sizeCount: 6,
    allocationDate: '2025-12-16'
  }
];

const MOCK_STORES: StoreAllocation[] = [
  {
    storeId: 'ZH-001',
    storeName: 'Zürich HB',
    storeDescription: 'Hauptbahnhof Zürich',
    allocatedQuantity: 45,
    demand: 50,
    overUnder: -5,
    targetStock: 60,
    currentStock: 15,
    salesLast2Weeks: 35
  },
  {
    storeId: 'BE-001',
    storeName: 'Bern',
    storeDescription: 'Bern Innenstadt',
    allocatedQuantity: 30,
    demand: 28,
    overUnder: 2,
    targetStock: 40,
    currentStock: 12,
    salesLast2Weeks: 22
  },
  {
    storeId: 'BS-001',
    storeName: 'Basel',
    storeDescription: 'Basel SBB',
    allocatedQuantity: 38,
    demand: 40,
    overUnder: -2,
    targetStock: 50,
    currentStock: 10,
    salesLast2Weeks: 28
  },
  {
    storeId: 'LU-001',
    storeName: 'Luzern',
    storeDescription: 'Luzern Bahnhofstrasse',
    allocatedQuantity: 25,
    demand: 22,
    overUnder: 3,
    targetStock: 35,
    currentStock: 13,
    salesLast2Weeks: 18
  },
  {
    storeId: 'LS-001',
    storeName: 'Lausanne',
    storeDescription: 'Lausanne Gare',
    allocatedQuantity: 32,
    demand: 35,
    overUnder: -3,
    targetStock: 45,
    currentStock: 11,
    salesLast2Weeks: 25
  }
];

const MOCK_SIZE_DETAILS: SizeDetail[] = [
  { size: '36', allocatedQuantity: 15, demand: 18, currentStock: 5, targetStock: 20 },
  { size: '37', allocatedQuantity: 18, demand: 20, currentStock: 6, targetStock: 24 },
  { size: '38', allocatedQuantity: 25, demand: 25, currentStock: 8, targetStock: 30 },
  { size: '39', allocatedQuantity: 30, demand: 28, currentStock: 10, targetStock: 35 },
  { size: '40', allocatedQuantity: 28, demand: 30, currentStock: 9, targetStock: 32 },
  { size: '41', allocatedQuantity: 25, demand: 22, currentStock: 7, targetStock: 28 },
  { size: '42', allocatedQuantity: 22, demand: 20, currentStock: 6, targetStock: 25 },
  { size: '43', allocatedQuantity: 18, demand: 15, currentStock: 5, targetStock: 20 },
  { size: '44', allocatedQuantity: 15, demand: 12, currentStock: 4, targetStock: 18 },
  { size: '45', allocatedQuantity: 12, demand: 10, currentStock: 3, targetStock: 15 },
  { size: '46', allocatedQuantity: 10, demand: 8, currentStock: 2, targetStock: 12 },
  { size: '47', allocatedQuantity: 8, demand: 6, currentStock: 2, targetStock: 10 }
];

const CAPACITY_ICONS = {
  'Überkapazität': TrendingUp,
  'Untererfüllung': TrendingDown,
  'Ausgeglichen': Circle
};

const CAPACITY_COLORS = {
  'Überkapazität': '#ef4444',
  'Untererfüllung': '#3b82f6',
  'Ausgeglichen': '#10b981'
};

const RUN_TYPE_LABELS = {
  'initial': 'Initiale Allokation',
  'replenishment': 'Nachschub',
  'manual': 'Manuelle Einsteuerung'
};

export function RunsScreen({ onNavigate, runId }: RunsScreenProps) {
  const { t } = useLanguage();
  const [runs, setRuns] = useState<AllocationRun[]>(MOCK_RUNS);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<RunArticle | null>(null);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [sizeModalData, setSizeModalData] = useState<{ title: string; field: string } | null>(null);
  const [chartSegmentation, setChartSegmentation] = useState<'aggregated' | 'segmented'>('aggregated');
  const [chartMode, setChartMode] = useState<'absolute' | 'relative'>('absolute');

  // Filters for run list
  const [filterType, setFilterType] = useState<RunType | 'all'>('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterUser, setFilterUser] = useState('all');

  // Load runs from dataService
  useEffect(() => {
    const loadRuns = async () => {
      setLoading(true);
      try {
        const data = await dataService.getRuns();
        const mapped: AllocationRun[] = data.map(r => ({
          id: r.id,
          type: (r.type || 'initial') as RunType,
          status: (r.status === 'completed' ? 'Abgeschlossen' : r.status === 'running' ? 'Läuft' : r.status === 'with_exceptions' ? 'Mit Ausnahmen' : 'Geplant') as RunStatus,
          startDate: r.startDate || new Date().toISOString(),
          endDate: r.endDate,
          progress: r.progress || 0,
          articleCount: r.articleCount || 0,
          storeCount: r.storeCount || 0,
          user: r.user || 'System'
        }));
        setRuns(mapped);
      } catch (error) {
        console.error('Failed to load runs:', error);
        setRuns(MOCK_RUNS);
      } finally {
        setLoading(false);
      }
    };
    loadRuns();
  }, []);

  // Get unique users for filter
  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(runs.map(run => run.user))).sort();
  }, [runs]);

  // Filtered runs
  const filteredRuns = useMemo(() => {
    return runs.filter(run => {
      if (filterType !== 'all' && run.type !== filterType) return false;
      if (filterUser !== 'all' && run.user !== filterUser) return false;
      
      if (filterDateFrom) {
        const runDate = new Date(run.startDate);
        const fromDate = new Date(filterDateFrom);
        if (runDate < fromDate) return false;
      }
      
      if (filterDateTo) {
        const runDate = new Date(run.startDate);
        const toDate = new Date(filterDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (runDate > toDate) return false;
      }
      
      return true;
    });
  }, [filterType, filterDateFrom, filterDateTo, filterUser]);

  // Run List View (when no runId)
  if (!runId) {
    const runColumns: Column<AllocationRun>[] = [
      { 
        key: 'id', 
        label: 'Lauf-ID',
        sortable: true,
        width: '160px',
        render: (value) => (
          <code
            style={{
              fontSize: 'var(--font-size-xs)',
              fontFamily: 'var(--font-family-mono)',
              backgroundColor: 'var(--surface-code-block)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            {value}
          </code>
        )
      },
      { 
        key: 'type', 
        label: 'Typ',
        sortable: true,
        width: '180px',
        render: (value) => (
          <span
            className="px-3 py-1 rounded-full inline-block"
            style={{
              backgroundColor: value === 'initial' ? 'var(--surface-info-subtle)' : value === 'replenishment' ? 'var(--surface-success-subtle)' : 'var(--surface-warning-subtle)',
              color: value === 'initial' ? 'var(--status-info)' : value === 'replenishment' ? 'var(--status-success)' : 'var(--status-warning)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {RUN_TYPE_LABELS[value as RunType]}
          </span>
        )
      },
      { 
        key: 'status', 
        label: 'Status',
        sortable: true,
        width: '150px',
        render: (value) => (
          <span
            className="px-3 py-1 rounded-full inline-block"
            style={{
              backgroundColor: 
                value === 'Abgeschlossen' ? 'var(--status-success)' :
                value === 'Läuft' ? 'var(--status-info)' :
                value === 'Geplant' ? 'var(--status-warning)' :
                'var(--status-danger)',
              color: 'var(--text-inverse)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {value}
          </span>
        )
      },
      { 
        key: 'startDate', 
        label: 'Startdatum',
        sortable: true,
        render: (value) => new Date(value as string).toLocaleString('de-DE')
      },
      { 
        key: 'endDate', 
        label: 'Enddatum',
        render: (value) => value ? new Date(value as string).toLocaleString('de-DE') : '-'
      },
      { 
        key: 'user', 
        label: 'Benutzer',
        sortable: true
      },
      { 
        key: 'articleCount', 
        label: 'Anzahl Artikel',
        align: 'right',
        sortable: true,
        render: (value) => (
          <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
            {value}
          </span>
        )
      },
      { 
        key: 'storeCount', 
        label: 'Anzahl Filialen',
        align: 'right',
        sortable: true
      },
      {
        key: 'actions',
        label: 'Aktion',
        align: 'center',
        width: '140px',
        render: (value, row) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate('runs', { runId: row.id });
            }}
            className="px-3 py-1.5 rounded-lg border hover:bg-surface-tint transition-colors"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              borderColor: 'var(--button-secondary-border)',
              color: 'var(--button-secondary-text)',
              fontSize: 'var(--font-size-xs)'
            }}
          >
            Details anzeigen
          </button>
        )
      }
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-2)'
            }}
          >
            Allokationsläufe
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Übersicht und Verwaltung aller Allokationsläufe
          </p>
        </div>

        {/* Filters */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
              Filter
            </h3>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="filterType"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Allokationsprozess
              </label>
              <select
                id="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as RunType | 'all')}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--surface-page)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <option value="all">Alle Typen</option>
                <option value="initial">Initiale Allokation</option>
                <option value="replenishment">Nachschub</option>
                <option value="manual">Manuelle Einsteuerung</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="filterDateFrom"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Datum von
              </label>
              <input
                type="date"
                id="filterDateFrom"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--surface-page)',
                  fontSize: 'var(--font-size-sm)'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="filterDateTo"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Datum bis
              </label>
              <input
                type="date"
                id="filterDateTo"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--surface-page)',
                  fontSize: 'var(--font-size-sm)'
                }}
              />
            </div>

            <div>
              <label
                htmlFor="filterUser"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Benutzer
              </label>
              <select
                id="filterUser"
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--surface-page)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <option value="all">Alle Benutzer</option>
                {uniqueUsers.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filter Button */}
          {(filterType !== 'all' || filterDateFrom || filterDateTo || filterUser !== 'all') && (
            <div className="mt-4">
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterDateFrom('');
                  setFilterDateTo('');
                  setFilterUser('all');
                }}
                className="px-4 py-2 rounded-lg border hover:bg-surface-tint transition-colors"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
          {filteredRuns.length} {filteredRuns.length === 1 ? 'Lauf' : 'Läufe'} gefunden
        </div>

        {/* Runs Table */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <DataGrid
            data={filteredRuns}
            columns={runColumns}
            onRowClick={(run) => onNavigate('runs', { runId: run.id })}
          />
        </div>
      </div>
    );
  }

  // Find the selected run
  const selectedRun = MOCK_RUNS.find(run => run.id === runId);

  // Article Detail View
  if (selectedArticle) {
    // Aggregate data from store allocations
    const totalCurrentStock = MOCK_STORES.reduce((sum, s) => sum + s.currentStock, 0);
    const totalTargetStock = MOCK_STORES.reduce((sum, s) => sum + s.targetStock, 0);
    const totalAllocated = MOCK_STORES.reduce((sum, s) => sum + s.allocatedQuantity, 0);
    const totalOverUnder = MOCK_STORES.reduce((sum, s) => sum + s.overUnder, 0);
    const totalDemand = MOCK_STORES.reduce((sum, s) => sum + s.demand, 0);
    const totalVZBestand = 2400; // VZ-Bestand (central warehouse)

    const aggregatedData = [
      { name: 'Filialbestand gesamt', value: totalCurrentStock },
      { name: 'Sollbestand gesamt', value: totalTargetStock },
      { name: 'Allokationsmenge', value: totalAllocated },
      { name: 'Über-/Unterdeckung', value: totalOverUnder },
      { name: 'Bedarf', value: totalDemand },
      { name: 'VZ-Bestand', value: totalVZBestand }
    ];

    // Segmented data: each metric broken down by size
    const segmentedData = [
      { 
        name: 'Filialbestand gesamt',
        ...MOCK_SIZE_DETAILS.reduce((acc, size) => ({ ...acc, [size.size]: size.currentStock }), {})
      },
      { 
        name: 'Sollbestand gesamt',
        ...MOCK_SIZE_DETAILS.reduce((acc, size) => ({ ...acc, [size.size]: size.targetStock }), {})
      },
      { 
        name: 'Allokationsmenge',
        ...MOCK_SIZE_DETAILS.reduce((acc, size) => ({ ...acc, [size.size]: size.allocatedQuantity }), {})
      },
      { 
        name: 'Über-/Unterdeckung',
        ...MOCK_SIZE_DETAILS.reduce((acc, size) => ({ ...acc, [size.size]: size.allocatedQuantity - size.demand }), {})
      },
      { 
        name: 'Bedarf',
        ...MOCK_SIZE_DETAILS.reduce((acc, size) => ({ ...acc, [size.size]: size.demand }), {})
      },
      { 
        name: 'VZ-Bestand',
        ...MOCK_SIZE_DETAILS.reduce((acc, size) => ({ ...acc, [size.size]: 200 }), {})
      }
    ];

    // Transform to relative percentages if needed
    const displaySegmentedData = chartMode === 'relative' 
      ? segmentedData.map(row => {
          const sizes = MOCK_SIZE_DETAILS.map(s => s.size);
          const total = sizes.reduce((sum, size) => sum + (Number(row[size]) || 0), 0);
          
          if (total === 0) return row;
          
          const relativeRow: any = { name: row.name };
          sizes.forEach(size => {
            relativeRow[size] = ((Number(row[size]) || 0) / total) * 100;
          });
          return relativeRow;
        })
      : segmentedData;

    // Calculate min/max for dynamic X-axis domain
    const allValues = aggregatedData.map(d => d.value);
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const xAxisDomain = minValue < 0 ? [Math.floor(minValue * 1.1), Math.ceil(maxValue * 1.1)] : [0, Math.ceil(maxValue * 1.1)];

    const storeColumns: Column<StoreAllocation>[] = [
      { 
        key: 'storeName', 
        label: 'Filiale',
        sortable: true,
        render: (value) => (
          <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{value}</span>
        )
      },
      { key: 'storeDescription', label: 'Filialbeschreibung' },
      { 
        key: 'allocatedQuantity', 
        label: 'Allokationsmenge',
        align: 'right',
        sortable: true,
        render: (value) => (
          <button
            onClick={() => {
              setSizeModalData({ title: 'Allokationsmenge', field: 'allocatedQuantity' });
              setShowSizeModal(true);
            }}
            className="hover:underline cursor-pointer"
            style={{ 
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--brand-primary)'
            }}
          >
            {value}
          </button>
        )
      },
      { 
        key: 'demand', 
        label: 'Bedarf',
        align: 'right',
        sortable: true,
        render: (value) => (
          <button
            onClick={() => {
              setSizeModalData({ title: 'Bedarf', field: 'demand' });
              setShowSizeModal(true);
            }}
            className="hover:underline cursor-pointer"
            style={{ 
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--brand-primary)'
            }}
          >
            {value}
          </button>
        )
      },
      { 
        key: 'overUnder', 
        label: 'Über-/Unterdeckung',
        align: 'right',
        sortable: true,
        render: (value) => (
          <button
            onClick={() => {
              setSizeModalData({ title: 'Über-/Unterdeckung', field: 'overUnder' });
              setShowSizeModal(true);
            }}
            className="hover:underline cursor-pointer"
            style={{ 
              fontWeight: 'var(--font-weight-medium)',
              color: (value as number) < 0 ? '#ef4444' : (value as number) > 0 ? '#10b981' : 'inherit'
            }}
          >
            {value as number > 0 ? '+' : ''}{value}
          </button>
        )
      },
      { 
        key: 'targetStock', 
        label: 'Sollbestand',
        align: 'right',
        sortable: true,
        render: (value) => (
          <button
            onClick={() => {
              setSizeModalData({ title: 'Sollbestand', field: 'targetStock' });
              setShowSizeModal(true);
            }}
            className="hover:underline cursor-pointer"
            style={{ 
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--brand-primary)'
            }}
          >
            {value}
          </button>
        )
      },
      { 
        key: 'currentStock', 
        label: 'Filialbestand',
        align: 'right',
        sortable: true,
        render: (value) => (
          <button
            onClick={() => {
              setSizeModalData({ title: 'Filialbestand', field: 'currentStock' });
              setShowSizeModal(true);
            }}
            className="hover:underline cursor-pointer"
            style={{ 
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--brand-primary)'
            }}
          >
            {value}
          </button>
        )
      },
      { 
        key: 'salesLast2Weeks', 
        label: 'Umsatz letzte 2 Wochen',
        align: 'right',
        sortable: true
      }
    ];

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-tint transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ChevronLeft size={20} />
          <span>Zurück zum Allokationslauf</span>
        </button>

        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-2)'
            }}
          >
            Artikel – Allokationsdetails
          </h1>
        </div>

        {/* Article Details Card */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Artikelnummer
              </div>
              <code
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-mono)',
                  backgroundColor: 'var(--surface-code-block)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {selectedArticle.articleNumber}
              </code>
            </div>
            <div className="col-span-2">
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Artikelbeschreibung
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                {selectedArticle.description}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Farbe
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{
                    backgroundColor: selectedArticle.colorHex,
                    borderColor: 'var(--border-default)'
                  }}
                />
                <span>{selectedArticle.color}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Anzahl Größen
              </div>
              <div>{selectedArticle.sizeCount}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Saison
              </div>
              <div>{selectedArticle.season}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Allokationsdatum
              </div>
              <div>{new Date(selectedArticle.allocationDate).toLocaleDateString('de-DE')}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Allokationszeitraum von
              </div>
              <div>{new Date(selectedArticle.allocationFrom).toLocaleDateString('de-DE')}</div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Allokationszeitraum bis
              </div>
              <div>{new Date(selectedArticle.allocationTo).toLocaleDateString('de-DE')}</div>
            </div>
          </div>
        </div>

        {/* Aggregated Metrics Card */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)',
            minHeight: '500px'
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
              Aggregierte Bestands- & Allokationskennzahlen
            </h3>
            <div className="flex gap-3">
              {/* Segmentation Toggle */}
              <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface-alt)' }}>
                <button
                  onClick={() => setChartSegmentation('aggregated')}
                  className="px-3 py-1.5 rounded transition-all"
                  style={{
                    backgroundColor: chartSegmentation === 'aggregated' ? 'var(--brand-primary)' : 'transparent',
                    color: chartSegmentation === 'aggregated' ? 'var(--text-inverse)' : 'var(--text-primary)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  Aggregiert
                </button>
                <button
                  onClick={() => setChartSegmentation('segmented')}
                  className="px-3 py-1.5 rounded transition-all"
                  style={{
                    backgroundColor: chartSegmentation === 'segmented' ? 'var(--brand-primary)' : 'transparent',
                    color: chartSegmentation === 'segmented' ? 'var(--text-inverse)' : 'var(--text-primary)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  Nach Größen segmentiert
                </button>
              </div>

              {/* Absolute/Relative Toggle - only visible when segmented */}
              {chartSegmentation === 'segmented' && (
                <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface-alt)' }}>
                  <button
                    onClick={() => setChartMode('absolute')}
                    className="px-3 py-1.5 rounded transition-all"
                    style={{
                      backgroundColor: chartMode === 'absolute' ? 'var(--brand-primary)' : 'transparent',
                      color: chartMode === 'absolute' ? 'var(--text-inverse)' : 'var(--text-primary)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    Absolut
                  </button>
                  <button
                    onClick={() => setChartMode('relative')}
                    className="px-3 py-1.5 rounded transition-all"
                    style={{
                      backgroundColor: chartMode === 'relative' ? 'var(--brand-primary)' : 'transparent',
                      color: chartMode === 'relative' ? 'var(--text-inverse)' : 'var(--text-primary)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    Relativ
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ width: '100%', height: '400px', minHeight: '400px' }}>
            <ResponsiveContainer width="100%" height="100%" minHeight={400}>
              {chartSegmentation === 'aggregated' ? (
                <BarChart 
                  data={aggregatedData} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis 
                    type="number" 
                    domain={xAxisDomain}
                    tickFormatter={(value) => Math.round(value).toString()}
                  />
                  <YAxis type="category" dataKey="name" width={180} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563eb" />
                </BarChart>
              ) : (
                <BarChart 
                  data={displaySegmentedData} 
                  layout="vertical" 
                  margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis 
                    type="number" 
                    domain={chartMode === 'relative' ? [0, 100] : xAxisDomain}
                    label={chartMode === 'relative' ? { value: '%', position: 'insideRight', offset: -10 } : undefined}
                    tickFormatter={(value) => chartMode === 'relative' ? `${Math.round(value)}%` : Math.round(value).toString()}
                  />
                  <YAxis type="category" dataKey="name" width={180} />
                  <Tooltip 
                    formatter={(value: number) => chartMode === 'relative' ? `${value.toFixed(2)}%` : value}
                  />
                  <Legend />
                  <Bar dataKey="36" stackId="a" fill="#1e3a8a" />
                  <Bar dataKey="37" stackId="a" fill="#1e40af" />
                  <Bar dataKey="38" stackId="a" fill="#1d4ed8" />
                  <Bar dataKey="39" stackId="a" fill="#2563eb" />
                  <Bar dataKey="40" stackId="a" fill="#3b82f6" />
                  <Bar dataKey="41" stackId="a" fill="#60a5fa" />
                  <Bar dataKey="42" stackId="a" fill="#93c5fd" />
                  <Bar dataKey="43" stackId="a" fill="#bfdbfe" />
                  <Bar dataKey="44" stackId="a" fill="#dbeafe" />
                  <Bar dataKey="45" stackId="a" fill="#eff6ff" />
                  <Bar dataKey="46" stackId="a" fill="#f0f9ff" />
                  <Bar dataKey="47" stackId="a" fill="#e0f2fe" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Store Allocation Table */}
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
              Allokation je Filiale
            </h3>
          </div>
          <DataGrid
            data={MOCK_STORES}
            columns={storeColumns}
            onRowClick={() => {}}
          />
        </div>

        {/* Size Detail Modal */}
        {showSizeModal && sizeModalData && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ backgroundColor: 'var(--bg-overlay)' }}
            onClick={() => setShowSizeModal(false)}
          >
            <div
              className="bg-white rounded-lg shadow-lg w-full max-w-2xl"
              style={{ boxShadow: 'var(--shadow-lg)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
                <div className="flex items-start justify-between">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)'
                    }}
                  >
                    Größenverteilung – {sizeModalData.title}
                  </h3>
                  <button
                    onClick={() => setShowSizeModal(false)}
                    className="p-1 hover:bg-surface-tint rounded"
                  >
                    <X size={20} style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="p-6">
                <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--surface-alt)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                          Größe
                        </th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                          Allokationsmenge
                        </th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                          Bedarf
                        </th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                          Bestand
                        </th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                          Sollbestand
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_SIZE_DETAILS.map((size, idx) => (
                        <tr
                          key={size.size}
                          style={{
                            borderBottom: idx < MOCK_SIZE_DETAILS.length - 1 ? '1px solid var(--border-subtle)' : 'none'
                          }}
                        >
                          <td style={{ padding: '12px 16px', fontWeight: 'var(--font-weight-medium)' }}>
                            {size.size}
                          </td>
                          <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                            {size.allocatedQuantity}
                          </td>
                          <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                            {size.demand}
                          </td>
                          <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                            {size.currentStock}
                          </td>
                          <td style={{ textAlign: 'right', padding: '12px 16px' }}>
                            {size.targetStock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t flex justify-end" style={{ borderColor: 'var(--border-default)' }}>
                <button
                  onClick={() => setShowSizeModal(false)}
                  className="px-4 py-2 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--button-secondary-bg)',
                    borderColor: 'var(--button-secondary-border)',
                    color: 'var(--button-secondary-text)'
                  }}
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Run Detail View (when runId but no selectedArticle)
  const articleColumns: Column<RunArticle>[] = [
    { 
      key: 'articleNumber', 
      label: 'Artikelnummer',
      sortable: true,
      width: '140px',
      render: (value) => (
        <code
          style={{
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'var(--font-family-mono)',
            backgroundColor: 'var(--surface-code-block)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          {value}
        </code>
      )
    },
    { 
      key: 'description', 
      label: 'Artikelbeschreibung',
      render: (value) => (
        <div
          style={{
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {value}
        </div>
      )
    },
    { 
      key: 'color', 
      label: 'Farbe',
      width: '120px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border"
            style={{
              backgroundColor: row.colorHex,
              borderColor: 'var(--border-default)'
            }}
          />
          <span>{value}</span>
        </div>
      )
    },
    { key: 'season', label: 'Saison' },
    { 
      key: 'allocationFrom', 
      label: 'Allokationszeitraum von',
      render: (value) => new Date(value as string).toLocaleDateString('de-DE')
    },
    { 
      key: 'allocationTo', 
      label: 'Allokationszeitraum bis',
      render: (value) => new Date(value as string).toLocaleDateString('de-DE')
    },
    { 
      key: 'storeCount', 
      label: 'Anzahl Filialen',
      align: 'right',
      sortable: true
    },
    { 
      key: 'totalQuantity', 
      label: 'Gesamtmenge allokiert',
      align: 'right',
      sortable: true,
      render: (value) => (
        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
          {value}
        </span>
      )
    },
    {
      key: 'capacityImpact',
      label: 'Kapazitätswirkung',
      align: 'center',
      width: '160px',
      render: (value) => {
        const Icon = CAPACITY_ICONS[value as CapacityImpact];
        return (
          <div className="flex items-center justify-center">
            <Icon size={18} style={{ color: CAPACITY_COLORS[value as CapacityImpact] }} />
          </div>
        );
      }
    },
    {
      key: 'hasExceptions',
      label: 'Exception-Status',
      align: 'center',
      render: (value) => value ? (
        <span
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--surface-warning-subtle)',
            color: 'var(--status-warning)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          Ausnahme
        </span>
      ) : (
        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-xs)' }}>-</span>
      )
    },
    {
      key: 'id',
      label: 'Aktion',
      align: 'center',
      width: '140px',
      render: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedArticle(row);
          }}
          className="px-3 py-1.5 rounded-lg border hover:bg-surface-tint transition-colors"
          style={{
            backgroundColor: 'var(--button-secondary-bg)',
            borderColor: 'var(--button-secondary-border)',
            color: 'var(--button-secondary-text)',
            fontSize: 'var(--font-size-xs)'
          }}
        >
          Details anzeigen
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        <button
          onClick={() => onNavigate('runs')}
          className="hover:underline"
        >
          Allokationsläufe
        </button>
        <span>›</span>
        <span>{runId}</span>
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
          Allokationslauf
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Übersicht aller Artikel und Ergebnisse dieses Allokationslaufs
        </p>
      </div>

      {/* Run Header Card */}
      {selectedRun && (
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div className="grid grid-cols-6 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Lauf-ID
              </div>
              <code
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontFamily: 'var(--font-family-mono)',
                  backgroundColor: 'var(--surface-code-block)',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {selectedRun.id}
              </code>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Typ
              </div>
              <span
                className="px-3 py-1 rounded-full inline-block"
                style={{
                  backgroundColor: selectedRun.type === 'initial' ? 'var(--surface-info-subtle)' : selectedRun.type === 'replenishment' ? 'var(--surface-success-subtle)' : 'var(--surface-warning-subtle)',
                  color: selectedRun.type === 'initial' ? 'var(--status-info)' : selectedRun.type === 'replenishment' ? 'var(--status-success)' : 'var(--status-warning)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                {RUN_TYPE_LABELS[selectedRun.type]}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Status
              </div>
              <span
                className="px-3 py-1 rounded-full inline-block"
                style={{
                  backgroundColor: 
                    selectedRun.status === 'Abgeschlossen' ? 'var(--status-success)' :
                    selectedRun.status === 'Läuft' ? 'var(--status-info)' :
                    selectedRun.status === 'Geplant' ? 'var(--status-warning)' :
                    'var(--status-danger)',
                  color: 'var(--text-inverse)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                {selectedRun.status}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Startdatum
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                {new Date(selectedRun.startDate).toLocaleString('de-DE')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Anzahl Artikel
              </div>
              <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-lg)' }}>
                {selectedRun.articleCount}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Anzahl Filialen
              </div>
              <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-lg)' }}>
                {selectedRun.storeCount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Article Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
            Allokierte Artikel
          </h3>
        </div>
        <DataGrid
          data={MOCK_ARTICLES}
          columns={articleColumns}
          onRowClick={(article) => setSelectedArticle(article)}
        />
      </div>
    </div>
  );
}