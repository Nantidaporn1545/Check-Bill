import Papa from 'papaparse';
import { HousingAllowanceRecord, BillStatus } from '../types';
import { formatThaiBEDate, parseThaiAmount } from './formatters';

// Helper to normalize Thai column names
export function normalizeColumnKey(key: string): string {
  const clean = key.trim().toLowerCase();
  if (clean.includes('ทะเบียน') || clean.includes('รถ') || clean.includes('plate') || clean.includes('vehicle')) return 'vehiclePlate';
  if (clean.includes('ผู้เบิก') || (clean.includes('ชื่อ') && clean.includes('พนักงาน'))) return 'fullName';
  if (clean.includes('รหัส') || clean.includes('emp') || clean.includes('code')) return 'employeeId';
  if (clean.includes('ชื่อ') && !clean.includes('นามสกุล')) return 'firstName';
  if (clean.includes('นามสกุล') || clean.includes('surname') || clean.includes('last')) return 'lastName';
  if (clean.includes('จำนวนเงิน') || clean.includes('ยอดเงิน') || clean.includes('amount') || (clean.includes('เงิน') && !clean.includes('เบิก'))) return 'amount';
  if (clean.includes('วันที่') || clean.includes('date') || clean === 'โอน' || clean.includes('วันที่โอน') || clean.includes('โอนเมื่อ')) return 'transferDate';
  if (clean.includes('สวัสดิการ') || clean.includes('รายการ') || clean.includes('item') || clean.includes('welfare')) return 'welfareItem';
  if (clean.includes('ไซส์') || clean.includes('ไซต์') || clean.includes('site') || clean.includes('โครงการ') || clean.includes('สถานที่')) return 'siteLocation';
  if (clean.includes('สถานะ') || clean.includes('บิล') || clean.includes('status')) return 'billStatus';
  if (clean.includes('แผนก') || clean.includes('dept') || clean.includes('department')) return 'department';
  if (clean.includes('ตำแหน่ง') || clean.includes('position')) return 'position';
  if (clean.includes('หมายเหตุ') || clean.includes('note') || clean.includes('remark')) return 'note';
  return clean;
}

// Normalize Bill Status to standard 4 Thai types
export function normalizeBillStatus(rawStatus: string): BillStatus {
  if (!rawStatus) return 'ยังไม่ส่ง';
  const str = String(rawStatus).trim();

  if (str === 'ส่งแล้ว' || str === 'ยังไม่ส่ง' || str === 'รอดำเนินการ' || str === 'เกินกำหนด') {
    return str as BillStatus;
  }

  const lower = str.toLowerCase();

  if (
    str.includes('ส่งแล้ว') ||
    str.includes('เรียบร้อย') ||
    str.includes('อนุมัติ') ||
    str.includes('สำเร็จ') ||
    str.includes('โอนแล้ว') ||
    str.includes('จ่ายแล้ว') ||
    str.includes('เสร็จ') ||
    str.includes('รับแล้ว') ||
    lower.includes('submitted') ||
    lower.includes('done') ||
    lower.includes('approved') ||
    lower.includes('paid') ||
    lower.includes('complete') ||
    lower.includes('success')
  ) {
    return 'ส่งแล้ว';
  }

  if (
    str.includes('รอ') ||
    str.includes('ดำเนินการ') ||
    str.includes('ตรวจ') ||
    str.includes('กำลัง') ||
    lower.includes('pending') ||
    lower.includes('process') ||
    lower.includes('waiting')
  ) {
    return 'รอดำเนินการ';
  }

  if (
    str.includes('เกิน') ||
    str.includes('ช้า') ||
    str.includes('ค้าง') ||
    str.includes('หมดอายุ') ||
    lower.includes('overdue') ||
    lower.includes('late') ||
    lower.includes('expire')
  ) {
    return 'เกินกำหนด';
  }

  if (
    str.includes('ยัง') ||
    str.includes('ไม่') ||
    lower.includes('not') ||
    lower.includes('unsubmitted')
  ) {
    return 'ยังไม่ส่ง';
  }

  return 'ยังไม่ส่ง';
}

// Helper to convert CSV string into HousingAllowanceRecord array
export function parseCsvToRecords(rawCsv: string): HousingAllowanceRecord[] {
  const parsed = Papa.parse<Record<string, string>>(rawCsv, {
    header: true,
    skipEmptyLines: true,
  });

  if (!parsed.data || parsed.data.length === 0) return [];

  return parsed.data.map((row, index) => {
    const normalizedRow: Record<string, string> = {};
    Object.keys(row).forEach((colKey) => {
      const normKey = normalizeColumnKey(colKey);
      normalizedRow[normKey] = row[colKey] ? String(row[colKey]).trim() : '';
    });

    const empId = normalizedRow['employeeId'] || `EMP-${1000 + index}`;
    
    let fName = normalizedRow['firstName'];
    let lName = normalizedRow['lastName'];
    if (normalizedRow['fullName']) {
      const parts = normalizedRow['fullName'].split(/\s+/);
      fName = parts[0] || 'พนักงาน';
      lName = parts.slice(1).join(' ') || 'ทั่วไป';
    }
    if (!fName) fName = 'พนักงาน';
    if (!lName) lName = 'ทั่วไป';

    const amountVal = parseThaiAmount(normalizedRow['amount']);
    const rawDate = normalizedRow['transferDate'] || new Date().toISOString().split('T')[0];
    const transferDateVal = formatThaiBEDate(rawDate);
    const status = normalizeBillStatus(normalizedRow['billStatus']);

    return {
      id: `SHEET-REC-${index + 1}`,
      employeeId: empId.toUpperCase(),
      firstName: fName,
      lastName: lName,
      department: normalizedRow['department'] || 'ฝ่ายปฏิบัติการ',
      position: normalizedRow['position'] || 'พนักงาน',
      transferDate: transferDateVal,
      welfareItem: normalizedRow['welfareItem'] || 'ค่าที่พักประจำเดือน',
      siteLocation: normalizedRow['siteLocation'] || 'ไซต์งานทั่วไป',
      vehiclePlate: normalizedRow['vehiclePlate'] || '',
      amount: amountVal,
      billStatus: status,
      note: normalizedRow['note'] || '',
      lastUpdated: new Date().toISOString(),
    };
  });
}

// Helper to parse candidate Google Sheets CSV URLs
export function getCandidateCsvUrls(inputUrl: string): string[] {
  let url = inputUrl.trim();
  if (!url) return [];

  const candidates: string[] = [];

  if (url.endsWith('.csv') || url.includes('output=csv') || url.includes('gviz/tq')) {
    candidates.push(url);
  }

  const pubMatch = url.match(/\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && pubMatch[1]) {
    const pubId = pubMatch[1];
    const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
    const gidParam = gidMatch ? `&gid=${gidMatch[1]}` : '';
    candidates.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv${gidParam}`);
    candidates.push(`https://docs.google.com/spreadsheets/d/e/${pubId}/pub?output=csv`);
  }

  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    const sheetId = idMatch[1];
    const gidMatch = url.match(/[?&#]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : null;

    if (gid) {
      candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`);
    }
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`);

    if (gid) {
      candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`);
    }
    candidates.push(`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`);

    candidates.push(`https://drive.google.com/uc?export=download&id=${sheetId}`);
  }

  if (candidates.length === 0) {
    candidates.push(url);
  }

  return Array.from(new Set(candidates));
}

export function isHtmlContent(str: string): boolean {
  if (!str) return false;
  const trimmed = str.trim().toLowerCase();
  return (
    trimmed.startsWith('<!doctype') ||
    trimmed.startsWith('<html') ||
    trimmed.startsWith('the page') ||
    trimmed.includes('<html') ||
    trimmed.includes('<head') ||
    trimmed.includes('google drive') ||
    trimmed.includes('sign in') ||
    trimmed.includes('page not found') ||
    trimmed.includes('accounts.google.com')
  );
}

// Client-side fallback fetcher for browser environment (e.g. static hosting like Vercel)
export async function fetchCsvClientSide(sheetUrl: string): Promise<string | null> {
  const candidates = getCandidateCsvUrls(sheetUrl);

  for (const candidateUrl of candidates) {
    try {
      const response = await fetch(candidateUrl);
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim() && !isHtmlContent(text)) {
          return text;
        }
      }
    } catch (e) {
      // Ignore CORS / network errors for individual candidate endpoints and keep trying
    }
  }

  return null;
}
