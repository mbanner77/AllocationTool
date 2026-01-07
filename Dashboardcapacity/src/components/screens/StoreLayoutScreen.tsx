import { useState } from 'react';
import { useLanguage } from '../../i18n';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Building2, Upload, Save, RotateCcw, Sparkles, RotateCw, Trash2, Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { AssortmentDistributionAnalysis } from './AssortmentDistributionAnalysis';

interface StoreLayoutScreenProps {
  onNavigate: (screen: string) => void;
}

interface Store {
  id: string;
  name: string;
  city: string;
  region: string;
  hasLayout: boolean;
  layout?: StoreLayoutConfig;
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

interface LayoutKPI {
  totalArea: number;
  usableArea: number;
  occupiedArea: number;
  freeArea: number;
  capacityImpact: number;
}

interface Fixture {
  id: string;
  type: string;
  icon: string;
  capacity: number;
  preferredCategory?: string;
}

interface Zone {
  id: string;
  type: string;
  icon: string;
  isFixed: boolean;
}

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

const MOCK_STORES: Store[] = [
  { 
    id: 'F001', 
    name: 'BLICK Zürich Hauptbahnhof', 
    city: 'Zürich', 
    region: 'Zürich', 
    hasLayout: true,
    layout: {
      width: 700,
      height: 500,
      totalArea: 180,
      usableArea: 150,
      aisles: [
        // Hauptgang horizontal (Mitte)
        { x: 0, y: 200, width: 700, height: 80, orientation: 'horizontal' },
        // Quergang vertikal links - erweitert bis unten
        { x: 150, y: 0, width: 60, height: 520, orientation: 'vertical' },
        // Quergang vertikal rechts - erweitert bis unten
        { x: 490, y: 0, width: 60, height: 520, orientation: 'vertical' },
      ],
      zones: [
        { type: 'emergency', x: 660, y: 210, width: 40, height: 80 },
        { type: 'cashier', x: 0, y: 420, width: 140, height: 100 },
        { type: 'window', x: 0, y: 0, width: 140, height: 60 },
        { type: 'storage', x: 560, y: 420, width: 140, height: 100 },
      ]
    }
  },
  { 
    id: 'F002', 
    name: 'BLICK Basel Marktplatz', 
    city: 'Basel', 
    region: 'Basel-Stadt', 
    hasLayout: true,
    layout: {
      width: 600,
      height: 450,
      totalArea: 145,
      usableArea: 120,
      aisles: [
        // L-förmiges Gang-System
        { x: 0, y: 150, width: 600, height: 70, orientation: 'horizontal' },
        { x: 280, y: 0, width: 70, height: 470, orientation: 'vertical' },
      ],
      zones: [
        { type: 'emergency', x: 560, y: 155, width: 40, height: 60 },
        { type: 'cashier', x: 0, y: 360, width: 120, height: 110 },
        { type: 'window', x: 0, y: 0, width: 270, height: 50 },
        { type: 'storage', x: 480, y: 360, width: 120, height: 110 },
      ]
    }
  },
  { 
    id: 'F003', 
    name: 'BLICK Bern Waisenhausplatz', 
    city: 'Bern', 
    region: 'Bern', 
    hasLayout: false,
    layout: {
      width: 550,
      height: 400,
      totalArea: 125,
      usableArea: 105,
      aisles: [
        // Parallel-Gang-System
        { x: 0, y: 130, width: 550, height: 60, orientation: 'horizontal' },
        { x: 0, y: 270, width: 550, height: 60, orientation: 'horizontal' },
      ],
      zones: [
        { type: 'emergency', x: 510, y: 170, width: 40, height: 60 },
        { type: 'cashier', x: 0, y: 340, width: 150, height: 80 },
        { type: 'window', x: 0, y: 0, width: 200, height: 50 },
      ]
    }
  },
  { 
    id: 'F004', 
    name: 'BLICK Luzern Pilatusstrasse', 
    city: 'Luzern', 
    region: 'Luzern', 
    hasLayout: true,
    layout: {
      width: 800,
      height: 520,
      totalArea: 210,
      usableArea: 175,
      aisles: [
        // Raster-Gang-System
        { x: 0, y: 170, width: 800, height: 70, orientation: 'horizontal' },
        { x: 0, y: 340, width: 800, height: 70, orientation: 'horizontal' },
        { x: 200, y: 0, width: 70, height: 540, orientation: 'vertical' },
        { x: 530, y: 0, width: 70, height: 540, orientation: 'vertical' },
      ],
      zones: [
        { type: 'emergency', x: 760, y: 220, width: 40, height: 80 },
        { type: 'cashier', x: 0, y: 420, width: 190, height: 120 },
        { type: 'window', x: 0, y: 0, width: 190, height: 70 },
        { type: 'storage', x: 610, y: 420, width: 190, height: 120 },
      ]
    }
  },
  { 
    id: 'F005', 
    name: 'BLICK St. Gallen Marktgasse', 
    city: 'St. Gallen', 
    region: 'St. Gallen', 
    hasLayout: false,
    layout: {
      width: 650,
      height: 480,
      totalArea: 160,
      usableArea: 135,
      aisles: [
        // Kreuz-Gang-System
        { x: 0, y: 200, width: 650, height: 80, orientation: 'horizontal' },
        { x: 285, y: 0, width: 80, height: 500, orientation: 'vertical' },
      ],
      zones: [
        { type: 'emergency', x: 610, y: 210, width: 40, height: 70 },
        { type: 'cashier', x: 0, y: 390, width: 140, height: 110 },
        { type: 'window', x: 0, y: 0, width: 275, height: 60 },
        { type: 'storage', x: 510, y: 390, width: 140, height: 110 },
      ]
    }
  },
];

const FIXTURES: Fixture[] = [
  { id: 'gondola', type: 'Gondel', icon: '▭', capacity: 4.8, preferredCategory: 'Mode' },
  { id: 'wallshelf', type: 'Wandregal', icon: '▬', capacity: 3.2, preferredCategory: 'Accessoires' },
  { id: 'table', type: 'Tisch', icon: '▢', capacity: 2.4, preferredCategory: 'Promotion' },
  { id: 'actionarea', type: 'Aktionsfläche', icon: '◇', capacity: 6.0, preferredCategory: 'Seasonal' },
  { id: 'backwall', type: 'Rückwand', icon: '▮', capacity: 8.0, preferredCategory: 'Core Range' },
  { id: 'hookwall', type: 'Hakenwand', icon: '⊞', capacity: 5.6, preferredCategory: 'Schmuck' },
  { id: 'checkout', type: 'Kassenmodul', icon: '▣', capacity: 1.2 },
];

const ZONES: Zone[] = [
  { id: 'aisle', type: 'Gang', icon: '░', isFixed: true },
  { id: 'emergency', type: 'Notausgang', icon: '⚠', isFixed: true },
  { id: 'cashier', type: 'Kasse', icon: '▣', isFixed: true },
  { id: 'window', type: 'Schaufenster', icon: '▯', isFixed: true },
  { id: 'storage', type: 'Lagerzugang', icon: '▨', isFixed: true },
];

export function StoreLayoutScreen({ onNavigate }: StoreLayoutScreenProps) {
  const { t } = useLanguage();
  const [selectedStore, setSelectedStore] = useState<string>(MOCK_STORES[0].id);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showKIModal, setShowKIModal] = useState(false);
  const [placedFixtures, setPlacedFixtures] = useState<PlacedFixture[]>([]);
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [draggedFixture, setDraggedFixture] = useState<string | null>(null);
  const [draggedPlacedFixture, setDraggedPlacedFixture] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasChanges, setHasChanges] = useState(false);

  const store = MOCK_STORES.find(s => s.id === selectedStore);

  // Reset placed fixtures when store changes
  const handleStoreChange = (newStoreId: string) => {
    setSelectedStore(newStoreId);
    setPlacedFixtures([]);
    setSelectedFixture(null);
    setHasChanges(false);
  };

  // Mock KPI calculation
  const calculateKPI = (): LayoutKPI => {
    const totalCapacity = placedFixtures.reduce((sum, f) => sum + f.capacity, 0);
    return {
      totalArea: store?.layout?.totalArea || 0,
      usableArea: store?.layout?.usableArea || 0,
      occupiedArea: totalCapacity,
      freeArea: store?.layout?.usableArea ? store.layout.usableArea - totalCapacity : 0,
      capacityImpact: totalCapacity - 120,
    };
  };

  const kpi = calculateKPI();

  const getFreeAreaColor = () => {
    if (kpi.freeArea < 0) return 'var(--status-danger)';
    if (kpi.freeArea < 10) return 'var(--status-warning)';
    return 'var(--status-success)';
  };

  const handleDragStart = (fixtureType: string) => {
    setDraggedFixture(fixtureType);
    setDraggedPlacedFixture(null);
  };

  const handlePlacedFixtureDragStart = (e: React.DragEvent, fixtureId: string) => {
    const fixture = placedFixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setDraggedPlacedFixture(fixtureId);
    setDraggedFixture(null);
    
    // Set drag image to make it look better
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = draggedPlacedFixture ? 'move' : 'copy';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const canvas = e.currentTarget.getBoundingClientRect();
    const storeContainer = store?.layout;
    if (!storeContainer) return;

    // Calculate position relative to store outline (accounting for the 20px offset)
    const x = e.clientX - canvas.left - 20 - (draggedPlacedFixture ? dragOffset.x : 40);
    const y = e.clientY - canvas.top - 20 - (draggedPlacedFixture ? dragOffset.y : 20);

    if (draggedPlacedFixture) {
      // Moving existing fixture
      const fixture = placedFixtures.find(f => f.id === draggedPlacedFixture);
      if (!fixture) return;

      const maxX = storeContainer.width - fixture.width;
      const maxY = storeContainer.height - fixture.height;

      setPlacedFixtures(placedFixtures.map(f =>
        f.id === draggedPlacedFixture
          ? { ...f, x: Math.max(0, Math.min(x, maxX)), y: Math.max(0, Math.min(y, maxY)) }
          : f
      ));
      setDraggedPlacedFixture(null);
      setHasChanges(true);
    } else if (draggedFixture) {
      // Adding new fixture from palette
      const fixture = FIXTURES.find(f => f.type === draggedFixture);
      if (!fixture) return;

      const maxX = storeContainer.width - 100;
      const maxY = storeContainer.height - 40;

      const newFixture: PlacedFixture = {
        id: Date.now().toString(),
        fixtureType: draggedFixture,
        x: Math.max(0, Math.min(x, maxX)),
        y: Math.max(0, Math.min(y, maxY)),
        width: 100,
        height: 40,
        rotation: 0,
        capacity: fixture.capacity,
        assignedCategory: fixture.preferredCategory,
      };

      setPlacedFixtures([...placedFixtures, newFixture]);
      setDraggedFixture(null);
      setHasChanges(true);
    }
  };

  const handleRotateFixture = (id: string) => {
    setPlacedFixtures(placedFixtures.map(f => 
      f.id === id ? { ...f, rotation: (f.rotation + 90) % 360 } : f
    ));
    setHasChanges(true);
  };

  const handleDeleteFixture = (id: string) => {
    setPlacedFixtures(placedFixtures.filter(f => f.id !== id));
    setSelectedFixture(null);
    setHasChanges(true);
  };

  const handleSaveLayout = () => {
    // Mock save action
    setHasChanges(false);
    alert('Layout erfolgreich gespeichert!');
  };

  const handleDiscardChanges = () => {
    // Mock discard action
    setHasChanges(false);
    alert('Änderungen verworfen');
  };

  const handleGenerateKIProposal = () => {
    setShowKIModal(true);
  };

  const handleApplyKIProposal = () => {
    if (!store?.layout) return;

    const layout = store.layout;
    const margin = 8; // Minimum space between fixtures for walkability
    const proposal: PlacedFixture[] = [];
    let idCounter = 1;

    // Helper function to check if area overlaps with restricted zones
    const isAreaRestricted = (x: number, y: number, width: number, height: number): boolean => {
      // Check overlap with aisles (Gänge)
      for (const aisle of layout.aisles) {
        if (!(x + width <= aisle.x || x >= aisle.x + aisle.width ||
              y + height <= aisle.y || y >= aisle.y + aisle.height)) {
          return true; // Overlaps with aisle
        }
      }
      
      // Check overlap with zones (Kasse, Notausgang, Schaufenster, Lager)
      for (const zone of layout.zones) {
        if (!(x + width <= zone.x || x >= zone.x + zone.width ||
              y + height <= zone.y || y >= zone.y + zone.height)) {
          return true; // Overlaps with zone
        }
      }
      
      return false;
    };

    // Helper function to check if area overlaps with already placed fixtures
    const overlapsWithFixtures = (x: number, y: number, width: number, height: number): boolean => {
      for (const fixture of proposal) {
        if (!(x + width + margin <= fixture.x || x >= fixture.x + fixture.width + margin ||
              y + height + margin <= fixture.y || y >= fixture.y + fixture.height + margin)) {
          return true; // Overlaps with existing fixture
        }
      }
      return false;
    };

    // Helper function to check if position is valid
    const isValidPosition = (x: number, y: number, width: number, height: number): boolean => {
      // Check bounds - ensure elements are fully within the layout boundaries
      // Use >= to prevent elements from touching or exceeding boundaries
      if (x < 0 || y < 0 || x + width > layout.width || y + height > layout.height) {
        return false;
      }
      // Check restricted areas
      if (isAreaRestricted(x, y, width, height)) {
        return false;
      }
      // Check overlap with other fixtures
      if (overlapsWithFixtures(x, y, width, height)) {
        return false;
      }
      return true;
    };

    // Helper function to find edge positions for back walls (Rückwände)
    const findEdgePlacement = (width: number, height: number): { x: number; y: number; rotation: number } | null => {
      // Try each edge in order
      const edges = [
        // Top edge (no rotation) - fixture stays width x height
        { 
          startX: 0, 
          startY: 0, 
          rotation: 0, 
          scanAxis: 'x', // scan along x-axis
          maxScan: layout.width - width,
          checkWidth: width,
          checkHeight: height,
        },
        // Bottom edge (no rotation)
        { 
          startX: 0, 
          startY: layout.height - height, 
          rotation: 0, 
          scanAxis: 'x',
          maxScan: layout.width - width,
          checkWidth: width,
          checkHeight: height,
        },
        // Left edge (rotated 90°) - fixture becomes height x width
        { 
          startX: 0, 
          startY: 0, 
          rotation: 90, 
          scanAxis: 'y',
          maxScan: layout.height - width, // when rotated, original width becomes height
          checkWidth: height, // when rotated, height becomes width
          checkHeight: width, // when rotated, width becomes height
        },
        // Right edge (rotated 90°)
        { 
          startX: layout.width - height, // when rotated, height becomes the width
          startY: 0, 
          rotation: 90, 
          scanAxis: 'y',
          maxScan: layout.height - width,
          checkWidth: height,
          checkHeight: width,
        },
      ];

      for (const edge of edges) {
        const step = 20;
        
        // Skip if maxScan is negative (fixture doesn't fit on this edge)
        if (edge.maxScan < 0) continue;
        
        for (let pos = 0; pos <= edge.maxScan; pos += step) {
          const x = edge.scanAxis === 'x' ? pos : edge.startX;
          const y = edge.scanAxis === 'y' ? pos : edge.startY;
          
          if (isValidPosition(x, y, edge.checkWidth, edge.checkHeight)) {
            return { x, y, rotation: edge.rotation };
          }
        }
      }
      
      return null;
    };

    // Helper function to systematically fill available space
    const fillSpace = (fixtureType: string, width: number, height: number, capacity: number, category: string, maxCount: number = 100): void => {
      const gridStep = 15; // Grid resolution for scanning
      
      // Ensure we don't scan beyond the valid placement area
      const maxY = layout.height - height;
      const maxX = layout.width - width;
      
      for (let y = 0; y <= maxY; y += gridStep) {
        for (let x = 0; x <= maxX; x += gridStep) {
          if (proposal.length >= maxCount) return;
          
          if (isValidPosition(x, y, width, height)) {
            proposal.push({
              id: `ki${idCounter++}`,
              fixtureType,
              x,
              y,
              width,
              height,
              rotation: 0,
              capacity,
              assignedCategory: category,
            });
          }
        }
      }
    };

    // Step 1: Place Rückwände (back walls) at edges first
    const backwallWidth = 180;
    const backwallHeight = 40;
    const backwallCapacity = 8.0;
    
    for (let i = 0; i < 4; i++) { // Try to place up to 4 back walls
      const edgePlacement = findEdgePlacement(backwallWidth, backwallHeight);
      if (edgePlacement) {
        proposal.push({
          id: `ki${idCounter++}`,
          fixtureType: 'Rückwand',
          x: edgePlacement.x,
          y: edgePlacement.y,
          width: backwallWidth,  // Keep original dimensions
          height: backwallHeight, // Keep original dimensions
          rotation: edgePlacement.rotation,
          capacity: backwallCapacity,
          assignedCategory: 'Core Range',
        });
      }
    }

    // Step 2: Fill space with Gondeln (shelving units)
    const gondelWidth = 100;
    const gondelHeight = 40;
    fillSpace('Gondel', gondelWidth, gondelHeight, 4.8, 'Mode', 15);

    // Step 3: Place Wandregale (wall shelves)
    const wandregalWidth = 100;
    const wandregalHeight = 30;
    fillSpace('Wandregal', wandregalWidth, wandregalHeight, 3.2, 'Accessoires', 10);

    // Step 4: Place Aktionsflächen (promotion areas)
    const aktionsWidth = 100;
    const aktionsHeight = 80;
    fillSpace('Aktionsfläche', aktionsWidth, aktionsHeight, 6.0, 'Seasonal', 5);

    // Step 5: Place Tische (tables)
    const tischWidth = 70;
    const tischHeight = 70;
    fillSpace('Tisch', tischWidth, tischHeight, 2.4, 'Promotion', 8);

    // Step 6: Place Hakenwände (hook walls)
    const hakenwandWidth = 90;
    const hakenwandHeight = 30;
    fillSpace('Hakenwand', hakenwandWidth, hakenwandHeight, 5.6, 'Schmuck', 6);

    // Step 7: Fill remaining small spaces with smaller fixtures
    const smallShelfWidth = 60;
    const smallShelfHeight = 30;
    fillSpace('Wandregal', smallShelfWidth, smallShelfHeight, 2.0, 'Accessoires', 10);

    setPlacedFixtures(proposal);
    setShowKIModal(false);
    setHasChanges(true);
  };

  // Calculate fixture statistics
  const fixtureStats = placedFixtures.reduce((acc, fixture) => {
    const existing = acc.find(s => s.type === fixture.fixtureType);
    if (existing) {
      existing.count++;
      existing.area += fixture.capacity;
    } else {
      acc.push({
        type: fixture.fixtureType,
        count: 1,
        area: fixture.capacity,
        capacity: fixture.capacity,
        category: fixture.assignedCategory || '-',
      });
    }
    return acc;
  }, [] as Array<{ type: string; count: number; area: number; capacity: number; category: string }>);

  return (
    <div className="h-full flex flex-col">
      {/* Breadcrumb */}
      <div className="mb-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <button 
                onClick={() => onNavigate('capacity')}
                style={{ color: 'var(--text-link-secondary)' }}
                className="hover:underline"
              >
                Kapazität
              </button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Filiallayout & Warenträger</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 style={{ 
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-semibold)',
          marginBottom: 'var(--space-2)'
        }}>
          Filiallayout & Warenträger
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
          Visualisierung und Planung der Verkaufsfläche auf Basis von Warenträgern und Kapazitätswirkung
        </p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="layout" className="flex-1 flex flex-col min-h-0">
        <TabsList style={{ width: 'fit-content', marginBottom: 'var(--space-6)' }}>
          <TabsTrigger value="layout">Layout & Warenträger</TabsTrigger>
          <TabsTrigger value="analysis">Sortimentsverteilung (Analyse)</TabsTrigger>
        </TabsList>

        {/* Tab: Layout & Warenträger */}
        <TabsContent value="layout" className="flex-1 flex flex-col min-h-0 mt-0">
          {/* Control Card */}
          <div 
            className="p-4 rounded-lg border mb-6"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <div className="flex flex-wrap items-center gap-6">
              {/* Store Selection */}
              <div className="flex-1 min-w-[250px]">
                <label 
                  htmlFor="store-select" 
                  className="block mb-2"
                  style={{ 
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                >
                  Filiale auswählen
                </label>
                <div className="flex items-center gap-2">
                  <Select value={selectedStore} onValueChange={handleStoreChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_STORES.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          <div className="flex items-center gap-2">
                            <Building2 size={16} />
                            <span>{store.id} - {store.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {store && (
                    <Badge variant={store.hasLayout ? "default" : "secondary"}>
                      {store.hasLayout ? 'Layout vorhanden' : 'Neu'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* KPI Tiles */}
              <div className="flex gap-4">
                <div className="text-center">
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Gesamtfläche
                  </div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {kpi.totalArea} m²
                  </div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Nutzbare Fläche
                  </div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {kpi.usableArea} m²
                  </div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Belegte Fläche
                  </div>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)' }}>
                    {kpi.occupiedArea.toFixed(1)} m²
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
                      color: getFreeAreaColor()
                    }}
                  >
                    {kpi.freeArea.toFixed(1)} m²
                  </div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    Kapazitätswirkung
                  </div>
                  <div 
                    style={{ 
                      fontSize: 'var(--font-size-lg)', 
                      fontWeight: 'var(--font-weight-semibold)',
                      color: kpi.capacityImpact >= 0 ? 'var(--status-success)' : 'var(--status-danger)'
                    }}
                  >
                    {kpi.capacityImpact > 0 ? '+' : ''}{kpi.capacityImpact.toFixed(1)} m²
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setShowImportModal(true)}>
                  <Upload size={16} />
                  Import Grundriss
                </Button>
                <Button variant="outline" onClick={handleGenerateKIProposal}>
                  <Sparkles size={16} />
                  KI-Vorschlag
                </Button>
                {hasChanges && (
                  <>
                    <Button variant="outline" onClick={handleDiscardChanges}>
                      <RotateCcw size={16} />
                      Verwerfen
                    </Button>
                    <Button onClick={handleSaveLayout}>
                      <Save size={16} />
                      Speichern
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Split Layout */}
          <div className="flex-1 flex gap-6 min-h-0">
            {/* Left Sidebar - Fixtures & Zones Palette */}
            <div 
              className="w-[280px] rounded-lg border p-4 overflow-y-auto"
              style={{
                backgroundColor: 'var(--surface-alt)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)',
              }}
            >
              {/* Fixtures Section */}
              <div className="mb-6">
                <h3 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--space-3)'
                  }}
                >
                  Warenträger
                </h3>
                <div className="space-y-2">
                  {FIXTURES.map(fixture => (
                    <div
                      key={fixture.id}
                      draggable
                      onDragStart={() => handleDragStart(fixture.type)}
                      className="p-3 rounded border cursor-move transition-all"
                      style={{
                        backgroundColor: 'var(--surface-page)',
                        borderColor: 'var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--brand-primary)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ fontSize: '18px' }}>{fixture.icon}</span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                          {fixture.type}
                        </span>
                      </div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Kapazität: {fixture.capacity} m²
                      </div>
                      {fixture.preferredCategory && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          Bevorzugt: {fixture.preferredCategory}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Zones Section */}
              <div>
                <h3 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    marginBottom: 'var(--space-3)'
                  }}
                >
                  Zonen (fixe Elemente)
                </h3>
                <div className="space-y-2">
                  {ZONES.map(zone => (
                    <div
                      key={zone.id}
                      className="p-3 rounded border"
                      style={{
                        backgroundColor: 'var(--surface-page)',
                        borderColor: 'var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        opacity: 0.6,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '18px' }}>{zone.icon}</span>
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>
                          {zone.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Canvas Area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Canvas */}
              <div 
                className="relative rounded-lg border flex-1 mb-6 overflow-auto"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: 'var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  minHeight: `${(store?.layout?.height || 500) + 60}px`,
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
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
                    width: `${store?.layout?.width || 700}px`,
                    height: `${(store?.layout?.height || 500) + 20}px`,
                    borderColor: 'var(--text-primary)',
                    borderStyle: 'solid',
                  }}
                >
                  {/* Aisles (Gänge) */}
                  {store?.layout?.aisles.map((aisle, index) => (
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
                  {store?.layout?.zones.map((zone, index) => (
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

                  {/* Placed Fixtures */}
                  {placedFixtures.map(fixture => (
                    <div
                      key={fixture.id}
                      className="absolute cursor-pointer border-2 transition-all"
                      style={{
                        left: `${fixture.x}px`,
                        top: `${fixture.y}px`,
                        width: `${fixture.rotation % 180 === 90 ? fixture.height : fixture.width}px`,
                        height: `${fixture.rotation % 180 === 90 ? fixture.width : fixture.height}px`,
                        backgroundColor: 'var(--surface-subtle-tint)',
                        borderColor: selectedFixture === fixture.id ? 'var(--brand-primary)' : 'var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        borderWidth: selectedFixture === fixture.id ? '3px' : '2px',
                      }}
                      onClick={() => setSelectedFixture(fixture.id)}
                      draggable
                      onDragStart={(e) => handlePlacedFixtureDragStart(e, fixture.id)}
                    >
                      <div className="h-full flex flex-col items-center justify-center p-1">
                        <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                          {fixture.fixtureType}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                          {fixture.capacity} m²
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Helper Text */}
                {placedFixtures.length === 0 && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ 
                      color: 'var(--text-muted)',
                      fontSize: 'var(--font-size-sm)',
                      pointerEvents: 'none'
                    }}
                  >
                    Ziehen Sie Warenträger aus der linken Palette auf die Fläche
                  </div>
                )}

                {/* Properties Panel (when fixture selected) */}
                {selectedFixture && (
                  <div
                    className="absolute bottom-4 right-4 p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--surface-page)',
                      borderColor: 'var(--border-default)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-md)',
                      minWidth: '200px',
                    }}
                  >
                    {(() => {
                      const fixture = placedFixtures.find(f => f.id === selectedFixture);
                      if (!fixture) return null;
                      
                      return (
                        <>
                          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                            Eigenschaften
                          </div>
                          <div className="space-y-2 mb-3">
                            <div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Typ</div>
                              <div style={{ fontSize: 'var(--font-size-sm)' }}>{fixture.fixtureType}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Kapazität</div>
                              <div style={{ fontSize: 'var(--font-size-sm)' }}>{fixture.capacity} m²</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>Warengruppe</div>
                              <div style={{ fontSize: 'var(--font-size-sm)' }}>{fixture.assignedCategory || '-'}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleRotateFixture(fixture.id)}
                            >
                              <RotateCw size={14} />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDeleteFixture(fixture.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Detail Table */}
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
                    Warenträgerübersicht
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: 'var(--surface-alt)', borderBottom: '1px solid var(--border-default)' }}>
                        <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Warenträger-Typ
                        </th>
                        <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Anzahl
                        </th>
                        <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Belegte Fläche (m²)
                        </th>
                        <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Kapazitt (m²)
                        </th>
                        <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                          Zugeordnete Warengruppe
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fixtureStats.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center p-6" style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                            Keine Warenträger platziert
                          </td>
                        </tr>
                      ) : (
                        fixtureStats.map((stat, index) => (
                          <tr 
                            key={index}
                            style={{ borderBottom: '1px solid var(--border-subtle)' }}
                          >
                            <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                              {stat.type}
                            </td>
                            <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                              {stat.count}
                            </td>
                            <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                              {stat.area.toFixed(1)}
                            </td>
                            <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                              {stat.capacity.toFixed(1)}
                            </td>
                            <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>
                              {stat.category}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Integration Banner */}
              <div 
                className="mt-4 p-3 rounded-lg border flex items-start gap-3"
                style={{
                  backgroundColor: 'var(--surface-subtle-tint)',
                  borderColor: 'var(--brand-primary)',
                }}
              >
                <Info size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)', marginBottom: '2px' }}>
                    Integration mit Kapazitätsplanung
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    Dieses Layout bestimmt die IST-Kapazität der Filiale und fließt direkt in Simulation, Allokation und Prognose ein.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Import Modal */}
          <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Grundriss importieren</DialogTitle>
                <DialogDescription>
                  Laden Sie einen Grundriss hoch, um das Layout automatisch zu erkennen
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    Dateiformat wählen
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Format auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cad">CAD (DWG / DXF)</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="image">Bild (PNG / JPG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    Maßstab
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. 1:100"
                    className="w-full p-2 rounded border"
                    style={{
                      borderColor: 'var(--border-input)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  />
                </div>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
                  style={{ borderColor: 'var(--border-default)' }}
                >
                  <Upload size={32} style={{ margin: '0 auto', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }} />
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    Datei hier ablegen oder klicken zum Hochladen
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowImportModal(false)}>
                  Abbrechen
                </Button>
                <Button onClick={() => setShowImportModal(false)}>
                  Grundriss übernehmen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* KI Proposal Modal */}
          <Dialog open={showKIModal} onOpenChange={setShowKIModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} style={{ color: 'var(--brand-primary)' }} />
                    KI-Vorschlag generieren
                  </div>
                </DialogTitle>
                <DialogDescription>
                  Das System analysiert Ihre Filiale und erstellt einen optimierten Layout-Vorschlag
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-3">
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    Analysefaktoren:
                  </div>
                  <ul className="space-y-2" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                    <li className="flex items-center gap-2">
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />
                      Filialgröße und Geometrie
                    </li>
                    <li className="flex items-center gap-2">
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />
                      Fixe Zonen (Kasse, Notausgänge, etc.)
                    </li>
                    <li className="flex items-center gap-2">
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />
                      Umsatzklasse und Kundenfrequenz
                    </li>
                    <li className="flex items-center gap-2">
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />
                      Warengruppenstruktur
                    </li>
                    <li className="flex items-center gap-2">
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />
                      Best Practices aus ähnlichen Filialen
                    </li>
                  </ul>
                  <div 
                    className="p-3 rounded-lg mt-4"
                    style={{
                      backgroundColor: 'var(--surface-subtle-tint)',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Der KI-Vorschlag dient als Ausgangspunkt. Sie können jeden Warenträger individuell anpassen.
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowKIModal(false)}>
                  Abbrechen
                </Button>
                <Button onClick={handleApplyKIProposal}>
                  <Sparkles size={16} />
                  Vorschlag erzeugen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab: Sortimentsverteilung (Analyse) */}
        <TabsContent value="analysis" className="flex-1 flex flex-col min-h-0 mt-0">
          {store && <AssortmentDistributionAnalysis store={store} placedFixtures={placedFixtures} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}