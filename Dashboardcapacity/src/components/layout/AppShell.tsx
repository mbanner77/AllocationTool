import { ReactNode } from 'react';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';

interface AppShellProps {
  children: ReactNode;
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function AppShell({ children, currentScreen, onNavigate }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--surface-page)' }}>
      <SideNav currentScreen={currentScreen} onNavigate={onNavigate} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
