import React from 'react';
import { useUserStore } from '@/store/user.store';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user } = useUserStore();

  const handleLogout = () => {
    auth.signOut();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Navbar Minimalista */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg" />
            <span className="font-bold text-lg tracking-tight">V-METRIQ</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-sm text-slate-400">
              {user?.firstName} {user?.lastName} <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 ml-2 uppercase">{user?.role}</span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="py-1.5 px-3 text-xs">
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};