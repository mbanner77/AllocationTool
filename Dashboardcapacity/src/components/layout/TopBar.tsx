import { Bell, Search } from 'lucide-react';

export function TopBar() {
  return (
    <header 
      className="flex items-center justify-between px-6 border-b"
      style={{ 
        height: 'var(--height-topbar)',
        backgroundColor: 'var(--surface-page)',
        borderColor: 'var(--border-default)'
      }}
    >
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search 
            size={18} 
            className="absolute left-3 top-1/2 -translate-y-1/2" 
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            type="search"
            placeholder="Suchen..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            style={{
              borderColor: 'var(--border-input)',
              backgroundColor: 'var(--surface-page)',
              fontSize: 'var(--font-size-sm)',
              borderRadius: 'var(--radius-md)'
            }}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          className="p-2 rounded-lg relative"
          style={{
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tint)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Bell size={20} />
          <span 
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: 'var(--status-danger)' }}
          />
        </button>
      </div>
    </header>
  );
}
