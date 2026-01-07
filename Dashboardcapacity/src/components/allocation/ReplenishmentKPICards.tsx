import { KPICard } from './KPICard';

interface ReplenishmentKPICardsProps {
  variant: {
    kpis: {
      supplyCoverage: number;
      forecastFulfillment: number;
      capacityRisk: string;
    };
    allocationType: string;
  };
}

export function ReplenishmentKPICards({ variant }: ReplenishmentKPICardsProps) {
  const isReplenishment = variant.allocationType === 'Replenishment';

  if (isReplenishment) {
    return (
      <>
        {/* First Row - Replenishment KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Service Level Fulfillment"
            value={variant.kpis.forecastFulfillment}
            unit="%"
            delta={-7.7}
            deltaLabel="vs target 95%"
            state={variant.kpis.forecastFulfillment > 90 ? 'success' : 'warning'}
            formula="SLF = Σ min(1, Coverage_{i,s}) × Weight_{i,s} / Σ Weight_{i,s}"
            formulaInputs={[
              { symbol: 'Coverage_{i,s}', value: 0.873, source: 'Allokationsberechnung', description: 'Allocated / Need' },
              { symbol: 'Weight_{i,s}', value: 12500, source: 'Umsatzdaten', description: 'Gewichtungsfaktor (Umsatz)' }
            ]}
          />
          <KPICard
            title="Stockout Risk Stores"
            value={12}
            delta={-3}
            deltaLabel="vs baseline"
            state={12 > 10 ? 'warning' : 'success'}
            formula="StockoutRisk = stores where DOS < ThresholdDays"
            formulaInputs={[
              { symbol: 'DOS_{i,s}', value: 6.5, source: 'DOS-Berechnung', description: '(OnHand + Inbound + Allocated) / AvgDaily' },
              { symbol: 'ThresholdDays', value: 14, source: 'Systemparameter', description: 'Kritische Schwelle' }
            ]}
          />
          <KPICard
            title="Capacity Utilization Impact"
            value={78.5}
            unit="%"
            delta={2.1}
            deltaLabel="vs current"
            state="success"
            formula="CU = Σ(p_i × Allocated_i,s) / FreeCapacity_{s,h}"
            formulaInputs={[
              { symbol: 'p_i', value: 0.35, source: 'Artikelparameter', description: 'Flächenbedarf pro Einheit' },
              { symbol: 'Allocated_i,s', value: 66, source: 'Allokation', description: 'Allokierte Menge' },
              { symbol: 'FreeCapacity_{s,h}', value: 25.5, source: 'Kapazitätssnapshot', description: 'Freie Kapazität' }
            ]}
          />
          <KPICard
            title="Supply Coverage DC"
            value={variant.kpis.supplyCoverage}
            unit="%"
            delta={-6.2}
            deltaLabel="vs need"
            state={variant.kpis.supplyCoverage > 90 ? 'success' : 'warning'}
            formula="SC = Available_{DC} / Σ Need_{i,s}"
            formulaInputs={[
              { symbol: 'Available_{DC}', value: 7130, source: 'DC Snapshot', description: 'OnHand + Inbound - Reservations' },
              { symbol: 'Σ Need_{i,s}', value: 7600, source: 'Need-Berechnung', description: 'Gesamter Nachschubsbedarf' }
            ]}
          />
        </div>

        {/* Second Row - Additional Replenishment KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <KPICard
            title="Substitution Activated"
            value={6}
            state={6 > 0 ? 'warning' : 'success'}
          />
          <KPICard
            title="Pack Repairs"
            value={47}
            state="neutral"
          />
          <KPICard
            title="Size Curve Repairs"
            value={24}
            state="neutral"
          />
          <KPICard
            title="Avg Days of Supply"
            value={26.2}
            unit="Tage"
            delta={3.5}
            deltaLabel="vs target"
            state="success"
            formula="AvgDOS = Σ((OnHand + Inbound + Allocated) / AvgDailyForecast) / StoreCount"
            formulaInputs={[
              { symbol: 'OnHand + Inbound + Allocated', value: 84, source: 'Berechnung', description: 'Gesamtbestand nach Allokation' },
              { symbol: 'AvgDailyForecast', value: 3.04, source: 'Prognosesystem', description: 'Ø täglicher Absatz' },
              { symbol: 'StoreCount', value: 245, source: 'Empfängerbestimmung', description: 'Anzahl Filialen' }
            ]}
          />
        </div>
      </>
    );
  }

  // Initial Allocation KPIs
  return (
    <>
      {/* First Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Supply Coverage"
          value={variant.kpis.supplyCoverage}
          unit="%"
          delta={-2.3}
          deltaLabel="vs baseline"
          state={variant.kpis.supplyCoverage > 90 ? 'success' : 'warning'}
          formula="Coverage = (Supply / Demand) × 100%"
          formulaInputs={[
            { symbol: 'Supply', value: 24365, source: 'Verfügbarkeitsberechnung' },
            { symbol: 'Demand', value: 28456, source: 'Bedarfsberechnung' }
          ]}
        />
        <KPICard
          title="Forecast Fulfillment"
          value={variant.kpis.forecastFulfillment}
          unit="%"
          delta={5.8}
          deltaLabel="vs baseline"
          state={variant.kpis.forecastFulfillment > 90 ? 'success' : 'warning'}
          formula="FF = (Allocated / Forecast) × 100%"
          formulaInputs={[
            { symbol: 'Allocated', value: 24365, source: 'Allokationsergebnis' },
            { symbol: 'Forecast', value: 25600, source: 'Prognosesystem' }
          ]}
        />
        <KPICard
          title="Capacity Utilization"
          value={82.4}
          unit="%"
          delta={1.2}
          deltaLabel="vs baseline"
          state="success"
          formula="CU = (Σ Space_Used / Σ Space_Available) × 100%"
          formulaInputs={[
            { symbol: 'Space_Used', value: 8240, source: 'Flächenberechnung', description: 'Genutzte Fläche' },
            { symbol: 'Space_Available', value: 10000, source: 'Kapazitätsplanung', description: 'Verfügbare Fläche' }
          ]}
        />
        <KPICard
          title="Exception Count"
          value={32}
          delta={-15.8}
          deltaLabel="vs baseline"
          state={32 < 50 ? 'success' : 'warning'}
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Stores in Fallback"
          value={18}
          state={18 > 0 ? 'warning' : 'success'}
        />
        <KPICard
          title="Undercoverage Units"
          value={4336}
          state="warning"
        />
        <KPICard
          title="Overcapacity"
          value={145}
          unit="m²"
          state="neutral"
        />
        <KPICard
          title="MinFill Fulfillment"
          value={85.2}
          unit="%"
          state="warning"
          formula="MF = (Stores_Above_MinFill / Total_Stores) × 100%"
          formulaInputs={[
            { symbol: 'Stores_Above_MinFill', value: 213, source: 'Rationierungsberechnung' },
            { symbol: 'Total_Stores', value: 245, source: 'Empfängerbestimmung' }
          ]}
        />
      </div>
    </>
  );
}
