import { useState } from 'react';
import { Check, AlertTriangle, XCircle, ChevronRight, Info } from 'lucide-react';
import { FormulaTooltip } from './FormulaTooltip';
import { DecisionStep, StepStatus } from './ExplainabilityTypes';
import { REPLENISHMENT_STEPS } from './ReplenishmentExplainability';

const INITIAL_ALLOCATION_STEPS: DecisionStep[] = [
  {
    id: 'step-1',
    step: 1,
    title: 'Empfängerbestimmung',
    status: 'OK',
    summary: '245 Filialen aus Planungsdaten ermittelt',
    what: 'Basierend auf der Planungsstrategie wurden alle Filialen ermittelt, die für diese Allokation in Frage kommen.',
    inputs: [
      { label: 'Planungsstrategie', value: 'Planungsdaten', source: 'Variantenkonfiguration' },
      { label: 'Saison', value: 'HW 2025', source: 'Variantenkonfiguration' },
      { label: 'Ausschlusskriterien', value: '3 aktiv', source: 'Systemkonfiguration' }
    ],
    output: '245 Filialen qualifiziert, 12 ausgeschlossen',
    explanation: 'Die Filialen wurden anhand der Planungsdaten für die Saison HW 2025 ermittelt. Ausgeschlossen wurden Filialen ohne aktive Listung, geschlossene Filialen und Filialen mit blockierten Transportrelationen.',
    warnings: ['3 Filialen haben temporäre Liefersperren']
  },
  {
    id: 'step-2',
    step: 2,
    title: 'Lieferterminauswahl',
    status: 'OK',
    summary: 'Liefertermine aus Lieferplan ermittelt',
    what: 'Für jede Filiale wurde der optimale Liefertermin basierend auf dem Lieferplan und der Vorlaufzeit bestimmt.',
    inputs: [
      { label: 'Lieferplanlogik', value: 'Lieferplan', source: 'Variantenkonfiguration' },
      { label: 'Standardvorlaufzeit', value: '14 Tage', source: 'Systemparameter' },
      { label: 'Frühester Termin', value: '15.01.2025', source: 'Zeitfenster' }
    ],
    output: 'Ø Liefertermin: 22.01.2025',
    explanation: 'Der Liefertermin wurde für jede Filiale individuell aus dem hinterlegten Lieferplan übernommen. Bei fehlenden Einträgen wurde die Standardvorlaufzeit verwendet.'
  },
  {
    id: 'step-3',
    step: 3,
    title: 'Bedarfsberechnung',
    status: 'OK',
    summary: 'Bedarf für 1.247 Produkt-Filialen-Kombinationen berechnet',
    what: 'Der Bedarf wurde auf Basis von Plan, Bestand und Zulauf berechnet, optional gewichtet mit der Absatzprognose.',
    inputs: [
      { label: 'Prognosegewicht', value: '60%', source: 'Variantenkonfiguration' },
      { label: 'Planungsdaten', value: '1.247 Zeilen', source: 'Planungssystem' },
      { label: 'Bestandsdaten', value: 'Snapshot 10.01.2025', source: 'Warenwirtschaft' }
    ],
    formula: 'D_{i,s} = max(0, T_{i,s} - (B_{i,s} + I_{i,s})) × (1 - w) + F_{i,s} × w',
    formulaInputs: [
      { symbol: 'T_{i,s}', value: 150, source: 'Planungsdaten', description: 'Geplante Menge' },
      { symbol: 'B_{i,s}', value: 45, source: 'Bestandssnapshot', description: 'Aktueller Bestand' },
      { symbol: 'I_{i,s}', value: 20, source: 'Zulaufsdaten', description: 'Zuläufe' },
      { symbol: 'F_{i,s}', value: 120, source: 'Prognosesystem', description: 'Absatzprognose' },
      { symbol: 'w', value: '0.6', source: 'Variantenparameter', description: 'Prognosegewicht' }
    ],
    output: 'Gesamtbedarf: 28.456 Einheiten',
    explanation: 'Der Bedarf wurde als gewichteter Durchschnitt zwischen planbasiertem Bedarf und prognosebasiertem Bedarf berechnet. Das Prognosegewicht von 60% führt zu einer stärkeren Berücksichtigung der Absatzprognose.',
    warnings: ['128 Artikel ohne Prognose → nur Plan verwendet']
  },
  {
    id: 'step-4',
    step: 4,
    title: 'Verfügbarkeitsermittlung',
    status: 'WARN',
    summary: 'Verfügbarkeit: 24.120 Einheiten (84.8% des Bedarfs)',
    what: 'Die verfügbare Menge wurde aus DC-Beständen, Bestellungen und Lieferungen ermittelt.',
    inputs: [
      { label: 'DC-Bestände', value: '18.450 Einheiten', source: 'DC Snapshot' },
      { label: 'Bestellungen', value: '5.200 Einheiten', source: 'Einkaufssystem' },
      { label: 'Lieferungen', value: '470 Einheiten', source: 'Logistiksystem' }
    ],
    formula: 'Supply = DC_{stock} + PO_{confirmed} + Delivery_{planned}',
    formulaInputs: [
      { symbol: 'DC_{stock}', value: 18450, source: 'DC Snapshot 10.01.2025', description: 'DC-Bestand' },
      { symbol: 'PO_{confirmed}', value: 5200, source: 'Einkaufssystem', description: 'Bestätigte Bestellungen' },
      { symbol: 'Delivery_{planned}', value: 470, source: 'Logistiksystem', description: 'Geplante Lieferungen' }
    ],
    output: 'Verfügbar: 24.120 Einheiten',
    limitingFactor: 'Verfügbarkeit ist limitierend (84.8% des Bedarfs)',
    explanation: 'Die Gesamtverfügbarkeit deckt 84.8% des errechneten Bedarfs. Es besteht eine Unterdeckung von 4.336 Einheiten, die durch Rationierung verteilt werden muss.',
    warnings: [
      'Unterdeckung: 4.336 Einheiten',
      'Rationierung erforderlich'
    ]
  },
  {
    id: 'step-5',
    step: 5,
    title: 'Kapazitätssnapshot',
    status: 'OK',
    summary: 'Kapazitätsdaten für 245 Filialen geladen',
    what: 'Die verfügbare Kapazität pro Filiale und Produktgruppe wurde aus dem Kapazitätsplanungssystem übernommen.',
    inputs: [
      { label: 'Kapazitätseinheit', value: 'm²', source: 'Variantenkonfiguration' },
      { label: 'Planungsebene', value: 'Produktgruppe', source: 'Variantenkonfiguration' },
      { label: 'Snapshot-Datum', value: '10.01.2025', source: 'Kapazitätsplanung' }
    ],
    formula: 'Free_{s,h} = max(0, Cap_{soll,s,h} - Occ_{ist,s,h})',
    formulaInputs: [
      { symbol: 'Cap_{soll,s,h}', value: '450 m²', source: 'Kapazitätsplanung', description: 'SOLL-Kapazität' },
      { symbol: 'Occ_{ist,s,h}', value: '380 m²', source: 'Bestandssnapshot', description: 'IST-Belegung' }
    ],
    output: 'Ø Freie Kapazität: 68.4 m² pro Filiale',
    explanation: 'Die freie Kapazität wurde als Differenz zwischen SOLL-Kapazität und IST-Belegung berechnet. Die IST-Belegung setzt sich zusammen aus aktuellem Bestand, Reservierungen und eingehenden Lieferungen.'
  },
  {
    id: 'step-6',
    step: 6,
    title: 'Optimierung / Heuristik',
    status: 'OK',
    summary: 'Allokation mit Proportional-Strategie berechnet',
    what: 'Die verfügbare Menge wurde auf Basis der gewählten Strategie auf die Filialen verteilt.',
    inputs: [
      { label: 'Strategie', value: 'Proportional', source: 'Variantenkonfiguration' },
      { label: 'Fairness-Faktor α', value: '0.8', source: 'Variantenkonfiguration' },
      { label: 'Supply', value: '24.120 Einheiten', source: 'Schritt 4' },
      { label: 'Demand', value: '28.456 Einheiten', source: 'Schritt 3' }
    ],
    formula: 'x_{i,s} = min(D_{i,s}, Supply × (D_{i,s} / Σ D_{i,s}))',
    formulaInputs: [
      { symbol: 'D_{i,s}', value: 150, source: 'Bedarfsberechnung', description: 'Bedarf Artikel i, Filiale s' },
      { symbol: 'Supply', value: 24120, source: 'Verfügbarkeit', description: 'Gesamtverfügbarkeit' },
      { symbol: 'Σ D_{i,s}', value: 28456, source: 'Bedarfsberechnung', description: 'Gesamtbedarf' }
    ],
    output: 'Allokation für 1.247 Zeilen berechnet',
    explanation: 'Bei der proportionalen Strategie erhält jede Filiale einen Anteil entsprechend ihrem Bedarf. Die Summe aller Allokationen entspricht der verfügbaren Menge.'
  },
  {
    id: 'step-7',
    step: 7,
    title: 'Rationierung',
    status: 'WARN',
    summary: '187 Filialen betroffen, MinFill: 85.2%',
    what: 'Aufgrund der Unterdeckung musste eine Rationierung durchgeführt werden. MinFill-Regeln wurden angewendet.',
    inputs: [
      { label: 'MinFill-Profil', value: 'Core', source: 'Variantenkonfiguration' },
      { label: 'MinFill-Prozentsatz', value: '80%', source: 'Variantenkonfiguration' },
      { label: 'Rationierte Menge', value: '4.336 Einheiten', source: 'Schritt 4' }
    ],
    output: 'MinFill-Erfüllung: 85.2%',
    limitingFactor: 'MinFill-Ziel von 90% nicht erreicht',
    explanation: 'Die Rationierung wurde so durchgeführt, dass möglichst viele Filialen mindestens 80% ihrer Bedarfsmenge erhalten. Filialen mit sehr geringem Bedarf wurden priorisiert, um Präsentationsbestände sicherzustellen.',
    warnings: [
      '32 Filialen unter MinFill-Schwelle',
      'MinFill-Ziel 90% nicht erreicht (ist: 85.2%)'
    ]
  },
  {
    id: 'step-8',
    step: 8,
    title: 'Fallback',
    status: 'WARN',
    summary: '18 Filialen in Fallback-Modus',
    what: 'Für Filialen, die weder aus Verfügbarkeit noch aus Kapazität beliefert werden konnten, wurde ein Fallback aktiviert.',
    inputs: [
      { label: 'Fallback-Strategie', value: 'Core/NOS Substitution', source: 'Variantenkonfiguration' },
      { label: 'Trigger', value: 'Supply < Demand AND Space > Capacity', source: 'Variantenkonfiguration' },
      { label: 'Betroffene Filialen', value: '18', source: 'Schritt 7' }
    ],
    output: '18 Filialen mit Ersatzartikeln',
    limitingFactor: 'Fallback aktiv aufgrund Kapazitätsengpass',
    explanation: 'In 18 Filialen konnte die geplante Produktgruppe aufgrund von Kapazitätsengpässen nicht vollständig allokiert werden. Stattdessen wurden effizientere Core/NOS-Artikel als Ersatz zugeteilt.',
    warnings: [
      'Fallback aktiv in 18 Filialen',
      'Ersatz: Produktgruppe "Shoes" → "Basic Shoes"',
      'Effizienz-Verbesserung: +12.5%'
    ]
  },
  {
    id: 'step-9',
    step: 9,
    title: 'Nachbearbeitung (LOT/Größe)',
    status: 'OK',
    summary: 'Packgrößen und Größenkurven angewendet',
    what: 'Die berechneten Allokationsmengen wurden auf Packgrößen gerundet und Größenkurven wurden angewendet.',
    inputs: [
      { label: 'Pack-Größe erzwingen', value: 'Ja', source: 'Variantenkonfiguration' },
      { label: 'Größenkurve aktiv', value: 'Ja', source: 'Variantenkonfiguration' },
      { label: 'Min. Größen pro Filiale', value: '3', source: 'Variantenkonfiguration' },
      { label: 'Reparatur-Modus', value: 'Best Effort', source: 'Variantenkonfiguration' }
    ],
    output: 'Mengen angepasst: +245 Einheiten (Aufrundung)',
    explanation: 'Die berechneten Mengen wurden auf volle Packgrößen aufgerundet. Größenkurven wurden angewendet, um sicherzustellen, dass jede Filiale mindestens 3 Größen erhält.'
  },
  {
    id: 'step-10',
    step: 10,
    title: 'Endergebnis',
    status: 'OK',
    summary: 'Allokation abgeschlossen: 24.365 Einheiten verteilt',
    what: 'Die finale Allokation wurde erstellt und validiert.',
    inputs: [
      { label: 'Allokierte Menge', value: '24.365 Einheiten', source: 'Schritt 9' },
      { label: 'Filialen beliefert', value: '245', source: 'Schritt 1' },
      { label: 'Artikel-Filiale Zeilen', value: '1.247', source: 'Berechnung' }
    ],
    formula: 'Coverage = (Supply / Demand) × 100%',
    formulaInputs: [
      { symbol: 'Supply', value: 24365, source: 'Finale Allokation', description: 'Allokierte Menge' },
      { symbol: 'Demand', value: 28456, source: 'Bedarfsberechnung', description: 'Gesamtbedarf' }
    ],
    output: 'Coverage: 85.6%',
    explanation: 'Die Allokation wurde erfolgreich abgeschlossen. Aufgrund der Unterdeckung konnten 85.6% des Bedarfs gedeckt werden. 18 Filialen befinden sich im Fallback-Modus.'
  }
];

const STATUS_CONFIG = {
  OK: {
    icon: Check,
    color: 'var(--status-success)',
    bgColor: 'var(--surface-success-subtle)',
    label: 'OK'
  },
  WARN: {
    icon: AlertTriangle,
    color: 'var(--status-warning)',
    bgColor: 'var(--surface-warning-subtle)',
    label: 'Warnung'
  },
  FAIL: {
    icon: XCircle,
    color: 'var(--status-danger)',
    bgColor: 'var(--surface-danger-subtle)',
    label: 'Fehler'
  }
};

interface ExplainabilityScreenProps {
  allocationType?: 'Initial Allocation' | 'Replenishment';
}

export function ExplainabilityScreen({ allocationType = 'Initial Allocation' }: ExplainabilityScreenProps = {}) {
  const MOCK_STEPS = allocationType === 'Replenishment' ? REPLENISHMENT_STEPS : INITIAL_ALLOCATION_STEPS;
  const [selectedStep, setSelectedStep] = useState<DecisionStep>(MOCK_STEPS[0]);

  const config = STATUS_CONFIG[selectedStep.status];
  const StatusIcon = config.icon;

  return (
    <div className="h-full flex gap-6">
      {/* Left: Timeline */}
      <div 
        className="overflow-y-auto p-6"
        style={{ 
          width: '350px',
          backgroundColor: 'var(--surface-subtle)',
          borderRight: '1px solid var(--border-default)'
        }}
      >
        <h2 
          style={{ 
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-4)'
          }}
        >
          Entscheidungspfad
        </h2>
        
        <div className="space-y-2">
          {MOCK_STEPS.map((step, idx) => {
            const isSelected = step.id === selectedStep.id;
            const stepConfig = STATUS_CONFIG[step.status];
            const StepIcon = stepConfig.icon;
            
            return (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {idx < MOCK_STEPS.length - 1 && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '19px',
                      top: '40px',
                      width: '2px',
                      height: 'calc(100% + 8px)',
                      backgroundColor: 'var(--border-default)'
                    }}
                  />
                )}
                
                <button
                  onClick={() => setSelectedStep(step)}
                  className="w-full p-3 rounded-lg flex items-start gap-3 text-left transition-all"
                  style={{
                    backgroundColor: isSelected ? 'var(--surface-page)' : 'transparent',
                    border: isSelected ? '2px solid var(--brand-primary)' : '1px solid transparent'
                  }}
                >
                  {/* Step Number/Icon */}
                  <div
                    className="flex-shrink-0 rounded-full flex items-center justify-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: stepConfig.bgColor,
                      border: `2px solid ${stepConfig.color}`,
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    <StepIcon size={20} style={{ color: stepConfig.color }} />
                  </div>
                  
                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <div 
                      style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-muted)',
                        marginBottom: '2px'
                      }}
                    >
                      Schritt {step.step}
                    </div>
                    <div 
                      style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-primary)',
                        marginBottom: '4px'
                      }}
                    >
                      {step.title}
                    </div>
                    <div 
                      style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {step.summary}
                    </div>
                  </div>
                  
                  {isSelected && (
                    <ChevronRight size={20} style={{ color: 'var(--brand-primary)' }} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Right: Detail Panel */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="flex-shrink-0 rounded-full flex items-center justify-center"
            style={{
              width: '60px',
              height: '60px',
              backgroundColor: config.bgColor,
              border: `3px solid ${config.color}`
            }}
          >
            <StatusIcon size={32} style={{ color: config.color }} />
          </div>
          
          <div className="flex-1">
            <div 
              style={{ 
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)',
                marginBottom: '4px'
              }}
            >
              Schritt {selectedStep.step} von {MOCK_STEPS.length}
            </div>
            <h1 
              style={{ 
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-2)'
              }}
            >
              {selectedStep.title}
            </h1>
            <div 
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
              style={{
                backgroundColor: config.bgColor,
                color: config.color,
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              <StatusIcon size={16} />
              {config.label}
            </div>
          </div>
        </div>
        
        {/* Warnings */}
        {selectedStep.warnings && selectedStep.warnings.length > 0 && (
          <div
            className="mb-6 p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-warning-subtle)',
              borderColor: 'var(--status-warning)'
            }}
          >
            <div 
              className="flex items-center gap-2 mb-2"
              style={{ 
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--status-warning)'
              }}
            >
              <AlertTriangle size={18} />
              Warnungen
            </div>
            <ul className="space-y-1" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              {selectedStep.warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* What */}
        <div className="mb-6">
          <h3 
            style={{ 
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-3)'
            }}
          >
            Was wurde berechnet?
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {selectedStep.what}
          </p>
        </div>
        
        {/* Inputs */}
        <div className="mb-6">
          <h3 
            style={{ 
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-3)'
            }}
          >
            Eingabewerte
          </h3>
          <div className="space-y-3">
            {selectedStep.inputs.map((input, idx) => (
              <div 
                key={idx}
                className="flex items-start justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--surface-subtle)' }}
              >
                <div className="flex-1">
                  <div 
                    style={{ 
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      marginBottom: '2px'
                    }}
                  >
                    {input.label}
                  </div>
                  <div 
                    style={{ 
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    Quelle: {input.source}
                  </div>
                </div>
                <div 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--text-primary)'
                  }}
                >
                  {input.value}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Formula */}
        {selectedStep.formula && selectedStep.formulaInputs && (
          <div className="mb-6">
            <h3 
              style={{ 
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-3)'
              }}
            >
              Formel
            </h3>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--surface-subtle)',
                fontFamily: 'monospace',
                fontSize: 'var(--font-size-md)',
                color: 'var(--text-primary)'
              }}
            >
              {selectedStep.formula}
            </div>
            
            {/* Formula Variables */}
            <div className="mt-4 space-y-2">
              {selectedStep.formulaInputs.map((input, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{ backgroundColor: 'var(--surface-page)', border: '1px solid var(--border-subtle)' }}
                >
                  <div 
                    style={{ 
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--brand-primary)',
                      fontWeight: 'var(--font-weight-semibold)',
                      minWidth: '80px'
                    }}
                  >
                    {input.symbol}
                  </div>
                  <div className="flex-1">
                    {input.description && (
                      <div 
                        style={{ 
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-primary)',
                          marginBottom: '2px'
                        }}
                      >
                        {input.description}
                      </div>
                    )}
                    <div 
                      style={{ 
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Quelle: {input.source}
                    </div>
                  </div>
                  <div 
                    style={{ 
                      fontFamily: 'monospace',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    = {input.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Output */}
        <div className="mb-6">
          <h3 
            style={{ 
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-3)'
            }}
          >
            Ergebnis
          </h3>
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--surface-info-subtle)',
              border: '2px solid var(--status-info)'
            }}
          >
            <div 
              style={{ 
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--status-info)'
              }}
            >
              {selectedStep.output}
            </div>
          </div>
        </div>
        
        {/* Limiting Factor */}
        {selectedStep.limitingFactor && (
          <div className="mb-6">
            <h3 
              style={{ 
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-3)'
              }}
            >
              Limitierender Faktor
            </h3>
            <div
              className="p-4 rounded-lg flex items-start gap-3"
              style={{
                backgroundColor: 'var(--surface-warning-subtle)',
                border: '1px solid var(--status-warning)'
              }}
            >
              <Info size={20} style={{ color: 'var(--status-warning)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                {selectedStep.limitingFactor}
              </div>
            </div>
          </div>
        )}
        
        {/* Explanation */}
        <div>
          <h3 
            style={{ 
              fontSize: 'var(--font-size-md)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-3)'
            }}
          >
            Erklärung (Warum?)
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {selectedStep.explanation}
          </p>
        </div>
      </div>
    </div>
  );
}