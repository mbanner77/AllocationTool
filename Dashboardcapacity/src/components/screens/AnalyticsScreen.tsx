import { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n';
import { DataGrid, Column } from '../common/DataGrid';
import { Filter, Download, Save, TrendingUp, TrendingDown } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface AnalyticsScreenProps {
  onNavigate: (screen: string) => void;
}

interface AnalyticsData {
  article: string;
  category: string;
  season: string;
  targetCapacity: number;
  actualCapacity: number;
  overCapacity: number;
  underCapacity: number;
  forecast: number;
  allocated: number;
  storeStock: number;
  warehouseStock: number;
  demand: number;
  sizeDeviation: number;
  exceptionCount: number;
}

// Mock data for capacity over time
const CAPACITY_OVER_TIME = [
  { month: 'Jan', target: 4500, actual: 4200, over: 0, under: 300 },
  { month: 'Feb', target: 4500, actual: 4800, over: 300, under: 0 },
  { month: 'Mär', target: 4800, actual: 4600, over: 0, under: 200 },
  { month: 'Apr', target: 5000, actual: 5300, over: 300, under: 0 },
  { month: 'Mai', target: 5000, actual: 4700, over: 0, under: 300 },
  { month: 'Jun', target: 4800, actual: 4900, over: 100, under: 0 },
  { month: 'Jul', target: 4500, actual: 4400, over: 0, under: 100 },
  { month: 'Aug', target: 4500, actual: 4600, over: 100, under: 0 },
  { month: 'Sep', target: 4800, actual: 5100, over: 300, under: 0 },
  { month: 'Okt', target: 5200, actual: 5000, over: 0, under: 200 },
  { month: 'Nov', target: 5500, actual: 5400, over: 0, under: 100 },
  { month: 'Dez', target: 5500, actual: 5600, over: 100, under: 0 }
];

// Mock data for capacity by category
const CAPACITY_BY_CATEGORY = [
  { category: 'Schuhe', deviation: 450, color: '#ef4444' },
  { category: 'Oberbekleidung', deviation: -280, color: '#3b82f6' },
  { category: 'Hosen', deviation: 120, color: '#ef4444' },
  { category: 'Accessoires', deviation: -150, color: '#3b82f6' },
  { category: 'Sport Equipment', deviation: 200, color: '#ef4444' },
  { category: 'Unterwäsche', deviation: -90, color: '#3b82f6' }
];

// Mock data for stock and demand
const STOCK_AND_DEMAND = [
  { month: 'Jan', storeStock: 2200, warehouseStock: 3500, demand: 4800 },
  { month: 'Feb', storeStock: 2400, warehouseStock: 3800, demand: 5200 },
  { month: 'Mär', storeStock: 2100, warehouseStock: 3200, demand: 4500 },
  { month: 'Apr', storeStock: 2600, warehouseStock: 4200, demand: 5800 },
  { month: 'Mai', storeStock: 2500, warehouseStock: 4000, demand: 5500 },
  { month: 'Jun', storeStock: 2300, warehouseStock: 3700, demand: 5000 }
];

// Mock data for forecast vs allocation
const FORECAST_VS_ALLOCATION = [
  { month: 'Jan', forecast: 4500, allocated: 4200, sales: 3900 },
  { month: 'Feb', forecast: 5000, allocated: 4800, sales: 4500 },
  { month: 'Mär', forecast: 4800, allocated: 4600, sales: 4300 },
  { month: 'Apr', forecast: 5500, allocated: 5300, sales: 5000 },
  { month: 'Mai', forecast: 5200, allocated: 4700, sales: 4400 },
  { month: 'Jun', forecast: 4900, allocated: 4900, sales: 4600 }
];

// Mock data for size curves
const SIZE_CURVES = [
  { size: '36', forecast: 8, allocated: 10, sales: 9 },
  { size: '37', forecast: 12, allocated: 13, sales: 12 },
  { size: '38', forecast: 18, allocated: 17, sales: 18 },
  { size: '39', forecast: 22, allocated: 20, sales: 21 },
  { size: '40', forecast: 20, allocated: 19, sales: 20 },
  { size: '41', forecast: 15, allocated: 14, sales: 13 },
  { size: '42', forecast: 12, allocated: 11, sales: 10 },
  { size: '43', forecast: 10, allocated: 9, sales: 8 },
  { size: '44', forecast: 8, allocated: 7, sales: 7 },
  { size: '45', forecast: 6, allocated: 5, sales: 5 },
  { size: '46', forecast: 4, allocated: 3, sales: 3 },
  { size: '47', forecast: 3, allocated: 2, sales: 2 }
];

// Mock table data
const ANALYTICS_TABLE_DATA: AnalyticsData[] = [
  {
    article: 'Running Schuhe Pro',
    category: 'Schuhe',
    season: 'FS25',
    targetCapacity: 450,
    actualCapacity: 520,
    overCapacity: 70,
    underCapacity: 0,
    forecast: 2400,
    allocated: 2200,
    storeStock: 850,
    warehouseStock: 1350,
    demand: 2100,
    sizeDeviation: 8.5,
    exceptionCount: 3
  },
  {
    article: 'Winter Jacke Premium',
    category: 'Oberbekleidung',
    season: 'HW25',
    targetCapacity: 380,
    actualCapacity: 340,
    overCapacity: 0,
    underCapacity: 40,
    forecast: 1800,
    allocated: 1650,
    storeStock: 620,
    warehouseStock: 1030,
    demand: 1750,
    sizeDeviation: 12.3,
    exceptionCount: 5
  },
  {
    article: 'Sport T-Shirt Basic',
    category: 'Oberbekleidung',
    season: 'FS25',
    targetCapacity: 280,
    actualCapacity: 290,
    overCapacity: 10,
    underCapacity: 0,
    forecast: 3200,
    allocated: 3150,
    storeStock: 1200,
    warehouseStock: 1950,
    demand: 3100,
    sizeDeviation: 3.2,
    exceptionCount: 0
  },
  {
    article: 'Jeans Slim Fit',
    category: 'Hosen',
    season: 'FS25',
    targetCapacity: 320,
    actualCapacity: 350,
    overCapacity: 30,
    underCapacity: 0,
    forecast: 1900,
    allocated: 1850,
    storeStock: 700,
    warehouseStock: 1150,
    demand: 1800,
    sizeDeviation: 5.7,
    exceptionCount: 2
  },
  {
    article: 'Rucksack Urban',
    category: 'Accessoires',
    season: 'FS25',
    targetCapacity: 180,
    actualCapacity: 160,
    overCapacity: 0,
    underCapacity: 20,
    forecast: 1200,
    allocated: 1100,
    storeStock: 420,
    warehouseStock: 680,
    demand: 1150,
    sizeDeviation: 0,
    exceptionCount: 1
  },
  {
    article: 'Fußball',
    category: 'Sport Equipment',
    season: 'FS25',
    targetCapacity: 220,
    actualCapacity: 260,
    overCapacity: 40,
    underCapacity: 0,
    forecast: 1500,
    allocated: 1450,
    storeStock: 550,
    warehouseStock: 900,
    demand: 1420,
    sizeDeviation: 0,
    exceptionCount: 0
  }
];

export function AnalyticsScreen({ onNavigate }: AnalyticsScreenProps) {
  const { t } = useLanguage();
  // Filter states
  const [filterSeason, setFilterSeason] = useState('all');
  const [filterProcess, setFilterProcess] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  
  // Chart states
  const [sizeCurveMode, setSizeCurveMode] = useState<'absolute' | 'percentage'>('absolute');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filtered data
  const filteredData = useMemo(() => {
    return ANALYTICS_TABLE_DATA.filter(item => {
      if (filterSeason !== 'all' && item.season !== filterSeason) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      return true;
    });
  }, [filterSeason, filterCategory]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalTarget = filteredData.reduce((sum, item) => sum + item.targetCapacity, 0);
    const totalActual = filteredData.reduce((sum, item) => sum + item.actualCapacity, 0);
    const totalOver = filteredData.reduce((sum, item) => sum + item.overCapacity, 0);
    const totalUnder = filteredData.reduce((sum, item) => sum + item.underCapacity, 0);
    const totalForecast = filteredData.reduce((sum, item) => sum + item.forecast, 0);
    const totalAllocated = filteredData.reduce((sum, item) => sum + item.allocated, 0);
    
    const utilization = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const forecastCoverage = totalForecast > 0 ? (totalAllocated / totalForecast) * 100 : 0;

    return {
      targetCapacity: totalTarget,
      utilization,
      overCapacity: totalOver,
      underCapacity: totalUnder,
      forecastCoverage
    };
  }, [filteredData]);

  // Size curve data with percentage calculation
  const sizeCurveData = useMemo(() => {
    if (sizeCurveMode === 'absolute') {
      return SIZE_CURVES;
    }
    
    const totalForecast = SIZE_CURVES.reduce((sum, s) => sum + s.forecast, 0);
    const totalAllocated = SIZE_CURVES.reduce((sum, s) => sum + s.allocated, 0);
    const totalSales = SIZE_CURVES.reduce((sum, s) => sum + s.sales, 0);
    
    return SIZE_CURVES.map(s => ({
      size: s.size,
      forecast: (s.forecast / totalForecast) * 100,
      allocated: (s.allocated / totalAllocated) * 100,
      sales: (s.sales / totalSales) * 100
    }));
  }, [sizeCurveMode]);

  const handleExport = () => {
    alert('Export-Funktionalität: CSV/Excel-Download würde hier ausgeführt');
  };

  const handleSaveView = () => {
    alert('Ansicht speichern: Die aktuelle Filtereinstellung würde gespeichert');
  };

  const tableColumns: Column<AnalyticsData>[] = [
    { 
      key: 'article', 
      label: 'Artikel',
      sortable: true,
      render: (value) => (
        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{value}</span>
      )
    },
    { key: 'category', label: 'Kategorie', sortable: true },
    { key: 'season', label: 'Saison', sortable: true },
    { 
      key: 'targetCapacity', 
      label: 'SOLL-Kapazität (m²)',
      align: 'right',
      sortable: true
    },
    { 
      key: 'actualCapacity', 
      label: 'IST-Kapazität (m²)',
      align: 'right',
      sortable: true,
      render: (value, row) => (
        <span style={{ 
          fontWeight: 'var(--font-weight-semibold)',
          color: row.overCapacity > 0 ? '#ef4444' : row.underCapacity > 0 ? '#3b82f6' : 'inherit'
        }}>
          {value}
        </span>
      )
    },
    { 
      key: 'overCapacity', 
      label: 'Überdeckung (m²)',
      align: 'right',
      sortable: true,
      render: (value) => value > 0 ? (
        <span style={{ color: '#ef4444', fontWeight: 'var(--font-weight-medium)' }}>
          +{value}
        </span>
      ) : '-'
    },
    { 
      key: 'underCapacity', 
      label: 'Unterdeckung (m²)',
      align: 'right',
      sortable: true,
      render: (value) => value > 0 ? (
        <span style={{ color: '#3b82f6', fontWeight: 'var(--font-weight-medium)' }}>
          -{value}
        </span>
      ) : '-'
    },
    { 
      key: 'forecast', 
      label: 'Prognosemenge',
      align: 'right',
      sortable: true
    },
    { 
      key: 'allocated', 
      label: 'Allokierte Menge',
      align: 'right',
      sortable: true,
      render: (value) => (
        <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{value}</span>
      )
    },
    { 
      key: 'storeStock', 
      label: 'Filialbestand',
      align: 'right',
      sortable: true
    },
    { 
      key: 'warehouseStock', 
      label: 'VZ-Bestand',
      align: 'right',
      sortable: true
    },
    { 
      key: 'demand', 
      label: 'Bedarf',
      align: 'right',
      sortable: true
    },
    { 
      key: 'sizeDeviation', 
      label: 'Größenabweichung (%)',
      align: 'right',
      sortable: true,
      render: (value) => value > 0 ? `${value}%` : '-'
    },
    { 
      key: 'exceptionCount', 
      label: 'Exception-Anzahl',
      align: 'right',
      sortable: true,
      render: (value) => value > 0 ? (
        <span
          className="px-2 py-1 rounded-full"
          style={{
            backgroundColor: 'var(--surface-warning-subtle)',
            color: 'var(--status-warning)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {value}
        </span>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>-</span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        <span>Analytics</span>
        <span>›</span>
        <span>Allocation & Capacity</span>
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
          Allocation & Capacity Analytics
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Zentrale Analyse von Prognose, Kapazität, Bedarf, Beständen und Allokationsergebnissen über Zeit, Artikelhierarchie und Stores.
        </p>
      </div>

      {/* Filter Bar */}
      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 grid grid-cols-5 gap-4">
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Zeitraum von
              </label>
              <input
                type="date"
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
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Zeitraum bis
              </label>
              <input
                type="date"
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
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Saison
              </label>
              <select
                value={filterSeason}
                onChange={(e) => setFilterSeason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--surface-page)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <option value="all">Alle Saisons</option>
                <option value="FS25">Frühjahr/Sommer 2025</option>
                <option value="HW25">Herbst/Winter 2025</option>
                <option value="FS26">Frühjahr/Sommer 2026</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Prozess
              </label>
              <select
                value={filterProcess}
                onChange={(e) => setFilterProcess(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--surface-page)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <option value="all">Alle Prozesse</option>
                <option value="initial">Initiale Allokation</option>
                <option value="replenishment">Nachschub</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Kategorie
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-default)',
                  backgroundColor: 'var(--surface-page)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                <option value="all">Alle Kategorien</option>
                <option value="Schuhe">Schuhe</option>
                <option value="Oberbekleidung">Oberbekleidung</option>
                <option value="Hosen">Hosen</option>
                <option value="Accessoires">Accessoires</option>
                <option value="Sport Equipment">Sport Equipment</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 rounded-lg border flex items-center gap-2 hover:bg-surface-tint transition-colors"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--button-secondary-border)',
                color: 'var(--button-secondary-text)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={handleSaveView}
              className="px-4 py-2 rounded-lg border flex items-center gap-2 hover:bg-surface-tint transition-colors"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--button-secondary-border)',
                color: 'var(--button-secondary-text)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <Save size={16} />
              Ansicht speichern
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        {/* SOLL-Kapazität */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
            SOLL-Kapazität
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
            {kpis.targetCapacity.toLocaleString('de-DE')} m²
          </div>
        </div>

        {/* IST-Kapazitätsauslastung */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
            IST-Kapazitätsauslastung
          </div>
          <div 
            style={{ 
              fontSize: 'var(--font-size-2xl)', 
              fontWeight: 'var(--font-weight-bold)',
              color: kpis.utilization > 105 ? '#ef4444' : kpis.utilization < 95 ? '#3b82f6' : '#10b981'
            }}
          >
            {kpis.utilization.toFixed(1)}%
          </div>
        </div>

        {/* Überdeckung gesamt */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Überdeckung gesamt
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: '#ef4444' }}>
            +{kpis.overCapacity} m²
          </div>
        </div>

        {/* Unterdeckung gesamt */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Unterdeckung gesamt
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: '#3b82f6' }}>
            -{kpis.underCapacity} m²
          </div>
        </div>

        {/* Prognoseabdeckung */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Prognoseabdeckung
          </div>
          <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
            {kpis.forecastCoverage.toFixed(1)}%
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
            Allokiert vs. Forecast
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Chart 1: Capacity Over Time */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '16px' }}>
            Kapazität SOLL vs. IST über Zeit
          </h3>
          <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
            <AreaChart data={CAPACITY_OVER_TIME}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" style={{ fontSize: 'var(--font-size-xs)' }} />
              <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="over" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Überkapazität" />
              <Area type="monotone" dataKey="under" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Untererfüllung" />
              <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeDasharray="5 5" strokeWidth={2} name="SOLL" dot={false} />
              <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} name="IST" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Capacity by Category */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '16px' }}>
            Über-/Unterdeckung nach Kategorie
          </h3>
          <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
            <BarChart data={CAPACITY_BY_CATEGORY} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis type="number" style={{ fontSize: 'var(--font-size-xs)' }} />
              <YAxis type="category" dataKey="category" width={120} style={{ fontSize: 'var(--font-size-xs)' }} />
              <Tooltip />
              <ReferenceLine x={0} stroke="#94a3b8" strokeWidth={2} />
              <Bar 
                dataKey="deviation" 
                onClick={(data) => setSelectedCategory(data.category)}
                cursor="pointer"
              >
                {CAPACITY_BY_CATEGORY.map((entry, index) => (
                  <Bar key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Chart 3: Stock and Demand */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '16px' }}>
            Bestände & Bedarf
          </h3>
          <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
            <BarChart data={STOCK_AND_DEMAND}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" style={{ fontSize: 'var(--font-size-xs)' }} />
              <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="storeStock" stackId="a" fill="#3b82f6" name="Filialbestand" />
              <Bar dataKey="warehouseStock" stackId="a" fill="#60a5fa" name="VZ-Bestand" />
              <Line type="monotone" dataKey="demand" stroke="#ef4444" strokeWidth={2} name="Bedarf" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 4: Forecast vs Allocation */}
        <div
          className="p-6 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)'
          }}
        >
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '16px' }}>
            Prognose vs. Allokation
          </h3>
          <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
            <BarChart data={FORECAST_VS_ALLOCATION}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="month" style={{ fontSize: 'var(--font-size-xs)' }} />
              <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="forecast" fill="#94a3b8" name="Prognose" />
              <Bar dataKey="allocated" fill="#2563eb" name="Allokiert" />
              <Bar dataKey="sales" fill="#10b981" name="Abverkauf" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 5: Size Curves (Full Width) */}
      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
            Größenkurven
          </h3>
          <div className="flex gap-2 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface-alt)' }}>
            <button
              onClick={() => setSizeCurveMode('absolute')}
              className="px-3 py-1.5 rounded transition-all"
              style={{
                backgroundColor: sizeCurveMode === 'absolute' ? 'var(--brand-primary)' : 'transparent',
                color: sizeCurveMode === 'absolute' ? 'var(--text-inverse)' : 'var(--text-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Absolut
            </button>
            <button
              onClick={() => setSizeCurveMode('percentage')}
              className="px-3 py-1.5 rounded transition-all"
              style={{
                backgroundColor: sizeCurveMode === 'percentage' ? 'var(--brand-primary)' : 'transparent',
                color: sizeCurveMode === 'percentage' ? 'var(--text-inverse)' : 'var(--text-primary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Prozentual
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0}>
          <LineChart data={sizeCurveData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="size" style={{ fontSize: 'var(--font-size-xs)' }} />
            <YAxis style={{ fontSize: 'var(--font-size-xs)' }} unit={sizeCurveMode === 'percentage' ? '%' : ''} />
            <Tooltip formatter={(value: number) => sizeCurveMode === 'percentage' ? `${value.toFixed(1)}%` : value} />
            <Legend />
            <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={2} name="Prognose" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="allocated" stroke="#2563eb" strokeWidth={2} name="Allokiert" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} name="Abverkauf" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Detail Table */}
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
            Detailanalyse
            {selectedCategory && (
              <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginLeft: '8px' }}>
                (gefiltert nach: {selectedCategory})
              </span>
            )}
          </h3>
        </div>
        <DataGrid
          data={selectedCategory ? filteredData.filter(d => d.category === selectedCategory) : filteredData}
          columns={tableColumns}
          onRowClick={() => {}}
        />
      </div>
    </div>
  );
}