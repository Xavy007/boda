import { IconHeart, ITINERARY_ICONS } from '@/components/Icons';
import { SectionHeading } from '@/components/Ornaments';
import { Stagger, StaggerItem } from '@/components/Reveal';
import type { ItineraryItem } from '@/lib/types';

/** 8 · Itinerario del día */
export function Itinerary({ items }: { items: ItineraryItem[] }) {
  if (!items.length) return null;

  return (
    <section className="bg-sage/10 px-6 py-24 sm:py-32" aria-label="Itinerario">
      <SectionHeading eyebrow="El gran día" title="Itinerario" />
      <Stagger as="ol" className="relative mx-auto mt-14 max-w-md" stagger={0.14}>
        <span className="absolute bottom-6 left-[83px] top-6 border-l border-dashed border-gold/50" aria-hidden />
        {items.map((item, i) => {
          const Icon = ITINERARY_ICONS[item.icon] ?? IconHeart;
          return (
            <StaggerItem as="li" key={i} className="relative flex items-center gap-4 py-4">
              <span className="w-[54px] shrink-0 text-right font-serif text-xl tabular-nums text-ink">{item.time}</span>
              <span className="relative z-10 grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full border border-gold/40 bg-ivory text-gold shadow-card">
                <Icon className="h-6 w-6" />
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-[1.35rem] leading-tight text-ink">{item.title}</span>
                {item.description && <span className="mt-0.5 block text-sm text-ink/60">{item.description}</span>}
              </span>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
