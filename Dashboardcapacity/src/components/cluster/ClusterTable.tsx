import { useState } from 'react';
import { ChevronDown, ChevronRight, GripVertical, Trash2, Plus } from 'lucide-react';
import { useLanguage } from '../../i18n';

interface StoreInCluster {
  id: string;
  name: string;
  description: string;
  address: string;
  country: string;
  size: number;
}

interface Cluster {
  id: string;
  name: string;
  stores: StoreInCluster[];
  color: string;
  isExpanded: boolean;
  isSystemGenerated?: boolean;
}

interface ClusterTableProps {
  onAddCluster: () => void;
}

const MOCK_STORES: StoreInCluster[] = [
  { id: 'ZH-001', name: 'Zürich HB', description: 'Hauptbahnhof', address: 'Bahnhofstrasse 1, 8001 Zürich', country: 'Schweiz', size: 850 },
  { id: 'BS-001', name: 'Basel SBB', description: 'Bahnhof', address: 'Centralbahnplatz 1, 4051 Basel', country: 'Schweiz', size: 720 },
  { id: 'BE-001', name: 'Bern Westside', description: 'Shopping-Center', address: 'Riedbachstrasse 100, 3027 Bern', country: 'Schweiz', size: 650 },
  { id: 'GE-001', name: 'Genève Cornavin', description: 'Bahnhof', address: 'Place de Cornavin, 1201 Genève', country: 'Schweiz', size: 780 },
  { id: 'LU-001', name: 'Luzern Bahnhof', description: 'Bahnhof', address: 'Bahnhofplatz 1, 6003 Luzern', country: 'Schweiz', size: 580 },
  { id: 'SG-001', name: 'St. Gallen', description: 'Innenstadt', address: 'Multergasse 25, 9000 St. Gallen', country: 'Schweiz', size: 620 },
  { id: 'WI-001', name: 'Winterthur', description: 'Altstadt', address: 'Marktgasse 68, 8400 Winterthur', country: 'Schweiz', size: 540 },
];

export function ClusterTable({ onAddCluster }: ClusterTableProps) {
  const { t } = useLanguage();
  const [clusters, setClusters] = useState<Cluster[]>([
    {
      id: 'cluster-1',
      name: 'Cluster A - Großstädte',
      stores: [MOCK_STORES[0], MOCK_STORES[1], MOCK_STORES[3]],
      color: '#2563eb',
      isExpanded: true
    },
    {
      id: 'cluster-2',
      name: 'Cluster B - Mittelstädte',
      stores: [MOCK_STORES[2], MOCK_STORES[4]],
      color: '#10b981',
      isExpanded: true
    },
    {
      id: 'cluster-3',
      name: 'Cluster C - Kleinstädte',
      stores: [MOCK_STORES[5], MOCK_STORES[6]],
      color: '#f59e0b',
      isExpanded: true
    },
    {
      id: 'unassigned',
      name: t.clusterScreen.unassigned,
      stores: [],
      color: '#6b7280',
      isExpanded: true
    }
  ]);

  const [draggedStore, setDraggedStore] = useState<{ store: StoreInCluster; sourceClusterId: string } | null>(null);
  const [dragOverClusterId, setDragOverClusterId] = useState<string | null>(null);

  const toggleCluster = (clusterId: string) => {
    setClusters(prev => prev.map(c =>
      c.id === clusterId ? { ...c, isExpanded: !c.isExpanded } : c
    ));
  };

  const handleDragStart = (store: StoreInCluster, sourceClusterId: string) => {
    setDraggedStore({ store, sourceClusterId });
  };

  const handleDragEnd = () => {
    setDraggedStore(null);
    setDragOverClusterId(null);
  };

  const handleDragOver = (e: React.DragEvent, targetClusterId: string) => {
    e.preventDefault();
    setDragOverClusterId(targetClusterId);
  };

  const handleDragLeave = () => {
    setDragOverClusterId(null);
  };

  const handleDrop = (e: React.DragEvent, targetClusterId: string) => {
    e.preventDefault();
    if (!draggedStore) return;

    const { store, sourceClusterId } = draggedStore;
    
    if (sourceClusterId === targetClusterId) {
      setDraggedStore(null);
      setDragOverClusterId(null);
      return;
    }

    setClusters(prev => {
      // Remove from source
      const updatedClusters = prev.map(c => {
        if (c.id === sourceClusterId) {
          return { ...c, stores: c.stores.filter(s => s.id !== store.id) };
        }
        return c;
      });

      // Add to target
      return updatedClusters.map(c => {
        if (c.id === targetClusterId) {
          return { ...c, stores: [...c.stores, store] };
        }
        return c;
      });
    });

    setDraggedStore(null);
    setDragOverClusterId(null);
  };

  const deleteCluster = (clusterId: string) => {
    if (clusterId === 'unassigned') return;
    
    setClusters(prev => {
      const clusterToDelete = prev.find(c => c.id === clusterId);
      if (!clusterToDelete) return prev;

      // Move stores to unassigned
      const unassignedCluster = prev.find(c => c.id === 'unassigned');
      if (!unassignedCluster) return prev;

      return prev
        .filter(c => c.id !== clusterId)
        .map(c => c.id === 'unassigned' ? { ...c, stores: [...c.stores, ...clusterToDelete.stores] } : c);
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Add Cluster Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 'var(--font-weight-medium)' }}>
          {t.clusterScreen.clusterAssignment}
        </h3>
        <button
          onClick={onAddCluster}
          className="px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-colors"
          style={{
            backgroundColor: 'var(--brand-primary)',
            color: 'var(--text-inverse)',
            borderColor: 'var(--brand-primary)',
            fontSize: 'var(--font-size-sm)'
          }}
        >
          <Plus size={14} />
          {t.clusterScreen.newCluster}
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto rounded-lg border" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--surface-page)' }}>
        <table className="w-full">
          <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--surface-alt)', zIndex: 10 }}>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', width: '40px' }}></th>
              <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', width: '250px' }}>{t.clusterScreen.clusters} / {t.clusterScreen.stores}</th>
              <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{t.clusterScreen.description}</th>
              <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{t.clusterScreen.address}</th>
              <th className="text-left p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{t.clusterScreen.country}</th>
              <th className="text-right p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{t.clusterScreen.size}</th>
              <th className="text-right p-3" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {clusters.map(cluster => (
              <ClusterRow
                key={cluster.id}
                cluster={cluster}
                isExpanded={cluster.isExpanded}
                isDragOver={dragOverClusterId === cluster.id}
                onToggle={() => toggleCluster(cluster.id)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDelete={() => deleteCluster(cluster.id)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface ClusterRowProps {
  cluster: Cluster;
  isExpanded: boolean;
  isDragOver: boolean;
  onToggle: () => void;
  onDragStart: (store: StoreInCluster, sourceClusterId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, targetClusterId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetClusterId: string) => void;
  onDelete: () => void;
}

function ClusterRow({
  cluster,
  isExpanded,
  isDragOver,
  onToggle,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  onDelete
}: ClusterRowProps) {
  return (
    <>
      {/* Cluster Header Row */}
      <tr
        onDragOver={(e) => onDragOver(e, cluster.id)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, cluster.id)}
        style={{
          backgroundColor: isDragOver ? `${cluster.color}20` : `${cluster.color}15`,
          borderLeft: `4px solid ${cluster.color}`,
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <td className="p-3">
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-black/5 transition-colors"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td className="p-3" colSpan={5}>
          <div className="flex items-center gap-3">
            <span style={{ 
              fontSize: 'var(--font-size-sm)', 
              fontWeight: 'var(--font-weight-medium)',
              color: cluster.color
            }}>
              {cluster.name}
            </span>
            <span 
              className="px-2 py-0.5 rounded" 
              style={{ 
                backgroundColor: `${cluster.color}25`, 
                color: cluster.color,
                fontSize: 'var(--font-size-xs)'
              }}
            >
              {cluster.stores.length} {cluster.stores.length === 1 ? 'Filiale' : 'Filialen'}
            </span>
          </div>
        </td>
        <td className="p-3 text-right">
          {cluster.id !== 'unassigned' && (
            <button
              onClick={onDelete}
              className="p-1 rounded opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--status-danger)' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </td>
      </tr>

      {/* Store Rows */}
      {isExpanded && cluster.stores.map(store => (
        <tr
          key={store.id}
          draggable
          onDragStart={() => onDragStart(store, cluster.id)}
          onDragEnd={onDragEnd}
          className="group cursor-move hover:bg-black/5"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <td className="p-3"></td>
          <td className="p-3">
            <div className="flex items-center gap-2">
              <GripVertical size={14} style={{ color: 'var(--text-muted)' }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              <span style={{ fontSize: 'var(--font-size-sm)' }}>{store.id}</span>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}>{store.name}</span>
            </div>
          </td>
          <td className="p-3" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{store.description}</td>
          <td className="p-3" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>{store.address}</td>
          <td className="p-3" style={{ fontSize: 'var(--font-size-sm)' }}>{store.country}</td>
          <td className="p-3 text-right" style={{ fontSize: 'var(--font-size-sm)' }}>{store.size}</td>
          <td className="p-3"></td>
        </tr>
      ))}

      {/* Empty State when cluster is expanded but has no stores */}
      {isExpanded && cluster.stores.length === 0 && (
        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <td className="p-3"></td>
          <td className="p-6 text-center" colSpan={6} style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
            {cluster.id === 'unassigned' 
              ? 'Alle Filialen sind zugeordnet'
              : 'Ziehen Sie Filialen hierher, um sie diesem Cluster zuzuweisen'
            }
          </td>
        </tr>
      )}
    </>
  );
}
