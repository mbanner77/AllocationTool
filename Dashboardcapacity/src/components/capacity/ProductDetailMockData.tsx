import { ProductDetailData } from './ProductDetailView';

export const mockProductDetails: ProductDetailData[] = [
  {
    productNumber: 'SKU-5001',
    productName: 'Premium Winter Jacket "Alpine Pro"',
    brand: 'OutdoorGear',
    productGroup: 'Winterbekleidung',
    purchaseArea: 'Sport & Outdoor',
    store: 'Filiale Zürich HB',
    cluster: 'A',
    season: 'HW 2025',
    
    // Capacity values
    capSollProductGroup: 24.0,
    shareSoll: 0.18,
    capSollProduct: 4.32, // 24.0 * 0.18
    
    // Space per unit
    pBase: 0.012,
    mThickness: 1.3,
    mPresentation: 1.1,
    spacePerUnit: 0.0172, // 0.012 * 1.3 * 1.1
    
    // Forecast
    forecastQty: 1240,
    forecastSpaceDemand: 21.33, // 1240 * 0.0172
    
    // Inventory
    onHand: 180,
    inbound: 60,
    reserved: 40,
    projectedSpace: 4.82, // (180 + 60 + 40) * 0.0172
    
    // Deviation
    deviation: 0.50, // 4.82 - 4.32
    status: 'Warning',
    
    // Metadata
    dataTimestamp: '2025-12-17 14:30:00',
    snapshotId: 'SNAP-2025-12-17-001',
    sourceSystem: 'BLICK Allocation Engine',
    forecastVersion: 'FCast-2025-W50',
    forecastHorizon: 'Q1 2025 (12 weeks)'
  },
  {
    productNumber: 'SKU-5002',
    productName: 'Running Shoes "Velocity Max"',
    brand: 'SportLine',
    productGroup: 'Schuhe',
    purchaseArea: 'Sport & Outdoor',
    store: 'Filiale Zürich HB',
    cluster: 'A',
    season: 'SW 2025',
    
    capSollProductGroup: 18.5,
    shareSoll: 0.22,
    capSollProduct: 4.07,
    
    pBase: 0.008,
    mThickness: 1.2,
    mPresentation: 1.05,
    spacePerUnit: 0.01008,
    
    forecastQty: 890,
    forecastSpaceDemand: 8.97,
    
    onHand: 220,
    inbound: 80,
    reserved: 100,
    projectedSpace: 4.03,
    
    deviation: -0.04,
    status: 'OK',
    
    dataTimestamp: '2025-12-17 14:30:00',
    snapshotId: 'SNAP-2025-12-17-001',
    sourceSystem: 'BLICK Allocation Engine',
    forecastVersion: 'FCast-2025-W50',
    forecastHorizon: 'Q2 2025 (12 weeks)'
  },
  {
    productNumber: 'SKU-5003',
    productName: 'Yoga Mat "Premium Eco"',
    brand: 'FitnessPro',
    productGroup: 'Fitnessausrüstung',
    purchaseArea: 'Sport & Outdoor',
    store: 'Filiale Bern Westside',
    cluster: 'B',
    season: 'NOS - Never out of Stock',
    
    capSollProductGroup: 12.0,
    shareSoll: 0.15,
    capSollProduct: 1.80,
    
    pBase: 0.005,
    mThickness: 1.1,
    mPresentation: 1.0,
    spacePerUnit: 0.0055,
    
    forecastQty: 450,
    forecastSpaceDemand: 2.48,
    
    onHand: 120,
    inbound: 30,
    reserved: 50,
    projectedSpace: 1.10,
    
    deviation: -0.70,
    status: 'OK',
    
    dataTimestamp: '2025-12-17 14:30:00',
    snapshotId: 'SNAP-2025-12-17-001',
    sourceSystem: 'BLICK Allocation Engine',
    forecastVersion: 'FCast-2025-W50',
    forecastHorizon: 'Ongoing (NOS)'
  },
  {
    productNumber: 'SKU-5004',
    productName: 'Ski Goggles "Vision HD"',
    brand: 'SnowTech',
    productGroup: 'Winterausrüstung',
    purchaseArea: 'Sport & Outdoor',
    store: 'Filiale Zürich HB',
    cluster: 'A',
    season: 'HW 2025',
    
    capSollProductGroup: 8.5,
    shareSoll: 0.25,
    capSollProduct: 2.13,
    
    pBase: 0.004,
    mThickness: 1.0,
    mPresentation: 1.15,
    spacePerUnit: 0.0046,
    
    forecastQty: 680,
    forecastSpaceDemand: 3.13,
    
    onHand: 320,
    inbound: 150,
    reserved: 80,
    projectedSpace: 2.53,
    
    deviation: 0.40,
    status: 'Warning',
    
    dataTimestamp: '2025-12-17 14:30:00',
    snapshotId: 'SNAP-2025-12-17-001',
    sourceSystem: 'BLICK Allocation Engine',
    forecastVersion: 'FCast-2025-W50',
    forecastHorizon: 'Q1 2025 (12 weeks)'
  },
  {
    productNumber: 'SKU-5005',
    productName: 'Camping Tent "Family XL"',
    brand: 'OutdoorGear',
    productGroup: 'Camping',
    purchaseArea: 'Sport & Outdoor',
    store: 'Filiale Basel St. Johann',
    cluster: 'B',
    season: 'SW 2025',
    
    capSollProductGroup: 28.0,
    shareSoll: 0.12,
    capSollProduct: 3.36,
    
    pBase: 0.025,
    mThickness: 1.5,
    mPresentation: 1.2,
    spacePerUnit: 0.045,
    
    forecastQty: 180,
    forecastSpaceDemand: 8.10,
    
    onHand: 45,
    inbound: 20,
    reserved: 30,
    projectedSpace: 4.28,
    
    deviation: 0.92,
    status: 'Capacity Violation',
    
    dataTimestamp: '2025-12-17 14:30:00',
    snapshotId: 'SNAP-2025-12-17-001',
    sourceSystem: 'BLICK Allocation Engine',
    forecastVersion: 'FCast-2025-W50',
    forecastHorizon: 'Q2 2025 (12 weeks)'
  },
  {
    productNumber: 'SKU-5006',
    productName: 'Basketball "Pro League"',
    brand: 'SportLine',
    productGroup: 'Ballsport',
    purchaseArea: 'Sport & Outdoor',
    store: 'Filiale Genf Cornavin',
    cluster: 'A',
    season: 'NOS - Never out of Stock',
    
    capSollProductGroup: 6.0,
    shareSoll: 0.20,
    capSollProduct: 1.20,
    
    pBase: 0.003,
    mThickness: 1.0,
    mPresentation: 1.0,
    spacePerUnit: 0.003,
    
    forecastQty: 560,
    forecastSpaceDemand: 1.68,
    
    onHand: 280,
    inbound: 90,
    reserved: 50,
    projectedSpace: 1.26,
    
    deviation: 0.06,
    status: 'Warning',
    
    dataTimestamp: '2025-12-17 14:30:00',
    snapshotId: 'SNAP-2025-12-17-001',
    sourceSystem: 'BLICK Allocation Engine',
    forecastVersion: 'FCast-2025-W50',
    forecastHorizon: 'Ongoing (NOS)'
  }
];

// Helper function to get product details by product number
export function getProductDetailByNumber(productNumber: string): ProductDetailData | undefined {
  return mockProductDetails.find(p => p.productNumber === productNumber);
}

// Helper function to get product details for a specific store
export function getProductDetailsByStore(store: string): ProductDetailData[] {
  return mockProductDetails.filter(p => p.store === store);
}

// Helper function to get product details by season
export function getProductDetailsBySeason(season: string): ProductDetailData[] {
  return mockProductDetails.filter(p => p.season === season);
}

// Helper function to get products with capacity violations
export function getCapacityViolations(): ProductDetailData[] {
  return mockProductDetails.filter(p => p.status === 'Capacity Violation');
}

// Helper function to get products with warnings
export function getCapacityWarnings(): ProductDetailData[] {
  return mockProductDetails.filter(p => p.status === 'Warning');
}
