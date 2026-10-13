import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { fmtDateTime, type AccessLogRow } from './types';
import { EmptyState, PageHeader, useToast } from './ui';

const REASONS: Record<string, string> = {
  cookie: 'Cookie reconocida',
  fingerprint: 'Fingerprint reconocido',
  new: 'Dispositivo nuevo registrado',
  DEVICE_LIMIT: 'Límite de dispositivos',
  INVALID_TOKEN: 'Token inválido',
  EXPIRED: 'Invitación vencida',
};

export default function Logs() {
  const toast = useToast();
  const [blocked, setBlocked] = useState(true);
  const [logs, setLogs] = useState<AccessLogRow[] | null>(null);

  useEffect(() => {
    setLogs(null);
    api<AccessLogRow[]>(`/api/admin/logs?blocked=${blocked}&limit=200`).then(setLogs).catch(() => toast('Error al cargar accesos', 'error'));
  }, [blocked, toast]);

  return (
    <>
      <PageHeader title="Accesos" subtitle="Registro de cada intento de abrir una invitación" />
      <div className="mb-4 flex gap-2">
        {[
          { v: true, label: 'Solo bloqueados' },
          { v: false, label: 'Todos' },
        ].map((o) => (
          <button key={String(o.v)} type="button" onClick={() => setBlocked(o.v)} className={`min-h-[40px] rounded-full px-4 text-sm font-medium ${blocked === o.v ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink/10'}`}>
            {o.label}
          </button>
        ))}
      </div>

      {!logs ? (
        <p className="text-sm text-ink/50">Cargando…</p>
      ) : !logs.length ? (
        <EmptyState text={blocked ? 'Sin intentos bloqueados 🎉' : 'Aún no hay accesos'} />
      ) : (
        <ul className="space-y-2">
          {logs.map((l) => (
            <li key={l.id} className="card !rounded-2xl p-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  <span className={`h-2.5 w-2.5 rounded-full ${l.allowed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {l.invitation?.familyName ?? 'Sin invitación'}
                </span>
                <span className="text-xs text-ink/50">{fmtDateTime(l.createdAt)}</span>
              </div>
              <p className="mt-1 text-xs text-ink/60">{REASONS[l.reason ?? ''] ?? l.reason} · IP {l.ip ?? '—'}</p>
              <p className="mt-1 truncate text-xs text-ink/40">{l.userAgent}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
