import { getFingerprint } from '@/lib/fingerprint';
import type { InvitationData } from '@/lib/types';
import { IconCalendar } from './Icons';

type Calendar = InvitationData['calendar'];

// El .ics pasa por el mismo control de dispositivo: se agrega el fingerprint por si se perdió la cookie
async function downloadIcs(calendar: Calendar) {
  const fp = await getFingerprint();
  window.location.href = fp ? `${calendar.ics}?fp=${fp}` : calendar.ics;
}

/**
 * Al confirmar, abre directamente el calendario que corresponde al dispositivo:
 * Android → Google Calendar; iPhone, Mac y computadoras → .ics (abre "Agregar evento").
 * El navegador no permite agregarlo sin que la persona lo acepte; si bloquea la ventana,
 * los botones siguen disponibles.
 */
export function autoAddToCalendar(calendar: Calendar) {
  if (/android/i.test(navigator.userAgent)) {
    window.open(calendar.google, '_blank', 'noopener');
  } else {
    void downloadIcs(calendar);
  }
}

export function CalendarButtons({ calendar }: { calendar: Calendar }) {
  return (
    <div className="w-full">
      <p className="eyebrow mb-3 flex items-center justify-center gap-2">
        <IconCalendar className="h-4 w-4" /> Agrégalo a tu calendario
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <a href={calendar.google} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
          Google Calendar
        </a>
        <button type="button" onClick={() => downloadIcs(calendar)} className="btn-outline w-full">
          Apple / iPhone
        </button>
        <a href={calendar.outlook} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
          Outlook
        </a>
      </div>
      <p className="mt-2 text-center text-xs text-ink/50">Incluye la ubicación y un recordatorio un día antes.</p>
    </div>
  );
}
