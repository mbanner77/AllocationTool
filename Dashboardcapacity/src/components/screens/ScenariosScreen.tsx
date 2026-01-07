import { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n';
import {
  Lock,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  Play,
  Copy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Package,
  Users,
  Calendar
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DataGrid, Column } from '../common/DataGrid';

interface ScenariosScreenProps {
  onNavigate: (screen: string) => void;
}

type VariantStatus = 'draft' | 'simulated' | 'validated' | 'approved' | 'transferred';

interface Variant {
  id: string;
  name: string;
  status: VariantStatus;
  capacityDeviation: number;
  criticalExceptions: number;
  lastSimulation: string;
  overCapacity: number;
  underCapacity: number;
  forecastCoverage: number;
  storeCount: number;
  articleCount: number;
  validationResults?: {
    recipientDetermination: boolean;
    deliveryDates: boolean;
    availability: boolean;
    capacityAssumptions: boolean;
    blockingExceptions: boolean;
  };
}

const STATUS_CONFIG = {
  draft: {
    label: 'Entwurf',
    color: '#94a3b8',
    bgColor: '#f1f5f9',
    icon: FileText
  },
  simulated: {
    label: 'Simuliert',
    color: '#2563eb',
    bgColor: '#dbeafe',
    icon: BarChart3
  },
  validated: {
    label: 'Validiert',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    icon: CheckCircle
  },
  approved: {
    label: 'Freigegeben',
    color: '#10b981',
    bgColor: '#d1fae5',
    icon: CheckCircle
  },
  transferred: {
    label: 'Zur Umsetzung übertragen',
    color: '#059669',
    bgColor: '#d1fae5',
    icon: Lock
  }
};

const MOCK_VARIANTS: Variant[] = [
  {
    id: 'var-001',
    name: 'Basisvariante – Standard',
    status: 'transferred',
    capacityDeviation: 120,
    criticalExceptions: 0,
    lastSimulation: '2025-01-10 14:30',
    overCapacity: 450,
    underCapacity: 330,
    forecastCoverage: 94.5,
    storeCount: 42,
    articleCount: 1250,
    validationResults: {
      recipientDetermination: true,
      deliveryDates: true,
      availability: true,
      capacityAssumptions: true,
      blockingExceptions: true
    }
  },
  {
    id: 'var-002',
    name: 'Optimierte Verteilung – A-Stores',
    status: 'approved',
    capacityDeviation: 85,
    criticalExceptions: 2,
    lastSimulation: '2025-01-12 09:15',
    overCapacity: 380,
    underCapacity: 295,
    forecastCoverage: 96.2,
    storeCount: 42,
    articleCount: 1250,
    validationResults: {
      recipientDetermination: true,
      deliveryDates: true,
      availability: true,
      capacityAssumptions: true,
      blockingExceptions: true
    }
  },
  {
    id: 'var-003',
    name: 'Gleichverteilung – Regional',
    status: 'validated',
    capacityDeviation: 210,
    criticalExceptions: 5,
    lastSimulation: '2025-01-13 16:45',
    overCapacity: 520,
    underCapacity: 310,
    forecastCoverage: 92.8,
    storeCount: 42,
    articleCount: 1250,
    validationResults: {
      recipientDetermination: true,
      deliveryDates: true,
      availability: true,
      capacityAssumptions: false,
      blockingExceptions: true
    }
  },
  {
    id: 'var-004',
    name: 'Test – Konservative Allokation',
    status: 'simulated',
    capacityDeviation: 95,
    criticalExceptions: 1,
    lastSimulation: '2025-01-14 11:20',
    overCapacity: 320,
    underCapacity: 225,
    forecastCoverage: 89.5,
    storeCount: 42,
    articleCount: 1250
  },
  {
    id: 'var-005',
    name: 'Entwurf – Saisonbereinigt',
    status: 'draft',
    capacityDeviation: 0,
    criticalExceptions: 0,
    lastSimulation: '—',
    overCapacity: 0,
    underCapacity: 0,
    forecastCoverage: 0,
    storeCount: 42,
    articleCount: 1250
  }
];

// Mock data for comparison charts
const CAPACITY_COMPARISON = [
  { category: 'Schuhe', variant1: 450, variant2: 380, variant3: 520 },
  { category: 'Oberbekleidung', variant1: -280, variant2: -350, variant3: -200 },
  { category: 'Hosen', variant1: 120, variant2: 95, variant3: 210 },
  { category: 'Accessoires', variant1: -150, variant2: -120, variant3: -180 }
];

const FORECAST_TREND = [
  { week: 'KW 1', forecast: 4500, variant1: 4200, variant2: 4350, variant3: 4100 },
  { week: 'KW 2', forecast: 5000, variant1: 4800, variant2: 4900, variant3: 4600 },
  { week: 'KW 3', forecast: 4800, variant1: 4600, variant2: 4700, variant3: 4450 },
  { week: 'KW 4', forecast: 5500, variant1: 5300, variant2: 5400, variant3: 5100 }
];

export function ScenariosScreen({ onNavigate }: ScenariosScreenProps) {
  const { t } = useLanguage();
  const [selectedScenario, setSelectedScenario] = useState('fs25-initial');
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(MOCK_VARIANTS[1]);
  const [activeTab, setActiveTab] = useState<'overview' | 'capacity' | 'forecast' | 'exceptions'>('overview');
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [validationRunning, setValidationRunning] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');
  const [transferType, setTransferType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  const handleValidationStart = () => {
    setValidationRunning(true);
    // Simulate validation process
    setTimeout(() => {
      setValidationRunning(false);
      setShowValidationModal(true);
    }, 2000);
  };

  const handleApproveVariant = () => {
    if (!approvalReason.trim()) {
      alert('Bitte geben Sie eine Begründung ein.');
      return;
    }
    
    if (selectedVariant) {
      const updatedVariant = { ...selectedVariant, status: 'approved' as VariantStatus };
      setSelectedVariant(updatedVariant);
      setApprovalReason('');
      alert('Variante erfolgreich freigegeben');
    }
  };

  const handleTransferToRun = () => {
    if (transferType === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      alert('Bitte wählen Sie Datum und Uhrzeit für die geplante Ausführung.');
      return;
    }

    // Simulate transfer
    if (selectedVariant) {
      const updatedVariant = { ...selectedVariant, status: 'transferred' as VariantStatus };
      setSelectedVariant(updatedVariant);
      setShowTransferModal(false);
      alert('Allokationslauf wurde erfolgreich erzeugt');
      // Would navigate to runs screen
      // onNavigate('runs');
    }
  };

  const handleDuplicateVariant = () => {
    alert('Neue Variante wird erstellt (basierend auf aktueller Variante)');
  };

  const canValidate = selectedVariant?.status === 'simulated';
  const canApprove = selectedVariant?.status === 'validated';
  const canTransfer = selectedVariant?.status === 'approved';
  const isTransferred = selectedVariant?.status === 'transferred';

  const statusConfig = selectedVariant ? STATUS_CONFIG[selectedVariant.status] : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="flex h-screen" style={{ backgroundColor: 'var(--surface-base)' }}>
      {/* LEFT SIDEBAR - Scenario & Variants */}
      <div
        className="flex-shrink-0 border-r overflow-y-auto"
        style={{
          width: '300px',
          backgroundColor: 'var(--surface-alt)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="p-4">
          {/* Scenario Selection */}
          <div className="mb-6">
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: '6px',
                color: 'var(--text-muted)'
              }}
            >
              {t.scenarios.scenario}
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border"
              style={{
                borderColor: 'var(--border-default)',
                backgroundColor: 'var(--surface-page)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              <option value="fs25-initial">FS25 – Erstallokation</option>
              <option value="hw25-initial">HW25 – Erstallokation</option>
              <option value="fs25-replenishment">FS25 – Nachschub</option>
            </select>
          </div>

          {/* Variants List */}
          <div>
            <div
              style={{
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: '12px',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {t.scenarios.variants} ({MOCK_VARIANTS.length})
            </div>

            <div className="space-y-2">
              {MOCK_VARIANTS.map((variant) => {
                const config = STATUS_CONFIG[variant.status];
                const Icon = config.icon;
                const isSelected = selectedVariant?.id === variant.id;

                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className="w-full text-left p-3 rounded-lg border transition-all"
                    style={{
                      backgroundColor: isSelected ? 'var(--surface-page)' : 'transparent',
                      borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-subtle)',
                      borderWidth: isSelected ? '2px' : '1px'
                    }}
                  >
                    {/* Variant Name & Status */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', flex: 1 }}>
                        {variant.name}
                      </div>
                      <div
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: config.bgColor,
                          color: config.color,
                          fontSize: 'var(--font-size-xs)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Icon size={12} />
                        <span>{config.label}</span>
                      </div>
                    </div>

                    {/* Mini KPIs */}
                    {variant.status !== 'draft' && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between" style={{ fontSize: 'var(--font-size-xs)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{t.scenarios.overUnderCoverage}:</span>
                          <span
                            style={{
                              fontWeight: 'var(--font-weight-medium)',
                              color: variant.capacityDeviation > 0 ? '#ef4444' : '#10b981'
                            }}
                          >
                            {variant.capacityDeviation > 0 ? '+' : ''}{variant.capacityDeviation} m²
                          </span>
                        </div>
                        <div className="flex items-center justify-between" style={{ fontSize: 'var(--font-size-xs)' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Kritische Ausnahmen:</span>
                          <span
                            style={{
                              fontWeight: 'var(--font-weight-medium)',
                              color: variant.criticalExceptions > 0 ? '#ef4444' : 'var(--text-primary)'
                            }}
                          >
                            {variant.criticalExceptions}
                          </span>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <Clock size={10} className="inline mr-1" />
                          {variant.lastSimulation}
                        </div>
                      </div>
                    )}

                    {variant.status === 'draft' && (
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Noch nicht simuliert
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE - Comparison Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-2)'
                }}
              >
                {t.scenariosScreen.title}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                {t.scenariosScreen.subtitle}
              </p>
            </div>
            <button
              onClick={() => onNavigate('scenarioManagement')}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--text-inverse)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                whiteSpace: 'nowrap'
              }}
            >
              Erweiterte Ansicht →
            </button>
          </div>

          {!selectedVariant && (
            <div
              className="p-12 text-center rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)'
              }}
            >
              <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                Wählen Sie eine Variante aus, um Details anzuzeigen
              </p>
            </div>
          )}

          {selectedVariant && selectedVariant.status !== 'draft' && (
            <>
              {/* KPI Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-page)',
                    borderColor: 'var(--border-default)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {t.scenarios.overCapacity}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: '#ef4444' }}>
                    +{selectedVariant.overCapacity} m²
                  </div>
                </div>

                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-page)',
                    borderColor: 'var(--border-default)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {t.scenarios.underCapacity}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: '#3b82f6' }}>
                    -{selectedVariant.underCapacity} m²
                  </div>
                </div>

                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-page)',
                    borderColor: 'var(--border-default)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {t.scenarios.forecastCoverage}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                    {selectedVariant.forecastCoverage.toFixed(1)}%
                  </div>
                </div>

                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-page)',
                    borderColor: 'var(--border-default)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Kritische Ausnahmen
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: selectedVariant.criticalExceptions > 0 ? '#ef4444' : '#10b981'
                    }}
                  >
                    {selectedVariant.criticalExceptions}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
                {[
                  { key: 'overview', label: t.scenarios.overview },
                  { key: 'capacity', label: t.scenarios.capacity },
                  { key: 'forecast', label: t.scenarios.forecast },
                  { key: 'exceptions', label: t.scenarios.exceptions }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className="px-4 py-2 transition-colors"
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: activeTab === tab.key ? 'var(--brand-primary)' : 'var(--text-muted)',
                      borderBottom: activeTab === tab.key ? '2px solid var(--brand-primary)' : '2px solid transparent'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div>
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div
                      className="p-6 rounded-lg border"
                      style={{
                        backgroundColor: 'var(--surface-page)',
                        borderColor: 'var(--border-default)'
                      }}
                    >
                      <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '16px' }}>
                        {t.scenarios.variantDetails}
                      </h3>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            {t.scenarios.variantName}
                          </div>
                          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                            {selectedVariant.name}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Status
                          </div>
                          <div className="flex items-center gap-2">
                            {StatusIcon && <StatusIcon size={16} style={{ color: statusConfig?.color }} />}
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                              {statusConfig?.label}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Filialen
                          </div>
                          <div className="flex items-center gap-2">
                            <Users size={16} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                              {selectedVariant.storeCount}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Artikel
                          </div>
                          <div className="flex items-center gap-2">
                            <Package size={16} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                              {selectedVariant.articleCount.toLocaleString('de-DE')}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            Letzte Simulation
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                              {selectedVariant.lastSimulation}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'capacity' && (
                  <div
                    className="p-6 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface-page)',
                      borderColor: 'var(--border-default)'
                    }}
                  >
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '16px' }}>
                      Kapazitätsabweichung nach Kategorie
                    </h3>
                    <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0}>
                      <BarChart data={CAPACITY_COMPARISON}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="category" style={{ fontSize: 'var(--font-size-xs)' }} />
                        <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="variant1" fill="#2563eb" name="Basisvariante" />
                        <Bar dataKey="variant2" fill="#7c3aed" name="Optimierte Verteilung" />
                        <Bar dataKey="variant3" fill="#10b981" name="Gleichverteilung" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeTab === 'forecast' && (
                  <div
                    className="p-6 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface-page)',
                      borderColor: 'var(--border-default)'
                    }}
                  >
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '16px' }}>
                      {t.scenarios.forecastVsAllocation}
                    </h3>
                    <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0}>
                      <LineChart data={FORECAST_TREND}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="week" style={{ fontSize: 'var(--font-size-xs)' }} />
                        <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" name="Prognose" />
                        <Line type="monotone" dataKey="variant1" stroke="#2563eb" strokeWidth={2} name="Basisvariante" />
                        <Line type="monotone" dataKey="variant2" stroke="#7c3aed" strokeWidth={2} name="Optimierte Verteilung" />
                        <Line type="monotone" dataKey="variant3" stroke="#10b981" strokeWidth={2} name="Gleichverteilung" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {activeTab === 'exceptions' && (
                  <div
                    className="p-6 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface-page)',
                      borderColor: 'var(--border-default)'
                    }}
                  >
                    <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '16px' }}>
                      Ausnahmen & Risiken
                    </h3>
                    {selectedVariant.criticalExceptions > 0 ? (
                      <div className="space-y-2">
                        <div
                          className="p-4 rounded-lg border-l-4 cursor-pointer hover:bg-surface-tint transition-colors"
                          style={{
                            backgroundColor: 'var(--surface-warning-subtle)',
                            borderColor: 'var(--status-warning)'
                          }}
                          onClick={() => alert('Navigation zum Exception-Cockpit (read-only)')}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <AlertTriangle size={20} style={{ color: 'var(--status-warning)' }} />
                              <div>
                                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                                  Kapazitätsüberschreitung bei Store Z-001
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  Kategorie: Schuhe | Überschreitung: +35 m²
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          className="p-4 rounded-lg border-l-4 cursor-pointer hover:bg-surface-tint transition-colors"
                          style={{
                            backgroundColor: 'var(--surface-warning-subtle)',
                            borderColor: 'var(--status-warning)'
                          }}
                          onClick={() => alert('Navigation zum Exception-Cockpit (read-only)')}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <AlertTriangle size={20} style={{ color: 'var(--status-warning)' }} />
                              <div>
                                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                                  Fehlende Größenverteilung bei Artikel A-4532
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  Kategorie: Hosen | Betroffene Filialen: 12
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="p-6 text-center rounded-lg"
                        style={{
                          backgroundColor: 'var(--surface-success-subtle)',
                          color: 'var(--status-success)'
                        }}
                      >
                        <CheckCircle size={32} className="mx-auto mb-2" />
                        <p style={{ fontSize: 'var(--font-size-sm)' }}>Keine kritischen Ausnahmen</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {selectedVariant && selectedVariant.status === 'draft' && (
            <div
              className="p-8 text-center rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)'
              }}
            >
              <BarChart3 size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: '16px' }}>
                Diese Variante wurde noch nicht simuliert
              </p>
              <button
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--text-inverse)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
                onClick={() => alert('Simulation starten (nicht implementiert)')}
              >
                Simulation starten
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR - Decision & Transfer */}
      <div
        className="flex-shrink-0 border-l overflow-y-auto"
        style={{
          width: '320px',
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="p-4">
          <h2
            style={{
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: '16px'
            }}
          >
            {t.scenarios.decisionAndHandover}
          </h2>

          {!selectedVariant && (
            <div className="text-center py-8">
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                Wählen Sie eine Variante aus
              </p>
            </div>
          )}

          {selectedVariant && (
            <div className="space-y-6">
              {/* Status Display */}
              <div
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: statusConfig?.bgColor,
                  borderColor: statusConfig?.color
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {StatusIcon && <StatusIcon size={20} style={{ color: statusConfig?.color }} />}
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: statusConfig?.color }}>
                    {statusConfig?.label}
                  </span>
                </div>
                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  {selectedVariant.status === 'simulated' && 'Simulation abgeschlossen – Validierung erforderlich'}
                  {selectedVariant.status === 'validated' && 'Alle Systemprüfungen bestanden'}
                  {selectedVariant.status === 'approved' && 'Variante ist zur Umsetzung freigegeben'}
                  {selectedVariant.status === 'transferred' && 'Variante wurde als Allokationslauf übertragen'}
                  {selectedVariant.status === 'draft' && 'Variante ist im Entwurfsstadium'}
                </p>
              </div>

              {/* Validation Section */}
              {canValidate && (
                <div>
                  <button
                    onClick={handleValidationStart}
                    disabled={validationRunning}
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: validationRunning ? 'var(--button-secondary-bg)' : 'var(--brand-primary)',
                      color: validationRunning ? 'var(--text-muted)' : 'var(--text-inverse)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    {validationRunning ? t.scenarios.validationRunning : t.scenarios.startValidation}
                  </button>
                  {validationRunning && (
                    <div className="mt-2 text-center">
                      <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Systemprüfungen werden durchgeführt...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Approval Section */}
              {canApprove && (
                <div className="space-y-3">
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
                      {t.scenarios.approvalReason} *
                    </label>
                    <textarea
                      value={approvalReason}
                      onChange={(e) => setApprovalReason(e.target.value)}
                      rows={4}
                      placeholder={t.scenarios.approvalPlaceholder}
                      className="w-full px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: 'var(--border-default)',
                        backgroundColor: 'var(--surface-page)',
                        fontSize: 'var(--font-size-sm)',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <button
                    onClick={handleApproveVariant}
                    disabled={!approvalReason.trim()}
                    className="w-full px-4 py-3 rounded-lg transition-colors"
                    style={{
                      backgroundColor: approvalReason.trim() ? 'var(--brand-primary)' : 'var(--button-secondary-bg)',
                      color: approvalReason.trim() ? 'var(--text-inverse)' : 'var(--text-muted)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    Variante freigeben
                  </button>
                </div>
              )}

              {/* Transfer Section */}
              {canTransfer && (
                <div>
                  <button
                    onClick={() => setShowTransferModal(true)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                      color: 'var(--text-inverse)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)'
                    }}
                  >
                    <Play size={16} className="inline mr-2" />
                    In Allokationslauf überführen
                  </button>
                </div>
              )}

              {/* Transferred Actions */}
              {isTransferred && (
                <div className="space-y-3">
                  <div
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: 'var(--surface-alt)',
                      border: '1px solid var(--border-default)'
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                        Variante gesperrt
                      </span>
                    </div>
                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      Diese Variante ist unveränderlich und wurde einem Allokationslauf zugeordnet.
                    </p>
                  </div>
                  <button
                    onClick={handleDuplicateVariant}
                    className="w-full px-4 py-2 rounded-lg border transition-colors hover:bg-surface-tint"
                    style={{
                      backgroundColor: 'var(--button-secondary-bg)',
                      borderColor: 'var(--button-secondary-border)',
                      color: 'var(--button-secondary-text)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    <Copy size={16} className="inline mr-2" />
                    Neue Variante erstellen
                  </button>
                </div>
              )}

              {/* Validation Results */}
              {selectedVariant.validationResults && selectedVariant.status !== 'simulated' && (
                <div
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    borderColor: 'var(--border-default)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '12px' }}>
                    {t.scenarios.validationResults}
                  </div>
                  <div className="space-y-2">
                    {Object.entries(selectedVariant.validationResults).map(([key, passed]) => {
                      const labels: Record<string, string> = {
                        recipientDetermination: 'Empfängerermittlung',
                        deliveryDates: 'Liefertermine',
                        availability: 'Verfügbarkeit',
                        capacityAssumptions: 'Kapazitätsannahmen',
                        blockingExceptions: 'Blockierende Ausnahmen'
                      };
                      return (
                        <div key={key} className="flex items-center justify-between">
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {labels[key]}
                          </span>
                          {passed ? (
                            <CheckCircle size={16} style={{ color: '#10b981' }} />
                          ) : (
                            <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Modal */}
      {showValidationModal && selectedVariant && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowValidationModal(false)}
        >
          <div
            className="rounded-lg shadow-xl max-w-lg w-full mx-4"
            style={{
              backgroundColor: 'var(--surface-page)',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                {t.scenarios.validationReport}
              </h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {selectedVariant.validationResults && Object.entries(selectedVariant.validationResults).map(([key, passed]) => {
                  const labels: Record<string, string> = {
                    recipientDetermination: 'Empfängerermittlung',
                    deliveryDates: 'Liefertermine',
                    availability: 'Verfügbarkeit',
                    capacityAssumptions: 'Kapazitätsannahmen',
                    blockingExceptions: 'Blockierende Ausnahmen'
                  };
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{
                        backgroundColor: passed ? 'var(--surface-success-subtle)' : 'var(--surface-error-subtle)'
                      }}
                    >
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {labels[key]}
                      </span>
                      {passed ? (
                        <CheckCircle size={20} style={{ color: '#10b981' }} />
                      ) : (
                        <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {Object.values(selectedVariant.validationResults || {}).every(Boolean) ? (
                <div
                  className="mt-6 p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface-success-subtle)',
                    color: 'var(--status-success)'
                  }}
                >
                  <CheckCircle size={20} className="inline mr-2" />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    Alle Prüfungen erfolgreich bestanden
                  </span>
                </div>
              ) : (
                <div
                  className="mt-6 p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface-error-subtle)',
                    color: 'var(--status-error)'
                  }}
                >
                  <AlertTriangle size={20} className="inline mr-2" />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    Einige Prüfungen sind fehlgeschlagen
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex gap-3" style={{ borderColor: 'var(--border-default)' }}>
              <button
                onClick={() => setShowValidationModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                Schließen
              </button>
              {Object.values(selectedVariant.validationResults || {}).every(Boolean) ? (
                <button
                  onClick={() => {
                    const updatedVariant = { ...selectedVariant, status: 'validated' as VariantStatus };
                    setSelectedVariant(updatedVariant);
                    setShowValidationModal(false);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  Variante als validiert markieren
                </button>
              ) : (
                <button
                  onClick={() => {
                    setShowValidationModal(false);
                    alert('Zurück zur Simulation (nicht implementiert)');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  Zur Simulation
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && selectedVariant && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={() => setShowTransferModal(false)}
        >
          <div
            className="rounded-lg shadow-xl max-w-2xl w-full mx-4"
            style={{
              backgroundColor: 'var(--surface-page)',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                Allokationslauf erzeugen
              </h2>
            </div>

            <div className="p-6 space-y-6">
              {/* Snapshot Info */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '12px' }}>
                  Snapshot (Read-Only)
                </h3>
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: 'var(--surface-alt)',
                    border: '1px solid var(--border-default)'
                  }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Szenario</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        FS25 – Erstallokation
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Variante</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        {selectedVariant.name}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Simulation-ID</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        SIM-{selectedVariant.id}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Lieferzeitraum</div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        KW 05-08 2025
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Options */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '12px' }}>
                  Ausführung
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-surface-tint transition-colors"
                    style={{
                      borderColor: transferType === 'immediate' ? 'var(--brand-primary)' : 'var(--border-default)',
                      backgroundColor: transferType === 'immediate' ? 'var(--surface-tint)' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="transfer-type"
                      value="immediate"
                      checked={transferType === 'immediate'}
                      onChange={(e) => setTransferType(e.target.value as any)}
                      style={{ accentColor: 'var(--brand-primary)' }}
                    />
                    <div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        Sofort starten
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Der Allokationslauf wird unmittelbar nach Bestätigung ausgeführt
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-surface-tint transition-colors"
                    style={{
                      borderColor: transferType === 'scheduled' ? 'var(--brand-primary)' : 'var(--border-default)',
                      backgroundColor: transferType === 'scheduled' ? 'var(--surface-tint)' : 'transparent'
                    }}
                  >
                    <input
                      type="radio"
                      name="transfer-type"
                      value="scheduled"
                      checked={transferType === 'scheduled'}
                      onChange={(e) => setTransferType(e.target.value as any)}
                      style={{ accentColor: 'var(--brand-primary)' }}
                    />
                    <div className="flex-1">
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        Geplant starten
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Der Allokationslauf startet zum angegebenen Zeitpunkt
                      </div>
                      {transferType === 'scheduled' && (
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                              Datum
                            </label>
                            <input
                              type="date"
                              value={scheduledDate}
                              onChange={(e) => setScheduledDate(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border"
                              style={{
                                borderColor: 'var(--border-default)',
                                fontSize: 'var(--font-size-sm)'
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                              Uhrzeit
                            </label>
                            <input
                              type="time"
                              value={scheduledTime}
                              onChange={(e) => setScheduledTime(e.target.value)}
                              className="w-full px-3 py-2 rounded-lg border"
                              style={{
                                borderColor: 'var(--border-default)',
                                fontSize: 'var(--font-size-sm)'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Warning */}
              <div
                className="p-4 rounded-lg border-l-4"
                style={{
                  backgroundColor: 'var(--surface-warning-subtle)',
                  borderColor: 'var(--status-warning)'
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} style={{ color: 'var(--status-warning)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: '4px' }}>
                      Wichtiger Hinweis
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                      Die Variante wird als unveränderlicher Snapshot für den Allokationslauf übernommen. 
                      Nach der Übertragung können keine Änderungen mehr vorgenommen werden.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex gap-3" style={{ borderColor: 'var(--border-default)' }}>
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  fontSize: 'var(--font-size-sm)'
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleTransferToRun}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--brand-primary)',
                  color: 'var(--text-inverse)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                Lauf erzeugen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
