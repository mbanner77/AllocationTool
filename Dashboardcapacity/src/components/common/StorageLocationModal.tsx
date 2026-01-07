import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface StorageLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  distributionCenterName: string;
  availableLocations: string[];
  selectedLocations: string[];
  onConfirm: (selected: string[]) => void;
}

export function StorageLocationModal({
  isOpen,
  onClose,
  distributionCenterName,
  availableLocations,
  selectedLocations: initialSelected,
  onConfirm
}: StorageLocationModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelected);

  if (!isOpen) return null;

  const handleToggleSelection = (location: string) => {
    setSelectedItems(prev => {
      const isSelected = prev.includes(location);
      if (isSelected) {
        return prev.filter(item => item !== location);
      } else {
        return [...prev, location];
      }
    });
  };

  const isSelected = (location: string) => {
    return selectedItems.includes(location);
  };

  const handleConfirm = () => {
    onConfirm(selectedItems);
    onClose();
  };

  const handleCancel = () => {
    setSelectedItems(initialSelected);
    onClose();
  };

  const handleSelectAll = () => {
    setSelectedItems(availableLocations);
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl"
        style={{ 
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-start justify-between">
            <div>
              <h3
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--space-1)'
                }}
              >
                Lagerorte auswählen
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                {distributionCenterName}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-surface-tint rounded"
            >
              <X size={20} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        </div>

        {/* Selection controls */}
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-default)' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {selectedItems.length} von {availableLocations.length} ausgewählt
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="px-3 py-1.5 rounded-lg border text-sm"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--button-secondary-border)',
                color: 'var(--button-secondary-text)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              Alle auswählen
            </button>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg border text-sm"
              style={{
                backgroundColor: 'var(--button-secondary-bg)',
                borderColor: 'var(--button-secondary-border)',
                color: 'var(--button-secondary-text)',
                fontSize: 'var(--font-size-xs)'
              }}
            >
              Keine auswählen
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3">
            {availableLocations.map((location) => {
              const selected = isSelected(location);
              return (
                <button
                  key={location}
                  onClick={() => handleToggleSelection(location)}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:border-brand-primary transition-colors"
                  style={{
                    backgroundColor: selected ? 'var(--surface-info-subtle)' : 'var(--surface-page)',
                    borderColor: selected ? 'var(--brand-primary)' : 'var(--border-default)',
                    textAlign: 'left'
                  }}
                >
                  <div
                    className="flex items-center justify-center w-5 h-5 rounded border flex-shrink-0"
                    style={{
                      borderColor: selected ? 'var(--brand-primary)' : 'var(--border-default)',
                      backgroundColor: selected ? 'var(--brand-primary)' : 'transparent'
                    }}
                  >
                    {selected && (
                      <Check size={14} style={{ color: 'var(--text-inverse)' }} />
                    )}
                  </div>
                  <span style={{ 
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: selected ? 'var(--font-weight-medium)' : 'var(--font-weight-regular)'
                  }}>
                    {location}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--border-default)' }}>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              borderColor: 'var(--button-secondary-border)',
              color: 'var(--button-secondary-text)'
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--brand-primary)',
              color: 'var(--text-inverse)'
            }}
          >
            Übernehmen ({selectedItems.length})
          </button>
        </div>
      </div>
    </div>
  );
}