import { FormulaTooltip } from './FormulaTooltip';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type KPIState = 'success' | 'warning' | 'critical' | 'neutral';

interface KPICardProps {
  title: string;
  value: string | number;
  unit?: string;
  delta?: number;
  deltaLabel?: string;
  state?: KPIState;
  formula?: string;
  formulaInputs?: Array<{
    symbol: string;
    value: string | number;
    source: string;
    description?: string;
  }>;
  onClick?: () => void;
}

const STATE_COLORS = {
  success: 'var(--status-success)',
  warning: 'var(--status-warning)',
  critical: 'var(--status-danger)',
  neutral: 'var(--text-secondary)'
};

const STATE_BG_COLORS = {
  success: 'var(--surface-success-subtle)',
  warning: 'var(--surface-warning-subtle)',
  critical: 'var(--surface-danger-subtle)',
  neutral: 'var(--surface-subtle)'
};

export function KPICard({ 
  title, 
  value, 
  unit, 
  delta, 
  deltaLabel, 
  state = 'neutral', 
  formula,
  formulaInputs,
  onClick 
}: KPICardProps) {
  const showDelta = delta !== undefined;
  const deltaPositive = delta && delta > 0;
  const deltaNegative = delta && delta < 0;

  return (
    <div
      className="p-4 rounded-lg border transition-all"
      style={{
        backgroundColor: 'var(--surface-page)',
        borderColor: state !== 'neutral' ? STATE_COLORS[state] : 'var(--border-default)',
        cursor: onClick ? 'pointer' : 'default',
        borderWidth: state !== 'neutral' ? '2px' : '1px'
      }}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div 
          style={{ 
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-muted)'
          }}
        >
          {title}
        </div>
        {formula && formulaInputs && (
          <FormulaTooltip
            formula={formula}
            inputs={formulaInputs}
            result={`${value}${unit ? ' ' + unit : ''}`}
          />
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        <div 
          style={{ 
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-semibold)',
            color: state !== 'neutral' ? STATE_COLORS[state] : 'var(--text-primary)'
          }}
        >
          {value}
        </div>
        {unit && (
          <div 
            style={{ 
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-muted)'
            }}
          >
            {unit}
          </div>
        )}
      </div>

      {/* Delta */}
      {showDelta && (
        <div className="flex items-center gap-2">
          <div
            className="px-2 py-1 rounded-full flex items-center gap-1"
            style={{
              backgroundColor: deltaNegative 
                ? 'var(--surface-danger-subtle)' 
                : deltaPositive 
                ? 'var(--surface-success-subtle)' 
                : 'var(--surface-subtle)',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 'var(--font-weight-medium)'
            }}
          >
            {deltaPositive && <TrendingUp size={12} style={{ color: 'var(--status-success)' }} />}
            {deltaNegative && <TrendingDown size={12} style={{ color: 'var(--status-danger)' }} />}
            {delta === 0 && <Minus size={12} style={{ color: 'var(--text-muted)' }} />}
            <span style={{ 
              color: deltaNegative 
                ? 'var(--status-danger)' 
                : deltaPositive 
                ? 'var(--status-success)' 
                : 'var(--text-muted)'
            }}>
              {deltaPositive ? '+' : ''}{delta}%
            </span>
          </div>
          {deltaLabel && (
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
              {deltaLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
