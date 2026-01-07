import { Info } from 'lucide-react';
import { useState } from 'react';
import { VariableTooltip } from './VariableTooltip';

export interface VariableData {
  variable: string;
  value: number | string;
  unit: string;
  source: string;
  planningLevel: string;
  definition?: string;
  calculation?: string;
  sourceTable?: string;
  lastUpdate?: string;
  exampleValues?: string[];
}

export interface FormulaTooltipProps {
  metricName: string;
  context: string;
  formula: string;
  secondaryFormulas?: string[];
  variables: VariableData[];
  derivationMethod: string;
  fallback?: string;
  dataTimestamp: string;
  snapshotId: string;
  sourceSystem: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function FormulaTooltip({
  metricName,
  context,
  formula,
  secondaryFormulas,
  variables,
  derivationMethod,
  fallback,
  dataTimestamp,
  snapshotId,
  sourceSystem,
  position = 'top'
}: FormulaTooltipProps) {
  const [hoveredVariable, setHoveredVariable] = useState<VariableData | null>(null);
  const [subTooltipPosition, setSubTooltipPosition] = useState({ x: 0, y: 0 });

  const handleVariableHover = (variable: VariableData, event: React.MouseEvent) => {
    setHoveredVariable(variable);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setSubTooltipPosition({
      x: rect.right + 8,
      y: rect.top
    });
  };

  return (
    <>
      <div
        className="absolute z-50"
        style={{
          maxWidth: '420px',
          backgroundColor: 'white',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          padding: '16px',
          fontSize: 'var(--font-size-xs)',
          lineHeight: '1.4'
        }}
      >
        {/* HEADER */}
        <div style={{
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: '4px'
          }}>
            {metricName}
          </div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-muted)'
          }}>
            {context}
          </div>
        </div>

        {/* SECTION 1 – FORMULA */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-secondary)',
            marginBottom: '6px'
          }}>
            Formula
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-xs)',
            backgroundColor: 'var(--background-subtle)',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            overflowX: 'auto'
          }}>
            {formula}
          </div>
          {secondaryFormulas && secondaryFormulas.map((sf, idx) => (
            <div
              key={idx}
              style={{
                fontFamily: 'monospace',
                fontSize: 'var(--font-size-xs)',
                backgroundColor: 'var(--background-subtle)',
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                marginTop: '4px',
                overflowX: 'auto'
              }}
            >
              {sf}
            </div>
          ))}
        </div>

        {/* SECTION 2 – VARIABLE BREAKDOWN */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-secondary)',
            marginBottom: '6px'
          }}>
            Variable Breakdown
          </div>
          <table style={{
            width: '100%',
            fontSize: 'var(--font-size-xs)',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--background-subtle)'
              }}>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'var(--font-weight-medium)' }}>Variable</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'var(--font-weight-medium)' }}>Value</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'var(--font-weight-medium)' }}>Unit</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'var(--font-weight-medium)' }}>Source</th>
                <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 'var(--font-weight-medium)' }}>Level</th>
              </tr>
            </thead>
            <tbody>
              {variables.map((v, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    cursor: v.definition ? 'pointer' : 'default'
                  }}
                  onMouseEnter={(e) => v.definition && handleVariableHover(v, e)}
                  onMouseLeave={() => setHoveredVariable(null)}
                >
                  <td style={{
                    padding: '6px 8px',
                    fontFamily: 'monospace',
                    color: 'var(--text-primary)',
                    textDecoration: v.definition ? 'underline dotted' : 'none'
                  }}>
                    {v.variable}
                  </td>
                  <td style={{
                    padding: '6px 8px',
                    textAlign: 'right',
                    fontWeight: 'var(--font-weight-medium)',
                    color: 'var(--text-primary)'
                  }}>
                    {typeof v.value === 'number' ? v.value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v.value}
                  </td>
                  <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{v.unit}</td>
                  <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{v.source}</td>
                  <td style={{ padding: '6px 8px', color: 'var(--text-secondary)' }}>{v.planningLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 3 – DERIVATION METHOD */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-secondary)',
            marginBottom: '6px'
          }}>
            Derivation Method
          </div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-primary)',
            lineHeight: '1.5'
          }}>
            {derivationMethod}
          </div>
          {fallback && (
            <div style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-warning)',
              marginTop: '4px',
              fontStyle: 'italic'
            }}>
              Fallback: {fallback}
            </div>
          )}
        </div>

        {/* SECTION 4 – DATA SNAPSHOT */}
        <div style={{
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Timestamp: </span>
              {dataTimestamp}
            </div>
            <div>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Snapshot: </span>
              {snapshotId}
            </div>
            <div>
              <span style={{ fontWeight: 'var(--font-weight-medium)' }}>Source: </span>
              {sourceSystem}
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TOOLTIP FOR VARIABLES */}
      {hoveredVariable && hoveredVariable.definition && (
        <div
          style={{
            position: 'fixed',
            left: `${subTooltipPosition.x}px`,
            top: `${subTooltipPosition.y}px`,
            zIndex: 60
          }}
        >
          <VariableTooltip variable={hoveredVariable} />
        </div>
      )}
    </>
  );
}

// Wrapper component for easy trigger
interface FormulaTooltipTriggerProps {
  children: React.ReactNode;
  tooltipProps: FormulaTooltipProps;
  isDerived?: boolean;
  isPlanned?: boolean;
}

export function FormulaTooltipTrigger({
  children,
  tooltipProps,
  isDerived = false,
  isPlanned = false
}: FormulaTooltipTriggerProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltipPosition({
      x: rect.left,
      y: rect.bottom + 8
    });
    setShowTooltip(true);
  };

  return (
    <span
      style={{
        position: 'relative',
        textDecoration: isDerived ? 'underline dashed' : isPlanned ? 'underline solid' : 'none',
        textUnderlineOffset: '2px',
        cursor: 'help',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      {isDerived && <Info size={12} style={{ color: 'var(--text-muted)' }} />}
      
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            zIndex: 50
          }}
        >
          <FormulaTooltip {...tooltipProps} />
        </div>
      )}
    </span>
  );
}
