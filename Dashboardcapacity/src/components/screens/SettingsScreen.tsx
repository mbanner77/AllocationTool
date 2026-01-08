import { useState } from 'react';
import { DataGrid, Column } from '../common/DataGrid';
import { Plus, Edit2, Trash2, ChevronRight, Copy, Info, Search, X, Check } from 'lucide-react';
import { LocationSelectionModal } from '../common/LocationSelectionModal';
import { StorageLocationModal } from '../common/StorageLocationModal';
import { AllocatorSelectionModal } from '../common/AllocatorSelectionModal';
import { ResponsibilityAreaModal } from '../common/ResponsibilityAreaModal';
import { useLanguage } from '../../i18n';

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

type Tab = 'locations' | 'responsibilities' | 'allocation';
type Scenario = 'initial' | 'replenishment' | 'manual';

interface DistributionCenter {
  id: string;
  name: string;
  address: string;
  warehouses: string[];
}

interface Store {
  id: string;
  name: string;
  address: string;
  cluster: string;
  isReference: boolean;
}

interface Allocator {
  id: string;
  name: string;
  role: 'Allocator' | 'Admin' | 'Planner' | 'Manager';
  responsibilityArea: string;
}

interface ScenarioSettings {
  active: boolean;
  recipientDetermination: string;
  deliveryDateDetermination: string;
  availabilityDetermination: string;
  reductionStrategy: string;
  allocationAlgorithm: string;
}

// Available pool of all distribution centers
const AVAILABLE_DISTRIBUTION_CENTERS: DistributionCenter[] = [
  { id: 'DC-001', name: 'Zentrallager Zürich', address: 'Industriestrasse 45, 8005 Zürich', warehouses: [] },
  { id: 'DC-002', name: 'Regionallager Basel', address: 'Hafenweg 12, 4052 Basel', warehouses: [] },
  { id: 'DC-003', name: 'Logistikzentrum Bern', address: 'Industrieweg 23, 3013 Bern', warehouses: [] },
  { id: 'DC-004', name: 'Verteilzentrum Luzern', address: 'Obergrundstrasse 88, 6005 Luzern', warehouses: [] },
  { id: 'DC-005', name: 'Zentrallager St. Gallen', address: 'Industriestrasse 14, 9014 St. Gallen', warehouses: [] },
  { id: 'DC-006', name: 'Regionallager Genf', address: 'Route de la Chapelle 12, 1212 Genf', warehouses: [] },
];

// Available pool of all stores
const AVAILABLE_STORES: Store[] = [
  { id: 'FL-001', name: 'Zürich HB', address: 'Bahnhofplatz 1, 8001 Zürich', cluster: 'Urban Premium', isReference: false },
  { id: 'FL-002', name: 'Bern Zentrum', address: 'Spitalgasse 4, 3011 Bern', cluster: 'Urban Premium', isReference: false },
  { id: 'FL-003', name: 'Basel SBB', address: 'Centralbahnplatz 1, 4051 Basel', cluster: 'Urban Premium', isReference: false },
  { id: 'FL-004', name: 'Genf Cornavin', address: 'Place de Cornavin 7, 1201 Genf', cluster: 'Urban Premium', isReference: false },
  { id: 'FL-005', name: 'Lausanne Centre', address: 'Rue du Pont 5, 1003 Lausanne', cluster: 'Urban Standard', isReference: false },
  { id: 'FL-006', name: 'Luzern Bahnhof', address: 'Bahnhofstrasse 3, 6003 Luzern', cluster: 'Urban Standard', isReference: false },
  { id: 'FL-007', name: 'St. Gallen Marktplatz', address: 'Marktgasse 12, 9004 St. Gallen', cluster: 'Urban Standard', isReference: false },
  { id: 'FL-008', name: 'Winterthur Stadtgarten', address: 'Stadthausstrasse 8, 8400 Winterthur', cluster: 'Regional', isReference: false },
  { id: 'FL-009', name: 'Lugano Centro', address: 'Via Nassa 15, 6900 Lugano', cluster: 'Regional', isReference: false },
  { id: 'FL-010', name: 'Thun Bälliz', address: 'Bälliz 45, 3600 Thun', cluster: 'Regional', isReference: false },
];

// Available storage locations
const AVAILABLE_STORAGE_LOCATIONS = [
  'Lager A',
  'Lager B', 
  'Lager C',
  'Lager D',
  'Lager E',
  'Lager 1',
  'Lager 2',
  'Lager 3',
  'Hochregallager Nord',
  'Hochregallager Süd',
  'Kommissionierzone 1',
  'Kommissionierzone 2',
  'Kühlhaus',
  'Freilager'
];

const MOCK_DISTRIBUTION_CENTERS: DistributionCenter[] = [
  { id: 'DC-001', name: 'Zentrallager Zürich', address: 'Industriestrasse 45, 8005 Zürich', warehouses: ['Lager A', 'Lager B', 'Lager C'] },
  { id: 'DC-002', name: 'Regionallager Basel', address: 'Hafenweg 12, 4052 Basel', warehouses: ['Lager 1', 'Lager 2'] },
];

const MOCK_STORES: Store[] = [
  { id: 'FL-001', name: 'Zürich HB', address: 'Bahnhofplatz 1, 8001 Zürich', cluster: 'Urban Premium', isReference: true },
  { id: 'FL-002', name: 'Bern Zentrum', address: 'Spitalgasse 4, 3011 Bern', cluster: 'Urban Premium', isReference: false },
  { id: 'FL-003', name: 'Basel Marktplatz', address: 'Marktplatz 10, 4001 Basel', cluster: 'Urban Standard', isReference: false },
];

// Available pool of all allocators
const AVAILABLE_ALLOCATORS: Allocator[] = [
  { id: 'USR-001', name: 'Maria Müller', role: 'Allocator', responsibilityArea: '' },
  { id: 'USR-002', name: 'Andreas Schmidt', role: 'Admin', responsibilityArea: '' },
  { id: 'USR-003', name: 'Julia Weber', role: 'Allocator', responsibilityArea: '' },
  { id: 'USR-004', name: 'Thomas Fischer', role: 'Allocator', responsibilityArea: '' },
  { id: 'USR-005', name: 'Sarah Meier', role: 'Allocator', responsibilityArea: '' },
  { id: 'USR-006', name: 'Michael Huber', role: 'Manager', responsibilityArea: '' },
  { id: 'USR-007', name: 'Laura Zimmermann', role: 'Planner', responsibilityArea: '' },
  { id: 'USR-008', name: 'David Keller', role: 'Allocator', responsibilityArea: '' },
  { id: 'USR-009', name: 'Anna Brunner', role: 'Allocator', responsibilityArea: '' },
  { id: 'USR-010', name: 'Stefan Wyss', role: 'Admin', responsibilityArea: '' },
];

const MOCK_ALLOCATORS: Allocator[] = [
  { id: 'USR-001', name: 'Maria Müller', role: 'Allocator', responsibilityArea: 'Shoes, Apparel' },
  { id: 'USR-002', name: 'Andreas Schmidt', role: 'Admin', responsibilityArea: 'Alle Bereiche' },
  { id: 'USR-003', name: 'Julia Weber', role: 'Allocator', responsibilityArea: 'Electronics, Accessories' },
];

export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('locations');
  const [selectedScenario, setSelectedScenario] = useState<Scenario>('initial');
  const [showDCDrawer, setShowDCDrawer] = useState(false);
  const [showResponsibilityDrawer, setShowResponsibilityDrawer] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Store data with state management
  const [stores, setStores] = useState<Store[]>(MOCK_STORES);
  const [distributionCenters, setDistributionCenters] = useState<DistributionCenter[]>(MOCK_DISTRIBUTION_CENTERS);
  const [allocators, setAllocators] = useState<Allocator[]>(MOCK_ALLOCATORS);
  
  // Modal states
  const [showDCSelectionModal, setShowDCSelectionModal] = useState(false);
  const [showStoreSelectionModal, setShowStoreSelectionModal] = useState(false);
  const [showStorageLocationModal, setShowStorageLocationModal] = useState(false);
  const [editingDCForStorage, setEditingDCForStorage] = useState<DistributionCenter | null>(null);
  const [showAllocatorSelectionModal, setShowAllocatorSelectionModal] = useState(false);
  const [showResponsibilityAreaModal, setShowResponsibilityAreaModal] = useState(false);
  const [editingAllocatorForResponsibility, setEditingAllocatorForResponsibility] = useState<Allocator | null>(null);
  
  // Drawer state for editing
  const [editingDC, setEditingDC] = useState<DistributionCenter | null>(null);
  const [dcFormData, setDcFormData] = useState<DistributionCenter>({
    id: '',
    name: '',
    address: '',
    warehouses: []
  });
  
  // Drawer state for allocator
  const [showAllocatorDrawer, setShowAllocatorDrawer] = useState(false);
  const [editingAllocator, setEditingAllocator] = useState<Allocator | null>(null);
  const [allocatorFormData, setAllocatorFormData] = useState<Allocator>({
    id: '',
    name: '',
    role: 'Allocator',
    responsibilityArea: ''
  });
  const [selectedResponsibilities, setSelectedResponsibilities] = useState<string[]>([]);
  
  const [scenarioSettings, setScenarioSettings] = useState<Record<Scenario, ScenarioSettings>>({
    initial: {
      active: true,
      recipientDetermination: 'Plandaten',
      deliveryDateDetermination: 'Lieferplan',
      availabilityDetermination: 'VZ-Bestand',
      reductionStrategy: 'Proportional',
      allocationAlgorithm: 'Kapazitätsgesteuerte Allokation'
    },
    replenishment: {
      active: true,
      recipientDetermination: 'Listung',
      deliveryDateDetermination: 'Planlieferzeit',
      availabilityDetermination: 'Bestellung',
      reductionStrategy: 'Sollbestand für Top-Performer',
      allocationAlgorithm: 'Prognosegesteuerter Nachschub mit Kapazitätsanpassung'
    },
    manual: {
      active: false,
      recipientDetermination: 'Manuelle Selektion',
      deliveryDateDetermination: 'Lieferplan',
      availabilityDetermination: 'Extern',
      reductionStrategy: 'Präsentationsbestand für alle',
      allocationAlgorithm: 'Sollbestandsgesteuerte Allokation'
    }
  });
  
  const [globalSettings, setGlobalSettings] = useState({
    capacityPlanningEnabled: true,
    hierarchyLevel: 'Produktgruppe',
    quantityUnit: 'Stück'
  });
  
  // Keep track of saved state for reset functionality
  const [savedScenarioSettings, setSavedScenarioSettings] = useState(scenarioSettings);
  const [savedGlobalSettings, setSavedGlobalSettings] = useState(globalSettings);
  const [savedStores, setSavedStores] = useState(stores);
  
  const handleSave = () => {
    // Save current state as the new baseline
    setSavedScenarioSettings(scenarioSettings);
    setSavedGlobalSettings(globalSettings);
    setSavedStores(stores);
    setHasChanges(false);
    alert(t.settings.settingsSaved);
  };
  
  const handleDiscard = () => {
    // Restore saved state
    setScenarioSettings(savedScenarioSettings);
    setGlobalSettings(savedGlobalSettings);
    setStores(savedStores);
    setHasChanges(false);
  };
  
  // Generate random distribution center
  const generateRandomDC = (): DistributionCenter => {
    const cities = [
      { name: 'Zürich', streets: ['Industriestrasse', 'Hardstrasse', 'Europastrasse'], zips: [8005, 8040, 8050] },
      { name: 'Basel', streets: ['Hafenweg', 'Industrieweg', 'Voltastrasse'], zips: [4052, 4056, 4057] },
      { name: 'Bern', streets: ['Industrieweg', 'Autobahn', 'Papiermühlestrasse'], zips: [3013, 3018, 3020] },
      { name: 'Luzern', streets: ['Obergrundstrasse', 'Industriestrasse', 'Arsenalstrasse'], zips: [6005, 6010, 6015] },
      { name: 'St. Gallen', streets: ['Industriestrasse', 'St. Jakob-Strasse', 'Demutstrasse'], zips: [9014, 9015, 9016] },
    ];
    
    const types = ['Zentrallager', 'Regionallager', 'Logistikzentrum', 'Verteilzentrum'];
    const warehouseNames = ['Lager A', 'Lager B', 'Lager C', 'Lager D', 'Lager E', 'Lager 1', 'Lager 2', 'Lager 3'];
    
    const city = cities[Math.floor(Math.random() * cities.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const street = city.streets[Math.floor(Math.random() * city.streets.length)];
    const streetNumber = Math.floor(Math.random() * 100) + 1;
    const zip = city.zips[Math.floor(Math.random() * city.zips.length)];
    
    const warehouseCount = Math.floor(Math.random() * 3) + 2; // 2-4 warehouses
    const selectedWarehouses = [...warehouseNames]
      .sort(() => Math.random() - 0.5)
      .slice(0, warehouseCount);
    
    const newId = `DC-${String(distributionCenters.length + 1).padStart(3, '0')}`;
    
    return {
      id: newId,
      name: `${type} ${city.name}`,
      address: `${street} ${streetNumber}, ${zip} ${city.name}`,
      warehouses: selectedWarehouses
    };
  };
  
  const handleAddNewDC = () => {
    setShowDCSelectionModal(true);
  };
  
  const handleConfirmDCSelection = (selected: DistributionCenter[]) => {
    setDistributionCenters(prev => [...prev, ...selected]);
    setHasChanges(true);
  };
  
  const handleEditDC = (dc: DistributionCenter) => {
    setEditingDC(dc);
    setDcFormData({ ...dc });
    setShowDCDrawer(true);
  };
  
  const handleSaveDC = () => {
    if (editingDC) {
      // Update existing DC
      setDistributionCenters(prev => 
        prev.map(dc => dc.id === editingDC.id ? dcFormData : dc)
      );
    } else {
      // Add new DC
      setDistributionCenters(prev => [...prev, dcFormData]);
    }
    setHasChanges(true);
    setShowDCDrawer(false);
    setEditingDC(null);
  };
  
  const handleCloseDCDrawer = () => {
    setShowDCDrawer(false);
    setEditingDC(null);
    setDcFormData({ id: '', name: '', address: '', warehouses: [] });
  };
  
  // Generate random store
  const generateRandomStore = (): Store => {
    const cities = [
      { name: 'Zürich', locations: ['HB', 'Oerlikon', 'Altstetten', 'Stadelhofen'], streets: ['Bahnhofstrasse', 'Löwenstrasse', 'Rennweg'], zips: [8001, 8002, 8003] },
      { name: 'Basel', locations: ['SBB', 'Marktplatz', 'Claraplatz'], streets: ['Freie Strasse', 'Steinenvorstadt', 'Greifengasse'], zips: [4001, 4002, 4051] },
      { name: 'Bern', locations: ['Bahnhof', 'Zentrum', 'Westside'], streets: ['Spitalgasse', 'Marktgasse', 'Kramgasse'], zips: [3011, 3012, 3014] },
      { name: 'Luzern', locations: ['Bahnhof', 'Altstadt', 'Emmen'], streets: ['Weggisgasse', 'Hertensteinstrasse', 'Pilatusstrasse'], zips: [6003, 6004, 6005] },
      { name: 'St. Gallen', locations: ['Bahnhof', 'Marktplatz', 'Neumarkt'], streets: ['Multergasse', 'Neugasse', 'Goliathgasse'], zips: [9000, 9001, 9004] },
      { name: 'Genf', locations: ['Cornavin', 'Eaux-Vives', 'Plainpalais'], streets: ['Rue du Rhône', 'Rue du Marché', 'Boulevard Helvétique'], zips: [1201, 1204, 1205] },
      { name: 'Winterthur', locations: ['Bahnhof', 'Altstadt', 'Grüze'], streets: ['Marktgasse', 'Stadthausstrasse', 'Theaterstrasse'], zips: [8400, 8401, 8404] },
    ];
    
    const clusters = ['Urban Premium', 'Urban Standard', 'Regional'];
    
    const city = cities[Math.floor(Math.random() * cities.length)];
    const location = city.locations[Math.floor(Math.random() * city.locations.length)];
    const street = city.streets[Math.floor(Math.random() * city.streets.length)];
    const streetNumber = Math.floor(Math.random() * 100) + 1;
    const zip = city.zips[Math.floor(Math.random() * city.zips.length)];
    const cluster = clusters[Math.floor(Math.random() * clusters.length)];
    
    const newId = `FL-${String(stores.length + 1).padStart(3, '0')}`;
    
    return {
      id: newId,
      name: `${city.name} ${location}`,
      address: `${street} ${streetNumber}, ${zip} ${city.name}`,
      cluster: cluster,
      isReference: false
    };
  };
  
  const handleAddNewStore = () => {
    setShowStoreSelectionModal(true);
  };
  
  const handleConfirmStoreSelection = (selected: Store[]) => {
    setStores(prev => [...prev, ...selected]);
    setHasChanges(true);
  };
  
  const handleOpenStorageLocationModal = (dc: DistributionCenter) => {
    setEditingDCForStorage(dc);
    setShowStorageLocationModal(true);
  };
  
  const handleConfirmStorageLocations = (selected: string[]) => {
    if (editingDCForStorage) {
      setDistributionCenters(prev => 
        prev.map(dc => dc.id === editingDCForStorage.id ? { ...dc, warehouses: selected } : dc)
      );
      setHasChanges(true);
    }
  };
  
  // Allocator handlers
  const handleAddNewAllocator = () => {
    setShowAllocatorSelectionModal(true);
  };

  const handleConfirmAllocatorSelection = (selected: Allocator[]) => {
    // Add selected allocators to the list
    setAllocators(prev => [...prev, ...selected]);
    setHasChanges(true);
  };

  const handleConfirmResponsibilityArea = (selectedAreas: string[]) => {
    if (editingAllocatorForResponsibility) {
      const updatedAllocator = {
        ...editingAllocatorForResponsibility,
        responsibilityArea: selectedAreas.join(', ')
      };
      setAllocators(prev => 
        prev.map(alloc => alloc.id === editingAllocatorForResponsibility.id ? updatedAllocator : alloc)
      );
      setHasChanges(true);
      setEditingAllocatorForResponsibility(null);
    }
  };
  
  const handleEditAllocator = (allocator: Allocator) => {
    setEditingAllocator(allocator);
    setAllocatorFormData({ ...allocator });
    setSelectedResponsibilities(allocator.responsibilityArea.split(', '));
    setShowAllocatorDrawer(true);
  };
  
  const handleSaveAllocator = () => {
    const updatedAllocator = {
      ...allocatorFormData,
      responsibilityArea: selectedResponsibilities.join(', ')
    };
    
    if (editingAllocator) {
      // Update existing allocator
      setAllocators(prev => 
        prev.map(alloc => alloc.id === editingAllocator.id ? updatedAllocator : alloc)
      );
    } else {
      // Add new allocator
      setAllocators(prev => [...prev, updatedAllocator]);
    }
    
    setHasChanges(true);
    setShowAllocatorDrawer(false);
    setEditingAllocator(null);
  };
  
  const handleCloseAllocatorDrawer = () => {
    setShowAllocatorDrawer(false);
    setEditingAllocator(null);
    setAllocatorFormData({
      id: '',
      name: '',
      role: 'Allocator',
      responsibilityArea: ''
    });
    setSelectedResponsibilities([]);
  };
  
  const handleToggleResponsibility = (responsibility: string) => {
    setSelectedResponsibilities(prev => {
      if (prev.includes(responsibility)) {
        return prev.filter(r => r !== responsibility);
      } else {
        return [...prev, responsibility];
      }
    });
  };
  
  const dcColumns: Column<DistributionCenter>[] = [
    { 
      key: 'id', 
      label: 'ID',
      render: (value) => (
        <div className="flex items-center gap-2">
          <code style={{ 
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'var(--font-family-mono)',
            backgroundColor: 'var(--surface-code-block)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)'
          }}>
            {value}
          </code>
          <button className="p-1 rounded hover:bg-surface-tint">
            <Copy size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      )
    },
    { key: 'name', label: t.settings.name, sortable: true },
    { 
      key: 'address', 
      label: t.settings.address,
      render: (value) => (
        <div style={{ 
          maxWidth: '300px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {value}
        </div>
      )
    },
    { 
      key: 'warehouses', 
      label: t.settings.warehouses,
      render: (value: string[], row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenStorageLocationModal(row);
          }}
          className="flex items-center gap-1 flex-wrap hover:bg-surface-tint p-2 rounded transition-colors w-full text-left"
        >
          {value.length === 0 ? (
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
              {t.settings.clickToSelect}
            </span>
          ) : (
            <>
              {value.slice(0, 3).map((warehouse, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--surface-subtle-tint)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  {warehouse}
                </span>
              ))}
              {value.length > 3 && (
                <span 
                  className="px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  +{value.length - 3}
                </span>
              )}
            </>
          )}
        </button>
      )
    },
    {
      key: 'actions',
      label: t.settings.actions,
      align: 'right',
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="p-1.5 rounded hover:bg-surface-tint"
            onClick={(e) => {
              e.stopPropagation();
              handleEditDC(row);
            }}
          >
            <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-surface-tint"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 size={16} style={{ color: 'var(--status-danger)' }} />
          </button>
        </div>
      )
    }
  ];
  
  const storeColumns: Column<Store>[] = [
    { 
      key: 'id', 
      label: 'ID',
      render: (value) => (
        <code style={{ 
          fontSize: 'var(--font-size-xs)',
          fontFamily: 'var(--font-family-mono)',
          backgroundColor: 'var(--surface-code-block)',
          padding: '2px 6px',
          borderRadius: 'var(--radius-sm)'
        }}>
          {value}
        </code>
      )
    },
    { key: 'name', label: t.settings.name, sortable: true },
    { key: 'address', label: t.settings.address },
    { 
      key: 'cluster', 
      label: t.settings.clusterAssignment,
      render: (value, row) => (
        <select
          value={value}
          onChange={(e) => {
            // Update the store in the state
            setStores(prev => prev.map(store => 
              store.id === row.id 
                ? { ...store, cluster: e.target.value }
                : store
            ));
            setHasChanges(true);
          }}
          className="px-2 py-1 border rounded"
          style={{
            borderColor: 'var(--border-input)',
            fontSize: 'var(--font-size-sm)',
            backgroundColor: 'var(--surface-page)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <option>Urban Premium</option>
          <option>Urban Standard</option>
          <option>Regional</option>
        </select>
      )
    },
    { 
      key: 'isReference', 
      label: t.settings.referenceId,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <select
            value={value ? 'ja' : 'nein'}
            onChange={(e) => {
              // Update the store in the state
              setStores(prev => prev.map(store => 
                store.id === row.id 
                  ? { ...store, isReference: e.target.value === 'ja' }
                  : store
              ));
              setHasChanges(true);
            }}
            className="px-2 py-1 border rounded"
            style={{
              borderColor: 'var(--border-input)',
              fontSize: 'var(--font-size-sm)',
              backgroundColor: 'var(--surface-page)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="nein">{t.settings.no}</option>
            <option value="ja">{t.settings.yes}</option>
          </select>
          <button className="p-1 group relative">
            <Info size={14} style={{ color: 'var(--text-muted)' }} />
            <div 
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--text-inverse)',
                fontSize: 'var(--font-size-xs)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 10
              }}
            >
              {t.settings.referenceTooltip}
            </div>
          </button>
        </div>
      )
    },
    {
      key: 'actions',
      label: t.settings.actions,
      align: 'right',
      render: () => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="p-1.5 rounded hover:bg-surface-tint"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-surface-tint"
            onClick={(e) => e.stopPropagation()}
          >
            <Trash2 size={16} style={{ color: 'var(--status-danger)' }} />
          </button>
        </div>
      )
    }
  ];
  
  const allocatorColumns: Column<Allocator>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name', sortable: true },
    { 
      key: 'role', 
      label: t.settings.role,
      render: (value) => (
        <span 
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: value === 'Admin' ? 'var(--status-info)' : 'var(--status-success)',
            color: 'var(--text-inverse)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {value}
        </span>
      )
    },
    { 
      key: 'responsibilityArea', 
      label: t.settings.responsibilityArea,
      render: (value: string, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingAllocatorForResponsibility(row);
            setShowResponsibilityAreaModal(true);
          }}
          className="flex items-center gap-1 flex-wrap hover:bg-surface-tint p-2 rounded transition-colors w-full text-left"
        >
          {!value || value === '' ? (
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
              {t.settings.clickToSet}
            </span>
          ) : (
            <>
              {value.split(', ').slice(0, 3).map((area, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--surface-info-subtle)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-info)'
                  }}
                >
                  {area}
                </span>
              ))}
              {value.split(', ').length > 3 && (
                <span 
                  className="px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--brand-primary)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}
                >
                  +{value.split(', ').length - 3}
                </span>
              )}
            </>
          )}
        </button>
      )
    },
    {
      key: 'actions',
      label: t.settings.actions,
      align: 'right',
      render: (value, row) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            className="p-1.5 rounded hover:bg-surface-tint"
            onClick={(e) => {
              e.stopPropagation();
              handleEditAllocator(row);
            }}
          >
            <Edit2 size={16} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button 
            className="p-1.5 rounded hover:bg-surface-tint"
            onClick={(e) => {
              e.stopPropagation();
              setAllocators(prev => prev.filter(a => a.id !== row.id));
              setHasChanges(true);
            }}
          >
            <Trash2 size={16} style={{ color: 'var(--status-danger)' }} />
          </button>
        </div>
      )
    }
  ];
  
  const scenarios = [
    { id: 'initial' as Scenario, name: t.settings.initialAllocation },
    { id: 'replenishment' as Scenario, name: t.settings.replenishment },
    { id: 'manual' as Scenario, name: t.settings.manualAllocation },
  ];
  
  const currentScenario = scenarioSettings[selectedScenario];
  
  return (
    <div className="pb-20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 style={{ 
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--space-2)'
          }}>
            {t.settings.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {t.settings.locations}, {t.settings.responsibilities}, {t.settings.allocation}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('parameters')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              borderColor: 'var(--button-secondary-border)',
              color: 'var(--button-secondary-text)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              height: 'var(--height-button-md)'
            }}
          >
            {t.settings.allocationParameters}
            <ChevronRight size={18} />
          </button>
          
          <button
            onClick={() => onNavigate('capacity')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--button-primary-bg)',
              color: 'var(--button-primary-text)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              height: 'var(--height-button-md)'
            }}
          >
            {t.settings.continueToCapacity}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="mb-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex gap-1">
          {[
            { id: 'locations' as Tab, label: t.settings.locationsTab },
            { id: 'responsibilities' as Tab, label: t.settings.responsibilitiesTab },
            { id: 'allocation' as Tab, label: t.settings.allocationSettingsTab }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-6 py-3 relative transition-all"
              style={{
                backgroundColor: activeTab === tab.id ? 'var(--brand-primary)' : 'transparent',
                color: activeTab === tab.id ? 'var(--text-inverse)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)',
                fontSize: 'var(--font-size-sm)',
                borderRadius: activeTab === tab.id ? '8px 8px 0 0' : '0'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-subtle-tint)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ backgroundColor: 'var(--brand-accent)' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'locations' && (
        <div className="space-y-8">
          {/* Verteilzentren */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 style={{ 
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {t.settings.distributionCenters}
              </h2>
              <button
                onClick={handleAddNewDC}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                <Plus size={18} />
                {t.settings.newDC}
              </button>
            </div>
            <DataGrid
              columns={dcColumns}
              data={distributionCenters}
              density="comfortable"
            />
          </div>
          
          {/* Filialen */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 style={{ 
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {t.settings.stores}
              </h2>
              <button
                onClick={handleAddNewStore}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                <Plus size={18} />
                {t.settings.newStore}
              </button>
            </div>
            <DataGrid
              columns={storeColumns}
              data={stores}
              density="comfortable"
            />
          </div>
        </div>
      )}
      
      {activeTab === 'responsibilities' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 style={{ 
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)'
            }}>
              {t.settings.responsibilitiesTab}
            </h2>
            <button
              onClick={handleAddNewAllocator}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--button-secondary-border)',
                color: 'var(--button-secondary-text)',
                height: 'var(--height-button-md)'
              }}
            >
              <Plus size={18} />
              {t.actions.addAllocator}
            </button>
          </div>
          <DataGrid
            columns={allocatorColumns}
            data={allocators}
            density="comfortable"
          />
        </div>
      )}
      
      {activeTab === 'allocation' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Scenario List */}
          <div className="col-span-3">
            <div className="space-y-1">
              {scenarios.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario.id)}
                  className="w-full text-left px-4 py-3 rounded-lg transition-all relative"
                  style={{
                    backgroundColor: selectedScenario === scenario.id ? 'var(--surface-subtle-tint)' : 'transparent',
                    fontWeight: selectedScenario === scenario.id ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                    fontSize: 'var(--font-size-sm)',
                    borderLeft: selectedScenario === scenario.id ? '4px solid var(--brand-accent)' : '4px solid transparent',
                    marginLeft: '-4px',
                    paddingLeft: 'calc(var(--space-4) + 4px)'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedScenario !== scenario.id) {
                      e.currentTarget.style.backgroundColor = 'var(--surface-subtle-tint)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedScenario !== scenario.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {scenario.name}
                </button>
              ))}
            </div>
          </div>
          
          {/* Right: Scenario Settings */}
          <div className="col-span-9">
            <div 
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 style={{ 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  {scenarios.find(s => s.id === selectedScenario)?.name}
                </h2>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    Szenario {currentScenario.active ? 'aktiv' : 'inaktiv'}
                  </span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={currentScenario.active}
                      onChange={(e) => {
                        setScenarioSettings(prev => ({
                          ...prev,
                          [selectedScenario]: {
                            ...prev[selectedScenario],
                            active: e.target.checked
                          }
                        }));
                        setHasChanges(true);
                      }}
                      className="sr-only"
                    />
                    <div 
                      className="w-11 h-6 rounded-full transition-colors"
                      style={{
                        backgroundColor: currentScenario.active ? 'var(--brand-primary)' : 'var(--border-input)'
                      }}
                    >
                      <div 
                        className="w-5 h-5 bg-white rounded-full shadow transition-transform"
                        style={{
                          transform: currentScenario.active ? 'translateX(22px) translateY(2px)' : 'translateX(2px) translateY(2px)'
                        }}
                      />
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="space-y-5" style={{ opacity: currentScenario.active ? 1 : 0.5 }}>
                <div>
                  <label 
                    style={{ 
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      marginBottom: 'var(--space-2)',
                      display: 'block'
                    }}
                  >
                    Empfängerermittlung
                  </label>
                  <select
                    value={currentScenario.recipientDetermination}
                    disabled={!currentScenario.active}
                    onChange={(e) => {
                      setScenarioSettings(prev => ({
                        ...prev,
                        [selectedScenario]: {
                          ...prev[selectedScenario],
                          recipientDetermination: e.target.value
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      height: 'var(--height-input-md)',
                      backgroundColor: 'var(--surface-page)'
                    }}
                  >
                    <option>Plandaten</option>
                    <option>Manuelle Selektion</option>
                    <option>Listung</option>
                    <option>Transportbeziehungen</option>
                  </select>
                </div>
                
                <div>
                  <label 
                    style={{ 
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      marginBottom: 'var(--space-2)',
                      display: 'block'
                    }}
                  >
                    Lieferterminermittlung
                  </label>
                  <select
                    value={currentScenario.deliveryDateDetermination}
                    disabled={!currentScenario.active}
                    onChange={(e) => {
                      setScenarioSettings(prev => ({
                        ...prev,
                        [selectedScenario]: {
                          ...prev[selectedScenario],
                          deliveryDateDetermination: e.target.value
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      height: 'var(--height-input-md)',
                      backgroundColor: 'var(--surface-page)'
                    }}
                  >
                    <option>Lieferplan</option>
                    <option>Planlieferzeit</option>
                  </select>
                </div>
                
                <div>
                  <label 
                    style={{ 
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      marginBottom: 'var(--space-2)',
                      display: 'block'
                    }}
                  >
                    Verfügbarkeitsermittlung
                  </label>
                  <select
                    value={currentScenario.availabilityDetermination}
                    disabled={!currentScenario.active}
                    onChange={(e) => {
                      setScenarioSettings(prev => ({
                        ...prev,
                        [selectedScenario]: {
                          ...prev[selectedScenario],
                          availabilityDetermination: e.target.value
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      height: 'var(--height-input-md)',
                      backgroundColor: 'var(--surface-page)'
                    }}
                  >
                    <option>Extern</option>
                    <option>VZ-Bestand</option>
                    <option>Bestellung</option>
                    <option>Lieferung</option>
                  </select>
                </div>
                
                <div>
                  <label 
                    style={{ 
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      marginBottom: 'var(--space-2)',
                      display: 'block'
                    }}
                  >
                    Kürzungsstrategie
                  </label>
                  <select
                    value={currentScenario.reductionStrategy}
                    disabled={!currentScenario.active}
                    onChange={(e) => {
                      setScenarioSettings(prev => ({
                        ...prev,
                        [selectedScenario]: {
                          ...prev[selectedScenario],
                          reductionStrategy: e.target.value
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      height: 'var(--height-input-md)',
                      backgroundColor: 'var(--surface-page)'
                    }}
                  >
                    <option>Proportional</option>
                    <option>Sollbestand für Top-Performer</option>
                    <option>Präsentationsbestand für alle</option>
                  </select>
                </div>
                
                <div>
                  <label 
                    style={{ 
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      marginBottom: 'var(--space-2)',
                      display: 'block'
                    }}
                  >
                    Allokationsalgorithmus
                  </label>
                  <select
                    value={currentScenario.allocationAlgorithm}
                    disabled={!currentScenario.active}
                    onChange={(e) => {
                      setScenarioSettings(prev => ({
                        ...prev,
                        [selectedScenario]: {
                          ...prev[selectedScenario],
                          allocationAlgorithm: e.target.value
                        }
                      }));
                      setHasChanges(true);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      height: 'var(--height-input-md)',
                      backgroundColor: 'var(--surface-page)'
                    }}
                  >
                    <option>Kapazitätsgesteuerte Allokation</option>
                    <option>Sollbestandsgesteuerte Allokation</option>
                    <option>KPI-basierte Allokation</option>
                    <option>Prognosegesteuerter Nachschub mit Kapazitätsanpassung</option>
                  </select>
                  <p style={{ 
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)',
                    marginTop: 'var(--space-1)'
                  }}>
                    Der Algorithmus bestimmt die Berechnungslogik der Verteilung.
                  </p>
                </div>
              </div>
              
              {/* Global Settings */}
              <div 
                className="my-6"
                style={{ 
                  height: '1px',
                  backgroundColor: 'var(--border-default)'
                }}
              />
              
              <div>
                <h3 style={{ 
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-5)'
                }}>
                  {t.settings.globalAllocationSettings}
                </h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)'
                      }}>
                        Kapazitätsplanung
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={globalSettings.capacityPlanningEnabled}
                          onChange={(e) => {
                            setGlobalSettings(prev => ({
                              ...prev,
                              capacityPlanningEnabled: e.target.checked
                            }));
                            setHasChanges(true);
                          }}
                          className="sr-only"
                        />
                        <div 
                          className="w-11 h-6 rounded-full transition-colors"
                          style={{
                            backgroundColor: globalSettings.capacityPlanningEnabled ? 'var(--brand-primary)' : 'var(--border-input)'
                          }}
                        >
                          <div 
                            className="w-5 h-5 bg-white rounded-full shadow transition-transform"
                            style={{
                              transform: globalSettings.capacityPlanningEnabled ? 'translateX(22px) translateY(2px)' : 'translateX(2px) translateY(2px)'
                            }}
                          />
                        </div>
                      </div>
                    </label>
                  </div>
                  
                  <div style={{ opacity: globalSettings.capacityPlanningEnabled ? 1 : 0.5 }}>
                    <label 
                      style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      Artikelhierarchieebene für Kapazitätsplanung
                    </label>
                    <select
                      value={globalSettings.hierarchyLevel}
                      disabled={!globalSettings.capacityPlanningEnabled}
                      onChange={(e) => {
                        setGlobalSettings(prev => ({
                          ...prev,
                          hierarchyLevel: e.target.value
                        }));
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        borderColor: 'var(--border-input)',
                        height: 'var(--height-input-md)',
                        backgroundColor: 'var(--surface-page)'
                      }}
                    >
                      <option>Unternehmen</option>
                      <option>Einkaufsbereich</option>
                      <option>Produktgruppe</option>
                      <option>Produkt</option>
                    </select>
                  </div>
                  
                  <div>
                    <label 
                      style={{ 
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        marginBottom: 'var(--space-2)',
                        display: 'block'
                      }}
                    >
                      Mengeneinheit
                    </label>
                    <select
                      value={globalSettings.quantityUnit}
                      onChange={(e) => {
                        setGlobalSettings(prev => ({
                          ...prev,
                          quantityUnit: e.target.value
                        }));
                        setHasChanges(true);
                      }}
                      className="w-full px-3 py-2 border rounded-lg"
                      style={{
                        borderColor: 'var(--border-input)',
                        height: 'var(--height-input-md)',
                        backgroundColor: 'var(--surface-page)'
                      }}
                    >
                      <option>Stück</option>
                      <option>Karton</option>
                      <option>Palette</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sticky Footer */}
      <div 
        className="fixed bottom-0 left-0 right-0 flex items-center justify-end gap-3 px-6 border-t"
        style={{
          height: '64px',
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-subtle)',
          marginLeft: 'var(--sidenav-width-desktop)',
          zIndex: 10
        }}
      >
        <button
          disabled={!hasChanges}
          onClick={handleDiscard}
          className="px-4 py-2 rounded-lg border"
          style={{
            backgroundColor: 'var(--button-secondary-bg)',
            borderColor: 'var(--button-secondary-border)',
            color: 'var(--button-secondary-text)',
            height: 'var(--height-button-md)',
            opacity: hasChanges ? 1 : 0.5,
            cursor: hasChanges ? 'pointer' : 'not-allowed'
          }}
        >
          Änderungen verwerfen
        </button>
        <button
          disabled={!hasChanges}
          onClick={handleSave}
          className="px-4 py-2 rounded-lg"
          style={{
            backgroundColor: hasChanges ? 'var(--button-primary-bg)' : 'var(--border-default)',
            color: 'var(--button-primary-text)',
            height: 'var(--height-button-md)',
            cursor: hasChanges ? 'pointer' : 'not-allowed'
          }}
        >
          {t.actions.save}
        </button>
      </div>
      
      {/* DC Drawer */}
      {showDCDrawer && (
        <div 
          className="fixed inset-0 z-50 flex"
          onClick={() => setShowDCDrawer(false)}
        >
          <div 
            className="flex-1"
            style={{ backgroundColor: 'var(--bg-overlay)' }}
          />
          <div 
            className="bg-white shadow-lg overflow-y-auto"
            style={{ 
              width: 'var(--drawer-width)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="p-6 border-b sticky top-0 bg-white"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <h2 style={{ 
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {t.actions.editDC}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-2)',
                    display: 'block',
                    color: 'var(--text-muted)'
                  }}
                >
                  ID (nur lesbar)
                </label>
                <input
                  type="text"
                  value={dcFormData.id}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: 'var(--border-input)',
                    height: 'var(--height-input-md)',
                    backgroundColor: 'var(--surface-alt)',
                    color: 'var(--text-muted)'
                  }}
                />
              </div>
              
              <div>
                <label 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-2)',
                    display: 'block'
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={dcFormData.name}
                  onChange={(e) => setDcFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: 'var(--border-input)',
                    height: 'var(--height-input-md)'
                  }}
                />
              </div>
              
              <div>
                <label 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-2)',
                    display: 'block'
                  }}
                >
                  Adresse
                </label>
                <textarea
                  value={dcFormData.address}
                  onChange={(e) => setDcFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: 'var(--border-input)',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div>
                <label 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-2)',
                    display: 'block'
                  }}
                >
                  {t.settings.warehouses}
                </label>
                <select
                  multiple
                  value={dcFormData.warehouses}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setDcFormData(prev => ({ ...prev, warehouses: selected }));
                  }}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ 
                    borderColor: 'var(--border-input)',
                    minHeight: '120px'
                  }}
                >
                  <option value="Lager A">Lager A</option>
                  <option value="Lager B">Lager B</option>
                  <option value="Lager C">Lager C</option>
                  <option value="Lager D">Lager D</option>
                  <option value="Lager E">Lager E</option>
                  <option value="Lager 1">Lager 1</option>
                  <option value="Lager 2">Lager 2</option>
                  <option value="Lager 3">Lager 3</option>
                </select>
              </div>
            </div>
            
            <div 
              className="p-6 border-t sticky bottom-0 bg-white flex gap-3"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <button
                onClick={handleCloseDCDrawer}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={handleSaveDC}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-primary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                {t.actions.save}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Responsibility Drawer */}
      {showResponsibilityDrawer && (
        <div 
          className="fixed inset-0 z-50 flex"
          onClick={() => setShowResponsibilityDrawer(false)}
        >
          <div 
            className="flex-1"
            style={{ backgroundColor: 'var(--bg-overlay)' }}
          />
          <div 
            className="bg-white shadow-lg overflow-y-auto"
            style={{ 
              width: 'var(--drawer-width)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="p-6 border-b sticky top-0 bg-white"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <h2 style={{ 
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Verantwortungsbereich definieren
              </h2>
              
              <div className="mt-3 flex flex-wrap gap-2">
                <span 
                  className="px-3 py-1 rounded-full flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--surface-subtle-tint)',
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  Shoes
                  <button className="hover:opacity-70">×</button>
                </span>
                <span 
                  className="px-3 py-1 rounded-full flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--surface-subtle-tint)',
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  Apparel
                  <button className="hover:opacity-70">×</button>
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-2">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" />
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      Unternehmen
                    </span>
                  </label>
                  <div className="ml-6 mt-2 space-y-2">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" />
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>
                          Fashion
                        </span>
                      </label>
                      <div className="ml-6 mt-2 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked />
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>
                            Shoes
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" defaultChecked />
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>
                            Apparel
                          </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" />
                          <span style={{ fontSize: 'var(--font-size-sm)' }}>
                            Accessories
                          </span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" />
                        <span style={{ fontSize: 'var(--font-size-sm)' }}>
                          Electronics
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div 
              className="p-6 border-t sticky bottom-0 bg-white flex gap-3"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <button
                onClick={() => setShowResponsibilityDrawer(false)}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => setShowResponsibilityDrawer(false)}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-primary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                Übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Allocator Drawer */}
      {showAllocatorDrawer && (
        <div 
          className="fixed inset-0 z-50 flex"
          onClick={handleCloseAllocatorDrawer}
        >
          <div 
            className="flex-1"
            style={{ backgroundColor: 'var(--bg-overlay)' }}
          />
          <div 
            className="bg-white shadow-lg overflow-y-auto"
            style={{ 
              width: 'var(--drawer-width)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="p-6 border-b sticky top-0 bg-white"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <h2 style={{ 
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                {editingAllocator ? t.actions.editAllocator : t.actions.addAllocator}
              </h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-2)',
                    display: 'block'
                  }}
                >
                  ID
                </label>
                <input
                  type="text"
                  value={allocatorFormData.id}
                  onChange={(e) => setAllocatorFormData(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="z.B. USR-004"
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: 'var(--border-input)',
                    height: 'var(--height-input-md)'
                  }}
                />
              </div>
              
              <div>
                <label 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-2)',
                    display: 'block'
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  value={allocatorFormData.name}
                  onChange={(e) => setAllocatorFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Max Mustermann"
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: 'var(--border-input)',
                    height: 'var(--height-input-md)'
                  }}
                />
              </div>
              
              <div>
                <label 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-2)',
                    display: 'block'
                  }}
                >
                  Rolle
                </label>
                <select
                  value={allocatorFormData.role}
                  onChange={(e) => setAllocatorFormData(prev => ({ ...prev, role: e.target.value as 'Allocator' | 'Admin' }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{
                    borderColor: 'var(--border-input)',
                    height: 'var(--height-input-md)',
                    backgroundColor: 'var(--surface-page)'
                  }}
                >
                  <option value="Allocator">Allocator</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              
              <div>
                <label 
                  style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-medium)',
                    marginBottom: 'var(--space-2)',
                    display: 'block'
                  }}
                >
                  Verantwortungsbereich
                </label>
                
                {selectedResponsibilities.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedResponsibilities.map((resp, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-full flex items-center gap-2"
                        style={{
                          backgroundColor: 'var(--surface-subtle-tint)',
                          fontSize: 'var(--font-size-xs)'
                        }}
                      >
                        {resp}
                        <button 
                          onClick={() => handleToggleResponsibility(resp)}
                          className="hover:opacity-70"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2 p-3 border rounded-lg" style={{ borderColor: 'var(--border-default)' }}>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedResponsibilities.includes('Alle Bereiche')}
                        onChange={() => handleToggleResponsibility('Alle Bereiche')}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                        Alle Bereiche
                      </span>
                    </label>
                  </div>
                  
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedResponsibilities.includes('Shoes')}
                        onChange={() => handleToggleResponsibility('Shoes')}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>
                        Shoes
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedResponsibilities.includes('Apparel')}
                        onChange={() => handleToggleResponsibility('Apparel')}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>
                        Apparel
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedResponsibilities.includes('Accessories')}
                        onChange={() => handleToggleResponsibility('Accessories')}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>
                        Accessories
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={selectedResponsibilities.includes('Electronics')}
                        onChange={() => handleToggleResponsibility('Electronics')}
                      />
                      <span style={{ fontSize: 'var(--font-size-sm)' }}>
                        Electronics
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div 
              className="p-6 border-t sticky bottom-0 bg-white flex gap-3"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <button
                onClick={handleCloseAllocatorDrawer}
                className="flex-1 px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={handleSaveAllocator}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-primary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                {t.actions.save}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Location Selection Modals */}
      <LocationSelectionModal
        isOpen={showDCSelectionModal}
        onClose={() => setShowDCSelectionModal(false)}
        title={t.modals.selectDistributionCenter}
        availableLocations={AVAILABLE_DISTRIBUTION_CENTERS.filter(
          dc => !distributionCenters.some(existing => existing.id === dc.id)
        )}
        selectedLocations={[]}
        onConfirm={handleConfirmDCSelection}
        multiSelect={true}
      />
      
      <LocationSelectionModal
        isOpen={showStoreSelectionModal}
        onClose={() => setShowStoreSelectionModal(false)}
        title="Filiale auswählen"
        availableLocations={AVAILABLE_STORES.filter(
          store => !stores.some(existing => existing.id === store.id)
        )}
        selectedLocations={[]}
        onConfirm={handleConfirmStoreSelection}
        multiSelect={true}
      />
      
      <StorageLocationModal
        isOpen={showStorageLocationModal}
        onClose={() => {
          setShowStorageLocationModal(false);
          setEditingDCForStorage(null);
        }}
        distributionCenterName={editingDCForStorage?.name || ''}
        availableLocations={AVAILABLE_STORAGE_LOCATIONS}
        selectedLocations={editingDCForStorage?.warehouses || []}
        onConfirm={handleConfirmStorageLocations}
      />

      {/* Allocator Selection Modal */}
      <AllocatorSelectionModal
        isOpen={showAllocatorSelectionModal}
        onClose={() => setShowAllocatorSelectionModal(false)}
        availableAllocators={AVAILABLE_ALLOCATORS.filter(
          allocator => !allocators.some(existing => existing.id === allocator.id)
        )}
        selectedAllocators={[]}
        onConfirm={handleConfirmAllocatorSelection}
        multiSelect={true}
      />

      {/* Responsibility Area Modal */}
      <ResponsibilityAreaModal
        isOpen={showResponsibilityAreaModal}
        onClose={() => {
          setShowResponsibilityAreaModal(false);
          setEditingAllocatorForResponsibility(null);
        }}
        selectedAreas={editingAllocatorForResponsibility?.responsibilityArea 
          ? editingAllocatorForResponsibility.responsibilityArea.split(', ').filter(a => a !== '')
          : []
        }
        onConfirm={handleConfirmResponsibilityArea}
      />
    </div>
  );
}