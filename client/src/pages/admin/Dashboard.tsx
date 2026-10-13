import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingScreen } from '@/components/LoadingScreen';
import { api, downloadFile } from '@/lib/api';
import { fmtDateTime, type Stats } from './types';
import { PageHeader, useToast } from './ui';

function StatCard({ label, value, tone = 'default', hint }: { label: string; value: number | string; tone?: 'default' | 'sage' | 'gold' | 'rose'; hint?: string }) {
  const tones = {
    default: 'text-ink',
    sage: 'text-sage',
    gold: 'text-gold',
    rose: 'text-rose-600',
  };
  return (
    <div className="card !rounded-3xl p-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/50">{label}</p>
      <p className={`mt-2 font-serif text-4xl leading-none ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1.5 text-xs text-ink/45">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const toast = useToast();

  useEffect(() => {
    api<Stats>('/api/admin/stats').then(setStats).catch(() => toast('No se pudieron cargar las estadísticas', 'error'));
  }, [toast]);

  if (!stats) return <LoadingScreen />;

  const pct = stats.seatsAssigned ? Math.round((stats.attendingGuests / stats.seatsAssigned) * 100) : 0;
  const responded = stats.confirmed + stats.rejected;

  return (
    <>
      <PageHeader
        title="Resumen"
        subtitle={`${responded} de ${stats.total} familias ya respondieron`}
        actions={
          <button type="button" className="btn-outline" onClick={() => downloadFile('/api/admin/export', 'invitados-boda.xlsx').catch(() => toast('Error al exportar', 'error'))}>
            Exportar Excel
          </button>
        }
      />

      {stats.blockedWeek > 0 && (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-red-800">
          <p className="font-semibold">⚠️ {stats.blockedWeek} intento(s) bloqueado(s) en los últimos 7 días</p>
          <p className="mt-1 text-sm">Alguien intentó abrir una invitación desde un dispositivo no autorizado. Revisa si es un invitado real y libera sus dispositivos.</p>
          <Link to="/admin/accesos" className="mt-3 inline-block min-h-[44px] text-sm font-semibold underline underline-offset-4">
            Ver intentos bloqueados →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Invitaciones" value={stats.total} />
        <StatCard label="Enviadas" value={stats.sent} hint={`${stats.total - stats.sent} sin enviar`} />
        <StatCard label="Abiertas" value={stats.opened} />
        <StatCard label="Pendientes" value={stats.pending} tone="gold" />
        <StatCard label="Confirmadas" value={stats.confirmed} tone="sage" />
        <StatCard label="No asisten" value={stats.rejected} tone="rose" />
        <StatCard label="Bloqueos" value={stats.blockedTotal} tone={stats.blockedTotal ? 'rose' : 'default'} hint="intentos totales" />
        <StatCard label="Personas" value={stats.attendingGuests} tone="sage" hint={`de ${stats.seatsAssigned} cupos`} />
      </div>

      <div className="card mt-6 !rounded-3xl p-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/50">Asistentes vs. cupos asignados</p>
            <p className="mt-2 font-serif text-3xl">
              {stats.attendingGuests} <span className="text-ink/40">/ {stats.seatsAssigned}</span>
            </p>
          </div>
          <p className="font-serif text-3xl text-sage">{pct}%</p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-ink/[0.06]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-gradient-to-r from-sage to-gold transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {stats.recentBlocked.length > 0 && (
        <div className="card mt-6 !rounded-3xl p-6">
          <p className="font-serif text-2xl">Últimos bloqueos</p>
          <ul className="mt-4 divide-y divide-ink/[0.06]">
            {stats.recentBlocked.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="font-medium">{log.invitation?.familyName ?? '—'}</span>
                <span className="text-ink/50">{fmtDateTime(log.createdAt)} · {log.reason === 'DEVICE_LIMIT' ? 'límite de dispositivos' : log.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
