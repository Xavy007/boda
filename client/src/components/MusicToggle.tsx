import { motion } from 'framer-motion';

export function MusicToggle({ playing, onToggle }: { playing: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={playing ? 'Silenciar música' : 'Reproducir música'}
      aria-pressed={playing}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.8 }}
      className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-white/85 text-gold shadow-card backdrop-blur"
    >
      <span className="flex h-4 items-end gap-[3px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-current"
            animate={playing ? { height: ['30%', '100%', '45%', '80%', '30%'] } : { height: '30%' }}
            transition={playing ? { duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        ))}
      </span>
      {!playing && <span className="absolute h-[2px] w-7 rotate-45 rounded bg-current" aria-hidden />}
    </motion.button>
  );
}
