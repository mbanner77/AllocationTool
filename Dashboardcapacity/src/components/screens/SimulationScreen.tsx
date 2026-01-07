import { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n';
import { ChevronLeft, AlertCircle, Info, CheckCircle, TrendingUp, TrendingDown, Circle, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Article {
  id: string;
  articleNumber: string;
  color: string;
  colorHex: string;
  description: string;
  articleGroup: string;
  season: string;
  deliveryFrom: string;
  deliveryTo: string;
  stockDC: number;
  capacityNeed: string;
  capacityImpact: 'Überkapazität' | 'Untererfüllung' | 'Ausgeglichen';
  capacityImpactReason: string[];
}

interface SimulationScreenProps {
  articles: Article[];
  onBack: () => void;
  onAccept: (deliveryOption: string, customDates?: { from: string; to: string }) => void;
  onDiscard: () => void;
  onRelease: () => void;
}

type DeliveryOption = 'planned' | 'plus1week' | 'plus2weeks' | 'minus1week' | 'split' | 'custom';
type Severity = 'info' | 'critical' | 'blocking';

interface Issue {
  id: string;
  message: string;
  severity: Severity;
}

const CAPACITY_COLORS = {
  'Überkapazität': '#ef4444',
  'Untererfüllung': '#3b82f6',
  'Ausgeglichen': '#10b981'
};

const CAPACITY_ICONS = {
  'Überkapazität': TrendingUp,
  'Untererfüllung': TrendingDown,
  'Ausgeglichen': Circle
};

const SEVERITY_CONFIG = {
  'info': {
    label: 'Hinweis',
    color: '#3b82f6',
    icon: Info
  },
  'critical': {
    label: 'Kritisch',
    color: '#f59e0b',
    icon: AlertCircle
  },
  'blocking': {
    label: 'Blockierend',
    color: '#ef4444',
    icon: AlertCircle
  }
};

export function SimulationScreen({ articles, onBack, onAccept, onDiscard, onRelease }: SimulationScreenProps) {
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('planned');
  const [isSimulating, setIsSimulating] = useState(false);
  const [customDeliveryFrom, setCustomDeliveryFrom] = useState('');
  const [customDeliveryTo, setCustomDeliveryTo] = useState('');
  
  // Calculate context summary
  const totalArticles = articles.length;
  const seasons = Array.from(new Set(articles.map(a => a.season)));
  const articleGroups = Array.from(new Set(articles.map(a => a.articleGroup)));
  
  const originalDeliveryFrom = useMemo(() => {
    const dates = articles.map(a => new Date(a.deliveryFrom));
    return new Date(Math.min(...dates.map(d => d.getTime())));
  }, [articles]);
  
  const originalDeliveryTo = useMemo(() => {
    const dates = articles.map(a => new Date(a.deliveryTo));
    return new Date(Math.max(...dates.map(d => d.getTime())));
  }, [articles]);
  
  // Simulate capacity results based on delivery option
  const simulationResults = useMemo(() => {
    // Mock simulation - in real app this would be calculated
    const baseUtilization = 75;
    const optionImpact = {
      'planned': 0,
      'plus1week': -5,
      'plus2weeks': -8,
      'minus1week': 10,
      'split': -12,
      'custom': customDeliveryFrom && customDeliveryTo ? -6 : 0
    };
    
    const actualUtilization = baseUtilization + (optionImpact[deliveryOption] || 0);
    const targetUtilization = 80;
    const deviation = actualUtilization - targetUtilization;
    const affectedStores = Math.abs(deviation) > 10 ? 3 : deviation > 5 ? 1 : 0;
    
    return {
      actualUtilization,
      targetUtilization,
      deviation,
      affectedStores
    };
  }, [deliveryOption, customDeliveryFrom, customDeliveryTo]);
  
  // Mock capacity by category data
  const capacityByCategory = useMemo(() => {
    return [
      { category: 'Shoes', soll: 120, ist: 135, status: 'Überkapazität' },
      { category: 'Apparel', soll: 150, ist: 145, status: 'Ausgeglichen' },
      { category: 'Accessories', soll: 80, ist: 65, status: 'Untererfüllung' },
      { category: 'Electronics', soll: 50, ist: 48, status: 'Ausgeglichen' }
    ];
  }, []);
  
  // Mock monthly distribution
  const monthlyDistribution = useMemo(() => {
    return [
      { month: 'Jan 25', Überkapazität: 5, Ausgeglichen: 20, Untererfüllung: 3 },
      { month: 'Feb 25', Überkapazität: 8, Ausgeglichen: 15, Untererfüllung: 5 },
      { month: 'Mär 25', Überkapazität: 12, Ausgeglichen: 10, Untererfüllung: 2 },
      { month: 'Apr 25', Überkapazität: 3, Ausgeglichen: 18, Untererfüllung: 4 },
      { month: 'Mai 25', Überkapazität: 2, Ausgeglichen: 22, Untererfüllung: 1 }
    ];
  }, []);
  
  // Detect issues
  const issues: Issue[] = useMemo(() => {
    const detected: Issue[] = [];
    
    if (simulationResults.actualUtilization > 90) {
      detected.push({
        id: '1',
        message: `Überkapazität in ${simulationResults.affectedStores} Stores (> 90%)`,
        severity: 'critical'
      });
    }
    
    if (simulationResults.deviation > 15) {
      detected.push({
        id: '2',
        message: 'Kategorie Shoes überschreitet SOLL-Kapazität um 12%',
        severity: 'critical'
      });
    }
    
    const underCapacityCount = articles.filter(a => a.capacityImpact === 'Untererfüllung').length;
    if (underCapacityCount > 0) {
      detected.push({
        id: '3',
        message: `Untererfüllung in Kategorie Accessories (${underCapacityCount} Artikel)`,
        severity: 'info'
      });
    }
    
    const overCapacityCount = articles.filter(a => a.capacityImpact === 'Überkapazität').length;
    if (overCapacityCount > 2) {
      detected.push({
        id: '4',
        message: `Größenlauf-Konflikte: ${overCapacityCount} Artikel betroffen`,
        severity: 'info'
      });
    }
    
    return detected;
  }, [simulationResults, articles]);
  
  const handleDeliveryOptionChange = (option: DeliveryOption) => {
    setIsSimulating(true);
    setDeliveryOption(option);
    
    // Simulate recalculation
    setTimeout(() => {
      setIsSimulating(false);
    }, 800);
  };
  
  const getUtilizationColor = (utilization: number) => {
    if (utilization < 80) return '#10b981';
    if (utilization <= 90) return '#f59e0b';
    return '#ef4444';
  };
  
  const getSimulatedDeliveryWindow = () => {
    if (deliveryOption === 'custom' && customDeliveryFrom && customDeliveryTo) {
      return {
        from: new Date(customDeliveryFrom).toLocaleDateString('de-DE'),
        to: new Date(customDeliveryTo).toLocaleDateString('de-DE')
      };
    }
    
    const from = new Date(originalDeliveryFrom);
    const to = new Date(originalDeliveryTo);
    
    switch (deliveryOption) {
      case 'plus1week':
        from.setDate(from.getDate() + 7);
        to.setDate(to.getDate() + 7);
        break;
      case 'plus2weeks':
        from.setDate(from.getDate() + 14);
        to.setDate(to.getDate() + 14);
        break;
      case 'minus1week':
        from.setDate(from.getDate() - 7);
        to.setDate(to.getDate() - 7);
        break;
      case 'split':
        // Would split into two windows
        break;
    }
    
    return {
      from: from.toLocaleDateString('de-DE'),
      to: to.toLocaleDateString('de-DE')
    };
  };
  
  const simulatedWindow = getSimulatedDeliveryWindow();
  
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--surface-page)' }}>
      {/* Breadcrumb */}
      <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-page)' }}>
        <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
          Arbeitsvorrat › Simulation – Initiale Allokation
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 mb-4 hover:opacity-70"
            style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)' }}
          >
            <ChevronLeft size={16} />
            Zurück zum Arbeitsvorrat
          </button>
          
          <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
            Simulation – Initiale Allokation
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Bewertung der kapazitiven und zeitlichen Wirkung der ausgewählten Artikel
          </p>
        </div>
        
        {/* Context Summary */}
        <div 
          className="p-4 rounded-lg border"
          style={{ backgroundColor: 'var(--surface-page)', borderColor: 'var(--border-default)' }}
        >
          <div className="grid grid-cols-5 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                Anzahl Artikel
              </div>
              <div style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
                {totalArticles}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                Saisonen
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                {seasons.join(', ')}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                Artikelgruppen
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                {articleGroups.join(', ')}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                Ursprüngliches Lieferfenster (Plan)
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                {originalDeliveryFrom.toLocaleDateString('de-DE')} – {originalDeliveryTo.toLocaleDateString('de-DE')}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                Szenario
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                Initiale Allokation
              </div>
            </div>
          </div>
        </div>
        
        {/* Delivery Control */}
        <div 
          className="p-4 rounded-lg border"
          style={{ backgroundColor: 'var(--surface-page)', borderColor: 'var(--border-default)' }}
        >
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
            Liefertermin-Optionen
          </h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                Liefertermin (Plan)
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                {originalDeliveryFrom.toLocaleDateString('de-DE')} – {originalDeliveryTo.toLocaleDateString('de-DE')}
              </div>
            </div>
            
            <div>
              <label 
                style={{ 
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-1)',
                  display: 'block'
                }}
              >
                Liefertermin-Option
              </label>
              <div className="relative">
                <select
                  value={deliveryOption}
                  onChange={(e) => handleDeliveryOptionChange(e.target.value as DeliveryOption)}
                  className="px-3 py-2 border rounded-lg w-full"
                  style={{
                    borderColor: 'var(--border-input)',
                    height: 'var(--height-input-md)',
                    backgroundColor: 'var(--surface-page)'
                  }}
                  disabled={isSimulating}
                >
                  <option value="planned">Geplantes Lieferfenster</option>
                  <option value="plus1week">+1 Woche</option>
                  <option value="plus2weeks">+2 Wochen</option>
                  <option value="minus1week">-1 Woche</option>
                  <option value="custom">Manuelle Eingabe</option>
                  <option value="split" disabled>Aufteilen auf zwei Lieferfenster (bald verfügbar)</option>
                </select>
                {isSimulating && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <Loader2 size={16} className="animate-spin" style={{ color: 'var(--brand-primary)' }} />
                  </div>
                )}
              </div>
              {deliveryOption !== 'planned' && deliveryOption !== 'custom' && (
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-success)', marginTop: 'var(--space-1)' }}>
                  Simuliert: {simulatedWindow.from} – {simulatedWindow.to}
                </div>
              )}
              
              {/* Manual Date Input */}
              {deliveryOption === 'custom' && (
                <div className="mt-3 space-y-2">
                  <div>
                    <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: 'var(--space-1)' }}>
                      Liefertermin von
                    </label>
                    <input
                      type="date"
                      value={customDeliveryFrom}
                      onChange={(e) => {
                        setCustomDeliveryFrom(e.target.value);
                        if (e.target.value && customDeliveryTo) {
                          setIsSimulating(true);
                          setTimeout(() => setIsSimulating(false), 800);
                        }
                      }}
                      className="px-3 py-2 border rounded-lg w-full"
                      style={{
                        borderColor: 'var(--border-input)',
                        height: 'var(--height-input-md)',
                        backgroundColor: 'var(--surface-page)'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: 'var(--space-1)' }}>
                      Liefertermin bis
                    </label>
                    <input
                      type="date"
                      value={customDeliveryTo}
                      onChange={(e) => {
                        setCustomDeliveryTo(e.target.value);
                        if (e.target.value && customDeliveryFrom) {
                          setIsSimulating(true);
                          setTimeout(() => setIsSimulating(false), 800);
                        }
                      }}
                      className="px-3 py-2 border rounded-lg w-full"
                      style={{
                        borderColor: 'var(--border-input)',
                        height: 'var(--height-input-md)',
                        backgroundColor: 'var(--surface-page)'
                      }}
                    />
                  </div>
                  {customDeliveryFrom && customDeliveryTo && (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-success)' }}>
                      Simuliert: {new Date(customDeliveryFrom).toLocaleDateString('de-DE')} – {new Date(customDeliveryTo).toLocaleDateString('de-DE')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div 
            className="mt-3 px-3 py-2 rounded flex items-center gap-2"
            style={{ backgroundColor: 'var(--surface-info-subtle)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}
          >
            <Info size={14} />
            Terminänderungen wirken sich direkt auf Kapazität und Simulation aus.
          </div>
        </div>
        
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {/* IST-Auslastung */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
              IST-Auslastung (nach Simulation)
            </div>
            <div 
              style={{ 
                fontSize: 'var(--font-size-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                color: getUtilizationColor(simulationResults.actualUtilization)
              }}
            >
              {simulationResults.actualUtilization}%
            </div>
          </div>
          
          {/* SOLL-Auslastung */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
              SOLL-Auslastung
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
              {simulationResults.targetUtilization}%
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              Kapazitätsplanung
            </div>
          </div>
          
          {/* Abweichung */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
              Abweichung
            </div>
            <div 
              style={{ 
                fontSize: 'var(--font-size-2xl)', 
                fontWeight: 'var(--font-weight-semibold)',
                color: simulationResults.deviation > 0 ? '#ef4444' : simulationResults.deviation < -5 ? '#3b82f6' : '#10b981'
              }}
            >
              {simulationResults.deviation > 0 ? '+' : ''}{simulationResults.deviation}%
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              {simulationResults.deviation > 0 ? 'Überkapazität' : simulationResults.deviation < 0 ? 'Untererfüllung' : 'Ausgeglichen'}
            </div>
          </div>
          
          {/* Betroffene Stores */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
              Betroffene Stores
            </div>
            <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
              {simulationResults.affectedStores}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              Stores außerhalb SOLL-Rahmen
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-2 gap-6">
          {/* SOLL vs IST */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)',
              minHeight: '320px'
            }}
          >
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
              Kapazitätswirkung nach Simulation
            </h3>
            
            <ResponsiveContainer width="100%" height={250} minHeight={250}>
              <BarChart data={capacityByCategory}>
                <XAxis dataKey="category" style={{ fontSize: 'var(--font-size-xs)' }} />
                <YAxis style={{ fontSize: 'var(--font-size-xs)' }} label={{ value: 'm²', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="soll" name="SOLL" fill="var(--brand-primary)" opacity={0.6} />
                <Bar dataKey="ist" name="IST" fill="var(--brand-accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Zeitliche Verteilung */}
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)',
              minHeight: '320px'
            }}
          >
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
              Kapazitätsbelastung über Zeit
            </h3>
            
            <ResponsiveContainer width="100%" height={250} minHeight={250}>
              <BarChart data={monthlyDistribution}>
                <XAxis dataKey="month" style={{ fontSize: 'var(--font-size-xs)' }} />
                <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Überkapazität" stackId="a" fill="#ef4444" />
                <Bar dataKey="Ausgeglichen" stackId="a" fill="#10b981" />
                <Bar dataKey="Untererfüllung" stackId="a" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Issues */}
        {issues.length > 0 && (
          <div 
            className="p-4 rounded-lg border"
            style={{ backgroundColor: 'var(--surface-page)', borderColor: 'var(--border-default)' }}
          >
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
              Auffälligkeiten aus der Simulation
            </h3>
            
            <div className="space-y-2">
              {issues.map(issue => {
                const config = SEVERITY_CONFIG[issue.severity];
                const Icon = config.icon;
                
                return (
                  <div 
                    key={issue.id}
                    className="flex items-start gap-3 p-3 rounded"
                    style={{ backgroundColor: `${config.color}10` }}
                  >
                    <Icon size={18} style={{ color: config.color, flexShrink: 0, marginTop: '2px' }} />
                    <div className="flex-1">
                      <div style={{ fontSize: 'var(--font-size-sm)' }}>
                        {issue.message}
                      </div>
                    </div>
                    <span 
                      className="px-2 py-1 rounded"
                      style={{ 
                        backgroundColor: config.color,
                        color: 'white',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div 
              className="mt-3 px-3 py-2 rounded"
              style={{ backgroundColor: 'var(--surface-info-subtle)', fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}
            >
              Hinweis: Nicht jede Auffälligkeit blockiert eine Freigabe.
            </div>
          </div>
        )}
        
        {/* Article List */}
        <div 
          className="p-4 rounded-lg border"
          style={{ backgroundColor: 'var(--surface-page)', borderColor: 'var(--border-default)' }}
        >
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
            Artikelliste ({articles.length})
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                    Artikelnummer
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                    Farbe
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                    Artikelbeschreibung
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                    Kapazitätswirkung
                  </th>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                    Liefertermin (Simulation)
                  </th>
                </tr>
              </thead>
              <tbody>
                {articles.map(article => {
                  const Icon = CAPACITY_ICONS[article.capacityImpact];
                  
                  return (
                    <tr key={article.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 8px' }}>
                        <code
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            fontFamily: 'var(--font-family-mono)',
                            backgroundColor: 'var(--surface-code-block)',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          {article.articleNumber}
                        </code>
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{
                              backgroundColor: article.colorHex,
                              borderColor: 'var(--border-default)'
                            }}
                          />
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>{article.color}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: 'var(--font-size-sm)' }}>
                        {article.description}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <div
                          className="flex items-center gap-2 px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: `${CAPACITY_COLORS[article.capacityImpact]}15`,
                            color: CAPACITY_COLORS[article.capacityImpact],
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-medium)',
                            width: 'fit-content'
                          }}
                        >
                          <Icon size={14} />
                          <span>{article.capacityImpact}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: 'var(--font-size-sm)' }}>
                        {simulatedWindow.from} – {simulatedWindow.to}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Spacer for sticky footer */}
        <div style={{ height: '100px' }} />
      </div>
      
      {/* Sticky Footer */}
      <div 
        className="sticky bottom-0 px-6 py-4 border-t flex items-center justify-end gap-3"
        style={{ 
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-subtle)',
          height: '72px'
        }}
      >
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--button-secondary-bg)',
            borderColor: 'var(--button-secondary-border)',
            color: 'var(--button-secondary-text)',
            height: 'var(--height-button-md)'
          }}
        >
          Zurück zum Arbeitsvorrat
        </button>
        
        <button
          onClick={onDiscard}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--button-secondary-bg)',
            borderColor: 'var(--button-secondary-border)',
            color: 'var(--button-secondary-text)',
            height: 'var(--height-button-md)'
          }}
        >
          Simulation verwerfen
        </button>
        
        <button
          onClick={() => {
            if (deliveryOption === 'custom' && customDeliveryFrom && customDeliveryTo) {
              onAccept(deliveryOption, { from: customDeliveryFrom, to: customDeliveryTo });
            } else {
              onAccept(deliveryOption);
            }
          }}
          className="px-4 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--button-primary-bg)',
            color: 'var(--button-primary-text)',
            height: 'var(--height-button-md)'
          }}
        >
          Simulation übernehmen
        </button>
        
        <button
          onClick={onRelease}
          className="px-4 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--brand-primary)',
            color: 'var(--text-inverse)',
            height: 'var(--height-button-md)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          Allokation freigeben
        </button>
      </div>
    </div>
  );
}
