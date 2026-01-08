import { useState } from 'react';
import { AlertTriangle, Trash2, Info, HelpCircle, CheckCircle, XCircle } from 'lucide-react';

type DialogType = 'confirm' | 'danger' | 'info' | 'warning' | 'success';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  loading?: boolean;
}

const DIALOG_CONFIG = {
  confirm: {
    icon: HelpCircle,
    color: 'var(--brand-primary)',
    bgColor: 'var(--brand-primary-light)',
  },
  danger: {
    icon: Trash2,
    color: 'var(--status-danger)',
    bgColor: 'var(--status-danger-light)',
  },
  warning: {
    icon: AlertTriangle,
    color: 'var(--status-warning)',
    bgColor: 'var(--status-warning-light)',
  },
  info: {
    icon: Info,
    color: 'var(--status-info)',
    bgColor: 'var(--status-info-light)',
  },
  success: {
    icon: CheckCircle,
    color: 'var(--status-success)',
    bgColor: 'var(--status-success-light)',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'confirm',
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  showCancel = true,
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const config = DIALOG_CONFIG[type];
  const Icon = config.icon;

  const handleConfirm = () => {
    onConfirm();
    if (!loading) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Icon */}
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div 
              className="p-3 rounded-full flex-shrink-0"
              style={{ background: config.bgColor }}
            >
              <Icon size={24} style={{ color: config.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 
                className="text-lg mb-1"
                style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}
              >
                {title}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                {message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div 
          className="flex gap-3 p-4 pt-0"
          style={{ justifyContent: showCancel ? 'flex-end' : 'center' }}
        >
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg transition-colors"
              style={{ 
                border: '1px solid var(--border-default)',
                background: 'var(--surface-page)',
                color: 'var(--text-primary)'
              }}
              disabled={loading}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            style={{ 
              background: type === 'danger' ? 'var(--status-danger)' : 'var(--brand-primary)',
              color: 'white'
            }}
            disabled={loading}
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easier usage
interface UseConfirmDialogReturn {
  isOpen: boolean;
  dialogProps: ConfirmDialogProps;
  confirm: (options: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'> & { onConfirm?: () => void }) => Promise<boolean>;
  close: () => void;
}

export function useConfirmDialog(): UseConfirmDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);
  const [options, setOptions] = useState<Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>>({
    title: '',
    message: '',
  });
  const [customOnConfirm, setCustomOnConfirm] = useState<(() => void) | null>(null);

  const confirm = (opts: Omit<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'> & { onConfirm?: () => void }): Promise<boolean> => {
    const { onConfirm, ...rest } = opts;
    setOptions(rest);
    setCustomOnConfirm(onConfirm ? () => onConfirm : null);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolveRef(() => resolve);
    });
  };

  const close = () => {
    setIsOpen(false);
    resolveRef?.(false);
  };

  const handleConfirm = () => {
    customOnConfirm?.();
    resolveRef?.(true);
    setIsOpen(false);
  };

  return {
    isOpen,
    dialogProps: {
      ...options,
      isOpen,
      onClose: close,
      onConfirm: handleConfirm,
    },
    confirm,
    close,
  };
}

// Input Dialog for prompts
interface InputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  inputType?: 'text' | 'textarea';
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}

export function InputDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  inputType = 'text',
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen',
  required = false,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (required && !value.trim()) return;
    onConfirm(value);
    setValue('');
    onClose();
  };

  const handleClose = () => {
    setValue('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 
            className="text-lg mb-2"
            style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}
          >
            {title}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-4)' }}>
            {message}
          </p>
          
          {inputType === 'textarea' ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-lg"
              style={{ 
                border: '1px solid var(--border-default)', 
                background: 'var(--surface-page)',
                minHeight: '100px'
              }}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-lg"
              style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)' }}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            />
          )}
        </div>

        <div className="flex gap-3 p-4 pt-0 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg"
            style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)' }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg"
            style={{ 
              background: 'var(--brand-primary)', 
              color: 'white',
              opacity: required && !value.trim() ? 0.5 : 1
            }}
            disabled={required && !value.trim()}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Export Dialog for data export
interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'json', options: ExportOptions) => void;
  title?: string;
  data?: any[];
  filename?: string;
}

interface ExportOptions {
  includeHeaders: boolean;
  selectedColumns?: string[];
  dateFormat?: string;
}

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  title = 'Daten exportieren',
  filename = 'export',
}: ExportDialogProps) {
  const [format, setFormat] = useState<'csv' | 'excel' | 'json'>('csv');
  const [includeHeaders, setIncludeHeaders] = useState(true);

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(format, { includeHeaders });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 
            className="text-lg mb-4"
            style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)' }}
          >
            {title}
          </h3>
          
          {/* Format Selection */}
          <div className="mb-4">
            <label className="block text-sm mb-2" style={{ fontWeight: 'var(--font-weight-medium)' }}>
              Export-Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['csv', 'excel', 'json'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className="px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    border: `2px solid ${format === f ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                    background: format === f ? 'var(--brand-primary-light)' : 'var(--surface-page)',
                    fontWeight: format === f ? 'var(--font-weight-medium)' : 'normal'
                  }}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Options */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeHeaders}
                onChange={(e) => setIncludeHeaders(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Spaltenüberschriften einschließen</span>
            </label>
          </div>

          {/* Filename Preview */}
          <div className="p-3 rounded-lg mb-4" style={{ background: 'var(--surface-page)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Dateiname: </span>
            <span className="text-sm font-mono">{filename}.{format === 'excel' ? 'xlsx' : format}</span>
          </div>
        </div>

        <div className="flex gap-3 p-4 pt-0 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg"
            style={{ border: '1px solid var(--border-default)', background: 'var(--surface-page)' }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg flex items-center gap-2"
            style={{ background: 'var(--brand-primary)', color: 'white' }}
          >
            Exportieren
          </button>
        </div>
      </div>
    </div>
  );
}
