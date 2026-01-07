import { useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { HomeScreen } from './components/screens/HomeScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { CapacityScreen } from './components/screens/CapacityScreen';
import { WorkScreen } from './components/screens/WorkScreen';
import { RunsScreen } from './components/screens/RunsScreen';
import { ExceptionsScreen } from './components/screens/ExceptionsScreen';
import { ParametersScreen } from './components/screens/ParametersScreen';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { AllocationAnalysisScreen } from './components/screens/AllocationAnalysisScreen';
import { StoreLayoutScreen } from './components/screens/StoreLayoutScreen';
import { ScenariosScreen } from './components/screens/ScenariosScreen';
import { ScenarioManagementScreen } from './components/allocation/ScenarioManagementScreen';
import { SimulationAnalysisScreen } from './components/allocation/SimulationAnalysisScreen';
import { ReplenishmentSimulationScreen } from './components/allocation/ReplenishmentSimulationScreen';
import { ExplainabilityScreen } from './components/allocation/ExplainabilityScreen';
import { ClusterScreen } from './components/screens/ClusterScreen';
import { DataManagerScreen } from './components/screens/DataManagerScreen';

export type Screen = 
  | 'home'
  | 'settings'
  | 'capacity'
  | 'work'
  | 'runs'
  | 'scenarios'
  | 'scenarioManagement'
  | 'simulationAnalysis'
  | 'replenishmentSimulation'
  | 'explainability'
  | 'exceptions'
  | 'analytics'
  | 'parameters'
  | 'allocationAnalysis'
  | 'storeLayout'
  | 'cluster'
  | 'dataManager';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [currentVariantId, setCurrentVariantId] = useState<string | null>(null);
  const [currentVariantName, setCurrentVariantName] = useState<string>('');
  const [currentAllocationType, setCurrentAllocationType] = useState<'Initial Allocation' | 'Replenishment'>('Initial Allocation');

  const navigateTo = (screen: Screen, params?: { runId?: string; variantId?: string; variantName?: string; allocationType?: 'Initial Allocation' | 'Replenishment' }) => {
    setCurrentScreen(screen);
    if (screen === 'runs') {
      // If navigating to runs screen, set the runId (or null for list view)
      setCurrentRunId(params?.runId || null);
    }
    if (params?.variantId) {
      setCurrentVariantId(params.variantId);
    }
    if (params?.variantName) {
      setCurrentVariantName(params.variantName);
    }
    if (params?.allocationType) {
      setCurrentAllocationType(params.allocationType);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={navigateTo} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigateTo} />;
      case 'parameters':
        return <ParametersScreen />;
      case 'capacity':
        return <CapacityScreen onNavigate={navigateTo} />;
      case 'work':
        return <WorkScreen onNavigate={navigateTo} />;
      case 'runs':
        return <RunsScreen onNavigate={navigateTo} runId={currentRunId} />;
      case 'scenarios':
        return <ScenariosScreen onNavigate={navigateTo} />;
      case 'scenarioManagement':
        return (
          <ScenarioManagementScreen
            onNavigateToSimulation={(variantId, allocationType) => {
              const screen = allocationType === 'Replenishment' ? 'replenishmentSimulation' : 'simulationAnalysis';
              navigateTo(screen, { variantId, variantName: 'Optimiert - Hohe Prognosegewichtung', allocationType });
            }}
            onNavigateToExplainability={(variantId, allocationType) => navigateTo('explainability', { variantId, allocationType })}
            onNavigateToAllocationRun={(variantId) => navigateTo('runs', { variantId })}
          />
        );
      case 'simulationAnalysis':
        return (
          <SimulationAnalysisScreen
            variantName={currentVariantName || 'Optimiert - Hohe Prognosegewichtung'}
            onBack={() => navigateTo('scenarioManagement')}
            onSaveVariant={() => {
              // Save and return to scenario management
              navigateTo('scenarioManagement');
            }}
            onNavigateToExplainability={() => navigateTo('explainability', { allocationType: 'Initial Allocation' })}
          />
        );
      case 'replenishmentSimulation':
        return (
          <ReplenishmentSimulationScreen
            variantName={currentVariantName || 'NOS Nachschub - Standard'}
            onBack={() => navigateTo('scenarioManagement')}
            onSaveVariant={() => {
              // Save and return to scenario management
              navigateTo('scenarioManagement');
            }}
            onNavigateToExplainability={() => navigateTo('explainability', { allocationType: 'Replenishment' })}
          />
        );
      case 'explainability':
        return <ExplainabilityScreen allocationType={currentAllocationType} />;
      case 'exceptions':
        return <ExceptionsScreen onNavigate={navigateTo} />;
      case 'analytics':
        return <AnalyticsScreen onNavigate={navigateTo} />;
      case 'allocationAnalysis':
        return <AllocationAnalysisScreen onNavigate={navigateTo} />;
      case 'storeLayout':
        return <StoreLayoutScreen onNavigate={navigateTo} />;
      case 'cluster':
        return <ClusterScreen onNavigate={navigateTo} />;
      case 'dataManager':
        return <DataManagerScreen onNavigate={navigateTo} />;
      default:
        return <HomeScreen onNavigate={navigateTo} />;
    }
  };

  return (
    <AppShell currentScreen={currentScreen} onNavigate={navigateTo}>
      {renderScreen()}
    </AppShell>
  );
}
