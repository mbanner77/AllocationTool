import { useState, useMemo, useEffect } from 'react';
import { useLanguage } from '../../i18n';
import { DataGrid, Column } from '../common/DataGrid';
import { Filter, Calendar, X, TrendingUp, TrendingDown, Circle, Info, Beaker, RotateCcw, ExternalLink, PlayCircle } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SimulationScreen } from './SimulationScreen';
import { dataService } from '../../services/dataService';

type AllocationStatus = 'Offen' | 'In Planung' | 'Allokiert' | 'Simuliert';
type CapacityImpact = 'Überkapazität' | 'Untererfüllung' | 'Ausgeglichen';
type ChartView = 'status' | 'capacity';
type DataSource = 'plan' | 'simulation';
type WorkView = 'initial' | 'replenishment' | 'manual';
type AllocationRunStatus = 'Geplant' | 'Läuft' | 'Abgeschlossen' | 'Fehlgeschlagen';

interface AllocationRun {
  id: string;
  type: 'initial' | 'replenishment' | 'manual';
  startDate: string;
  status: AllocationRunStatus;
  articleCount: number;
}

interface Article {
  id: string;
  articleNumber: string;
  color: string;
  colorHex: string;
  status: AllocationStatus;
  description: string;
  articleGroup: string;
  season: string;
  deliveryFrom: string;
  deliveryTo: string;
  deliveryFromSimulation: string | null;
  deliveryToSimulation: string | null;
  stockDC: number;
  sizeCount: number;
  capacityNeed: string;
  capacityImpact: CapacityImpact;
  capacityImpactReason: string[];
  allocationDate: string | null;
  bookmarked: boolean;
  simulationDate: string | null;
  initiallyAllocated: boolean;
}

const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    articleNumber: 'ART-20251001',
    color: 'Schwarz',
    colorHex: '#000000',
    status: 'Offen',
    description: 'Running Schuhe Pro Trail Max mit Dämpfung',
    articleGroup: 'Shoes',
    season: 'Frühjahr/Sommer 2025',
    deliveryFrom: '2025-03-01',
    deliveryTo: '2025-03-15',
    deliveryFromSimulation: null,
    deliveryToSimulation: null,
    stockDC: 2400,
    sizeCount: 12,
    capacityNeed: '18 m² / 3 Warenträger',
    capacityImpact: 'Überkapazität',
    capacityImpactReason: [
      'Hoher Flächenbedarf pro Einheit',
      'Kategorie Shoes nahe SOLL-Grenze',
      'Lieferpeak im Zeitraum März–April'
    ],
    allocationDate: null,
    bookmarked: false,
    simulationDate: null,
    initiallyAllocated: false
  },
  {
    id: '2',
    articleNumber: 'ART-20251002',
    color: 'Blau',
    colorHex: '#2563eb',
    status: 'In Planung',
    description: 'Sport T-Shirt Performance Fit',
    articleGroup: 'Apparel',
    season: 'Frühjahr/Sommer 2025',
    deliveryFrom: '2025-02-15',
    deliveryTo: '2025-02-28',
    deliveryFromSimulation: null,
    deliveryToSimulation: null,
    stockDC: 5600,
    sizeCount: 5,
    capacityNeed: '12 m² / 2 Warenträger',
    capacityImpact: 'Ausgeglichen',
    capacityImpactReason: [
      'Moderater Flächenbedarf',
      'Kategorie Apparel mit ausreichender Kapazität',
      'Gleichmäßige Verteilung im Lieferzeitraum'
    ],
    allocationDate: null,
    bookmarked: false,
    simulationDate: null,
    initiallyAllocated: false
  },
  {
    id: '3',
    articleNumber: 'ART-20251003',
    color: 'Rot',
    colorHex: '#dc2626',
    status: 'Allokiert',
    description: 'Winterjacke Premium Isolation',
    articleGroup: 'Apparel',
    season: 'Herbst/Winter 2025',
    deliveryFrom: '2025-09-01',
    deliveryTo: '2025-09-20',
    deliveryFromSimulation: null,
    deliveryToSimulation: null,
    stockDC: 1200,
    sizeCount: 6,
    capacityNeed: '25 m² / 4 Warenträger',
    capacityImpact: 'Überkapazität',
    capacityImpactReason: [
      'Hoher Flächenbedarf pro Einheit',
      'Saisonaler Peak in Herbst/Winter',
      'Viele Artikel im selben Zeitfenster'
    ],
    allocationDate: '2024-12-10',
    bookmarked: false,
    simulationDate: null,
    initiallyAllocated: true
  },
  {
    id: '4',
    articleNumber: 'ART-20251004',
    color: 'Grün',
    colorHex: '#16a34a',
    status: 'Offen',
    description: 'Fitness Hose Stretch Comfort',
    articleGroup: 'Apparel',
    season: 'NOS',
    deliveryFrom: '2025-01-10',
    deliveryTo: '2025-01-25',
    deliveryFromSimulation: null,
    deliveryToSimulation: null,
    stockDC: 3200,
    sizeCount: 8,
    capacityNeed: '15 m² / 2 Warenträger',
    capacityImpact: 'Ausgeglichen',
    capacityImpactReason: [
      'Ausgeglichener Kapazitätsbeitrag',
      'NOS-Artikel mit gleichmäßiger Distribution',
      'Keine zeitliche Verdichtung'
    ],
    allocationDate: null,
    bookmarked: false,
    simulationDate: null,
    initiallyAllocated: false
  },
  {
    id: '5',
    articleNumber: 'ART-20251005',
    color: 'Weiß',
    colorHex: '#ffffff',
    status: 'In Planung',
    description: 'Sneakers Urban Style Low',
    articleGroup: 'Shoes',
    season: 'Frühjahr/Sommer 2025',
    deliveryFrom: '2025-04-01',
    deliveryTo: '2025-04-15',
    deliveryFromSimulation: null,
    deliveryToSimulation: null,
    stockDC: 1800,
    sizeCount: 10,
    capacityNeed: '20 m² / 3 Warenträger',
    capacityImpact: 'Überkapazität',
    capacityImpactReason: [
      'Hoher Flächenbedarf pro Einheit',
      'Kategorie Shoes nahe SOLL-Grenze',
      'Überlappender Liefertermin mit anderen Shoes-Artikeln'
    ],
    allocationDate: null,
    bookmarked: false,
    simulationDate: null,
    initiallyAllocated: false
  },
  {
    id: '6',
    articleNumber: 'ART-20251006',
    color: 'Grau',
    colorHex: '#6b7280',
    status: 'Allokiert',
    description: 'Smartwatch Fitness Tracker Pro',
    articleGroup: 'Electronics',
    season: 'NOS',
    deliveryFrom: '2025-02-01',
    deliveryTo: '2025-02-10',
    deliveryFromSimulation: null,
    deliveryToSimulation: null,
    stockDC: 800,
    sizeCount: 1,
    capacityNeed: '5 m² / 1 Warenträger',
    capacityImpact: 'Untererfüllung',
    capacityImpactReason: [
      'Geringer Kapazitätsbeitrag',
      'Kategorie Electronics mit freier SOLL-Kapazität',
      'Wenige Artikel im Lieferzeitraum'
    ],
    allocationDate: '2024-11-20',
    bookmarked: false,
    simulationDate: null,
    initiallyAllocated: true
  },
  {
    id: '7',
    articleNumber: 'ART-20251007',
    color: 'Braun',
    colorHex: '#92400e',
    status: 'Offen',
    description: 'Leder Gürtel Classic',
    articleGroup: 'Accessories',
    season: 'NOS',
    deliveryFrom: '2025-03-10',
    deliveryTo: '2025-03-20',
    deliveryFromSimulation: null,
    deliveryToSimulation: null,
    stockDC: 1500,
    sizeCount: 7,
    capacityNeed: '8 m² / 1 Warenträger',
    capacityImpact: 'Untererfüllung',
    capacityImpactReason: [
      'Geringer Kapazitätsbeitrag',
      'Kategorie Accessories mit freier SOLL-Kapazität',
      'Niedriger Flächenbedarf'
    ],
    allocationDate: null,
    bookmarked: false,
    simulationDate: null,
    initiallyAllocated: false
  },
  {
    id: '8',
    articleNumber: 'ART-20251008',
    color: 'Navy',
    colorHex: '#1e3a8a',
    status: 'In Planung',
    description: 'Rucksack Outdoor Adventure 30L',
    articleGroup: 'Accessories',
    season: 'Frühjahr/Sommer 2025',
    deliveryFrom: '2025-05-01',
    deliveryTo: '2025-05-15',
    deliveryFromSimulation: null,
    deliveryToSimulation: null,
    stockDC: 950,
    sizeCount: 2,
    capacityNeed: '10 m² / 2 Warenträger',
    capacityImpact: 'Ausgeglichen',
    capacityImpactReason: [
      'Moderater Flächenbedarf',
      'Kategorie Accessories mit ausreichender Kapazität',
      'Spätes Lieferfenster mit wenig Konkurrenz'
    ],
    allocationDate: null,
    bookmarked: false,
    simulationDate: null,
    initiallyAllocated: false
  },
];

const STATUS_COLORS = {
  'Offen': 'var(--status-warning)',
  'In Planung': 'var(--status-info)',
  'Allokiert': 'var(--status-success)',
  'Simuliert': '#8b5cf6'
};

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

const MOCK_ALLOCATION_RUNS: AllocationRun[] = [
  {
    id: 'RUN-2025-W50-001',
    type: 'initial',
    startDate: '2025-12-16 09:30',
    status: 'Abgeschlossen',
    articleCount: 156
  },
  {
    id: 'RUN-2025-W49-R12',
    type: 'replenishment',
    startDate: '2025-12-10 14:15',
    status: 'Abgeschlossen',
    articleCount: 89
  },
  {
    id: 'RUN-2025-W49-R11',
    type: 'replenishment',
    startDate: '2025-12-09 10:00',
    status: 'Abgeschlossen',
    articleCount: 67
  },
  {
    id: 'RUN-2025-W48-M03',
    type: 'manual',
    startDate: '2025-12-05 16:45',
    status: 'Abgeschlossen',
    articleCount: 34
  },
  {
    id: 'RUN-2025-W50-R13',
    type: 'replenishment',
    startDate: '2025-12-15 11:20',
    status: 'Läuft',
    articleCount: 45
  },
  {
    id: 'RUN-2025-W51-R14',
    type: 'replenishment',
    startDate: '2025-12-18 09:00',
    status: 'Geplant',
    articleCount: 52
  }
];

interface WorkScreenProps {
  onNavigate: (screen: string, params?: { runId?: string }) => void;
}

export function WorkScreen({ onNavigate }: WorkScreenProps) {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<Article[]>(MOCK_ARTICLES);
  const [loading, setLoading] = useState(true);

  // Load articles from dataService (tasks in the service represent work items)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Articles come from the work/tasks context in dataService
        // For now, we keep using MOCK_ARTICLES as the primary data source
        // since the dataService tasks are different from article work items
        setArticles(MOCK_ARTICLES);
      } catch (error) {
        console.error('Failed to load work data:', error);
        setArticles(MOCK_ARTICLES);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showSimulationResults, setShowSimulationResults] = useState(false);
  const [modalArticles, setModalArticles] = useState<Article[]>([]);
  const [simulateMode, setSimulateMode] = useState(true);
  const [scheduleBackground, setScheduleBackground] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [workView, setWorkView] = useState<WorkView>('initial');
  
  // Allocation Run Modal
  const [showRunModal, setShowRunModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [runDateFrom, setRunDateFrom] = useState('');
  const [runDateTo, setRunDateTo] = useState('');
  
  // Filters
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedCapacityImpacts, setSelectedCapacityImpacts] = useState<CapacityImpact[]>([]);
  const [deliveryDateFrom, setDeliveryDateFrom] = useState('');
  const [deliveryDateTo, setDeliveryDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<AllocationStatus | null>(null);
  const [capacityImpactFilter, setCapacityImpactFilter] = useState<CapacityImpact | null>(null);
  const [monthFilter, setMonthFilter] = useState<string | null>(null);
  
  // Chart view toggle
  const [pieChartView, setPieChartView] = useState<ChartView>('status');
  const [barChartView, setBarChartView] = useState<ChartView>('status');
  
  // Determine data source
  const hasSimulationData = useMemo(() => {
    return articles.some(a => a.status === 'Simuliert');
  }, [articles]);
  
  const dataSource: DataSource = hasSimulationData ? 'simulation' : 'plan';
  
  // Get unique values for filters
  const articleGroups = Array.from(new Set(MOCK_ARTICLES.map(a => a.articleGroup)));
  const seasons = Array.from(new Set(MOCK_ARTICLES.map(a => a.season)));
  const capacityImpacts: CapacityImpact[] = ['Überkapazität', 'Untererfüllung', 'Ausgeglichen'];
  
  // Get effective delivery date (simulation if available, otherwise plan)
  const getEffectiveDeliveryFrom = (article: Article) => {
    return article.deliveryFromSimulation || article.deliveryFrom;
  };
  
  const getEffectiveDeliveryTo = (article: Article) => {
    return article.deliveryToSimulation || article.deliveryTo;
  };
  
  // Filter articles by view
  const viewFilteredArticles = useMemo(() => {
    if (workView === 'initial') {
      return articles;
    } else {
      // replenishment and manual only show initially allocated articles
      return articles.filter(a => a.initiallyAllocated);
    }
  }, [articles, workView]);
  
  // Filter articles
  const filteredArticles = useMemo(() => {
    return viewFilteredArticles.filter(article => {
      if (selectedGroups.length > 0 && !selectedGroups.includes(article.articleGroup)) return false;
      if (selectedSeasons.length > 0 && !selectedSeasons.includes(article.season)) return false;
      if (selectedCapacityImpacts.length > 0 && !selectedCapacityImpacts.includes(article.capacityImpact)) return false;
      
      const effectiveFrom = getEffectiveDeliveryFrom(article);
      const effectiveTo = getEffectiveDeliveryTo(article);
      
      if (deliveryDateFrom && effectiveFrom < deliveryDateFrom) return false;
      if (deliveryDateTo && effectiveTo > deliveryDateTo) return false;
      if (statusFilter && article.status !== statusFilter) return false;
      if (capacityImpactFilter && article.capacityImpact !== capacityImpactFilter) return false;
      if (monthFilter) {
        const articleMonth = effectiveFrom.substring(0, 7);
        if (articleMonth !== monthFilter) return false;
      }
      return true;
    });
  }, [viewFilteredArticles, selectedGroups, selectedSeasons, selectedCapacityImpacts, deliveryDateFrom, deliveryDateTo, statusFilter, capacityImpactFilter, monthFilter]);
  
  // Calculate statistics
  const statusStats = useMemo(() => {
    const stats = { 'Offen': 0, 'In Planung': 0, 'Allokiert': 0, 'Simuliert': 0 };
    filteredArticles.forEach(article => {
      stats[article.status]++;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value })).filter(s => s.value > 0);
  }, [filteredArticles]);
  
  const capacityStats = useMemo(() => {
    const stats = { 'Überkapazität': 0, 'Untererfüllung': 0, 'Ausgeglichen': 0 };
    filteredArticles.forEach(article => {
      stats[article.capacityImpact]++;
    });
    return Object.entries(stats).map(([name, value]) => ({ name, value }));
  }, [filteredArticles]);
  
  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    const monthMap = new Map<string, { 'Offen': number; 'In Planung': number; 'Allokiert': number; 'Simuliert': number }>();
    
    filteredArticles.forEach(article => {
      const month = getEffectiveDeliveryFrom(article).substring(0, 7);
      if (!monthMap.has(month)) {
        monthMap.set(month, { 'Offen': 0, 'In Planung': 0, 'Allokiert': 0, 'Simuliert': 0 });
      }
      const stats = monthMap.get(month)!;
      stats[article.status]++;
    });
    
    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, stats]) => ({
        month: new Date(month + '-01').toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }),
        monthKey: month,
        ...stats
      }));
  }, [filteredArticles]);
  
  const monthlyCapacityStats = useMemo(() => {
    const monthMap = new Map<string, { 'Überkapazität': number; 'Untererfüllung': number; 'Ausgeglichen': number }>();
    
    filteredArticles.forEach(article => {
      const month = getEffectiveDeliveryFrom(article).substring(0, 7);
      if (!monthMap.has(month)) {
        monthMap.set(month, { 'Überkapazität': 0, 'Untererfüllung': 0, 'Ausgeglichen': 0 });
      }
      const stats = monthMap.get(month)!;
      stats[article.capacityImpact]++;
    });
    
    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, stats]) => ({
        month: new Date(month + '-01').toLocaleDateString('de-DE', { month: 'short', year: 'numeric' }),
        monthKey: month,
        ...stats
      }));
  }, [filteredArticles]);
  
  const bookmarkedCount = useMemo(() => {
    return articles.filter(a => a.bookmarked).length;
  }, [articles]);
  
  const overCapacitySelectedCount = useMemo(() => {
    return articles.filter(a => a.bookmarked && a.capacityImpact === 'Überkapazität').length;
  }, [articles]);
  
  const handleBookmarkToggle = (articleId: string) => {
    setArticles(prev => prev.map(article => 
      article.id === articleId && article.status !== 'Allokiert'
        ? { ...article, bookmarked: !article.bookmarked }
        : article
    ));
  };
  
  const handleBookmarkSelected = () => {
    setArticles(prev => prev.map(article =>
      selectedArticles.includes(article.id) && article.status !== 'Allokiert'
        ? { ...article, bookmarked: true }
        : article
    ));
    setSelectedArticles([]);
  };
  
  const handleStartAllocation = () => {
    const bookmarkedArticles = articles.filter(a => a.bookmarked);
    if (bookmarkedArticles.length === 0) {
      setToast({ message: t.work.noArticlesSelected, type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setModalArticles(bookmarkedArticles);
    setShowModal(true);
  };
  
  const handleRemoveFromModal = (articleId: string) => {
    setModalArticles(prev => prev.filter(a => a.id !== articleId));
  };
  
  const handleConfirmAllocation = () => {
    if (modalArticles.length === 0) return;
    
    if (simulateMode) {
      // Show simulation results
      setShowModal(false);
      setShowSimulationResults(true);
    } else {
      // Direct allocation
      setArticles(prev => prev.map(article =>
        modalArticles.find(m => m.id === article.id)
          ? {
              ...article,
              status: 'In Planung',
              bookmarked: false,
              allocationDate: new Date().toISOString().split('T')[0]
            }
          : article
      ));
      
      setToast({ message: t.work.allocationScheduled, type: 'success' });
      setTimeout(() => setToast(null), 3000);
      
      setShowModal(false);
      setModalArticles([]);
    }
  };
  
  const handleAcceptSimulation = (deliveryOption: string, customDates?: { from: string; to: string }) => {
    // Apply simulation results with updated delivery dates
    setArticles(prev => prev.map(article => {
      const found = modalArticles.find(m => m.id === article.id);
      if (found) {
        // Calculate new delivery dates based on option
        let newFrom: Date;
        let newTo: Date;
        
        if (deliveryOption === 'custom' && customDates) {
          // Use custom dates
          newFrom = new Date(customDates.from);
          newTo = new Date(customDates.to);
        } else {
          // Calculate based on option
          newFrom = new Date(article.deliveryFrom);
          newTo = new Date(article.deliveryTo);
          
          switch (deliveryOption) {
            case 'plus1week':
              newFrom.setDate(newFrom.getDate() + 7);
              newTo.setDate(newTo.getDate() + 7);
              break;
            case 'plus2weeks':
              newFrom.setDate(newFrom.getDate() + 14);
              newTo.setDate(newTo.getDate() + 14);
              break;
            case 'minus1week':
              newFrom.setDate(newFrom.getDate() - 7);
              newTo.setDate(newTo.getDate() - 7);
              break;
          }
        }
        
        return {
          ...article,
          status: 'Simuliert',
          deliveryFromSimulation: newFrom.toISOString().split('T')[0],
          deliveryToSimulation: newTo.toISOString().split('T')[0],
          bookmarked: false,
          simulationDate: new Date().toISOString().split('T')[0]
        };
      }
      return article;
    }));
    
    setToast({ message: t.work.simulationAccepted, type: 'success' });
    setTimeout(() => setToast(null), 3000);
    
    setShowSimulationResults(false);
    setModalArticles([]);
  };
  
  const handleReleaseAllocation = () => {
    // Release allocation to production
    setArticles(prev => prev.map(article =>
      modalArticles.find(m => m.id === article.id)
        ? {
            ...article,
            status: 'In Planung',
            bookmarked: false,
            allocationDate: new Date().toISOString().split('T')[0]
          }
          : article
    ));
    
    setToast({ message: 'Allokation zur Verarbeitung freigegeben', type: 'success' });
    setTimeout(() => setToast(null), 3000);
    
    setShowSimulationResults(false);
    setModalArticles([]);
  };
  
  const handleDiscardSimulation = (articleIds?: string[]) => {
    const idsToDiscard = articleIds || articles.filter(a => a.status === 'Simuliert').map(a => a.id);
    
    setArticles(prev => prev.map(article =>
      idsToDiscard.includes(article.id)
        ? {
            ...article,
            status: 'Offen',
            deliveryFromSimulation: null,
            deliveryToSimulation: null,
            simulationDate: null
          }
          : article
    ));
    
    setToast({ message: 'Simulation verworfen', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };
  
  const handleClearFilter = (filterType: string) => {
    switch (filterType) {
      case 'groups':
        setSelectedGroups([]);
        break;
      case 'seasons':
        setSelectedSeasons([]);
        break;
      case 'capacity':
        setSelectedCapacityImpacts([]);
        break;
      case 'delivery':
        setDeliveryDateFrom('');
        setDeliveryDateTo('');
        break;
      case 'status':
        setStatusFilter(null);
        break;
      case 'capacityImpact':
        setCapacityImpactFilter(null);
        break;
      case 'month':
        setMonthFilter(null);
        break;
    }
  };
  
  const handleOpenAllocationRun = (article: Article) => {
    if (workView === 'initial') {
      // Direct navigation for initial allocation (only one run exists)
      onNavigate('runs', { runId: MOCK_ALLOCATION_RUNS[0].id });
    } else {
      // Open modal for replenishment/manual
      setShowRunModal(true);
    }
  };
  
  const handleSelectAllocationRun = () => {
    if (selectedRun) {
      onNavigate('runs', { runId: selectedRun });
      setShowRunModal(false);
      setSelectedRun(null);
      setRunDateFrom('');
      setRunDateTo('');
    }
  };
  
  // Filter allocation runs
  const filteredRuns = useMemo(() => {
    return MOCK_ALLOCATION_RUNS.filter(run => {
      if (workView === 'initial') return run.type === 'initial';
      if (workView === 'replenishment') return run.type === 'replenishment';
      if (workView === 'manual') return run.type === 'manual';
      
      if (runDateFrom && run.startDate < runDateFrom) return false;
      if (runDateTo && run.startDate > runDateTo) return false;
      
      return true;
    });
  }, [workView, runDateFrom, runDateTo]);
  
  const activeFilters = [];
  if (selectedGroups.length > 0) activeFilters.push({ type: 'groups', label: `Gruppe: ${selectedGroups.join(', ')}` });
  if (selectedSeasons.length > 0) activeFilters.push({ type: 'seasons', label: `Saison: ${selectedSeasons.join(', ')}` });
  if (selectedCapacityImpacts.length > 0) activeFilters.push({ type: 'capacity', label: `Kapazitätswirkung: ${selectedCapacityImpacts.join(', ')}` });
  if (deliveryDateFrom || deliveryDateTo) activeFilters.push({ type: 'delivery', label: `Liefertermin: ${deliveryDateFrom} - ${deliveryDateTo}` });
  if (statusFilter) activeFilters.push({ type: 'status', label: `Status: ${statusFilter}` });
  if (capacityImpactFilter) activeFilters.push({ type: 'capacityImpact', label: `Kapazitätswirkung: ${capacityImpactFilter}` });
  if (monthFilter) activeFilters.push({ type: 'month', label: `Monat: ${monthFilter}` });
  
  const columns: Column<Article>[] = [
    {
      key: 'bookmarked',
      label: t.workScreen.bookmark,
      align: 'center',
      width: '80px',
      render: (value, row) => (
        <input
          type="checkbox"
          checked={value as boolean}
          disabled={row.status === 'Allokiert'}
          onChange={() => handleBookmarkToggle(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 cursor-pointer"
          style={{
            accentColor: 'var(--brand-primary)',
            opacity: row.status === 'Allokiert' ? 0.5 : 1
          }}
        />
      )
    },
    {
      key: 'articleNumber',
      label: t.parameters.articleNumber,
      sortable: true,
      width: '140px',
      render: (value) => (
        <code
          className="cursor-pointer hover:underline"
          style={{
            fontSize: 'var(--font-size-xs)',
            fontFamily: 'var(--font-family-mono)',
            backgroundColor: 'var(--surface-code-block)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)'
          }}
        >
          {value}
        </code>
      )
    },
    {
      key: 'color',
      label: t.workScreen.color,
      width: '120px',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border"
            style={{
              backgroundColor: row.colorHex,
              borderColor: 'var(--border-default)'
            }}
          />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: t.common.status,
      width: '140px',
      render: (value, row) => (
        <div className="group relative">
          <span
            className="px-3 py-1 rounded-full cursor-help whitespace-nowrap inline-block"
            style={{
              backgroundColor: STATUS_COLORS[value as AllocationStatus],
              color: 'var(--text-inverse)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {value}
          </span>
          {value === 'Simuliert' && (
            <div
              className="absolute bottom-full left-0 mb-2 px-4 py-3 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--text-inverse)',
                fontSize: 'var(--font-size-xs)',
                boxShadow: 'var(--shadow-lg)',
                minWidth: '280px'
              }}
            >
              {t.workQueue.simulationNote}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'description',
      label: t.parameters.articleDescription,
      render: (value) => (
        <div
          style={{
            maxWidth: '300px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {value}
        </div>
      )
    },
    { key: 'articleGroup', label: t.parameters.articleGroup, sortable: true },
    { key: 'season', label: 'Saison' },
    { 
      key: 'deliveryFrom', 
      label: t.workScreen.deliveryFromPlan,
      render: (value) => new Date(value as string).toLocaleDateString('de-DE')
    },
    {
      key: 'deliveryTo',
      label: t.workScreen.deliveryToPlan,
      render: (value) => new Date(value as string).toLocaleDateString('de-DE')
    },
    { 
      key: 'deliveryFromSimulation', 
      label: t.workScreen.deliveryFromSimulation,
      render: (value, row) => value ? (
        <div className="group relative flex items-center gap-1">
          <Beaker size={14} style={{ color: '#8b5cf6' }} />
          <span>{new Date(value as string).toLocaleDateString('de-DE')}</span>
          <div
            className="absolute bottom-full left-0 mb-2 px-4 py-3 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--text-inverse)',
              fontSize: 'var(--font-size-xs)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            Liefertermin aus letzter Simulation<br />
            Noch nicht produktiv freigegeben
          </div>
        </div>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>-</span>
      )
    },
    {
      key: 'deliveryToSimulation',
      label: t.workScreen.deliveryToSimulation,
      render: (value, row) => value ? (
        <div className="flex items-center gap-1">
          <Beaker size={14} style={{ color: '#8b5cf6' }} />
          <span>{new Date(value as string).toLocaleDateString('de-DE')}</span>
        </div>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>-</span>
      )
    },
    { key: 'stockDC', label: t.workScreen.stockDC, align: 'right' },
    { key: 'sizeCount', label: t.workScreen.sizeCount, align: 'right' },
    {
      key: 'capacityNeed',
      label: t.workScreen.capacityNeed,
      render: (value) => (
        <span style={{ fontSize: 'var(--font-size-sm)' }}>
          {value}
        </span>
      )
    },
    {
      key: 'capacityImpact',
      label: (
        <div className="flex items-center gap-1 group relative">
          <span>{t.workScreen.capacityImpact}</span>
          {hasSimulationData && (
            <>
              <Beaker size={14} style={{ color: '#8b5cf6' }} />
              <div
                className="absolute bottom-full left-0 mb-2 px-4 py-3 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50"
                style={{
                  backgroundColor: 'var(--text-primary)',
                  color: 'var(--text-inverse)',
                  fontSize: 'var(--font-size-xs)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                {t.workScreen.capacityImpactTooltip}
              </div>
            </>
          )}
        </div>
      ) as any,
      sortable: true,
      render: (value, row) => {
        const Icon = CAPACITY_ICONS[value as CapacityImpact];
        return (
          <div className="group relative">
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-full cursor-help"
              style={{
                backgroundColor: `${CAPACITY_COLORS[value as CapacityImpact]}15`,
                color: CAPACITY_COLORS[value as CapacityImpact],
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                width: 'fit-content'
              }}
            >
              <Icon size={14} />
              <span>{value}</span>
            </div>
            
            {/* Tooltip */}
            <div
              className="absolute bottom-full left-0 mb-2 px-4 py-3 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--text-inverse)',
                fontSize: 'var(--font-size-xs)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                minWidth: '280px'
              }}
            >
              <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                {value === 'Überkapazität' ? t.workScreen.overCapacityRisk :
                 value === 'Untererfüllung' ? t.workScreen.underCapacityRisk :
                 t.workScreen.balancedCapacity}
              </div>
              <ul style={{ listStyle: 'disc', paddingLeft: '16px', lineHeight: '1.5' }}>
                {row.capacityImpactReason.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      }
    },
    {
      key: 'allocationDate',
      label: 'Allokationsdatum',
      render: (value) => value ? new Date(value as string).toLocaleDateString('de-DE') : '-'
    },
    {
      key: 'id',
      label: 'Allokationslauf',
      align: 'center',
      width: '140px',
      render: (value, row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenAllocationRun(row);
          }}
          className="group flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
          style={{
            backgroundColor: 'var(--button-secondary-bg)',
            borderColor: 'var(--button-secondary-border)',
            color: 'var(--button-secondary-text)',
            fontSize: 'var(--font-size-xs)'
          }}
          title={t.work.openAllocationRun}
        >
          <ExternalLink size={14} />
          <span>{t.work.openAllocationRun}</span>
        </button>
      )
    }
  ];
  
  const simulatedArticles = articles.filter(a => a.status === 'Simuliert');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-2)'
            }}
          >
            {t.work.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            {t.work.subtitle}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {simulatedArticles.length > 0 && (
            <button
              onClick={() => handleDiscardSimulation()}
              className="px-4 py-2 rounded-lg border flex items-center gap-2"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--button-secondary-border)',
                color: 'var(--button-secondary-text)',
                height: 'var(--height-button-md)'
              }}
            >
              <RotateCcw size={16} />
              {t.work.discardSimulation} ({simulatedArticles.length})
            </button>
          )}

          {simulatedArticles.length > 0 && (
            <button
              onClick={() => onNavigate('allocationAnalysis')}
              className="px-4 py-2 rounded-lg border flex items-center gap-2 hover:bg-surface-tint transition-colors"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--button-secondary-border)',
                color: 'var(--button-secondary-text)',
                height: 'var(--height-button-md)'
              }}
            >
              <Info size={16} />
              {t.work.allocationAnalysis}
            </button>
          )}
          
          <button
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              borderColor: 'var(--button-secondary-border)',
              color: 'var(--button-secondary-text)',
              height: 'var(--height-button-md)'
            }}
          >
            {t.work.planPreview}
          </button>
          
          <button
            onClick={handleStartAllocation}
            disabled={bookmarkedCount === 0}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: bookmarkedCount > 0 ? 'var(--button-primary-bg)' : 'var(--border-default)',
              color: 'var(--button-primary-text)',
              height: 'var(--height-button-md)',
              cursor: bookmarkedCount > 0 ? 'pointer' : 'not-allowed',
              opacity: bookmarkedCount > 0 ? 1 : 0.5
            }}
          >
            {t.work.performAllocation}
          </button>
        </div>
      </div>
      
      {/* View Selector */}
      <div className="flex items-center gap-1 border rounded p-1" style={{ borderColor: 'var(--border-input)', width: 'fit-content' }}>
        <button
          onClick={() => setWorkView('initial')}
          className="px-4 py-2 rounded"
          style={{
            backgroundColor: workView === 'initial' ? 'var(--brand-primary)' : 'transparent',
            color: workView === 'initial' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {t.work.initialAllocation}
        </button>
        <button
          onClick={() => setWorkView('replenishment')}
          className="px-4 py-2 rounded"
          style={{
            backgroundColor: workView === 'replenishment' ? 'var(--brand-primary)' : 'transparent',
            color: workView === 'replenishment' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {t.work.replenishment}
        </button>
        <button
          onClick={() => setWorkView('manual')}
          className="px-4 py-2 rounded"
          style={{
            backgroundColor: workView === 'manual' ? 'var(--brand-primary)' : 'transparent',
            color: workView === 'manual' ? 'var(--text-inverse)' : 'var(--text-secondary)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {t.work.manualControl}
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            multiple
            value={selectedGroups}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedGroups(selected);
            }}
            className="px-3 py-2 border rounded-lg min-w-[200px]"
            style={{
              borderColor: 'var(--border-input)',
              height: 'var(--height-input-md)',
              backgroundColor: 'var(--surface-page)'
            }}
            size={1}
          >
            <option value="" disabled>{t.workQueue.articleGroup}</option>
            {articleGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <select
            multiple
            value={selectedSeasons}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              setSelectedSeasons(selected);
            }}
            className="px-3 py-2 border rounded-lg min-w-[200px]"
            style={{
              borderColor: 'var(--border-input)',
              height: 'var(--height-input-md)',
              backgroundColor: 'var(--surface-page)'
            }}
            size={1}
          >
            <option value="" disabled>Saison</option>
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <select
            multiple
            value={selectedCapacityImpacts}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value as CapacityImpact);
              setSelectedCapacityImpacts(selected);
            }}
            className="px-3 py-2 border rounded-lg min-w-[200px]"
            style={{
              borderColor: 'var(--border-input)',
              height: 'var(--height-input-md)',
              backgroundColor: 'var(--surface-page)'
            }}
            size={1}
          >
            <option value="" disabled>{t.workScreen.capacityImpact}</option>
            {capacityImpacts.map(impact => (
              <option key={impact} value={impact}>{impact}</option>
            ))}
          </select>
        </div>
        
        <div className="relative">
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value as AllocationStatus || null)}
            className="px-3 py-2 border rounded-lg min-w-[180px]"
            style={{
              borderColor: 'var(--border-input)',
              height: 'var(--height-input-md)',
              backgroundColor: 'var(--surface-page)'
            }}
          >
            <option value="">{t.workQueue.statusAll}</option>
            <option value="Offen">{t.workQueue.open}</option>
            <option value="In Planung">{t.workQueue.inPlanning}</option>
            <option value="Simuliert">{t.workQueue.simulated}</option>
            <option value="Allokiert">Allokiert</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={deliveryDateFrom}
            onChange={(e) => setDeliveryDateFrom(e.target.value)}
            placeholder="Von"
            className="px-3 py-2 border rounded-lg"
            style={{
              borderColor: 'var(--border-input)',
              height: 'var(--height-input-md)',
              backgroundColor: 'var(--surface-page)'
            }}
          />
          <span style={{ color: 'var(--text-muted)' }}>bis</span>
          <input
            type="date"
            value={deliveryDateTo}
            onChange={(e) => setDeliveryDateTo(e.target.value)}
            placeholder="Bis"
            className="px-3 py-2 border rounded-lg"
            style={{
              borderColor: 'var(--border-input)',
              height: 'var(--height-input-md)',
              backgroundColor: 'var(--surface-page)'
            }}
          />
        </div>
      </div>
      
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter, idx) => (
            <span
              key={idx}
              className="px-3 py-1 rounded-full flex items-center gap-2"
              style={{
                backgroundColor: 'var(--surface-subtle-tint)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)'
              }}
            >
              {filter.label}
              <button
                onClick={() => handleClearFilter(filter.type)}
                className="hover:opacity-70"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Data Source Indicator */}
      {hasSimulationData && (
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded"
          style={{ 
            backgroundColor: '#8b5cf615',
            border: '1px solid #8b5cf630',
            fontSize: 'var(--font-size-xs)',
            color: '#8b5cf6'
          }}
        >
          <Beaker size={16} />
          <span>{t.workScreen.simulationView}</span>
        </div>
      )}
      
      {/* Charts */}
      <div className="grid grid-cols-12 gap-6">
        {/* Pie Chart */}
        <div
          className="col-span-3 p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)',
            minHeight: '280px'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {t.workQueue.allocationStatus}
            </h3>
          </div>
          
          {/* Toggle */}
          <div className="flex items-center gap-1 mb-3 border rounded p-1" style={{ borderColor: 'var(--border-input)', width: 'fit-content' }}>
            <button
              onClick={() => setPieChartView('status')}
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: pieChartView === 'status' ? 'var(--brand-primary)' : 'transparent',
                color: pieChartView === 'status' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Status
            </button>
            <button
              onClick={() => setPieChartView('capacity')}
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: pieChartView === 'capacity' ? 'var(--brand-primary)' : 'transparent',
                color: pieChartView === 'capacity' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {t.workScreen.capacity}
            </button>
          </div>
          
          <ResponsiveContainer width="100%" height={180} minHeight={180}>
            <PieChart>
              <Pie
                data={pieChartView === 'status' ? statusStats : capacityStats}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={55}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                onClick={(data) => {
                  if (pieChartView === 'status') {
                    setStatusFilter(data.name as AllocationStatus);
                  } else {
                    setCapacityImpactFilter(data.name as CapacityImpact);
                  }
                }}
                style={{ cursor: 'pointer', fontSize: 'var(--font-size-xs)' }}
              >
                {(pieChartView === 'status' ? statusStats : capacityStats).map((entry, index) => (
                  <Cell 
                    key={index} 
                    fill={pieChartView === 'status' 
                      ? STATUS_COLORS[entry.name as AllocationStatus] 
                      : CAPACITY_COLORS[entry.name as CapacityImpact]
                    } 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Bar Chart */}
        <div
          className="col-span-9 p-4 rounded-lg border"
          style={{
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-default)',
            minHeight: '280px'
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              {t.workQueue.allocationsByMonth}
            </h3>
            
            {/* Toggle */}
            <div className="flex items-center gap-1 border rounded p-1" style={{ borderColor: 'var(--border-input)' }}>
              <button
                onClick={() => setBarChartView('status')}
                className="px-2 py-1 rounded"
                style={{
                  backgroundColor: barChartView === 'status' ? 'var(--brand-primary)' : 'transparent',
                  color: barChartView === 'status' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                Status
              </button>
              <button
                onClick={() => setBarChartView('capacity')}
                className="px-2 py-1 rounded"
                style={{
                  backgroundColor: barChartView === 'capacity' ? 'var(--brand-primary)' : 'transparent',
                  color: barChartView === 'capacity' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                {t.workScreen.capacity}
              </button>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={210} minHeight={210}>
            {barChartView === 'status' ? (
              <BarChart data={monthlyStats}>
                <XAxis dataKey="month" style={{ fontSize: 'var(--font-size-xs)' }} />
                <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Offen"
                  stackId="a"
                  fill={STATUS_COLORS['Offen']}
                  onClick={(data) => {
                    setMonthFilter(data.monthKey);
                    setStatusFilter('Offen');
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <Bar
                  dataKey="In Planung"
                  stackId="a"
                  fill={STATUS_COLORS['In Planung']}
                  onClick={(data) => {
                    setMonthFilter(data.monthKey);
                    setStatusFilter('In Planung');
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <Bar
                  dataKey="Simuliert"
                  stackId="a"
                  fill={STATUS_COLORS['Simuliert']}
                  onClick={(data) => {
                    setMonthFilter(data.monthKey);
                    setStatusFilter('Simuliert');
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <Bar
                  dataKey="Allokiert"
                  stackId="a"
                  fill={STATUS_COLORS['Allokiert']}
                  onClick={(data) => {
                    setMonthFilter(data.monthKey);
                    setStatusFilter('Allokiert');
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            ) : (
              <BarChart data={monthlyCapacityStats}>
                <XAxis dataKey="month" style={{ fontSize: 'var(--font-size-xs)' }} />
                <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="Überkapazität"
                  stackId="a"
                  fill={CAPACITY_COLORS['Überkapazität']}
                  onClick={(data) => {
                    setMonthFilter(data.monthKey);
                    setCapacityImpactFilter('Überkapazität');
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <Bar
                  dataKey="Untererfüllung"
                  stackId="a"
                  fill={CAPACITY_COLORS['Untererfüllung']}
                  onClick={(data) => {
                    setMonthFilter(data.monthKey);
                    setCapacityImpactFilter('Untererfüllung');
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <Bar
                  dataKey="Ausgeglichen"
                  stackId="a"
                  fill={CAPACITY_COLORS['Ausgeglichen']}
                  onClick={(data) => {
                    setMonthFilter(data.monthKey);
                    setCapacityImpactFilter('Ausgeglichen');
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Table */}
      <div
        className="p-4 rounded-lg border"
        style={{
          backgroundColor: 'var(--surface-page)',
          borderColor: 'var(--border-default)'
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              {selectedArticles.length} {t.workQueue.articlesSelected}
            </span>
            {overCapacitySelectedCount > 0 && (
              <div 
                className="mt-2 flex items-center gap-2 px-3 py-2 rounded"
                style={{ 
                  backgroundColor: 'var(--surface-warning-subtle)',
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-warning)'
                }}
              >
                <Info size={16} />
                <span>{t.workQueue.capacityWarning}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleBookmarkSelected}
            disabled={selectedArticles.length === 0}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              borderColor: 'var(--button-secondary-border)',
              color: 'var(--button-secondary-text)',
              height: 'var(--height-button-md)',
              opacity: selectedArticles.length > 0 ? 1 : 0.5,
              cursor: selectedArticles.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            Allokation vormerken
          </button>
        </div>
        
        <DataGrid
          columns={columns}
          data={filteredArticles}
          density="comfortable"
          selectable
          selectedRows={selectedArticles}
          onSelectionChange={setSelectedArticles}
        />
      </div>
      
      {/* Allocation Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            style={{
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-4)'
              }}
            >
              {t.work.performAllocation}
            </h2>
            
            {/* Capacity Summary */}
            {modalArticles.filter(a => a.capacityImpact === 'Überkapazität' || a.capacityImpact === 'Untererfüllung').length > 0 && (
              <div 
                className="mb-6 p-4 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--surface-info-subtle)',
                  border: '1px solid var(--border-info)'
                }}
              >
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-2)' }}>
                  {t.work.capacitySummary}
                </div>
                <div className="space-y-1" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  {modalArticles.filter(a => a.capacityImpact === 'Überkapazität').length > 0 && (
                    <div>
                      • {t.work.overcapacityRisk}: <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                        {modalArticles.filter(a => a.capacityImpact === 'Überkapazität').length}
                      </span>
                    </div>
                  )}
                  {modalArticles.filter(a => a.capacityImpact === 'Untererfüllung').length > 0 && (
                    <div>
                      • {t.work.underfulfillmentRisk}: <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                        {modalArticles.filter(a => a.capacityImpact === 'Untererfüllung').length}
                      </span>
                    </div>
                  )}
                </div>
                <div 
                  className="mt-3 pt-3"
                  style={{ 
                    borderTop: '1px solid var(--border-info)',
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--text-muted)'
                  }}
                >
                  {t.work.capacityNote}
                </div>
              </div>
            )}
            
            {/* Options */}
            <div className="space-y-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateMode}
                  onChange={(e) => setSimulateMode(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--brand-primary)' }}
                />
                <div>
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                    {t.work.simulateAllocation}
                  </span>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                    {t.work.simulateNote}
                  </p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleBackground}
                  onChange={(e) => setScheduleBackground(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: 'var(--brand-primary)' }}
                />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                  {t.work.scheduleBackground}
                </span>
              </label>
              
              {scheduleBackground && (
                <div className="ml-7 flex items-center gap-3">
                  <input
                    type="date"
                    className="px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      height: 'var(--height-input-md)'
                    }}
                  />
                  <input
                    type="time"
                    className="px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      height: 'var(--height-input-md)'
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Articles List */}
            <div className="mb-6">
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-3)'
                }}
              >
                {t.work.selectedArticles} ({modalArticles.length})
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {modalArticles.map(article => (
                  <div
                    key={article.id}
                    className="flex items-center justify-between p-3 border rounded"
                    style={{ borderColor: 'var(--border-default)' }}
                  >
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
                    <button
                      onClick={() => handleRemoveFromModal(article.id)}
                      className="p-1 hover:bg-surface-tint rounded"
                    >
                      <X size={16} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: 'var(--button-secondary-bg)',
                  borderColor: 'var(--button-secondary-border)',
                  color: 'var(--button-secondary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmAllocation}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-primary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                {simulateMode ? t.work.startSimulation : t.work.startAllocation}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Simulation Results Modal */}
      {showSimulationResults && (
        <SimulationScreen
          articles={modalArticles}
          onBack={() => {
            setShowSimulationResults(false);
          }}
          onAccept={handleAcceptSimulation}
          onDiscard={() => {
            setShowSimulationResults(false);
            setModalArticles([]);
          }}
          onRelease={handleReleaseAllocation}
        />
      )}
      
      {/* Allocation Run Selection Modal */}
      {showRunModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: 'var(--bg-overlay)' }}
          onClick={() => {
            setShowRunModal(false);
            setSelectedRun(null);
            setRunDateFrom('');
            setRunDateTo('');
          }}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-3xl"
            style={{ boxShadow: 'var(--shadow-lg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3
                    style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      marginBottom: 'var(--space-2)'
                    }}
                  >
                    {t.work.selectAllocationRun}
                  </h3>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    {t.work.selectRunDescription}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowRunModal(false);
                    setSelectedRun(null);
                    setRunDateFrom('');
                    setRunDateTo('');
                  }}
                  className="p-1 hover:bg-surface-tint rounded"
                >
                  <X size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Datum von
                  </label>
                  <input
                    type="date"
                    value={runDateFrom}
                    onChange={(e) => setRunDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      height: 'var(--height-input-md)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Datum bis
                  </label>
                  <input
                    type="date"
                    value={runDateTo}
                    onChange={(e) => setRunDateTo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      height: 'var(--height-input-md)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Run List */}
            <div className="p-6" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <h4 style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-3)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Letzte Allokationsläufe
              </h4>
              
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border-default)' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--surface-alt)' }}>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)', width: '60px' }}>
                        
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                        Lauf-ID
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                        Typ
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                        Startdatum
                      </th>
                      <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                        Status
                      </th>
                      <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-muted)' }}>
                        {t.workQueue.articleCount}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRuns.map(run => (
                      <tr
                        key={run.id}
                        onClick={() => setSelectedRun(run.id)}
                        className="cursor-pointer hover:bg-surface-tint transition-colors"
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: selectedRun === run.id ? 'var(--surface-info-subtle)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <input
                            type="radio"
                            checked={selectedRun === run.id}
                            onChange={() => setSelectedRun(run.id)}
                            className="cursor-pointer"
                            style={{ accentColor: 'var(--brand-primary)' }}
                          />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <code
                            style={{
                              fontSize: 'var(--font-size-xs)',
                              fontFamily: 'var(--font-family-mono)',
                              backgroundColor: 'var(--surface-code-block)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)'
                            }}
                          >
                            {run.id}
                          </code>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--font-size-sm)' }}>
                          <span
                            className="px-2 py-1 rounded"
                            style={{
                              backgroundColor: run.type === 'initial' ? 'var(--surface-info-subtle)' : run.type === 'replenishment' ? 'var(--surface-success-subtle)' : 'var(--surface-warning-subtle)',
                              color: run.type === 'initial' ? 'var(--status-info)' : run.type === 'replenishment' ? 'var(--status-success)' : 'var(--status-warning)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 'var(--font-weight-medium)'
                            }}
                          >
                            {run.type === 'initial' ? 'Initial' : run.type === 'replenishment' ? 'Nachschub' : 'Manuell'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 'var(--font-size-sm)' }}>
                          {new Date(run.startDate).toLocaleString('de-DE')}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            className="px-3 py-1 rounded-full"
                            style={{
                              backgroundColor: 
                                run.status === 'Abgeschlossen' ? 'var(--status-success)' :
                                run.status === 'Läuft' ? 'var(--status-info)' :
                                run.status === 'Geplant' ? 'var(--status-warning)' :
                                'var(--status-danger)',
                              color: 'var(--text-inverse)',
                              fontSize: 'var(--font-size-xs)',
                              fontWeight: 'var(--font-weight-medium)'
                            }}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                          {run.articleCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t flex items-start justify-between" style={{ borderColor: 'var(--border-default)' }}>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', maxWidth: '450px' }}>
                <Info size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Der ausgewählte Allokationslauf wird schreibgeschützt geöffnet, sofern er bereits abgeschlossen ist.
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowRunModal(false);
                    setSelectedRun(null);
                    setRunDateFrom('');
                    setRunDateTo('');
                  }}
                  className="px-4 py-2 rounded-lg border"
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
                  onClick={handleSelectAllocationRun}
                  disabled={!selectedRun}
                  className="px-4 py-2 rounded-lg flex items-center gap-2"
                  style={{
                    backgroundColor: selectedRun ? 'var(--brand-primary)' : 'var(--border-default)',
                    color: 'var(--text-inverse)',
                    height: 'var(--height-button-md)',
                    opacity: selectedRun ? 1 : 0.5,
                    cursor: selectedRun ? 'pointer' : 'not-allowed'
                  }}
                >
                  <PlayCircle size={18} />
                  Allokationslauf öffnen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
          style={{
            backgroundColor: toast.type === 'success' ? 'var(--status-success)' : 'var(--status-danger)',
            color: 'var(--text-inverse)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100
          }}
        >
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
            {toast.message}
          </span>
          <button onClick={() => setToast(null)} className="hover:opacity-70">
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
