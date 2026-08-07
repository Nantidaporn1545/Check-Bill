import React, { useState } from 'react';
import { ShieldCheck, KeyRound, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentPin: string;
  onUpdatePin: (newPin: string) => void;
  isAdmin: boolean;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentPin,
  onUpdatePin,
  isAdmin,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // State for changing PIN mode
  const [isChangingPinMode, setIsChangingPinMode] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (pinInput.trim() === currentPin) {
      setSuccessMsg('เข้าสู่ระบบผู้ดูแลระบบสำเร็จ!');
      setTimeout(() => {
        setSuccessMsg(null);
        setPinInput('');
        onSuccess();
      }, 800);
    } else {
      setErrorMsg('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (oldPin !== currentPin) {
      setErrorMsg('รหัส PIN เดิมไม่ถูกต้อง');
      return;
    }
    if (newPin.length < 4) {
      setErrorMsg('รหัส PIN ใหม่ต้องมีอย่างน้อย 4 หลัก');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('รหัส PIN ใหม่ไม่ตรงกัน');
      return;
    }

    onUpdatePin(newPin);
    setSuccessMsg('เปลี่ยนรหัส PIN ผู้ดูแลระบบสำเร็จ!');
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setTimeout(() => {
      setSuccessMsg(null);
      setIsChangingPinMode(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c2331]/85 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#1A475F] border border-[#7FA1B6]/40 rounded-3xl max-w-md w-full text-[#D3D1C6] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#7FA1B6]/30 flex items-center justify-between bg-[#103042]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7FA1B6]/20 border border-[#7FA1B6]/40 text-[#FFFFFF] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#7FA1B6]" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#FFFFFF]">ยืนยันสิทธิ์ผู้ดูแลระบบ (Admin)</h3>
              <p className="text-xs text-[#D3D1C6]">เฉพาะเจ้าหน้าที่ผู้ดูแลที่สามารถตั้งค่า Google Sheet ได้</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#D3D1C6] hover:text-[#FFFFFF] hover:bg-[#7FA1B6]/20 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-900/40 border border-rose-500/60 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-900/40 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isChangingPinMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#FFFFFF] mb-2">
                  กรอกรหัส PIN ผู้ดูแลระบบ
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="รหัส PIN (เริ่มต้น: 1234)"
                    className="w-full px-4 py-3 rounded-2xl bg-[#0c2331] border border-[#7FA1B6]/40 text-center text-lg font-mono text-[#FFFFFF] tracking-widest placeholder:text-xs placeholder:tracking-normal placeholder-[#7FA1B6]/50 focus:outline-none focus:border-[#7FA1B6]"
                    autoFocus
                  />
                  <KeyRound className="w-5 h-5 text-[#7FA1B6] absolute right-4 top-3.5 pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#7FA1B6] mt-2 text-center">
                  * รหัส PIN เริ่มต้นระบบคือ <strong className="text-[#FFFFFF]">1234</strong>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsChangingPinMode(true)}
                    className="text-xs text-[#7FA1B6] hover:text-[#FFFFFF] underline transition-colors cursor-pointer"
                  >
                    เปลี่ยนรหัส PIN
                  </button>
                )}

                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-[#0c2331] hover:bg-[#103042] text-[#D3D1C6] text-xs font-medium transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#103042] hover:bg-[#13384D] text-[#FFFFFF] border border-[#7FA1B6]/60 font-semibold text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#7FA1B6]" />
                    <span>เข้าสู่ระบบจัดการ</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Change PIN form */
            <form onSubmit={handleChangePin} className="space-y-4">
              <h4 className="text-xs font-bold text-[#FFFFFF]">ตั้งค่าเปลี่ยนรหัส PIN ใหม่</h4>
              <div>
                <label className="block text-[11px] text-[#D3D1C6] mb-1">รหัส PIN เดิม</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/40 text-xs font-mono text-[#FFFFFF] focus:outline-none focus:border-[#7FA1B6]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#D3D1C6] mb-1">รหัส PIN ใหม่ (อย่างน้อย 4 หลัก)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/40 text-xs font-mono text-[#FFFFFF] focus:outline-none focus:border-[#7FA1B6]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#D3D1C6] mb-1">ยืนยันรหัส PIN ใหม่</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0c2331] border border-[#7FA1B6]/40 text-xs font-mono text-[#FFFFFF] focus:outline-none focus:border-[#7FA1B6]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangingPinMode(false)}
                  className="text-xs text-[#7FA1B6] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#103042] hover:bg-[#13384D] text-[#FFFFFF] border border-[#7FA1B6]/60 text-xs font-semibold cursor-pointer"
                >
                  บันทึก PIN ใหม่
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
