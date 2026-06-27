// Export a hive layout to a real .xlsx workbook. exceljs is loaded with a dynamic
// import (like collab.ts loads yjs) so it stays out of the main bundle and only
// downloads when a user actually exports.
import { type PlacedObject } from './territory';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Build an .xlsx workbook of the layout's objects and return it as a Blob. */
export async function toXlsx(
  objects: PlacedObject[],
  typeName: (type: string) => string
): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Hive');

  worksheet.columns = [
    { header: 'Name', key: 'name', width: 20 },
    { header: 'ID', key: 'uid', width: 16 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Furnace', key: 'furnace', width: 10 },
    { header: 'Power', key: 'power', width: 14 },
    { header: 'X', key: 'x', width: 6 },
    { header: 'Y', key: 'y', width: 6 },
    { header: 'Bear traps', key: 'bear', width: 12 },
    { header: 'Primary', key: 'primary', width: 12 },
    { header: 'Backup', key: 'backup', width: 12 }
  ];

  for (const o of objects) {
    const bear = o.bear ?? [];
    const main = o.bearMain ?? [];
    worksheet.addRow({
      name: o.name ?? '',
      uid: o.uid ?? '',
      type: typeName(o.type),
      furnace: o.furnace ?? '',
      power: o.power ?? '',
      x: o.x,
      y: o.y,
      bear: bear.join(', '),
      primary: main.join(', '),
      backup: bear.filter((b) => !main.includes(b)).join(', ')
    });
  }

  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  const buf = await workbook.xlsx.writeBuffer();
  return new Blob([buf], { type: XLSX_MIME });
}
