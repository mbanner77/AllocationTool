import { useState } from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Copy, 
  Edit2, 
  Archive, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Rocket,
  Info,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { KPICard } from './KPICard';
import { FormulaTooltip } from './FormulaTooltip';
import { ReplenishmentKPICards } from './ReplenishmentKPICards';

type VariantStatus = 'Draft' | 'Simulated' | 'Validated' | 'Released';
type AllocationType = 'Initial Allocation' | 'Replenishment' | 'Manual Allocation';
type RecipientStrategy = 'Plan Data' | 'Manual Selection' | 'Listing' | 'Transport Relations';
type CapacityUnit = 'm²' | 'Fixtures';
type RationingStrategy = 'Proportional' | 'Top Performer First' | 'Min-Max Fairness' | 'Presentation Stock First';
type FallbackStrategy = 'Core/NOS substitution' | 'Fairness redistribution' | 'Rule-based replacement';
type RepairMode = 'Strict' | 'Best Effort';

interface Variant {
  id: string;
  name: string;
  status: VariantStatus;
  allocationType: AllocationType;
  season: string;
  owner: string;
  lastSimulation?: string;
  hasFallback: boolean;
  kpis: {
    supplyCoverage: number;
    capacityRisk: 'green' | 'yellow' | 'red';
    forecastFulfillment: number;
  };
}

interface PolicyConfig {
  // Tab 1: Recipient & Data Sources
  recipientStrategy: RecipientStrategy;
  availabilitySources: {
    dcStock: boolean;
    purchaseOrders: boolean;
    deliveries: boolean;
    external: boolean;
  };
  deliveryDateLogic: 'Delivery Schedule' | 'Planned Lead Time';
  
  // Tab 2: Forecast & Space Demand
  useForecast: boolean;
  forecastSource: string;
  forecastWeight: number;
  forecastInfluencesSpace: boolean;
  spaceDemandPlanningLevel: 'Company' | 'Buying Group' | 'Product Group' | 'Product';
  
  // Tab 3: Capacity & Restrictions
  capacityUnit: CapacityUnit;
  capacityPlanningLevel: 'Company' | 'Buying Group' | 'Product Group';
  capacityIsHardLimit: boolean;
  softZonePercentage: number;
  softZonePenaltyWeight: number;
  
  // Tab 4: Rationing & Fairness
  rationingStrategy: RationingStrategy;
  topPerformerDefinition: string;
  minFillPercentage: number;
  fairnessFactor: number;
  
  // Tab 5: Fallback & MinFill
  allowFallback: boolean;
  fallbackStrategy: FallbackStrategy;
  minFillProfile: 'Core' | 'Premium' | 'Small Store';
  fallbackThreshold: number;
  
  // Tab 6: LOT / Size / Pack
  enforcePackSize: boolean;
  packSize: number;
  sizeCurveActive: boolean;
  minSizesPerStore: number;
  repairMode: RepairMode;
}

const MOCK_VARIANTS: Variant[] = [
  {
    id: 'var-1',
    name: 'Standard HW 2025',
    status: 'Validated',
    allocationType: 'Initial Allocation',
    season: 'HW 2025',
    owner: 'M. Weber',
    lastSimulation: '2025-01-10 14:23',
    hasFallback: false,
    kpis: {
      supplyCoverage: 92.5,
      capacityRisk: 'green',
      forecastFulfillment: 88.3
    }
  },
  {
    id: 'var-2',
    name: 'Optimiert - Hohe Prognosegewichtung',
    status: 'Simulated',
    allocationType: 'Initial Allocation',
    season: 'HW 2025',
    owner: 'M. Weber',
    lastSimulation: '2025-01-12 09:45',
    hasFallback: true,
    kpis: {
      supplyCoverage: 85.6,
      capacityRisk: 'yellow',
      forecastFulfillment: 95.2
    }
  },
  {
    id: 'var-3',
    name: 'Test - MinMax Fairness',
    status: 'Draft',
    allocationType: 'Initial Allocation',
    season: 'HW 2025',
    owner: 'M. Weber',
    hasFallback: false,
    kpis: {
      supplyCoverage: 0,
      capacityRisk: 'green',
      forecastFulfillment: 0
    }
  },
  {
    id: 'var-4',
    name: 'SW 2025 - Baseline',
    status: 'Released',
    allocationType: 'Initial Allocation',
    season: 'SW 2025',
    owner: 'A. Müller',
    lastSimulation: '2025-01-05 16:12',
    hasFallback: false,
    kpis: {
      supplyCoverage: 94.1,
      capacityRisk: 'green',
      forecastFulfillment: 91.7
    }
  },
  // Replenishment Variants
  {
    id: 'var-rep-1',
    name: 'NOS Nachschub - Standard',
    status: 'Validated',
    allocationType: 'Replenishment',
    season: 'NOS',
    owner: 'K. Schmidt',
    lastSimulation: '2025-01-15 08:30',
    hasFallback: false,
    kpis: {
      supplyCoverage: 89.2,
      capacityRisk: 'green',
      forecastFulfillment: 87.3
    }
  },
  {
    id: 'var-rep-2',
    name: 'Nachschub - Hohe Service Level Priority',
    status: 'Simulated',
    allocationType: 'Replenishment',
    season: 'NOS',
    owner: 'K. Schmidt',
    lastSimulation: '2025-01-16 11:20',
    hasFallback: true,
    kpis: {
      supplyCoverage: 84.8,
      capacityRisk: 'yellow',
      forecastFulfillment: 92.1
    }
  },
  {
    id: 'var-rep-3',
    name: 'Nachschub - Test Substitution',
    status: 'Draft',
    allocationType: 'Replenishment',
    season: 'NOS',
    owner: 'K. Schmidt',
    hasFallback: true,
    kpis: {
      supplyCoverage: 0,
      capacityRisk: 'green',
      forecastFulfillment: 0
    }
  }
];

const STATUS_CONFIG = {
  'Draft': { color: 'var(--text-muted)', bg: 'var(--surface-subtle)', icon: Edit2 },
  'Simulated': { color: 'var(--status-info)', bg: 'var(--surface-info-subtle)', icon: Clock },
  'Validated': { color: 'var(--status-success)', bg: 'var(--surface-success-subtle)', icon: CheckCircle },
  'Released': { color: 'var(--brand-primary)', bg: 'var(--surface-subtle-tint)', icon: Rocket }
};

interface ScenarioManagementScreenProps {
  onNavigateToSimulation?: (variantId: string, allocationType: AllocationType) => void;
  onNavigateToExplainability?: (variantId: string, allocationType: AllocationType) => void;
  onNavigateToAllocationRun?: (variantId: string) => void;
}

export function ScenarioManagementScreen({
  onNavigateToSimulation,
  onNavigateToExplainability,
  onNavigateToAllocationRun
}: ScenarioManagementScreenProps) {
  const [allocationType, setAllocationType] = useState<AllocationType>('Initial Allocation');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VariantStatus | ''>('');
  const [selectedVariant, setSelectedVariant] = useState<Variant>(MOCK_VARIANTS[1]);
  const [activeTab, setActiveTab] = useState(1);
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  
  // Policy Configuration State
  const [policyConfig, setPolicyConfig] = useState<PolicyConfig>({
    recipientStrategy: 'Plan Data',
    availabilitySources: {
      dcStock: true,
      purchaseOrders: true,
      deliveries: true,
      external: false
    },
    deliveryDateLogic: 'Delivery Schedule',
    useForecast: true,
    forecastSource: 'Statistical Forecast v2.3',
    forecastWeight: 60,
    forecastInfluencesSpace: true,
    spaceDemandPlanningLevel: 'Product Group',
    capacityUnit: 'm²',
    capacityPlanningLevel: 'Product Group',
    capacityIsHardLimit: false,
    softZonePercentage: 10,
    softZonePenaltyWeight: 0.5,
    rationingStrategy: 'Proportional',
    topPerformerDefinition: 'Top 20% Sales',
    minFillPercentage: 80,
    fairnessFactor: 0.8,
    allowFallback: true,
    fallbackStrategy: 'Core/NOS substitution',
    minFillProfile: 'Core',
    fallbackThreshold: 75,
    enforcePackSize: true,
    packSize: 6,
    sizeCurveActive: true,
    minSizesPerStore: 3,
    repairMode: 'Best Effort'
  });

  const filteredVariants = MOCK_VARIANTS.filter(v => {
    if (v.allocationType !== allocationType) return false;
    if (statusFilter && v.status !== statusFilter) return false;
    if (searchQuery && !v.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const updatePolicyConfig = (updates: Partial<PolicyConfig>) => {
    setPolicyConfig(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="h-full flex">
      {/* LEFT SIDEBAR */}
      <div
        className="overflow-y-auto border-r"
        style={{
          width: '25%',
          minWidth: '300px',
          backgroundColor: 'var(--surface-subtle)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)'
              }}
            >
              Varianten
            </h2>
            <button
              className="p-2 rounded-lg"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--text-inverse)'
              }}
            >
              <Plus size={18} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 p-1 rounded-lg" style={{ backgroundColor: 'var(--surface-page)' }}>
            {(['Initial Allocation', 'Replenishment', 'Manual Allocation'] as AllocationType[]).map(type => (
              <button
                key={type}
                onClick={() => setAllocationType(type)}
                className="flex-1 px-2 py-1 rounded text-center"
                style={{
                  backgroundColor: allocationType === type ? 'var(--brand-primary)' : 'transparent',
                  color: allocationType === type ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: allocationType === type ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)'
                }}
              >
                {type === 'Initial Allocation' ? 'Initial' : type === 'Replenishment' ? 'Nachschub' : 'Manuell'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-4">
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
              placeholder="Variante suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-lg border"
              style={{
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--surface-page)'
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as VariantStatus | '')}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: 'var(--surface-page)'
              }}
            >
              <option value="">Alle Status</option>
              <option value="Draft">Draft</option>
              <option value="Simulated">Simulated</option>
              <option value="Validated">Validated</option>
              <option value="Released">Released</option>
            </select>
          </div>

          {/* Variant Cards */}
          <div className="space-y-2">
            {filteredVariants.map(variant => {
              const isSelected = variant.id === selectedVariant.id;
              const statusConfig = STATUS_CONFIG[variant.status];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className="relative p-3 rounded-lg cursor-pointer transition-all"
                  style={{
                    backgroundColor: isSelected ? 'var(--surface-page)' : 'transparent',
                    border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-subtle)'
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          marginBottom: '4px'
                        }}
                      >
                        {variant.name}
                      </div>
                      <div
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full"
                        style={{
                          backgroundColor: statusConfig.bg,
                          color: statusConfig.color,
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        <StatusIcon size={12} />
                        {variant.status}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowContextMenu(showContextMenu === variant.id ? null : variant.id);
                      }}
                      className="p-1 rounded hover:bg-surface-tint"
                    >
                      <MoreVertical size={16} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>

                  {/* Mini KPIs */}
                  <div className="space-y-2 mb-2">
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Supply Coverage
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: variant.kpis.supplyCoverage > 90 ? 'var(--status-success)' : 'var(--status-warning)'
                        }}
                      >
                        {variant.kpis.supplyCoverage > 0 ? `${variant.kpis.supplyCoverage}%` : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Capacity Risk
                      </span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor:
                            variant.kpis.capacityRisk === 'green' ? 'var(--status-success)' :
                            variant.kpis.capacityRisk === 'yellow' ? 'var(--status-warning)' :
                            'var(--status-danger)'
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Forecast Fulfillment
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: variant.kpis.forecastFulfillment > 90 ? 'var(--status-success)' : 'var(--status-warning)'
                        }}
                      >
                        {variant.kpis.forecastFulfillment > 0 ? `${variant.kpis.forecastFulfillment}%` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1">
                    {variant.hasFallback && (
                      <span
                        className="px-2 py-1 rounded"
                        style={{
                          backgroundColor: 'var(--surface-warning-subtle)',
                          color: 'var(--status-warning)',
                          fontSize: 'var(--font-size-2xs)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        Fallback
                      </span>
                    )}
                  </div>

                  {/* Last Simulation */}
                  {variant.lastSimulation && (
                    <div
                      className="mt-2 pt-2"
                      style={{
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Simulation: {variant.lastSimulation}
                    </div>
                  )}

                  {/* Context Menu */}
                  {showContextMenu === variant.id && (
                    <div
                      className="absolute right-3 top-12 z-10 rounded-lg shadow-lg border"
                      style={{
                        backgroundColor: 'var(--surface-page)',
                        borderColor: 'var(--border-default)',
                        boxShadow: 'var(--shadow-lg)',
                        minWidth: '180px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-surface-tint">
                        <Copy size={16} />
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>Duplizieren</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-surface-tint">
                        <Edit2 size={16} />
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>Umbenennen</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-surface-tint">
                        <Archive size={16} />
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>Archivieren</span>
                      </button>
                      <button className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-surface-tint">
                        <Download size={16} />
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>Export JSON</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ width: '50%' }}
      >
        <div className="p-6">
          {/* Variant Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={selectedVariant.name}
                  onChange={() => {}} // Read-only field
                  readOnly
                  className="text-2xl font-semibold mb-2 bg-transparent border-b-2 border-transparent hover:border-border-input focus:border-brand-primary outline-none"
                  style={{
                    fontSize: 'var(--font-size-2xl)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}
                />
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: STATUS_CONFIG[selectedVariant.status].bg,
                      color: STATUS_CONFIG[selectedVariant.status].color,
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    {selectedVariant.status}
                  </span>
                  {selectedVariant.lastSimulation && (
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      Simulation: {selectedVariant.lastSimulation}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onNavigateToSimulation?.(selectedVariant.id, selectedVariant.allocationType)}
                  className="px-4 py-2 rounded-lg border flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--button-secondary-bg)',
                    borderColor: 'var(--button-secondary-border)',
                    color: 'var(--button-secondary-text)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <TrendingUp size={16} />
                  Simulation öffnen
                </button>
                <button
                  onClick={() => onNavigateToExplainability?.(selectedVariant.id, selectedVariant.allocationType)}
                  className="px-4 py-2 rounded-lg border flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--button-secondary-bg)',
                    borderColor: 'var(--button-secondary-border)',
                    color: 'var(--button-secondary-text)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  <Info size={16} />
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
                  <Copy size={16} />
                  Duplizieren
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Supply Coverage"
              value={selectedVariant.kpis.supplyCoverage}
              unit="%"
              delta={-2.3}
              deltaLabel="vs baseline"
              state={selectedVariant.kpis.supplyCoverage > 90 ? 'success' : 'warning'}
              formula="Coverage = (Supply / Demand) × 100%"
              formulaInputs={[
                { symbol: 'Supply', value: 24365, source: 'Verfügbarkeitsberechnung' },
                { symbol: 'Demand', value: 28456, source: 'Bedarfsberechnung' }
              ]}
            />
            <KPICard
              title="Forecast Fulfillment"
              value={selectedVariant.kpis.forecastFulfillment}
              unit="%"
              delta={5.8}
              deltaLabel="vs baseline"
              state={selectedVariant.kpis.forecastFulfillment > 90 ? 'success' : 'warning'}
              formula="FF = (Allocated / Forecast) × 100%"
              formulaInputs={[
                { symbol: 'Allocated', value: 24365, source: 'Allokationsergebnis' },
                { symbol: 'Forecast', value: 25600, source: 'Prognosesystem' }
              ]}
            />
            <KPICard
              title="Capacity Utilization"
              value={82.4}
              unit="%"
              delta={1.2}
              deltaLabel="vs baseline"
              state="success"
              formula="CU = (Σ Space_Used / Σ Space_Available) × 100%"
              formulaInputs={[
                { symbol: 'Space_Used', value: 8240, source: 'Flächenberechnung', description: 'Genutzte Fläche' },
                { symbol: 'Space_Available', value: 10000, source: 'Kapazitätsplanung', description: 'Verfügbare Fläche' }
              ]}
            />
            <KPICard
              title="Exception Count"
              value={32}
              delta={-15.8}
              deltaLabel="vs baseline"
              state={32 < 50 ? 'success' : 'warning'}
            />
          </div>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <KPICard
              title="Stores in Fallback"
              value={18}
              state={18 > 0 ? 'warning' : 'success'}
            />
            <KPICard
              title="Undercoverage Units"
              value={4336}
              state="warning"
            />
            <KPICard
              title="Overcapacity"
              value={145}
              unit="m²"
              state="neutral"
            />
            <KPICard
              title="MinFill Fulfillment"
              value={85.2}
              unit="%"
              state="warning"
              formula="MF = (Stores_Above_MinFill / Total_Stores) × 100%"
              formulaInputs={[
                { symbol: 'Stores_Above_MinFill', value: 213, source: 'Rationierungsberechnung' },
                { symbol: 'Total_Stores', value: 245, source: 'Empfängerbestimmung' }
              ]}
            />
          </div>

          {/* Policy Tabs */}
          <div className="border rounded-lg" style={{ borderColor: 'var(--border-default)' }}>
            {/* Tab Headers */}
            <div
              className="flex border-b overflow-x-auto"
              style={{ borderColor: 'var(--border-default)' }}
            >
              {[
                { id: 1, label: 'Empfänger & Daten' },
                { id: 2, label: 'Prognose & Raumbedarf' },
                { id: 3, label: 'Kapazität' },
                { id: 4, label: 'Rationierung' },
                { id: 5, label: 'Fallback & MinFill' },
                { id: 6, label: 'LOT/Größe/Pack' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="px-4 py-3 border-b-2 whitespace-nowrap"
                  style={{
                    borderColor: activeTab === tab.id ? 'var(--brand-primary)' : 'transparent',
                    color: activeTab === tab.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: activeTab === tab.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-normal)'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 1 && (
                <div className="space-y-6">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--space-4)'
                    }}
                  >
                    Empfänger & Datenquellen
                  </h3>

                  {/* Recipient Strategy */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)'
                      }}
                    >
                      Empfängerstrategie
                      <FormulaTooltip
                        formula="Recipients = f(Strategy, Season, Exclusions)"
                        inputs={[
                          { symbol: 'Strategy', value: policyConfig.recipientStrategy, source: 'Variantenkonfiguration' },
                          { symbol: 'Season', value: selectedVariant.season, source: 'Variantenkonfiguration' }
                        ]}
                        explanation="Die Empfängerstrategie bestimmt, welche Filialen für die Allokation in Frage kommen."
                      />
                    </label>
                    <select
                      value={policyConfig.recipientStrategy}
                      onChange={(e) => updatePolicyConfig({ recipientStrategy: e.target.value as RecipientStrategy })}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: 'var(--border-input)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="Plan Data">Planungsdaten</option>
                      <option value="Manual Selection">Manuelle Auswahl</option>
                      <option value="Listing">Listung</option>
                      <option value="Transport Relations">Transportrelationen</option>
                    </select>
                  </div>

                  {/* Availability Sources */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      Verfügbarkeitsquellen
                    </label>
                    <div className="space-y-2">
                      {Object.entries({
                        dcStock: 'DC-Bestände',
                        purchaseOrders: 'Bestellungen',
                        deliveries: 'Lieferungen',
                        external: 'Externe Quellen'
                      }).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={policyConfig.availabilitySources[key as keyof typeof policyConfig.availabilitySources]}
                            onChange={(e) =>
                              updatePolicyConfig({
                                availabilitySources: {
                                  ...policyConfig.availabilitySources,
                                  [key]: e.target.checked
                                }
                              })
                            }
                            className="rounded"
                          />
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Date Logic */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      Lieferterminlogik
                    </label>
                    <select
                      value={policyConfig.deliveryDateLogic}
                      onChange={(e) => updatePolicyConfig({ deliveryDateLogic: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: 'var(--border-input)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="Delivery Schedule">Lieferplan</option>
                      <option value="Planned Lead Time">Geplante Vorlaufzeit</option>
                    </select>
                  </div>

                  {/* Preview Panel */}
                  <div
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      borderColor: 'var(--border-default)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        marginBottom: 'var(--space-2)'
                      }}
                    >
                      Vorschau
                    </div>
                    <div className="space-y-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      <div className="flex justify-between">
                        <span>Empfängerfilialen:</span>
                        <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>245</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ausgeschlossene Filialen:</span>
                        <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}>12</span>
                      </div>
                      <button
                        className="mt-2 text-brand-primary hover:underline"
                        style={{ fontSize: 'var(--font-size-sm)' }}
                      >
                        Filialliste anzeigen →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                <div className="space-y-6">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--space-4)'
                    }}
                  >
                    Prognose & Raumbedarf
                  </h3>

                  {/* Use Forecast Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyConfig.useForecast}
                      onChange={(e) => updatePolicyConfig({ useForecast: e.target.checked })}
                      className="rounded"
                    />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      Prognose verwenden
                    </span>
                  </label>

                  {policyConfig.useForecast && (
                    <>
                      {/* Forecast Source */}
                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            marginBottom: 'var(--space-2)',
                            display: 'block'
                          }}
                        >
                          Prognosequelle
                        </label>
                        <select
                          value={policyConfig.forecastSource}
                          onChange={(e) => updatePolicyConfig({ forecastSource: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border"
                          style={{
                            borderColor: 'var(--border-input)',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        >
                          <option value="Statistical Forecast v2.3">Statistical Forecast v2.3</option>
                          <option value="ML Forecast v1.0">ML Forecast v1.0</option>
                          <option value="Manual Forecast">Manuelle Prognose</option>
                        </select>
                      </div>

                      {/* Forecast Weight Slider */}
                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            marginBottom: 'var(--space-2)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)'
                          }}
                        >
                          Prognosegewichtung: {policyConfig.forecastWeight}%
                          <FormulaTooltip
                            formula="D = Plan × (1 - w) + Forecast × w"
                            inputs={[
                              { symbol: 'Plan', value: 150, source: 'Planungsdaten' },
                              { symbol: 'Forecast', value: 120, source: policyConfig.forecastSource },
                              { symbol: 'w', value: policyConfig.forecastWeight / 100, source: 'Slider' }
                            ]}
                            result={150 * (1 - policyConfig.forecastWeight / 100) + 120 * (policyConfig.forecastWeight / 100)}
                            explanation="Der Bedarf wird als gewichteter Durchschnitt zwischen Plan und Prognose berechnet."
                          />
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={policyConfig.forecastWeight}
                          onChange={(e) => updatePolicyConfig({ forecastWeight: Number(e.target.value) })}
                          className="w-full"
                        />
                        <div className="flex justify-between mt-1" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          <span>0% (Nur Plan)</span>
                          <span>50%</span>
                          <span>100% (Nur Prognose)</span>
                        </div>
                      </div>

                      {/* Forecast Influences Space */}
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policyConfig.forecastInfluencesSpace}
                          onChange={(e) => updatePolicyConfig({ forecastInfluencesSpace: e.target.checked })}
                          className="rounded"
                        />
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>
                          Prognose beeinflusst Raumbedarf
                        </span>
                      </label>
                    </>
                  )}

                  {/* Space Demand Planning Level */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      Planungsebene für Raumbedarf
                    </label>
                    <select
                      value={policyConfig.spaceDemandPlanningLevel}
                      onChange={(e) => updatePolicyConfig({ spaceDemandPlanningLevel: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: 'var(--border-input)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="Company">Unternehmen</option>
                      <option value="Buying Group">Einkaufsbereich</option>
                      <option value="Product Group">Produktgruppe</option>
                      <option value="Product">Produkt</option>
                    </select>
                  </div>

                  {/* Formula Box */}
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-info-subtle)',
                      border: '1px solid var(--border-info)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--status-info)',
                        marginBottom: 'var(--space-2)'
                      }}
                    >
                      Raumbedarf-Formel
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      SpaceDemand<sub>h</sub> = Σ (Forecast<sub>i</sub> × p<sub>i</sub>)
                    </div>
                    <div
                      className="mt-2"
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      Der Raumbedarf wird durch Summierung der prognostizierten Mengen multipliziert mit dem Flächenbedarf je Artikel berechnet.
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <div className="space-y-6">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--space-4)'
                    }}
                  >
                    Kapazität & Restriktionen
                  </h3>

                  {/* Capacity Unit */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      Kapazitätseinheit
                    </label>
                    <div className="flex gap-2">
                      {(['m²', 'Fixtures'] as CapacityUnit[]).map(unit => (
                        <button
                          key={unit}
                          onClick={() => updatePolicyConfig({ capacityUnit: unit })}
                          className="px-4 py-2 rounded-lg border"
                          style={{
                            backgroundColor: policyConfig.capacityUnit === unit ? 'var(--brand-primary)' : 'var(--surface-page)',
                            borderColor: policyConfig.capacityUnit === unit ? 'var(--brand-primary)' : 'var(--border-input)',
                            color: policyConfig.capacityUnit === unit ? 'var(--text-inverse)' : 'var(--text-primary)',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Capacity Planning Level */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      Kapazitäts-Planungsebene
                    </label>
                    <select
                      value={policyConfig.capacityPlanningLevel}
                      onChange={(e) => updatePolicyConfig({ capacityPlanningLevel: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: 'var(--border-input)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="Company">Unternehmen</option>
                      <option value="Buying Group">Einkaufsbereich</option>
                      <option value="Product Group">Produktgruppe</option>
                    </select>
                  </div>

                  {/* Capacity is Hard Limit */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyConfig.capacityIsHardLimit}
                      onChange={(e) => updatePolicyConfig({ capacityIsHardLimit: e.target.checked })}
                      className="rounded"
                    />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      Kapazität ist harte Grenze
                    </span>
                  </label>

                  {/* Soft Zone */}
                  {!policyConfig.capacityIsHardLimit && (
                    <>
                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            marginBottom: 'var(--space-2)',
                            display: 'block'
                          }}
                        >
                          Soft Zone: +{policyConfig.softZonePercentage}%
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          step={1}
                          value={policyConfig.softZonePercentage}
                          onChange={(e) => updatePolicyConfig({ softZonePercentage: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            marginBottom: 'var(--space-2)',
                            display: 'block'
                          }}
                        >
                          Penalty Weight: {policyConfig.softZonePenaltyWeight}
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.1}
                          value={policyConfig.softZonePenaltyWeight}
                          onChange={(e) => updatePolicyConfig({ softZonePenaltyWeight: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {/* Formulas */}
                  <div className="space-y-3">
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      Free<sub>s,h</sub> = max(0, Cap<sub>soll,s,h</sub> − Occ<sub>ist,s,h</sub>)
                    </div>
                    <div
                      className="p-4 rounded-lg"
                      style={{
                        backgroundColor: 'var(--surface-subtle)',
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      Σ (p<sub>i</sub> × x<sub>i,s</sub>) ≤ Free<sub>s,h</sub>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 4 && (
                <div className="space-y-6">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--space-4)'
                    }}
                  >
                    Rationierung & Fairness
                  </h3>

                  {/* Rationing Strategy */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      Rationierungsstrategie
                    </label>
                    <select
                      value={policyConfig.rationingStrategy}
                      onChange={(e) => updatePolicyConfig({ rationingStrategy: e.target.value as RationingStrategy })}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: 'var(--border-input)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="Proportional">Proportional</option>
                      <option value="Top Performer First">Top Performer zuerst</option>
                      <option value="Min-Max Fairness">Min-Max Fairness</option>
                      <option value="Presentation Stock First">Präsentationsbestand zuerst</option>
                    </select>
                  </div>

                  {/* Top Performer Definition */}
                  {policyConfig.rationingStrategy === 'Top Performer First' && (
                    <div>
                      <label
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          marginBottom: 'var(--space-2)',
                          display: 'block'
                        }}
                      >
                        Top Performer Definition
                      </label>
                      <select
                        value={policyConfig.topPerformerDefinition}
                        onChange={(e) => updatePolicyConfig({ topPerformerDefinition: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          borderColor: 'var(--border-input)',
                          fontSize: 'var(--font-size-sm)'
                        }}
                      >
                        <option value="Top 20% Sales">Top 20% Umsatz</option>
                        <option value="Top 30% Sales">Top 30% Umsatz</option>
                        <option value="A-Stores">A-Filialen</option>
                      </select>
                    </div>
                  )}

                  {/* MinFill Percentage */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      MinFill-Prozentsatz: {policyConfig.minFillPercentage}%
                    </label>
                    <input
                      type="range"
                      min={50}
                      max={100}
                      step={5}
                      value={policyConfig.minFillPercentage}
                      onChange={(e) => updatePolicyConfig({ minFillPercentage: Number(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  {/* Fairness Factor */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)'
                      }}
                    >
                      Fairness-Faktor α: {policyConfig.fairnessFactor}
                      <FormulaTooltip
                        formula="Fairness = α × Equal_Distribution + (1 - α) × Performance_Weight"
                        inputs={[
                          { symbol: 'α', value: policyConfig.fairnessFactor, source: 'Slider' },
                          { symbol: 'Equal_Distribution', value: '1.0', source: 'Gleichverteilung' },
                          { symbol: 'Performance_Weight', value: '0.85', source: 'Performance-Gewichtung' }
                        ]}
                        explanation="Ein höherer Fairness-Faktor führt zu gleichmäßigerer Verteilung, ein niedrigerer zu stärkerer Performance-Gewichtung."
                      />
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={policyConfig.fairnessFactor}
                      onChange={(e) => updatePolicyConfig({ fairnessFactor: Number(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between mt-1" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      <span>0 (Performance)</span>
                      <span>0.5</span>
                      <span>1 (Gleichverteilung)</span>
                    </div>
                  </div>

                  {/* Objective Function */}
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-info-subtle)',
                      border: '1px solid var(--border-info)'
                    }}
                  >
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--status-info)',
                        marginBottom: 'var(--space-2)'
                      }}
                    >
                      Zielfunktion
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      max Σ (w<sub>i,s</sub> × x<sub>i,s</sub>) − μ × Underfill − λ × Overcap
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 5 && (
                <div className="space-y-6">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--space-4)'
                    }}
                  >
                    Fallback & MinFill
                  </h3>

                  {/* Allow Fallback */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyConfig.allowFallback}
                      onChange={(e) => updatePolicyConfig({ allowFallback: e.target.checked })}
                      className="rounded"
                    />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      Fallback erlauben
                    </span>
                  </label>

                  {policyConfig.allowFallback && (
                    <>
                      {/* Fallback Strategy */}
                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            marginBottom: 'var(--space-2)',
                            display: 'block'
                          }}
                        >
                          Fallback-Strategie
                        </label>
                        <select
                          value={policyConfig.fallbackStrategy}
                          onChange={(e) => updatePolicyConfig({ fallbackStrategy: e.target.value as FallbackStrategy })}
                          className="w-full px-3 py-2 rounded-lg border"
                          style={{
                            borderColor: 'var(--border-input)',
                            fontSize: 'var(--font-size-sm)'
                          }}
                        >
                          <option value="Core/NOS substitution">Core/NOS Substitution</option>
                          <option value="Fairness redistribution">Fairness Redistribution</option>
                          <option value="Rule-based replacement">Regelbasierte Ersetzung</option>
                        </select>
                      </div>

                      {/* Fallback Threshold */}
                      <div>
                        <label
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-medium)',
                            marginBottom: 'var(--space-2)',
                            display: 'block'
                          }}
                        >
                          Fallback-Schwelle: {policyConfig.fallbackThreshold}%
                        </label>
                        <input
                          type="range"
                          min={50}
                          max={100}
                          step={5}
                          value={policyConfig.fallbackThreshold}
                          onChange={(e) => updatePolicyConfig({ fallbackThreshold: Number(e.target.value) })}
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {/* MinFill Profile */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      MinFill-Profil
                    </label>
                    <select
                      value={policyConfig.minFillProfile}
                      onChange={(e) => updatePolicyConfig({ minFillProfile: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: 'var(--border-input)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="Core">Core</option>
                      <option value="Premium">Premium</option>
                      <option value="Small Store">Small Store</option>
                    </select>
                  </div>

                  {/* Trigger Rule */}
                  <div
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-warning-subtle)',
                      border: '1px solid var(--status-warning)'
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
                      Fallback-Trigger
                    </div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      Fallback wird aktiviert wenn:
                      <ul className="mt-2 ml-4 space-y-1">
                        <li>• Supply &lt; Demand UND SpaceDemand &gt; Capacity</li>
                        <li>• ODER ForecastFulfillment &lt; {policyConfig.fallbackThreshold}%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 6 && (
                <div className="space-y-6">
                  <h3
                    style={{
                      fontSize: 'var(--font-size-md)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--space-4)'
                    }}
                  >
                    LOT / Größe / Pack
                  </h3>

                  {/* Enforce Pack Size */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyConfig.enforcePackSize}
                      onChange={(e) => updatePolicyConfig({ enforcePackSize: e.target.checked })}
                      className="rounded"
                    />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      Packgröße erzwingen
                    </span>
                  </label>

                  {/* Pack Size */}
                  {policyConfig.enforcePackSize && (
                    <div>
                      <label
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          marginBottom: 'var(--space-2)',
                          display: 'block'
                        }}
                      >
                        Packgröße
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={policyConfig.packSize}
                        onChange={(e) => updatePolicyConfig({ packSize: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          borderColor: 'var(--border-input)',
                          fontSize: 'var(--font-size-sm)'
                        }}
                      />
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Aus Artikelparameter
                      </div>
                    </div>
                  )}

                  {/* Size Curve Active */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyConfig.sizeCurveActive}
                      onChange={(e) => updatePolicyConfig({ sizeCurveActive: e.target.checked })}
                      className="rounded"
                    />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      Größenkurve aktiv
                    </span>
                  </label>

                  {/* Min Sizes Per Store */}
                  {policyConfig.sizeCurveActive && (
                    <div>
                      <label
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                          marginBottom: 'var(--space-2)',
                          display: 'block'
                        }}
                      >
                        Min. Größen pro Filiale
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={policyConfig.minSizesPerStore}
                        onChange={(e) => updatePolicyConfig({ minSizesPerStore: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border"
                        style={{
                          borderColor: 'var(--border-input)',
                          fontSize: 'var(--font-size-sm)'
                        }}
                      />
                    </div>
                  )}

                  {/* Repair Mode */}
                  <div>
                    <label
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      Reparatur-Modus
                    </label>
                    <select
                      value={policyConfig.repairMode}
                      onChange={(e) => updatePolicyConfig({ repairMode: e.target.value as RepairMode })}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: 'var(--border-input)',
                        fontSize: 'var(--font-size-sm)'
                      }}
                    >
                      <option value="Strict">Strict (Ablehnen bei Verletzung)</option>
                      <option value="Best Effort">Best Effort (Bestmöglich reparieren)</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div
        className="overflow-y-auto border-l"
        style={{
          width: '25%',
          minWidth: '300px',
          backgroundColor: 'var(--surface-subtle)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="p-4 space-y-6">
          {/* Variant Comparison */}
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-3)'
              }}
            >
              Vergleich
            </h3>
            <div>
              <label
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: 'var(--space-2)',
                  display: 'block',
                  color: 'var(--text-muted)'
                }}
              >
                Baseline-Variante
              </label>
              <select
                className="w-full px-3 py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--border-input)',
                  fontSize: 'var(--font-size-sm)',
                  backgroundColor: 'var(--surface-page)'
                }}
              >
                <option>Standard HW 2025</option>
                <option>SW 2025 - Baseline</option>
              </select>
            </div>

            {/* Simple KPI Table */}
            <div className="mt-4 space-y-2">
              {[
                { label: 'Supply', value: '85.6%', delta: -6.9, baseline: '92.5%' },
                { label: 'Forecast', value: '95.2%', delta: 6.9, baseline: '88.3%' },
                { label: 'Capacity', value: '82.4%', delta: 1.2, baseline: '81.2%' }
              ].map(item => (
                <div
                  key={item.label}
                  className="p-2 rounded"
                  style={{ backgroundColor: 'var(--surface-page)' }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      {item.label}
                    </span>
                    <span
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: item.delta > 0 ? 'var(--status-success)' : 'var(--status-danger)'
                      }}
                    >
                      {item.delta > 0 ? '+' : ''}{item.delta}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                      {item.value}
                    </span>
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      vs {item.baseline}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation */}
          <div>
            <h3
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-3)'
              }}
            >
              Validierung
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Empfänger gültig', status: true },
                { label: 'Liefertermine gültig', status: true },
                { label: 'Kapazitäts-Snapshot vorhanden', status: true },
                { label: 'Parameter vollständig', status: true },
                { label: 'Keine blockierenden Ausnahmen', status: false }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {item.status ? (
                    <CheckCircle size={16} style={{ color: 'var(--status-success)' }} />
                  ) : (
                    <AlertTriangle size={16} style={{ color: 'var(--status-warning)' }} />
                  )}
                  <span
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: item.status ? 'var(--text-primary)' : 'var(--status-warning)'
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <button
              className="w-full mt-4 px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--button-secondary-border)',
                color: 'var(--button-secondary-text)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Validieren
            </button>
          </div>

          {/* Release */}
          {selectedVariant.status === 'Validated' && (
            <div>
              <h3
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-3)'
                }}
              >
                Freigabe
              </h3>
              <div className="space-y-3">
                <div>
                  <label
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      marginBottom: 'var(--space-2)',
                      display: 'block',
                      color: 'var(--text-muted)'
                    }}
                  >
                    Kommentar (Pflichtfeld)
                  </label>
                  <textarea
                    placeholder="Freigabekommentar..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border"
                    style={{
                      borderColor: 'var(--border-input)',
                      fontSize: 'var(--font-size-sm)',
                      backgroundColor: 'var(--surface-page)',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <button
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  Variante freigeben
                </button>
              </div>
            </div>
          )}

          {/* Transfer to Allocation Run */}
          {selectedVariant.status === 'Released' && (
            <div>
              <h3
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-3)'
                }}
              >
                Allokations-Run
              </h3>
              <button
                onClick={() => onNavigateToAllocationRun?.(selectedVariant.id)}
                className="w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--text-inverse)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                <Rocket size={18} />
                Zu Allokations-Run übertragen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
