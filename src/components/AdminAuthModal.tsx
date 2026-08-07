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
      setErrorMsg('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200/80 rounded-3xl max-w-md w-full text-slate-700 shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">ยืนยันสิทธิ์ผู้ดูแลระบบ (Admin)</h3>
              <p className="text-xs text-slate-500">เฉพาะเจ้าหน้าที่ผู้ดูแลที่สามารถตั้งค่า Google Sheet ได้</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isChangingPinMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-2">
                  กรอกรหัสผ่านผู้ดูแลระบบ
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={30}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="รหัสผ่านผู้ดูแลระบบ"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-center text-lg font-mono text-slate-900 tracking-widest placeholder:text-xs placeholder:tracking-normal placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    autoFocus
                  />
                  <KeyRound className="w-5 h-5 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsChangingPinMode(true)}
                    className="text-xs text-sky-600 hover:text-sky-800 underline transition-colors cursor-pointer"
                  >
                    เปลี่ยนรหัสผ่านผู้ดูแลระบบ
                  </button>
                )}

                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span>เข้าสู่ระบบจัดการ</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Change PIN form */
            <form onSubmit={handleChangePin} className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900">ตั้งค่าเปลี่ยนรหัสผ่านใหม่</h4>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">รหัสผ่านเดิม</label>
                <input
                  type="password"
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">รหัสผ่านใหม่ (อย่างน้อย 4 หลัก)</label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">ยืนยันรหัสผ่านใหม่</label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setIsChangingPinMode(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  ย้อนกลับ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  บันทึกรหัสผ่านใหม่
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
