import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: 'neutral' | 'info' | 'warning' | 'danger' | 'success';
  delta?: {
    value: number;
    trend: 'up' | 'down';
  };
}

const TONE_COLORS = {
  neutral: 'var(--text-primary)',
  info: 'var(--status-info)',
  warning: 'var(--status-warning)',
  danger: 'var(--status-danger)',
  success: 'var(--status-success)',
};

export function StatCard({ title, value, icon: Icon, tone = 'neutral', delta }: StatCardProps) {
  return (
    <div 
      className="p-4 rounded-lg border"
      style={{
        backgroundColor: 'var(--surface-alt)',
        borderColor: 'var(--border-subtle)',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p style={{ 
          fontSize: 'var(--font-size-xs)', 
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {title}
        </p>
        {Icon && (
          <div 
            className="p-2 rounded-lg"
            style={{
              backgroundColor: tone === 'neutral' ? 'var(--surface-subtle-tint)' : `${TONE_COLORS[tone]}15`,
              color: TONE_COLORS[tone]
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <p style={{ 
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          color: TONE_COLORS[tone]
        }}>
          {value}
        </p>
      </div>
      
      {delta && (
        <div className="flex items-center gap-1">
          {delta.trend === 'up' ? (
            <TrendingUp size={14} style={{ color: 'var(--status-success)' }} />
          ) : (
            <TrendingDown size={14} style={{ color: 'var(--status-danger)' }} />
          )}
          <span style={{ 
            fontSize: 'var(--font-size-xs)',
            color: delta.trend === 'up' ? 'var(--status-success)' : 'var(--status-danger)'
          }}>
            {delta.value > 0 ? '+' : ''}{delta.value}%
          </span>
        </div>
      )}
    </div>
  );
}
