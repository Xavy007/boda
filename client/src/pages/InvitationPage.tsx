import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Envelope } from '@/components/Envelope';
import { LoadingScreen } from '@/components/LoadingScreen';
import { MusicToggle } from '@/components/MusicToggle';
import { StatusScreen } from '@/components/StatusScreen';
import { useLockBodyScroll } from '@/hooks/useMediaQuery';
import { api, ApiError } from '@/lib/api';
import { getFingerprint } from '@/lib/fingerprint';
import { applyPalette, shortDate } from '@/lib/format';
import type { AccessErrorKind, InvitationData, PhotosBySection } from '@/lib/types';
import { Closing } from '@/sections/Closing';
import { Countdown } from '@/sections/Countdown';
import { DressCode } from '@/sections/DressCode';
import { Gallery } from '@/sections/Gallery';
import { Gifts } from '@/sections/Gifts';
import { Greeting } from '@/sections/Greeting';
import { Hero } from '@/sections/Hero';
import { Itinerary } from '@/sections/Itinerary';
import { Quote } from '@/sections/Quote';
import { Rsvp } from '@/sections/Rsvp';
import { Story } from '@/sections/Story';
import { Venues } from '@/sections/Venues';

type State =
  | { status: 'loading' }
  | { status: 'error'; kind: AccessErrorKind; contact?: string | null }
  | { status: 'ready'; data: InvitationData; photos: PhotosBySection };

const EMPTY_PHOTOS: PhotosBySection = { HERO: [], HISTORIA: [], GALERIA: [], CIERRE: [] };
const KNOWN_ERRORS: AccessErrorKind[] = ['INVALID', 'DEVICE_LIMIT', 'EXPIRED', 'RATE_LIMITED', 'NETWORK'];

export default function InvitationPage() {
  const { token = '' } = useParams();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [opened, setOpened] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useLockBodyScroll(state.status === 'ready' && !opened);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fp = await getFingerprint();
        const data = await api<InvitationData>(`/api/invitation/${encodeURIComponent(token)}`, {
          headers: fp ? { 'X-Device-Fingerprint': fp } : undefined,
        });
        // Las fotos (guardadas en el disco del servidor) se piden después de validar el acceso
        const photos = await api<PhotosBySection>('/api/photos').catch(() => EMPTY_PHOTOS);
        if (cancelled) return;
        applyPalette(data.event.palette);
        document.title = `${data.event.partnerOneName} & ${data.event.partnerTwoName} · Nuestra boda`;
        setState({ status: 'ready', data, photos });
      } catch (err) {
        if (cancelled) return;
        const code = err instanceof ApiError ? (err.code as AccessErrorKind) : 'NETWORK';
        setState({
          status: 'error',
          kind: KNOWN_ERRORS.includes(code) ? code : 'NETWORK',
          contact: err instanceof ApiError ? (err.body.contact as string | null) : null,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const musicUrl = state.status === 'ready' ? state.data.event.musicUrl : null;

  useEffect(() => {
    if (!musicUrl) return;
    const audio = new Audio(musicUrl);
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = 0.55;
    audio.addEventListener('play', () => setPlaying(true));
    audio.addEventListener('pause', () => setPlaying(false));
    audioRef.current = audio;
    // Pausa la música si el usuario cambia de app/pestaña
    const onVisibility = () => document.hidden && audio.pause();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      audio.pause();
      document.removeEventListener('visibilitychange', onVisibility);
      audioRef.current = null;
    };
  }, [musicUrl]);

  // Se llama dentro del toque al sello: los navegadores solo permiten audio tras un gesto
  const startMusic = useCallback(() => {
    audioRef.current?.play().catch(() => setPlaying(false));
  }, []);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) audio.play().catch(() => undefined);
    else audio.pause();
  };

  if (state.status === 'loading') return <LoadingScreen />;
  if (state.status === 'error') return <StatusScreen kind={state.kind} contactUrl={state.contact} />;

  const { data, photos } = state;
  const { event, invitation } = data;

  return (
    <>
      {!opened && (
        <Envelope
          partnerOne={event.partnerOneName}
          partnerTwo={event.partnerTwoName}
          familyName={invitation.familyName}
          dateLabel={shortDate(event.eventDate, event.timezone)}
          onStart={startMusic}
          onFinish={() => setOpened(true)}
        />
      )}

      <main aria-hidden={!opened}>
        <Hero event={event} photo={photos.HERO[0]} revealed={opened} />
        <Greeting familyName={invitation.familyName} event={event} />
        <Countdown event={event} />
        <Story items={event.storyItems} photos={photos.HISTORIA} />
        <Gallery photos={photos.GALERIA} />
        <Quote phrase={event.quotePhrase} author={event.quoteAuthor} photo={photos.HERO[1] ?? photos.GALERIA[0]} />
        <Venues event={event} />
        <Itinerary items={event.itinerary} />
        <DressCode event={event} />
        <Gifts gift={event.giftInfo} />
        <Rsvp token={token} data={data} onUpdate={(next) => setState({ status: 'ready', data: next, photos })} />
        <Closing event={event} photo={photos.CIERRE[0]} />
      </main>

      {opened && musicUrl && <MusicToggle playing={playing} onToggle={toggleMusic} />}
    </>
  );
}
