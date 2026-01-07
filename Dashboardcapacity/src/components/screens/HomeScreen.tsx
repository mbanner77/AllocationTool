import { useState, useEffect } from 'react';
import { Settings, Package, Briefcase, PlayCircle, AlertTriangle, BarChart3, Sliders, LayoutGrid, GitBranch, Layers } from 'lucide-react';
import { useApp } from '../../store/AppContext';
import { dataService } from '../../services/dataService';
import { useLanguage } from '../../i18n';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

// Feature card definitions - titles and descriptions come from translations
const FEATURE_CARD_CONFIG = [
  { id: 'settings', titleKey: 'settingsTitle', descKey: 'settingsDesc', icon: Settings, color: 'var(--brand-primary)' },
  { id: 'parameters', titleKey: 'parametersTitle', descKey: 'parametersDesc', icon: Sliders, color: 'var(--status-info)' },
  { id: 'capacity', titleKey: 'capacityTitle', descKey: 'capacityDesc', icon: Package, color: 'var(--status-success)' },
  { id: 'cluster', titleKey: 'clusterTitle', descKey: 'clusterDesc', icon: Layers, color: '#ec4899' },
  { id: 'storeLayout', titleKey: 'storeLayoutTitle', descKey: 'storeLayoutDesc', icon: LayoutGrid, color: '#6366f1' },
  { id: 'work', titleKey: 'workTitle', descKey: 'workDesc', icon: Briefcase, color: 'var(--brand-accent)' },
  { id: 'runs', titleKey: 'runsTitle', descKey: 'runsDesc', icon: PlayCircle, color: 'var(--status-warning)' },
  { id: 'scenarios', titleKey: 'scenariosTitle', descKey: 'scenariosDesc', icon: GitBranch, color: '#7c3aed' },
  { id: 'scenarioManagement', titleKey: 'scenarioMgmtTitle', descKey: 'scenarioMgmtDesc', icon: Sliders, color: '#8b5cf6' },
  { id: 'exceptions', titleKey: 'exceptionsTitle', descKey: 'exceptionsDesc', icon: AlertTriangle, color: 'var(--status-danger)' },
  { id: 'analytics', titleKey: 'analyticsTitle', descKey: 'analyticsDesc', icon: BarChart3, color: 'var(--text-secondary)' },
];

export function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { state } = useApp();
  const { t } = useLanguage();
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
          {t.dashboard.welcome}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          {t.dashboard.subtitle}
          {state.currentUser && ` • ${t.dashboard.loggedInAs} ${state.currentUser.name}`}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURE_CARD_CONFIG.map((card) => {
          const Icon = card.icon;
          const title = (t.dashboard as any)[card.titleKey] || card.titleKey;
          const description = (t.dashboard as any)[card.descKey] || card.descKey;
          
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
                {title}
              </h3>
              
              <p style={{ 
                color: 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)',
                lineHeight: 'var(--line-height-sm)'
              }}>
                {description}
              </p>
              
              <div className="mt-4 flex items-center gap-2" style={{ color: card.color }}>
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                  {t.dashboard.open}
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
          {t.dashboard.quickActions}
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
                {t.dashboard.pendingTasks}
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
                {t.dashboard.activeRuns}
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
                {t.dashboard.openExceptions}
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