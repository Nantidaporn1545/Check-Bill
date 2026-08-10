import React, { useState } from 'react';
import { HousingAllowanceRecord } from '../types';
import { X, Upload, CheckCircle2, Link as LinkIcon, Camera } from 'lucide-react';

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: HousingAllowanceRecord | null;
  onSubmitReceipt: (recordId: string, receiptUrl: string, note: string) => void;
}

export const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({
  isOpen,
  onClose,
  record,
  onSubmitReceipt,
}) => {
  const [fileUrl, setFileUrl] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [simulatedFileName, setSimulatedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !record) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSimulatedFileName(file.name);
      // Create local object URL for preview
      const previewUrl = URL.createObjectURL(file);
      setFileUrl(previewUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      const finalUrl = fileUrl || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80';
      const finalNote = noteInput ? `นำส่งใบเสร็จ: ${noteInput}` : 'นำส่งใบเสร็จรับเงินแล้ว รอเจ้าหน้าที่ตรวจสอบ';
      onSubmitReceipt(record.id, finalUrl, finalNote);
      setIsSubmitting(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        setFileUrl('');
        setNoteInput('');
        setSimulatedFileName(null);
        onClose();
      }, 1200);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-3xl max-w-lg w-full text-slate-700 shadow-xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">นำส่งใบเสร็จรับเงิน / บิลค่าที่พัก</h3>
              <p className="text-xs text-slate-500 font-mono">รหัสพนักงาน {record.employeeId} ({record.firstName} {record.lastName})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">

          {/* Record Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>รายการ:</span>
              <strong className="text-slate-900">{record.welfareItem}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>วันที่โอนให้:</span>
              <strong className="text-slate-900">{record.transferDate}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>ไซต์งาน:</span>
              <strong className="text-slate-900">{record.siteLocation}</strong>
            </div>
            <div className="flex justify-between text-slate-600 pt-1.5 border-t border-slate-200">
              <span>จำนวนเงิน:</span>
              <strong className="text-slate-900 text-sm font-mono">฿{record.amount.toLocaleString('th-TH')}</strong>
            </div>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-slate-900">นำส่งใบเสร็จเรียบร้อยแล้ว!</h4>
              <p className="text-xs text-slate-500">ระบบเปลี่ยนสถานะเป็น "ส่งแล้ว" และบันทึกข้อมูลแล้ว</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* File Upload Area */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">
                  แนบไฟล์สลิป/ใบเสร็จรับเงิน (รูปถ่าย หรือ PDF)
                </label>
                <div className="relative border-2 border-dashed border-sky-200 hover:border-sky-400 rounded-2xl p-5 text-center bg-sky-50/50 transition-colors group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Camera className="w-8 h-8 text-sky-500 group-hover:text-sky-600 mx-auto transition-colors" />
                  <p className="text-xs text-slate-700 mt-2 font-medium">
                    {simulatedFileName ? (
                      <span className="text-sky-800 font-bold">{simulatedFileName}</span>
                    ) : (
                      'ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกรูปใบเสร็จ'
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">รองรับ JPG, PNG, PDF ขนาดไม่เกิน 10MB</p>
                </div>
              </div>

              {/* Or Paste URL */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>หรือ วางลิงก์รูปใบเสร็จ/สลิปออนไลน์ (Google Drive / Cloud)</span>
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Note input */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="เช่น เลขที่ใบเสร็จ RE-2026-081..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการนำส่งบิล'}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
