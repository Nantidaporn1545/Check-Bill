import { HousingAllowanceRecord, EmployeeInfo, SheetConfig } from '../types';
import { MOCK_HOUSING_RECORDS, DEFAULT_SHEET_CONFIG } from '../data/mockData';
import { parseDateToTimestamp } from '../utils/formatters';
import { fetchCsvClientSide, parseCsvToRecords, isHtmlContent } from '../utils/csvParser';

const LOCAL_STORAGE_RECORDS_KEY = 'housing_allowance_records_v1';
const LOCAL_STORAGE_CONFIG_KEY = 'housing_allowance_config_v1';

// Save local overrides or uploads to localStorage
export function saveLocalRecords(records: HousingAllowanceRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save records to localStorage', e);
  }
}

export function saveLocalConfig(config: SheetConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
}

export function getLocalRecords(): HousingAllowanceRecord[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECORDS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getLocalConfig(): SheetConfig | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

// Fetch all records & sheet config from API
export async function fetchSheetData(): Promise<{ config: SheetConfig; records: HousingAllowanceRecord[] }> {
  try {
    const response = await fetch('/api/sheets/data');
    const contentType = response.headers.get('content-type');
    if (response.ok && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (data && data.records && data.records.length > 0) {
        saveLocalRecords(data.records);
        if (data.config) saveLocalConfig(data.config);
        return {
          config: data.config || DEFAULT_SHEET_CONFIG,
          records: data.records,
        };
      }
    }
  } catch (err) {
    console.warn('Backend API unavailable, falling back to local storage:', err);
  }

  const localRecords = getLocalRecords();
  const localConfig = getLocalConfig();

  if (localRecords && localRecords.length > 0) {
    return {
      config: localConfig || DEFAULT_SHEET_CONFIG,
      records: localRecords,
    };
  }

  return {
    config: localConfig || DEFAULT_SHEET_CONFIG,
    records: MOCK_HOUSING_RECORDS,
  };
}

// Connect & parse a Google Sheet URL
export async function syncCustomSheetUrl(sheetUrl: string, csvText?: string): Promise<{ success: boolean; config: SheetConfig; records: HousingAllowanceRecord[]; message: string }> {
  // 1. Try server endpoint first
  try {
    const response = await fetch('/api/sheets/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl, csvText }),
    });

    const contentType = response.headers.get('content-type');
    if (response.ok && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (data && data.records) {
        saveLocalRecords(data.records);
        saveLocalConfig(data.config);
        return {
          success: true,
          config: data.config,
          records: data.records,
          message: data.message || 'เชื่อมต่อข้อมูลเรียบร้อย',
        };
      }
    }
  } catch (serverErr) {
    console.warn('Backend API unavailable, falling back to client-side parsing:', serverErr);
  }

  // 2. Client-side fallback parsing (for Vercel static hosting or offline mode)
  try {
    let rawCsv = csvText;

    if (!rawCsv && sheetUrl) {
      rawCsv = await fetchCsvClientSide(sheetUrl) || undefined;
    }

    if (!rawCsv || isHtmlContent(rawCsv)) {
      throw new Error('ไม่สามารถเข้าถึง Google Sheet ได้ โปรดตรวจสอบว่าเปิดสิทธิ์แชร์เป็น "ทุกคนที่มีลิงก์" (Anyone with the link)');
    }

    const records = parseCsvToRecords(rawCsv);
    if (!records || records.length === 0) {
      throw new Error('ไม่พบข้อมูลพนักงานใน Google Sheet หรือรูปแบบคอลัมน์ไม่ถูกต้อง');
    }

    const newConfig: SheetConfig = {
      sheetUrl,
      sheetId: sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1] || 'custom',
      sheetName: 'Google Sheet (เชื่อมต่อโดยตรง)',
      lastSyncTime: new Date().toISOString(),
      status: 'connected',
      isCustom: true,
    };

    saveLocalRecords(records);
    saveLocalConfig(newConfig);

    // Sync client-side parsed CSV data to server so that all other users can access it immediately
    try {
      console.log('Syncing client-parsed CSV back to server...');
      const response = await fetch('/api/sheets/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetUrl, csvText: rawCsv }),
      });
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data && data.records) {
          saveLocalRecords(data.records);
          if (data.config) saveLocalConfig(data.config);
          return {
            success: true,
            config: data.config,
            records: data.records,
            message: `เชื่อมต่อสำเร็จและบันทึกข้อมูลส่วนกลางเรียบร้อย (ดึงข้อมูลพนักงาน ${data.records.length} รายการ)`,
          };
        }
      }
    } catch (serverSyncErr) {
      console.warn('Failed to upload parsed CSV to server database:', serverSyncErr);
    }

    return {
      success: true,
      config: newConfig,
      records,
      message: `เชื่อมต่อสำเร็จ! ดึงข้อมูลพนักงาน ${records.length} รายการเรียบร้อย`,
    };
  } catch (clientErr: any) {
    console.error('Client-side sync error:', clientErr);
    return {
      success: false,
      config: {
        ...DEFAULT_SHEET_CONFIG,
        sheetUrl,
        status: 'error',
        errorMessage: clientErr.message,
      },
      records: getLocalRecords() || MOCK_HOUSING_RECORDS,
      message: clientErr.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
    };
  }
}

// Reset sheet data back to default sample
export async function resetSheetData(): Promise<{ config: SheetConfig; records: HousingAllowanceRecord[] }> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_RECORDS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY);
    await fetch('/api/sheets/reset', { method: 'POST' });
  } catch (e) {
    console.warn('API reset failed, cleared localStorage');
  }
  return { config: DEFAULT_SHEET_CONFIG, records: MOCK_HOUSING_RECORDS };
}

// Aggregate records for a specific employee ID
export function getEmployeeSummary(employeeId: string, records: HousingAllowanceRecord[]): EmployeeInfo | null {
  if (!employeeId || !employeeId.trim()) return null;

  const cleanSearch = employeeId.trim().toUpperCase();
  const matchedRecords = records.filter(
    (r) => r.employeeId.toUpperCase() === cleanSearch || r.employeeId.toUpperCase().includes(cleanSearch)
  );

  if (matchedRecords.length === 0) return null;

  // Use the exact or first match for profile details
  const primary = matchedRecords.find((r) => r.employeeId.toUpperCase() === cleanSearch) || matchedRecords[0];

  const totalAmount = matchedRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const submittedCount = matchedRecords.filter((r) => r.billStatus === 'ส่งแล้ว').length;
  const unsubmittedCount = matchedRecords.filter((r) => r.billStatus === 'ยังไม่ส่ง').length;
  const overdueCount = matchedRecords.filter((r) => r.billStatus === 'เกินกำหนด').length;

  return {
    employeeId: primary.employeeId,
    firstName: primary.firstName,
    lastName: primary.lastName,
    department: primary.department || 'ฝ่ายปฏิบัติการ',
    position: primary.position || 'พนักงาน',
    records: matchedRecords.sort((a, b) => parseDateToTimestamp(b.transferDate) - parseDateToTimestamp(a.transferDate)),
    totalAmount,
    submittedCount,
    unsubmittedCount,
    overdueCount,
  };
}

// Update a record's bill status (e.g. when uploading a receipt)
export async function updateRecordBillStatus(
  records: HousingAllowanceRecord[],
  recordId: string,
  newStatus: HousingAllowanceRecord['billStatus'],
  receiptUrl?: string,
  note?: string
): Promise<HousingAllowanceRecord[]> {
  const updated = records.map((r) => {
    if (r.id === recordId) {
      return {
        ...r,
        billStatus: newStatus,
        receiptUrl: receiptUrl || r.receiptUrl,
        note: note || r.note,
        lastUpdated: new Date().toISOString(),
      };
    }
    return r;
  });

  saveLocalRecords(updated);

  try {
    await fetch('/api/sheets/update-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, newStatus, receiptUrl, note }),
    });
  } catch (e) {
    console.warn('Failed to sync record update to server:', e);
  }

  return updated;
}
