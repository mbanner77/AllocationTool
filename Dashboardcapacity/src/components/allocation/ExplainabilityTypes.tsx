export type StepStatus = 'OK' | 'WARN' | 'FAIL';

export interface DecisionStep {
  id: string;
  step: number;
  title: string;
  status: StepStatus;
  summary: string;
  what: string;
  inputs: Array<{
    label: string;
    value: string | number;
    source: string;
  }>;
  formula?: string;
  formulaInputs?: Array<{
    symbol: string;
    value: string | number;
    source: string;
    description?: string;
  }>;
  output: string;
  limitingFactor?: string;
  explanation: string;
  warnings?: string[];
}
