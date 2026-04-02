import { useState, lazy, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { programApi } from '@/api/program.api';
import { cn } from '@/utils/cn';
import { useSupplementAlerts } from '@/hooks/useSupplementAlerts';

const LazyChatPage = lazy(() => import('@/pages/Chat/ChatPage'));

const navItems = [
  {
    to: '/',
    label: 'Ana Sayfa',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2 : 1.8} className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/workouts',
    label: 'Antrenman',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2 : 1.8} className="w-5 h-5">
        <path d="M6.5 6.5h11M6.5 12h11M6.5 17.5h11" strokeLinecap="round" />
        <circle cx="3.5" cy="6.5" r="1" fill="currentColor" />
        <circle cx="3.5" cy="12" r="1" fill="currentColor" />
        <circle cx="3.5" cy="17.5" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/nutrition',
    label: 'Beslenme',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2 : 1.8} className="w-5 h-5">
        <path d="M12 2a5 5 0 0 0-5 5c0 2.4 1.4 4.5 3.5 5.5V20a1.5 1.5 0 0 0 3 0v-7.5C15.6 11.5 17 9.4 17 7a5 5 0 0 0-5-5z" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/progress',
    label: 'İlerleme',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2 : 1.8} className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/programs',
    label: 'Programlar',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2 : 1.8} className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeWidth={2.5} />
      </svg>
    ),
  },
  {
    to: '/supplements',
    label: 'Supplement',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2 : 1.8} className="w-5 h-5">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" strokeLinecap="round" />
        <path d="M8 14v4a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-4" strokeLinecap="round" />
        <path d="M8 17h8" strokeLinecap="round" />
      </svg>
    ),
  },
  // Chat & Settings are desktop-sidebar only — chat has a pull-tab on mobile
  {
    to: '/chat',
    label: 'Sohbet',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2 : 1.8} className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    desktopOnly: true,
  },
  {
    to: '/settings',
    label: 'Profil',
    icon: (a: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a ? 2 : 1.8} className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" />
      </svg>
    ),
    desktopOnly: true,
  },
];

// ── Chat full-screen drawer ───────────────────────────────────────────────────
function ChatDrawer({ open, onClose, everOpened }: { open: boolean; onClose: () => void; everOpened: boolean }) {
  return (
    <>
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 z-40 lg:hidden transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.65)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
        onClick={onClose}
      />

      {/* Full-screen panel slides from right */}
      <div
        className="fixed inset-y-0 right-0 z-50 lg:hidden flex flex-col"
        style={{
          width: '100%',
          background: '#080C14',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 shrink-0"
          style={{
            height: 52,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(5,8,14,0.9)',
          }}
        >
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 active:text-white transition-colors shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2}>
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="text-base font-bold text-white">Sohbet</p>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden">
          {everOpened && (
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              <LazyChatPage />
            </Suspense>
          )}
        </div>
      </div>
    </>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────
export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { alerts: supplementAlerts } = useSupplementAlerts();
  const [dismissedAlert, setDismissedAlert] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatEverOpened, setChatEverOpened] = useState(false);

  const { data: activeProgram } = useQuery({
    queryKey: ['active-program'],
    queryFn: programApi.getActive,
  });

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  function openChat() {
    setChatEverOpened(true);
    setChatOpen(true);
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const mobileItems = navItems.filter((i) => !(i as { desktopOnly?: boolean }).desktopOnly);

  return (
    <div className="min-h-[100dvh] flex" style={{ background: 'transparent' }}>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.07), transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-60 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.04), transparent 70%)' }} />
      </div>

      {/* ── Desktop Sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-[230px] flex-col z-20 hidden lg:flex"
        style={{ background: 'rgba(5,8,14,0.92)', backdropFilter: 'blur(24px)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="px-5 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)', boxShadow: '0 4px 16px rgba(249,115,22,0.4)' }}>⚡</div>
          <span className="font-bold text-base tracking-tight text-white">FitTrack</span>
        </div>
        <div className="mx-4 mb-2" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
        {activeProgram && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <p className="text-xs text-purple-400 font-semibold truncate">📋 {(activeProgram as { title?: string }).title}</p>
            <p className="text-xs text-gray-600 mt-0.5">Hafta {(activeProgram as { currentWeek?: number }).currentWeek ?? 1}</p>
          </div>
        )}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive ? 'text-orange-400' : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]')}
                style={isActive ? { background: 'rgba(249,115,22,0.1)' } : {}}>
                <span className={isActive ? 'text-orange-400' : 'text-gray-600'}>{item.icon(isActive)}</span>
                {item.label}
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 opacity-70 shrink-0" />}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 mt-auto">
          <div className="mx-1 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(244,63,94,0.3))', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200 truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-all" title="Çıkış Yap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
                <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 lg:ml-[230px] relative z-10 pb-14 lg:pb-0 min-h-[100dvh]">
        {/* Supplement alert */}
        {supplementAlerts.length > 0 && !dismissedAlert && location.pathname !== '/supplements' && (
          <div className="sticky top-0 z-30 mx-3 mt-2 flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)' }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="shrink-0">💊</span>
              <p className="text-sm font-semibold text-orange-300 truncate">
                {supplementAlerts.length === 1 ? `${supplementAlerts[0].name_tr} alma vakti!` : `${supplementAlerts.length} supplement zamanı yaklaşıyor`}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => navigate('/supplements')} className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ background: 'rgba(249,115,22,0.25)', color: '#fb923c' }}>Görüntüle</button>
              <button onClick={() => setDismissedAlert(true)} className="text-gray-500 hover:text-gray-300 text-xl leading-none px-1">×</button>
            </div>
          </div>
        )}

        <div className="max-w-5xl mx-auto w-full px-3 pt-3 pb-4 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>

      {/* ── Chat pull-tab (mobile only, right edge) ── */}
      <button
        onClick={openChat}
        className="fixed z-30 lg:hidden flex flex-col items-center justify-center gap-1"
        style={{
          right: 0,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 20,
          height: 72,
          background: 'rgba(249,115,22,0.85)',
          borderRadius: '8px 0 0 8px',
          boxShadow: '-2px 0 12px rgba(249,115,22,0.4)',
        }}
        aria-label="Sohbeti Aç"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} style={{ width: 11, height: 11 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ width: 2, height: 18, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
      </button>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 lg:hidden"
        style={{
          background: 'rgba(5,8,14,0.97)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="flex items-center justify-around px-0.5 py-0.5">
          {mobileItems.map((item) => {
            const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'}
                className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-all"
                style={isActive ? { color: '#f97316' } : { color: '#4b5563' }}>
                {item.icon(isActive)}
                <span className="text-[8.5px] font-medium leading-tight text-center">{item.label}</span>
              </NavLink>
            );
          })}
          {/* Profile */}
          <NavLink to="/settings"
            className="flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-all"
            style={location.pathname === '/settings' ? { color: '#f97316' } : { color: '#4b5563' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.5), rgba(244,63,94,0.5))', color: '#fb923c' }}>
              {initials}
            </div>
            <span className="text-[8.5px] font-medium leading-tight">Profil</span>
          </NavLink>
        </div>
      </nav>

      {/* Chat Drawer */}
      <ChatDrawer open={chatOpen} onClose={() => setChatOpen(false)} everOpened={chatEverOpened} />
    </div>
  );
}
