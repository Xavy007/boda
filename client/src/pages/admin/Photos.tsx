import { Reorder, useDragControls } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type DragEvent } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Photo, PhotoSection, PhotosBySection } from '@/lib/types';
import { EmptyState, PageHeader, useToast } from './ui';

const SECTIONS: { value: PhotoSection; label: string; hint: string }[] = [
  { value: 'HERO', label: 'Portada', hint: 'La 1ª es la portada; la 2ª, el fondo de la frase destacada' },
  { value: 'HISTORIA', label: 'Nuestra historia', hint: 'Una por cada momento de la historia, en el mismo orden' },
  { value: 'GALERIA', label: 'Galería', hint: 'Recomendado: 12 o más' },
  { value: 'CIERRE', label: 'Cierre', hint: 'Foto final a pantalla completa' },
];

/** Fotos por petición: lotes chicos = menos memoria en el servidor y progreso visible */
const BATCH = 3;

function PhotoRow({ photo, onDelete, onAlt, onMove, onDragEnd }: { photo: Photo; onDelete: () => void; onAlt: (alt: string) => void; onMove: (s: PhotoSection) => void; onDragEnd: () => void }) {
  const controls = useDragControls();
  const [alt, setAlt] = useState(photo.alt);
  const thumb = photo.variants[0]?.url ?? photo.publicUrl;

  return (
    <Reorder.Item value={photo} dragListener={false} dragControls={controls} onDragEnd={onDragEnd} className="flex items-center gap-3 rounded-2xl bg-white p-2 pr-3 shadow-card">
      <button
        type="button"
        aria-label="Arrastrar para ordenar"
        onPointerDown={(e) => controls.start(e)}
        className="grid h-12 w-8 shrink-0 cursor-grab touch-none place-items-center text-ink/30 active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <img src={thumb} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <input
          className="w-full rounded-lg border border-transparent bg-ivory px-2 py-1.5 text-sm focus:border-sage focus:outline-none"
          value={alt}
          placeholder="Descripción (opcional)"
          onChange={(e) => setAlt(e.target.value)}
          onBlur={() => alt !== photo.alt && onAlt(alt)}
          aria-label="Descripción de la foto"
        />
        <select className="w-full rounded-lg bg-ivory px-2 py-1.5 text-xs text-ink/70" value={photo.section} onChange={(e) => onMove(e.target.value as PhotoSection)} aria-label="Mover a sección">
          {SECTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
      <button type="button" onClick={onDelete} aria-label="Eliminar foto" className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-red-500 hover:bg-red-50">
        ✕
      </button>
    </Reorder.Item>
  );
}

export default function Photos() {
  const toast = useToast();
  const [photos, setPhotos] = useState<PhotosBySection | null>(null);
  const [section, setSection] = useState<PhotoSection>('GALERIA');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef<PhotosBySection | null>(null);
  latest.current = photos;

  const load = useCallback(() => {
    api<PhotosBySection>('/api/admin/photos').then(setPhotos).catch(() => toast('Error al cargar fotos', 'error'));
  }, [toast]);
  useEffect(load, [load]);

  const upload = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
    if (!files.length) return toast('Selecciona imágenes (JPG, PNG, WEBP)', 'error');
    setProgress({ done: 0, total: files.length });
    const failed: string[] = [];
    for (let i = 0; i < files.length; i += BATCH) {
      const form = new FormData();
      form.append('section', section);
      files.slice(i, i + BATCH).forEach((f) => form.append('files', f));
      try {
        const res = await api<{ created: number; failed: { name: string; message: string }[] }>('/api/admin/photos', { method: 'POST', body: form });
        failed.push(...res.failed.map((f) => f.name));
      } catch (err) {
        const body = err instanceof ApiError ? (err.body.failed as { name: string }[] | undefined) : undefined;
        failed.push(...(body?.map((f) => f.name) ?? files.slice(i, i + BATCH).map((f) => f.name)));
      }
      setProgress({ done: Math.min(i + BATCH, files.length), total: files.length });
    }
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
    const ok = files.length - failed.length;
    if (ok) toast(`${ok} foto(s) subida(s) a ${SECTIONS.find((s) => s.value === section)?.label}`);
    if (failed.length) toast(`No se pudieron subir: ${failed.slice(0, 3).join(', ')}${failed.length > 3 ? '…' : ''}`, 'error');
    load();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!progress && e.dataTransfer.files.length) upload(e.dataTransfer.files);
  };

  const persistOrder = async (next: PhotosBySection) => {
    const items = (Object.keys(next) as PhotoSection[]).flatMap((s) => next[s].map((p, order) => ({ id: p.id, section: s, order })));
    try {
      setPhotos(await api<PhotosBySection>('/api/admin/photos/reorder', { method: 'PUT', body: { items } }));
    } catch {
      toast('No se pudo guardar el orden', 'error');
    }
  };

  const remove = async (p: Photo) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    await api(`/api/admin/photos/${p.id}`, { method: 'DELETE' }).catch(() => toast('Error al eliminar', 'error'));
    load();
  };

  const updateAlt = (p: Photo, alt: string) =>
    api(`/api/admin/photos/${p.id}`, { method: 'PUT', body: { alt } })
      .then(() => toast('Descripción guardada'))
      .catch(() => toast('Error al guardar', 'error'));

  const move = (p: Photo, to: PhotoSection) => {
    if (!photos) return;
    const next = { ...photos, [p.section]: photos[p.section].filter((x) => x.id !== p.id), [to]: [...photos[to], { ...p, section: to }] };
    setPhotos(next);
    persistOrder(next);
  };

  const total = photos ? Object.values(photos).reduce((a, l) => a + l.length, 0) : 0;
  const uploading = progress !== null;

  return (
    <>
      <PageHeader title="Fotos" subtitle={`${total} foto(s) · se optimizan automáticamente para celular`} />

      <div className="card !rounded-3xl p-5">
        <label className="block">
          <span className="label">1. Elige la sección</span>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {SECTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSection(s.value)}
                className={`min-h-[44px] shrink-0 rounded-full px-4 text-sm font-medium transition ${section === s.value ? 'bg-sage text-white' : 'bg-ivory text-ink/70 ring-1 ring-ink/10'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </label>

        <span className="label mt-5">2. Sube las fotos</span>
        <div
          onDragOver={(e) => (e.preventDefault(), setDragOver(true))}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative flex min-h-[150px] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-6 text-center transition ${dragOver ? 'border-sage bg-sage/10' : 'border-ink/15 bg-ivory'}`}
        >
          {uploading ? (
            <div className="w-full max-w-xs">
              <p className="font-medium">Subiendo {progress.done} de {progress.total}…</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-sage transition-all" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink/50">No cierres esta página</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink/60">
                <span className="hidden sm:inline">Arrastra aquí tus fotos o </span>
                elige varias a la vez
              </p>
              <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>
                Seleccionar fotos
              </button>
              <p className="text-xs text-ink/45">Se agregan a: <b>{SECTIONS.find((s) => s.value === section)?.label}</b></p>
            </>
          )}
          <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
        </div>
      </div>

      {!photos ? (
        <p className="mt-6 text-sm text-ink/50">Cargando…</p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {SECTIONS.map((s) => (
            <section key={s.value}>
              <div className="mb-3">
                <h2 className="font-serif text-2xl">
                  {s.label} <span className="text-base text-ink/40">({photos[s.value].length})</span>
                </h2>
                <p className="text-xs text-ink/50">{s.hint}</p>
              </div>
              {photos[s.value].length ? (
                <Reorder.Group axis="y" values={photos[s.value]} onReorder={(list) => setPhotos({ ...photos, [s.value]: list })} className="space-y-2">
                  {photos[s.value].map((p) => (
                    <PhotoRow
                      key={p.id}
                      photo={p}
                      onDelete={() => remove(p)}
                      onAlt={(alt) => updateAlt(p, alt)}
                      onMove={(to) => move(p, to)}
                      onDragEnd={() => latest.current && persistOrder(latest.current)}
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <EmptyState text="Sin fotos: la invitación muestra fotos de ejemplo aquí" />
              )}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
