import { HousingAllowanceRecord, EmployeeInfo, SheetConfig } from '../types';
import { MOCK_HOUSING_RECORDS, DEFAULT_SHEET_CONFIG } from '../data/mockData';
import { parseDateToTimestamp } from '../utils/formatters';

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
  const localConfig = getLocalConfig();

  // If local storage has a connected custom Google Sheet, sync directly with Google Sheet URL first
  if (localConfig?.isCustom && localConfig?.sheetUrl) {
    try {
      const syncRes = await syncCustomSheetUrl(localConfig.sheetUrl);
      if (syncRes.success && syncRes.records && syncRes.records.length > 0) {
        saveLocalRecords(syncRes.records);
        saveLocalConfig(syncRes.config);
        return { config: syncRes.config, records: syncRes.records };
      }
    } catch (e) {
      console.warn('Direct Google Sheet auto-resync failed, falling back to backend API:', e);
    }
  }

  try {
    const response = await fetch('/api/sheets/data');
    if (response.ok) {
      const data = await response.json();

      // If server has custom synced records or server data, sync local storage & use server records
      if (data.config?.isCustom && data.records && data.records.length > 0) {
        saveLocalRecords(data.records);
        saveLocalConfig(data.config);
        return { config: data.config, records: data.records };
      }

      const localRecs = getLocalRecords();
      const recordsToUse = localRecs || data.records || MOCK_HOUSING_RECORDS;
      const configToUse = localConfig || data.config || DEFAULT_SHEET_CONFIG;
      return { config: configToUse, records: recordsToUse };
    }
  } catch (err) {
    console.warn('Backend API unavailable, using fallback mock data:', err);
  }

  const localRecs = getLocalRecords();
  return {
    config: localConfig || DEFAULT_SHEET_CONFIG,
    records: localRecs || MOCK_HOUSING_RECORDS,
  };
}

// Connect & parse a Google Sheet URL
export async function syncCustomSheetUrl(sheetUrl: string, csvText?: string): Promise<{ success: boolean; config: SheetConfig; records: HousingAllowanceRecord[]; message: string }> {
  try {
    const response = await fetch('/api/sheets/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sheetUrl, csvText }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้');
    }

    saveLocalRecords(data.records);
    saveLocalConfig(data.config);

    return {
      success: true,
      config: data.config,
      records: data.records,
      message: data.message || 'เชื่อมต่อข้อมูลเรียบร้อย',
    };
  } catch (err: any) {
    console.error('syncCustomSheetUrl error:', err);
    return {
      success: false,
      config: {
        ...DEFAULT_SHEET_CONFIG,
        status: 'error',
        errorMessage: err.message,
      },
      records: getLocalRecords() || MOCK_HOUSING_RECORDS,
      message: err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ',
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
  const pendingCount = matchedRecords.filter((r) => r.billStatus === 'รอดำเนินการ').length;
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
    pendingCount,
    unsubmittedCount,
    overdueCount,
  };
}

// Update a record's bill status (e.g. when uploading a receipt)
export function updateRecordBillStatus(
  records: HousingAllowanceRecord[],
  recordId: string,
  newStatus: HousingAllowanceRecord['billStatus'],
  receiptUrl?: string,
  note?: string
): HousingAllowanceRecord[] {
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
  return updated;
}
