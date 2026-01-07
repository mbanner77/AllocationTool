import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import type { 
  AllocationRun, Store, Scenario, Exception, 
  AllocationParameter, Task, User 
} from '../types';
import { storage } from '../services/storage';
import { initializeAppData } from '../services/initialData';

// State type
interface AppState {
  runs: AllocationRun[];
  stores: Store[];
  scenarios: Scenario[];
  exceptions: Exception[];
  parameters: AllocationParameter[];
  tasks: Task[];
  currentUser: User | null;
  isLoading: boolean;
  isInitialized: boolean;
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'INITIALIZE'; payload: Partial<AppState> }
  | { type: 'SET_USER'; payload: User | null }
  // Runs
  | { type: 'SET_RUNS'; payload: AllocationRun[] }
  | { type: 'ADD_RUN'; payload: AllocationRun }
  | { type: 'UPDATE_RUN'; payload: AllocationRun }
  | { type: 'DELETE_RUN'; payload: string }
  // Stores
  | { type: 'SET_STORES'; payload: Store[] }
  | { type: 'ADD_STORE'; payload: Store }
  | { type: 'UPDATE_STORE'; payload: Store }
  | { type: 'DELETE_STORE'; payload: string }
  // Scenarios
  | { type: 'SET_SCENARIOS'; payload: Scenario[] }
  | { type: 'ADD_SCENARIO'; payload: Scenario }
  | { type: 'UPDATE_SCENARIO'; payload: Scenario }
  | { type: 'DELETE_SCENARIO'; payload: string }
  // Exceptions
  | { type: 'SET_EXCEPTIONS'; payload: Exception[] }
  | { type: 'ADD_EXCEPTION'; payload: Exception }
  | { type: 'UPDATE_EXCEPTION'; payload: Exception }
  | { type: 'DELETE_EXCEPTION'; payload: string }
  // Parameters
  | { type: 'SET_PARAMETERS'; payload: AllocationParameter[] }
  | { type: 'UPDATE_PARAMETER'; payload: AllocationParameter }
  // Tasks
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string };

// Initial state
const initialState: AppState = {
  runs: [],
  stores: [],
  scenarios: [],
  exceptions: [],
  parameters: [],
  tasks: [],
  currentUser: null,
  isLoading: true,
  isInitialized: false,
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'INITIALIZE':
      return { ...state, ...action.payload, isLoading: false, isInitialized: true };
    
    case 'SET_USER':
      return { ...state, currentUser: action.payload };
    
    // Runs
    case 'SET_RUNS':
      return { ...state, runs: action.payload };
    case 'ADD_RUN':
      return { ...state, runs: [...state.runs, action.payload] };
    case 'UPDATE_RUN':
      return { ...state, runs: state.runs.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_RUN':
      return { ...state, runs: state.runs.filter(r => r.id !== action.payload) };
    
    // Stores
    case 'SET_STORES':
      return { ...state, stores: action.payload };
    case 'ADD_STORE':
      return { ...state, stores: [...state.stores, action.payload] };
    case 'UPDATE_STORE':
      return { ...state, stores: state.stores.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_STORE':
      return { ...state, stores: state.stores.filter(s => s.id !== action.payload) };
    
    // Scenarios
    case 'SET_SCENARIOS':
      return { ...state, scenarios: action.payload };
    case 'ADD_SCENARIO':
      return { ...state, scenarios: [...state.scenarios, action.payload] };
    case 'UPDATE_SCENARIO':
      return { ...state, scenarios: state.scenarios.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SCENARIO':
      return { ...state, scenarios: state.scenarios.filter(s => s.id !== action.payload) };
    
    // Exceptions
    case 'SET_EXCEPTIONS':
      return { ...state, exceptions: action.payload };
    case 'ADD_EXCEPTION':
      return { ...state, exceptions: [...state.exceptions, action.payload] };
    case 'UPDATE_EXCEPTION':
      return { ...state, exceptions: state.exceptions.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_EXCEPTION':
      return { ...state, exceptions: state.exceptions.filter(e => e.id !== action.payload) };
    
    // Parameters
    case 'SET_PARAMETERS':
      return { ...state, parameters: action.payload };
    case 'UPDATE_PARAMETER':
      return { ...state, parameters: state.parameters.map(p => p.id === action.payload.id ? action.payload : p) };
    
    // Tasks
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return { ...state, tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) };
    
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  addRun: (run: Omit<AllocationRun, 'id' | 'createdAt' | 'updatedAt'>) => AllocationRun;
  updateRun: (run: AllocationRun) => void;
  deleteRun: (id: string) => void;
  addScenario: (scenario: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>) => Scenario;
  updateScenario: (scenario: Scenario) => void;
  deleteScenario: (id: string) => void;
  addException: (exception: Omit<Exception, 'id' | 'createdAt'>) => Exception;
  updateException: (exception: Exception) => void;
  resolveException: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Task;
  updateTask: (task: Task) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateParameter: (parameter: AllocationParameter) => void;
  resetData: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Generate unique ID
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize data on mount
  useEffect(() => {
    const loadData = () => {
      if (!storage.isInitialized()) {
        // First time: load initial data
        const initialData = initializeAppData();
        storage.saveRuns(initialData.runs);
        storage.saveStores(initialData.stores);
        storage.saveScenarios(initialData.scenarios);
        storage.saveExceptions(initialData.exceptions);
        storage.saveTasks(initialData.tasks);
        storage.saveParameters(initialData.parameters);
        storage.saveUser(initialData.user);
        
        dispatch({
          type: 'INITIALIZE',
          payload: {
            runs: initialData.runs,
            stores: initialData.stores,
            scenarios: initialData.scenarios,
            exceptions: initialData.exceptions,
            tasks: initialData.tasks,
            parameters: initialData.parameters,
            currentUser: initialData.user,
          }
        });
      } else {
        // Load from storage
        dispatch({
          type: 'INITIALIZE',
          payload: {
            runs: storage.getRuns(),
            stores: storage.getStores(),
            scenarios: storage.getScenarios(),
            exceptions: storage.getExceptions(),
            tasks: storage.getTasks(),
            parameters: storage.getParameters(),
            currentUser: storage.getUser(),
          }
        });
      }
    };

    loadData();
  }, []);

  // Persist changes to storage
  useEffect(() => {
    if (state.isInitialized) {
      storage.saveRuns(state.runs);
    }
  }, [state.runs, state.isInitialized]);

  useEffect(() => {
    if (state.isInitialized) {
      storage.saveScenarios(state.scenarios);
    }
  }, [state.scenarios, state.isInitialized]);

  useEffect(() => {
    if (state.isInitialized) {
      storage.saveExceptions(state.exceptions);
    }
  }, [state.exceptions, state.isInitialized]);

  useEffect(() => {
    if (state.isInitialized) {
      storage.saveTasks(state.tasks);
    }
  }, [state.tasks, state.isInitialized]);

  useEffect(() => {
    if (state.isInitialized) {
      storage.saveParameters(state.parameters);
    }
  }, [state.parameters, state.isInitialized]);

  // Helper functions
  const addRun = (runData: Omit<AllocationRun, 'id' | 'createdAt' | 'updatedAt'>): AllocationRun => {
    const now = new Date().toISOString();
    const run: AllocationRun = {
      ...runData,
      id: generateId('RUN'),
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_RUN', payload: run });
    return run;
  };

  const updateRun = (run: AllocationRun) => {
    const updated = { ...run, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_RUN', payload: updated });
  };

  const deleteRun = (id: string) => {
    dispatch({ type: 'DELETE_RUN', payload: id });
  };

  const addScenario = (scenarioData: Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>): Scenario => {
    const now = new Date().toISOString();
    const scenario: Scenario = {
      ...scenarioData,
      id: generateId('scenario'),
      createdAt: now,
      updatedAt: now,
    };
    dispatch({ type: 'ADD_SCENARIO', payload: scenario });
    return scenario;
  };

  const updateScenario = (scenario: Scenario) => {
    const updated = { ...scenario, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_SCENARIO', payload: updated });
  };

  const deleteScenario = (id: string) => {
    dispatch({ type: 'DELETE_SCENARIO', payload: id });
  };

  const addException = (exceptionData: Omit<Exception, 'id' | 'createdAt'>): Exception => {
    const exception: Exception = {
      ...exceptionData,
      id: generateId('exc'),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_EXCEPTION', payload: exception });
    return exception;
  };

  const updateException = (exception: Exception) => {
    dispatch({ type: 'UPDATE_EXCEPTION', payload: exception });
  };

  const resolveException = (id: string) => {
    const exception = state.exceptions.find(e => e.id === id);
    if (exception) {
      dispatch({
        type: 'UPDATE_EXCEPTION',
        payload: { ...exception, status: 'resolved', resolvedAt: new Date().toISOString() }
      });
    }
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt'>): Task => {
    const task: Task = {
      ...taskData,
      id: generateId('task'),
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_TASK', payload: task });
    return task;
  };

  const updateTask = (task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
  };

  const completeTask = (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
      dispatch({
        type: 'UPDATE_TASK',
        payload: { ...task, status: 'completed', completedAt: new Date().toISOString() }
      });
    }
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const updateParameter = (parameter: AllocationParameter) => {
    const updated = { ...parameter, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_PARAMETER', payload: updated });
  };

  const resetData = () => {
    storage.clearAll();
    const initialData = initializeAppData();
    storage.saveRuns(initialData.runs);
    storage.saveStores(initialData.stores);
    storage.saveScenarios(initialData.scenarios);
    storage.saveExceptions(initialData.exceptions);
    storage.saveTasks(initialData.tasks);
    storage.saveParameters(initialData.parameters);
    storage.saveUser(initialData.user);
    
    dispatch({
      type: 'INITIALIZE',
      payload: {
        runs: initialData.runs,
        stores: initialData.stores,
        scenarios: initialData.scenarios,
        exceptions: initialData.exceptions,
        tasks: initialData.tasks,
        parameters: initialData.parameters,
        currentUser: initialData.user,
      }
    });
  };

  const value: AppContextType = {
    state,
    dispatch,
    addRun,
    updateRun,
    deleteRun,
    addScenario,
    updateScenario,
    deleteScenario,
    addException,
    updateException,
    resolveException,
    addTask,
    updateTask,
    completeTask,
    deleteTask,
    updateParameter,
    resetData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Selector hooks for specific data
export function useRuns() {
  const { state } = useApp();
  return state.runs;
}

export function useScenarios() {
  const { state } = useApp();
  return state.scenarios;
}

export function useExceptions() {
  const { state } = useApp();
  return state.exceptions;
}

export function useTasks() {
  const { state } = useApp();
  return state.tasks;
}

export function useParameters() {
  const { state } = useApp();
  return state.parameters;
}

export function useStores() {
  const { state } = useApp();
  return state.stores;
}

export function useCurrentUser() {
  const { state } = useApp();
  return state.currentUser;
}
