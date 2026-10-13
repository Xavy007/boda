import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { IconCopy, IconWhatsapp } from '@/components/Icons';
import { api, ApiError, downloadFile } from '@/lib/api';
import { copyText } from '@/lib/format';
import { fmtDateTime, type AdminInvitation, type DisplayStatus, type InvitationDetail } from './types';
import { EmptyState, Field, Modal, PageHeader, StatusBadge, useToast } from './ui';

type Filter = 'TODOS' | DisplayStatus | 'BLOQUEADO';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'NO_ENVIADO', label: 'No enviado' },
  { value: 'ENVIADO', label: 'Enviado' },
  { value: 'ABIERTO', label: 'Abierto' },
  { value: 'CONFIRMADO', label: 'Confirmado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'BLOQUEADO', label: 'Bloqueado' },
];

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Invitations() {
  const toast = useToast();
  const [items, setItems] = useState<AdminInvitation[] | null>(null);
  const [filter, setFilter] = useState<Filter>('TODOS');
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [defaultMax, setDefaultMax] = useState(2);

  const load = useCallback(() => {
    api<AdminInvitation[]>('/api/admin/invitations')
      .then(setItems)
      .catch(() => toast('No se pudieron cargar las invitaciones', 'error'));
  }, [toast]);

  useEffect(load, [load]);
  useEffect(() => {
    api<{ defaultMaxGuests: number }>('/api/admin/settings')
      .then((s) => setDefaultMax(s.defaultMaxGuests))
      .catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = normalize(query.trim());
    return items.filter((i) => {
      if (q && !normalize(i.familyName).includes(q)) return false;
      if (filter === 'TODOS') return true;
      if (filter === 'BLOQUEADO') return i.blockedCount > 0;
      return i.displayStatus === filter;
    });
  }, [items, filter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { TODOS: items?.length ?? 0, BLOQUEADO: 0 };
    for (const i of items ?? []) {
      c[i.displayStatus] = (c[i.displayStatus] ?? 0) + 1;
      if (i.blockedCount) c.BLOQUEADO++;
    }
    return c;
  }, [items]);

  const sendWhatsapp = async (inv: AdminInvitation) => {
    if (inv.whatsappUrl) {
      // Se abre en el mismo gesto del click para que el navegador no lo bloquee
      window.open(inv.whatsappUrl, '_blank', 'noopener');
    } else {
      await copyText(inv.whatsappText);
      toast('Sin teléfono: copiamos el mensaje para que lo envíes tú');
    }
    try {
      const { sentAt } = await api<{ sentAt: string }>(`/api/admin/invitations/${inv.id}/mark-sent`, { method: 'POST' });
      setItems((prev) => prev?.map((i) => (i.id === inv.id ? { ...i, sentAt, displayStatus: i.displayStatus === 'NO_ENVIADO' ? 'ENVIADO' : i.displayStatus } : i)) ?? null);
    } catch {
      toast('No se pudo marcar como enviado', 'error');
    }
  };

  const copyLink = async (inv: AdminInvitation) => {
    if (await copyText(inv.link)) toast('Link copiado');
  };

  return (
    <>
      <PageHeader
        title="Invitaciones"
        subtitle={items ? `${items.length} familias · ${items.reduce((a, i) => a + i.maxGuests, 0)} cupos` : undefined}
        actions={
          <>
            <button type="button" className="btn-primary" onClick={() => setCreating(true)}>+ Nueva</button>
            <button type="button" className="btn-outline" onClick={() => setImporting(true)}>Importar</button>
            <button type="button" className="btn-outline" onClick={() => downloadFile('/api/admin/export', 'invitados-boda.xlsx').catch(() => toast('Error al exportar', 'error'))}>
              Exportar
            </button>
          </>
        }
      />

      <input
        type="search"
        className="input"
        placeholder="Buscar por nombre de familia…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Buscar invitación"
      />
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`min-h-[40px] shrink-0 rounded-full px-4 text-sm font-medium transition ${filter === f.value ? 'bg-ink text-white' : 'bg-white text-ink/70 ring-1 ring-ink/10'}`}
          >
            {f.label} <span className="opacity-60">{counts[f.value] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {items === null && <p className="text-sm text-ink/50">Cargando…</p>}
        {items && !filtered.length && <EmptyState text="No hay invitaciones con ese filtro." />}
        {filtered.map((inv) => (
          <article key={inv.id} className="card !rounded-3xl p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <button type="button" onClick={() => setDetailId(inv.id)} className="min-w-0 text-left">
                <p className="truncate font-serif text-2xl leading-tight hover:text-gold">{inv.familyName}</p>
                <p className="mt-1 text-xs text-ink/50">
                  {inv.status === 'CONFIRMADO' ? `${inv.attendingCount} de ${inv.maxGuests} asisten${inv.respondentName ? ` (${inv.respondentName})` : ''}` : `${inv.maxGuests} cupos`} · {inv.deviceCount}/{inv.maxDevices} dispositivos
                  {inv.contactPhone ? ` · ${inv.contactPhone}` : ''}
                </p>
              </button>
              <div className="flex flex-wrap gap-1.5">
                <StatusBadge status={inv.displayStatus} />
                {inv.blockedCount > 0 && <StatusBadge status="BLOQUEADO" />}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => sendWhatsapp(inv)} className="btn min-h-[44px] bg-[#25D366] px-4 text-white">
                <IconWhatsapp className="h-5 w-5" />
                {inv.sentAt && !inv.firstOpenedAt ? 'Reenviar' : inv.sentAt ? 'WhatsApp' : 'Enviar por WhatsApp'}
              </button>
              <button type="button" onClick={() => copyLink(inv)} className="btn-outline min-h-[44px] px-4">
                <IconCopy className="h-4 w-4" /> Copiar link
              </button>
              <button type="button" onClick={() => setDetailId(inv.id)} className="btn-outline min-h-[44px] px-4">
                Detalle
              </button>
            </div>
          </article>
        ))}
      </div>

      <DetailModal id={detailId} onClose={() => setDetailId(null)} onChanged={load} />
      <Modal open={creating} onClose={() => setCreating(false)} title="Nueva invitación">
        <InvitationForm
          key={defaultMax}
          initial={{ maxGuests: defaultMax }}
          onSaved={() => {
            setCreating(false);
            toast('Invitación creada');
            load();
          }}
        />
      </Modal>
      <ImportModal open={importing} onClose={() => setImporting(false)} onDone={load} />
    </>
  );
}

// ── Formulario crear / editar ─────────────────────────────────────────────────
interface FormValues {
  familyName: string;
  contactPhone: string;
  contactEmail: string;
  maxGuests: number;
  maxDevices: number;
  notes: string;
}

function InvitationForm({ initial, id, onSaved }: { initial?: Partial<FormValues>; id?: string; onSaved: () => void }) {
  const [values, setValues] = useState<FormValues>({
    familyName: '',
    contactPhone: '',
    contactEmail: '',
    maxGuests: 2,
    maxDevices: 2,
    notes: '',
    ...initial,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) => setValues((p) => ({ ...p, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(id ? `/api/admin/invitations/${id}` : '/api/admin/invitations', { method: id ? 'PUT' : 'POST', body: values });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <Field label="Nombre de la familia" hint='Se mostrará como "Querida familia …"'>
        <input className="input" value={values.familyName} onChange={(e) => set('familyName', e.target.value)} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Teléfono (WhatsApp)">
          <input className="input" inputMode="tel" value={values.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="70000000" />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={values.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
        </Field>
        <Field label="Cupos">
          <input className="input" type="number" min={1} max={30} value={values.maxGuests} onChange={(e) => set('maxGuests', Number(e.target.value))} />
        </Field>
        <Field label="Máx. dispositivos">
          <input className="input" type="number" min={1} max={10} value={values.maxDevices} onChange={(e) => set('maxDevices', Number(e.target.value))} />
        </Field>
      </div>
      <Field label="Notas internas">
        <textarea className="input min-h-[80px] py-3" value={values.notes} onChange={(e) => set('notes', e.target.value)} />
      </Field>
      {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
    </form>
  );
}

// ── Detalle ──────────────────────────────────────────────────────────────────
function DetailModal({ id, onClose, onChanged }: { id: string | null; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [detail, setDetail] = useState<InvitationDetail | null>(null);
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    if (!id) return;
    api<InvitationDetail>(`/api/admin/invitations/${id}`).then(setDetail).catch(() => toast('Error al cargar el detalle', 'error'));
  }, [id, toast]);

  useEffect(() => {
    setDetail(null);
    setEditing(false);
    load();
  }, [load]);

  const action = async (path: string, confirmText: string, okText: string) => {
    if (!confirm(confirmText)) return;
    try {
      await api(`/api/admin/invitations/${id}${path}`, { method: 'POST' });
      toast(okText);
      load();
      onChanged();
    } catch {
      toast('No se pudo completar la acción', 'error');
    }
  };

  const remove = async () => {
    if (!confirm('¿Eliminar esta invitación y todas sus respuestas? No se puede deshacer.')) return;
    await api(`/api/admin/invitations/${id}`, { method: 'DELETE' });
    toast('Invitación eliminada');
    onClose();
    onChanged();
  };

  return (
    <Modal open={Boolean(id)} onClose={onClose} title={detail?.familyName ?? 'Cargando…'} wide>
      {detail && !editing && (
        <div className="space-y-6 text-sm">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={detail.displayStatus} />
            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-semibold">{detail.maxGuests} cupos</span>
            <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-semibold">{detail.devices.length}/{detail.maxDevices} dispositivos</span>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-4">
            {[
              ['Enviada', fmtDateTime(detail.sentAt)],
              ['Abierta', fmtDateTime(detail.firstOpenedAt)],
              ['Respondió', fmtDateTime(detail.confirmedAt)],
              ['Teléfono', detail.contactPhone ?? '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] uppercase tracking-wider text-ink/45">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>

          <section>
            <h3 className="font-serif text-xl">Respuesta</h3>
            {detail.status === 'PENDIENTE' ? (
              <p className="mt-2 text-ink/50">Aún no respondió.</p>
            ) : (
              <div className="mt-2 rounded-2xl bg-white p-4">
                <p className="font-medium">
                  {detail.status === 'CONFIRMADO'
                    ? `Asisten ${detail.attendingCount} de ${detail.maxGuests} ${detail.attendingCount === 1 ? 'persona' : 'personas'}`
                    : 'No asisten'}
                </p>
                {detail.respondentName && <p className="mt-1 text-ink/65">Confirmó: {detail.respondentName}</p>}
                {detail.dietaryNotes && <p className="mt-1 text-xs text-ink/55">🍽 {detail.dietaryNotes}</p>}
              </div>
            )}
            {detail.message && <p className="mt-3 rounded-2xl bg-sage/10 p-4 font-serif text-base italic">“{detail.message}”</p>}
            {detail.notes && <p className="mt-3 text-xs text-ink/55">Notas: {detail.notes}</p>}
          </section>

          <section>
            <h3 className="font-serif text-xl">Dispositivos registrados</h3>
            {detail.devices.length ? (
              <ul className="mt-2 space-y-2">
                {detail.devices.map((d, i) => (
                  <li key={d.id} className="rounded-2xl bg-white px-4 py-3 text-xs">
                    <span className="font-semibold">Dispositivo {i + 1}</span> · primera vez {fmtDateTime(d.firstSeen)} · última {fmtDateTime(d.lastSeen)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-ink/50">Aún no se abrió en ningún dispositivo.</p>
            )}
          </section>

          <section>
            <h3 className="font-serif text-xl">Accesos recientes</h3>
            <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
              {detail.accessLogs.map((l) => (
                <li key={l.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${l.allowed ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="shrink-0">{fmtDateTime(l.createdAt)}</span>
                  <span className="truncate text-ink/50">{l.ip} · {l.userAgent}</span>
                </li>
              ))}
              {!detail.accessLogs.length && <li className="text-ink/50">Sin accesos.</li>}
            </ul>
          </section>

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="btn-outline" onClick={() => setEditing(true)}>Editar cupos / dispositivos</button>
            <button type="button" className="btn-outline" onClick={() => action('/reset-devices', '¿Liberar todos los dispositivos? El próximo que abra el link quedará registrado.', 'Dispositivos liberados')}>
              Liberar dispositivos
            </button>
            <button type="button" className="btn-outline" onClick={() => action('/regenerate-token', '¿Generar un link nuevo? El link anterior dejará de funcionar.', 'Link regenerado')}>
              Generar link nuevo
            </button>
            <button type="button" className="btn border border-red-200 text-red-600" onClick={remove}>Eliminar</button>
          </div>
        </div>
      )}
      {detail && editing && (
        <InvitationForm
          id={detail.id}
          initial={{
            familyName: detail.familyName,
            contactPhone: detail.contactPhone ?? '',
            contactEmail: detail.contactEmail ?? '',
            maxGuests: detail.maxGuests,
            maxDevices: detail.maxDevices,
            notes: detail.notes ?? '',
          }}
          onSaved={() => {
            setEditing(false);
            toast('Cambios guardados');
            load();
            onChanged();
          }}
        />
      )}
    </Modal>
  );
}

// ── Importar ─────────────────────────────────────────────────────────────────
const TEMPLATE_CSV = 'nombre_familia,telefono,email,cupos\nPérez Gutiérrez,70011111,perez@ejemplo.com,4\nMamani Quispe,70022222,,3\n';

function ImportModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{ created: number; errors: { row: number; message: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob(['﻿' + TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' }));
    Object.assign(document.createElement('a'), { href: url, download: 'plantilla-invitados.csv' }).click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const upload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api<{ created: number; errors: { row: number; message: string }[] }>('/api/admin/invitations/import', { method: 'POST', body: form });
      setResult(res);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al importar');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setFile(null);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Importar invitados">
      <p className="text-sm text-ink/65">
        Sube un archivo <b>.csv</b> o <b>.xlsx</b> con las columnas <code className="rounded bg-ink/5 px-1">nombre_familia, telefono, email, cupos</code>. Se genera un link único por fila.
      </p>
      <button type="button" onClick={downloadTemplate} className="mt-2 min-h-[44px] text-sm font-medium text-sage underline underline-offset-4">
        Descargar plantilla CSV
      </button>
      <form onSubmit={upload} className="mt-4 grid gap-4">
        <input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full rounded-2xl border border-dashed border-ink/20 bg-white p-4 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sage file:px-4 file:py-2 file:text-white" />
        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {result && (
          <div className="rounded-2xl bg-white p-4 text-sm">
            <p className="font-semibold text-emerald-700">✓ {result.created} invitaciones creadas</p>
            {result.errors.length > 0 && (
              <ul className="mt-2 space-y-1 text-red-700">
                {result.errors.map((er) => (
                  <li key={er.row}>Fila {er.row}: {er.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        <button type="submit" className="btn-primary" disabled={!file || loading}>{loading ? 'Importando…' : 'Importar'}</button>
      </form>
    </Modal>
  );
}
