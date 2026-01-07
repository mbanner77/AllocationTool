import { useState } from 'react';
import { X, Check, ChevronRight, ChevronDown } from 'lucide-react';

interface HierarchyNode {
  id: string;
  label: string;
  children?: HierarchyNode[];
}

interface ResponsibilityAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAreas: string[];
  onConfirm: (selected: string[]) => void;
}

// Mock product hierarchy structure
const PRODUCT_HIERARCHY: HierarchyNode[] = [
  {
    id: 'fashion',
    label: 'Fashion',
    children: [
      {
        id: 'fashion-apparel',
        label: 'Apparel',
        children: [
          { id: 'fashion-apparel-tops', label: 'Tops' },
          { id: 'fashion-apparel-bottoms', label: 'Bottoms' },
          { id: 'fashion-apparel-dresses', label: 'Dresses' }
        ]
      },
      {
        id: 'fashion-shoes',
        label: 'Shoes',
        children: [
          { id: 'fashion-shoes-sneakers', label: 'Sneakers' },
          { id: 'fashion-shoes-boots', label: 'Boots' },
          { id: 'fashion-shoes-sandals', label: 'Sandals' }
        ]
      },
      {
        id: 'fashion-accessories',
        label: 'Accessories',
        children: [
          { id: 'fashion-accessories-bags', label: 'Bags' },
          { id: 'fashion-accessories-belts', label: 'Belts' },
          { id: 'fashion-accessories-jewelry', label: 'Jewelry' }
        ]
      }
    ]
  },
  {
    id: 'electronics',
    label: 'Electronics',
    children: [
      {
        id: 'electronics-computers',
        label: 'Computers',
        children: [
          { id: 'electronics-computers-laptops', label: 'Laptops' },
          { id: 'electronics-computers-desktops', label: 'Desktops' },
          { id: 'electronics-computers-tablets', label: 'Tablets' }
        ]
      },
      {
        id: 'electronics-phones',
        label: 'Phones',
        children: [
          { id: 'electronics-phones-smartphones', label: 'Smartphones' },
          { id: 'electronics-phones-accessories', label: 'Accessories' }
        ]
      },
      {
        id: 'electronics-audio',
        label: 'Audio',
        children: [
          { id: 'electronics-audio-headphones', label: 'Headphones' },
          { id: 'electronics-audio-speakers', label: 'Speakers' }
        ]
      }
    ]
  },
  {
    id: 'home',
    label: 'Home & Living',
    children: [
      {
        id: 'home-furniture',
        label: 'Furniture',
        children: [
          { id: 'home-furniture-seating', label: 'Seating' },
          { id: 'home-furniture-tables', label: 'Tables' },
          { id: 'home-furniture-storage', label: 'Storage' }
        ]
      },
      {
        id: 'home-decor',
        label: 'Decor',
        children: [
          { id: 'home-decor-lighting', label: 'Lighting' },
          { id: 'home-decor-textiles', label: 'Textiles' },
          { id: 'home-decor-wall-art', label: 'Wall Art' }
        ]
      }
    ]
  }
];

function TreeNode({ 
  node, 
  level = 0, 
  selectedIds, 
  expandedIds, 
  onToggleExpand, 
  onToggleSelect 
}: { 
  node: HierarchyNode; 
  level?: number; 
  selectedIds: Set<string>;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (id: string, label: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedIds.has(node.id);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-surface-tint rounded transition-colors"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {/* Expand/Collapse button */}
        <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(node.id);
              }}
              className="p-0.5 hover:bg-surface-subtle-tint rounded"
            >
              {isExpanded ? (
                <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
              ) : (
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              )}
            </button>
          ) : null}
        </div>

        {/* Checkbox */}
        <div
          onClick={() => onToggleSelect(node.id, node.label)}
          className="flex items-center justify-center w-5 h-5 rounded border"
          style={{
            borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-default)',
            backgroundColor: isSelected ? 'var(--brand-primary)' : 'transparent'
          }}
        >
          {isSelected && (
            <Check size={14} style={{ color: 'var(--text-inverse)' }} />
          )}
        </div>

        {/* Label */}
        <span
          onClick={() => onToggleSelect(node.id, node.label)}
          style={{ 
            fontSize: 'var(--font-size-sm)',
            fontWeight: level === 0 ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
            flex: 1
          }}
        >
          {node.label}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ResponsibilityAreaModal({
  isOpen,
  onClose,
  selectedAreas: initialSelectedAreas,
  onConfirm
}: ResponsibilityAreaModalProps) {
  // Convert initial selectedAreas array to a map of id -> label
  const [selectedIds, setSelectedIds] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    initialSelectedAreas.forEach(area => {
      // Try to find the node in the hierarchy
      const findNode = (nodes: HierarchyNode[]): HierarchyNode | null => {
        for (const node of nodes) {
          if (node.label === area) return node;
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const node = findNode(PRODUCT_HIERARCHY);
      if (node) {
        map.set(node.id, node.label);
      }
    });
    return map;
  });

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['fashion', 'electronics', 'home']));

  if (!isOpen) return null;

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelect = (id: string, label: string) => {
    setSelectedIds(prev => {
      const next = new Map(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, label);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedLabels = Array.from(selectedIds.values());
    onConfirm(selectedLabels);
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial state
    const map = new Map<string, string>();
    initialSelectedAreas.forEach(area => {
      const findNode = (nodes: HierarchyNode[]): HierarchyNode | null => {
        for (const node of nodes) {
          if (node.label === area) return node;
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const node = findNode(PRODUCT_HIERARCHY);
      if (node) {
        map.set(node.id, node.label);
      }
    });
    setSelectedIds(map);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl"
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
                Verantwortungsbereich festlegen
              </h3>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                Wählen Sie die relevanten Artikelhierarchieebenen aus
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

        {/* Selected count */}
        <div className="px-6 py-3 border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-alt)' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {selectedIds.size} {selectedIds.size === 1 ? 'Bereich' : 'Bereiche'} ausgewählt
          </div>
        </div>

        {/* Tree */}
        <div className="flex-1 overflow-y-auto p-4">
          {PRODUCT_HIERARCHY.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              selectedIds={new Set(selectedIds.keys())}
              expandedIds={expandedIds}
              onToggleExpand={handleToggleExpand}
              onToggleSelect={handleToggleSelect}
            />
          ))}
        </div>

        {/* Selected areas preview */}
        {selectedIds.size > 0 && (
          <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-subtle-tint)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Ausgewählte Bereiche:
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedIds.values()).map((label, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 rounded"
                  style={{
                    backgroundColor: 'var(--surface-info-subtle)',
                    color: 'var(--text-info)',
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}

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
            Übernehmen ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}
