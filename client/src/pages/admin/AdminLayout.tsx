import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { IconCalendar, IconCamera, IconClock, IconHeart, IconRings } from '@/components/Icons';
import { LoadingScreen } from '@/components/LoadingScreen';
import { api } from '@/lib/api';
import { ToastProvider } from './ui';

const NAV = [
  { to: '/admin', label: 'Inicio', icon: IconHeart, end: true },
  { to: '/admin/invitaciones', label: 'Invitados', icon: IconRings },
  { to: '/admin/fotos', label: 'Fotos', icon: IconCamera },
  { to: '/admin/configuracion', label: 'Evento', icon: IconCalendar },
  { to: '/admin/accesos', label: 'Accesos', icon: IconClock },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Panel · Nuestra boda';
    api<{ email: string }>('/api/admin/me')
      .then((me) => setEmail(me.email))
      .catch(() => navigate('/admin/login', { replace: true }));
  }, [navigate]);

  const logout = async () => {
    await api('/api/admin/logout', { method: 'POST' }).catch(() => undefined);
    navigate('/admin/login', { replace: true });
  };

  if (!email) return <LoadingScreen />;

  return (
    <ToastProvider>
      <div className="min-h-dscreen bg-ivory md:flex">
        {/* Sidebar (desktop) */}
        <aside className="sticky top-0 hidden h-dscreen w-60 shrink-0 flex-col border-r border-ink/[0.06] bg-white/60 p-5 md:flex">
          <p className="font-script text-3xl text-gold">Nuestra boda</p>
          <p className="eyebrow mt-1 text-ink/40">Panel</p>
          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
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
            <p className="truncate">{email}</p>
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
            <Outlet />
          </main>
        </div>

        {/* Navegación inferior (móvil) */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-ink/[0.06] bg-white/95 pt-1 backdrop-blur md:hidden">
          {NAV.map(({ to, label, icon: Icon, end }) => (
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
