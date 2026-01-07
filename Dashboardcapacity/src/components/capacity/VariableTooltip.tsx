import { VariableData } from './FormulaTooltip';

export interface VariableTooltipProps {
  variable: VariableData;
}

export function VariableTooltip({ variable }: VariableTooltipProps) {
  return (
    <div
      style={{
        maxWidth: '320px',
        backgroundColor: 'white',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
        padding: '12px',
        fontSize: 'var(--font-size-xs)',
        lineHeight: '1.4'
      }}
    >
      {/* Variable name header */}
      <div style={{
        fontFamily: 'monospace',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--brand-primary)',
        marginBottom: '8px',
        fontSize: 'var(--font-size-sm)'
      }}>
        {variable.variable}
      </div>

      {/* Definition */}
      {variable.definition && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-secondary)',
            marginBottom: '4px'
          }}>
            Definition
          </div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--text-primary)',
            lineHeight: '1.5'
          }}>
            {variable.definition}
          </div>
        </div>
      )}

      {/* Calculation */}
      {variable.calculation && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-secondary)',
            marginBottom: '4px'
          }}>
            Calculation
          </div>
          <div style={{
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-xs)',
            backgroundColor: 'var(--background-subtle)',
            padding: '6px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            overflowX: 'auto'
          }}>
            {variable.calculation}
          </div>
        </div>
      )}

      {/* Source table / system */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: '8px 12px',
        fontSize: 'var(--font-size-xs)',
        marginBottom: '8px'
      }}>
        {variable.sourceTable && (
          <>
            <div style={{ color: 'var(--text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
              Source Table:
            </div>
            <div style={{ color: 'var(--text-primary)' }}>
              {variable.sourceTable}
            </div>
          </>
        )}
        
        <div style={{ color: 'var(--text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
          Planning Level:
        </div>
        <div style={{ color: 'var(--text-primary)' }}>
          {variable.planningLevel}
        </div>

        {variable.lastUpdate && (
          <>
            <div style={{ color: 'var(--text-muted)', fontWeight: 'var(--font-weight-medium)' }}>
              Last Update:
            </div>
            <div style={{ color: 'var(--text-primary)' }}>
              {variable.lastUpdate}
            </div>
          </>
        )}
      </div>

      {/* Example raw values */}
      {variable.exampleValues && variable.exampleValues.length > 0 && (
        <div style={{
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--text-secondary)',
            marginBottom: '4px'
          }}>
            Example Values
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px'
          }}>
            {variable.exampleValues.map((val, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 'var(--font-size-xs)',
                  backgroundColor: 'var(--background-subtle)',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace'
                }}
              >
                {val}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
