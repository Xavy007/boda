import ExcelJS from 'exceljs';
import { prisma } from '../lib/prisma.js';

const STATUS_LABEL = { PENDIENTE: 'Pendiente', CONFIRMADO: 'Confirmado', RECHAZADO: 'No asiste' } as const;

function styleHeader(sheet: ExcelJS.Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9CAF88' } };
  header.alignment = { vertical: 'middle' };
  header.height = 22;
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };
}

export async function buildExportWorkbook(): Promise<Buffer> {
  const invitations = await prisma.invitation.findMany({ orderBy: { familyName: 'asc' } });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Invitación de boda';
  wb.created = new Date();

  const summary = wb.addWorksheet('Familias');
  summary.columns = [
    { header: 'Familia', key: 'family', width: 30 },
    { header: 'Estado', key: 'status', width: 14 },
    { header: 'Cupos', key: 'max', width: 8 },
    { header: 'Asisten', key: 'count', width: 9 },
    { header: 'Confirmó', key: 'respondent', width: 30 },
    { header: 'Restricciones alimentarias', key: 'diet', width: 36 },
    { header: 'Teléfono', key: 'phone', width: 16 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Mensaje', key: 'message', width: 50 },
    { header: 'Confirmado el', key: 'confirmedAt', width: 18 },
  ];
  for (const inv of invitations) {
    summary.addRow({
      family: inv.familyName,
      status: STATUS_LABEL[inv.status],
      max: inv.maxGuests,
      count: inv.status === 'CONFIRMADO' ? inv.attendingCount : 0,
      respondent: inv.respondentName ?? '',
      diet: inv.dietaryNotes ?? '',
      phone: inv.contactPhone ?? '',
      email: inv.contactEmail ?? '',
      message: inv.message ?? '',
      confirmedAt: inv.confirmedAt ?? '',
    });
  }
  summary.getColumn('confirmedAt').numFmt = 'dd/mm/yyyy hh:mm';
  styleHeader(summary);

  const confirmedSheet = wb.addWorksheet('Confirmados');
  confirmedSheet.columns = [
    { header: 'Familia', key: 'family', width: 30 },
    { header: 'Confirmó', key: 'respondent', width: 30 },
    { header: 'Personas', key: 'count', width: 10 },
    { header: 'Restricciones alimentarias', key: 'diet', width: 36 },
    { header: 'Teléfono', key: 'phone', width: 16 },
  ];
  let n = 0;
  for (const inv of invitations.filter((i) => i.status === 'CONFIRMADO')) {
    n += inv.attendingCount;
    confirmedSheet.addRow({
      family: inv.familyName,
      respondent: inv.respondentName ?? '',
      count: inv.attendingCount,
      diet: inv.dietaryNotes ?? '',
      phone: inv.contactPhone ?? '',
    });
  }
  confirmedSheet.addRow({ family: 'TOTAL', count: n }).font = { bold: true };
  styleHeader(confirmedSheet);

  const totals = wb.addWorksheet('Resumen');
  const confirmed = invitations.filter((i) => i.status === 'CONFIRMADO');
  totals.addRows([
    ['Invitaciones', invitations.length],
    ['Confirmadas', confirmed.length],
    ['No asisten', invitations.filter((i) => i.status === 'RECHAZADO').length],
    ['Pendientes', invitations.filter((i) => i.status === 'PENDIENTE').length],
    ['Personas que asisten', n],
    ['Cupos asignados', invitations.reduce((a, i) => a + i.maxGuests, 0)],
  ]);
  totals.getColumn(1).width = 26;
  totals.getColumn(1).font = { bold: true };

  return Buffer.from(await wb.xlsx.writeBuffer());
}
