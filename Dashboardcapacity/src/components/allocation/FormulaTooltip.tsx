import { Info } from 'lucide-react';
import { useState } from 'react';

interface FormulaInput {
  symbol: string;
  value: string | number;
  source: string;
  description?: string;
}

interface FormulaTooltipProps {
  formula: string;
  inputs: FormulaInput[];
  result?: string | number;
  explanation?: string;
}

export function FormulaTooltip({ formula, inputs, result, explanation }: FormulaTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <Info 
        size={16} 
        style={{ 
          color: 'var(--status-info)',
          cursor: 'help'
        }} 
      />
      
      {isVisible && (
        <div
          className="absolute z-50 rounded-lg shadow-lg p-4"
          style={{
            backgroundColor: 'var(--surface-page)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: '320px',
            maxWidth: '450px',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px'
          }}
        >
          {/* Formula */}
          <div 
            className="mb-3 p-3 rounded"
            style={{
              backgroundColor: 'var(--surface-subtle)',
              fontFamily: 'monospace',
              fontSize: 'var(--font-size-sm)',
              color: 'var(--text-primary)'
            }}
          >
            {formula}
          </div>
          
          {/* Inputs */}
          {inputs.length > 0 && (
            <div className="mb-3">
              <div 
                style={{ 
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--text-muted)',
                  marginBottom: 'var(--space-2)'
                }}
              >
                Eingabewerte:
              </div>
              <div className="space-y-2">
                {inputs.map((input, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start justify-between gap-3"
                    style={{ fontSize: 'var(--font-size-xs)' }}
                  >
                    <div className="flex-1">
                      <span 
                        style={{ 
                          fontFamily: 'monospace',
                          color: 'var(--brand-primary)',
                          fontWeight: 'var(--font-weight-medium)'
                        }}
                      >
                        {input.symbol}
                      </span>
                      {input.description && (
                        <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
                          {input.description}
                        </div>
                      )}
                      <div 
                        style={{ 
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--font-size-2xs)',
                          marginTop: '2px'
                        }}
                      >
                        Quelle: {input.source}
                      </div>
                    </div>
                    <div 
                      style={{ 
                        fontFamily: 'monospace',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      = {input.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Result */}
          {result !== undefined && (
            <div 
              className="p-2 rounded flex items-center justify-between"
              style={{
                backgroundColor: 'var(--surface-info-subtle)',
                border: '1px solid var(--border-info)'
              }}
            >
              <span 
                style={{ 
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--status-info)'
                }}
              >
                Ergebnis:
              </span>
              <span 
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--status-info)'
                }}
              >
                {result}
              </span>
            </div>
          )}
          
          {/* Explanation */}
          {explanation && (
            <div 
              className="mt-3 pt-3"
              style={{ 
                borderTop: '1px solid var(--border-subtle)',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--text-secondary)'
              }}
            >
              {explanation}
            </div>
          )}
          
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              width: '12px',
              height: '12px',
              backgroundColor: 'var(--surface-page)',
              border: '1px solid var(--border-default)',
              borderTop: 'none',
              borderLeft: 'none',
              transform: 'translateX(-50%) rotate(45deg)'
            }}
          />
        </div>
      )}
    </div>
  );
}
