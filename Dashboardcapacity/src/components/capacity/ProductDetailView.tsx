import { useState } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { FormulaTooltipTrigger, VariableData } from './FormulaTooltip';

export interface ProductDetailData {
  productNumber: string;
  productName: string;
  brand: string;
  productGroup: string;
  purchaseArea: string;
  store: string;
  cluster: string;
  season: string;
  
  // Capacity values
  capSollProductGroup: number; // Cap_soll(s,PG)
  shareSoll: number; // Share_soll(s,i)
  capSollProduct: number; // Cap_soll(s,i) - DERIVED
  
  // Space per unit
  pBase: number;
  mThickness: number;
  mPresentation: number;
  spacePerUnit: number; // p_i - CALCULATED
  
  // Forecast
  forecastQty: number;
  forecastSpaceDemand: number; // CALCULATED
  
  // Inventory
  onHand: number;
  inbound: number;
  reserved: number;
  projectedSpace: number; // CALCULATED
  
  // Deviation
  deviation: number; // CALCULATED
  status: 'OK' | 'Warning' | 'Capacity Violation';
  
  // Metadata
  dataTimestamp: string;
  snapshotId: string;
  sourceSystem: string;
  forecastVersion: string;
  forecastHorizon: string;
}

interface ProductDetailViewProps {
  product: ProductDetailData;
  onClose: () => void;
}

export function ProductDetailView({ product, onClose }: ProductDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'chart'>('overview');

  // Chart data
  const chartData = [
    {
      name: product.productName,
      'SOLL Capacity': product.capSollProduct,
      'Forecast Space': product.forecastSpaceDemand,
      'Projected Space': product.projectedSpace
    }
  ];

  // Tooltip configurations for all derived values
  const derivedCapSollTooltip = {
    metricName: 'Derived Product SOLL Capacity',
    context: `${product.productName} @ ${product.store}`,
    formula: 'Cap_soll(s,i) = Share_soll(s,i) × Cap_soll(s,PG)',
    variables: [
      {
        variable: 'Cap_soll(s,PG)',
        value: product.capSollProductGroup,
        unit: 'm²',
        source: 'Capacity Planning',
        planningLevel: 'Product Group'
      },
      {
        variable: 'Share_soll(s,i)',
        value: product.shareSoll,
        unit: '%',
        source: 'Forecast Engine',
        planningLevel: 'Product',
        definition: 'Forecast-based share of product within product group',
        calculation: 'Share_soll(s,i) = ForecastQty(s,i) / Σ ForecastQty(s,j ∈ PG)',
        sourceTable: 'forecast.product_shares',
        lastUpdate: product.dataTimestamp
      } as VariableData,
      {
        variable: 'Result',
        value: product.capSollProduct,
        unit: 'm²',
        source: 'Calculated',
        planningLevel: 'Product'
      }
    ],
    derivationMethod: 'Product SOLL is derived proportionally from Product Group capacity based on forecast share.',
    dataTimestamp: product.dataTimestamp,
    snapshotId: product.snapshotId,
    sourceSystem: product.sourceSystem
  };

  const spacePerUnitTooltip = {
    metricName: 'Space per Unit',
    context: `${product.productName}`,
    formula: 'p_i = p_base(type) × m_thickness × m_presentation',
    variables: [
      {
        variable: 'p_base',
        value: product.pBase,
        unit: 'm²',
        source: 'Fixture Model',
        planningLevel: 'Product Type',
        definition: 'Base space requirement per unit based on fixture type',
        sourceTable: 'master.fixture_types',
        lastUpdate: product.dataTimestamp
      } as VariableData,
      {
        variable: 'm_thickness',
        value: product.mThickness,
        unit: 'factor',
        source: 'Product Attribute',
        planningLevel: 'Product',
        definition: 'Thickness modifier based on product dimensions',
        sourceTable: 'master.products',
        lastUpdate: product.dataTimestamp
      } as VariableData,
      {
        variable: 'm_presentation',
        value: product.mPresentation,
        unit: 'factor',
        source: 'Presentation Rule',
        planningLevel: 'Store',
        definition: 'Presentation modifier for store-specific display requirements',
        sourceTable: 'config.presentation_rules',
        lastUpdate: product.dataTimestamp
      } as VariableData,
      {
        variable: 'Result',
        value: product.spacePerUnit,
        unit: 'm²/unit',
        source: 'Calculated',
        planningLevel: 'Product'
      }
    ],
    derivationMethod: 'Space per unit is calculated from base fixture type and product-specific presentation modifiers.',
    dataTimestamp: product.dataTimestamp,
    snapshotId: product.snapshotId,
    sourceSystem: product.sourceSystem
  };

  const forecastSpaceTooltip = {
    metricName: 'Forecast Space Demand',
    context: `${product.productName} @ ${product.store}`,
    formula: 'SpaceNeed_fcst(s,i) = ForecastQty(s,i) × p_i',
    variables: [
      {
        variable: 'ForecastQty(s,i)',
        value: product.forecastQty,
        unit: 'units',
        source: 'Forecast System',
        planningLevel: 'Product',
        definition: 'Forecasted sales quantity for product at store',
        calculation: 'ForecastQty(s,i) = Σ ForecastSales(s,i,t)',
        sourceTable: 'forecast.product_forecast',
        lastUpdate: product.dataTimestamp,
        exampleValues: ['1240', '1180', '1350']
      } as VariableData,
      {
        variable: 'p_i',
        value: product.spacePerUnit,
        unit: 'm²/unit',
        source: 'Parameter Model',
        planningLevel: 'Product'
      },
      {
        variable: 'Result',
        value: product.forecastSpaceDemand,
        unit: 'm²',
        source: 'Calculated',
        planningLevel: 'Product'
      }
    ],
    derivationMethod: 'Projected space requirement based on forecasted sales volume.',
    dataTimestamp: product.dataTimestamp,
    snapshotId: product.snapshotId,
    sourceSystem: product.sourceSystem
  };

  const projectedSpaceTooltip = {
    metricName: 'Projected Space Usage',
    context: `${product.productName} @ ${product.store}`,
    formula: 'ProjectedSpace(s,i) = (OnHand(s,i) + Inbound(s,i) + Reserved(s,i)) × p_i',
    variables: [
      {
        variable: 'OnHand',
        value: product.onHand,
        unit: 'units',
        source: 'Inventory',
        planningLevel: 'Store',
        definition: 'Current on-hand inventory at store',
        sourceTable: 'inventory.stock_levels',
        lastUpdate: product.dataTimestamp
      } as VariableData,
      {
        variable: 'Inbound',
        value: product.inbound,
        unit: 'units',
        source: 'Logistics',
        planningLevel: 'Store',
        definition: 'Inbound shipments in transit to store',
        sourceTable: 'logistics.inbound_shipments',
        lastUpdate: product.dataTimestamp
      } as VariableData,
      {
        variable: 'Reserved',
        value: product.reserved,
        unit: 'units',
        source: 'Simulation',
        planningLevel: 'Store',
        definition: 'Reserved allocation from simulation',
        sourceTable: 'simulation.allocations',
        lastUpdate: product.dataTimestamp
      } as VariableData,
      {
        variable: 'p_i',
        value: product.spacePerUnit,
        unit: 'm²/unit',
        source: 'Parameter Model',
        planningLevel: 'Product'
      },
      {
        variable: 'Result',
        value: product.projectedSpace,
        unit: 'm²',
        source: 'Calculated',
        planningLevel: 'Product'
      }
    ],
    derivationMethod: 'Projected space usage based on current and inbound inventory plus reserved allocation.',
    dataTimestamp: product.dataTimestamp,
    snapshotId: product.snapshotId,
    sourceSystem: product.sourceSystem
  };

  const deviationTooltip = {
    metricName: 'Capacity Deviation',
    context: `${product.productName} @ ${product.store}`,
    formula: 'Deviation(s,i) = ProjectedSpace(s,i) − Cap_soll(s,i)',
    variables: [
      {
        variable: 'ProjectedSpace(s,i)',
        value: product.projectedSpace,
        unit: 'm²',
        source: 'Calculated',
        planningLevel: 'Product'
      },
      {
        variable: 'Cap_soll(s,i)',
        value: product.capSollProduct,
        unit: 'm²',
        source: 'Derived',
        planningLevel: 'Product'
      },
      {
        variable: 'Deviation',
        value: product.deviation,
        unit: 'm²',
        source: 'Calculated',
        planningLevel: 'Product'
      }
    ],
    derivationMethod: 'Capacity risk is evaluated against derived product-level SOLL capacity.',
    secondaryFormulas: [
      'Status Logic:',
      '  Deviation ≤ 0 → OK',
      '  0 < Deviation ≤ SoftZone → Warning',
      '  Deviation > SoftZone → Capacity Violation'
    ],
    dataTimestamp: product.dataTimestamp,
    snapshotId: product.snapshotId,
    sourceSystem: product.sourceSystem
  };

  const getStatusIcon = () => {
    switch (product.status) {
      case 'OK':
        return <CheckCircle size={16} style={{ color: 'var(--status-success)' }} />;
      case 'Warning':
        return <AlertTriangle size={16} style={{ color: 'var(--status-warning)' }} />;
      case 'Capacity Violation':
        return <AlertTriangle size={16} style={{ color: 'var(--status-error)' }} />;
    }
  };

  const getStatusColor = () => {
    switch (product.status) {
      case 'OK': return 'var(--status-success)';
      case 'Warning': return 'var(--status-warning)';
      case 'Capacity Violation': return 'var(--status-error)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '900px',
        height: '100vh',
        backgroundColor: 'white',
        borderLeft: '1px solid var(--border-subtle)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.1)'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
              {product.productName}
            </h2>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--background-subtle)',
                color: 'var(--text-muted)'
              }}
            >
              {product.productNumber}
            </span>
          </div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {product.brand} • {product.productGroup} • {product.store}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
            color: 'var(--text-muted)'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '0 24px',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        {(['overview', 'drivers', 'chart'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--brand-primary)' : '2px solid transparent',
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--brand-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
              textTransform: 'capitalize'
            }}
          >
            {tab === 'overview' ? 'Overview' : tab === 'drivers' ? 'Input Drivers' : 'Visualization'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Key Metrics */}
            <div>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Key Metrics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {/* SOLL Capacity - DERIVED */}
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--background-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    SOLL Capacity
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <FormulaTooltipTrigger tooltipProps={derivedCapSollTooltip} isDerived>
                      <span style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--text-primary)' }}>
                        {product.capSollProduct.toFixed(2)}
                      </span>
                    </FormulaTooltipTrigger>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>m²</span>
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: 'var(--font-size-xs)',
                      padding: '4px 8px',
                      backgroundColor: 'var(--brand-primary-10)',
                      color: 'var(--brand-primary)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'inline-block'
                    }}
                  >
                    Derived
                  </div>
                </div>

                {/* Projected Space */}
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--background-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Projected Space
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <FormulaTooltipTrigger tooltipProps={projectedSpaceTooltip} isDerived>
                      <span style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--text-primary)' }}>
                        {product.projectedSpace.toFixed(2)}
                      </span>
                    </FormulaTooltipTrigger>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>m²</span>
                  </div>
                </div>

                {/* Deviation */}
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--background-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    border: `1px solid ${getStatusColor()}`
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Capacity Deviation
                    {getStatusIcon()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <FormulaTooltipTrigger tooltipProps={deviationTooltip} isDerived>
                      <span style={{ fontSize: 'var(--font-size-2xl)', color: getStatusColor() }}>
                        {product.deviation > 0 ? '+' : ''}{product.deviation.toFixed(2)}
                      </span>
                    </FormulaTooltipTrigger>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>m²</span>
                  </div>
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: 'var(--font-size-xs)',
                      color: getStatusColor(),
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    {product.status}
                  </div>
                </div>
              </div>
            </div>

            {/* Space Parameters */}
            <div>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Space Parameters</h3>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--background-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Space per Unit
                  </div>
                  <FormulaTooltipTrigger tooltipProps={spacePerUnitTooltip} isDerived>
                    <span style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
                      {product.spacePerUnit.toFixed(4)} m²/unit
                    </span>
                  </FormulaTooltipTrigger>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Base Space</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>{product.pBase.toFixed(4)} m²</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Thickness Factor</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>{product.mThickness.toFixed(2)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Presentation Factor</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>{product.mPresentation.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Forecast Info */}
            <div>
              <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Forecast Information</h3>
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--background-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Forecast Quantity
                    </div>
                    <div style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
                      {product.forecastQty.toLocaleString('de-DE')} units
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Forecast Space Demand
                    </div>
                    <FormulaTooltipTrigger tooltipProps={forecastSpaceTooltip} isDerived>
                      <span style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}>
                        {product.forecastSpaceDemand.toFixed(2)} m²
                      </span>
                    </FormulaTooltipTrigger>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Forecast Version
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--brand-primary)',
                        padding: '4px 8px',
                        backgroundColor: 'var(--brand-primary-10)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-block'
                      }}
                    >
                      {product.forecastVersion}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Forecast Horizon
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                      {product.forecastHorizon}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Input Drivers</h3>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-subtle)', backgroundColor: 'var(--background-subtle)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'var(--font-weight-semibold)' }}>Driver</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'var(--font-weight-semibold)' }}>Value</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'var(--font-weight-semibold)' }}>Unit</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'var(--font-weight-semibold)' }}>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>On Hand Inventory</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>{product.onHand.toLocaleString('de-DE')}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>units</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Inventory System</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>Inbound Shipments</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>{product.inbound.toLocaleString('de-DE')}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>units</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Logistics System</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>Reserved Allocation</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>{product.reserved.toLocaleString('de-DE')}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>units</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Simulation Engine</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--background-subtle)' }}>
                  <td style={{ padding: '12px', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>Forecast Quantity</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>{product.forecastQty.toLocaleString('de-DE')}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>units</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Forecast System</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>PG SOLL Capacity</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>{product.capSollProductGroup.toFixed(2)}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>m²</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Capacity Planning</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '12px', color: 'var(--text-primary)' }}>Forecast Share</td>
                  <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-primary)' }}>{(product.shareSoll * 100).toFixed(2)}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>%</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>Forecast Engine</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'chart' && (
          <div>
            <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Capacity Visualization</h3>
            <div style={{ height: '400px', marginBottom: '24px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="SOLL Capacity" fill="var(--brand-primary)" />
                  <Bar dataKey="Forecast Space" fill="#10b981" />
                  <Bar dataKey="Projected Space" fill={getStatusColor()} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Capacity Breakdown */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--background-subtle)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <h4 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>Capacity Breakdown</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>SOLL Capacity (Target)</span>
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                    {product.capSollProduct.toFixed(2)} m²
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Projected Space (Inventory + Inbound + Reserved)</span>
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                    {product.projectedSpace.toFixed(2)} m²
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Forecast Space (Based on Sales Forecast)</span>
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>
                    {product.forecastSpaceDemand.toFixed(2)} m²
                  </span>
                </div>
                <div
                  style={{
                    paddingTop: '12px',
                    marginTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>Deviation</span>
                  <span style={{ fontWeight: 'var(--font-weight-semibold)', color: getStatusColor() }}>
                    {product.deviation > 0 ? '+' : ''}{product.deviation.toFixed(2)} m² ({product.status})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
