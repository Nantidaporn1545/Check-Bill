import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Papa from 'papaparse';
import { MOCK_HOUSING_RECORDS, DEFAULT_SHEET_CONFIG } from './src/data/mockData.js';
import { HousingAllowanceRecord, BillStatus } from './src/types.js';
import { formatThaiBEDate, parseThaiAmount } from './src/utils/formatters.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Memory cache for parsed custom sheet records
let cachedRecords: HousingAllowanceRecord[] = [...MOCK_HOUSING_RECORDS];
let currentSheetConfig = { ...DEFAULT_SHEET_CONFIG };

// Helper to normalize Thai column names
function normalizeColumnKey(key: string): string {
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
function normalizeBillStatus(rawStatus: string): BillStatus {
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

// Helper to parse Google Sheets CSV URL
function extractGoogleSheetCsvUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (!url) return '';

  // If user pasted a direct CSV link
  if (url.endsWith('.csv') || url.includes('output=csv')) {
    return url;
  }

  // Handle standard Google Sheets edit or pubhtml link
  // e.g. https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=123
  // e.g. https://docs.google.com/spreadsheets/d/e/2PACX-.../pubhtml
  const pubMatch = url.match(/\/d\/e\/([a-zA-Z0-9-_]+)/);
  if (pubMatch && pubMatch[1]) {
    return `https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub?output=csv`;
  }

  const idMatch = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (idMatch && idMatch[1]) {
    const sheetId = idMatch[1];
    // Extract gid if present
    const gidMatch = url.match(/gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return url;
}

// Helper to convert CSV string into HousingAllowanceRecord array
function parseCsvToRecords(rawCsv: string): HousingAllowanceRecord[] {
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

// Helper to check if fetched string is actually HTML error or login page instead of CSV
function isHtmlContent(str: string): boolean {
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
    trimmed.includes('page not found')
  );
}

// Helper to auto-sync from Google Sheet URL
async function fetchLatestFromGoogleSheet(sheetUrl: string): Promise<HousingAllowanceRecord[] | null> {
  const targetCsvUrl = extractGoogleSheetCsvUrl(sheetUrl);
  if (!targetCsvUrl) return null;

  try {
    const response = await fetch(targetCsvUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    });

    if (!response.ok) return null;
    const rawCsv = await response.text();
    if (!rawCsv.trim() || isHtmlContent(rawCsv)) return null;

    const newRecords = parseCsvToRecords(rawCsv);
    if (newRecords.length > 0) {
      cachedRecords = newRecords;
      currentSheetConfig.lastSyncTime = new Date().toISOString();
      currentSheetConfig.status = 'connected';
      return newRecords;
    }
  } catch (e) {
    console.warn('Failed auto-syncing Google Sheet:', e);
  }
  return null;
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Get current records & sheet config (Live fetches Google Sheet if connected)
app.get('/api/sheets/data', async (req, res) => {
  if (currentSheetConfig.isCustom && currentSheetConfig.sheetUrl) {
    const liveRecords = await fetchLatestFromGoogleSheet(currentSheetConfig.sheetUrl);
    if (liveRecords) {
      return res.json({
        config: currentSheetConfig,
        records: liveRecords,
        totalRecords: liveRecords.length,
        lastSyncTime: currentSheetConfig.lastSyncTime,
      });
    }
  }

  res.json({
    config: currentSheetConfig,
    records: cachedRecords,
    totalRecords: cachedRecords.length,
    lastSyncTime: currentSheetConfig.lastSyncTime || new Date().toISOString(),
  });
});

// API: Parse Google Sheet URL or CSV text
app.post('/api/sheets/parse', async (req, res) => {
  try {
    const { sheetUrl, csvText } = req.body;
    let rawCsv = csvText || '';

    if (!rawCsv && sheetUrl) {
      const targetCsvUrl = extractGoogleSheetCsvUrl(sheetUrl);
      if (!targetCsvUrl) {
        return res.status(400).json({ error: 'รูปแบบ URL Google Sheets ไม่ถูกต้อง' });
      }

      console.log(`Fetching Google Sheet from: ${targetCsvUrl}`);
      const response = await fetch(targetCsvUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });

      if (!response.ok) {
        return res.status(400).json({
          error: `ไม่สามารถเข้าถึง Google Sheet ได้ (HTTP ${response.status}) กรุณาตรวจสอบว่าคุณเปิดสิทธิ์ "ทุกคนที่มีลิงก์สามารถดูได้" (Share with anyone) หรือ "เผยแพร่ไปยังเว็บ" (Publish to Web) แล้ว`,
        });
      }

      rawCsv = await response.text();
    }

    if (!rawCsv.trim()) {
      return res.status(400).json({ error: 'ไม่พบข้อมูล CSV จาก Google Sheet' });
    }

    if (isHtmlContent(rawCsv)) {
      return res.status(400).json({
        error: 'ไม่สามารถอ่านไฟล์ CSV ได้เนื่องจาก Google Sheet ไม่ได้เปิดสิทธิ์สาธารณะ กรุณาเปลี่ยนสิทธิ์การแชร์เป็น "ทุกคนที่มีลิงก์" (Anyone with the link) หรือเลือก "เผยแพร่ไปยังเว็บ" (Publish to Web)',
      });
    }

    const newRecords = parseCsvToRecords(rawCsv);
    if (newRecords.length === 0) {
      return res.status(400).json({ error: 'ไม่สามารถอ่านโครงสร้าง CSV หรือไม่พบแถวข้อมูล' });
    }

    // Update state
    cachedRecords = newRecords;
    currentSheetConfig = {
      sheetUrl: sheetUrl || currentSheetConfig.sheetUrl,
      sheetId: sheetUrl ? (sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || 'custom') : 'custom',
      sheetName: 'Google Sheets (Live Connected)',
      isCustom: true,
      lastSyncTime: new Date().toISOString(),
      status: 'connected',
    };

    return res.json({
      success: true,
      message: `เชื่อมต่อเรียบร้อย ดึงข้อมูลสำเร็จ ${newRecords.length} รายการ`,
      config: currentSheetConfig,
      records: newRecords,
    });
  } catch (err: any) {
    console.error('Error parsing sheet:', err);
    return res.status(500).json({
      error: `เกิดข้อผิดพลาดในการดึงข้อมูล: ${err?.message || 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`,
    });
  }
});

// API: Reset to default sheet data
app.post('/api/sheets/reset', (req, res) => {
  cachedRecords = [...MOCK_HOUSING_RECORDS];
  currentSheetConfig = { ...DEFAULT_SHEET_CONFIG, lastSyncTime: new Date().toISOString() };
  res.json({
    success: true,
    message: 'รีเซ็ตข้อมูลเป็นชุดตัวอย่างมาตรฐานเรียบร้อย',
    config: currentSheetConfig,
    records: cachedRecords,
  });
});

// API: Download Sample CSV Template
app.get('/api/sheets/sample-csv', (req, res) => {
  const sampleCsvText = `วันที่โอน,รายการ,รหัสพนักงาน,ผู้เบิก(ชื่อพนักงาน),เลขทะเบียนรถ(บางรายการที่เบิกค่าน้ำมัน),ไซต์งาน,จำนวนเงินที่โอน,สถานะบิล
2026-07-28,ค่าที่พักประจำเดือน,EMP-1001,สมชาย ใจดี,,ไซต์งานบางนา-ตราด (KM.18),6500,ส่งแล้ว
2026-07-30,เบิกค่าน้ำมันปฏิบัติงาน,EMP-1002,วิภาวี รักชาติ,3กข-4567 กทม,ไซต์งานนิคมมาบตาพุด,2500,รอดำเนินการ
2026-07-29,ค่าที่พักประจำเดือน,EMP-1003,กิตติพงษ์ มั่นคง,,ไซต์งานก่อสร้างรถไฟฟ้า,5500,ยังไม่ส่ง
2026-06-29,เบิกค่าน้ำมันเดินทาง,EMP-1003,กิตติพงษ์ มั่นคง,1กข-8901 เชียงใหม่,ไซต์งานก่อสร้างรถไฟฟ้า,1800,เกินกำหนด
2026-07-25,ค่าเช่าบ้านต่างจังหวัด,EMP-1004,ณัฏฐา วงศ์สว่าง,,สำนักงานโครงการเชียงใหม่,7200,ส่งแล้ว`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="housing_allowance_template.csv"');
  res.send('\uFEFF' + sampleCsvText); // UTF-8 BOM for Excel compatibility
});

async function startServer() {
  // Vite middleware in dev
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Housing Allowance Web Server running on http://localhost:${PORT}`);
  });
}

startServer();
