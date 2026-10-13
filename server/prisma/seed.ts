/**
 * Seed: 1 admin, configuración del evento de ejemplo y 5 invitaciones de prueba.
 * Las fotos no van en la base de datos: ver `npm run fotos` en la raíz.
 *
 * Ejecutar: npm run db:seed
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();
const TZ_OFFSET = '-04:00'; // America/La_Paz (sin horario de verano)
const CLIENT_URL = (process.env.CLIENT_URL ?? 'http://localhost:5173').replace(/\/+$/, '');

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  // Admin
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'novios@ejemplo.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'CambiaEstaClave2027!';
  await prisma.adminUser.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: await bcrypt.hash(password, 12) },
  });
  console.log(`👤 Admin: ${email}`);

  // Configuración del evento
  const settings = {
    partnerOneName: 'Valentina',
    partnerTwoName: 'Mateo',
    eventDate: new Date(`2027-03-20T16:00:00${TZ_OFFSET}`),
    eventEndDate: new Date(`2027-03-21T02:00:00${TZ_OFFSET}`),
    timezone: 'America/La_Paz',
    ceremonyName: 'Parroquia San Miguel',
    ceremonyAddress: 'Calle Montenegro esq. Av. Ballivián, San Miguel, La Paz',
    ceremonyLat: -16.5408,
    ceremonyLng: -68.0789,
    ceremonyMapsUrl: 'https://maps.google.com/?q=-16.5408,-68.0789',
    receptionName: 'Jardín Las Acacias',
    receptionAddress: 'Av. Costanera Nº 120, Mallasa, La Paz',
    receptionTime: '19:00',
    receptionLat: -16.5698,
    receptionLng: -68.0889,
    receptionMapsUrl: 'https://maps.google.com/?q=-16.5698,-68.0889',
    dressCode: 'Formal elegante',
    dressCodeNote: 'Te sugerimos tonos tierra, salvia y neutros. Reservamos el blanco para la novia 🤍',
    dressCodeColors: ['#9CAF88', '#C9A96E', '#D8C3A5', '#8E8D8A', '#E7DFD3', '#5C6B54'],
    mainPhrase: 'Dos almas, un mismo camino',
    quotePhrase: 'El amor no consiste en mirarse el uno al otro, sino en mirar juntos en la misma dirección.',
    quoteAuthor: 'Antoine de Saint-Exupéry',
    closingPhrase: 'Gracias por ser parte de nuestra historia. ¡Te esperamos para celebrar!',
    rsvpDeadline: new Date(`2027-02-28T23:59:00${TZ_OFFSET}`),
    giftInfo: {
      message:
        'Tu presencia es nuestro mejor regalo. Si deseas hacernos un obsequio, aquí tienes nuestros datos para una transferencia.',
      bankName: 'Banco Nacional de Bolivia',
      accountHolder: 'Valentina Rojas',
      accountNumber: '1000-2345-6789',
      accountType: 'Caja de ahorro en Bs.',
      documentId: 'CI 1234567 LP',
    },
    couplePhone: '+591 70000000',
    whatsappTemplate:
      'Hola {nombre_familia} 💍 Con mucha alegría queremos invitarlos a nuestra boda. Este es su link personal (solo funciona en su celular, por favor no lo compartan): {link}',
    palette: { ivory: '#FAF7F2', sage: '#9CAF88', gold: '#C9A96E', ink: '#3A3A3A' },
    musicUrl: null,
    storyItems: [
      {
        date: 'Mayo 2019',
        title: 'Nos conocimos',
        text: 'Un café que se volvió una conversación de cinco horas. Ninguno de los dos quería que terminara.',
      },
      {
        date: 'Febrero 2020',
        title: 'Nuestra primera cita',
        text: 'Una caminata por el Prado, helado en mano y la certeza de que algo especial estaba comenzando.',
      },
      {
        date: 'Julio 2023',
        title: 'Nuestro primer viaje',
        text: 'Atardeceres en el Salar de Uyuni: el cielo bajo nuestros pies y un futuro por delante.',
      },
      {
        date: 'Diciembre 2025',
        title: '¡Dijo que sí!',
        text: 'Frente al lago Titicaca, con el corazón a mil y un anillo escondido en la mochila.',
      },
    ],
    itinerary: [
      { time: '16:00', title: 'Ceremonia religiosa', description: 'Parroquia San Miguel', icon: 'church' },
      { time: '17:30', title: 'Sesión de fotos', description: 'Mientras ustedes se trasladan', icon: 'camera' },
      { time: '19:00', title: 'Recepción y cóctel', description: 'Jardín Las Acacias', icon: 'cheers' },
      { time: '20:30', title: 'Cena', icon: 'dinner' },
      { time: '22:00', title: 'Primer baile y fiesta', icon: 'music' },
      { time: '00:00', title: 'Torta y sorpresas', icon: 'cake' },
      { time: '02:00', title: 'Fin de la celebración', icon: 'moon' },
    ],
  };
  await prisma.eventSettings.upsert({ where: { id: 1 }, update: settings, create: { id: 1, ...settings } });
  console.log('⚙️  Configuración del evento lista');

  // Invitaciones de prueba (solo si no existen)
  const testFamilies = [
    { familyName: 'Pérez Gutiérrez', contactPhone: '70011111', contactEmail: 'perez@ejemplo.com', maxGuests: 4 },
    { familyName: 'Mamani Quispe', contactPhone: '70022222', maxGuests: 3 },
    { familyName: 'Rodríguez', contactPhone: '70033333', maxGuests: 2 },
    { familyName: 'Fernández López', contactPhone: '70044444', contactEmail: 'fernandez@ejemplo.com', maxGuests: 5 },
    { familyName: 'Vargas', contactPhone: '70055555', maxGuests: 1 },
  ];
  for (const fam of testFamilies) {
    const existing = await prisma.invitation.findFirst({ where: { familyName: fam.familyName } });
    const inv = existing ?? (await prisma.invitation.create({ data: { ...fam, token: nanoid(36) } }));
    console.log(`💌 Familia ${inv.familyName.padEnd(18)} → ${CLIENT_URL}/i/${inv.token}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
