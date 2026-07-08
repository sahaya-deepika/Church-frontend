"use client";

import { apiPost } from '@/services/axios';
import { useRouter } from 'next/navigation';
import React, { useState, useRef } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, X, QrCode, CheckCircle, XCircle, ImagePlus, Trash2 } from 'lucide-react';

// ── Shared primitives ────────────────────────────────────────────────

const Label = ({ children }) => (
  <label className="text-[11px] font-semibold text-[#0F2A4A]/60 tracking-wider uppercase">
    {children}
  </label>
);

const inputCls = (error) => `
  w-full px-3.5 py-2.5 rounded-[7px] text-sm text-[#0F2A4A] font-[inherit]
  border-[1.5px] outline-none transition-colors box-border bg-white
  focus:border-[#C9A84C]
  ${error ? 'border-[#e05252] bg-[#fff5f5] focus:border-[#e05252]' : 'border-[#d4c9a8]'}
`;

const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <Label>{label}</Label>
    {children}
    {error && <span className="text-xs text-[#c0392b]">{error}</span>}
  </div>
);

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// ── Payment QR Modal ────────────────────────────────────────────────

const PaymentQrModal = ({ onClose, onMarkComplete, onMarkFailed }) => {
  const overlayRef = useRef(null);
  const handleBackdrop = (e) => { if (e.target === overlayRef.current) onClose?.(); };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-[9999] bg-[rgba(10,22,40,0.65)] flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">

        {/* Header */}
        <div className="bg-[#0F2A4A] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-[#C9A84C]" strokeWidth={1.5} />
            </div>
            <p className="text-white text-sm font-medium">Scan & Pay</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col items-center gap-4">
          {/* Dummy QR */}
          <div className="w-48 h-48 bg-white border-2 border-[#0F2A4A]/10 rounded-xl flex items-center justify-center p-3">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect width="100" height="100" fill="#fff" />
              {Array.from({ length: 10 }).map((_, row) =>
                Array.from({ length: 10 }).map((_, col) => {
                  const seed = (row * 10 + col) % 7;
                  return seed < 3 ? (
                    <rect key={`${row}-${col}`} x={col * 10} y={row * 10} width="10" height="10" fill="#0F2A4A" />
                  ) : null;
                })
              )}
              <rect x="0" y="0" width="20" height="20" fill="#0F2A4A" />
              <rect x="5" y="5" width="10" height="10" fill="#fff" />
              <rect x="80" y="0" width="20" height="20" fill="#0F2A4A" />
              <rect x="85" y="5" width="10" height="10" fill="#fff" />
              <rect x="0" y="80" width="20" height="20" fill="#0F2A4A" />
              <rect x="5" y="85" width="10" height="10" fill="#fff" />
            </svg>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-[#0F2A4A]">Pay ₹200</p>
            <p className="text-xs text-[#0F2A4A]/40 mt-0.5">Scan this QR using any UPI app</p>
          </div>

          <div className="flex items-center gap-3 w-full mt-2">
            <button
              onClick={onMarkFailed}
              className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-500 text-xs font-semibold rounded-[7px] py-2.5 transition-colors font-[inherit] cursor-pointer"
            >
              <XCircle size={13} />
              Payment Failed
            </button>
            <button
              onClick={onMarkComplete}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A] text-xs font-bold rounded-[7px] py-2.5 transition-colors font-[inherit] cursor-pointer"
            >
              <CheckCircle size={13} />
              Mark Completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  mass_prayer_date_and_time: "",
  payment_mode: "", // "offline" | "online"
};

const MassPrayerApplyPage = ({ user }) => {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [mpForm, setMpForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);

  const set = (key) => (e) => setMpForm(p => ({ ...p, [key]: e.target.value }));

  // ── image handling ──
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are accepted.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error(`Image size must be under ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageFile(file);
    setErrors((prev) => ({ ...prev, mass_prayer_image: undefined }));
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── payment mode handling ──
  const handlePaymentModeSelect = (mode) => {
    if (mode === "online") {
      setQrModalOpen(true); // payment_mode only gets set once "completed" is tapped
    } else {
      setMpForm((p) => ({ ...p, payment_mode: "offline" }));
    }
    setErrors((prev) => ({ ...prev, payment_mode: undefined }));
  };

  const handlePaymentCompleted = () => {
    setMpForm((p) => ({ ...p, payment_mode: "online" }));
    setQrModalOpen(false);
    toast.success("Payment marked as completed.");
  };

  const handlePaymentFailed = () => {
    setQrModalOpen(false);
    toast.error("Payment marked as failed. Please try again or choose offline payment.");
  };

  // ── validation ──
  const validate = () => {
    const e = {};
    if (!mpForm.mass_prayer_date_and_time) e.mass_prayer_date_and_time = "Preferred date & time is required";
    else if (new Date(mpForm.mass_prayer_date_and_time) <= new Date())
      e.mass_prayer_date_and_time = "Preferred date must be in the future";

    if (!imageFile) e.mass_prayer_image = "Please attach an image for the mass prayer request";

    if (!mpForm.payment_mode) e.payment_mode = "Please select a payment mode";

    return e;
  };

  // ── submit ──
  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("mass_prayer_date_and_time", mpForm.mass_prayer_date_and_time);
      formData.append("payment_mode", mpForm.payment_mode);
      formData.append("mass_prayer_image", imageFile);
      if (user) formData.append("user", user);

      const res = await apiPost("/user/mass_prayer", formData);
      if (res?.status === "success") {
        toast.success("Mass prayer request sent to the priest for review. The priest will contact you shortly.");
        setMpForm(EMPTY_FORM);
        handleRemoveImage();
      } else {
        throw new Error(res?.message);
      }
    } catch (err) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f2ed]">

      {/* Page header bar */}
      <div className="bg-[#0F2A4A] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/15 border border-white/15 rounded-md px-3 py-1.5 text-xs font-semibold font-[inherit] cursor-pointer shrink-0"
          >
            <ArrowLeft size={12} />
            Back
          </button>
          <div className="h-5 w-px bg-white/20" />
          <div>
            <div className="text-white/50 text-[10px] font-semibold tracking-[1.5px] uppercase leading-none mb-0.5">
              Sacrament Request
            </div>
            <div className="text-white font-bold text-base tracking-[0.2px] leading-none">
              Mass Prayer Application
            </div>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="max-w-5xl mx-auto px-6 py-10">

        <p className="text-sm text-[#0F2A4A]/50 mb-8 leading-relaxed">
          Fill in the details below to submit a mass prayer request. The priest will review your application
          and reach out to confirm the schedule.
        </p>

        <div className="bg-white rounded-xl border border-[#e2ddd0] shadow-sm overflow-hidden">

          {/* Section: Mass Prayer Details */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
              Mass Prayer Details
            </div>

            <div className="flex flex-col gap-5">

              <Field label="Preferred Mass Prayer Date & Time" error={errors.mass_prayer_date_and_time}>
                <input
                  type="datetime-local"
                  value={mpForm.mass_prayer_date_and_time}
                  onChange={set('mass_prayer_date_and_time')}
                  className={inputCls(errors.mass_prayer_date_and_time) + " cursor-pointer"}
                />
              </Field>

              {/* Image upload */}
              <Field label="Mass Prayer Image" error={errors.mass_prayer_image}>
                {!imageFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[7px] p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
                      ${errors.mass_prayer_image ? 'border-[#e05252] bg-[#fff5f5]' : 'border-[#d4c9a8] hover:border-[#C9A84C]'}`}
                  >
                    <ImagePlus size={20} className="text-[#0F2A4A]/30" />
                    <p className="text-xs text-[#0F2A4A]/50">
                      Click to upload an image <span className="text-[#0F2A4A]/30">(max {MAX_IMAGE_SIZE_MB}MB)</span>
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-[#faf9f6] border border-[#e2ddd0] rounded-[7px] px-3.5 py-2.5">
                    <img src={imagePreviewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-md border border-[#e2ddd0]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0F2A4A] font-medium truncate">{imageFile.name}</p>
                      <p className="text-xs text-[#0F2A4A]/40">{(imageFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={handleRemoveImage}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </Field>

            </div>
          </div>

          {/* Section: Payment Mode */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
              Payment Mode
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePaymentModeSelect("offline")}
                  className={`px-4 py-3 rounded-[7px] text-sm font-semibold font-[inherit] border-[1.5px] transition-colors cursor-pointer
                    ${mpForm.payment_mode === "offline"
                      ? 'bg-[#0F2A4A] border-[#0F2A4A] text-white'
                      : 'bg-white border-[#d4c9a8] text-[#0F2A4A]/70 hover:border-[#C9A84C]'}`}
                >
                  Offline
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentModeSelect("online")}
                  className={`px-4 py-3 rounded-[7px] text-sm font-semibold font-[inherit] border-[1.5px] transition-colors cursor-pointer
                    ${mpForm.payment_mode === "online"
                      ? 'bg-[#0F2A4A] border-[#0F2A4A] text-white'
                      : 'bg-white border-[#d4c9a8] text-[#0F2A4A]/70 hover:border-[#C9A84C]'}`}
                >
                  Online
                </button>
              </div>

              {errors.payment_mode && (
                <span className="text-xs text-[#c0392b]">{errors.payment_mode}</span>
              )}

              {mpForm.payment_mode === "offline" && (
                <div className="bg-[#fff8e8] border border-[#e8d8a8] rounded-[7px] px-4 py-3">
                  <p className="text-xs text-[#8a6d23] leading-relaxed">
                    Meet the priest 1hr before the mass to pay the amount of Rs. 200.
                  </p>
                </div>
              )}

              {mpForm.payment_mode === "online" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-[7px] px-4 py-3 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Payment marked as completed online.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer / Submit */}
          <div className="px-7 py-5 bg-[#faf9f6] flex items-center justify-between gap-4">
            <p className="text-xs text-[#0F2A4A]/40 leading-relaxed max-w-sm">
              By submitting, you agree to be contacted by the parish regarding this request.
            </p>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`
                shrink-0 px-10 py-2.5 rounded-[7px] font-bold text-sm text-[#0F2A4A]
                border-none uppercase tracking-[0.8px] font-[inherit] transition-colors duration-150
                ${loading ? 'bg-[#a89050] cursor-not-allowed' : 'bg-[#C9A84C] cursor-pointer hover:bg-[#dbb85a]'}
              `}
            >
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>

        </div>
      </div>

      {qrModalOpen && (
        <PaymentQrModal
          onClose={() => setQrModalOpen(false)}
          onMarkComplete={handlePaymentCompleted}
          onMarkFailed={handlePaymentFailed}
        />
      )}
    </div>
  );
};

export default MassPrayerApplyPage;