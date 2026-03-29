import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { programApi } from '@/api/program.api';
import { cn } from '@/utils/cn';

const navItems = [
  {
    to: '/',
    label: 'Genel Bakış',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} className="w-5 h-5">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/workouts',
    label: 'Antrenman',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} className="w-5 h-5">
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
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} className="w-5 h-5">
        <path d="M12 2a5 5 0 0 0-5 5c0 2.4 1.4 4.5 3.5 5.5V20a1.5 1.5 0 0 0 3 0v-7.5C15.6 11.5 17 9.4 17 7a5 5 0 0 0-5-5z" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/progress',
    label: 'İlerleme',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} className="w-5 h-5">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/programs',
    label: 'Programlar',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} className="w-5 h-5">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" strokeLinecap="round" strokeWidth={2.5} />
      </svg>
    ),
  },
  {
    to: '/chat',
    label: 'Sohbet',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} className="w-5 h-5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Profil',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} className="w-5 h-5">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" />
      </svg>
    ),
    desktopOnly: true,
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: activeProgram } = useQuery({
    queryKey: ['active-program'],
    queryFn: programApi.getActive,
  });

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <div className="min-h-screen flex" style={{ background: '#080C14' }}>

      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-60 -left-60 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.07), transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-60 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.04), transparent 70%)' }} />
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-[230px] flex-col z-20 hidden md:flex"
        style={{
          background: 'rgba(5,8,14,0.92)',
          backdropFilter: 'blur(24px)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}>

        {/* Logo */}
        <div className="px-5 h-16 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)', boxShadow: '0 4px 16px rgba(249,115,22,0.4)' }}>
            ⚡
          </div>
          <span className="font-bold text-base tracking-tight text-white">FitTrack</span>
        </div>

        <div className="mx-4 mb-2" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        {/* Active program mini-bar */}
        {activeProgram && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
            <p className="text-xs text-purple-400 font-semibold truncate">
              📋 {(activeProgram as { title?: string }).title}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">
              Hafta {(activeProgram as { currentWeek?: number }).currentWeek ?? 1}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  isActive ? 'text-orange-400' : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.03]'
                )}
                style={isActive ? { background: 'rgba(249,115,22,0.1)' } : {}}
              >
                <span className={isActive ? 'text-orange-400' : 'text-gray-600'}>
                  {item.icon(isActive)}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 opacity-70 shrink-0" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom: user */}
        <div className="p-3 mt-auto">
          <div className="mx-1 mb-3" style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(244,63,94,0.3))', color: '#fb923c', border: '1px solid rgba(249,115,22,0.2)' }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200 truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-gray-600 hover:text-gray-300 hover:bg-white/[0.06] transition-all"
              title="Çıkış Yap"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
                <polyline points="16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-[230px] relative z-10 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 md:hidden"
        style={{
          background: 'rgba(5,8,14,0.95)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.filter((item) => !(item as { desktopOnly?: boolean }).desktopOnly).map((item) => {
            const isActive = item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all min-w-0"
                style={isActive ? { color: '#f97316' } : { color: '#4b5563' }}
              >
                {item.icon(isActive)}
                <span className="text-[10px] font-medium truncate max-w-[52px] text-center leading-tight">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
          {/* Profile / Settings */}
          <NavLink
            to="/settings"
            className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all min-w-0"
            style={location.pathname === '/settings' ? { color: '#f97316' } : { color: '#4b5563' }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.4), rgba(244,63,94,0.4))', color: '#fb923c' }}>
              {initials}
            </div>
            <span className="text-[10px] font-medium leading-tight">Profil</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
