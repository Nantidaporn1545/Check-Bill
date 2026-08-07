export type BillStatus = 'ส่งแล้ว' | 'ยังไม่ส่ง' | 'รอดำเนินการ' | 'เกินกำหนด';

export interface HousingAllowanceRecord {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  transferDate: string;
  welfareItem: string;
  siteLocation: string;
  vehiclePlate?: string;
  amount: number;
  billStatus: BillStatus;
  billDueDate?: string;
  receiptUrl?: string;
  note?: string;
  lastUpdated?: string;
}

export interface EmployeeInfo {
  employeeId: string;
  firstName: string;
  lastName: string;
  department?: string;
  position?: string;
  records: HousingAllowanceRecord[];
  totalAmount: number;
  submittedCount: number;
  pendingCount: number;
  unsubmittedCount: number;
  overdueCount: number;
}

export interface SheetConfig {
  sheetUrl: string;
  sheetId: string;
  sheetName: string;
  isCustom: boolean;
  lastSyncTime: string | null;
  status: 'connected' | 'syncing' | 'error' | 'idle';
  errorMessage?: string;
}

export interface SheetColumnMapping {
  employeeIdCol: string;
  firstNameCol: string;
  lastNameCol: string;
  transferDateCol: string;
  welfareItemCol: string;
  siteLocationCol: string;
  amountCol: string;
  billStatusCol: string;
}
