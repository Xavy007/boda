export function LoadingScreen() {
  return (
    <div className="paper-texture grid min-h-dscreen place-items-center bg-ivory" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-16 w-16">
          <span className="absolute inset-0 animate-ping rounded-full border border-gold/40" />
          <span className="absolute inset-2 rounded-full border border-gold/70" />
          <span className="absolute inset-0 grid place-items-center font-script text-2xl text-gold">♡</span>
        </div>
        <p className="eyebrow">Preparando tu invitación</p>
      </div>
    </div>
  );
}
