import { useState } from 'react';
import { X, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Circle, Beaker } from 'lucide-react';

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
  capacityImpact: 'Überkapazität' | 'Untererfüllung' | 'Ausgeglichen';
  capacityImpactReason: string[];
}

interface SimulationResultsModalProps {
  articles: Article[];
  onAccept: () => void;
  onDiscard: () => void;
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

export function SimulationResultsModal({ articles, onAccept, onDiscard }: SimulationResultsModalProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'details'>('overview');
  
  // Calculate simulation statistics
  const totalArticles = articles.length;
  const overCapacityCount = articles.filter(a => a.capacityImpact === 'Überkapazität').length;
  const underCapacityCount = articles.filter(a => a.capacityImpact === 'Untererfüllung').length;
  const balancedCount = articles.filter(a => a.capacityImpact === 'Ausgeglichen').length;
  
  const totalStock = articles.reduce((sum, a) => sum + a.stockDC, 0);
  
  // Group by article group
  const byGroup = articles.reduce((acc, article) => {
    if (!acc[article.articleGroup]) {
      acc[article.articleGroup] = [];
    }
    acc[article.articleGroup].push(article);
    return acc;
  }, {} as Record<string, Article[]>);
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      onClick={onDiscard}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col"
        style={{
          boxShadow: 'var(--shadow-lg)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div 
          className="p-6 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div>
            <div className="flex items-center gap-2">
              <Beaker size={24} style={{ color: '#8b5cf6' }} />
              <h2
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}
              >
                Simulationsergebnisse
              </h2>
            </div>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
              Überprüfen Sie die prognostizierten Kapazitätswirkungen vor der Übernahme
            </p>
          </div>
          <button
            onClick={onDiscard}
            className="p-2 hover:bg-surface-tint rounded"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
        
        {/* Tabs */}
        <div 
          className="px-6 border-b flex items-center gap-1"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button
            onClick={() => setSelectedTab('overview')}
            className="px-4 py-3 relative"
            style={{
              color: selectedTab === 'overview' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontWeight: selectedTab === 'overview' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            Übersicht
            {selectedTab === 'overview' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              />
            )}
          </button>
          <button
            onClick={() => setSelectedTab('details')}
            className="px-4 py-3 relative"
            style={{
              color: selectedTab === 'details' ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontWeight: selectedTab === 'details' ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)',
              fontSize: 'var(--font-size-sm)'
            }}
          >
            Details
            {selectedTab === 'details' && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: 'var(--brand-primary)' }}
              />
            )}
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'overview' ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4">
                <div 
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--surface-page)',
                    borderColor: 'var(--border-default)'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                    Artikel gesamt
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {totalArticles}
                  </div>
                </div>
                
                <div 
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: '#ef444410',
                    borderColor: '#ef444430'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                    Überkapazität
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', color: '#ef4444' }}>
                      {overCapacityCount}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      ({((overCapacityCount / totalArticles) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                
                <div 
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: '#3b82f610',
                    borderColor: '#3b82f630'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                    Untererfüllung
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', color: '#3b82f6' }}>
                      {underCapacityCount}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      ({((underCapacityCount / totalArticles) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
                
                <div 
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: '#10b98110',
                    borderColor: '#10b98130'
                  }}
                >
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                    Ausgeglichen
                  </div>
                  <div className="flex items-center gap-2">
                    <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)', color: '#10b981' }}>
                      {balancedCount}
                    </div>
                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                      ({((balancedCount / totalArticles) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Capacity Impact Warning */}
              {overCapacityCount > 0 && (
                <div 
                  className="p-4 rounded-lg flex items-start gap-3"
                  style={{ 
                    backgroundColor: 'var(--surface-warning-subtle)',
                    border: '1px solid var(--border-warning)'
                  }}
                >
                  <AlertCircle size={20} style={{ color: 'var(--text-warning)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
                      Kapazitätsrisiken erkannt
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                      {overCapacityCount} {overCapacityCount === 1 ? 'Artikel weist' : 'Artikel weisen'} ein Überkapazitätsrisiko auf. 
                      Dies kann zu Platzproblemen in Filialen führen. Überprüfen Sie die Details, bevor Sie die Simulation übernehmen.
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recommendation */}
              {overCapacityCount === 0 && underCapacityCount === 0 && (
                <div 
                  className="p-4 rounded-lg flex items-start gap-3"
                  style={{ 
                    backgroundColor: 'var(--surface-success-subtle)',
                    border: '1px solid var(--border-success)'
                  }}
                >
                  <CheckCircle size={20} style={{ color: 'var(--status-success)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
                      Optimale Kapazitätsauslastung
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                      Alle Artikel sind kapazitätsmäßig ausgeglichen. Sie können die Simulation ohne Bedenken übernehmen.
                    </div>
                  </div>
                </div>
              )}
              
              {/* Group Breakdown */}
              <div>
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
                  Aufschlüsselung nach Artikelgruppe
                </h3>
                
                <div className="space-y-3">
                  {Object.entries(byGroup).map(([group, groupArticles]) => {
                    const groupOverCapacity = groupArticles.filter(a => a.capacityImpact === 'Überkapazität').length;
                    const groupUnderCapacity = groupArticles.filter(a => a.capacityImpact === 'Untererfüllung').length;
                    const groupBalanced = groupArticles.filter(a => a.capacityImpact === 'Ausgeglichen').length;
                    
                    return (
                      <div 
                        key={group}
                        className="p-4 rounded-lg border"
                        style={{
                          backgroundColor: 'var(--surface-page)',
                          borderColor: 'var(--border-default)'
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                            {group}
                          </div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            {groupArticles.length} Artikel
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp size={14} style={{ color: '#ef4444' }} />
                            <span style={{ fontSize: 'var(--font-size-xs)' }}>
                              {groupOverCapacity} Überkapazität
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingDown size={14} style={{ color: '#3b82f6' }} />
                            <span style={{ fontSize: 'var(--font-size-xs)' }}>
                              {groupUnderCapacity} Untererfüllung
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Circle size={14} style={{ color: '#10b981' }} />
                            <span style={{ fontSize: 'var(--font-size-xs)' }}>
                              {groupBalanced} Ausgeglichen
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Information Note */}
              <div 
                className="p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--surface-info-subtle)',
                  border: '1px solid var(--border-info)'
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  <strong>Hinweis:</strong> Die Simulationsergebnisse basieren auf prognostischen Kapazitätsdaten und 
                  berücksichtigen Flächenbedarf, Kategorie-Kapazitäten und zeitliche Verdichtungen. Die tatsächliche 
                  Kapazitätswirkung kann je nach finaler Filialen-Allokation abweichen.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Details Table */}
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)' }}>
                Artikeldetails ({articles.length})
              </div>
              
              {articles.map(article => {
                const Icon = CAPACITY_ICONS[article.capacityImpact];
                
                return (
                  <div 
                    key={article.id}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface-page)',
                      borderColor: 'var(--border-default)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: article.colorHex }}
                        />
                        <div>
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
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {article.description}
                          </div>
                        </div>
                      </div>
                      
                      <div
                        className="flex items-center gap-2 px-3 py-1 rounded-full"
                        style={{
                          backgroundColor: `${CAPACITY_COLORS[article.capacityImpact]}15`,
                          color: CAPACITY_COLORS[article.capacityImpact],
                          fontSize: 'var(--font-size-xs)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        <Icon size={14} />
                        <span>{article.capacityImpact}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3" style={{ fontSize: 'var(--font-size-xs)' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Gruppe:</span>{' '}
                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{article.articleGroup}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Saison:</span>{' '}
                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{article.season}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Bestand VZ:</span>{' '}
                        <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{article.stockDC.toLocaleString()} Stk.</span>
                      </div>
                    </div>
                    
                    {article.capacityImpactReason.length > 0 && (
                      <div 
                        className="p-3 rounded"
                        style={{ backgroundColor: `${CAPACITY_COLORS[article.capacityImpact]}05` }}
                      >
                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
                          Begründung:
                        </div>
                        <ul style={{ listStyle: 'disc', paddingLeft: '16px', fontSize: 'var(--font-size-xs)', lineHeight: '1.6' }}>
                          {article.capacityImpactReason.map((reason, idx) => (
                            <li key={idx} style={{ color: 'var(--text-secondary)' }}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div 
          className="p-6 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
            Die Simulation kann später im Arbeitsvorrat verworfen werden
          </div>
          
          <div className="flex items-center gap-3">
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
              Verwerfen
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--button-primary-bg)',
                color: 'var(--button-primary-text)',
                height: 'var(--height-button-md)'
              }}
            >
              Simulation übernehmen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
