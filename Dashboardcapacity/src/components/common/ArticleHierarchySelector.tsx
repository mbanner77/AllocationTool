import { useState } from 'react';
import { X, Check, ChevronRight, ChevronDown } from 'lucide-react';

interface HierarchyNode {
  id: string;
  label: string;
  level: string;
  children?: HierarchyNode[];
}

interface ArticleHierarchySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNodes: string[];
  onConfirm: (selected: string[]) => void;
  title?: string;
  description?: string;
}

// BLICK Retail Article Hierarchy
export const ARTICLE_HIERARCHY: HierarchyNode[] = [
  {
    id: 'blick-retail',
    label: 'BLICK Retail',
    level: 'company',
    children: [
      {
        id: 'division-bekleidung',
        label: 'Einkaufsbereich Bekleidung',
        level: 'division',
        children: [
          {
            id: 'category-schuhe',
            label: 'Warengruppe Schuhe',
            level: 'category',
            children: [
              { id: 'pg-running-shoes', label: 'Running Shoes', level: 'productGroup' },
              { id: 'pg-casual-sneakers', label: 'Casual Sneakers', level: 'productGroup' },
              { id: 'pg-boots', label: 'Boots', level: 'productGroup' }
            ]
          },
          {
            id: 'category-oberbekleidung',
            label: 'Warengruppe Oberbekleidung',
            level: 'category',
            children: [
              { id: 'pg-outdoor-jackets', label: 'Outdoor Jackets', level: 'productGroup' },
              { id: 'pg-blazers', label: 'Blazers', level: 'productGroup' },
              { id: 'pg-coats', label: 'Coats', level: 'productGroup' }
            ]
          },
          {
            id: 'category-hosen',
            label: 'Warengruppe Hosen',
            level: 'category',
            children: [
              { id: 'pg-jeans', label: 'Jeans', level: 'productGroup' },
              { id: 'pg-chinos', label: 'Chinos', level: 'productGroup' },
              { id: 'pg-sports-pants', label: 'Sports Pants', level: 'productGroup' }
            ]
          }
        ]
      },
      {
        id: 'division-sport',
        label: 'Einkaufsbereich Sport',
        level: 'division',
        children: [
          {
            id: 'category-outdoor',
            label: 'Warengruppe Outdoor',
            level: 'category',
            children: [
              { id: 'pg-trekking', label: 'Trekking Equipment', level: 'productGroup' },
              { id: 'pg-camping', label: 'Camping', level: 'productGroup' }
            ]
          },
          {
            id: 'category-fitness',
            label: 'Warengruppe Fitness',
            level: 'category',
            children: [
              { id: 'pg-gym-equipment', label: 'Gym Equipment', level: 'productGroup' },
              { id: 'pg-yoga', label: 'Yoga', level: 'productGroup' }
            ]
          }
        ]
      },
      {
        id: 'division-accessories',
        label: 'Einkaufsbereich Accessories',
        level: 'division',
        children: [
          {
            id: 'category-bags',
            label: 'Warengruppe Taschen',
            level: 'category',
            children: [
              { id: 'pg-backpacks', label: 'Backpacks', level: 'productGroup' },
              { id: 'pg-handbags', label: 'Handbags', level: 'productGroup' }
            ]
          }
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

  // Determine level badge color
  const getLevelColor = (levelType: string) => {
    switch (levelType) {
      case 'company': return 'var(--text-muted)';
      case 'division': return 'var(--status-info)';
      case 'category': return 'var(--status-warning)';
      case 'productGroup': return 'var(--status-success)';
      default: return 'var(--text-secondary)';
    }
  };

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

        {/* Level Badge */}
        <span
          className="px-2 py-0.5 rounded text-xs"
          style={{
            backgroundColor: `${getLevelColor(node.level)}15`,
            color: getLevelColor(node.level),
            fontSize: 'var(--font-size-xs)'
          }}
        >
          {node.level === 'company' && 'Unternehmen'}
          {node.level === 'division' && 'Einkaufsbereich'}
          {node.level === 'category' && 'Warengruppe'}
          {node.level === 'productGroup' && 'Produktgruppe'}
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

export function ArticleHierarchySelector({
  isOpen,
  onClose,
  selectedNodes: initialSelectedNodes,
  onConfirm,
  title = 'Artikelhierarchie auswählen',
  description = 'Wählen Sie die relevanten Artikelhierarchieebenen aus'
}: ArticleHierarchySelectorProps) {
  // Convert initial selectedNodes array to a map of id -> label
  const [selectedIds, setSelectedIds] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    initialSelectedNodes.forEach(nodeId => {
      // Try to find the node in the hierarchy
      const findNode = (nodes: HierarchyNode[]): HierarchyNode | null => {
        for (const node of nodes) {
          if (node.id === nodeId) return node;
          if (node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const node = findNode(ARTICLE_HIERARCHY);
      if (node) {
        map.set(node.id, node.label);
      }
    });
    return map;
  });

  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(['blick-retail', 'division-bekleidung', 'division-sport', 'division-accessories'])
  );

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
    onConfirm(Array.from(selectedIds.keys()));
    onClose();
  };

  const handleClearAll = () => {
    setSelectedIds(new Map());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
        style={{ boxShadow: 'var(--shadow-lg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="p-6 border-b flex items-start justify-between"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--space-1)'
              }}
            >
              {title}
            </h2>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              {description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-tint rounded"
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {/* Selected Count & Clear */}
        <div
          className="px-6 py-3 border-b flex items-center justify-between"
          style={{ 
            borderColor: 'var(--border-default)',
            backgroundColor: 'var(--surface-subtle-tint)'
          }}
        >
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            {selectedIds.size === 0 ? (
              'Keine Auswahl'
            ) : (
              <>
                <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>
                  {selectedIds.size}
                </span>
                {' '}
                {selectedIds.size === 1 ? 'Ebene' : 'Ebenen'} ausgewählt
              </>
            )}
          </div>
          {selectedIds.size > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1 rounded text-sm hover:bg-surface-tint"
              style={{ 
                color: 'var(--text-secondary)',
                fontSize: 'var(--font-size-sm)'
              }}
            >
              Alle abwählen
            </button>
          )}
        </div>

        {/* Tree Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {ARTICLE_HIERARCHY.map(node => (
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

        {/* Selected Items Preview */}
        {selectedIds.size > 0 && (
          <div
            className="px-6 py-3 border-t"
            style={{ borderColor: 'var(--border-default)' }}
          >
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
              Ausgewählte Ebenen:
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(selectedIds.entries()).map(([id, label]) => (
                <div
                  key={id}
                  className="px-3 py-1 rounded-full flex items-center gap-2"
                  style={{
                    backgroundColor: 'var(--surface-info-subtle)',
                    color: 'var(--text-primary)',
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  <span>{label}</span>
                  <button
                    onClick={() => handleToggleSelect(id, label)}
                    className="hover:bg-surface-tint rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          className="p-6 border-t flex items-center justify-end gap-3"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border"
            style={{
              backgroundColor: 'var(--button-secondary-bg)',
              borderColor: 'var(--button-secondary-border)',
              color: 'var(--button-secondary-text)',
              height: 'var(--height-button-md)'
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--button-primary-bg)',
              color: 'var(--button-primary-text)',
              height: 'var(--height-button-md)'
            }}
          >
            Auswahl übernehmen ({selectedIds.size})
          </button>
        </div>
      </div>
    </div>
  );
}
