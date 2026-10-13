import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { initials } from '@/lib/format';
import { Divider, FloralBranch } from './Ornaments';

interface Props {
  partnerOne: string;
  partnerTwo: string;
  familyName: string;
  dateLabel: string;
  /** Se llama en el mismo toque (gesto del usuario): aquí arranca la música. */
  onStart: () => void;
  /** Se llama al terminar la animación: se revela la invitación. */
  onFinish: () => void;
}

const EASE = [0.65, 0, 0.35, 1] as const;
const SOFT = [0.22, 1, 0.36, 1] as const;

// Tonos del sobre: más profundos que el fondo marfil para que se distinga bien
const PAPER = {
  back: 'linear-gradient(180deg, #CDBB9C 0%, #DCCDB2 70%)',
  sideL: 'linear-gradient(160deg, #EBDFCB 0%, #DCCBAE 100%)',
  sideR: 'linear-gradient(200deg, #EBDFCB 0%, #DCCBAE 100%)',
  bottom: 'linear-gradient(0deg, #F2E9DA 0%, #E3D4BA 100%)',
  flap: 'linear-gradient(180deg, #D9C6A5 0%, #CBB590 100%)',
};

/**
 * Sobre animado con sello de cera. Capas (de atrás hacia adelante):
 * fondo del sobre → tarjeta → bolsillos frontales → solapa → sello.
 * Al abrir: el sello se rompe, la solapa gira, la tarjeta sale y crece al centro.
 */
export function Envelope({ partnerOne, partnerTwo, familyName, dateLabel, onStart, onFinish }: Props) {
  const [opening, setOpening] = useState(false);
  const [flapOpen, setFlapOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const reduce = useReducedMotion();

  const open = () => {
    if (opening) return;
    setOpening(true);
    onStart();
    window.setTimeout(() => setVisible(false), reduce ? 300 : 3600);
  };

  return (
    <AnimatePresence onExitComplete={onFinish}>
      {visible && (
        <motion.div
          key="envelope"
          className="paper-texture fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-ivory px-4"
          exit={{ opacity: 0, scale: 1.06 }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <FloralBranch className="pointer-events-none absolute -left-10 -top-6 w-44 rotate-180 opacity-70 sm:w-56" />
          <FloralBranch className="pointer-events-none absolute -bottom-6 -right-10 w-44 opacity-70 sm:w-56" />

          {/* Encabezado: quién invita */}
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: opening ? 0 : 1, y: opening ? -20 : 0 }}
            transition={{ duration: 0.8, ease: SOFT }}
          >
            <p className="eyebrow text-[12px]">Tienes una invitación de</p>
            <p className="mt-3 font-script text-[3.2rem] leading-[1.05] text-ink sm:text-6xl">
              {partnerOne} <span className="text-gold">&</span> {partnerTwo}
            </p>
          </motion.div>

          {/* Sobre */}
          <motion.div
            role="presentation"
            onClick={open}
            className="relative aspect-[4/3] w-[min(92vw,460px)] cursor-pointer"
            style={{ perspective: 1400 }}
            initial={{ opacity: 0, y: 30, scale: 0.94 }}
            animate={{ opacity: 1, y: opening ? 90 : 0, scale: 1 }}
            transition={{ duration: 1.1, ease: SOFT, delay: opening ? 0.9 : 0.15 }}
          >
            {/* Fondo / interior */}
            <div className="absolute inset-0 rounded-lg shadow-envelope" style={{ background: PAPER.back }} />

            {/* Tarjeta: sale del sobre y crece al centro */}
            <motion.div
              className="absolute inset-x-[5%] top-[5%] flex h-[90%] flex-col items-center justify-center rounded-md border border-gold/30 bg-white px-4 text-center shadow-card"
              style={{ zIndex: 10 }}
              initial={false}
              animate={
                opening
                  ? { y: ['0%', '-70%', '-28%'], scale: [1, 1, 1.18], zIndex: [10, 10, 45] }
                  : { y: '0%', scale: 1, zIndex: 10 }
              }
              transition={{ duration: 1.9, delay: 1.0, ease: SOFT, times: [0, 0.5, 1] }}
            >
              <span className="eyebrow text-[10px]">Nos casamos</span>
              <span className="mt-2 font-script text-[2.4rem] leading-none text-ink">
                {partnerOne} <span className="text-gold">&</span> {partnerTwo}
              </span>
              <Divider className="my-3 scale-75" />
              <span className="font-serif text-base tracking-[0.25em] text-ink/70">{dateLabel}</span>
            </motion.div>

            {/* Bolsillos frontales */}
            <div className="absolute inset-0 z-20 rounded-lg" style={{ background: PAPER.sideL, clipPath: 'polygon(0 0, 50% 54%, 0 100%)' }} />
            <div className="absolute inset-0 z-20 rounded-lg" style={{ background: PAPER.sideR, clipPath: 'polygon(100% 0, 50% 54%, 100% 100%)' }} />
            <div className="absolute inset-0 z-20 rounded-lg" style={{ background: PAPER.bottom, clipPath: 'polygon(0 100%, 50% 48%, 100% 100%)' }} />
            {/* Filo dorado del bolsillo */}
            <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 100 75" preserveAspectRatio="none" aria-hidden>
              <path d="M0 75 L50 36 L100 75" fill="none" stroke="rgb(var(--c-gold))" strokeOpacity="0.45" strokeWidth="0.35" />
            </svg>

            {/* Solapa superior */}
            <motion.div
              className="absolute inset-x-0 top-0 h-[60%] origin-top"
              style={{
                zIndex: flapOpen ? 5 : 30,
                transformStyle: 'preserve-3d',
                filter: 'drop-shadow(0 6px 8px rgb(58 40 20 / 0.22))',
              }}
              initial={false}
              animate={{ rotateX: opening ? 180 : 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
              onAnimationComplete={() => opening && setFlapOpen(true)}
            >
              <div className="h-full w-full rounded-t-lg" style={{ background: PAPER.flap, clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
            </motion.div>

            {/* Anillo pulsante que invita a tocar */}
            {!opening && !reduce && (
              <motion.span
                className="pointer-events-none absolute left-1/2 top-[60%] z-30 h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-gold"
                animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
                aria-hidden
              />
            )}

            {/* Sello de cera */}
            <motion.button
              type="button"
              onClick={(e) => (e.stopPropagation(), open())}
              aria-label="Abrir la invitación"
              className="absolute left-1/2 top-[60%] z-40 grid h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
              style={{
                background: 'radial-gradient(circle at 35% 30%, #E2C690 0%, rgb(var(--c-gold)) 45%, #7a5a2e 100%)',
                boxShadow:
                  'inset 0 2px 5px rgb(255 255 255 / 0.5), inset 0 -5px 10px rgb(0 0 0 / 0.28), 0 8px 18px rgb(58 40 20 / 0.4)',
              }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={opening ? { scale: 1.3, opacity: 0, rotate: -14 } : { scale: [1, 1.04, 1], opacity: 1 }}
              transition={
                opening
                  ? { duration: 0.45, ease: 'easeIn' }
                  : { scale: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }, opacity: { duration: 0.6, delay: 0.6 } }
              }
            >
              <span
                className="grid h-[80px] w-[80px] place-items-center rounded-full border border-white/40 font-serif text-[2rem] font-medium tracking-wider text-white"
                style={{ textShadow: '0 1px 2px rgb(0 0 0 / 0.4)' }}
              >
                {initials(partnerOne, partnerTwo)}
              </span>
            </motion.button>
          </motion.div>

          {/* Destinatario + instrucción */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: opening ? 0 : 1, y: 0 }}
            transition={{ duration: opening ? 0.4 : 0.8, delay: opening ? 0 : 0.4 }}
          >
            <p className="font-serif text-xl italic text-ink/70">
              Para la familia <span className="not-italic text-ink">{familyName}</span>
            </p>
            <button
              type="button"
              onClick={open}
              className="mt-5 inline-flex min-h-[48px] items-center gap-2 rounded-full border border-gold/50 bg-white/80 px-6 text-sm font-medium tracking-wide text-gold shadow-card"
            >
              <motion.span animate={reduce ? {} : { y: [0, -3, 0] }} transition={{ duration: 1.4, repeat: Infinity }} aria-hidden>
                ☝️
              </motion.span>
              Toca el sello para abrir
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
