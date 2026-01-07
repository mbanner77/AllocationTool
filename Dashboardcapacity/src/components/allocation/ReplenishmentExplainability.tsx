import { DecisionStep } from './ExplainabilityTypes';

export const REPLENISHMENT_STEPS: DecisionStep[] = [
  {
    id: 'step-1',
    step: 1,
    title: 'Scope & Eligibility',
    status: 'OK',
    summary: 'Zeitfenster und SKU-Scope definiert',
    what: 'Der Scope des Replenishment-Laufs wurde festgelegt: Zeitfenster, betroffene SKUs, Filialen und Produktgruppen.',
    inputs: [
      { label: 'Zeitfenster', value: '4 Wochen (20.01-16.02.2025)', source: 'Variantenkonfiguration' },
      { label: 'SKU-Anzahl', value: '1.247', source: 'Produktstamm' },
      { label: 'Filialscope', value: '245 Filialen', source: 'Filialstamm' },
      { label: 'Produktgruppen', value: '12 aktiv', source: 'Hierarchie' }
    ],
    output: 'Scope: 1.247 SKUs × 245 Filialen × 4 Wochen',
    explanation: 'Der Replenishment-Lauf arbeitet mit einem 4-Wochen-Horizont und umfasst alle aktiven SKUs in den definierten Produktgruppen für alle belieferbaren Filialen.'
  },
  {
    id: 'step-2',
    step: 2,
    title: 'Recipient Determination',
    status: 'OK',
    summary: '245 Filialen qualifiziert für Belieferung',
    what: 'Filialen wurden auf Basis von Listung, Transportrelationen und Liefersperren gefiltert.',
    inputs: [
      { label: 'Gesamtfilialen', value: '258', source: 'Filialstamm' },
      { label: 'Listungskriterium aktiv', value: 'Ja', source: 'Variantenkonfiguration' },
      { label: 'Ausgeschlossen', value: '13', source: 'Filterung' }
    ],
    output: '245 Filialen qualifiziert',
    explanation: '13 Filialen wurden ausgeschlossen: 5 wegen fehlender Listung, 4 wegen Liefersperre, 4 wegen blockierter Transportrelation.'
  },
  {
    id: 'step-3',
    step: 3,
    title: 'Forecast & Demand Signals',
    status: 'OK',
    summary: 'Absatzprognose und Recent Sales geladen',
    what: 'Die Absatzprognose wurde für den Horizont geladen und mit aktuellen Verkaufsdaten (Last 2 Weeks) abgeglichen.',
    inputs: [
      { label: 'Prognosequelle', value: 'Statistical Forecast v2.3', source: 'Prognosesystem' },
      { label: 'Prognose-Horizont', value: '4 Wochen', source: 'Variantenkonfiguration' },
      { label: 'Recent Sales Period', value: '14 Tage', source: 'Systemparameter' },
      { label: 'Gesamt Forecast Demand', value: '8.750 Einheiten', source: 'Prognoseberechnung' }
    ],
    formula: 'ForecastDemand_{i,s} = Σ_t ForecastSales_{i,s,t}',
    formulaInputs: [
      { symbol: 'ForecastSales_{i,s,t}', value: 'Variable', source: 'Prognosesystem', description: 'Prognose pro Tag/Woche' },
      { symbol: 't', value: '1-4 Wochen', source: 'Zeitfenster', description: 'Zeitbucket im Horizont' }
    ],
    output: 'Forecast für 8.750 Einheiten über 4 Wochen',
    explanation: 'Die Prognose berücksichtigt saisonale Trends, aktuelle Verkaufsdaten und Lagerbestände. Recent Sales der letzten 14 Tage wurden als Plausibilitätscheck verwendet.'
  },
  {
    id: 'step-4',
    step: 4,
    title: 'Replenishment Need Calculation',
    status: 'OK',
    summary: 'Nachschubsbedarf: 7.600 Einheiten',
    what: 'Der Nachschubsbedarf wurde berechnet als Ziellagerbestand minus aktuellem Bestand und Zuläufen.',
    inputs: [
      { label: 'Forecast Demand (Horizont)', value: '8.750 Einheiten', source: 'Schritt 3' },
      { label: 'Safety Stock', value: '620 Einheiten', source: 'Sicherheitsbestand-Berechnung' },
      { label: 'Presentation Min', value: '980 Einheiten', source: 'Parameter' },
      { label: 'On-Hand gesamt', value: '1.850 Einheiten', source: 'Bestandssnapshot' },
      { label: 'Inbound gesamt', value: '900 Einheiten', source: 'Zulaufsdaten' }
    ],
    formula: 'Need_{i,s} = max(0, (ForecastDemand_{i,s} + Safety_{i,s} + Min_{i,s}) − (OnHand_{i,s} + Inbound_{i,s}))',
    formulaInputs: [
      { symbol: 'ForecastDemand_{i,s}', value: 85, source: 'Schritt 3', description: 'Prognose für Horizont' },
      { symbol: 'Safety_{i,s}', value: 8, source: 'Sicherheitsbestandsberechnung', description: 'z × σ × √LeadTime' },
      { symbol: 'Min_{i,s}', value: 6, source: 'Präsentationsparameter', description: 'Mindestpräsentation' },
      { symbol: 'OnHand_{i,s}', value: 12, source: 'Bestandssnapshot', description: 'Aktueller Bestand' },
      { symbol: 'Inbound_{i,s}', value: 6, source: 'Zulaufsdaten', description: 'Zuläufe im Horizont' }
    ],
    output: 'Replenishment Need: 7.600 Einheiten',
    explanation: 'Der Nachschubsbedarf wurde so berechnet, dass der Ziellagerbestand (Forecast + Safety + MinPräsentation) erreicht wird, abzüglich bereits vorhandenem Bestand und Zuläufen. Safety Stock wurde mit Service Level 95% berechnet.'
  },
  {
    id: 'step-5',
    step: 5,
    title: 'Service Level Targeting',
    status: 'WARN',
    summary: 'Service Level Target: 95%, Erreicht: 87.3%',
    what: 'Service Level Ziele wurden definiert und mit der erwarteten Coverage verglichen.',
    inputs: [
      { label: 'Target Service Level (Ø)', value: '95%', source: 'Variantenkonfiguration' },
      { label: 'Berechnete Coverage', value: '87.3%', source: 'Allokationsberechnung' },
      { label: 'Gewichtung', value: 'Nach Umsatz', source: 'Variantenkonfiguration' }
    ],
    formula: 'ServiceLevelFulfillment = Σ min(1, Coverage_{i,s}) × Weight_{i,s} / Σ Weight_{i,s}',
    formulaInputs: [
      { symbol: 'Coverage_{i,s}', value: 0.985, source: 'Allokation', description: 'Allocated / Need' },
      { symbol: 'Weight_{i,s}', value: 12500, source: 'Umsatzdaten', description: 'Gewichtungsfaktor (Umsatz)' }
    ],
    output: 'Service Level Fulfillment: 87.3%',
    limitingFactor: 'Service Level Target von 95% nicht erreicht (Delta: -7.7%)',
    explanation: 'Das Service Level Ziel von 95% konnte aufgrund von Supply-Engpässen nicht erreicht werden. Die erreichten 87.3% bedeuten, dass 87.3% der gewichteten Bedarfsmenge gedeckt werden kann.',
    warnings: [
      'Service Level Target nicht erreicht',
      '12 Filialen mit Stockout-Risiko',
      'Kritische SKUs: RUN-PRO-001, HIK-BOO-023'
    ]
  },
  {
    id: 'step-6',
    step: 6,
    title: 'DC Supply Determination',
    status: 'WARN',
    summary: 'Verfügbarkeit DC: 7.130 Einheiten (93.8% des Bedarfs)',
    what: 'Die verfügbare Menge im DC wurde aus Bestand, Bestellungen und Lieferungen ermittelt.',
    inputs: [
      { label: 'DC On-Hand', value: '5.850 Einheiten', source: 'DC Snapshot' },
      { label: 'DC Inbound (bestätigt)', value: '1.200 Einheiten', source: 'Einkaufssystem' },
      { label: 'DC Reservierungen', value: '-80 Einheiten', source: 'Reservierungssystem' },
      { label: 'Externe Quellen', value: '160 Einheiten', source: 'Externe Lieferanten' }
    ],
    formula: 'Available_{i,DC} = OnHand_{i,DC} + Inbound_{i,DC} − Reservations_{i,DC} + External_i',
    formulaInputs: [
      { symbol: 'OnHand_{i,DC}', value: 5850, source: 'DC Snapshot', description: 'DC-Bestand' },
      { symbol: 'Inbound_{i,DC}', value: 1200, source: 'Einkaufssystem', description: 'Bestätigte Bestellungen' },
      { symbol: 'Reservations_{i,DC}', value: 80, source: 'Reservierungssystem', description: 'Reservierte Mengen' },
      { symbol: 'External_i', value: 160, source: 'Externe Lieferanten', description: 'Externe Zulieferung' }
    ],
    output: 'DC Supply: 7.130 Einheiten',
    limitingFactor: 'Supply deckt nur 93.8% des Bedarfs (Shortage: 470 Einheiten)',
    explanation: 'Die DC-Verfügbarkeit reicht nicht aus, um den gesamten Nachschubsbedarf zu decken. Es besteht eine Unterdeckung von 470 Einheiten, die durch Rationierung verteilt werden muss.',
    warnings: [
      'Supply Shortage: 470 Einheiten',
      'Kritische SKUs mit <80% Coverage: 3',
      'Rationierung erforderlich'
    ]
  },
  {
    id: 'step-7',
    step: 7,
    title: 'Capacity Snapshot & Space Constraints',
    status: 'OK',
    summary: 'Kapazitätsdaten für 245 Filialen × 12 Warengruppen',
    what: 'Die verfügbare Kapazität wurde pro Filiale und Produktgruppe ermittelt und als Constraint hinterlegt.',
    inputs: [
      { label: 'Kapazitätseinheit', value: 'm²', source: 'Variantenkonfiguration' },
      { label: 'Planungsebene', value: 'Produktgruppe', source: 'Variantenkonfiguration' },
      { label: 'Snapshot-Datum', value: '17.01.2025', source: 'Kapazitätsplanung' },
      { label: 'Ø Freie Kapazität', value: '18.4 m² pro Filiale', source: 'Kapazitätsberechnung' }
    ],
    formula: 'Free_{s,h,t} = max(0, CapSoll_{s,h,t} − OccIst_{s,h,t})',
    formulaInputs: [
      { symbol: 'CapSoll_{s,h,t}', value: '450 m²', source: 'Kapazitätsplanung', description: 'SOLL-Kapazität' },
      { symbol: 'OccIst_{s,h,t}', value: '380 m²', source: 'Bestandssnapshot', description: 'IST-Belegung inkl. Zuläufe' }
    ],
    output: 'Freie Kapazität erfasst, Constraint aktiv',
    explanation: 'Die freie Kapazität wurde als Differenz zwischen SOLL und IST berechnet. Die IST-Belegung berücksichtigt aktuellen Bestand, Reservierungen und eingehende Lieferungen innerhalb des Horizonts.'
  },
  {
    id: 'step-8',
    step: 8,
    title: 'Priority Scoring (w_i,s)',
    status: 'OK',
    summary: 'Prioritäts-Scores berechnet für SKU-Filial-Kombinationen',
    what: 'Für jede SKU-Filial-Kombination wurde ein Prioritäts-Score berechnet, der Urgency, Sales Velocity, Service Level Gap und Overstock Risk kombiniert.',
    inputs: [
      { label: 'Gewicht: Stockout Urgency (a)', value: '0.35', source: 'Variantenkonfiguration' },
      { label: 'Gewicht: Sales Velocity (b)', value: '0.25', source: 'Variantenkonfiguration' },
      { label: 'Gewicht: Service Level Gap (c)', value: '0.30', source: 'Variantenkonfiguration' },
      { label: 'Gewicht: Overstock Risk (e)', value: '-0.10', source: 'Variantenkonfiguration' }
    ],
    formula: 'w_{i,s} = a × StockoutUrgency_{i,s} + b × SalesVelocity_{i,s} + c × ServiceLevelGap_{i,s} − e × OverstockRisk_{i,s}',
    formulaInputs: [
      { symbol: 'StockoutUrgency_{i,s}', value: 0.82, source: 'DOS-Berechnung', description: 'max(0, Threshold − DOS)' },
      { symbol: 'SalesVelocity_{i,s}', value: 0.75, source: 'Recent Sales', description: 'Normalisierte Verkaufsgeschwindigkeit' },
      { symbol: 'ServiceLevelGap_{i,s}', value: 0.12, source: 'Coverage-Berechnung', description: 'max(0, Target − Coverage_pre)' },
      { symbol: 'OverstockRisk_{i,s}', value: 0.05, source: 'WOS-Berechnung', description: 'Weeks of Supply > Threshold' }
    ],
    output: 'Priority Scores berechnet (Ø: 82.5, Range: 45-95)',
    explanation: 'Der Priority Score kombiniert verschiedene Faktoren: Stockout Urgency (basierend auf Days of Supply), Sales Velocity (Recent Sales), Service Level Gap (Target vs. aktuelle Coverage) und Overstock Risk (Weeks of Supply). Höhere Scores führen zu bevorzugter Allokation.'
  },
  {
    id: 'step-9',
    step: 9,
    title: 'Allocation Core Solver',
    status: 'OK',
    summary: 'Min-Cost Flow Solver erfolgreich ausgeführt',
    what: 'Die Allokation wurde mit einem Min-Cost Flow Algorithmus berechnet unter Berücksichtigung von Supply-, Demand- und Capacity-Constraints.',
    inputs: [
      { label: 'Solver-Typ', value: 'Min-Cost Flow', source: 'Variantenkonfiguration' },
      { label: 'Decision Variables', value: '1.247 SKUs × 245 Stores', source: 'Berechnung' },
      { label: 'Underfill Penalty μ', value: '10.0', source: 'Variantenkonfiguration' },
      { label: 'Overcap Penalty λ', value: '5.0', source: 'Variantenkonfiguration' }
    ],
    formula: 'max Σ_{i,s} w_{i,s} × x_{i,s} − μ × Σ_{i,s} Underfill_{i,s} − λ × Σ_{s,h} OvercapSlack_{s,h}',
    formulaInputs: [
      { symbol: 'w_{i,s}', value: 92.5, source: 'Schritt 8', description: 'Priority Score' },
      { symbol: 'x_{i,s}', value: 'Variable', source: 'Solver', description: 'Allokierte Menge (Entscheidungsvariable)' },
      { symbol: 'Underfill_{i,s}', value: 'max(0, Need - x)', source: 'Solver', description: 'Nicht gedeckter Bedarf' },
      { symbol: 'μ', value: 10.0, source: 'Penalty Parameter', description: 'Underfill Penalty' },
      { symbol: 'λ', value: 5.0, source: 'Penalty Parameter', description: 'Overcapacity Penalty' }
    ],
    output: 'Allokation berechnet: 6.880 Einheiten verteilt',
    explanation: 'Der Min-Cost Flow Solver maximiert die gewichtete Summe der Allokationen unter Einhaltung von Supply-, Demand- und Capacity-Constraints. Underfill wird mit Penalty μ bestraft, Overcapacity mit λ.'
  },
  {
    id: 'step-10',
    step: 10,
    title: 'Rationing under Shortage',
    status: 'WARN',
    summary: 'Proportionale Rationierung angewendet (Supply: 93.8% des Bedarfs)',
    what: 'Aufgrund der Supply-Unterdeckung wurde eine proportionale Rationierung durchgeführt mit iterativer Kapazitäts-Clipping.',
    inputs: [
      { label: 'Rationierungsstrategie', value: 'Proportional', source: 'Variantenkonfiguration' },
      { label: 'Gesamtbedarf', value: '7.600 Einheiten', source: 'Schritt 4' },
      { label: 'Verfügbar', value: '7.130 Einheiten', source: 'Schritt 6' },
      { label: 'Redistribution Iterationen', value: '3', source: 'Algorithmus' }
    ],
    formula: 'x_{i,s} = min(Need_{i,s}, CapMaxUnits_{i,s}, Need_{i,s} × Available_i / Σ_s Need_{i,s})',
    formulaInputs: [
      { symbol: 'Need_{i,s}', value: 67, source: 'Schritt 4', description: 'Nachschubsbedarf' },
      { symbol: 'CapMaxUnits_{i,s}', value: 72, source: 'Kapazitätsberechnung', description: 'floor(Free / p_i)' },
      { symbol: 'Available_i', value: 1100, source: 'Schritt 6', description: 'DC-Verfügbarkeit für SKU' },
      { symbol: 'Σ_s Need_{i,s}', value: 1280, source: 'Aggregation', description: 'Gesamtbedarf für SKU' }
    ],
    output: 'Rationierung abgeschlossen, 3 Iterationen benötigt',
    limitingFactor: 'Supply-Shortage führt zu durchschnittlich 93.8% Coverage',
    explanation: 'Bei proportionaler Rationierung erhält jede Filiale einen Anteil proportional zu ihrem Bedarf. Nach Clipping an Kapazitätsgrenzen wird die frei gewordene Menge in weiteren Iterationen auf nicht-kapazitätsbeschränkte Filialen umverteilt.',
    warnings: [
      'Supply-Shortage: 470 Einheiten',
      'Redistribution: 3 Iterationen',
      '32 Filialen an Kapazitätsgrenze geclippt'
    ]
  },
  {
    id: 'step-11',
    step: 11,
    title: 'Stockout Prevention (MinFill)',
    status: 'WARN',
    summary: 'MinFill erfüllt für 233/245 Filialen',
    what: 'Sicherstellung der Mindestpräsentation, um Leerregale zu vermeiden. Bei Nichterreichbarkeit wird Substitution vorbereitet.',
    inputs: [
      { label: 'MinFill-Profil', value: 'Core', source: 'Variantenkonfiguration' },
      { label: 'Presentation Min (Ø)', value: '4.8 Einheiten', source: 'Parameter' },
      { label: 'Filialen unter MinFill', value: '12', source: 'Validierung' }
    ],
    formula: 'x_{i,s} >= Min_{i,s} (soft constraint with penalty)',
    formulaInputs: [
      { symbol: 'x_{i,s}', value: 30, source: 'Allokation', description: 'Allokierte Menge' },
      { symbol: 'Min_{i,s}', value: 4, source: 'Präsentationsparameter', description: 'Mindestpräsentation' }
    ],
    output: 'MinFill erfüllt: 95.1% (233/245 Filialen)',
    limitingFactor: '12 Filialen unter MinFill-Schwelle → Substitution erforderlich',
    explanation: 'Die Mindestpräsentation wurde als Soft Constraint behandelt. Für 12 Filialen konnte die MinFill-Schwelle aufgrund von Supply- oder Kapazitätsengpässen nicht erreicht werden. Diese Filialen sind Kandidaten für Substitution.',
    warnings: [
      '12 Filialen unter MinFill',
      'Stockout-Risiko für diese Filialen: Hoch',
      'Substitution wird in Schritt 12 geprüft'
    ]
  },
  {
    id: 'step-12',
    step: 12,
    title: 'Substitution / Fallback',
    status: 'WARN',
    summary: '6 Filialen mit aktiver Substitution',
    what: 'In Filialen mit kritischem Stockout-Risiko oder MinFill-Unterschreitung wurde Substitution mit alternativen SKUs durchgeführt.',
    inputs: [
      { label: 'Substitutionsstrategie', value: 'Within Product Group', source: 'Variantenkonfiguration' },
      { label: 'Trigger', value: 'MinFill Gap > 50% OR DOS < 7 Tage', source: 'Regel' },
      { label: 'Betroffene Filialen', value: '6', source: 'Schritt 11' },
      { label: 'Substitute SKUs verwendet', value: '3', source: 'Substitutionslogik' }
    ],
    formula: 'Efficiency_g = Forecast_g / SpaceDemand_g, SubFill_s = min(FreeCapacity_{s,h}, RemainingMinFillGap_s)',
    formulaInputs: [
      { symbol: 'Forecast_g', value: 425, source: 'Prognosesystem', description: 'Prognose für Ersatz-SKU' },
      { symbol: 'SpaceDemand_g', value: 148.75, source: 'p_i × Forecast_g', description: 'Raumbedarf für Ersatz-SKU' },
      { symbol: 'FreeCapacity_{s,h}', value: 8.4, source: 'Kapazität nach Primär-Allokation', description: 'Freie Kapazität' },
      { symbol: 'RemainingMinFillGap_s', value: 2, source: 'MinFill - Allocated', description: 'Verbleibende MinFill-Lücke' }
    ],
    output: 'Substitution in 6 Filialen durchgeführt, +48 Einheiten allokiert',
    limitingFactor: 'Substitution aktiv aufgrund Stockout-Risiko',
    explanation: 'Für 6 Filialen mit kritischem Stockout-Risiko wurden alternative SKUs aus der gleichen Produktgruppe allokiert. Die Auswahl erfolgte nach Efficiency (Forecast/SpaceDemand) und Verfügbarkeit. Die Substitution verbessert die Service-Level-Erfüllung um 1.2%.',
    warnings: [
      'Substitution aktiv in 6 Filialen',
      'Primär-SKU HIK-BOO-023 → Substitute: RUN-PRO-001 (Basic)',
      'Effizienz-Verbesserung: +8.5%'
    ]
  },
  {
    id: 'step-13',
    step: 13,
    title: 'Pack/LOT Repair',
    status: 'OK',
    summary: '47 Pack-Reparaturen durchgeführt',
    what: 'Allokationsmengen wurden auf volle Packgrößen gerundet (Best Effort Mode).',
    inputs: [
      { label: 'Pack Enforcement', value: 'Best Effort', source: 'Variantenkonfiguration' },
      { label: 'Reparaturen erforderlich', value: '47', source: 'Validierung' },
      { label: 'Aufrundungen', value: '32', source: 'Reparatur' },
      { label: 'Abrundungen', value: '15', source: 'Reparatur' }
    ],
    formula: 'x_{i,s} = c_i × y_{i,s}, wobei y_{i,s} = round(x_{i,s}_proposed / c_i)',
    formulaInputs: [
      { symbol: 'c_i', value: 6, source: 'Artikelparameter', description: 'Packgröße' },
      { symbol: 'x_{i,s}_proposed', value: 67, source: 'Solver', description: 'Vorgeschlagene Menge' },
      { symbol: 'y_{i,s}', value: 11, source: 'round(67/6)', description: 'Anzahl Packs' },
      { symbol: 'x_{i,s}', value: 66, source: '6 × 11', description: 'Finale Menge' }
    ],
    output: 'Pack-Reparaturen: +156 Einheiten (Aufrundung), -85 Einheiten (Abrundung)',
    explanation: 'Im Best Effort Mode wurden Mengen auf die nächste volle Packgröße gerundet. Bei Kapazitätskonflikten wurde abgerundet. Netto-Änderung: +71 Einheiten durch Aufrundungen.'
  },
  {
    id: 'step-14',
    step: 14,
    title: 'Size Curve Repair',
    status: 'OK',
    summary: '24 Size Curve Reparaturen durchgeführt',
    what: 'Größenverteilungen wurden an Zielkurven angepasst unter Einhaltung von Mindestgrößen und Kapazitätsgrenzen.',
    inputs: [
      { label: 'Size Curve Active', value: 'Ja', source: 'Variantenkonfiguration' },
      { label: 'Min Sizes per Store', value: '3', source: 'Variantenkonfiguration' },
      { label: 'Reparaturen', value: '24', source: 'Validierung' }
    ],
    formula: 'x_{i,s,k} ≈ share_k × x_{i,s}, mit Constraints: min 1 in core sizes, capacity limits',
    formulaInputs: [
      { symbol: 'share_k', value: 0.25, source: 'Größenkurve', description: 'Ziel-Anteil für Größe k' },
      { symbol: 'x_{i,s}', value: 66, source: 'Schritt 13', description: 'Gesamt-Allokation' },
      { symbol: 'x_{i,s,k}', value: 17, source: 'Reparatur', description: 'Allokation für Größe k' }
    ],
    output: 'Size Curves angepasst, Min-Größen-Constraint erfüllt',
    explanation: 'Die Größenverteilung wurde an die Zielkurve angepasst. In allen Stores wurden mindestens 3 Größen allokiert. Kleinere Abweichungen von der Zielkurve wurden akzeptiert, um Pack-Constraints zu erfüllen.'
  },
  {
    id: 'step-15',
    step: 15,
    title: 'Finalization & Exceptions',
    status: 'WARN',
    summary: 'Allokation abgeschlossen: 6.880 Einheiten, 18 Exceptions',
    what: 'Die finale Allokation wurde validiert und Exceptions wurden für kritische Situationen erzeugt.',
    inputs: [
      { label: 'Finale Allokation', value: '6.880 Einheiten', source: 'Schritt 14' },
      { label: 'Service Level erreicht', value: '87.3%', source: 'KPI-Berechnung' },
      { label: 'Exceptions erzeugt', value: '18', source: 'Validierung' },
      { label: 'Stockout Risk Stores', value: '12', source: 'DOS-Berechnung' }
    ],
    formula: 'ServiceLevelFulfillment = (Allocated / Need) × 100%',
    formulaInputs: [
      { symbol: 'Allocated', value: 6880, source: 'Finale Allokation', description: 'Allokierte Gesamtmenge' },
      { symbol: 'Need', value: 7600, source: 'Schritt 4', description: 'Nachschubsbedarf' }
    ],
    output: 'Replenishment Run abgeschlossen: 90.5% Coverage',
    limitingFactor: 'Service Level Target nicht erreicht (87.3% vs. 95%)',
    explanation: 'Der Replenishment-Lauf wurde erfolgreich abgeschlossen. Aufgrund von Supply-Engpässen konnten 90.5% des Nachschubsbedarfs gedeckt werden. 18 Exceptions wurden für manuelle Nachbearbeitung erzeugt: 12 für Stockout-Risiko, 6 für Substitutions-Review.',
    warnings: [
      'Service Level Target nicht erreicht: 87.3% (Ziel: 95%)',
      '12 Filialen mit Stockout-Risiko (DOS < 14 Tage)',
      '6 Filialen mit aktiver Substitution',
      '18 Exceptions zur manuellen Prüfung'
    ]
  }
];
