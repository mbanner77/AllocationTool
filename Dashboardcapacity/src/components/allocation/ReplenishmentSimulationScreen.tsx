import { useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Save, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  Download,
  Eye,
  Info
} from 'lucide-react';
import { KPICard } from './KPICard';
import { DataGrid, Column } from '../common/DataGrid';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { REPLENISHMENT_SKUS, REPLENISHMENT_STORE_ALLOCATIONS, REPLENISHMENT_KPI_DATA, ReplenishmentSKU, ReplenishmentStoreAllocation } from './ReplenishmentData';

interface ReplenishmentSimulationScreenProps {
  variantName: string;
  onBack: () => void;
  onSaveVariant: () => void;
  onNavigateToExplainability: () => void;
}

export function ReplenishmentSimulationScreen({
  variantName,
  onBack,
  onSaveVariant,
  onNavigateToExplainability
}: ReplenishmentSimulationScreenProps) {
  const [simulationStatus, setSimulationStatus] = useState<'idle' | 'running' | 'completed'>('completed');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details' | 'stockout' | 'substitution'>('overview');
  const [filterSKU, setFilterSKU] = useState<string>('');

  const kpi = REPLENISHMENT_KPI_DATA;

  // Chart data - Coverage by SKU
  const skuChartData = REPLENISHMENT_SKUS.map(sku => ({
    sku: sku.articleColor.split(' - ')[0],
    need: sku.replenishmentNeed,
    allocated: sku.allocated,
    coverage: (sku.allocated / sku.replenishmentNeed) * 100
  }));

  // DOS Scatter data
  const dosScatterData = REPLENISHMENT_STORE_ALLOCATIONS.map(alloc => ({
    expectedDOS: alloc.expectedDOS,
    coverage: alloc.coverage,
    allocated: alloc.allocationFinal,
    store: alloc.storeName,
    stockoutRisk: alloc.expectedDOS < 14
  }));

  // Filtered data
  const filteredStoreAllocations = REPLENISHMENT_STORE_ALLOCATIONS.filter(alloc => {
    if (filterSKU && alloc.sku !== filterSKU) return false;
    return true;
  });

  const storeColumns: Column<ReplenishmentStoreAllocation>[] = [
    { key: 'storeName', label: 'Filiale', sortable: true },
    { key: 'cluster', label: 'Cluster', sortable: true },
    { 
      key: 'forecastSales', 
      label: 'Forecast (4W)',
      align: 'right',
      sortable: true,
      render: (value) => (value as number).toLocaleString('de-CH')
    },
    { 
      key: 'avgDailyForecast', 
      label: 'Ø Daily',
      align: 'right',
      sortable: true,
      render: (value) => (value as number).toFixed(2)
    },
    { 
      key: 'onHand', 
      label: 'On-Hand',
      align: 'right',
      sortable: true
    },
    { 
      key: 'replenishmentNeed', 
      label: 'Need',
      align: 'right',
      sortable: true
    },
    { 
      key: 'allocationFinal', 
      label: 'Allocated',
      align: 'right',
      sortable: true,
      render: (value, row) => {
        return (
          <div className="flex items-center gap-2 justify-end">
            <span>{value as number}</span>
            <span
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: row.coverage >= 90 ? 'var(--surface-success-subtle)' : row.coverage >= 75 ? 'var(--surface-warning-subtle)' : 'var(--surface-danger-subtle)',
                color: row.coverage >= 90 ? 'var(--status-success)' : row.coverage >= 75 ? 'var(--status-warning)' : 'var(--status-danger)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {row.coverage.toFixed(0)}%
            </span>
          </div>
        );
      }
    },
    {
      key: 'expectedDOS',
      label: 'Expected DOS',
      align: 'right',
      sortable: true,
      render: (value) => {
        const dos = value as number;
        return (
          <div className="flex items-center gap-2 justify-end">
            <span>{dos.toFixed(1)} Tage</span>
            {dos < 14 && (
              <AlertTriangle size={16} style={{ color: 'var(--status-danger)' }} />
            )}
          </div>
        );
      }
    },
    {
      key: 'limitingFactor',
      label: 'Limit',
      render: (value) => value ? (
        <span
          className="px-2 py-1 rounded"
          style={{
            backgroundColor: 'var(--surface-warning-subtle)',
            color: 'var(--status-warning)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {value}
        </span>
      ) : null
    },
    {
      key: 'substitutionUsed',
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
              Substitution
            </span>
          )}
          {row.expectedDOS < 14 && (
            <span
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: 'var(--surface-danger-subtle)',
                color: 'var(--status-danger)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Stockout Risk
            </span>
          )}
        </div>
      )
    }
  ];

  const skuColumns: Column<ReplenishmentSKU>[] = [
    { key: 'articleColor', label: 'Artikel', sortable: true },
    { key: 'productGroup', label: 'Produktgruppe', sortable: true },
    { 
      key: 'priorityScore', 
      label: 'Priority Score',
      align: 'right',
      sortable: true,
      render: (value) => (value as number).toFixed(1)
    },
    { 
      key: 'forecastDemand', 
      label: 'Forecast Demand',
      align: 'right',
      sortable: true,
      render: (value) => (value as number).toLocaleString('de-CH')
    },
    { 
      key: 'replenishmentNeed', 
      label: 'Need',
      align: 'right',
      sortable: true,
      render: (value) => (value as number).toLocaleString('de-CH')
    },
    { 
      key: 'dcSupply', 
      label: 'DC Supply',
      align: 'right',
      sortable: true,
      render: (value) => (value as number).toLocaleString('de-CH')
    },
    { 
      key: 'allocated', 
      label: 'Allocated',
      align: 'right',
      sortable: true,
      render: (value, row) => {
        const coverage = (value as number / row.replenishmentNeed) * 100;
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
      key: 'shortage', 
      label: 'Shortage',
      align: 'right',
      sortable: true,
      render: (value) => value > 0 ? (
        <span style={{ color: 'var(--status-danger)', fontWeight: 'var(--font-weight-semibold)' }}>
          {(value as number).toLocaleString('de-CH')}
        </span>
      ) : '-'
    },
    { 
      key: 'stockoutRiskStores', 
      label: 'Stockout Risk',
      align: 'right',
      sortable: true,
      render: (value) => value > 0 ? (
        <span style={{ color: 'var(--status-danger)', fontWeight: 'var(--font-weight-semibold)' }}>
          {value}
        </span>
      ) : '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => {
        const config = {
          'ok': { bg: 'var(--surface-success-subtle)', color: 'var(--status-success)', label: 'OK' },
          'shortage': { bg: 'var(--surface-danger-subtle)', color: 'var(--status-danger)', label: 'Shortage' },
          'capacity_limited': { bg: 'var(--surface-warning-subtle)', color: 'var(--status-warning)', label: 'Cap Limited' },
          'substitution_active': { bg: 'var(--surface-warning-subtle)', color: 'var(--status-warning)', label: 'Substitution' },
          'repaired': { bg: 'var(--surface-info-subtle)', color: 'var(--status-info)', label: 'Repaired' }
        };
        const c = config[value as keyof typeof config];
        return (
          <span
            className="px-2 py-1 rounded"
            style={{
              backgroundColor: c.bg,
              color: c.color,
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {c.label}
          </span>
        );
      }
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
                Replenishment Simulation: {variantName}
              </h1>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                Horizon: {kpi.horizon.weeks} Wochen ({kpi.horizon.from} - {kpi.horizon.to})
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
                backgroundColor: kpi.stockoutRiskStores > 10 ? 'var(--surface-warning-subtle)' : 'var(--surface-success-subtle)',
                borderColor: kpi.stockoutRiskStores > 10 ? 'var(--status-warning)' : 'var(--status-success)'
              }}
            >
              {kpi.stockoutRiskStores > 10 ? (
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
                    color: kpi.stockoutRiskStores > 10 ? 'var(--status-warning)' : 'var(--status-success)'
                  }}
                >
                  {kpi.stockoutRiskStores > 10 ? 'Simulation mit Warnungen abgeschlossen' : 'Simulation erfolgreich abgeschlossen'}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                  {kpi.stockoutRiskStores > 10 
                    ? `${kpi.stockoutRiskStores} Filialen mit Stockout-Risiko - Substitution in ${kpi.substitutionActivated} Filialen aktiv`
                    : 'Alle Replenishment-Needs erfolgreich berechnet'}
                </div>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <KPICard
                title="Service Level Fulfillment"
                value={kpi.serviceLevelFulfillment}
                unit="%"
                delta={-7.7}
                deltaLabel="vs target 95%"
                state={kpi.serviceLevelFulfillment > 90 ? 'success' : 'warning'}
                formula="SLF = Σ min(1, Coverage_{i,s}) × Weight_{i,s} / Σ Weight_{i,s}"
                formulaInputs={[
                  { symbol: 'Coverage_{i,s}', value: 0.873, source: 'Allokation', description: 'Allocated / Need' },
                  { symbol: 'Weight_{i,s}', value: 12500, source: 'Umsatzdaten', description: 'Gewichtungsfaktor' }
                ]}
              />
              <KPICard
                title="Stockout Risk Stores"
                value={kpi.stockoutRiskStores}
                delta={-3}
                deltaLabel="vs baseline"
                state={kpi.stockoutRiskStores > 10 ? 'warning' : 'success'}
                formula="StockoutRisk = stores where DOS < ThresholdDays"
                formulaInputs={[
                  { symbol: 'DOS_{i,s}', value: 6.5, source: 'DOS-Berechnung', description: '(OnHand + Allocated) / AvgDaily' },
                  { symbol: 'ThresholdDays', value: 14, source: 'Parameter', description: 'Kritische Schwelle' }
                ]}
              />
              <KPICard
                title="Capacity Utilization Impact"
                value={kpi.capacityUtilizationImpact}
                unit="%"
                delta={2.1}
                deltaLabel="vs current"
                state="success"
              />
              <KPICard
                title="Supply Coverage DC"
                value={kpi.supplyCoverageDC}
                unit="%"
                delta={-6.2}
                deltaLabel="vs need"
                state={kpi.supplyCoverageDC > 90 ? 'success' : 'warning'}
              />
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <KPICard
                title="Substitution Activated"
                value={kpi.substitutionActivated}
                state={kpi.substitutionActivated > 0 ? 'warning' : 'success'}
              />
              <KPICard
                title="Pack Repairs"
                value={kpi.repairsApplied.pack}
                state="neutral"
              />
              <KPICard
                title="Size Curve Repairs"
                value={kpi.repairsApplied.size}
                state="neutral"
              />
              <KPICard
                title="Total Allocated"
                value={kpi.totalAllocated.toLocaleString('de-CH')}
                unit="Einheiten"
                state="neutral"
              />
            </div>

            {/* Tabs */}
            <div className="border rounded-lg mb-6" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex border-b" style={{ borderColor: 'var(--border-default)' }}>
                {[
                  { id: 'overview', label: 'Übersicht' },
                  { id: 'details', label: 'Store Details' },
                  { id: 'stockout', label: `Stockout Risk (${kpi.stockoutRiskStores})` },
                  { id: 'substitution', label: `Substitution (${kpi.substitutionActivated})` }
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
                    {/* Coverage by SKU */}
                    <div>
                      <h3
                        style={{
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          marginBottom: 'var(--space-4)'
                        }}
                      >
                        Coverage nach SKU
                      </h3>
                      <div style={{ width: '100%', height: '300px', minHeight: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                          <BarChart data={skuChartData}>
                            <XAxis dataKey="sku" style={{ fontSize: 'var(--font-size-xs)' }} />
                            <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="need" fill="var(--text-muted)" name="Need" opacity={0.4} />
                            <Bar dataKey="allocated" fill="var(--brand-primary)" name="Allocated" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* DOS Scatter */}
                    <div>
                      <h3
                        style={{
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          marginBottom: 'var(--space-4)'
                        }}
                      >
                        Days of Supply vs. Coverage
                      </h3>
                      <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={350}>
                          <ScatterChart>
                            <XAxis 
                              dataKey="expectedDOS" 
                              name="Expected DOS" 
                              unit=" Tage"
                              style={{ fontSize: 'var(--font-size-xs)' }}
                            />
                            <YAxis 
                              dataKey="coverage" 
                              name="Coverage" 
                              unit="%"
                              style={{ fontSize: 'var(--font-size-xs)' }}
                            />
                            <ZAxis dataKey="allocated" range={[50, 400]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                            <Legend />
                            <Scatter 
                              name="Ohne Stockout Risk" 
                              data={dosScatterData.filter(d => !d.stockoutRisk)} 
                              fill="var(--brand-primary)" 
                            />
                            <Scatter 
                              name="Mit Stockout Risk" 
                              data={dosScatterData.filter(d => d.stockoutRisk)} 
                              fill="var(--status-danger)" 
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
                          Punkte mit DOS &lt; 14 Tage (rote Punkte) haben hohes Stockout-Risiko innerhalb der nächsten 2 Wochen.
                        </div>
                      </div>
                    </div>

                    {/* SKU Overview Table */}
                    <div>
                      <h3
                        style={{
                          fontSize: 'var(--font-size-md)',
                          fontWeight: 'var(--font-weight-semibold)',
                          marginBottom: 'var(--space-4)'
                        }}
                      >
                        SKU Overview
                      </h3>
                      <DataGrid
                        columns={skuColumns}
                        data={REPLENISHMENT_SKUS}
                        density="comfortable"
                      />
                    </div>
                  </div>
                )}

                {selectedTab === 'details' && (
                  <div>
                    {/* Filter */}
                    <div className="mb-4">
                      <select
                        value={filterSKU}
                        onChange={(e) => setFilterSKU(e.target.value)}
                        className="px-3 py-2 rounded-lg border"
                        style={{
                          borderColor: 'var(--border-input)',
                          fontSize: 'var(--font-size-sm)'
                        }}
                      >
                        <option value="">Alle SKUs</option>
                        {REPLENISHMENT_SKUS.map(sku => (
                          <option key={sku.id} value={sku.sku}>{sku.articleColor}</option>
                        ))}
                      </select>
                    </div>

                    {/* Store Allocation Table */}
                    <DataGrid
                      columns={storeColumns}
                      data={filteredStoreAllocations}
                      density="comfortable"
                    />
                  </div>
                )}

                {selectedTab === 'stockout' && (
                  <div>
                    <div
                      className="mb-4 p-4 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--surface-danger-subtle)',
                        borderColor: 'var(--status-danger)'
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--status-danger)',
                          marginBottom: 'var(--space-2)'
                        }}
                      >
                        Stockout Risk Analysis
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        {kpi.stockoutRiskStores} Filialen haben einen erwarteten Days of Supply (DOS) unter 14 Tagen.
                        Diese Filialen könnten innerhalb der nächsten 2 Wochen leerlaufen.
                      </div>
                    </div>

                    <DataGrid
                      columns={storeColumns}
                      data={REPLENISHMENT_STORE_ALLOCATIONS.filter(a => a.expectedDOS < 14)}
                      density="comfortable"
                    />
                  </div>
                )}

                {selectedTab === 'substitution' && (
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
                        Substitution Strategy: Within Product Group
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                        In {kpi.substitutionActivated} Filialen wurde Substitution aktiviert aufgrund von kritischem Stockout-Risiko
                        oder MinFill-Unterschreitung. Ersatz-SKUs wurden nach Efficiency (Forecast/SpaceDemand) ausgewählt.
                      </div>
                      <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'var(--surface-page)' }}>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          Effizienz-Verbesserung:
                        </div>
                        <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--status-success)' }}>
                          +8.5%
                        </div>
                      </div>
                    </div>

                    <DataGrid
                      columns={storeColumns}
                      data={REPLENISHMENT_STORE_ALLOCATIONS.filter(a => a.substitutionUsed)}
                      density="comfortable"
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}