import { useEffect, useState, type FormEvent } from 'react';
import { ITINERARY_ICONS } from '@/components/Icons';
import { LoadingScreen } from '@/components/LoadingScreen';
import { api, ApiError } from '@/lib/api';
import type { ItineraryItem } from '@/lib/types';
import { PageHeader, useToast } from './ui';

const ICON_LABELS: Record<string, string> = {
  rings: 'Anillos', church: 'Iglesia', cheers: 'Brindis', dinner: 'Cena', music: 'Música',
  cake: 'Torta', camera: 'Fotos', car: 'Traslado', moon: 'Fin', heart: 'Corazón',
};

/** Itinerario del día: lo editan el administrador y la wedding planner */
export default function Itinerary() {
  const toast = useToast();
  const [items, setItems] = useState<ItineraryItem[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<ItineraryItem[]>('/api/admin/itinerary').then(setItems).catch(() => toast('Error al cargar el itinerario', 'error'));
  }, [toast]);

  if (!items) return <LoadingScreen />;

  const update = (i: number, patch: Partial<ItineraryItem>) => setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const move = (i: number, dir: -1 | 1) => {
    const next = [...items];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setItems(next);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setItems(await api<ItineraryItem[]>('/api/admin/itinerary', { method: 'PUT', body: { itinerary: items } }));
      toast('Itinerario guardado');
    } catch (err) {
      const issue = err instanceof ApiError ? (err.body.issues as { path: string; message: string }[] | undefined)?.[0] : undefined;
      toast(issue ? `${issue.path}: ${issue.message}` : err instanceof ApiError ? err.message : 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <PageHeader title="Itinerario" subtitle="Horarios del día que ven los invitados en la invitación" />

      <section className="card !rounded-3xl p-5 sm:p-6">
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-[90px_1fr] gap-2 rounded-2xl bg-ivory p-3 sm:grid-cols-[90px_1fr_1fr_140px_auto]">
              <input className="input" placeholder="16:00" value={it.time} onChange={(e) => update(i, { time: e.target.value })} aria-label="Hora" />
              <input className="input" placeholder="Título" value={it.title} onChange={(e) => update(i, { title: e.target.value })} aria-label="Título" required />
              <input className="input col-span-2 sm:col-span-1" placeholder="Descripción" value={it.description ?? ''} onChange={(e) => update(i, { description: e.target.value })} aria-label="Descripción" />
              <select className="input" value={it.icon} onChange={(e) => update(i, { icon: e.target.value })} aria-label="Icono">
                {Object.keys(ITINERARY_ICONS).map((k) => (
                  <option key={k} value={k}>{ICON_LABELS[k] ?? k}</option>
                ))}
              </select>
              <span className="flex items-center justify-end gap-1">
                <button type="button" className="btn min-w-[44px] px-2 text-ink/50 disabled:opacity-30" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                <button type="button" className="btn min-w-[44px] px-2 text-ink/50 disabled:opacity-30" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Bajar">↓</button>
                <button type="button" className="btn text-red-500" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Quitar</button>
              </span>
            </div>
          ))}
          {!items.length && <p className="text-sm text-ink/50">Todavía no hay actividades.</p>}
        </div>
        {items.length < 20 && (
          <button type="button" className="btn-outline mt-3" onClick={() => setItems([...items, { time: '', title: '', icon: 'heart' }])}>+ Actividad</button>
        )}
      </section>

      <div className="sticky bottom-20 z-20 flex justify-end md:bottom-6">
        <button type="submit" className="btn-primary shadow-card" disabled={saving}>{saving ? 'Guardando…' : 'Guardar itinerario'}</button>
      </div>
    </form>
  );
}
