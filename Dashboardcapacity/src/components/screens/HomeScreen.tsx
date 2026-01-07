import { useState, useEffect } from 'react';
import { Settings, Package, Briefcase, PlayCircle, AlertTriangle, BarChart3, Sliders, LayoutGrid, GitBranch, Layers } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { dataService } from '../../services/dataService';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

const FEATURE_CARDS = [
  {
    id: 'settings',
    title: 'Allokationseinstellungen',
    description: 'Konfigurieren Sie Zuweisungsregeln, Prioritäten und automatische Optimierungen',
    icon: Settings,
    color: 'var(--brand-primary)',
  },
  {
    id: 'parameters',
    title: 'Allokationsparameter',
    description: 'Zentrale Pflege von Kapazitäts-, Präsentations- und Steuerungsparametern',
    icon: Sliders,
    color: 'var(--status-info)',
  },
  {
    id: 'capacity',
    title: 'Kapazitätsplanung',
    description: 'Analysieren und optimieren Sie Raumkapazitäten mit Space-Fit-Visualisierung',
    icon: Package,
    color: 'var(--status-success)',
  },
  {
    id: 'cluster',
    title: 'Filial-Cluster',
    description: 'Filialen gruppieren & systemgestützt optimieren',
    icon: Layers,
    color: '#ec4899',
  },
  {
    id: 'storeLayout',
    title: 'Filiallayout & Warenträger',
    description: 'Visualisieren und planen Sie Verkaufsflächen mit Warenträger-Drag & Drop',
    icon: LayoutGrid,
    color: '#6366f1',
  },
  {
    id: 'work',
    title: 'Arbeitsvorrat',
    description: 'Verwalten Sie Allokationsaufgaben und erstellen Sie neue Zuweisungen',
    icon: Briefcase,
    color: 'var(--brand-accent)',
  },
  {
    id: 'runs',
    title: 'Ausführungs-Runs',
    description: 'Überwachen Sie laufende und abgeschlossene Allokationsprozesse',
    icon: PlayCircle,
    color: 'var(--status-warning)',
  },
  {
    id: 'scenarios',
    title: 'Szenario- & Variantenmanagement',
    description: 'Vergleichen, validieren und freigeben Sie Allokationsvarianten',
    icon: GitBranch,
    color: '#7c3aed',
  },
  {
    id: 'scenarioManagement',
    title: 'Erweiterte Variantenverwaltung',
    description: 'Policy-Parameter, Forecast-Logik, Explainability und Simulationsanalyse',
    icon: Sliders,
    color: '#8b5cf6',
  },
  {
    id: 'exceptions',
    title: 'Exception Cockpit',
    description: 'Behandeln Sie Ausnahmen und Konflikte in der Allokation',
    icon: AlertTriangle,
    color: 'var(--status-danger)',
  },
  {
    id: 'analytics',
    title: 'Analytics & Reports',
    description: 'Detaillierte Auswertungen und KPI-Dashboards',
    icon: BarChart3,
    color: 'var(--text-secondary)',
  },
];

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { state } = useApp();
  const [kpis, setKpis] = useState({ openTasks: 0, activeRuns: 0, openExceptions: 0 });

  // Load KPIs from dataService
  useEffect(() => {
    const loadKPIs = async () => {
      try {
        const data = await dataService.getKPIs();
        setKpis(data);
      } catch (error) {
        console.error('Failed to load KPIs:', error);
        // Fallback to state-based calculation
        const openTasks = state.tasks?.filter((t: { status: string }) => t.status === 'pending' || t.status === 'in_progress').length || 0;
        const activeRuns = state.runs?.filter((r: { status: string }) => r.status === 'running' || r.status === 'planned').length || 0;
        const openExceptions = state.exceptions?.filter((e: { status: string }) => e.status === 'open' || e.status === 'in_progress').length || 0;
        setKpis({ openTasks, activeRuns, openExceptions });
      }
    };
    loadKPIs();
  }, [state]);

  const { openTasks, activeRuns, openExceptions } = kpis;
  
  return (
    <div>
      <div className="mb-8">
        <h1 style={{ 
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--space-2)'
        }}>
          Willkommen im Allocation Tool
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Verwalten Sie Ihre Allokationsprozesse zentral und effizient
          {state.currentUser && ` • Angemeldet als ${state.currentUser.name}`}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURE_CARDS.map((card) => {
          const Icon = card.icon;
          
          return (
            <button
              key={card.id}
              onClick={() => onNavigate(card.id)}
              className="group text-left p-6 rounded-lg border transition-all"
              style={{
                backgroundColor: 'var(--surface-alt)',
                borderColor: 'var(--border-subtle)',
                borderRadius: 'var(--radius-lg)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.borderColor = card.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                style={{
                  backgroundColor: `${card.color}15`,
                  color: card.color
                }}
              >
                <Icon size={24} />
              </div>
              
              <h3 style={{ 
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-2)'
              }}>
                {card.title}
              </h3>
              
              <p style={{ 
                color: 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 'var(--line-height-sm)'
              }}>
                {card.description}
              </p>
              
              <div className="mt-4 flex items-center gap-2" style={{ color: card.color }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                  Öffnen
                </span>
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </div>
            </button>
          );
        })}
      </div>
      
      <div 
        className="mt-8 p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-subtle-tint)',
          borderColor: 'var(--border-subtle)',
          borderRadius: 'var(--radius-lg)'
        }}
      >
        <h3 style={{ 
          fontSize: 'var(--font-size-md)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--space-3)'
        }}>
          Schnellzugriff
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--status-info)', color: 'var(--text-inverse)' }}
            >
              <Briefcase size={20} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Offene Tasks
              </p>
              <p style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
                {openTasks}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--status-success)', color: 'var(--text-inverse)' }}
            >
              <PlayCircle size={20} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Aktive Runs
              </p>
              <p style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
                {activeRuns}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--status-danger)', color: 'var(--text-inverse)' }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Exceptions
              </p>
              <p style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
                {openExceptions}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}