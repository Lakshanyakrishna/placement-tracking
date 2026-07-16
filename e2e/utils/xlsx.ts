import ExcelJS from 'exceljs';

// Header labels must match STUDENT_COLUMNS' `label` values exactly
// (src/modules/imports/services/students-import.service.ts) — the backend's
// ExcelParserEngine matches header cells against column *label*, not *key*.
const HEADER_ROW = ['Roll Number', 'Name', 'Email', 'Contact Phone', 'Branch Code', 'Section Code', 'Group Name'];

export interface StudentImportRow {
  rollNumber: string;
  name: string;
  email: string;
  contactPhone?: string;
  branchCode: string;
  sectionCode: string;
  groupName: string;
}

export async function buildStudentsWorkbook(rows: StudentImportRow[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');
  sheet.addRow(HEADER_ROW);
  for (const row of rows) {
    sheet.addRow([row.rollNumber, row.name, row.email, row.contactPhone ?? '', row.branchCode, row.sectionCode, row.groupName]);
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** A workbook missing a required column header entirely, to exercise the parser's own error path. */
export async function buildMissingColumnWorkbook(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');
  // Omits "Email", a required column.
  sheet.addRow(['Roll Number', 'Name', 'Contact Phone', 'Branch Code', 'Section Code', 'Group Name']);
  sheet.addRow(['TEST9001', 'Nobody', '', 'AI&DS', 'IV-AI&DS-A', 'Group 1']);
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/** A well-formed workbook (all required headers present) whose one row references a
 * branch code that doesn't exist in the seeded DB — exercises row-level validation
 * errors rather than the parser's structural "missing column" error. */
export async function buildInvalidRowWorkbook(row: StudentImportRow): Promise<Buffer> {
  return buildStudentsWorkbook([row]);
}
