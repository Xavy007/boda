import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { api, ApiError } from '@/lib/api';
import type { GiftInfo, Palette, StoryItem } from '@/lib/types';
import type { AdminSettings } from './types';
import { Field, PageHeader, useToast } from './ui';

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="card !rounded-3xl p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="mb-4 font-serif text-2xl">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function Settings() {
  const toast = useToast();
  const [s, setS] = useState<AdminSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<AdminSettings>('/api/admin/settings').then(setS).catch(() => toast('Error al cargar la configuración', 'error'));
  }, [toast]);

  if (!s) return <LoadingScreen />;

  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) => setS((p) => (p ? { ...p, [k]: v } : p));
  const text = (k: keyof AdminSettings) => ({
    value: (s[k] as string | null) ?? '',
    onChange: (e: { target: { value: string } }) => set(k, e.target.value as never),
  });
  const gift = (k: keyof GiftInfo) => ({
    value: s.giftInfo[k] ?? '',
    onChange: (e: { target: { value: string } }) => set('giftInfo', { ...s.giftInfo, [k]: e.target.value }),
  });
  const setStory = (i: number, patch: Partial<StoryItem>) => set('storyItems', s.storyItems.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      setS(await api<AdminSettings>('/api/admin/settings', { method: 'PUT', body: s }));
      toast('Configuración guardada');
    } catch (err) {
      const issue = err instanceof ApiError ? (err.body.issues as { path: string; message: string }[] | undefined)?.[0] : undefined;
      toast(issue ? `${issue.path}: ${issue.message}` : err instanceof ApiError ? err.message : 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <PageHeader title="Evento" subtitle={`Fechas en hora local (${s.timezone})`} />

      <Group title="Novios y fecha">
        <Field label="Nombre 1"><input className="input" {...text('partnerOneName')} required /></Field>
        <Field label="Nombre 2"><input className="input" {...text('partnerTwoName')} required /></Field>
        <Field label={`Padres de ${s.partnerOneName || 'Nombre 1'}`} hint="Opcional. Ej.: Juan Pérez y María López"><input className="input" {...text('partnerOneParents')} /></Field>
        <Field label={`Padres de ${s.partnerTwoName || 'Nombre 2'}`} hint="Opcional. Ej.: Carlos Rojas y Ana Vargas"><input className="input" {...text('partnerTwoParents')} /></Field>
        <Field label="Fecha y hora de la ceremonia"><input type="datetime-local" className="input" {...text('eventDateLocal')} required /></Field>
        <Field label="Fin del evento (opcional)"><input type="datetime-local" className="input" {...text('eventEndDateLocal')} /></Field>
        <Field label="Zona horaria"><input className="input" {...text('timezone')} /></Field>
        <Field label="Fecha límite RSVP"><input type="datetime-local" className="input" {...text('rsvpDeadlineLocal')} required /></Field>
        <Field label="Cupos por defecto por invitación" hint="Máximo de personas que puede confirmar cada familia, al crear o importar invitaciones sin cupos. Cada invitación se puede ajustar aparte.">
          <input type="number" min={1} max={30} className="input" value={s.defaultMaxGuests} onChange={(e) => set('defaultMaxGuests', Number(e.target.value))} required />
        </Field>
        <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-2xl bg-ivory px-4 py-3 sm:col-span-2">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-sage" checked={s.adultsOnly} onChange={(e) => set('adultsOnly', e.target.checked)} />
          <span className="text-sm">
            <span className="font-medium">Celebración solo para adultos</span>
            <span className="mt-0.5 block text-xs text-ink/50">Muestra una nota discreta junto a los lugares reservados de cada invitación.</span>
          </span>
        </label>
      </Group>

      <Group title="Ceremonia">
        <Field label="Lugar"><input className="input" {...text('ceremonyName')} required /></Field>
        <Field label="Dirección"><input className="input" {...text('ceremonyAddress')} required /></Field>
        <Field label="Link de Google Maps" className="sm:col-span-2"><input type="url" className="input" {...text('ceremonyMapsUrl')} /></Field>
      </Group>

      <Group title="Recepción">
        <Field label="Lugar"><input className="input" {...text('receptionName')} required /></Field>
        <Field label="Dirección"><input className="input" {...text('receptionAddress')} required /></Field>
        <Field label="Hora (HH:mm)"><input className="input" placeholder="19:00" {...text('receptionTime')} /></Field>
        <Field label="Link de Google Maps"><input type="url" className="input" {...text('receptionMapsUrl')} /></Field>
      </Group>

      <Group title="Textos">
        <Field label="Frase principal (portada)" className="sm:col-span-2"><input className="input" {...text('mainPhrase')} required /></Field>
        <Field label="Frase destacada"><textarea className="input min-h-[90px] py-3" {...text('quotePhrase')} /></Field>
        <Field label="Autor de la frase"><input className="input" {...text('quoteAuthor')} /></Field>
        <Field label="Frase de cierre" className="sm:col-span-2"><textarea className="input min-h-[80px] py-3" {...text('closingPhrase')} /></Field>
      </Group>

      <Group title="Dress code">
        <Field label="Código"><input className="input" {...text('dressCode')} required /></Field>
        <Field label="Nota"><input className="input" {...text('dressCodeNote')} /></Field>
      </Group>

      <Group title="Mesa de regalos">
        <Field label="Mensaje" className="sm:col-span-2"><textarea className="input min-h-[80px] py-3" {...gift('message')} /></Field>
        <Field label="Nombre de la mesa de regalos"><input className="input" {...gift('registryName')} /></Field>
        <Field label="URL de la mesa de regalos"><input className="input" {...gift('registryUrl')} /></Field>
        <Field label="Banco"><input className="input" {...gift('bankName')} /></Field>
        <Field label="Titular"><input className="input" {...gift('accountHolder')} /></Field>
        <Field label="Nº de cuenta"><input className="input" {...gift('accountNumber')} /></Field>
        <Field label="Tipo de cuenta"><input className="input" {...gift('accountType')} /></Field>
        <Field label="Documento (CI/NIT)"><input className="input" {...gift('documentId')} /></Field>
        <Field label="Alias"><input className="input" {...gift('alias')} /></Field>
      </Group>

      <Group title="WhatsApp">
        <Field label="WhatsApp de los novios" hint="Para la pantalla de bloqueo y consultas"><input className="input" inputMode="tel" {...text('couplePhone')} required /></Field>
        <div className="hidden sm:block" />
        <Field label="Plantilla del mensaje" className="sm:col-span-2" hint="Variables: {nombre_familia}, {cupos}, {link} (obligatoria)">
          <textarea className="input min-h-[120px] py-3" {...text('whatsappTemplate')} required />
        </Field>
      </Group>

      <Group title="Apariencia y música">
        {(Object.keys(s.palette) as (keyof Palette)[]).map((k) => (
          <Field key={k} label={{ ivory: 'Fondo (marfil)', sage: 'Principal (salvia)', gold: 'Acento (dorado)', ink: 'Texto' }[k]}>
            <span className="flex items-center gap-3">
              <input type="color" value={s.palette[k]} onChange={(e) => set('palette', { ...s.palette, [k]: e.target.value.toUpperCase() })} className="h-12 w-14 cursor-pointer rounded-xl border border-ink/10 bg-white" />
              <code className="text-sm text-ink/60">{s.palette[k]}</code>
            </span>
          </Field>
        ))}
        <Field label="URL de música (mp3, opcional)" className="sm:col-span-2" hint="Arranca solo cuando el invitado abre el sobre">
          <input type="url" className="input" {...text('musicUrl')} />
        </Field>
      </Group>

      <fieldset className="card !rounded-3xl p-5 sm:p-6">
        <h2 className="mb-4 font-serif text-2xl">Nuestra historia</h2>
        <div className="space-y-3">
          {s.storyItems.map((it, i) => (
            <div key={i} className="grid gap-2 rounded-2xl bg-ivory p-3 sm:grid-cols-[140px_1fr_auto]">
              <input className="input" placeholder="Fecha" value={it.date} onChange={(e) => setStory(i, { date: e.target.value })} />
              <input className="input" placeholder="Título" value={it.title} onChange={(e) => setStory(i, { title: e.target.value })} />
              <button type="button" className="btn text-red-500" onClick={() => set('storyItems', s.storyItems.filter((_, idx) => idx !== i))}>Quitar</button>
              <textarea className="input min-h-[70px] py-3 sm:col-span-3" placeholder="Texto" value={it.text} onChange={(e) => setStory(i, { text: e.target.value })} />
            </div>
          ))}
        </div>
        <button type="button" className="btn-outline mt-3" onClick={() => set('storyItems', [...s.storyItems, { date: '', title: '', text: '' }])}>+ Momento</button>
      </fieldset>

      <div className="sticky bottom-20 z-20 flex justify-end md:bottom-6">
        <button type="submit" className="btn-primary shadow-card" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>
    </form>
  );
}
