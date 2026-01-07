import { useState, useMemo } from 'react';
import { useLanguage } from '../../i18n';
import { DataGrid, Column } from '../common/DataGrid';
import { X, Info, BarChart3, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Checkbox } from '../ui/checkbox';
import { ProductDetailView, ProductDetailData } from '../capacity/ProductDetailView';
import { mockProductDetails, getProductDetailByNumber } from '../capacity/ProductDetailMockData';

type EvaluationLevel = 'Gesamt' | 'Cluster' | 'Filiale';
type HierarchyLevel = 'Unternehmen' | 'Einkaufsbereich' | 'Produktgruppe' | 'Produkt';
type AllocationType = 'Initiale Allokation' | 'Nachschub';
type Unit = 'm²' | 'Warenträger';
type Status = 'OK' | 'Überbelegt' | 'Unterbelegt';
type Season = 'HW 2025' | 'SW 2025' | 'HW 2026' | 'SW 2026' | 'NOS - Never out of Stock';

// Base data at Product/Store level
interface BaseCapacityData {
  id: string;
  store: string;
  cluster: string;
  productNumber: string;
  product: string;
  brand: string;
  productGroup: string;
  purchaseArea: string; // Einkaufsbereich
  season: Season;
  allocationType: AllocationType;
  totalCapacity: number;
  actualCapacity: number;
  targetCapacity: number;
  forecastSuggestion: number;
  inventory: number;
}

interface CapacityRow {
  id: string;
  level: string;
  evaluationLevel: EvaluationLevel;
  cluster?: string;
  store?: string;
  hierarchyLevel: HierarchyLevel;
  category: string;
  totalCapacity: number;
  actualCapacity: number;
  actualUtilization: number;
  targetCapacity: number;
  targetUtilization: number;
  forecastSuggestion: number;
  deviation: number;
  inventory?: number;
  status: Status;
}

interface CapacityScreenProps {
  onNavigate: (screen: string) => void;
}

// Base data: Product/Store level with seasons
const BASE_DATA: BaseCapacityData[] = [
  // Zürich HB - Urban Premium - HW 2025
  { id: 'zh-hb-running-shoes-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'SP-RUN-001', product: 'Running Shoes Pro', brand: 'Nike', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 25, actualCapacity: 23, targetCapacity: 24, forecastSuggestion: 24, inventory: 460 },
  { id: 'zh-hb-hiking-shoes-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'SP-HIK-002', product: 'Hiking Boots', brand: 'Salomon', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 30, actualCapacity: 28, targetCapacity: 28, forecastSuggestion: 28, inventory: 560 },
  { id: 'zh-hb-casual-shoes-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'SP-CAS-003', product: 'Casual Sneakers', brand: 'Adidas', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 30, actualCapacity: 27, targetCapacity: 28, forecastSuggestion: 27, inventory: 540 },
  { id: 'zh-hb-winter-jacket-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AP-WIN-004', product: 'Winter Jacket', brand: 'The North Face', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 45, actualCapacity: 43, targetCapacity: 42, forecastSuggestion: 40, inventory: 860 },
  { id: 'zh-hb-fleece-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AP-FLE-005', product: 'Fleece Pullover', brand: 'Patagonia', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 35, actualCapacity: 34, targetCapacity: 33, forecastSuggestion: 32, inventory: 680 },
  { id: 'zh-hb-pants-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AP-PAN-006', product: 'Sport Pants', brand: 'Under Armour', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 30, actualCapacity: 29, targetCapacity: 28, forecastSuggestion: 27, inventory: 580 },
  { id: 'zh-hb-socks-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AC-SOC-007', product: 'Sport Socks', brand: 'Nike', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 15, actualCapacity: 13, targetCapacity: 14, forecastSuggestion: 13, inventory: 260 },
  { id: 'zh-hb-backpack-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AC-BAC-008', product: 'Backpack', brand: 'Deuter', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 20, actualCapacity: 17, targetCapacity: 19, forecastSuggestion: 18, inventory: 340 },
  { id: 'zh-hb-gloves-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AC-GLO-009', product: 'Winter Gloves', brand: 'The North Face', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 10, actualCapacity: 8, targetCapacity: 9, forecastSuggestion: 9, inventory: 160 },
  { id: 'zh-hb-smartwatch-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'EL-SMA-010', product: 'Smartwatch', brand: 'Garmin', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 20, actualCapacity: 18, targetCapacity: 19, forecastSuggestion: 19, inventory: 360 },
  { id: 'zh-hb-headphones-hw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'EL-HEA-011', product: 'Headphones', brand: 'Sony', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 15, actualCapacity: 13, targetCapacity: 13, forecastSuggestion: 13, inventory: 260 },
  
  // Zürich HB - SW 2025
  { id: 'zh-hb-running-shoes-sw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'SP-RUN-001', product: 'Running Shoes Pro', brand: 'Nike', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'SW 2025', allocationType: 'Initiale Allokation', totalCapacity: 25, actualCapacity: 22, targetCapacity: 23, forecastSuggestion: 23, inventory: 440 },
  { id: 'zh-hb-summer-shoes-sw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'SP-SUM-012', product: 'Summer Sandals', brand: 'Birkenstock', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'SW 2025', allocationType: 'Initiale Allokation', totalCapacity: 30, actualCapacity: 26, targetCapacity: 27, forecastSuggestion: 27, inventory: 520 },
  { id: 'zh-hb-tshirt-sw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AP-TSH-013', product: 'T-Shirt', brand: 'Adidas', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'SW 2025', allocationType: 'Initiale Allokation', totalCapacity: 40, actualCapacity: 38, targetCapacity: 37, forecastSuggestion: 36, inventory: 760 },
  { id: 'zh-hb-shorts-sw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AP-SHO-014', product: 'Shorts', brand: 'Nike', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'SW 2025', allocationType: 'Initiale Allokation', totalCapacity: 30, actualCapacity: 28, targetCapacity: 27, forecastSuggestion: 26, inventory: 560 },
  { id: 'zh-hb-sunglasses-sw25', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AC-SUN-015', product: 'Sunglasses', brand: 'Ray-Ban', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'SW 2025', allocationType: 'Initiale Allokation', totalCapacity: 12, actualCapacity: 10, targetCapacity: 11, forecastSuggestion: 11, inventory: 200 },
  
  // Basel SBB - Urban Standard - HW 2025
  { id: 'bs-sbb-running-shoes-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'SP-RUN-001', product: 'Running Shoes Pro', brand: 'Nike', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 20, actualCapacity: 17, targetCapacity: 19, forecastSuggestion: 19, inventory: 340 },
  { id: 'bs-sbb-hiking-shoes-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'SP-HIK-002', product: 'Hiking Boots', brand: 'Salomon', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 25, actualCapacity: 21, targetCapacity: 23, forecastSuggestion: 24, inventory: 420 },
  { id: 'bs-sbb-casual-shoes-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'SP-CAS-003', product: 'Casual Sneakers', brand: 'Adidas', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 25, actualCapacity: 20, targetCapacity: 23, forecastSuggestion: 24, inventory: 400 },
  { id: 'bs-sbb-winter-jacket-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'AP-WIN-004', product: 'Winter Jacket', brand: 'The North Face', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 35, actualCapacity: 33, targetCapacity: 32, forecastSuggestion: 31, inventory: 660 },
  { id: 'bs-sbb-fleece-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'AP-FLE-005', product: 'Fleece Pullover', brand: 'Patagonia', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 30, actualCapacity: 28, targetCapacity: 27, forecastSuggestion: 26, inventory: 560 },
  { id: 'bs-sbb-pants-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'AP-PAN-006', product: 'Sport Pants', brand: 'Under Armour', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 25, actualCapacity: 23, targetCapacity: 23, forecastSuggestion: 22, inventory: 460 },
  { id: 'bs-sbb-socks-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'AC-SOC-007', product: 'Sport Socks', brand: 'Nike', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 12, actualCapacity: 8, targetCapacity: 10, forecastSuggestion: 10, inventory: 160 },
  { id: 'bs-sbb-backpack-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'AC-BAC-008', product: 'Backpack', brand: 'Deuter', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 15, actualCapacity: 10, targetCapacity: 13, forecastSuggestion: 12, inventory: 200 },
  { id: 'bs-sbb-gloves-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'AC-GLO-009', product: 'Winter Gloves', brand: 'The North Face', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 8, actualCapacity: 4, targetCapacity: 7, forecastSuggestion: 6, inventory: 80 },
  { id: 'bs-sbb-smartwatch-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'EL-SMA-010', product: 'Smartwatch', brand: 'Garmin', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 15, actualCapacity: 12, targetCapacity: 13, forecastSuggestion: 14, inventory: 240 },
  { id: 'bs-sbb-headphones-hw25', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'EL-HEA-011', product: 'Headphones', brand: 'Sony', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 10, actualCapacity: 8, targetCapacity: 9, forecastSuggestion: 9, inventory: 160 },
  
  // Bern Bahnhof - Regional - HW 2025
  { id: 'be-bhf-running-shoes-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'SP-RUN-001', product: 'Running Shoes Pro', brand: 'Nike', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 18, actualCapacity: 14, targetCapacity: 16, forecastSuggestion: 17, inventory: 280 },
  { id: 'be-bhf-hiking-shoes-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'SP-HIK-002', product: 'Hiking Boots', brand: 'Salomon', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 22, actualCapacity: 18, targetCapacity: 20, forecastSuggestion: 21, inventory: 360 },
  { id: 'be-bhf-casual-shoes-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'SP-CAS-003', product: 'Casual Sneakers', brand: 'Adidas', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 20, actualCapacity: 15, targetCapacity: 18, forecastSuggestion: 19, inventory: 300 },
  { id: 'be-bhf-winter-jacket-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'AP-WIN-004', product: 'Winter Jacket', brand: 'The North Face', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 30, actualCapacity: 29, targetCapacity: 28, forecastSuggestion: 27, inventory: 580 },
  { id: 'be-bhf-fleece-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'AP-FLE-005', product: 'Fleece Pullover', brand: 'Patagonia', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 25, actualCapacity: 24, targetCapacity: 23, forecastSuggestion: 22, inventory: 480 },
  { id: 'be-bhf-pants-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'AP-PAN-006', product: 'Sport Pants', brand: 'Under Armour', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 20, actualCapacity: 19, targetCapacity: 18, forecastSuggestion: 18, inventory: 380 },
  { id: 'be-bhf-socks-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'AC-SOC-007', product: 'Sport Socks', brand: 'Nike', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 8, actualCapacity: 5, targetCapacity: 7, forecastSuggestion: 6, inventory: 100 },
  { id: 'be-bhf-backpack-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'AC-BAC-008', product: 'Backpack', brand: 'Deuter', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 10, actualCapacity: 6, targetCapacity: 9, forecastSuggestion: 8, inventory: 120 },
  { id: 'be-bhf-gloves-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'AC-GLO-009', product: 'Winter Gloves', brand: 'The North Face', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 5, actualCapacity: 2, targetCapacity: 4, forecastSuggestion: 3, inventory: 40 },
  { id: 'be-bhf-smartwatch-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'EL-SMA-010', product: 'Smartwatch', brand: 'Garmin', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 12, actualCapacity: 9, targetCapacity: 10, forecastSuggestion: 11, inventory: 180 },
  { id: 'be-bhf-headphones-hw25', store: 'Bern Bahnhof', cluster: 'Regional', productNumber: 'EL-HEA-011', product: 'Headphones', brand: 'Sony', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 8, actualCapacity: 6, targetCapacity: 7, forecastSuggestion: 7, inventory: 120 },
  
  // Luzern - Regional - HW 2025
  { id: 'lu-running-shoes-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'SP-RUN-001', product: 'Running Shoes Pro', brand: 'Nike', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 20, actualCapacity: 16, targetCapacity: 18, forecastSuggestion: 19, inventory: 320 },
  { id: 'lu-hiking-shoes-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'SP-HIK-002', product: 'Hiking Boots', brand: 'Salomon', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 25, actualCapacity: 20, targetCapacity: 22, forecastSuggestion: 23, inventory: 400 },
  { id: 'lu-casual-shoes-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'SP-CAS-003', product: 'Casual Sneakers', brand: 'Adidas', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 22, actualCapacity: 17, targetCapacity: 20, forecastSuggestion: 21, inventory: 340 },
  { id: 'lu-winter-jacket-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'AP-WIN-004', product: 'Winter Jacket', brand: 'The North Face', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 32, actualCapacity: 31, targetCapacity: 30, forecastSuggestion: 29, inventory: 620 },
  { id: 'lu-fleece-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'AP-FLE-005', product: 'Fleece Pullover', brand: 'Patagonia', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 28, actualCapacity: 27, targetCapacity: 26, forecastSuggestion: 25, inventory: 540 },
  { id: 'lu-pants-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'AP-PAN-006', product: 'Sport Pants', brand: 'Under Armour', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 22, actualCapacity: 21, targetCapacity: 20, forecastSuggestion: 20, inventory: 420 },
  { id: 'lu-socks-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'AC-SOC-007', product: 'Sport Socks', brand: 'Nike', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 10, actualCapacity: 7, targetCapacity: 9, forecastSuggestion: 8, inventory: 140 },
  { id: 'lu-backpack-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'AC-BAC-008', product: 'Backpack', brand: 'Deuter', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 12, actualCapacity: 8, targetCapacity: 10, forecastSuggestion: 10, inventory: 160 },
  { id: 'lu-gloves-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'AC-GLO-009', product: 'Winter Gloves', brand: 'The North Face', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 7, actualCapacity: 4, targetCapacity: 6, forecastSuggestion: 5, inventory: 80 },
  { id: 'lu-smartwatch-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'EL-SMA-010', product: 'Smartwatch', brand: 'Garmin', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 10, actualCapacity: 8, targetCapacity: 9, forecastSuggestion: 9, inventory: 160 },
  { id: 'lu-headphones-hw25', store: 'Luzern', cluster: 'Regional', productNumber: 'EL-HEA-011', product: 'Headphones', brand: 'Sony', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 8, actualCapacity: 6, targetCapacity: 7, forecastSuggestion: 7, inventory: 120 },
  
  // Genf - Urban Premium - HW 2025
  { id: 'ge-running-shoes-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'SP-RUN-001', product: 'Running Shoes Pro', brand: 'Nike', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 28, actualCapacity: 26, targetCapacity: 27, forecastSuggestion: 27, inventory: 520 },
  { id: 'ge-hiking-shoes-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'SP-HIK-002', product: 'Hiking Boots', brand: 'Salomon', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 32, actualCapacity: 30, targetCapacity: 31, forecastSuggestion: 30, inventory: 600 },
  { id: 'ge-casual-shoes-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'SP-CAS-003', product: 'Casual Sneakers', brand: 'Adidas', productGroup: 'Shoes', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 35, actualCapacity: 32, targetCapacity: 33, forecastSuggestion: 32, inventory: 640 },
  { id: 'ge-winter-jacket-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'AP-WIN-004', product: 'Winter Jacket', brand: 'The North Face', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 50, actualCapacity: 48, targetCapacity: 47, forecastSuggestion: 45, inventory: 960 },
  { id: 'ge-fleece-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'AP-FLE-005', product: 'Fleece Pullover', brand: 'Patagonia', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 38, actualCapacity: 36, targetCapacity: 35, forecastSuggestion: 34, inventory: 720 },
  { id: 'ge-pants-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'AP-PAN-006', product: 'Sport Pants', brand: 'Under Armour', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 32, actualCapacity: 30, targetCapacity: 30, forecastSuggestion: 29, inventory: 600 },
  { id: 'ge-socks-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'AC-SOC-007', product: 'Sport Socks', brand: 'Nike', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 18, actualCapacity: 15, targetCapacity: 17, forecastSuggestion: 16, inventory: 300 },
  { id: 'ge-backpack-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'AC-BAC-008', product: 'Backpack', brand: 'Deuter', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 22, actualCapacity: 19, targetCapacity: 21, forecastSuggestion: 20, inventory: 380 },
  { id: 'ge-gloves-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'AC-GLO-009', product: 'Winter Gloves', brand: 'The North Face', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 12, actualCapacity: 10, targetCapacity: 11, forecastSuggestion: 11, inventory: 200 },
  { id: 'ge-smartwatch-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'EL-SMA-010', product: 'Smartwatch', brand: 'Garmin', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 22, actualCapacity: 20, targetCapacity: 21, forecastSuggestion: 21, inventory: 400 },
  { id: 'ge-headphones-hw25', store: 'Genf', cluster: 'Urban Premium', productNumber: 'EL-HEA-011', product: 'Headphones', brand: 'Sony', productGroup: 'Electronics', purchaseArea: 'Elektronik', season: 'HW 2025', allocationType: 'Initiale Allokation', totalCapacity: 18, actualCapacity: 16, targetCapacity: 17, forecastSuggestion: 17, inventory: 320 },
  
  // NOS Products - Available all year
  { id: 'zh-hb-basic-socks-nos', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AC-BAS-NOS-01', product: 'Basic Sport Socks', brand: 'Nike', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'NOS - Never out of Stock', allocationType: 'Initiale Allokation', totalCapacity: 20, actualCapacity: 18, targetCapacity: 19, forecastSuggestion: 19, inventory: 360 },
  { id: 'bs-sbb-basic-socks-nos', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'AC-BAS-NOS-01', product: 'Basic Sport Socks', brand: 'Nike', productGroup: 'Accessories', purchaseArea: 'Sport & Outdoor', season: 'NOS - Never out of Stock', allocationType: 'Initiale Allokation', totalCapacity: 15, actualCapacity: 13, targetCapacity: 14, forecastSuggestion: 14, inventory: 260 },
  { id: 'zh-hb-basic-tshirt-nos', store: 'Zürich HB', cluster: 'Urban Premium', productNumber: 'AP-BAS-NOS-02', product: 'Basic T-Shirt', brand: 'Adidas', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'NOS - Never out of Stock', allocationType: 'Initiale Allokation', totalCapacity: 25, actualCapacity: 23, targetCapacity: 24, forecastSuggestion: 24, inventory: 460 },
  { id: 'bs-sbb-basic-tshirt-nos', store: 'Basel SBB', cluster: 'Urban Standard', productNumber: 'AP-BAS-NOS-02', product: 'Basic T-Shirt', brand: 'Adidas', productGroup: 'Apparel', purchaseArea: 'Sport & Outdoor', season: 'NOS - Never out of Stock', allocationType: 'Initiale Allokation', totalCapacity: 20, actualCapacity: 18, targetCapacity: 19, forecastSuggestion: 19, inventory: 360 },
];

const STATUS_COLORS = {
  'OK': 'var(--status-success)',
  'Überbelegt': 'var(--status-danger)',
  'Unterbelegt': 'var(--status-warning)'
};

const getUtilizationColor = (utilization: number): string => {
  if (utilization < 75) return '#10b981';
  if (utilization < 85) return '#eab308';
  if (utilization < 95) return '#f97316';
  return '#ef4444';
};

const getStatus = (deviation: number): Status => {
  if (deviation > 10) return 'Überbelegt';
  if (deviation < -20) return 'Unterbelegt';
  return 'OK';
};

export function CapacityScreen({ onNavigate }: CapacityScreenProps) {
  // State for target capacity changes
  const [targetCapacityOverrides, setTargetCapacityOverrides] = useState<Record<string, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [showPrognoseDrawer, setShowPrognoseDrawer] = useState(false);
  const [prognoseDetails, setPrognoseDetails] = useState<CapacityRow | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  
  // Product modal filters
  const [productNumberFilter, setProductNumberFilter] = useState('');
  const [productDescFilter, setProductDescFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [seasonFilterModal, setSeasonFilterModal] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedProductDetail, setSelectedProductDetail] = useState<ProductDetailData | null>(null);
  
  // Filters
  const [evaluationLevel, setEvaluationLevel] = useState<EvaluationLevel>('Gesamt');
  const [selectedCluster, setSelectedCluster] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [hierarchyLevel, setHierarchyLevel] = useState<HierarchyLevel>('Produktgruppe');
  const [selectedSeasons, setSelectedSeasons] = useState<Season[]>(['HW 2025', 'SW 2025', 'HW 2026', 'SW 2026', 'NOS - Never out of Stock']);
  const [allocationType, setAllocationType] = useState<AllocationType>('Initiale Allokation');
  const [unit, setUnit] = useState<Unit>('m²');
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState('2025-12-31');
  
  // Filters for hierarchy levels
  const [selectedPurchaseArea, setSelectedPurchaseArea] = useState('');
  const [selectedProductGroup, setSelectedProductGroup] = useState('');
  
  // Available options
  const availableSeasons: Season[] = ['HW 2025', 'SW 2025', 'HW 2026', 'SW 2026', 'NOS - Never out of Stock'];
  
  const availableClusters = useMemo(() => {
    return Array.from(new Set(BASE_DATA.map(d => d.cluster)));
  }, []);
  
  const availableStores = useMemo(() => {
    return Array.from(new Set(BASE_DATA.map(d => d.store)));
  }, []);
  
  const availablePurchaseAreas = useMemo(() => {
    return Array.from(new Set(BASE_DATA.map(d => d.purchaseArea)));
  }, []);
  
  const availableProductGroups = useMemo(() => {
    let filtered = BASE_DATA;
    if (selectedPurchaseArea) {
      filtered = filtered.filter(d => d.purchaseArea === selectedPurchaseArea);
    }
    return Array.from(new Set(filtered.map(d => d.productGroup)));
  }, [selectedPurchaseArea]);
  
  // Products for modal
  const productsForModal = useMemo(() => {
    let filtered = BASE_DATA;
    
    // Apply hierarchy filters
    if (selectedPurchaseArea) {
      filtered = filtered.filter(d => d.purchaseArea === selectedPurchaseArea);
    }
    
    // Unique products
    const uniqueProducts = new Map<string, BaseCapacityData>();
    filtered.forEach(d => {
      if (!uniqueProducts.has(d.productNumber)) {
        uniqueProducts.set(d.productNumber, d);
      }
    });
    
    let products = Array.from(uniqueProducts.values());
    
    // Apply modal filters
    if (productNumberFilter) {
      products = products.filter(p => p.productNumber.toLowerCase().includes(productNumberFilter.toLowerCase()));
    }
    if (productDescFilter) {
      products = products.filter(p => p.product.toLowerCase().includes(productDescFilter.toLowerCase()));
    }
    if (brandFilter) {
      products = products.filter(p => p.brand.toLowerCase().includes(brandFilter.toLowerCase()));
    }
    if (seasonFilterModal) {
      products = products.filter(p => p.season === seasonFilterModal);
    }
    
    return products;
  }, [selectedPurchaseArea, productNumberFilter, productDescFilter, brandFilter, seasonFilterModal]);
  
  // Filtered base data
  const filteredBaseData = useMemo(() => {
    // If no seasons selected, return empty array
    if (selectedSeasons.length === 0) {
      return [];
    }
    
    let data = BASE_DATA.filter(d => {
      // Season filter - REQUIRED
      if (!selectedSeasons.includes(d.season)) return false;
      
      // Allocation type filter
      if (d.allocationType !== allocationType) return false;
      
      // Evaluation level filters
      if (evaluationLevel === 'Cluster' && selectedCluster && d.cluster !== selectedCluster) return false;
      if (evaluationLevel === 'Filiale' && selectedStore && d.store !== selectedStore) return false;
      
      // Hierarchy filters
      if (selectedPurchaseArea && d.purchaseArea !== selectedPurchaseArea) return false;
      if (selectedProductGroup && d.productGroup !== selectedProductGroup) return false;
      
      // Product filter (when products are selected in modal)
      if (hierarchyLevel === 'Produkt' && selectedProducts.length > 0) {
        if (!selectedProducts.includes(d.productNumber)) return false;
      }
      
      return true;
    });
    
    return data;
  }, [selectedSeasons, allocationType, evaluationLevel, selectedCluster, selectedStore, selectedPurchaseArea, selectedProductGroup, selectedProducts, hierarchyLevel]);
  
  // Aggregate data based on hierarchy level
  const aggregatedData = useMemo(() => {
    const rows: CapacityRow[] = [];
    
    if (hierarchyLevel === 'Produkt') {
      // Group by evaluation level + product
      const groups = new Map<string, BaseCapacityData[]>();
      
      filteredBaseData.forEach(d => {
        let key = '';
        if (evaluationLevel === 'Gesamt') {
          key = d.productNumber;
        } else if (evaluationLevel === 'Cluster') {
          key = `${d.cluster}-${d.productNumber}`;
        } else {
          key = `${d.store}-${d.productNumber}`;
        }
        
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(d);
      });
      
      groups.forEach((items, key) => {
        const totalCapacity = items.reduce((sum, i) => sum + i.totalCapacity, 0);
        const actualCapacity = items.reduce((sum, i) => sum + i.actualCapacity, 0);
        const targetCapacity = items.reduce((sum, i) => sum + (targetCapacityOverrides[i.id] ?? i.targetCapacity), 0);
        const forecastSuggestion = items.reduce((sum, i) => sum + i.forecastSuggestion, 0);
        const inventory = items.reduce((sum, i) => sum + i.inventory, 0);
        const actualUtilization = totalCapacity > 0 ? (actualCapacity / totalCapacity) * 100 : 0;
        const targetUtilization = totalCapacity > 0 ? (targetCapacity / totalCapacity) * 100 : 0;
        const deviation = actualCapacity - targetCapacity;
        
        rows.push({
          id: `agg-${key}`,
          level: `${items[0].productNumber} - ${items[0].product}`,
          evaluationLevel,
          cluster: items[0].cluster,
          store: evaluationLevel === 'Filiale' ? items[0].store : undefined,
          hierarchyLevel: 'Produkt',
          category: items[0].product,
          totalCapacity,
          actualCapacity,
          actualUtilization,
          targetCapacity,
          targetUtilization,
          forecastSuggestion,
          deviation,
          inventory,
          status: getStatus(deviation)
        });
      });
    } else if (hierarchyLevel === 'Produktgruppe') {
      // Group by evaluation level + product group
      const groups = new Map<string, BaseCapacityData[]>();
      
      filteredBaseData.forEach(d => {
        let key = '';
        if (evaluationLevel === 'Gesamt') {
          key = d.productGroup;
        } else if (evaluationLevel === 'Cluster') {
          key = `${d.cluster}-${d.productGroup}`;
        } else {
          key = `${d.store}-${d.productGroup}`;
        }
        
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(d);
      });
      
      groups.forEach((items, key) => {
        const totalCapacity = items.reduce((sum, i) => sum + i.totalCapacity, 0);
        const actualCapacity = items.reduce((sum, i) => sum + i.actualCapacity, 0);
        const baseTargetCapacity = items.reduce((sum, i) => sum + i.targetCapacity, 0);
        const aggId = `agg-${key}`;
        const targetCapacity = targetCapacityOverrides[aggId] ?? baseTargetCapacity;
        const forecastSuggestion = items.reduce((sum, i) => sum + i.forecastSuggestion, 0);
        const inventory = items.reduce((sum, i) => sum + i.inventory, 0);
        const actualUtilization = totalCapacity > 0 ? (actualCapacity / totalCapacity) * 100 : 0;
        const targetUtilization = totalCapacity > 0 ? (targetCapacity / totalCapacity) * 100 : 0;
        const deviation = actualCapacity - targetCapacity;
        
        rows.push({
          id: aggId,
          level: items[0].productGroup,
          evaluationLevel,
          cluster: items[0].cluster,
          store: evaluationLevel === 'Filiale' ? items[0].store : undefined,
          hierarchyLevel: 'Produktgruppe',
          category: items[0].productGroup,
          totalCapacity,
          actualCapacity,
          actualUtilization,
          targetCapacity,
          targetUtilization,
          forecastSuggestion,
          deviation,
          inventory,
          status: getStatus(deviation)
        });
      });
    } else if (hierarchyLevel === 'Einkaufsbereich') {
      // Group by evaluation level + purchase area
      const groups = new Map<string, BaseCapacityData[]>();
      
      filteredBaseData.forEach(d => {
        let key = '';
        if (evaluationLevel === 'Gesamt') {
          key = d.purchaseArea;
        } else if (evaluationLevel === 'Cluster') {
          key = `${d.cluster}-${d.purchaseArea}`;
        } else {
          key = `${d.store}-${d.purchaseArea}`;
        }
        
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(d);
      });
      
      groups.forEach((items, key) => {
        const totalCapacity = items.reduce((sum, i) => sum + i.totalCapacity, 0);
        const actualCapacity = items.reduce((sum, i) => sum + i.actualCapacity, 0);
        const targetCapacity = items.reduce((sum, i) => sum + (targetCapacityOverrides[i.id] ?? i.targetCapacity), 0);
        const forecastSuggestion = items.reduce((sum, i) => sum + i.forecastSuggestion, 0);
        const inventory = items.reduce((sum, i) => sum + i.inventory, 0);
        const actualUtilization = totalCapacity > 0 ? (actualCapacity / totalCapacity) * 100 : 0;
        const targetUtilization = totalCapacity > 0 ? (targetCapacity / totalCapacity) * 100 : 0;
        const deviation = actualCapacity - targetCapacity;
        
        rows.push({
          id: `agg-${key}`,
          level: items[0].purchaseArea,
          evaluationLevel,
          cluster: items[0].cluster,
          store: evaluationLevel === 'Filiale' ? items[0].store : undefined,
          hierarchyLevel: 'Einkaufsbereich',
          category: items[0].purchaseArea,
          totalCapacity,
          actualCapacity,
          actualUtilization,
          targetCapacity,
          targetUtilization,
          forecastSuggestion,
          deviation,
          inventory,
          status: getStatus(deviation)
        });
      });
    } else {
      // Unternehmen - aggregate everything
      const groups = new Map<string, BaseCapacityData[]>();
      
      filteredBaseData.forEach(d => {
        let key = '';
        if (evaluationLevel === 'Gesamt') {
          key = 'BLICK Gesamt';
        } else if (evaluationLevel === 'Cluster') {
          key = d.cluster;
        } else {
          key = d.store;
        }
        
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(d);
      });
      
      groups.forEach((items, key) => {
        const totalCapacity = items.reduce((sum, i) => sum + i.totalCapacity, 0);
        const actualCapacity = items.reduce((sum, i) => sum + i.actualCapacity, 0);
        const targetCapacity = items.reduce((sum, i) => sum + (targetCapacityOverrides[i.id] ?? i.targetCapacity), 0);
        const forecastSuggestion = items.reduce((sum, i) => sum + i.forecastSuggestion, 0);
        const inventory = items.reduce((sum, i) => sum + i.inventory, 0);
        const actualUtilization = totalCapacity > 0 ? (actualCapacity / totalCapacity) * 100 : 0;
        const targetUtilization = totalCapacity > 0 ? (targetCapacity / totalCapacity) * 100 : 0;
        const deviation = actualCapacity - targetCapacity;
        
        rows.push({
          id: `agg-${key}`,
          level: key,
          evaluationLevel,
          cluster: evaluationLevel !== 'Gesamt' ? items[0].cluster : undefined,
          store: evaluationLevel === 'Filiale' ? items[0].store : undefined,
          hierarchyLevel: 'Unternehmen',
          category: 'Alle Bereiche',
          totalCapacity,
          actualCapacity,
          actualUtilization,
          targetCapacity,
          targetUtilization,
          forecastSuggestion,
          deviation,
          inventory,
          status: getStatus(deviation)
        });
      });
    }
    
    return rows;
  }, [filteredBaseData, hierarchyLevel, evaluationLevel, targetCapacityOverrides]);
  
  // KPIs
  const kpis = useMemo(() => {
    const total = aggregatedData.reduce((sum, row) => sum + row.totalCapacity, 0);
    const actual = aggregatedData.reduce((sum, row) => sum + row.actualCapacity, 0);
    const target = aggregatedData.reduce((sum, row) => sum + row.targetCapacity, 0);
    const deviation = actual - target;
    const actualUtilization = total > 0 ? (actual / total) * 100 : 0;
    const targetUtilization = total > 0 ? (target / total) * 100 : 0;
    
    return {
      totalCapacity: total,
      actualUtilization: actualUtilization,
      targetUtilization: targetUtilization,
      deviation: deviation
    };
  }, [aggregatedData]);
  
  // Chart data
  const chartData = useMemo(() => {
    return aggregatedData.slice(0, 10).map(row => ({
      name: row.level,
      'SOLL': row.targetCapacity,
      'IST': row.actualCapacity
    }));
  }, [aggregatedData]);
  
  // Heatmap data
  const heatmapData = useMemo(() => {
    return aggregatedData.slice(0, 8).map(row => ({
      level: row.level,
      utilization: row.actualUtilization,
      color: getUtilizationColor(row.actualUtilization)
    }));
  }, [aggregatedData]);
  
  const handleTargetCapacityChange = (aggId: string, value: number) => {
    setTargetCapacityOverrides(prev => ({ ...prev, [aggId]: value }));
    setHasChanges(true);
  };
  
  const handleApplyForecast = (id: string) => {
    const row = aggregatedData.find(r => r.id === id);
    if (row) {
      handleTargetCapacityChange(id, row.forecastSuggestion);
      setShowPrognoseDrawer(false);
    }
  };
  
  const handleRecalculateForecast = () => {
    setToast({ message: 'Prognose erfolgreich neu berechnet', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };
  
  const handleSaveChanges = () => {
    const overCapacity = aggregatedData.filter(row => row.status === 'Überbelegt').length;
    
    if (overCapacity > 0) {
      setToast({ message: `Überkapazität in ${overCapacity} Bereichen erkannt`, type: 'warning' });
    } else {
      setToast({ message: 'Kapazitätsplanung gespeichert', type: 'success' });
    }
    
    setTimeout(() => setToast(null), 3000);
    setHasChanges(false);
  };
  
  const handleDiscardChanges = () => {
    setTargetCapacityOverrides({});
    setHasChanges(false);
  };
  
  const handleShowPrognose = (row: CapacityRow) => {
    setPrognoseDetails(row);
    setShowPrognoseDrawer(true);
  };
  
  const handleEvaluationLevelChange = (level: EvaluationLevel) => {
    setEvaluationLevel(level);
    setSelectedCluster('');
    setSelectedStore('');
  };
  
  const handleClusterChange = (cluster: string) => {
    setSelectedCluster(cluster);
    setSelectedStore('');
  };
  
  const handleSeasonToggle = (season: Season) => {
    setSelectedSeasons(prev => {
      if (prev.includes(season)) {
        return prev.filter(s => s !== season);
      } else {
        return [...prev, season];
      }
    });
  };
  
  const handleSeasonSelectAll = () => {
    if (selectedSeasons.length === availableSeasons.length) {
      setSelectedSeasons([]);
    } else {
      setSelectedSeasons([...availableSeasons]);
    }
  };
  
  const handleProductSelectionToggle = (productNumber: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productNumber)) {
        return prev.filter(p => p !== productNumber);
      } else {
        return [...prev, productNumber];
      }
    });
  };
  
  const handleProductSelectionToggleAll = () => {
    if (selectedProducts.length === productsForModal.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(productsForModal.map(p => p.productNumber));
    }
  };
  
  const handleApplyProductSelection = () => {
    setShowProductModal(false);
    // KPIs will automatically update through aggregatedData useMemo
  };
  
  const columns: Column<CapacityRow>[] = [
    { 
      key: 'level', 
      label: 'Ebene', 
      sortable: true,
      render: (value, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{value as string}</span>
          {hierarchyLevel === 'Produkt' && row.hierarchyLevel === 'Produkt' && (
            <Info 
              size={14} 
              style={{ 
                color: 'var(--brand-primary)', 
                cursor: 'pointer',
                opacity: 0.7
              }} 
              title="Klicken für Details"
            />
          )}
        </div>
      )
    },
    { 
      key: 'totalCapacity', 
      label: 'Gesamtkapazität',
      align: 'right',
      render: (value) => `${value} m²`
    },
    { 
      key: 'actualCapacity', 
      label: 'IST-Kapazität',
      align: 'right',
      render: (value) => `${value} m²`
    },
    {
      key: 'actualUtilization',
      label: 'IST-Auslastung',
      align: 'right',
      render: (value) => (
        <span
          className="px-2 py-1 rounded"
          style={{
            backgroundColor: getUtilizationColor(value as number),
            color: 'var(--text-inverse)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {(value as number).toFixed(1)}%
        </span>
      )
    },
    {
      key: 'targetCapacity',
      label: 'SOLL-Kapazität',
      align: 'right',
      render: (value, row) => {
        const isEditable = row.hierarchyLevel === 'Produktgruppe';
        const val = value as number;
        return (
          <div className="flex items-center gap-2" style={{ minWidth: '200px' }}>
            <input
              type="range"
              min={0}
              max={row.totalCapacity}
              step={5}
              value={val}
              onChange={(e) => isEditable && handleTargetCapacityChange(row.id, Number(e.target.value))}
              disabled={!isEditable}
              className="flex-1"
              style={{
                cursor: isEditable ? 'pointer' : 'not-allowed',
                opacity: isEditable ? 1 : 0.5
              }}
            />
            <input
              type="number"
              value={val}
              onChange={(e) => isEditable && handleTargetCapacityChange(row.id, Number(e.target.value))}
              disabled={!isEditable}
              className="w-16 px-2 py-1 border rounded text-right"
              style={{
                borderColor: 'var(--border-input)',
                fontSize: 'var(--font-size-sm)',
                backgroundColor: isEditable ? 'var(--surface-page)' : 'var(--surface-subtle)',
                cursor: isEditable ? 'text' : 'not-allowed',
                opacity: isEditable ? 1 : 0.6
              }}
            />
          </div>
        );
      }
    },
    {
      key: 'targetUtilization',
      label: 'SOLL-Auslastung',
      align: 'right',
      render: (value) => `${(value as number).toFixed(1)}%`
    },
    {
      key: 'forecastSuggestion',
      label: 'Prognose-Vorschlag',
      align: 'right',
      render: (value, row) => (
        <div className="flex items-center gap-2 justify-end">
          <span>{value} m²</span>
          <button
            onClick={() => handleShowPrognose(row)}
            className="px-2 py-1 rounded"
            style={{
              backgroundColor: 'var(--status-info)',
              color: 'var(--text-inverse)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            Empfohlen
          </button>
        </div>
      )
    },
    {
      key: 'deviation',
      label: 'Abweichung',
      align: 'right',
      render: (value) => {
        const val = value as number;
        return (
          <span style={{ color: val > 0 ? 'var(--status-danger)' : 'var(--status-success)' }}>
            {val > 0 ? '+' : ''}{val} m²
          </span>
        );
      }
    },
    {
      key: 'inventory',
      label: 'Bestand (in Stück)',
      align: 'right',
      render: (value) => value ? (value as number).toLocaleString('de-CH') : '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className="px-3 py-1 rounded-full"
          style={{
            backgroundColor: STATUS_COLORS[value as Status],
            color: 'var(--text-inverse)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)'
          }}
        >
          {value}
        </span>
      )
    }
  ];
  
  // Columns for product selection modal
  const productModalColumns: Column<BaseCapacityData>[] = [
    {
      key: 'productNumber',
      label: 'Produktnummer',
      sortable: true
    },
    {
      key: 'product',
      label: 'Produktbeschreibung',
      sortable: true
    },
    {
      key: 'brand',
      label: 'Marke',
      sortable: true
    },
    {
      key: 'season',
      label: 'Saison',
      sortable: true
    }
  ];
  
  return (
    <div className="space-y-6 pb-20">
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
            Kapazitätsplanung
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Analyse, Steuerung und Optimierung der Flächenkapazität je Filiale und Sortiment
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculateForecast}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              borderColor: 'var(--button-secondary-border)',
              color: 'var(--button-secondary-text)',
              height: 'var(--height-button-md)'
            }}
          >
            Prognose neu berechnen
          </button>
          
          <button
            onClick={handleSaveChanges}
            disabled={!hasChanges}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: hasChanges ? 'var(--button-primary-bg)' : 'var(--border-default)',
              color: 'var(--button-primary-text)',
              height: 'var(--height-button-md)',
              cursor: hasChanges ? 'pointer' : 'not-allowed',
              opacity: hasChanges ? 1 : 0.5
            }}
          >
            Änderungen übernehmen
          </button>
        </div>
      </div>
      
      {/* Control Bar */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label 
            style={{ 
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--space-1)',
              display: 'block',
              color: 'var(--text-muted)'
            }}
          >
            Organisationsebene
          </label>
          <select
            value={evaluationLevel}
            onChange={(e) => handleEvaluationLevelChange(e.target.value as EvaluationLevel)}
            className="px-3 py-2 border rounded-lg min-w-[160px]"
            style={{
              borderColor: 'var(--border-input)',
              height: 'var(--height-input-md)',
              backgroundColor: 'var(--surface-page)'
            }}
          >
            <option value="Gesamt">Gesamt</option>
            <option value="Cluster">Cluster</option>
            <option value="Filiale">Filiale</option>
          </select>
        </div>
        
        {evaluationLevel === 'Cluster' && (
          <div>
            <label 
              style={{ 
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--space-1)',
                display: 'block',
                color: 'var(--text-muted)'
              }}
            >
              Cluster
            </label>
            <select
              value={selectedCluster}
              onChange={(e) => handleClusterChange(e.target.value)}
              className="px-3 py-2 border rounded-lg min-w-[180px]"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)'
              }}
            >
              <option value="">Alle Cluster</option>
              {availableClusters.map(cluster => (
                <option key={cluster} value={cluster}>{cluster}</option>
              ))}
            </select>
          </div>
        )}
        
        {evaluationLevel === 'Filiale' && (
          <div>
            <label 
              style={{ 
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--space-1)',
                display: 'block',
                color: 'var(--text-muted)'
              }}
            >
              Filiale
            </label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-3 py-2 border rounded-lg min-w-[180px]"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)'
              }}
            >
              <option value="">Alle Filialen</option>
              {availableStores.map(store => (
                <option key={store} value={store}>{store}</option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label 
            style={{ 
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--space-1)',
              display: 'block',
              color: 'var(--text-muted)'
            }}
          >
            Artikelhierarchieebene
            {hierarchyLevel === 'Produktgruppe' && (
              <span 
                style={{ 
                  marginLeft: 'var(--space-2)',
                  color: 'var(--status-success)',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                Planungsebene
              </span>
            )}
          </label>
          <select
            value={hierarchyLevel}
            onChange={(e) => setHierarchyLevel(e.target.value as HierarchyLevel)}
            className="px-3 py-2 border rounded-lg min-w-[180px]"
            style={{
              borderColor: 'var(--border-input)',
              height: 'var(--height-input-md)',
              backgroundColor: 'var(--surface-page)'
            }}
          >
            <option value="Unternehmen">Unternehmen</option>
            <option value="Einkaufsbereich">Einkaufsbereich</option>
            <option value="Produktgruppe">Produktgruppe</option>
            <option value="Produkt">Produkt</option>
          </select>
        </div>
        
        {/* Einkaufsbereich Filter - shows when hierarchy is Produktgruppe or Produkt */}
        {(hierarchyLevel === 'Produktgruppe' || hierarchyLevel === 'Produkt') && (
          <div>
            <label 
              style={{ 
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--space-1)',
                display: 'block',
                color: 'var(--text-muted)'
              }}
            >
              Einkaufsbereich
            </label>
            <select
              value={selectedPurchaseArea}
              onChange={(e) => {
                setSelectedPurchaseArea(e.target.value);
                setSelectedProductGroup('');
                setSelectedProducts([]);
              }}
              className="px-3 py-2 border rounded-lg min-w-[180px]"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)'
              }}
            >
              <option value="">Alle Bereiche</option>
              {availablePurchaseAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Product Selector - shows when hierarchy is Produkt */}
        {hierarchyLevel === 'Produkt' && (
          <div>
            <label 
              style={{ 
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--space-1)',
                display: 'block',
                color: 'var(--text-muted)'
              }}
            >
              Produkt ({selectedProducts.length} ausgewählt)
            </label>
            <button
              onClick={() => setShowProductModal(true)}
              className="px-3 py-2 border rounded-lg min-w-[180px] flex items-center justify-between"
              style={{
                borderColor: 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)',
                textAlign: 'left'
              }}
            >
              <span>{selectedProducts.length > 0 ? `${selectedProducts.length} Produkte` : 'Produkt auswählen'}</span>
              <Search size={16} />
            </button>
          </div>
        )}
        
        <div>
          <label 
            style={{ 
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--space-1)',
              display: 'block',
              color: 'var(--text-muted)'
            }}
          >
            Saison ({selectedSeasons.length} ausgewählt)
          </label>
          <div className="relative">
            <select
              className="px-3 py-2 border rounded-lg min-w-[180px]"
              style={{
                borderColor: selectedSeasons.length === 0 ? 'var(--status-danger)' : 'var(--border-input)',
                height: 'var(--height-input-md)',
                backgroundColor: 'var(--surface-page)'
              }}
              onChange={(e) => {
                if (e.target.value === 'ALL') {
                  handleSeasonSelectAll();
                } else if (e.target.value) {
                  handleSeasonToggle(e.target.value as Season);
                }
                e.target.value = '';
              }}
              value=""
            >
              <option value="" disabled>Saison wählen...</option>
              <option value="ALL">{selectedSeasons.length === availableSeasons.length ? '☑ Alle abwählen' : '☐ Alle auswählen'}</option>
              {availableSeasons.map(season => (
                <option key={season} value={season}>
                  {selectedSeasons.includes(season) ? '☑ ' : '☐ '}{season}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label 
            style={{ 
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--space-1)',
              display: 'block',
              color: 'var(--text-muted)'
            }}
          >
            Allokationstyp
          </label>
          <select
            value={allocationType}
            onChange={(e) => setAllocationType(e.target.value as AllocationType)}
            className="px-3 py-2 border rounded-lg min-w-[180px]"
            style={{
              borderColor: 'var(--border-input)',
              height: 'var(--height-input-md)',
              backgroundColor: 'var(--surface-page)'
            }}
          >
            <option value="Initiale Allokation">Initiale Allokation</option>
            <option value="Nachschub">Nachschub</option>
          </select>
        </div>
        
        <div>
          <label 
            style={{ 
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)',
              marginBottom: 'var(--space-1)',
              display: 'block',
              color: 'var(--text-muted)'
            }}
          >
            Einheit
          </label>
          <div className="flex items-center gap-2 border rounded-lg p-1" style={{ borderColor: 'var(--border-input)' }}>
            <button
              onClick={() => setUnit('m²')}
              className="px-3 py-1 rounded"
              style={{
                backgroundColor: unit === 'm²' ? 'var(--brand-primary)' : 'transparent',
                color: unit === 'm²' ? 'var(--text-inverse)' : 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              m²
            </button>
            <button
              disabled
              className="px-3 py-1 rounded"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'not-allowed',
                opacity: 0.5
              }}
            >
              Warenträger
            </button>
          </div>
        </div>
      </div>
      
      {/* Selected Seasons Display */}
      {selectedSeasons.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSeasons.map(season => (
            <span
              key={season}
              className="px-3 py-1 rounded-full flex items-center gap-2"
              style={{
                backgroundColor: 'var(--surface-info-subtle)',
                color: 'var(--status-info)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 'var(--font-weight-medium)',
                border: '1px solid var(--border-info)'
              }}
            >
              {season}
              <button
                onClick={() => handleSeasonToggle(season)}
                className="hover:opacity-70"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* No season warning */}
      {selectedSeasons.length === 0 && (
        <div
          className="p-4 rounded-lg border flex items-start gap-3"
          style={{
            backgroundColor: 'var(--surface-danger-subtle)',
            borderColor: 'var(--status-danger)'
          }}
        >
          <Info size={20} style={{ color: 'var(--status-danger)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--status-danger)', marginBottom: '4px' }}>
              Keine Saison ausgewählt
            </div>
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
              Bitte wählen Sie mindestens eine Saison aus, um Kapazitätsdaten anzuzeigen.
            </div>
          </div>
        </div>
      )}
      
      {/* Store-specific action button */}
      {evaluationLevel === 'Filiale' && selectedStore && selectedSeasons.length > 0 && (
        <div
          className="p-4 rounded-lg border flex items-center justify-between"
          style={{
            backgroundColor: 'var(--surface-subtle-tint)',
            borderColor: 'var(--brand-primary)',
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded"
              style={{ 
                backgroundColor: 'var(--brand-primary)',
                color: 'var(--text-inverse)'
              }}
            >
              <BarChart3 size={24} />
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)', marginBottom: '2px' }}>
                Sortimentsverteilung für {selectedStore} analysieren
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                Visualisieren Sie, wie Produktgruppen auf Warenträgern verteilt sind
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigate('storeLayout')}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--text-inverse)',
              height: 'var(--height-button-md)',
              whiteSpace: 'nowrap'
            }}
          >
            Zur Analyse
          </button>
        </div>
      )}
      
      {selectedSeasons.length > 0 && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-6">
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                Gesamtkapazität
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                {kpis.totalCapacity} m²
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                Maximal nutzbare Fläche
              </div>
            </div>
            
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                IST-Auslastung
              </div>
              <div 
                style={{ 
                  fontSize: 'var(--font-size-2xl)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: getUtilizationColor(kpis.actualUtilization)
                }}
              >
                {kpis.actualUtilization.toFixed(1)}%
              </div>
            </div>
            
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                SOLL-Auslastung
              </div>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-semibold)' }}>
                {kpis.targetUtilization.toFixed(1)}%
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                prognosebasiert
              </div>
            </div>
            
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)'
              }}
            >
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                Abweichung
              </div>
              <div 
                style={{ 
                  fontSize: 'var(--font-size-2xl)', 
                  fontWeight: 'var(--font-weight-semibold)',
                  color: kpis.deviation > 0 ? 'var(--status-danger)' : 'var(--status-success)'
                }}
              >
                {kpis.deviation > 0 ? '+' : ''}{kpis.deviation} m²
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)' }}>
                {kpis.deviation > 0 ? 'Überbelegung' : 'Reserve'}
              </div>
            </div>
          </div>
          
          {/* Visualizations */}
          <div className="grid grid-cols-2 gap-6" style={{ height: '260px' }}>
            {/* Bar Chart */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)'
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-3)'
                }}
              >
                SOLL- vs. IST-Kapazität
              </h3>
              <div style={{ width: '100%', height: '190px', minHeight: '190px' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={190}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" style={{ fontSize: 'var(--font-size-xs)' }} />
                    <YAxis style={{ fontSize: 'var(--font-size-xs)' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="SOLL" fill="var(--brand-primary)" opacity={0.6} />
                    <Bar dataKey="IST" fill="var(--brand-accent)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Heatmap */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: 'var(--surface-page)',
                borderColor: 'var(--border-default)'
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: 'var(--space-3)'
                }}
              >
                Kapazitätsauslastung
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {heatmapData.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      backgroundColor: item.color,
                      color: 'var(--text-inverse)'
                    }}
                    title={`${item.level}: ${item.utilization.toFixed(1)}%`}
                  >
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-medium)' }}>
                      {item.level.length > 12 ? item.level.substring(0, 10) + '...' : item.level}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', marginTop: 'var(--space-1)' }}>
                      {item.utilization.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mt-4" style={{ fontSize: 'var(--font-size-xs)' }}>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#10b981' }} />
                  <span>&lt; 75%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }} />
                  <span>75-85%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }} />
                  <span>85-95%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
                  <span>&gt; 95%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Detail Table */}
          <div
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: 'var(--surface-page)',
              borderColor: 'var(--border-default)'
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-medium)',
                marginBottom: 'var(--space-4)'
              }}
            >
              Kapazitätsdetails
            </h3>
            
            {/* Info hint for product detail mode */}
            {hierarchyLevel === 'Produkt' && aggregatedData.length > 0 && (
              <div
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--brand-primary-10)',
                  border: '1px solid var(--brand-primary-30)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Info size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-primary)' }}>
                  Klicken Sie auf eine Produktzeile, um detaillierte Formeln und Explainability-Informationen anzuzeigen.
                </span>
              </div>
            )}
            
            {aggregatedData.length === 0 ? (
              <div 
                className="py-12 text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                Keine Daten für die ausgewählten Filter verfügbar.
              </div>
            ) : (
              <DataGrid
                columns={columns}
                data={aggregatedData}
                density="comfortable"
                onRowClick={(row) => {
                  // Only open detail view for product-level rows
                  if (hierarchyLevel === 'Produkt' && row.hierarchyLevel === 'Produkt') {
                    // Try to find matching product detail from mock data
                    const productDetail = mockProductDetails.find(p => 
                      p.productName === row.level || 
                      p.productNumber === row.id.split('-')[0]
                    );
                    if (productDetail) {
                      setSelectedProductDetail(productDetail);
                    } else {
                      // Fallback: use first product from mock data for demonstration
                      setSelectedProductDetail(mockProductDetails[0]);
                    }
                  } else {
                    // For non-product rows, just select the row
                    setSelectedRow(row.id);
                  }
                }}
              />
            )}
          </div>
        </>
      )}
      
      {/* Product Selector Modal */}
      {showProductModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowProductModal(false)}
          style={{ backgroundColor: 'var(--bg-overlay)' }}
        >
          <div 
            className="bg-white rounded-lg shadow-lg"
            style={{ 
              width: '900px',
              maxHeight: '700px',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  Produkt auswählen
                </h2>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="p-1 rounded hover:bg-surface-tint"
                >
                  <X size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
              
              {/* Filters */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Produktnummer
                  </label>
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={productNumberFilter}
                    onChange={(e) => setProductNumberFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Produktbeschreibung
                  </label>
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={productDescFilter}
                    onChange={(e) => setProductDescFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Marke
                  </label>
                  <input
                    type="text"
                    placeholder="Suchen..."
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Saison
                  </label>
                  <select
                    value={seasonFilterModal}
                    onChange={(e) => setSeasonFilterModal(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    style={{
                      borderColor: 'var(--border-input)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    <option value="">Alle Saisons</option>
                    {availableSeasons.map(season => (
                      <option key={season} value={season}>{season}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="p-4 overflow-auto flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Checkbox
                  checked={selectedProducts.length === productsForModal.length && productsForModal.length > 0}
                  onCheckedChange={handleProductSelectionToggleAll}
                />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                  Alle auswählen ({productsForModal.length} Produkte)
                </span>
              </div>
              
              <table className="w-full" style={{ fontSize: 'var(--font-size-sm)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-default)' }}>
                    <th style={{ textAlign: 'left', padding: '8px', width: '40px' }}></th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Produktnummer</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Produktbeschreibung</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Marke</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Saison</th>
                  </tr>
                </thead>
                <tbody>
                  {productsForModal.map(product => (
                    <tr 
                      key={product.productNumber}
                      className="hover:bg-surface-tint cursor-pointer"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      onClick={() => handleProductSelectionToggle(product.productNumber)}
                    >
                      <td style={{ padding: '8px' }}>
                        <Checkbox
                          checked={selectedProducts.includes(product.productNumber)}
                          onCheckedChange={() => handleProductSelectionToggle(product.productNumber)}
                        />
                      </td>
                      <td style={{ padding: '8px' }}>{product.productNumber}</td>
                      <td style={{ padding: '8px' }}>{product.product}</td>
                      <td style={{ padding: '8px' }}>{product.brand}</td>
                      <td style={{ padding: '8px' }}>{product.season}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t flex gap-3 justify-end" style={{ borderColor: 'var(--border-default)' }}>
              <button
                onClick={() => {
                  setSelectedProducts([]);
                  setShowProductModal(false);
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
                onClick={handleApplyProductSelection}
                className="px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-primary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                {selectedProducts.length} Produkte übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Prognose Drawer */}
      {showPrognoseDrawer && prognoseDetails && (
        <div 
          className="fixed inset-0 z-50 flex"
          onClick={() => setShowPrognoseDrawer(false)}
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
              <div className="flex items-center justify-between">
                <h2 style={{ 
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)'
                }}>
                  Prognose-Herleitung
                </h2>
                <button
                  onClick={() => setShowPrognoseDrawer(false)}
                  className="p-1 rounded hover:bg-surface-tint"
                >
                  <X size={20} style={{ color: 'var(--text-muted)' }} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <h3 style={{ 
                  fontSize: 'var(--font-size-md)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: 'var(--space-3)'
                }}>
                  {prognoseDetails.level}
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      Absatzprognose
                    </span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      {Math.round(prognoseDetails.forecastSuggestion * 1.2)} Einheiten
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      Zielreichweite
                    </span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      8 Wochen
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      Ø Bestandsmenge
                    </span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      {Math.round(prognoseDetails.forecastSuggestion * 0.8)} Einheiten
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                      Flächenbedarf je Artikel
                    </span>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>
                      0.35 m²
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-3 mt-4" style={{ backgroundColor: 'var(--surface-subtle-tint)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
                      Abgeleitete SOLL-Kapazität
                    </span>
                    <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--brand-primary)' }}>
                      {prognoseDetails.forecastSuggestion} m²
                    </span>
                  </div>
                </div>
              </div>
              
              <div 
                className="p-4 rounded-lg flex items-start gap-3"
                style={{
                  backgroundColor: 'var(--surface-info-subtle)',
                  border: '1px solid var(--border-info)'
                }}
              >
                <Info size={20} style={{ color: 'var(--status-info)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)' }}>
                  Die Prognose basiert auf historischen Verkaufsdaten der letzten 12 Monate, saisonalen Trends und geplanten Marketingaktionen.
                </div>
              </div>
            </div>
            
            <div 
              className="p-6 border-t sticky bottom-0 bg-white flex gap-3"
              style={{ borderColor: 'var(--border-default)' }}
            >
              <button
                onClick={() => setShowPrognoseDrawer(false)}
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
                onClick={() => handleApplyForecast(prognoseDetails.id)}
                className="flex-1 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'var(--button-primary-bg)',
                  color: 'var(--button-primary-text)',
                  height: 'var(--height-button-md)'
                }}
              >
                Prognosewert übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Sticky Footer */}
      {hasChanges && (
        <div 
          className="fixed bottom-0 left-0 right-0 flex items-center justify-end gap-3 px-6 border-t"
          style={{
            height: '64px',
            backgroundColor: 'var(--surface-page)',
            borderColor: 'var(--border-subtle)',
            zIndex: 40
          }}
        >
          <button
            onClick={handleDiscardChanges}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              borderColor: 'var(--button-secondary-border)',
              color: 'var(--button-secondary-text)',
              height: 'var(--height-button-md)'
            }}
          >
            Änderungen verwerfen
          </button>
          <button
            onClick={handleSaveChanges}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--button-primary-bg)',
              color: 'var(--button-primary-text)',
              height: 'var(--height-button-md)'
            }}
          >
            Änderungen übernehmen
          </button>
        </div>
      )}
      
      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-20 right-6 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up"
          style={{
            backgroundColor: 
              toast.type === 'success' ? 'var(--status-success)' :
              toast.type === 'warning' ? 'var(--status-warning)' :
              'var(--status-danger)',
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
      
      {/* Product Detail View */}
      {selectedProductDetail && (
        <ProductDetailView
          product={selectedProductDetail}
          onClose={() => setSelectedProductDetail(null)}
        />
      )}
    </div>
  );
}