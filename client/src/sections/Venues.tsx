import { useState } from 'react';
import { IconChurch, IconCheers, IconClock, IconPin } from '@/components/Icons';
import { SectionHeading } from '@/components/Ornaments';
import { Reveal } from '@/components/Reveal';
import { timeOf } from '@/lib/format';
import type { PublicEvent, Venue } from '@/lib/types';

function directionsUrl(v: Venue) {
  if (v.lat != null && v.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lng}`;
  if (v.mapsUrl) return v.mapsUrl;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(v.address)}`;
}

function embedUrl(v: Venue) {
  const q = v.lat != null && v.lng != null ? `${v.lat},${v.lng}` : encodeURIComponent(`${v.name}, ${v.address}`);
  return `https://maps.google.com/maps?q=${q}&z=16&output=embed`;
}

/** Mapa embebido; loading="lazy" evita que cuente en la carga inicial. */
function MapEmbed({ venue }: { venue: Venue }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-2xl bg-paper ring-1 ring-ink/5">
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center text-gold" aria-hidden>
          <IconPin className="h-8 w-8 animate-pulse" />
        </div>
      )}
      <iframe
        title={`Mapa: ${venue.name}`}
        src={embedUrl(venue)}
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
    </div>
  );
}

function VenueCard({ label, venue, time, icon, delay }: { label: string; venue: Venue; time?: string | null; icon: JSX.Element; delay: number }) {
  return (
    <Reveal delay={delay} from="up" className="card p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sage/15 text-sage">{icon}</span>
        <p className="eyebrow">{label}</p>
      </div>
      <h3 className="mt-5 font-serif text-[1.9rem] leading-tight text-ink">{venue.name}</h3>
      {time && (
        <p className="mt-3 flex items-center gap-2 text-[15px] text-ink/75">
          <IconClock className="h-5 w-5 text-gold" /> {time} hrs
        </p>
      )}
      <p className="mt-2 flex items-start gap-2 text-[15px] leading-relaxed text-ink/75">
        <IconPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" /> {venue.address}
      </p>
      <MapEmbed venue={venue} />
      <a href={directionsUrl(venue)} target="_blank" rel="noopener noreferrer" className="btn-primary mt-5 w-full">
        <IconPin className="h-5 w-5" /> Cómo llegar
      </a>
    </Reveal>
  );
}

/** 7 · Ceremonia y recepción */
export function Venues({ event }: { event: PublicEvent }) {
  return (
    <section className="px-5 py-24 sm:py-32" aria-label="Ceremonia y recepción">
      <SectionHeading eyebrow="Dónde y cuándo" title="Ceremonia & Recepción" />
      <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
        <VenueCard
          label="Ceremonia"
          venue={event.ceremony}
          time={timeOf(event.eventDate, event.timezone)}
          icon={<IconChurch />}
          delay={0}
        />
        <VenueCard label="Recepción" venue={event.reception} time={event.reception.time} icon={<IconCheers />} delay={0.15} />
      </div>
    </section>
  );
}
