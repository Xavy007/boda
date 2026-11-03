import { useEffect, useState } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IconCalendar, IconCamera, IconClock, IconHeart, IconList, IconRings, IconUsers } from '@/components/Icons';
import { LoadingScreen } from '@/components/LoadingScreen';
import { api } from '@/lib/api';
import { ROLE_LABELS, type AdminMe, type AdminRole } from './types';
import { ToastProvider } from './ui';

const NAV: { to: string; label: string; icon: typeof IconHeart; end?: boolean; roles: AdminRole[] }[] = [
  { to: '/admin', label: 'Inicio', icon: IconHeart, end: true, roles: ['ADMIN', 'PLANNER'] },
  { to: '/admin/invitaciones', label: 'Invitados', icon: IconRings, roles: ['ADMIN', 'PLANNER', 'NOVIOS'] },
  { to: '/admin/itinerario', label: 'Itinerario', icon: IconList, roles: ['ADMIN', 'PLANNER'] },
  { to: '/admin/fotos', label: 'Fotos', icon: IconCamera, roles: ['ADMIN'] },
  { to: '/admin/configuracion', label: 'Evento', icon: IconCalendar, roles: ['ADMIN'] },
  { to: '/admin/accesos', label: 'Accesos', icon: IconClock, roles: ['ADMIN'] },
  { to: '/admin/equipo', label: 'Equipo', icon: IconUsers, roles: ['ADMIN'] },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [me, setMe] = useState<AdminMe | null>(null);

  useEffect(() => {
    document.title = 'Panel · Nuestra boda';
    api<AdminMe>('/api/admin/me')
      .then(setMe)
      .catch(() => navigate('/admin/login', { replace: true }));
  }, [navigate]);

  const logout = async () => {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
    navigate('/admin/login', { replace: true });
  };

  if (!me) return <LoadingScreen />;

  const nav = NAV.filter((n) => n.roles.includes(me.role));
  // La planner ve Inicio, Invitados e Itinerario; los novios, solo Invitados
  const allowed = nav.some((n) => (n.end ? pathname.replace(/\/$/, '') === n.to : pathname.startsWith(n.to)));
  if (!allowed) return <Navigate to={nav[0].to} replace />;

  return (
    <ToastProvider>
      <div className="min-h-dscreen bg-ivory md:flex">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-dscreen w-60 shrink-0 flex-col border-r border-ink/[0.06] bg-white/60 p-5 md:flex">
          <p className="font-script text-3xl text-gold">Nuestra boda</p>
          <p className="eyebrow mt-1 text-ink/40">{me.role === 'ADMIN' ? 'Panel' : ROLE_LABELS[me.role]}</p>
          <nav className="mt-8 flex flex-col gap-1">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${isActive ? 'bg-sage text-white' : 'text-ink/70 hover:bg-ink/5'}`
                }
              >
                <Icon className="h-5 w-5" /> {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto border-t border-ink/[0.06] pt-4 text-xs text-ink/50">
            <p className="truncate">{me.email}</p>
            <button type="button" onClick={logout} className="mt-2 min-h-[44px] font-medium text-ink/70 hover:text-gold">
              Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Header (móvil) */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/[0.06] bg-ivory/90 px-4 py-3 backdrop-blur md:hidden">
            <p className="font-script text-2xl text-gold">Nuestra boda</p>
            <button type="button" onClick={logout} className="min-h-[44px] px-2 text-sm text-ink/60">
              Salir
            </button>
          </header>

          <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-8 md:pb-12 md:pt-10">
            <Outlet context={me} />
          </main>
        </div>

        {/* Navegación inferior (móvil) */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid border-t border-ink/[0.06] bg-white/95 pt-1 backdrop-blur md:hidden" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex min-h-[52px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${isActive ? 'text-sage' : 'text-ink/50'}`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </ToastProvider>
  );
}
