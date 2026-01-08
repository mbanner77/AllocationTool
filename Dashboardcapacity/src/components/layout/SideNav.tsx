import { Home, Settings, Package, Briefcase, PlayCircle, AlertTriangle, Sliders, LayoutGrid, GitBranch, Layers, Database, BarChart2 } from 'lucide-react';
import { useLanguage } from '../../i18n';

interface SideNavProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

interface NavItem {
  id: string;
  labelKey: string;
  icon: any;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', labelKey: 'dashboard', icon: Home },
  { id: 'settings', labelKey: 'settings', icon: Settings },
  { id: 'parameters', labelKey: 'parameters', icon: Sliders },
  { id: 'capacity', labelKey: 'capacity', icon: Package },
  { id: 'cluster', labelKey: 'cluster', icon: Layers },
  { id: 'storeLayout', labelKey: 'storeLayout', icon: LayoutGrid },
  { id: 'work', labelKey: 'workQueue', icon: Briefcase, badge: 3 },
  { id: 'runs', labelKey: 'runs', icon: PlayCircle },
  { id: 'scenarios', labelKey: 'scenarios', icon: GitBranch },
  { id: 'analytics', labelKey: 'analytics', icon: BarChart2 },
  { id: 'exceptions', labelKey: 'exceptions', icon: AlertTriangle, badge: 12 },
  { id: 'dataManager', labelKey: 'dataManager', icon: Database },
];

export function SideNav({ currentScreen, onNavigate }: SideNavProps) {
  const { t } = useLanguage();
  return (
    <aside 
      className="flex flex-col border-r"
      style={{ 
        width: 'var(--sidenav-width-desktop)',
        backgroundColor: 'var(--surface-surface)',
        borderColor: 'var(--border-default)'
      }}
    >
      <div className="p-6">
        <img 
          src="https://realcore.info/bilder/rc-logo.png" 
          alt="RealCore Logo" 
          style={{ height: '40px', marginBottom: 'var(--space-2)' }}
        />
        <p style={{ 
          fontSize: 'var(--font-size-xs)', 
          color: 'var(--text-muted)',
          marginTop: 'var(--space-1)'
        }}>
          Allocation Tool
        </p>
      </div>
      
      <nav className="flex-1 px-3">
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ 
            fontSize: 'var(--font-size-xs)', 
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '0 var(--space-3)',
            marginBottom: 'var(--space-2)'
          }}>
            {t.nav.navigation}
          </p>
          
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative"
                  style={{
                    backgroundColor: isActive ? 'var(--surface-subtle-tint)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderLeft: isActive ? '3px solid var(--brand-accent)' : '3px solid transparent',
                    marginLeft: '-3px',
                    paddingLeft: 'calc(var(--space-3) + 3px)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tint)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon size={20} />
                  <span style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: isActive ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)'
                  }}>
                    {(t.nav as any)[item.labelKey] || item.labelKey}
                  </span>
                  {item.badge && (
                    <span 
                      className="ml-auto rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: 'var(--status-danger)',
                        color: 'var(--text-inverse)',
                        fontSize: 'var(--font-size-xs)',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      
      <div className="p-4 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-3 px-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--text-inverse)' }}
          >
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              JD
            </span>
          </div>
          <div className="flex-1">
            <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
              John Doe
            </p>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              Administrator
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}