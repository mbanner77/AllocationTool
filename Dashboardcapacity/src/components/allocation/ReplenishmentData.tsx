// Mock data for Replenishment Allocation Run

export interface ReplenishmentSKU {
  id: string;
  sku: string;
  articleColor: string;
  productGroup: string;
  season: string;
  priorityScore: number;
  forecastDemand: number;
  replenishmentNeed: number;
  dcSupply: number;
  allocated: number;
  shortage: number;
  capacityLimitedStores: number;
  stockoutRiskStores: number;
  substitutionUsed: number;
  packSizeRepairs: number;
  sizeCurveRepairs: number;
  status: 'ok' | 'shortage' | 'capacity_limited' | 'substitution_active' | 'repaired';
  packSize: number;
  spacePerUnit: number;
}

export interface ReplenishmentStoreAllocation {
  id: string;
  storeId: string;
  storeName: string;
  cluster: string;
  sku: string;
  listingAllowed: boolean;
  forecastSales: number;
  avgDailyForecast: number;
  onHand: number;
  inbound: number;
  targetServiceLevel: number;
  presentationMin: number;
  replenishmentNeed: number;
  capacityFree: number;
  capacityMaxUnits: number;
  allocationProposed: number;
  allocationFinal: number;
  coverage: number;
  expectedDOS: number;
  limitingFactor: 'supply' | 'capacity' | 'pack' | 'size' | 'listing' | null;
  substitutionUsed: boolean;
  exceptionsCount: number;
  sizes?: Array<{
    size: string;
    targetShare: number;
    onHand: number;
    allocated: number;
    repairDelta: number;
  }>;
}

export const REPLENISHMENT_SKUS: ReplenishmentSKU[] = [
  {
    id: 'sku-1',
    sku: 'RUN-PRO-001',
    articleColor: 'Running Shoes Pro - Black',
    productGroup: 'Shoes',
    season: 'NOS',
    priorityScore: 92.5,
    forecastDemand: 1450,
    replenishmentNeed: 1280,
    dcSupply: 1100,
    allocated: 1085,
    shortage: 195,
    capacityLimitedStores: 3,
    stockoutRiskStores: 8,
    substitutionUsed: 0,
    packSizeRepairs: 12,
    sizeCurveRepairs: 5,
    status: 'shortage',
    packSize: 6,
    spacePerUnit: 0.35
  },
  {
    id: 'sku-2',
    sku: 'JAC-WIN-045',
    articleColor: 'Winter Jacket - Navy',
    productGroup: 'Apparel',
    season: 'HW 2025',
    priorityScore: 88.3,
    forecastDemand: 2100,
    replenishmentNeed: 1850,
    dcSupply: 1950,
    allocated: 1835,
    shortage: 15,
    capacityLimitedStores: 5,
    stockoutRiskStores: 2,
    substitutionUsed: 0,
    packSizeRepairs: 8,
    sizeCurveRepairs: 3,
    status: 'ok',
    packSize: 4,
    spacePerUnit: 0.50
  },
  {
    id: 'sku-3',
    sku: 'HIK-BOO-023',
    articleColor: 'Hiking Boots - Brown',
    productGroup: 'Shoes',
    season: 'NOS',
    priorityScore: 85.7,
    forecastDemand: 980,
    replenishmentNeed: 820,
    dcSupply: 550,
    allocated: 545,
    shortage: 275,
    capacityLimitedStores: 2,
    stockoutRiskStores: 15,
    substitutionUsed: 6,
    packSizeRepairs: 10,
    sizeCurveRepairs: 8,
    status: 'substitution_active',
    packSize: 6,
    spacePerUnit: 0.42
  },
  {
    id: 'sku-4',
    sku: 'TRA-PAN-067',
    articleColor: 'Training Pants - Black',
    productGroup: 'Apparel',
    season: 'NOS',
    priorityScore: 91.2,
    forecastDemand: 1680,
    replenishmentNeed: 1420,
    dcSupply: 1450,
    allocated: 1410,
    shortage: 10,
    capacityLimitedStores: 1,
    stockoutRiskStores: 3,
    substitutionUsed: 0,
    packSizeRepairs: 6,
    sizeCurveRepairs: 2,
    status: 'ok',
    packSize: 8,
    spacePerUnit: 0.28
  },
  {
    id: 'sku-5',
    sku: 'CAP-BAS-012',
    articleColor: 'Baseball Cap - Various',
    productGroup: 'Accessories',
    season: 'NOS',
    priorityScore: 78.4,
    forecastDemand: 1200,
    replenishmentNeed: 1050,
    dcSupply: 1100,
    allocated: 1040,
    shortage: 10,
    capacityLimitedStores: 0,
    stockoutRiskStores: 1,
    substitutionUsed: 0,
    packSizeRepairs: 4,
    sizeCurveRepairs: 0,
    status: 'ok',
    packSize: 12,
    spacePerUnit: 0.15
  },
  {
    id: 'sku-6',
    sku: 'SOC-SHI-089',
    articleColor: 'Soccer Shirt - Red',
    productGroup: 'Apparel',
    season: 'SW 2025',
    priorityScore: 82.6,
    forecastDemand: 1340,
    replenishmentNeed: 1180,
    dcSupply: 980,
    allocated: 965,
    shortage: 215,
    capacityLimitedStores: 4,
    stockoutRiskStores: 11,
    substitutionUsed: 3,
    packSizeRepairs: 7,
    sizeCurveRepairs: 6,
    status: 'shortage',
    packSize: 6,
    spacePerUnit: 0.32
  }
];

export const REPLENISHMENT_STORE_ALLOCATIONS: ReplenishmentStoreAllocation[] = [
  {
    id: 'alloc-1',
    storeId: 'S001',
    storeName: 'Zürich HB',
    cluster: 'Urban Premium',
    sku: 'RUN-PRO-001',
    listingAllowed: true,
    forecastSales: 85,
    avgDailyForecast: 3.04,
    onHand: 12,
    inbound: 6,
    targetServiceLevel: 95,
    presentationMin: 6,
    replenishmentNeed: 67,
    capacityFree: 25.5,
    capacityMaxUnits: 72,
    allocationProposed: 67,
    allocationFinal: 66,
    coverage: 98.5,
    expectedDOS: 27.6,
    limitingFactor: 'pack',
    substitutionUsed: false,
    exceptionsCount: 1,
    sizes: [
      { size: '38', targetShare: 0.10, onHand: 1, allocated: 6, repairDelta: 0 },
      { size: '39', targetShare: 0.15, onHand: 2, allocated: 10, repairDelta: 0 },
      { size: '40', targetShare: 0.20, onHand: 3, allocated: 13, repairDelta: 1 },
      { size: '41', targetShare: 0.25, onHand: 3, allocated: 17, repairDelta: 1 },
      { size: '42', targetShare: 0.20, onHand: 2, allocated: 13, repairDelta: 0 },
      { size: '43', targetShare: 0.10, onHand: 1, allocated: 7, repairDelta: 1 }
    ]
  },
  {
    id: 'alloc-2',
    storeId: 'S002',
    storeName: 'Basel SBB',
    cluster: 'Urban Standard',
    sku: 'RUN-PRO-001',
    listingAllowed: true,
    forecastSales: 68,
    avgDailyForecast: 2.43,
    onHand: 8,
    inbound: 0,
    targetServiceLevel: 92,
    presentationMin: 5,
    replenishmentNeed: 60,
    capacityFree: 18.2,
    capacityMaxUnits: 52,
    allocationProposed: 52,
    allocationFinal: 54,
    coverage: 90.0,
    expectedDOS: 25.5,
    limitingFactor: 'capacity',
    substitutionUsed: false,
    exceptionsCount: 1,
    sizes: [
      { size: '38', targetShare: 0.10, onHand: 1, allocated: 5, repairDelta: 0 },
      { size: '39', targetShare: 0.15, onHand: 1, allocated: 8, repairDelta: 0 },
      { size: '40', targetShare: 0.20, onHand: 2, allocated: 11, repairDelta: 0 },
      { size: '41', targetShare: 0.25, onHand: 2, allocated: 14, repairDelta: 1 },
      { size: '42', targetShare: 0.20, onHand: 1, allocated: 11, repairDelta: 0 },
      { size: '43', targetShare: 0.10, onHand: 1, allocated: 5, repairDelta: 0 }
    ]
  },
  {
    id: 'alloc-3',
    storeId: 'S003',
    storeName: 'Genf',
    cluster: 'Urban Premium',
    sku: 'RUN-PRO-001',
    listingAllowed: true,
    forecastSales: 92,
    avgDailyForecast: 3.29,
    onHand: 15,
    inbound: 12,
    targetServiceLevel: 95,
    presentationMin: 6,
    replenishmentNeed: 65,
    capacityFree: 28.0,
    capacityMaxUnits: 80,
    allocationProposed: 65,
    allocationFinal: 66,
    coverage: 101.5,
    expectedDOS: 28.3,
    limitingFactor: 'pack',
    substitutionUsed: false,
    exceptionsCount: 0,
    sizes: [
      { size: '38', targetShare: 0.10, onHand: 2, allocated: 7, repairDelta: 1 },
      { size: '39', targetShare: 0.15, onHand: 2, allocated: 10, repairDelta: 0 },
      { size: '40', targetShare: 0.20, onHand: 3, allocated: 13, repairDelta: 0 },
      { size: '41', targetShare: 0.25, onHand: 4, allocated: 17, repairDelta: 1 },
      { size: '42', targetShare: 0.20, onHand: 2, allocated: 13, repairDelta: 0 },
      { size: '43', targetShare: 0.10, onHand: 2, allocated: 6, repairDelta: 0 }
    ]
  },
  {
    id: 'alloc-4',
    storeId: 'S004',
    storeName: 'Bern Bahnhof',
    cluster: 'Regional',
    sku: 'RUN-PRO-001',
    listingAllowed: true,
    forecastSales: 48,
    avgDailyForecast: 1.71,
    onHand: 3,
    inbound: 0,
    targetServiceLevel: 88,
    presentationMin: 4,
    replenishmentNeed: 45,
    capacityFree: 10.5,
    capacityMaxUnits: 30,
    allocationProposed: 30,
    allocationFinal: 30,
    coverage: 66.7,
    expectedDOS: 19.3,
    limitingFactor: 'capacity',
    substitutionUsed: false,
    exceptionsCount: 2,
    sizes: [
      { size: '38', targetShare: 0.10, onHand: 0, allocated: 3, repairDelta: 0 },
      { size: '39', targetShare: 0.15, onHand: 1, allocated: 5, repairDelta: 1 },
      { size: '40', targetShare: 0.20, onHand: 1, allocated: 6, repairDelta: 0 },
      { size: '41', targetShare: 0.25, onHand: 1, allocated: 8, repairDelta: 1 },
      { size: '42', targetShare: 0.20, onHand: 0, allocated: 6, repairDelta: 0 },
      { size: '43', targetShare: 0.10, onHand: 0, allocated: 2, repairDelta: -1 }
    ]
  },
  {
    id: 'alloc-5',
    storeId: 'S005',
    storeName: 'Luzern',
    cluster: 'Regional',
    sku: 'RUN-PRO-001',
    listingAllowed: true,
    forecastSales: 56,
    avgDailyForecast: 2.0,
    onHand: 5,
    inbound: 6,
    targetServiceLevel: 90,
    presentationMin: 4,
    replenishmentNeed: 45,
    capacityFree: 15.8,
    capacityMaxUnits: 45,
    allocationProposed: 45,
    allocationFinal: 42,
    coverage: 93.3,
    expectedDOS: 26.5,
    limitingFactor: 'pack',
    substitutionUsed: false,
    exceptionsCount: 0,
    sizes: [
      { size: '38', targetShare: 0.10, onHand: 1, allocated: 4, repairDelta: 0 },
      { size: '39', targetShare: 0.15, onHand: 1, allocated: 6, repairDelta: 0 },
      { size: '40', targetShare: 0.20, onHand: 1, allocated: 8, repairDelta: 0 },
      { size: '41', targetShare: 0.25, onHand: 1, allocated: 11, repairDelta: 1 },
      { size: '42', targetShare: 0.20, onHand: 1, allocated: 8, repairDelta: 0 },
      { size: '43', targetShare: 0.10, onHand: 0, allocated: 5, repairDelta: 1 }
    ]
  },
  {
    id: 'alloc-6',
    storeId: 'S006',
    storeName: 'St. Gallen',
    cluster: 'Regional',
    sku: 'HIK-BOO-023',
    listingAllowed: true,
    forecastSales: 42,
    avgDailyForecast: 1.5,
    onHand: 2,
    inbound: 0,
    targetServiceLevel: 85,
    presentationMin: 3,
    replenishmentNeed: 37,
    capacityFree: 8.4,
    capacityMaxUnits: 20,
    allocationProposed: 20,
    allocationFinal: 18,
    coverage: 48.6,
    expectedDOS: 13.3,
    limitingFactor: 'supply',
    substitutionUsed: true,
    exceptionsCount: 2,
    sizes: [
      { size: '39', targetShare: 0.12, onHand: 0, allocated: 2, repairDelta: 0 },
      { size: '40', targetShare: 0.18, onHand: 1, allocated: 3, repairDelta: 0 },
      { size: '41', targetShare: 0.25, onHand: 1, allocated: 5, repairDelta: 1 },
      { size: '42', targetShare: 0.22, onHand: 0, allocated: 4, repairDelta: 0 },
      { size: '43', targetShare: 0.15, onHand: 0, allocated: 3, repairDelta: 1 },
      { size: '44', targetShare: 0.08, onHand: 0, allocated: 1, repairDelta: 0 }
    ]
  }
];

export const REPLENISHMENT_KPI_DATA = {
  serviceLevelFulfillment: 87.3,
  stockoutRiskStores: 12,
  capacityUtilizationImpact: 78.5,
  supplyCoverageDC: 84.8,
  substitutionActivated: 6,
  repairsApplied: {
    pack: 47,
    size: 24
  },
  totalForecastDemand: 8750,
  totalReplenishmentNeed: 7600,
  totalDCSupply: 7130,
  totalAllocated: 6880,
  totalShortage: 720,
  horizon: {
    from: '2025-01-20',
    to: '2025-02-16',
    weeks: 4
  }
};
