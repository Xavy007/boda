import { AnimatePresence, motion } from 'framer-motion';
import { useState, type FormEvent } from 'react';
import { CalendarButtons } from '@/components/CalendarButtons';
import { Celebration, RingsMark } from '@/components/Celebration';
import { IconWhatsapp } from '@/components/Icons';
import { SectionHeading } from '@/components/Ornaments';
import { Reveal } from '@/components/Reveal';
import { api, ApiError } from '@/lib/api';
import { getFingerprint } from '@/lib/fingerprint';
import { formatDate } from '@/lib/format';
import type { InvitationData } from '@/lib/types';

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  token: string;
  data: InvitationData;
  onUpdate: (data: InvitationData) => void;
}

/** 11 · Confirmación de asistencia */
export function Rsvp({ token, data, onUpdate }: Props) {
  const { invitation, rsvp, event, calendar } = data;
  const responded = invitation.status !== 'PENDIENTE';
  const [editing, setEditing] = useState(!responded);
  const [celebrate, setCelebrate] = useState(false);

  const deadline = formatDate(rsvp.deadline, event.timezone, { day: 'numeric', month: 'long', year: 'numeric' });
  const seats = invitation.maxGuests;
  const showingAnswer = responded && !editing;

  // Una vez respondida, la sección deja de pedir confirmación y muestra la respuesta
  const heading = !showingAnswer
    ? { eyebrow: 'R.S.V.P.', title: responded ? 'Modificar respuesta' : '¿Nos acompañan?' }
    : invitation.status === 'CONFIRMADO'
      ? { eyebrow: 'Asistencia confirmada', title: '¡Nos vemos en la boda!' }
      : { eyebrow: 'Respuesta recibida', title: 'Gracias por avisarnos' };

  return (
    <section id="rsvp" className="relative overflow-hidden px-5 py-24 sm:py-32" aria-label="Confirmación de asistencia">
      <SectionHeading eyebrow={heading.eyebrow} title={heading.title} />
      {!showingAnswer && (
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-sm text-center font-serif text-xl text-ink/80 text-balance">
            {seats === 1 ? 'Hemos reservado 1 lugar para ti' : `Hemos reservado ${seats} lugares para ustedes`}
          </p>
          <p className="mt-2 text-center text-sm text-ink/55">
            {rsvp.canEdit ? `Por favor, confirma antes del ${deadline}.` : `La confirmación cerró el ${deadline}.`}
          </p>
        </Reveal>
      )}

      <Reveal delay={0.2} className="card relative mx-auto mt-10 max-w-md overflow-hidden p-6 sm:p-8">
        {celebrate && <Celebration />}
        <AnimatePresence mode="wait" initial={false}>
          {editing && rsvp.canEdit ? (
            <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ease: EASE }}>
              <RsvpForm
                token={token}
                data={data}
                onSaved={(next) => {
                  onUpdate(next);
                  setEditing(false);
                  setCelebrate(next.invitation.status === 'CONFIRMADO');
                }}
                onCancel={responded ? () => setEditing(false) : undefined}
              />
            </motion.div>
          ) : responded ? (
            <motion.div key="summary" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: EASE }}>
              <Summary data={data} />
              {invitation.status === 'CONFIRMADO' && (
                <div className="mt-8">
                  <CalendarButtons calendar={calendar} />
                </div>
              )}
              {rsvp.canEdit ? (
                <p className="mt-8 border-t border-ink/[0.06] pt-5 text-center text-xs text-ink/45">
                  ¿Cambió algo? Puedes{' '}
                  <button
                    type="button"
                    onClick={() => (setEditing(true), setCelebrate(false))}
                    className="min-h-[44px] font-medium text-ink/60 underline underline-offset-4"
                  >
                    modificar tu respuesta
                  </button>{' '}
                  hasta el {deadline}.
                </p>
              ) : (
                <p className="mt-6 text-center text-xs text-ink/50">La fecha límite pasó; tu respuesta quedó registrada.</p>
              )}
            </motion.div>
          ) : (
            <motion.div key="closed" className="text-center">
              <p className="font-serif text-2xl text-ink">El plazo para confirmar terminó</p>
              <p className="mt-3 text-sm text-ink/65">Si necesitas algo, escríbenos y lo resolvemos juntos.</p>
              {event.coupleWhatsapp && (
                <a href={event.coupleWhatsapp} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6 w-full">
                  <IconWhatsapp className="h-5 w-5" /> Escribir a los novios
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Reveal>
    </section>
  );
}

function Summary({ data }: { data: InvitationData }) {
  const { invitation } = data;
  if (invitation.status === 'RECHAZADO') {
    return (
      <div className="text-center">
        <p className="font-script text-5xl text-gold">Los extrañaremos</p>
        <p className="mt-4 text-[15px] leading-relaxed text-ink/70">
          Gracias por avisarnos{invitation.respondentName ? `, ${invitation.respondentName.split(' ')[0]}` : ''}. Lamentamos que no puedan
          acompañarnos, pero los llevaremos en el corazón ese día.
        </p>
        {invitation.message && <p className="mt-5 rounded-2xl bg-ivory p-4 font-serif italic text-ink/70">“{invitation.message}”</p>}
      </div>
    );
  }
  const n = invitation.attendingCount;
  return (
    <div className="text-center">
      <RingsMark className="mx-auto h-20 w-32" />
      <p className="mt-2 font-script text-5xl text-gold">¡Gracias!</p>
      <div className="mt-5 rounded-2xl bg-ivory px-5 py-5">
        <p className="font-serif text-5xl leading-none text-ink">{n}</p>
        <p className="mt-1 text-sm uppercase tracking-[0.18em] text-ink/55">{n === 1 ? 'persona confirmada' : 'personas confirmadas'}</p>
        {invitation.respondentName && (
          <p className="mt-3 text-[15px] text-ink/70">
            a nombre de <b className="font-medium text-ink">{invitation.respondentName}</b>
          </p>
        )}
        {invitation.dietaryNotes && <p className="mt-2 text-xs text-ink/55">🍽 {invitation.dietaryNotes}</p>}
      </div>
      {invitation.message && <p className="mt-4 rounded-2xl bg-ivory p-4 font-serif italic text-ink/70">“{invitation.message}”</p>}
    </div>
  );
}

function RsvpForm({
  token,
  data,
  onSaved,
  onCancel,
}: {
  token: string;
  data: InvitationData;
  onSaved: (d: InvitationData) => void;
  onCancel?: () => void;
}) {
  const { invitation } = data;
  const max = invitation.maxGuests;
  const [attending, setAttending] = useState<boolean | null>(
    invitation.status === 'PENDIENTE' ? null : invitation.status === 'CONFIRMADO',
  );
  const [name, setName] = useState(invitation.respondentName ?? '');
  const [count, setCount] = useState(() => Math.min(max, Math.max(1, invitation.attendingCount || max)));
  const [diet, setDiet] = useState(invitation.dietaryNotes ?? '');
  const [showDiet, setShowDiet] = useState(Boolean(invitation.dietaryNotes));
  const [message, setMessage] = useState(invitation.message ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (attending === null) return setError('Cuéntanos si podrán asistir.');
    if (name.trim().length < 3) return setError('Escribe tu nombre completo.');
    setSending(true);
    try {
      const fp = await getFingerprint();
      const next = await api<InvitationData>(`/api/invitation/${token}/rsvp`, {
        method: 'POST',
        headers: fp ? { 'X-Device-Fingerprint': fp } : undefined,
        body: {
          attending,
          name: name.trim(),
          count: attending ? count : 0,
          dietaryNotes: attending && showDiet ? diet.trim() || null : null,
          message: message.trim() || null,
        },
      });
      onSaved(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <fieldset>
        <legend className="label mb-3 text-center">¿Podrán asistir?</legend>
        <div className="grid gap-3">
          {[
            { value: true, label: '¡Sí, asistiremos!', icon: '💍' },
            { value: false, label: 'No podremos asistir', icon: '🤍' },
          ].map((opt) => {
            const selected = attending === opt.value;
            return (
              <motion.button
                key={String(opt.value)}
                type="button"
                onClick={() => setAttending(opt.value)}
                aria-pressed={selected}
                whileTap={{ scale: 0.98 }}
                className={`flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border px-4 text-base font-medium transition ${
                  selected
                    ? opt.value
                      ? 'border-sage bg-sage text-white shadow-[0_10px_24px_-12px_rgb(var(--c-sage))]'
                      : 'border-ink/30 bg-ink/[0.06] text-ink'
                    : 'border-ink/10 bg-white text-ink/80 hover:border-sage/60'
                }`}
              >
                <span aria-hidden>{opt.icon}</span> {opt.label}
              </motion.button>
            );
          })}
        </div>
      </fieldset>

      <AnimatePresence initial={false}>
        {attending !== null && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="space-y-6 pt-8">
              <div>
                <label className="label" htmlFor="rsvp-name">
                  Tu nombre
                </label>
                <input
                  id="rsvp-name"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre y apellido"
                  autoComplete="name"
                  autoCapitalize="words"
                  maxLength={120}
                  required
                />
              </div>

              {attending && (
                <div>
                  <p className="label text-center">¿Cuántas personas asistirán?</p>
                  {max === 1 ? (
                    <p className="text-center font-serif text-xl text-ink/80">1 persona</p>
                  ) : (
                    <>
                      <div className="mt-2 flex items-center justify-center gap-5">
                        <button
                          type="button"
                          onClick={() => setCount((c) => Math.max(1, c - 1))}
                          disabled={count <= 1}
                          aria-label="Una persona menos"
                          className="grid h-12 w-12 place-items-center rounded-full border border-ink/15 text-2xl text-ink/70 disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="min-w-[3ch] text-center font-serif text-5xl tabular-nums text-ink" aria-live="polite">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCount((c) => Math.min(max, c + 1))}
                          disabled={count >= max}
                          aria-label="Una persona más"
                          className="grid h-12 w-12 place-items-center rounded-full border border-ink/15 text-2xl text-ink/70 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <p className="mt-1 text-center text-xs text-ink/50">Máximo {max}</p>
                    </>
                  )}
                </div>
              )}

              {attending &&
                (showDiet ? (
                  <div>
                    <label className="label" htmlFor="rsvp-diet">
                      Restricciones alimentarias
                    </label>
                    <input
                      id="rsvp-diet"
                      className="input"
                      value={diet}
                      onChange={(e) => setDiet(e.target.value)}
                      placeholder="Ej.: 1 vegetariano, alergia al maní"
                      maxLength={300}
                    />
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowDiet(true)} className="min-h-[44px] text-sm text-sage underline-offset-4 hover:underline">
                    + ¿Alguna restricción alimentaria?
                  </button>
                ))}

              <div>
                <label className="label" htmlFor="rsvp-message">
                  Mensaje para los novios <span className="normal-case tracking-normal text-ink/40">(opcional)</span>
                </label>
                <textarea
                  id="rsvp-message"
                  className="input min-h-[110px] resize-y py-3"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={attending ? '¡Estamos felices por ustedes!' : 'Les deseamos lo mejor en este día…'}
                  maxLength={1000}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <button type="submit" disabled={sending || attending === null} className="btn-primary mt-6 w-full text-base">
        {sending ? 'Enviando…' : 'Enviar respuesta'}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel} className="btn mt-2 w-full text-ink/60">
          Cancelar
        </button>
      )}
    </form>
  );
}
