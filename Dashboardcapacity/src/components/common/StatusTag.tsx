interface StatusTagProps {
  domain: 'run' | 'work' | 'exception';
  value: string;
  severity?: 'low' | 'med' | 'high';
}

const STATUS_CONFIG = {
  // Run domain
  DRAFT: { bg: 'var(--text-muted)', text: 'var(--text-inverse)' },
  APPROVED: { bg: 'var(--status-info)', text: 'var(--text-inverse)' },
  RUNNING: { bg: 'var(--status-info)', text: 'var(--text-inverse)' },
  DONE: { bg: 'var(--status-success)', text: 'var(--text-inverse)' },
  FAILED: { bg: 'var(--status-danger)', text: 'var(--text-inverse)' },
  
  // Exception domain
  OPEN: { bg: 'var(--status-warning)', text: 'var(--text-inverse)' },
  IN_PROGRESS: { bg: 'var(--status-info)', text: 'var(--text-inverse)' },
  RESOLVED: { bg: 'var(--status-success)', text: 'var(--text-inverse)' },
  
  // Severity
  LOW: { bg: '#dcfce7', text: 'var(--status-success)' },
  MED: { bg: '#fef3c7', text: '#d97706' },
  HIGH: { bg: '#fee2e2', text: 'var(--status-danger)' },
};

export function StatusTag({ domain, value, severity }: StatusTagProps) {
  const key = severity ? severity.toUpperCase() : value.toUpperCase().replace(/ /g, '_');
  const config = STATUS_CONFIG[key as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
  
  return (
    <span 
      className="inline-flex items-center justify-center px-3 py-1 rounded-full"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        fontSize: 'var(--font-size-xs)',
        fontWeight: 'var(--font-weight-medium)',
        height: '24px',
        borderRadius: 'var(--radius-pill)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}
    >
      {value.replace(/_/g, ' ')}
    </span>
  );
}
