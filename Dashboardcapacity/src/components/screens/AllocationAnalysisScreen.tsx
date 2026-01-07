import { useState } from 'react';
import { useLanguage } from '../../i18n';
import { ChevronLeft, ChevronDown, ChevronRight, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface AllocationAnalysisScreenProps {
  onNavigate: (screen: string) => void;
}

interface AnalysisStep {
  id: number;
  title: string;
  content: React.ReactNode;
  expanded: boolean;
}

export function AllocationAnalysisScreen({ onNavigate }: AllocationAnalysisScreenProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6, 7]));

  const toggleStep = (stepId: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  const steps: AnalysisStep[] = [
    {
      id: 1,
      title: 'Auswahl der Empfänger',
      expanded: expandedSteps.has(1),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Auswahlmethode
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Plandaten & Listung
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Anzahl ausgewählter Filialen
              </div>
              <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-lg)' }}>
                12 Filialen
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Anzahl Cluster
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                3 Cluster
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Ausschlüsse
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                2 Filialen (nicht gelistet)
              </div>
            </div>
          </div>

          {/* Expandable Details */}
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: '8px' }}>
              Angewendete Regeln
            </div>
            <ul className="space-y-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} style={{ color: 'var(--status-success)', marginTop: '2px', flexShrink: 0 }} />
                <span>Artikel ist in Filiale gelistet</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} style={{ color: 'var(--status-success)', marginTop: '2px', flexShrink: 0 }} />
                <span>Filiale ist im Planliefertermin aktiv</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={16} style={{ color: 'var(--status-success)', marginTop: '2px', flexShrink: 0 }} />
                <span>Transportbeziehung VZ → Filiale existiert</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: 'Ermittlung der Liefertermine',
      expanded: expandedSteps.has(2),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Basis
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Lieferplan
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Planlieferzeit
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                3 Tage
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Ursprüngliches Lieferfenster (Plan)
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontWeight: 'var(--font-weight-medium)' }}>01.03.2025</span>
                <span style={{ color: 'var(--text-muted)' }}>–</span>
                <span style={{ fontWeight: 'var(--font-weight-medium)' }}>15.03.2025</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Simuliertes Lieferfenster
              </div>
              <div className="flex items-center gap-2">
                <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--brand-primary)' }}>05.03.2025</span>
                <span style={{ color: 'var(--text-muted)' }}>–</span>
                <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--brand-primary)' }}>20.03.2025</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div
            className="p-4 rounded-lg flex items-start gap-3"
            style={{
              backgroundColor: 'var(--surface-info-subtle)',
              border: '1px solid var(--status-info)'
            }}
          >
            <Info size={18} style={{ color: 'var(--status-info)', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
              Das Lieferfenster wurde im Rahmen der Simulation angepasst, um Kapazitätsspitzen zu reduzieren.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Ermittlung verfügbarer Mengen',
      expanded: expandedSteps.has(3),
      content: (
        <div className="space-y-4">
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Quellen
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                VZ-Bestand
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                2.400
              </div>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Bestellungen
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                1.800
              </div>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Lieferungen
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                650
              </div>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Externe Verfügbarkeit
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                0
              </div>
            </div>
          </div>

          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Gesamt verfügbar
                </div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)' }}>
                  4.850
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Reserviert
                </div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-warning)' }}>
                  320
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Verfügbar für Allokation
                </div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-success)' }}>
                  4.530
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: 'Kapazitätsannahmen',
      expanded: expandedSteps.has(4),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Kapazitätsebene
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Store & Kategorie
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                SOLL-Kapazität
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                450 m²
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Parameterbasis
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Produktgruppe "Sneaker"
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: '12px' }}>
              Parameter
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Flächenbedarf je Einheit
                </div>
                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                  0,08 m²
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Präsentationsdauer
                </div>
                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                  14 Tage
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  LOT-Größe
                </div>
                <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                  12 Paar
                </div>
              </div>
            </div>
          </div>

          <div
            className="p-3 rounded-lg flex items-start gap-2"
            style={{
              backgroundColor: 'var(--surface-info-subtle)',
              border: '1px solid var(--status-info)'
            }}
          >
            <Info size={16} style={{ color: 'var(--status-info)', marginTop: '2px', flexShrink: 0 }} />
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-primary)' }}>
              Parameter wurden aus der Produktgruppe "Sneaker" übernommen
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: 'Allokationsalgorithmus',
      expanded: expandedSteps.has(5),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Algorithmus
              </div>
              <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                Kapazitätsgesteuerte Allokation
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Ziel
              </div>
              <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
                Auffüllung auf Sollbestand unter Berücksichtigung der Kapazität
              </div>
            </div>
          </div>

          {/* Flow Diagram */}
          <div
            className="p-6 rounded-lg"
            style={{
              backgroundColor: 'var(--surface-alt)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: '16px' }}>
              Allokationsablauf (vereinfacht)
            </div>
            <div className="flex items-center justify-between">
              <div
                className="flex-1 p-4 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--surface-page)',
                  border: '2px solid var(--brand-primary)'
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Schritt 1
                </div>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  Verfügbarkeit prüfen
                </div>
              </div>

              <ChevronRight size={24} style={{ color: 'var(--text-muted)', margin: '0 12px' }} />

              <div
                className="flex-1 p-4 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--surface-page)',
                  border: '2px solid var(--brand-primary)'
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Schritt 2
                </div>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  Bedarf ermitteln
                </div>
              </div>

              <ChevronRight size={24} style={{ color: 'var(--text-muted)', margin: '0 12px' }} />

              <div
                className="flex-1 p-4 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--surface-page)',
                  border: '2px solid var(--brand-primary)'
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Schritt 3
                </div>
                <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  Kapazität prüfen
                </div>
              </div>

              <ChevronRight size={24} style={{ color: 'var(--text-muted)', margin: '0 12px' }} />

              <div
                className="flex-1 p-4 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--surface-page)',
                  border: '2px solid var(--status-success)'
                }}
              >
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Schritt 4
                </div>
                <div style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--status-success)' }}>
                  Zuteilung
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: 'Kürzungen & Konfliktauflösung',
      expanded: expandedSteps.has(6),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Notwendige Kürzungen
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: 'var(--status-warning)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  Ja
                </span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Kürzungsstrategie
              </div>
              <div style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                Proportional
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Betroffene Artikel
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                8 Artikel
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Betroffene Filialen
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                5 Filialen
              </div>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Kürzungsmenge gesamt
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--status-danger)' }}>
                240 Stück
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <span
              className="px-4 py-2 rounded-lg inline-flex items-center gap-2"
              style={{
                backgroundColor: 'var(--surface-success-subtle)',
                color: 'var(--status-success)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                border: '1px solid var(--status-success)'
              }}
            >
              <CheckCircle2 size={16} />
              Überkapazität vermieden
            </span>

            <span
              className="px-4 py-2 rounded-lg inline-flex items-center gap-2"
              style={{
                backgroundColor: 'var(--surface-warning-subtle)',
                color: 'var(--status-warning)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                border: '1px solid var(--status-warning)'
              }}
            >
              <AlertCircle size={16} />
              Unterdeckung akzeptiert
            </span>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: 'Ergebnis der Allokation',
      expanded: expandedSteps.has(7),
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '2px solid var(--brand-primary)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Allokierte Gesamtmenge
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--brand-primary)' }}>
                4.290
              </div>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Über-/Unterdeckung
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: '#3b82f6' }}>
                -240
              </div>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Anzahl Ausnahmen
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--status-warning)' }}>
                3
              </div>
            </div>

            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-alt)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Kapazitätswirkung
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: 'var(--status-success)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  Ausgeglichen
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => onNavigate('exceptions')}
              className="px-6 py-3 rounded-lg"
              style={{
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--text-inverse)',
                fontWeight: 'var(--font-weight-medium)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Ausnahmen anzeigen
            </button>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => onNavigate('work')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-tint transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <ChevronLeft size={20} />
        <span>Zurück zur Simulation</span>
      </button>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
        <span>Arbeitsvorrat</span>
        <span>›</span>
        <span>Simulation</span>
        <span>›</span>
        <span>Allokationsanalyse</span>
      </div>

      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-2)'
          }}
        >
          Allokationsanalyse
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Detaillierte Erklärung, wie der Allokationsprozess zu diesem Ergebnis gekommen ist.
        </p>
      </div>

      {/* Context Card */}
      <div
        className="p-6 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="grid grid-cols-5 gap-6">
          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Szenario
            </div>
            <span
              className="px-3 py-1 rounded-full inline-block"
              style={{
                backgroundColor: 'var(--surface-info-subtle)',
                color: 'var(--status-info)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Initiale Allokation
            </span>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Anzahl Artikel
            </div>
            <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-lg)' }}>
              24
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Lieferzeitraum (simuliert)
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>05.03.2025</span>
              <span style={{ color: 'var(--text-muted)' }}>–</span>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>20.03.2025</span>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Kapazitätsbasis
            </div>
            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
              SOLL-Kapazität
            </div>
          </div>

          <div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Simulationszeitpunkt
            </div>
            <div style={{ fontWeight: 'var(--font-weight-medium)' }}>
              {new Date().toLocaleDateString('de-DE')}
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Steps */}
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="rounded-lg border overflow-hidden"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)'
            }}
          >
            {/* Step Header */}
            <button
              onClick={() => toggleStep(step.id)}
              className="w-full p-5 flex items-center justify-between hover:bg-surface-tint transition-colors"
              style={{ textAlign: 'left' }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    fontWeight: 'var(--font-weight-semibold)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                >
                  {step.id}
                </div>
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-semibold)' }}>
                  {step.title}
                </h3>
              </div>
              {step.expanded ? (
                <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
              )}
            </button>

            {/* Step Content */}
            {step.expanded && (
              <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="pt-5">
                  {step.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
