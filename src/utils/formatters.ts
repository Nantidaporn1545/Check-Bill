// Helper utilities for Thai Date (Buddhist Era พ.ศ.) and Currency formatting

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตูลายน', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Formats any date input (CE 2026-07-28, BE 28/07/2569, 28/7/2569, 2569-07-28, etc.)
 * into Thai Buddhist Era format (พุทธศักราช - พ.ศ.) e.g. "28 ก.ค. 2569"
 */
export function formatThaiBEDate(rawDate: string | undefined | null): string {
  if (!rawDate) return '-';
  const str = String(rawDate).trim();
  if (!str) return '-';

  // If string is already formatted with Thai month name e.g. "28 ก.ค. 2569"
  if (/[ก-ฮ]/.test(str)) {
    return str;
  }

  // Handle slash or dash separated dates e.g. "2026-07-28", "28/07/2569", "28/7/2026", "2569-07-28"
  const parts = str.split(/[/-]/).map((p) => p.trim());
  if (parts.length === 3) {
    const p1 = parseInt(parts[0], 10);
    const p2 = parseInt(parts[1], 10);
    const p3 = parseInt(parts[2], 10);

    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
      let day = 1;
      let month = 1;
      let year = 2026;

      if (p1 > 1000) {
        // YYYY-MM-DD or YYYY/MM/DD
        year = p1;
        month = p2;
        day = p3;
      } else if (p3 > 1000) {
        // DD/MM/YYYY or DD-MM-YYYY
        day = p1;
        month = p2;
        year = p3;
      } else {
        day = p1;
        month = p2;
        year = p3;
      }

      // Convert year to BE (พ.ศ.) if < 2400
      const yearBE = year < 2400 ? year + 543 : year;
      const monthIdx = Math.max(0, Math.min(11, month - 1));
      const monthName = THAI_MONTHS_SHORT[monthIdx];

      return `${day} ${monthName} ${yearBE}`;
    }
  }

  // Standard JS Date object parsing fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = d.getDate();
    const month = d.getMonth();
    const yearBE = d.getFullYear() + 543;
    return `${day} ${THAI_MONTHS_SHORT[month]} ${yearBE}`;
  }

  return str;
}

/**
 * Cleans and parses raw amount input (from Google Sheets or text) into a float number
 * Strips out currency symbols, 'บาท', commas, etc.
 */
export function parseThaiAmount(rawAmount: any): number {
  if (typeof rawAmount === 'number') {
    return isNaN(rawAmount) ? 0 : rawAmount;
  }
  if (!rawAmount) return 0;

  const cleaned = String(rawAmount)
    .replace(/[฿บาท\s,]/gi, '')
    .trim();

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats amount into Thai Baht currency format e.g. "฿6,500"
 */
export function formatThaiCurrency(amount: number | undefined | null): string {
  const val = parseThaiAmount(amount);
  return `฿${val.toLocaleString('th-TH')}`;
}

/**
 * Safe timestamp converter for sorting dates in both BE and AD format
 */
export function parseDateToTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  const str = String(dateStr).trim();

  // Try extracting year, month, day
  const parts = str.split(/[/-]/).map((p) => p.trim());
  if (parts.length === 3) {
    let p1 = parseInt(parts[0], 10);
    let p2 = parseInt(parts[1], 10);
    let p3 = parseInt(parts[2], 10);

    if (!isNaN(p1) && !isNaN(p2) && !isNaN(p3)) {
      let day = 1;
      let month = 1;
      let year = 2026;

      if (p1 > 1000) {
        year = p1;
        month = p2;
        day = p3;
      } else if (p3 > 1000) {
        day = p1;
        month = p2;
        year = p3;
      }

      // If BE year (> 2400), convert to AD year for Date timestamp
      if (year > 2400) {
        year -= 543;
      }

      return new Date(year, month - 1, day).getTime();
    }
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}
