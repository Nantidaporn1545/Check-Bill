import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import Papa from 'papaparse';
import { MOCK_HOUSING_RECORDS, DEFAULT_SHEET_CONFIG } from './src/data/mockData.js';
import { HousingAllowanceRecord, BillStatus } from './src/types.js';
import { formatThaiBEDate, parseThaiAmount } from './src/utils/formatters.js';
import {
  normalizeColumnKey,
  normalizeBillStatus,
  parseCsvToRecords,
  getCandidateCsvUrls,
  isHtmlContent,
} from './src/utils/csvParser.js';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const STORE_FILE = path.join(process.cwd(), 'data', 'storedState.json');

// Ensure data dir exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  try {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
  } catch (e) {
    console.warn('Could not create data dir:', e);
  }
}

// Memory cache & persistent storage for records and config
let cachedRecords: HousingAllowanceRecord[] = [...MOCK_HOUSING_RECORDS];
let currentSheetConfig = { ...DEFAULT_SHEET_CONFIG };

// Load state from disk if exists
try {
  if (fs.existsSync(STORE_FILE)) {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.records && Array.isArray(parsed.records) && parsed.records.length > 0) {
      cachedRecords = parsed.records;
    }
    if (parsed.config) {
      currentSheetConfig = parsed.config;
    }
  }
} catch (e) {
  console.warn('Failed to load stored state file:', e);
}

function saveStateToDisk() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify({
      config: currentSheetConfig,
      records: cachedRecords,
      updatedAt: new Date().toISOString()
    }, null, 2));
  } catch (e) {
    console.warn('Failed to save state to disk:', e);
  }
}

// Fetch CSV with multi-candidate fallbacks
async function fetchCsvFromGoogleSheet(sheetUrl: string): Promise<string | null> {
  const candidates = getCandidateCsvUrls(sheetUrl);

  for (const candidateUrl of candidates) {
    try {
      console.log(`Attempting Google Sheet CSV fetch from: ${candidateUrl}`);
      const response = await fetch(candidateUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/csv,text/plain,application/csv,*/*',
        },
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.trim() && !isHtmlContent(text)) {
          console.log(`Successfully fetched Google Sheet CSV from: ${candidateUrl}`);
          return text;
        }
      }
    } catch (e) {
      console.warn(`Candidate fetch error (${candidateUrl}):`, e);
    }
  }

  return null;
}

// Helper to auto-sync from Google Sheet URL
async function fetchLatestFromGoogleSheet(sheetUrl: string): Promise<HousingAllowanceRecord[] | null> {
  try {
    const rawCsv = await fetchCsvFromGoogleSheet(sheetUrl);
    if (!rawCsv) return null;

    const newRecords = parseCsvToRecords(rawCsv);
    if (newRecords.length > 0) {
      cachedRecords = newRecords;
      currentSheetConfig.lastSyncTime = new Date().toISOString();
      currentSheetConfig.status = 'connected';
      saveStateToDisk();
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

// API: Get current records & sheet config (Live fetches Google Sheet if connected, falls back to cached records if live fetch fails)
app.get('/api/sheets/data', async (req, res) => {
  if (currentSheetConfig.isCustom && currentSheetConfig.sheetUrl) {
    const liveRecords = await fetchLatestFromGoogleSheet(currentSheetConfig.sheetUrl);
    if (liveRecords && liveRecords.length > 0) {
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
      console.log(`Fetching Google Sheet from URL: ${sheetUrl}`);
      const fetchedCsv = await fetchCsvFromGoogleSheet(sheetUrl);
      if (!fetchedCsv) {
        return res.status(400).json({
          error: `ไม่สามารถเข้าถึง Google Sheet ได้ กรุณาตรวจสอบว่าคุณเลือก "แชร์" -> "ทุกคนที่มีลิงก์" (Anyone with the link) หรือเลือก ไฟล์ -> แชร์ -> เผยแพร่ไปยังเว็บ (Publish to Web) แล้ว หรือลองใช้แท็บ "วางข้อความ / อัปโหลด CSV" เพื่อเลือกไฟล์ตรงได้ทันที`,
        });
      }
      rawCsv = fetchedCsv;
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

    // Update state & persist to disk
    cachedRecords = newRecords;
    currentSheetConfig = {
      sheetUrl: sheetUrl || currentSheetConfig.sheetUrl,
      sheetId: sheetUrl ? (sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || 'custom') : 'custom',
      sheetName: 'Google Sheets (Live Connected)',
      isCustom: true,
      lastSyncTime: new Date().toISOString(),
      status: 'connected',
    };
    saveStateToDisk();

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
  saveStateToDisk();
  res.json({
    success: true,
    message: 'รีเซ็ตข้อมูลเป็นชุดตัวอย่างมาตรฐานเรียบร้อย',
    config: currentSheetConfig,
    records: cachedRecords,
  });
});

// API: Update record bill status or receipt
app.post('/api/sheets/update-record', (req, res) => {
  try {
    const { recordId, newStatus, receiptUrl, note } = req.body;
    cachedRecords = cachedRecords.map((r) => {
      if (r.id === recordId) {
        return {
          ...r,
          billStatus: newStatus || r.billStatus,
          receiptUrl: receiptUrl !== undefined ? receiptUrl : r.receiptUrl,
          note: note !== undefined ? note : r.note,
          lastUpdated: new Date().toISOString(),
        };
      }
      return r;
    });
    saveStateToDisk();
    res.json({ success: true, records: cachedRecords });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to update record' });
  }
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

export default app;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  startServer();
}
