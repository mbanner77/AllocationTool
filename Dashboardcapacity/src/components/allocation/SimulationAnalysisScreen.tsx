import { useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Save, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Info,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { KPICard } from './KPICard';
import { DataGrid, Column } from '../common/DataGrid';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts';

interface SimulationResult {
  id: string;
  store: string;
  cluster: string;
  product: string;
  productGroup: string;
  demand: number;
  allocated: number;
  forecast: number;
  spaceDemand: number;
  spaceAvailable: number;
  inFallback: boolean;
  rationingApplied: boolean;
  minFillMet: boolean;
  exception?: string;
}

const MOCK_SIMULATION_RESULTS: SimulationResult[] = [
  {
    id: '1',
    store: 'Zürich HB',
    cluster: 'Urban Premium',
    product: 'Running Shoes Pro',
    productGroup: 'Shoes',
    demand: 150,
    allocated: 127,
    forecast: 120,
    spaceDemand: 52.5,
    spaceAvailable: 70,
    inFallback: false,
    rationingApplied: true,
    minFillMet: true
  },
  {
    id: '2',
    store: 'Basel SBB',
    cluster: 'Urban Standard',
    product: 'Running Shoes Pro',
    productGroup: 'Shoes',
    demand: 120,
    allocated: 102,
    forecast: 95,
    spaceDemand: 42.0,
    spaceAvailable: 50,
    inFallback: false,
    rationingApplied: true,
    minFillMet: true
  },
  {
    id: '3',
    store: 'Genf',
    cluster: 'Urban Premium',
    product: 'Running Shoes Pro',
    productGroup: 'Shoes',
    demand: 165,
    allocated: 140,
    forecast: 135,
    spaceDemand: 57.8,
    spaceAvailable: 80,
    inFallback: false,
    rationingApplied: true,
    minFillMet: true
  },
  {
    id: '4',
    store: 'Bern Bahnhof',
    cluster: 'Regional',
    product: 'Running Shoes Pro',
    productGroup: 'Shoes',
    demand: 85,
    allocated: 48,
    forecast: 70,
    spaceDemand: 35.0,
    spaceAvailable: 25,
    inFallback: true,
    rationingApplied: true,
    minFillMet: false,
    exception: 'Capacity Limit'
  },
  {
    id: '5',
    store: 'Luzern',
    cluster: 'Regional',
    product: 'Running Shoes Pro',
    productGroup: 'Shoes',
    demand: 95,
    allocated: 81,
    forecast: 80,
    spaceDemand: 33.3,
    spaceAvailable: 45,
    inFallback: false,
    rationingApplied: true,
    minFillMet: true
  },
  {
    id: '6',
    store: 'Zürich HB',
    cluster: 'Urban Premium',
    product: 'Winter Jacket',
    productGroup: 'Apparel',
    demand: 200,
    allocated: 170,
    forecast: 165,
    spaceDemand: 85.0,
    spaceAvailable: 95,
    inFallback: false,
    rationingApplied: true,
    minFillMet: true
  },
  {
    id: '7',
    store: 'Basel SBB',
    cluster: 'Urban Standard',
    product: 'Winter Jacket',
    productGroup: 'Apparel',
    demand: 160,
    allocated: 136,
    forecast: 130,
    spaceDemand: 68.0,
    spaceAvailable: 75,
    inFallback: false,
    rationingApplied: true,
    minFillMet: true
  },
  {
    id: '8',
    store: 'Genf',
    cluster: 'Urban Premium',
    product: 'Winter Jacket',
    productGroup: 'Apparel',
    demand: 220,
    allocated: 187,
    forecast: 180,
    spaceDemand: 93.5,
    spaceAvailable: 105,
    inFallback: false,
    rationingApplied: true,
    minFillMet: true
  },
  {
    id: '9',
    store: 'Bern Bahnhof',
    cluster: 'Regional',
    product: 'Winter Jacket',
    productGroup: 'Apparel',
    demand: 110,
    allocated: 65,
    forecast: 90,
    spaceDemand: 55.0,
    spaceAvailable: 40,
    inFallback: true,
    rationingApplied: true,
    minFillMet: false,
    exception: 'Capacity Limit'
  },
  {
    id: '10',
    store: 'Luzern',
    cluster: 'Regional',
    product: 'Winter Jacket',
    productGroup: 'Apparel',
    demand: 125,
    allocated: 106,
    forecast: 100,
    spaceDemand: 50.0,
    spaceAvailable: 60,
    inFallback: false,
    rationingApplied: true,
    minFillMet: true
  },
  {
    id: '11',
    store: 'St. Gallen',
    cluster: 'Regional',
    product: 'Hiking Boots',
    productGroup: 'Shoes',
    demand: 75,
    allocated: 42,
    forecast: 60,
    spaceDemand: 31.5,
    spaceAvailable: 22,
    inFallback: true,
    rationingApplied: true,
    minFillMet: false,
    exception: 'Capacity Limit'
  },
  {
    id: '12',
    store: 'Lausanne',
    cluster: 'Urban Standard',
    product: 'Hiking Boots',
    productGroup: 'Shoes',
    demand: 105,
    allocated: 89,
    forecast: 85,
    spaceDemand: 42.0,
    spaceAvailable: 55,
    inFallback: false,
    rationingApplied: true,
    minFillMet: true
  }
];

interface SimulationAnalysisScreenProps {
  variantName: string;
  onBack: () => void;
  onSaveVariant: () => void;
  onNavigateToExplainability: () => void;
}

export function SimulationAnalysisScreen({
  variantName,
  onBack,
  onSaveVariant,
  onNavigateToExplainability
}: SimulationAnalysisScreenProps) {
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'completed'>('completed');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'exceptions' | 'fallback'>('overview');
  const [filterCluster, setFilterCluster] = useState<string>('');
  const [filterProductGroup, setFilterProductGroup] = useState<string>('');

  // Calculate KPIs
  const totalDemand = MOCK_SIMULATION_RESULTS.reduce((sum, r) => sum + r.demand, 0);
  const totalAllocated = MOCK_SIMULATION_RESULTS.reduce((sum, r) => sum + r.allocated, 0);
  const totalForecast = MOCK_SIMULATION_RESULTS.reduce((sum, r) => sum + r.forecast, 0);
  const supplyCoverage = (totalAllocated / totalDemand) * 100;
  const forecastFulfillment = (totalAllocated / totalForecast) * 100;
  const storesInFallback = MOCK_SIMULATION_RESULTS.filter(r => r.inFallback).length;
  const minFillFulfillment = (MOCK_SIMULATION_RESULTS.filter(r => r.minFillMet).length / MOCK_SIMULATION_RESULTS.length) * 100;
  const exceptionsCount = MOCK_SIMULATION_RESULTS.filter(r => r.exception).length;

  // Chart data
  const clusterData = Object.entries(
    MOCK_SIMULATION_RESULTS.reduce((acc, r) => {
      if (!acc[r.cluster]) {
        acc[r.cluster] = { demand: 0, allocated: 0, forecast: 0 };
      }
      acc[r.cluster].demand += r.demand;
      acc[r.cluster].allocated += r.allocated;
      acc[r.cluster].forecast += r.forecast;
      return acc;
    }, {} as Record<string, { demand: number; allocated: number; forecast: number }>)
  ).map(([cluster, data]) => ({
    cluster,
    demand: data.demand,
    allocated: data.allocated,
    forecast: data.forecast,
    coverage: (data.allocated / data.demand) * 100
  }));

  const productGroupData = Object.entries(
    MOCK_SIMULATION_RESULTS.reduce((acc, r) => {
      if (!acc[r.productGroup]) {
        acc[r.productGroup] = { demand: 0, allocated: 0 };
      }
      acc[r.productGroup].demand += r.demand;
      acc[r.productGroup].allocated += r.allocated;
      return acc;
    }, {} as Record<string, { demand: number; allocated: number }>)
  ).map(([productGroup, data]) => ({
    productGroup,
    demand: data.demand,
    allocated: data.allocated,
    coverage: (data.allocated / data.demand) * 100
  }));

  // Scatter data for capacity analysis
  const capacityScatterData = MOCK_SIMULATION_RESULTS.map(r => ({
    spaceDemand: r.spaceDemand,
    spaceAvailable: r.spaceAvailable,
    allocated: r.allocated,
    store: r.store,
    inFallback: r.inFallback
  }));

  // Filtered results
  const filteredResults = MOCK_SIMULATION_RESULTS.filter(r => {
    if (filterCluster && r.cluster !== filterCluster) return false;
    if (filterProductGroup && r.productGroup !== filterProductGroup) return false;
    return true;
  });

  const columns: Column<SimulationResult>[] = [
    { key: 'store', label: 'Filiale', sortable: true },
    { key: 'cluster', label: 'Cluster', sortable: true },
    { key: 'product', label: 'Produkt', sortable: true },
    { key: 'productGroup', label: 'Produktgruppe', sortable: true },
    { 
      key: 'demand', 
      label: 'Bedarf',
      align: 'right',
      sortable: true,
      render: (value) => (value as number).toLocaleString('de-CH')
    },
    { 
      key: 'allocated', 
      label: 'Allokiert',
      align: 'right',
      sortable: true,
      render: (value, row) => {
        const coverage = (value as number / row.demand) * 100;
        return (
          <div className="flex items-center gap-2 justify-end">
            <span>{(value as number).toLocaleString('de-CH')}</span>
            <span
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: coverage >= 90 ? 'var(--surface-success-subtle)' : coverage >= 75 ? 'var(--surface-warning-subtle)' : 'var(--surface-danger-subtle)',
                color: coverage >= 90 ? 'var(--status-success)' : coverage >= 75 ? 'var(--status-warning)' : 'var(--status-danger)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {coverage.toFixed(0)}%
            </span>
          </div>
        );
      }
    },
    { 
      key: 'forecast', 
      label: 'Prognose',
      align: 'right',
      sortable: true,
      render: (value) => (value as number).toLocaleString('de-CH')
    },
    {
      key: 'spaceDemand',
      label: 'Raumbedarf',
      align: 'right',
      sortable: true,
      render: (value) => `${(value as number).toFixed(1)} m²`
    },
    {
      key: 'spaceAvailable',
      label: 'Kapazität',
      align: 'right',
      sortable: true,
      render: (value, row) => {
        const utilization = (row.spaceDemand / (value as number)) * 100;
        return (
          <div className="flex items-center gap-2 justify-end">
            <span>{(value as number).toFixed(1)} m²</span>
            {utilization > 100 && (
              <AlertTriangle size={16} style={{ color: 'var(--status-danger)' }} />
            )}
          </div>
        );
      }
    },
    {
      key: 'inFallback',
      label: 'Status',
      render: (value, row) => (
        <div className="flex flex-wrap gap-1">
          {value && (
            <span
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--surface-warning-subtle)',
                color: 'var(--status-warning)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Fallback
            </span>
          )}
          {row.rationingApplied && (
            <span
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--surface-info-subtle)',
                color: 'var(--status-info)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Rationiert
            </span>
          )}
          {!row.minFillMet && (
            <span
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--surface-danger-subtle)',
                color: 'var(--status-danger)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              MinFill ✗
            </span>
          )}
          {row.exception && (
            <span
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--surface-danger-subtle)',
                color: 'var(--status-danger)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {row.exception}
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className="p-6 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-surface-tint"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: '4px'
                }}
              >
                Simulationsanalyse: {variantName}
              </h1>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                Analysiere die Allokationsergebnisse und speichere die Variante
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {simulationStatus === 'completed' && (
              <>
                <button
                  onClick={onNavigateToExplainability}
                  className="px-4 py-2 rounded-lg border flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--button-secondary-bg)',
                    borderColor: 'var(--button-secondary-border)',
                    color: 'var(--button-secondary-text)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <Eye size={16} />
                  Explainability
                </button>
                <button
                  className="px-4 py-2 rounded-lg border flex items-center gap-2"
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
                  onClick={onSaveVariant}
                  className="px-4 py-2 rounded-lg flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  <Save size={16} />
                  Variante speichern
                </button>
              </>
            )}
            {simulationStatus === 'idle' && (
              <button
                onClick={() => setSimulationStatus('running')}
                className="px-4 py-2 rounded-lg flex items-center gap-2"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--text-inverse)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                <Play size={16} />
                Simulation starten
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {simulationStatus === 'completed' && (
          <>
            {/* Status Banner */}
            <div
              className="mb-6 p-4 rounded-lg border flex items-start gap-3"
              style={{
                backgroundColor: exceptionsCount > 0 ? 'var(--surface-warning-subtle)' : 'var(--surface-success-subtle)',
                borderColor: exceptionsCount > 0 ? 'var(--status-warning)' : 'var(--status-success)'
              }}
            >
              {exceptionsCount > 0 ? (
                <AlertTriangle size={24} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />
              ) : (
                <CheckCircle size={24} style={{ color: 'var(--status-success)', flexShrink: 0 }} />
              )}
              <div className="flex-1">
                <div
                  style={{
                    fontSize: 'var(--font-size-md)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: '4px',
                    color: exceptionsCount > 0 ? 'var(--status-warning)' : 'var(--status-success)'
                  }}
                >
                  {exceptionsCount > 0 ? 'Simulation mit Warnungen abgeschlossen' : 'Simulation erfolgreich abgeschlossen'}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  {exceptionsCount > 0 
                    ? `${exceptionsCount} Ausnahmen erkannt - Fallback in ${storesInFallback} Filialen aktiv`
                    : 'Alle Allokationen erfolgreich berechnet'}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KPICard
                title="Supply Coverage"
                value={supplyCoverage.toFixed(1)}
                unit="%"
                delta={-6.9}
                deltaLabel="vs baseline"
                state={supplyCoverage >= 90 ? 'success' : 'warning'}
                formula="Coverage = (Allocated / Demand) × 100%"
                formulaInputs={[
                  { symbol: 'Allocated', value: totalAllocated, source: 'Simulation' },
                  { symbol: 'Demand', value: totalDemand, source: 'Bedarfsberechnung' }
                ]}
              />
              <KPICard
                title="Forecast Fulfillment"
                value={forecastFulfillment.toFixed(1)}
                unit="%"
                delta={6.9}
                deltaLabel="vs baseline"
                state={forecastFulfillment >= 90 ? 'success' : 'warning'}
                formula="FF = (Allocated / Forecast) × 100%"
                formulaInputs={[
                  { symbol: 'Allocated', value: totalAllocated, source: 'Simulation' },
                  { symbol: 'Forecast', value: totalForecast, source: 'Prognosesystem' }
                ]}
              />
              <KPICard
                title="Stores in Fallback"
                value={storesInFallback}
                state={storesInFallback > 0 ? 'warning' : 'success'}
              />
              <KPICard
                title="MinFill Fulfillment"
                value={minFillFulfillment.toFixed(1)}
                unit="%"
                state={minFillFulfillment >= 90 ? 'success' : 'warning'}
                formula="MF = (Stores_MinFill_Met / Total_Stores) × 100%"
                formulaInputs={[
                  { symbol: 'Stores_MinFill_Met', value: MOCK_SIMULATION_RESULTS.filter(r => r.minFillMet).length, source: 'Simulation' },
                  { symbol: 'Total_Stores', value: MOCK_SIMULATION_RESULTS.length, source: 'Simulation' }
                ]}
              />
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <KPICard
                title="Exception Count"
                value={exceptionsCount}
                state={exceptionsCount < 5 ? 'success' : 'warning'}
              />
              <KPICard
                title="Total Demand"
                value={totalDemand.toLocaleString('de-CH')}
                unit="Einheiten"
                state="neutral"
              />
              <KPICard
                title="Total Allocated"
                value={totalAllocated.toLocaleString('de-CH')}
                unit="Einheiten"
                state="neutral"
              />
              <KPICard
                title="Undercoverage"
                value={(totalDemand - totalAllocated).toLocaleString('de-CH')}
                unit="Einheiten"
                state="warning"
              />
            </div>

            {/* Tabs */}
            <div className="border rounded-lg mb-6" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex border-b" style={{ borderColor: 'var(--border-default)' }}>
                {[
                  { id: 'overview', label: 'Übersicht' },
                  { id: 'details', label: 'Details' },
                  { id: 'exceptions', label: `Ausnahmen (${exceptionsCount})` },
                  { id: 'fallback', label: `Fallback (${storesInFallback})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className="px-4 py-3 border-b-2"
                    style={{
                      borderColor: selectedTab === tab.id ? 'var(--brand-primary)' : 'transparent',
                      color: selectedTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: selectedTab === tab.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {selectedTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Coverage by Cluster */}
                    <div>
                      <h3
                        style={{
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          marginBottom: 'var(--space-4)'
                        }}
                      >
                        Coverage nach Cluster
                      </h3>
                      <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                          <BarChart data={clusterData}>
                            <XAxis dataKey="cluster" style={{ fontSize: 'var(--font-size-xs)' }} />
                            <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="demand" fill="var(--text-muted)" name="Bedarf" opacity={0.4} />
                            <Bar dataKey="allocated" fill="var(--brand-primary)" name="Allokiert" />
                            <Bar dataKey="forecast" fill="var(--brand-accent)" name="Prognose" opacity={0.6} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Coverage by Product Group */}
                    <div>
                      <h3
                        style={{
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          marginBottom: 'var(--space-4)'
                        }}
                      >
                        Coverage nach Produktgruppe
                      </h3>
                      <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                          <BarChart data={productGroupData} layout="vertical">
                            <XAxis type="number" style={{ fontSize: 'var(--font-size-xs)' }} />
                            <YAxis dataKey="productGroup" type="category" style={{ fontSize: 'var(--font-size-xs)' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="demand" fill="var(--text-muted)" name="Bedarf" opacity={0.4} />
                            <Bar dataKey="allocated" fill="var(--brand-primary)" name="Allokiert" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Capacity Analysis Scatter */}
                    <div>
                      <h3
                        style={{
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          marginBottom: 'var(--space-4)'
                        }}
                      >
                        Kapazitätsanalyse (Raumbedarf vs. Verfügbare Kapazität)
                      </h3>
                      <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={350}>
                          <ScatterChart>
                            <XAxis 
                              dataKey="spaceDemand" 
                              name="Raumbedarf" 
                              unit=" m²"
                              style={{ fontSize: 'var(--font-size-xs)' }}
                            />
                            <YAxis 
                              dataKey="spaceAvailable" 
                              name="Verfügbare Kapazität" 
                              unit=" m²"
                              style={{ fontSize: 'var(--font-size-xs)' }}
                            />
                            <ZAxis dataKey="allocated" range={[50, 400]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Legend />
                            <Scatter 
                              name="Ohne Fallback" 
                              data={capacityScatterData.filter(d => !d.inFallback)} 
                              fill="var(--brand-primary)" 
                            />
                            <Scatter 
                              name="Mit Fallback" 
                              data={capacityScatterData.filter(d => d.inFallback)} 
                              fill="var(--status-warning)" 
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                      <div
                        className="mt-3 p-3 rounded-lg flex items-start gap-2"
                        style={{
                          backgroundColor: 'var(--surface-info-subtle)',
                          border: '1px solid var(--border-info)'
                        }}
                      >
                        <Info size={16} style={{ color: 'var(--status-info)', flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                          Punkte oberhalb der Diagonalen haben ausreichend Kapazität. Punkte unterhalb der Diagonalen sind kapazitätslimitiert und zeigen Fallback-Kandidaten.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'details' && (
                  <div>
                    {/* Filters */}
                    <div className="flex gap-3 mb-4">
                      <div className="flex-1">
                        <select
                          value={filterCluster}
                          onChange={(e) => setFilterCluster(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border"
                          style={{
                            borderColor: 'var(--border-input)',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        >
                          <option value="">Alle Cluster</option>
                          <option value="Urban Premium">Urban Premium</option>
                          <option value="Urban Standard">Urban Standard</option>
                          <option value="Regional">Regional</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <select
                          value={filterProductGroup}
                          onChange={(e) => setFilterProductGroup(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border"
                          style={{
                            borderColor: 'var(--border-input)',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        >
                          <option value="">Alle Produktgruppen</option>
                          <option value="Shoes">Shoes</option>
                          <option value="Apparel">Apparel</option>
                          <option value="Accessories">Accessories</option>
                        </select>
                      </div>
                    </div>

                    {/* Data Grid */}
                    <DataGrid
                      columns={columns}
                      data={filteredResults}
                      density="comfortable"
                    />
                  </div>
                )}

                {selectedTab === 'exceptions' && (
                  <div>
                    <DataGrid
                      columns={columns}
                      data={MOCK_SIMULATION_RESULTS.filter(r => r.exception)}
                      density="comfortable"
                    />
                  </div>
                )}

                {selectedTab === 'fallback' && (
                  <div>
                    <div
                      className="mb-4 p-4 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--surface-warning-subtle)',
                        borderColor: 'var(--status-warning)'
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--status-warning)',
                          marginBottom: 'var(--space-2)'
                        }}
                      >
                        Fallback-Strategie: Core/NOS Substitution
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        In {storesInFallback} Filialen konnte die geplante Produktgruppe aufgrund von Kapazitätsengpässen nicht vollständig allokiert werden. 
                        Stattdessen wurden effizientere Core/NOS-Artikel als Ersatz zugeteilt.
                      </div>
                      <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'var(--surface-page)' }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Effizienz-Verbesserung:
                        </div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--status-success)' }}>
                          +12.5%
                        </div>
                      </div>
                    </div>

                    <DataGrid
                      columns={columns}
                      data={MOCK_SIMULATION_RESULTS.filter(r => r.inFallback)}
                      density="comfortable"
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {simulationStatus === 'running' && (
          <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <div
                className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4"
                style={{
                  borderColor: 'var(--border-default)',
                  borderTopColor: 'var(--brand-primary)'
                }}
              />
              <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '8px' }}>
                Simulation läuft...
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                Berechne Allokation für 245 Filialen
              </div>
            </div>
          </div>
        )}

        {simulationStatus === 'idle' && (
          <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <Play size={48} style={{ color: 'var(--brand-primary)', margin: '0 auto 16px' }} />
              <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '8px' }}>
                Bereit zur Simulation
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: '24px' }}>
                Klicken Sie auf "Simulation starten" um die Allokation zu berechnen
              </div>
              <button
                onClick={() => setSimulationStatus('running')}
                className="px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--text-inverse)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                <Play size={20} />
                Simulation starten
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}