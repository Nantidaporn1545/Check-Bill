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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c2331]/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A475F] border border-[#7FA1B6]/40 rounded-3xl max-w-lg w-full text-[#D3D1C6] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#7FA1B6]/30 flex items-center justify-between bg-[#103042]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7FA1B6]/20 border border-[#7FA1B6]/40 text-[#FFFFFF] flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#7FA1B6]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#FFFFFF]">นำส่งใบเสร็จรับเงิน / บิลค่าที่พัก</h3>
              <p className="text-xs text-[#D3D1C6] font-mono">รหัสพนักงาน {record.employeeId} ({record.firstName} {record.lastName})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#D3D1C6] hover:text-[#FFFFFF] hover:bg-[#7FA1B6]/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">

          {/* Record Summary Box */}
          <div className="p-4 rounded-2xl bg-[#103042] border border-[#7FA1B6]/30 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#D3D1C6]">
              <span>รายการ:</span>
              <strong className="text-[#FFFFFF]">{record.welfareItem}</strong>
            </div>
            <div className="flex justify-between text-[#D3D1C6]">
              <span>วันที่โอนให้:</span>
              <strong className="text-[#FFFFFF]">{record.transferDate}</strong>
            </div>
            <div className="flex justify-between text-[#D3D1C6]">
              <span>ไซส์งาน:</span>
              <strong className="text-[#FFFFFF]">{record.siteLocation}</strong>
            </div>
            <div className="flex justify-between text-[#D3D1C6] pt-1 border-t border-[#7FA1B6]/20">
              <span>จำนวนเงิน:</span>
              <strong className="text-[#FFFFFF] text-sm font-mono">฿{record.amount.toLocaleString('th-TH')}</strong>
            </div>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-[#7FA1B6] mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-[#FFFFFF]">นำส่งใบเสร็จเรียบร้อยแล้ว!</h4>
              <p className="text-xs text-[#D3D1C6]">ระบบเปลี่ยนสถานะเป็น "รอดำเนินการ" และบันทึกข้อมูลแล้ว</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* File Upload Area */}
              <div>
                <label className="block text-xs font-medium text-[#D3D1C6] mb-2">
                  แนบไฟล์สลิป/ใบเสร็จรับเงิน (รูปถ่าย หรือ PDF)
                </label>
                <div className="relative border-2 border-dashed border-[#7FA1B6]/50 hover:border-[#7FA1B6] rounded-2xl p-5 text-center bg-[#0c2331] transition-colors group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Camera className="w-8 h-8 text-[#7FA1B6] group-hover:text-[#FFFFFF] mx-auto transition-colors" />
                  <p className="text-xs text-[#D3D1C6] mt-2 font-medium">
                    {simulatedFileName ? (
                      <span className="text-[#FFFFFF] font-bold">{simulatedFileName}</span>
                    ) : (
                      'ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกรูปใบเสร็จ'
                    )}
                  </p>
                  <p className="text-[11px] text-[#7FA1B6] mt-1">รองรับ JPG, PNG, PDF ขนาดไม่เกิน 10MB</p>
                </div>
              </div>

              {/* Or Paste URL */}
              <div>
                <label className="block text-xs font-medium text-[#D3D1C6] mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-[#7FA1B6]" />
                  <span>หรือ วางลิงก์รูปใบเสร็จ/สลิปออนไลน์ (Google Drive / Cloud)</span>
                </label>
                <input
                  type="url"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/40 text-xs text-[#FFFFFF] placeholder-[#7FA1B6]/60 focus:outline-none focus:border-[#7FA1B6]"
                />
              </div>

              {/* Note input */}
              <div>
                <label className="block text-xs font-medium text-[#D3D1C6] mb-1.5">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="เช่น เลขที่ใบเสร็จ RE-2026-081..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/40 text-xs text-[#FFFFFF] placeholder-[#7FA1B6]/60 focus:outline-none focus:border-[#7FA1B6]"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl hover:bg-[#7FA1B6]/20 text-[#D3D1C6] text-xs font-medium transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#103042] hover:bg-[#13384d] text-[#FFFFFF] border border-[#7FA1B6]/60 font-semibold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
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
