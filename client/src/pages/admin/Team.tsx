import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import { fmtDateTime, ROLE_LABELS, type TeamMember } from './types';
import { Field, PageHeader, useToast } from './ui';

/** Abre el correo del administrador con el mensaje listo para enviar */
function passwordMailto(email: string, password: string) {
  const subject = 'Tu nueva contraseña del panel de la boda';
  const body = `Hola:\n\nTe asigné una contraseña nueva para el panel de la boda.\n\nEmail: ${email}\nContraseña: ${password}\n\nEntra en ${window.location.origin}/admin/login`;
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** Cuentas del equipo: wedding planner y novios (que solo cargan los datos). */
export default function Team() {
  const toast = useToast();
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  // Contraseña recién asignada: se muestra una sola vez para enviarla
  const [shownPassword, setShownPassword] = useState<{ email: string; password: string } | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamMember['role']>('PLANNER');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api<TeamMember[]>('/api/admin/team')
      .then(setTeam)
      .catch(() => toast('No se pudieron cargar las cuentas', 'error'));
  }, [toast]);

  useEffect(load, [load]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api('/api/admin/team', { method: 'POST', body: { email, password, role } });
      setEmail('');
      setPassword('');
      toast('Cuenta creada');
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al crear la cuenta');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: TeamMember) => {
    if (!confirm(`¿Quitar el acceso de ${p.email}? Se cerrará su sesión al instante.`)) return;
    try {
      await api(`/api/admin/team/${p.id}`, { method: 'DELETE' });
      toast('Acceso quitado');
      load();
    } catch {
      toast('No se pudo quitar el acceso', 'error');
    }
  };

  const resetPassword = async (p: TeamMember) => {
    if (!confirm(`¿Asignar una contraseña nueva a ${p.email}? La anterior dejará de funcionar y se cerrarán sus sesiones abiertas.`)) return;
    try {
      const r = await api<{ password: string }>(`/api/admin/team/${p.id}/reset-password`, { method: 'POST' });
      setShownPassword({ email: p.email, password: r.password });
    } catch {
      toast('No se pudo asignar la contraseña', 'error');
    }
  };

  return (
    <>
      <PageHeader title="Equipo" subtitle="Cuentas para la wedding planner y los novios" />
      <section className="card !rounded-3xl p-5 sm:p-6">
        <ul className="space-y-1 text-sm text-ink/55">
          <li><b className="text-ink/75">Wedding planner:</b> revisa quién confirmó y cuántas personas van, envía los links por WhatsApp, exporta el Excel, carga familias y teléfonos y arma el itinerario.</li>
          <li><b className="text-ink/75">Novios:</b> solo cargan familias, teléfonos y datos de contacto. No ven los links, las respuestas ni el reporte.</li>
          <li>Ninguno ve fotos, la configuración ni los accesos, ni puede borrar invitaciones o cambiar cupos de las ya creadas.</li>
        </ul>

        <ul className="mt-4 space-y-2">
          {team?.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-ivory px-4 py-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="font-medium">{p.email}</span>
                <span className="ml-2 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-semibold">{ROLE_LABELS[p.role]}</span>
              </span>
              <span className="flex flex-wrap items-center gap-x-3 text-xs text-ink/50">
                desde {fmtDateTime(p.createdAt)}
                <button type="button" className="min-h-[44px] font-medium text-ink/70 hover:text-gold" onClick={() => resetPassword(p)}>Nueva contraseña</button>
              <button type="button" className="min-h-[44px] font-medium text-red-600" onClick={() => remove(p)}>Quitar acceso</button>
              </span>
            </li>
          ))}
          {team && !team.length && <li className="text-sm text-ink/50">Todavía no hay cuentas.</li>}
        </ul>

        {shownPassword && (
          <div className="mt-4 rounded-2xl bg-sage/10 p-4 text-sm" role="status">
            <p>
              Contraseña nueva de <b>{shownPassword.email}</b>. Envíasela ahora: no se volverá a mostrar.
            </p>
            <code className="mt-3 inline-block rounded-lg bg-white px-3 py-2 text-base tracking-wider">{shownPassword.password}</code>
            <p className="mt-3 flex flex-wrap items-center gap-2">
              <a className="btn-primary min-h-[44px] px-4" href={passwordMailto(shownPassword.email, shownPassword.password)}>Enviar por correo</a>
              <button type="button" className="btn-outline min-h-[44px] px-4" onClick={() => navigator.clipboard?.writeText(shownPassword.password).then(() => toast('Copiada'))}>Copiar</button>
              <button type="button" className="min-h-[44px] px-2 text-ink/50" onClick={() => setShownPassword(null)}>Listo</button>
            </p>
          </div>
        )}

        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <Field label="Email">
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
          </Field>
          <Field label="Contraseña">
            <input type="text" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={10} required />
          </Field>
          <Field label="Rol">
            <select className="input" value={role} onChange={(e) => setRole(e.target.value as TeamMember['role'])}>
              <option value="PLANNER">{ROLE_LABELS.PLANNER}</option>
              <option value="NOVIOS">{ROLE_LABELS.NOVIOS}</option>
            </select>
          </Field>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creando…' : 'Crear cuenta'}</button>
        </form>
        <p className="mt-2 text-xs text-ink/45">Contraseña de mínimo 10 caracteres. Compártela por un canal privado.</p>
        {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      </section>
    </>
  );
}
