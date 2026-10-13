/* Application shell — hash routing, layout, toast host. */

import { useState } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { StoreProvider, useStore } from './state/store';
import { DesktopSidebar, MobileBottomNav, MobileDrawer, MobileTopBar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import Overview from './pages/Overview';
import TodaysPlan from './pages/TodaysPlan';
import Roadmap from './pages/Roadmap';
import AllTopics from './pages/AllTopics';
import RevisionCenter from './pages/RevisionCenter';
import Tests from './pages/Tests';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function ToastHost() {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-20 right-4 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 lg:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-in flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs shadow-drawer ${
            t.kind === 'error'
              ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/90 dark:text-red-200'
              : t.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/90 dark:text-emerald-200'
                : 'border-line bg-white text-ink dark:border-night-line dark:bg-night-surface dark:text-night-text'
          }`}
          role="status"
        >
          <span className="mt-0.5 shrink-0">
            {t.kind === 'error' ? <AlertTriangle size={14} /> : t.kind === 'success' ? <CheckCircle2 size={14} /> : <Info size={14} />}
          </span>
          <span className="flex-1 leading-relaxed">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="min-h-screen bg-surface-muted dark:bg-night">
      <DesktopSidebar />
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-[248px]">
        <MobileTopBar onOpenMenu={() => setMenuOpen(true)} />
        <Header />
        <main className="mx-auto max-w-[1200px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-12">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/today" element={<TodaysPlan />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/topics" element={<AllTopics />} />
            <Route path="/revision" element={<RevisionCenter />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <MobileBottomNav />
      <ToastHost />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </StoreProvider>
  );
}
