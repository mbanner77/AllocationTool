import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface PlacedFixture {
  id: string;
  fixtureType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  capacity: number;
  assignedCategory?: string;
  productGroupDistribution?: ProductGroupDistribution[];
}

interface ProductGroupDistribution {
  productGroup: string;
  area: number;
  percentage: number;
  color: string;
  targetPercentage?: number;
  deviation?: number;
}

interface StoreLayoutConfig {
  width: number;
  height: number;
  aisles: Aisle[];
  zones: FixedZone[];
  totalArea: number;
  usableArea: number;
}

interface Aisle {
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical';
}

interface FixedZone {
  type: 'emergency' | 'cashier' | 'window' | 'storage';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Store {
  id: string;
  name: string;
  layout?: StoreLayoutConfig;
}

interface AssortmentDistributionAnalysisProps {
  store: Store;
  placedFixtures: PlacedFixture[];
}

// Product group colors
const PRODUCT_GROUP_COLORS: Record<string, string> = {
  'Schuhe': '#2563eb',
  'Taschen': '#10b981',
  'Accessoires': '#f59e0b',
  'Mode': '#8b5cf6',
  'Schmuck': '#ec4899',
  'Seasonal': '#06b6d4',
  'Promotion': '#f97316',
  'Core Range': '#6366f1',
};

export function AssortmentDistributionAnalysis({ store, placedFixtures }: AssortmentDistributionAnalysisProps) {
  const [selectedFixtureId, setSelectedFixtureId] = useState<string | null>(null);
  const [highlightedFixtureId, setHighlightedFixtureId] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'aggregated' | 'product-groups' | 'hierarchy'>('product-groups');

  // Generate mock product group distributions for all fixtures
  const fixturesWithDistribution: PlacedFixture[] = placedFixtures.map(fixture => {
    if (fixture.productGroupDistribution) return fixture;

    // Generate realistic distribution based on assigned category
    const distributions: ProductGroupDistribution[] = [];
    const mainGroup = fixture.assignedCategory || 'Mode';
    const mainColor = PRODUCT_GROUP_COLORS[mainGroup] || '#2563eb';

    if (mainGroup === 'Mode') {
      distributions.push(
        { productGroup: 'Schuhe', area: fixture.capacity * 0.6, percentage: 60, color: PRODUCT_GROUP_COLORS['Schuhe'], targetPercentage: 55, deviation: 5 },
        { productGroup: 'Accessoires', area: fixture.capacity * 0.4, percentage: 40, color: PRODUCT_GROUP_COLORS['Accessoires'], targetPercentage: 45, deviation: -5 }
      );
    } else if (mainGroup === 'Accessoires') {
      distributions.push(
        { productGroup: 'Taschen', area: fixture.capacity * 0.5, percentage: 50, color: PRODUCT_GROUP_COLORS['Taschen'], targetPercentage: 50, deviation: 0 },
        { productGroup: 'Accessoires', area: fixture.capacity * 0.3, percentage: 30, color: PRODUCT_GROUP_COLORS['Accessoires'], targetPercentage: 30, deviation: 0 },
        { productGroup: 'Schmuck', area: fixture.capacity * 0.2, percentage: 20, color: PRODUCT_GROUP_COLORS['Schmuck'], targetPercentage: 20, deviation: 0 }
      );
    } else if (mainGroup === 'Seasonal') {
      distributions.push(
        { productGroup: 'Seasonal', area: fixture.capacity * 0.7, percentage: 70, color: PRODUCT_GROUP_COLORS['Seasonal'], targetPercentage: 60, deviation: 10 },
        { productGroup: 'Promotion', area: fixture.capacity * 0.3, percentage: 30, color: PRODUCT_GROUP_COLORS['Promotion'], targetPercentage: 40, deviation: -10 }
      );
    } else if (mainGroup === 'Core Range') {
      distributions.push(
        { productGroup: 'Schuhe', area: fixture.capacity * 0.35, percentage: 35, color: PRODUCT_GROUP_COLORS['Schuhe'], targetPercentage: 30, deviation: 5 },
        { productGroup: 'Mode', area: fixture.capacity * 0.35, percentage: 35, color: PRODUCT_GROUP_COLORS['Mode'], targetPercentage: 40, deviation: -5 },
        { productGroup: 'Taschen', area: fixture.capacity * 0.3, percentage: 30, color: PRODUCT_GROUP_COLORS['Taschen'], targetPercentage: 30, deviation: 0 }
      );
    } else if (mainGroup === 'Schmuck') {
      distributions.push(
        { productGroup: 'Schmuck', area: fixture.capacity * 0.8, percentage: 80, color: PRODUCT_GROUP_COLORS['Schmuck'], targetPercentage: 75, deviation: 5 },
        { productGroup: 'Accessoires', area: fixture.capacity * 0.2, percentage: 20, color: PRODUCT_GROUP_COLORS['Accessoires'], targetPercentage: 25, deviation: -5 }
      );
    } else if (mainGroup === 'Promotion') {
      distributions.push(
        { productGroup: 'Promotion', area: fixture.capacity * 0.6, percentage: 60, color: PRODUCT_GROUP_COLORS['Promotion'], targetPercentage: 50, deviation: 10 },
        { productGroup: 'Seasonal', area: fixture.capacity * 0.4, percentage: 40, color: PRODUCT_GROUP_COLORS['Seasonal'], targetPercentage: 50, deviation: -10 }
      );
    } else {
      distributions.push(
        { productGroup: mainGroup, area: fixture.capacity * 1.0, percentage: 100, color: mainColor, targetPercentage: 100, deviation: 0 }
      );
    }

    return { ...fixture, productGroupDistribution: distributions };
  });

  // Calculate overall area distribution across all fixtures
  const totalDistribution = fixturesWithDistribution.reduce((acc, fixture) => {
    fixture.productGroupDistribution?.forEach(dist => {
      const existing = acc.find(a => a.productGroup === dist.productGroup);
      if (existing) {
        existing.area += dist.area;
      } else {
        acc.push({ 
          productGroup: dist.productGroup, 
          area: dist.area, 
          percentage: 0, 
          color: dist.color,
          targetPercentage: dist.targetPercentage,
          deviation: 0,
        });
      }
    });
    return acc;
  }, [] as ProductGroupDistribution[]);

  // Update percentages for overall distribution
  const totalArea = totalDistribution.reduce((sum, d) => sum + d.area, 0);
  totalDistribution.forEach(d => {
    d.percentage = totalArea > 0 ? (d.area / totalArea) * 100 : 0;
  });

  // Calculate conflict overview - fixtures with significant deviations
  const conflictData = fixturesWithDistribution
    .map(fixture => {
      // Calculate total absolute deviation across all product groups in this fixture
      const totalDeviation = fixture.productGroupDistribution?.reduce((sum, d) => sum + Math.abs(d.deviation || 0), 0) || 0;
      
      // Get the largest single deviation for display
      const maxDeviation = Math.max(...(fixture.productGroupDistribution?.map(d => Math.abs(d.deviation || 0)) || [0]));
      
      // Create data structure for stacked bar chart (percentage distribution)
      const fixtureData: any = {
        name: `${fixture.fixtureType} ${fixture.id.substring(0, 6)}`,
        fixtureId: fixture.id,
        deviation: maxDeviation,
        totalDeviation: totalDeviation,
      };

      // Add percentage for each product group
      fixture.productGroupDistribution?.forEach(d => {
        fixtureData[d.productGroup] = d.percentage;
      });

      return fixtureData;
    })
    .filter(d => d.deviation >= 5) // Only show fixtures with at least 5% deviation
    .sort((a, b) => b.deviation - a.deviation)
    .slice(0, 10);

  // Calculate KPIs
  const totalOccupiedArea = fixturesWithDistribution.reduce((sum, f) => sum + f.capacity, 0);
  const totalUsableArea = store.layout?.usableArea || 0;
  const freeArea = totalUsableArea - totalOccupiedArea;
  const conflictCount = conflictData.length;

  const selectedFixture = selectedFixtureId ? fixturesWithDistribution.find(f => f.id === selectedFixtureId) : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Analysis Context Card */}
      <div 
        className="p-4 rounded-lg border mb-6"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div className="flex flex-wrap items-center gap-6">
          {/* Left - Context */}
          <div className="flex-1 min-w-[300px]">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                  Filiale
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                  {store.name}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                  Zeitraum
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                  KW 50-52, 2024
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                  Planungsebene
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                  Produktgruppe
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-1)' }}>
                  Datenbasis
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                  Prognose + Allokation
                </div>
              </div>
            </div>
            <div 
              className="mt-3 p-2 rounded"
              style={{
                backgroundColor: 'var(--surface-subtle-tint)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-muted)'
              }}
            >
              Die Verteilung basiert auf der aktuellen SOLL-Kapazität und Prognose.
            </div>
          </div>

          {/* Middle - KPIs */}
          <div className="flex gap-4">
            <div className="text-center">
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Belegte Fläche
              </div>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                {totalOccupiedArea.toFixed(1)} m²
              </div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Freie Fläche
              </div>
              <div 
                style={{ 
                  fontSize: 'var(--font-size-lg)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: freeArea < 0 ? 'var(--status-danger)' : freeArea < 10 ? 'var(--status-warning)' : 'var(--status-success)'
                }}
              >
                {freeArea.toFixed(1)} m²
              </div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Über-/Unterdeckung
              </div>
              <div 
                style={{ 
                  fontSize: 'var(--font-size-lg)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: Math.abs(freeArea) > 10 ? 'var(--status-warning)' : 'var(--status-success)'
                }}
              >
                {freeArea > 0 ? '+' : ''}{freeArea.toFixed(1)} m²
              </div>
            </div>
            <div className="text-center">
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                Warenträger m. Konflikt
              </div>
              <div 
                style={{ 
                  fontSize: 'var(--font-size-lg)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: conflictCount > 0 ? 'var(--status-warning)' : 'var(--status-success)'
                }}
              >
                {conflictCount}
              </div>
            </div>
          </div>

          {/* Right - Display Options */}
          <div className="flex gap-2 ml-auto">
            <Select value={displayMode} onValueChange={(v) => setDisplayMode(v as typeof displayMode)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aggregated">Aggregiert</SelectItem>
                <SelectItem value="product-groups">Nach Produktgruppen</SelectItem>
                <SelectItem value="hierarchy">Nach Hierarchieebene</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* Store Layout Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <div 
            className="relative rounded-lg border flex-1 mb-6 overflow-auto"
            style={{
              backgroundColor: '#ffffff',
              borderColor: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              minHeight: `${(store.layout?.height || 500) + 60}px`,
            }}
          >
            {/* Grid Background */}
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />

            {/* Store Outline */}
            <div
              className="absolute border-2"
              style={{
                left: '20px',
                top: '20px',
                width: `${store.layout?.width || 700}px`,
                height: `${(store.layout?.height || 500) + 20}px`,
                borderColor: 'var(--text-primary)',
                borderStyle: 'solid',
              }}
            >
              {/* Aisles */}
              {store.layout?.aisles.map((aisle, index) => (
                <div
                  key={index}
                  className="absolute"
                  style={{
                    left: `${aisle.x}px`,
                    top: `${aisle.y}px`,
                    width: `${aisle.width}px`,
                    height: `${aisle.height}px`,
                    backgroundColor: '#e5e5e5',
                    opacity: 0.5,
                  }}
                />
              ))}

              {/* Fixed Zones */}
              {store.layout?.zones.map((zone, index) => (
                <div
                  key={`zone-${index}`}
                  className="absolute flex items-center justify-center"
                  style={{
                    left: `${zone.x}px`,
                    top: `${zone.y}px`,
                    width: `${zone.width}px`,
                    height: `${zone.height}px`,
                    backgroundColor: zone.type === 'emergency' ? '#fee2e2' : zone.type === 'cashier' ? '#dbeafe' : zone.type === 'window' ? '#fef3c7' : '#e0e7ff',
                    border: zone.type === 'emergency' ? '2px solid var(--status-danger)' : '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {zone.type === 'emergency' && <span style={{ fontSize: '20px' }}>⚠</span>}
                  {zone.type === 'cashier' && <span style={{ fontSize: '20px' }}>▣</span>}
                  {zone.type === 'window' && <span style={{ fontSize: '20px' }}>▯</span>}
                  {zone.type === 'storage' && <span style={{ fontSize: '20px' }}>▨</span>}
                </div>
              ))}

              {/* Placed Fixtures with Product Group Segmentation */}
              {fixturesWithDistribution.map(fixture => {
                const isHighlighted = highlightedFixtureId === fixture.id;
                const isSelected = selectedFixtureId === fixture.id;

                return (
                  <div
                    key={fixture.id}
                    className="absolute cursor-pointer border-2 transition-all overflow-hidden"
                    style={{
                      left: `${fixture.x}px`,
                      top: `${fixture.y}px`,
                      width: `${fixture.rotation % 180 === 90 ? fixture.height : fixture.width}px`,
                      height: `${fixture.rotation % 180 === 90 ? fixture.width : fixture.height}px`,
                      borderColor: isSelected ? 'var(--brand-primary)' : isHighlighted ? 'var(--status-warning)' : 'var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      borderWidth: isSelected ? '3px' : '2px',
                      boxShadow: isHighlighted ? 'var(--shadow-md)' : undefined,
                    }}
                    onClick={() => setSelectedFixtureId(fixture.id)}
                    onMouseEnter={() => setHighlightedFixtureId(fixture.id)}
                    onMouseLeave={() => setHighlightedFixtureId(null)}
                  >
                    {/* Product Group Segments */}
                    {displayMode === 'product-groups' && fixture.productGroupDistribution && (
                      <div className="h-full flex">
                        {fixture.productGroupDistribution.map((dist, idx) => (
                          <div
                            key={idx}
                            style={{
                              flex: dist.percentage,
                              backgroundColor: dist.color,
                              opacity: 0.7,
                            }}
                            title={`${dist.productGroup}: ${dist.percentage.toFixed(0)}%`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Aggregated View */}
                    {displayMode === 'aggregated' && (
                      <div 
                        className="h-full"
                        style={{
                          backgroundColor: 'var(--surface-subtle-tint)',
                        }}
                      />
                    )}

                    {/* Overlay Badge - showing utilization percentage */}
                    <div 
                      className="absolute top-0 right-0 px-1.5 py-0.5 rounded-bl"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'white',
                        lineHeight: '1.2',
                      }}
                    >
                      <div>IST: 100%</div>
                      <div style={{ opacity: 0.8 }}>SOLL: 100%</div>
                    </div>

                    {/* Conflict Indicator */}
                    {conflictData.some(c => c.fixtureId === fixture.id) && (
                      <div 
                        className="absolute top-0 left-0 p-1"
                        style={{ color: 'var(--status-warning)' }}
                      >
                        <AlertCircle size={14} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Area Distribution Chart */}
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                height: '350px',
              }}
            >
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)' }}>
                Flächenanteile nach Produktgruppe
              </h3>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={totalDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.productGroup}: ${entry.percentage.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="area"
                      nameKey="productGroup"
                    >
                      {totalDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)} m²`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Conflict Overview Chart */}
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                height: '350px',
              }}
            >
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-4)' }}>
                Warenträgersegmentierung
              </h3>
              <div style={{ width: '100%', height: '280px' }}>
                <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
                  <BarChart data={conflictData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} label={{ value: '%', position: 'insideRight' }} />
                    <YAxis dataKey="name" type="category" width={120} style={{ fontSize: 'var(--font-size-xs)' }} />
                    <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Legend />
                    {totalDistribution.map(d => (
                      <Bar key={d.productGroup} dataKey={d.productGroup} stackId="a" fill={d.color} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table - Assortment Distribution */}
          <div 
            className="rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                Sortimentsverteilung (Warenträger)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border-default)' }}>
                    <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Warenträger
                    </th>
                    <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Zone
                    </th>
                    <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Kapazität (m²)
                    </th>
                    <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Belegte Fläche (m²)
                    </th>
                    <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Hauptproduktgruppe
                    </th>
                    <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Offene Fläche (m²)
                    </th>
                    <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fixturesWithDistribution.map((fixture, index) => {
                    const mainGroup = fixture.productGroupDistribution?.[0];
                    // Calculate occupied area (sum of all product group areas)
                    const occupiedArea = fixture.productGroupDistribution?.reduce((sum, d) => sum + d.area, 0) || 0;
                    // Calculate open area (capacity - occupied area)
                    const openArea = fixture.capacity - occupiedArea;
                    // Determine status based on open area
                    let status: 'success' | 'warning' | 'danger';
                    if (openArea === 0) {
                      status = 'success'; // Volle Belegung - OK
                    } else if (openArea < 0) {
                      status = 'danger'; // Überbelegung - Konflikt
                    } else {
                      status = 'warning'; // Unterbelegung - Warnung
                    }

                    return (
                      <tr 
                        key={index}
                        style={{ 
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: highlightedFixtureId === fixture.id ? 'var(--surface-subtle-tint)' : undefined,
                          cursor: 'pointer'
                        }}
                        onClick={() => setHighlightedFixtureId(fixture.id)}
                        onMouseEnter={() => setHighlightedFixtureId(fixture.id)}
                        onMouseLeave={() => setHighlightedFixtureId(null)}
                      >
                        <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                          {fixture.fixtureType}
                        </td>
                        <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                          Verkaufsfläche
                        </td>
                        <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                          {fixture.capacity.toFixed(1)}
                        </td>
                        <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                          {occupiedArea.toFixed(1)}
                        </td>
                        <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                          {mainGroup?.productGroup || '-'}
                        </td>
                        <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                          {openArea > 0 ? '+' : ''}{openArea.toFixed(1)}
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant={status === 'success' ? 'default' : 'secondary'}
                            style={{
                              backgroundColor: status === 'danger' ? 'var(--status-danger)' : status === 'warning' ? 'var(--status-warning)' : 'var(--status-success)',
                              color: 'white'
                            }}
                          >
                            {status === 'success' ? 'OK' : status === 'warning' ? 'Warnung' : 'Konflikt'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Banner */}
          <div 
            className="mt-4 p-3 rounded-lg border flex items-start gap-3"
            style={{
              backgroundColor: 'var(--surface-subtle-tint)',
              borderColor: 'var(--border-default)',
            }}
          >
            <AlertCircle size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: '2px' }}>
                Bezug zur Kapazitätsplanung
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Diese Analyse erklärt, wie sich die gewählte Artikelhierarchie auf die belegte Fläche verteilt. Anpassungen erfolgen über: SOLL-Kapazität, Prognose, Allokationsparameter
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panel (when fixture selected) */}
        {selectedFixture && (
          <div
            className="w-[350px] rounded-lg border p-4 overflow-y-auto"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              maxHeight: 'calc(100vh - 300px)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                Warenträger – Sortimentsverteilung
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFixtureId(null)}>
                <X size={16} />
              </Button>
            </div>

            {/* Section 1 - Capacity */}
            <div className="mb-4">
              <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Kapazität
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Kapazität gesamt</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>{selectedFixture.capacity.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Belegte Fläche</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>{selectedFixture.capacity.toFixed(1)} m²</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>Freie Fläche</span>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>0.0 m²</span>
                </div>
              </div>
            </div>

            {/* Section 2 - Distribution */}
            <div className="mb-4">
              <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Verteilung
              </h4>
              <div className="border rounded" style={{ borderColor: 'var(--border-default)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border-default)' }}>
                      <th className="text-left p-2" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Produktgruppe</th>
                      <th className="text-right p-2" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Fläche</th>
                      <th className="text-right p-2" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>IST</th>
                      <th className="text-right p-2" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>SOLL</th>
                      <th className="text-right p-2" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFixture.productGroupDistribution?.map((dist, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div style={{ width: '12px', height: '12px', borderRadius: '2px', backgroundColor: dist.color }} />
                            <span style={{ fontSize: 'var(--font-size-sm)' }}>{dist.productGroup}</span>
                          </div>
                        </td>
                        <td className="text-right p-2" style={{ fontSize: 'var(--font-size-sm)' }}>{dist.area.toFixed(1)} m²</td>
                        <td className="text-right p-2" style={{ fontSize: 'var(--font-size-sm)' }}>{dist.percentage.toFixed(0)}%</td>
                        <td className="text-right p-2" style={{ fontSize: 'var(--font-size-sm)' }}>{dist.targetPercentage?.toFixed(0)}%</td>
                        <td 
                          className="text-right p-2" 
                          style={{ 
                            fontSize: 'var(--font-size-sm)',
                            color: Math.abs(dist.deviation || 0) > 5 ? 'var(--status-danger)' : 'var(--status-success)'
                          }}
                        >
                          {(dist.deviation || 0) > 0 ? '+' : ''}{dist.deviation?.toFixed(0)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3 - Assessment */}
            <div>
              <h4 style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Bewertung
              </h4>
              <div 
                className="p-3 rounded"
                style={{
                  backgroundColor: conflictData.some(c => c.fixtureId === selectedFixture.id) ? 'rgba(251, 191, 36, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                  border: `1px solid ${conflictData.some(c => c.fixtureId === selectedFixture.id) ? 'var(--status-warning)' : 'var(--status-success)'}`,
                }}
              >
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--space-1)' }}>
                  Status: {conflictData.some(c => c.fixtureId === selectedFixture.id) ? 'Abweichung vorhanden' : 'OK'}
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                  Abweichungen wirken sich auf die Allokationskürzungen aus.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}