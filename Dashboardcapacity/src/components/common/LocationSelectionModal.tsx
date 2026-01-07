import { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';

interface LocationSelectionModalProps<T extends { id: string; name: string; address: string }> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  availableLocations: T[];
  selectedLocations: T[];
  onConfirm: (selected: T[]) => void;
  multiSelect?: boolean;
}

export function LocationSelectionModal<T extends { id: string; name: string; address: string }>({
  isOpen,
  onClose,
  title,
  availableLocations,
  selectedLocations: initialSelected,
  onConfirm,
  multiSelect = true
}: LocationSelectionModalProps<T>) {
  const [searchId, setSearchId] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchAddress, setSearchAddress] = useState('');
  const [selectedItems, setSelectedItems] = useState<T[]>(initialSelected);

  // Filter locations based on search criteria
  const filteredLocations = useMemo(() => {
    return availableLocations.filter(loc => {
      const matchesId = searchId === '' || loc.id.toLowerCase().includes(searchId.toLowerCase());
      const matchesName = searchName === '' || loc.name.toLowerCase().includes(searchName.toLowerCase());
      const matchesAddress = searchAddress === '' || loc.address.toLowerCase().includes(searchAddress.toLowerCase());
      return matchesId && matchesName && matchesAddress;
    });
  }, [availableLocations, searchId, searchName, searchAddress]);

  if (!isOpen) return null;

  const handleToggleSelection = (location: T) => {
    if (multiSelect) {
      setSelectedItems(prev => {
        const isSelected = prev.some(item => item.id === location.id);
        if (isSelected) {
          return prev.filter(item => item.id !== location.id);
        } else {
          return [...prev, location];
        }
      });
    } else {
      setSelectedItems([location]);
    }
  };

  const isSelected = (location: T) => {
    return selectedItems.some(item => item.id === location.id);
  };

  const handleConfirm = () => {
    onConfirm(selectedItems);
    onClose();
  };

  const handleCancel = () => {
    setSelectedItems(initialSelected);
    setSearchId('');
    setSearchName('');
    setSearchAddress('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-4xl"
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
                {title}
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                {multiSelect 
                  ? 'Wählen Sie eine oder mehrere Lokationen aus'
                  : 'Wählen Sie eine Lokation aus'}
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

        {/* Filters */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="search-id"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                ID
              </label>
              <div className="relative">
                <Search 
                  size={16} 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  id="search-id"
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Suchen..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg border"
                  style={{
                    borderColor: 'var(--border-default)',
                    backgroundColor: 'var(--surface-page)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="search-name"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Name
              </label>
              <div className="relative">
                <Search 
                  size={16} 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  id="search-name"
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Suchen..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg border"
                  style={{
                    borderColor: 'var(--border-default)',
                    backgroundColor: 'var(--surface-page)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="search-address"
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: '6px',
                  color: 'var(--text-muted)'
                }}
              >
                Adresse
              </label>
              <div className="relative">
                <Search 
                  size={16} 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}
                />
                <input
                  id="search-address"
                  type="text"
                  value={searchAddress}
                  onChange={(e) => setSearchAddress(e.target.value)}
                  placeholder="Suchen..."
                  className="w-full pl-10 pr-3 py-2 rounded-lg border"
                  style={{
                    borderColor: 'var(--border-default)',
                    backgroundColor: 'var(--surface-page)',
                    fontSize: 'var(--font-size-sm)'
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-3" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {filteredLocations.length} {filteredLocations.length === 1 ? 'Eintrag' : 'Einträge'} gefunden
            {selectedItems.length > 0 && ` • ${selectedItems.length} ausgewählt`}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface-alt)', zIndex: 1 }}>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px 16px', 
                  fontSize: 'var(--font-size-xs)', 
                  fontWeight: 'var(--font-weight-semibold)', 
                  color: 'var(--text-muted)',
                  width: '50px'
                }}>
                  {/* Checkbox column */}
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px 16px', 
                  fontSize: 'var(--font-size-xs)', 
                  fontWeight: 'var(--font-weight-semibold)', 
                  color: 'var(--text-muted)' 
                }}>
                  ID
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px 16px', 
                  fontSize: 'var(--font-size-xs)', 
                  fontWeight: 'var(--font-weight-semibold)', 
                  color: 'var(--text-muted)' 
                }}>
                  Name
                </th>
                <th style={{ 
                  textAlign: 'left', 
                  padding: '12px 16px', 
                  fontSize: 'var(--font-size-xs)', 
                  fontWeight: 'var(--font-weight-semibold)', 
                  color: 'var(--text-muted)' 
                }}>
                  Adresse
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLocations.map((location, idx) => {
                const selected = isSelected(location);
                return (
                  <tr
                    key={location.id}
                    onClick={() => handleToggleSelection(location)}
                    className="cursor-pointer hover:bg-surface-tint transition-colors"
                    style={{
                      borderBottom: idx < filteredLocations.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      backgroundColor: selected ? 'var(--surface-info-subtle)' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div
                        className="flex items-center justify-center w-5 h-5 rounded border"
                        style={{
                          borderColor: selected ? 'var(--brand-primary)' : 'var(--border-default)',
                          backgroundColor: selected ? 'var(--brand-primary)' : 'transparent'
                        }}
                      >
                        {selected && (
                          <Check size={14} style={{ color: 'var(--text-inverse)' }} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <code
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          fontFamily: 'var(--font-family-mono)',
                          backgroundColor: 'var(--surface-code-block)',
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)'
                        }}
                      >
                        {location.id}
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 'var(--font-weight-medium)' }}>
                      {location.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {location.address}
                    </td>
                  </tr>
                );
              })}
              {filteredLocations.length === 0 && (
                <tr>
                  <td 
                    colSpan={4} 
                    style={{ 
                      padding: '40px 16px', 
                      textAlign: 'center', 
                      color: 'var(--text-muted)',
                      fontSize: 'var(--font-size-sm)'
                    }}
                  >
                    Keine Einträge gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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