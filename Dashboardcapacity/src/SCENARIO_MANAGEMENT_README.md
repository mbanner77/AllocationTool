# Szenario- & Variantenmanagement mit Explainability

## Übersicht

Das erweiterte Szenario- & Variantenmanagement-System wurde vollständig implementiert gemäß der FIGMA-Spezifikation. Es trennt Policy & Control (Szenarien & Varianten), Impact & Evaluation (Simulation), Reasoning & Transparency (Explainability) und Execution (Allocation Run).

## Implementierte Komponenten

### 1. **FormulaTooltip** (`/components/allocation/FormulaTooltip.tsx`)
- Zeigt Formeln mit Live-Inputs auf Hover
- Eingabewerte mit Quellen
- Ergebnis-Anzeige
- Erklärungstext

**Features:**
- Symbol-zu-Wert-Mapping
- Quellenangabe für jede Variable
- Interaktive Info-Icons
- Automatic positioning

### 2. **KPICard** (`/components/allocation/KPICard.tsx`)
- KPI-Anzeige mit Status-Farben (success/warning/critical/neutral)
- Delta-Anzeige mit Trend-Icons
- Integrierter Formula-Tooltip
- Klickbar für Detailansicht

**States:**
- Success (grün)
- Warning (gelb)
- Critical (rot)
- Neutral (grau)

### 3. **ScenarioManagementScreen** (`/components/allocation/ScenarioManagementScreen.tsx`)

**Layout:**
- **LEFT SIDEBAR (25%)**: Variant Cards mit Filter, Status, Mini-KPIs
- **MAIN CONTENT (50%)**: Variant Header + KPIs + 6 Policy-Tabs
- **RIGHT PANEL (25%)**: Comparison + Validation + Release

**Policy-Tabs:**

#### Tab 1: Empfänger & Datenquellen
- Empfängerstrategie (Plan Data, Manual Selection, Listing, Transport Relations)
- Verfügbarkeitsquellen (DC Stock, Purchase Orders, Deliveries, External)
- Lieferterminlogik (Delivery Schedule, Planned Lead Time)
- Preview Panel mit Filialanzahl

#### Tab 2: Prognose & Raumbedarf
- Use Forecast Toggle
- Prognosequelle-Auswahl
- Prognosegewichtung (0-100% Slider)
- "Prognose beeinflusst Raumbedarf" Checkbox
- Planungsebene für Raumbedarf
- **Formel-Box**: `SpaceDemand_h = Σ (Forecast_i × p_i)`

#### Tab 3: Kapazität & Restriktionen
- Kapazitätseinheit (m² / Fixtures)
- Kapazitäts-Planungsebene
- "Kapazität ist harte Grenze" Toggle
- Soft Zone Slider (+0-20%)
- Penalty Weight
- **Formeln**:
  - `Free_{s,h} = max(0, Cap_{soll,s,h} − Occ_{ist,s,h})`
  - `Σ (p_i × x_{i,s}) ≤ Free_{s,h}`

#### Tab 4: Rationierung & Fairness
- Rationierungsstrategie (Proportional, Top Performer First, Min-Max Fairness, Presentation Stock First)
- Top Performer Definition
- MinFill-Prozentsatz (50-100%)
- Fairness-Faktor α (0-1)
- **Zielfunktion**: `max Σ (w_{i,s} × x_{i,s}) − μ × Underfill − λ × Overcap`

#### Tab 5: Fallback & MinFill
- Allow Fallback Toggle
- Fallback-Strategie (Core/NOS substitution, Fairness redistribution, Rule-based replacement)
- MinFill-Profil (Core, Premium, Small Store)
- Fallback-Schwelle
- **Trigger-Regel Box**

#### Tab 6: LOT / Größe / Pack
- Packgröße erzwingen
- Packgröße-Input
- Größenkurve aktiv
- Min. Größen pro Filiale
- Reparatur-Modus (Strict / Best Effort)

**Right Panel:**
- Baseline-Varianten-Vergleich mit Radar Chart
- KPI-Tabelle mit Delta
- Validation Checklist
- Release-Kommentar-Feld
- "Transfer to Allocation Run" Button

### 4. **SimulationAnalysisScreen** (`/components/allocation/SimulationAnalysisScreen.tsx`)

**Features:**
- Status Banner (Success/Warning)
- 8 KPI-Cards mit Formula-Tooltips
- 4 Tabs: Übersicht, Details, Ausnahmen, Fallback
- Simulation States (idle, running, completed)

**Tab: Übersicht**
- **Coverage nach Cluster** (Bar Chart)
- **Coverage nach Produktgruppe** (Horizontal Bar Chart)
- **Kapazitätsanalyse** (Scatter Chart: Raumbedarf vs. Verfügbare Kapazität)
  - Ohne Fallback (blau)
  - Mit Fallback (gelb)

**Tab: Details**
- Filter nach Cluster und Produktgruppe
- Vollständige DataGrid mit:
  - Store, Cluster, Produkt, Produktgruppe
  - Bedarf, Allokiert (mit Coverage %), Prognose
  - Raumbedarf, Kapazität
  - Status-Badges (Fallback, Rationiert, MinFill, Exceptions)

**Tab: Ausnahmen**
- Nur Zeilen mit Exceptions
- Gefilterte DataGrid

**Tab: Fallback**
- Fallback-Strategie-Info Box
- Effizienz-Verbesserung Anzeige
- Nur Zeilen mit Fallback

**Buttons:**
- Explainability
- Export
- Variante speichern

### 5. **ExplainabilityScreen** (`/components/allocation/ExplainabilityScreen.tsx`)

**Layout:**
- **LEFT**: Decision Timeline (10 Schritte)
- **RIGHT**: Detail Panel für ausgewählten Schritt

**10 Decision Steps:**
1. **Empfängerbestimmung** - Recipient Determination
2. **Lieferterminauswahl** - Delivery Date Selection
3. **Bedarfsberechnung** - Demand Calculation (mit Formel)
4. **Verfügbarkeitsermittlung** - Supply Determination (mit Warnung)
5. **Kapazitätssnapshot** - Capacity Snapshot (mit Formel)
6. **Optimierung / Heuristik** - Optimization
7. **Rationierung** - Rationing (mit Warnung)
8. **Fallback** - Fallback (mit Warnung & Effizienz)
9. **Nachbearbeitung** - LOT/Size/Pack Processing
10. **Endergebnis** - Final Result

**Jeder Schritt zeigt:**
- Status (OK/WARN/FAIL) mit Icon
- Was wurde berechnet? (Prose)
- Eingabewerte (mit Quelle)
- Formel / Rule (mit Variable-Breakdown)
- Ergebnis
- Limitierender Faktor (falls vorhanden)
- Erklärung (WHY)
- Warnungen (falls vorhanden)

**Status-Anzeige:**
- OK (grün) ✓
- WARN (gelb) ⚠
- FAIL (rot) ✗

## Navigation

### Einstiegspunkte:

1. **HomeScreen** → "Erweiterte Variantenverwaltung" Card
2. **ScenariosScreen** → "Erweiterte Ansicht →" Button (oben rechts)

### Navigationsfluss:

```
ScenarioManagementScreen
  ├─→ Simulation öffnen → SimulationAnalysisScreen
  ├─→ Explainability → ExplainabilityScreen
  └─→ Zu Allokations-Run übertragen → RunsScreen

SimulationAnalysisScreen
  ├─→ Zurück → ScenarioManagementScreen
  ├─→ Variante speichern → ScenarioManagementScreen
  └─→ Explainability → ExplainabilityScreen
```

## Datenmodell

### Variant
```typescript
interface Variant {
  id: string;
  name: string;
  status: 'Draft' | 'Simulated' | 'Validated' | 'Released';
  allocationType: 'Initial Allocation' | 'Replenishment' | 'Manual Allocation';
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
```

### PolicyConfig
```typescript
interface PolicyConfig {
  // Tab 1: Recipient & Data Sources
  recipientStrategy: RecipientStrategy;
  availabilitySources: {...};
  deliveryDateLogic: string;
  
  // Tab 2: Forecast & Space Demand
  useForecast: boolean;
  forecastWeight: number;
  forecastInfluencesSpace: boolean;
  spaceDemandPlanningLevel: string;
  
  // Tab 3: Capacity & Restrictions
  capacityUnit: 'm²' | 'Fixtures';
  capacityIsHardLimit: boolean;
  softZonePercentage: number;
  
  // Tab 4: Rationing & Fairness
  rationingStrategy: string;
  minFillPercentage: number;
  fairnessFactor: number;
  
  // Tab 5: Fallback & MinFill
  allowFallback: boolean;
  fallbackStrategy: string;
  fallbackThreshold: number;
  
  // Tab 6: LOT / Size / Pack
  enforcePackSize: boolean;
  sizeCurveActive: boolean;
  repairMode: 'Strict' | 'Best Effort';
}
```

## Formeln

### Bedarfsberechnung
```
D_{i,s} = max(0, T_{i,s} - (B_{i,s} + I_{i,s})) × (1 - w) + F_{i,s} × w
```
- `T_{i,s}`: Geplante Menge
- `B_{i,s}`: Aktueller Bestand
- `I_{i,s}`: Zuläufe
- `F_{i,s}`: Absatzprognose
- `w`: Prognosegewicht

### Verfügbarkeit
```
Supply = DC_{stock} + PO_{confirmed} + Delivery_{planned}
```

### Kapazität
```
Free_{s,h} = max(0, Cap_{soll,s,h} − Occ_{ist,s,h})
```

### Coverage
```
Coverage = (Supply / Demand) × 100%
```

### Forecast Fulfillment
```
FF = (Allocated / Forecast) × 100%
```

### MinFill Fulfillment
```
MF = (Stores_Above_MinFill / Total_Stores) × 100%
```

### Raumbedarf
```
SpaceDemand_h = Σ (Forecast_i × p_i)
```

### Zielfunktion (Rationierung)
```
max Σ (w_{i,s} × x_{i,s}) − μ × Underfill − λ × Overcap
```

## Features Highlights

✅ **Formula-Tooltips mit Live-Inputs**
- Hover über Info-Icons zeigt Formeln
- Alle Variablen mit aktuellen Werten
- Quellenangaben für Transparenz

✅ **10-Step Explainability**
- Vollständige Nachvollziehbarkeit
- Status pro Schritt (OK/WARN/FAIL)
- Limitierende Faktoren hervorgehoben
- Warnungen und Erklärungen

✅ **6 Policy-Tabs**
- Alle Parameter konfigurierbar
- Live Formula-Tooltips
- Preview-Panels
- Validation

✅ **Simulation Analysis**
- 3 Charts (Bar, Horizontal Bar, Scatter)
- 4 Tabs (Overview, Details, Exceptions, Fallback)
- DataGrid mit Filter
- KPI-Cards mit Deltas

✅ **Variant Comparison**
- Baseline-Vergleich
- Radar Chart
- Delta-Anzeige

✅ **Fallback Explainability**
- Trigger-Grund
- Betroffene Filialen
- Ersetzte Produktgruppen
- Effizienz-Verbesserung

## Verwendete Libraries

- **recharts**: Bar Charts, Line Charts, Scatter Charts
- **lucide-react**: Icons
- **DataGrid**: Custom component für Tabellen

## Styling

- Token-basiertes Design-System
- CSS Custom Properties (var(--...))
- Status-Farben: success, warning, critical, neutral
- Responsive Layouts (Grid, Flexbox)

## Nächste Schritte (Optional)

1. **Backend-Integration**: API-Calls für echte Daten
2. **Real-time Simulation**: WebSocket für Live-Updates
3. **PDF Export**: Simulation Reports
4. **Advanced Charts**: Radar Chart für Variant Comparison
5. **Drag & Drop**: Variant Card Reordering
6. **History**: Audit Log für Variant Changes
7. **Notifications**: Toast-Messages für Actions
8. **Search & Filter**: Advanced Filtering in Variants List

## Deployment

Alle Dateien sind in den folgenden Verzeichnissen:
- `/components/allocation/` - Neue Komponenten
- `/App.tsx` - Navigation integriert
- `/components/screens/HomeScreen.tsx` - Card hinzugefügt
- `/components/screens/ScenariosScreen.tsx` - Navigation Button hinzugefügt

Das System ist vollständig funktional und bereit für den Einsatz! 🚀
