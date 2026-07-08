"use client";

import { useAuthUser } from '@/hooks/useAuthUser';
import { apiGet, apiPatch, apiPost } from '@/services/axios';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, X, Save, PlusCircle, Loader2, XCircle, MoreVertical,
  ImagePlus, CheckCircle, QrCode, Lock,
} from 'lucide-react';

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

const SectionHeading = ({ children }) => (
  <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
    {children}
  </div>
);

const statusStyles = {
  pending:   { dot: 'bg-amber-400',   text: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200',   label: 'Pending'   },
  approved:  { dot: 'bg-emerald-400', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Approved'  },
  rejected:  { dot: 'bg-red-400',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Rejected'  },
  cancelled: { dot: 'bg-red-500',     text: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200',     label: 'Cancelled' },
};

const StatusBadge = ({ status }) => {
  const s = statusStyles[status] ?? statusStyles.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ── Helpers ──────────────────────────────────────────────────────────

const formatDate     = (v) => v ? new Date(v).toLocaleDateString('en-IN',  { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (v) => v ? new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const toDateTimeValue = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d) ? '' : d.toISOString().slice(0, 16);
};

// Build a usable <img> src from the API's file_path (handles Windows-style backslashes)
const getMassPrayerImageUrl = (massPrayerImage) => {
  if (!massPrayerImage?.file_path) return null;
  const normalizedPath = massPrayerImage.file_path.replace(/\\/g, '/');
  return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${normalizedPath}`;
};

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// ── Payment QR Modal ───────────────────────────────────────────────────

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
        <div className="bg-[#0F2A4A] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center">
              <QrCode className="w-4 h-4 text-[#C9A84C]" strokeWidth={1.5} />
            </div>
            <p className="text-white text-sm font-medium">Scan & Pay</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="w-48 h-48 bg-white border-2 border-[#0F2A4A]/10 rounded-xl flex items-center justify-center p-3">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect width="100" height="100" fill="#fff" />
              {Array.from({ length: 10 }).map((_, row) =>
                Array.from({ length: 10 }).map((_, col) => {
                  const seed = (row * 10 + col) % 7;
                  return seed < 3 ? <rect key={`${row}-${col}`} x={col * 10} y={row * 10} width="10" height="10" fill="#0F2A4A" /> : null;
                })
              )}
              <rect x="0" y="0" width="20" height="20" fill="#0F2A4A" /><rect x="5" y="5" width="10" height="10" fill="#fff" />
              <rect x="80" y="0" width="20" height="20" fill="#0F2A4A" /><rect x="85" y="5" width="10" height="10" fill="#fff" />
              <rect x="0" y="80" width="20" height="20" fill="#0F2A4A" /><rect x="5" y="85" width="10" height="10" fill="#fff" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#0F2A4A]">Pay ₹200</p>
            <p className="text-xs text-[#0F2A4A]/40 mt-0.5">Scan this QR using any UPI app</p>
          </div>
          <div className="flex items-center gap-3 w-full mt-2">
            <button onClick={onMarkFailed} className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-500 text-xs font-semibold rounded-[7px] py-2.5 transition-colors font-[inherit] cursor-pointer">
              <XCircle size={13} /> Payment Failed
            </button>
            <button onClick={onMarkComplete} className="flex-1 flex items-center justify-center gap-1.5 bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A] text-xs font-bold rounded-[7px] py-2.5 transition-colors font-[inherit] cursor-pointer">
              <CheckCircle size={13} /> Mark Completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Card ─────────────────────────────────────────────────────────────

const MassPrayerReqCard = ({ massPrayerReq, onUpdated }) => {
  const [isEditing,     setIsEditing]     = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [cancelling,    setCancelling]    = useState(false);
  const [cababMenuOpen, setCababMenuOpen] = useState(false);
  const [qrModalOpen,   setQrModalOpen]   = useState(false);

  const payment = massPrayerReq.payment ?? {};
  const isPaidOnlineCompleted = payment.payment_mode === "online" && payment.payment_status === "completed";

  // Form fully locked when status isn't pending, OR payment is completed online
  const canEdit   = massPrayerReq.status === 'pending' && !isPaidOnlineCompleted;
  const canCancel = massPrayerReq.status === 'pending';

  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!cababMenuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setCababMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cababMenuOpen]);

  const [form, setForm] = useState({
    mass_prayer_date_and_time: toDateTimeValue(massPrayerReq.mass_prayer_date_and_time),
    payment_mode:              payment.payment_mode ?? '',
  });

  // Replacement image — null means "keep existing image", required by spec (cannot remove without replacing)
  const [newImageFile,    setNewImageFile]    = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); };
  }, [imagePreviewUrl]);

  const existingImageUrl = getMassPrayerImageUrl(massPrayerReq.mass_prayer_image);

  const validate = () => {
    const e = {};
    if (!form.mass_prayer_date_and_time) e.mass_prayer_date_and_time = "Preferred date & time is required";
    else if (new Date(form.mass_prayer_date_and_time) <= new Date())
      e.mass_prayer_date_and_time = "Preferred date must be in the future";
    if (!form.payment_mode) e.payment_mode = "Please select a payment mode";
    return e;
  };

  const handleCancelEdit = () => {
    setForm({
      mass_prayer_date_and_time: toDateTimeValue(massPrayerReq.mass_prayer_date_and_time),
      payment_mode:              payment.payment_mode ?? '',
    });
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setNewImageFile(null);
    setImagePreviewUrl(null);
    setErrors({});
    setIsEditing(false);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only image files are accepted."); return; }
    if (file.size > MAX_IMAGE_SIZE_BYTES) { toast.error(`Image size must be under ${MAX_IMAGE_SIZE_MB}MB.`); return; }

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
    setNewImageFile(file);
  };

  const handlePaymentModeSelect = (mode) => {
    if (mode === "online") {
      setQrModalOpen(true);
    } else {
      setForm((p) => ({ ...p, payment_mode: "offline" }));
    }
    setErrors((prev) => ({ ...prev, payment_mode: undefined }));
  };

  const handlePaymentCompleted = () => {
    setForm((p) => ({ ...p, payment_mode: "online" }));
    setQrModalOpen(false);
    toast.success("Payment marked as completed.");
  };

  const handlePaymentFailed = () => {
    setQrModalOpen(false);
    toast.error("Payment marked as failed. Please try again or choose offline payment.");
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("mass_prayer_date_and_time", form.mass_prayer_date_and_time);
      formData.append("payment_mode", form.payment_mode);
      if (newImageFile) formData.append("mass_prayer_image", newImageFile); // only sent when replaced

      const res = await apiPatch(`/user/mass_prayer/${massPrayerReq._id}`, formData);
      if (res.status === 'success') {
        toast.success("Request updated successfully.");
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        setNewImageFile(null);
        setImagePreviewUrl(null);
        setIsEditing(false);
        onUpdated?.();
      } else {
        throw new Error(res?.message);
      }
    } catch (err) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    setCababMenuOpen(false);
    setCancelling(true);
    try {
      const res = await apiPost(`/user/mass_prayer/${massPrayerReq._id}/cancel`);
      if (res.status === 'success') {
        toast.success("Request cancelled successfully.");
        onUpdated?.();
      } else {
        throw new Error(res?.message);
      }
    } catch (err) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setCancelling(false);
    }
  };

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <div className="bg-white rounded-xl border border-[#e2ddd0] shadow-sm overflow-hidden">

      {/* Card header */}
      <div className="px-7 py-4 bg-[#faf9f6] border-b border-[#f0ece0] flex items-center justify-between gap-4">

        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <StatusBadge status={massPrayerReq.status} />
          {isPaidOnlineCompleted && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F2A4A]/40">
              <Lock size={11} /> Locked
            </span>
          )}
          <span className="text-xs text-[#0F2A4A]/40 shrink-0">
            Submitted {formatDate(massPrayerReq.createdAt)}
          </span>
          {massPrayerReq?.priest_response && (
            <span className="text-gray-800 text-xs md:text-sm">
              <span className="font-semibold">Priest Response:</span> {massPrayerReq.priest_response}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">

          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-[#0F2A4A]/60 hover:text-[#0F2A4A] bg-white hover:bg-[#f4f2ed] border border-[#d4c9a8] rounded-md px-3 py-1.5 text-xs font-semibold font-[inherit] transition-colors cursor-pointer"
            >
              <Pencil size={11} /> Edit
            </button>
          )}

          {isEditing && (
            <>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 text-[#0F2A4A]/50 hover:text-[#0F2A4A] bg-white hover:bg-[#f4f2ed] border border-[#d4c9a8] rounded-md px-3 py-1.5 text-xs font-semibold font-[inherit] transition-colors cursor-pointer"
              >
                <X size={11} /> Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold font-[inherit] border-none transition-colors cursor-pointer
                  ${loading ? 'bg-[#a89050] text-white cursor-not-allowed' : 'bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A]'}`}
              >
                {loading ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </>
          )}

          {canCancel && !isEditing && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setCababMenuOpen(prev => !prev)}
                disabled={cancelling}
                className={`w-7 h-7 flex items-center justify-center rounded-md border transition-colors cursor-pointer
                  ${cababMenuOpen
                    ? 'bg-[#0F2A4A] border-[#0F2A4A] text-white'
                    : 'bg-white border-[#d4c9a8] text-[#0F2A4A]/50 hover:text-[#0F2A4A] hover:bg-[#f4f2ed]'}
                  disabled:opacity-40`}
              >
                {cancelling ? <Loader2 size={13} className="animate-spin" /> : <MoreVertical size={13} />}
              </button>

              {cababMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-20 w-44 bg-white border border-[#e2ddd0] rounded-xl shadow-lg overflow-hidden">
                  <div className="absolute -top-1.5 right-2.5 w-3 h-3 bg-white border-l border-t border-[#e2ddd0] rotate-45" />
                  <div className="py-1">
                    <button
                      onClick={handleCancelRequest}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors cursor-pointer font-[inherit]"
                    >
                      <XCircle size={13} className="shrink-0" />
                      Cancel request
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Mass prayer details */}
      <div className="px-7 py-6 border-b border-[#f0ece0]">
        <SectionHeading>Mass Prayer Details</SectionHeading>
        <div className="flex flex-col gap-5">

          <Field label="Preferred Date & Time" error={errors.mass_prayer_date_and_time}>
            {isEditing
              ? <input type="datetime-local" value={form.mass_prayer_date_and_time} onChange={set('mass_prayer_date_and_time')} className={inputCls(errors.mass_prayer_date_and_time) + ' cursor-pointer'} />
              : <span className="text-sm text-[#0F2A4A] font-medium">{formatDateTime(massPrayerReq.mass_prayer_date_and_time)}</span>
            }
          </Field>

          {/* Image — always shows current image; replace-only, never removable */}
          <Field label="Mass Prayer Image" error={null}>
            {isEditing ? (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={imagePreviewUrl || existingImageUrl || ''}
                    alt={imagePreviewUrl ? "New preview" : "Current"}
                    className="w-16 h-16 object-cover rounded-md border border-[#e2ddd0] bg-[#faf9f6]"
                  />
                  {imagePreviewUrl && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#C9A84C] text-[#0F2A4A] text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      New
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#0F2A4A]/60 hover:text-[#0F2A4A] bg-white hover:bg-[#f4f2ed] border border-[#d4c9a8] rounded-[7px] px-3 py-2 transition-colors cursor-pointer font-[inherit]"
                >
                  <ImagePlus size={13} /> Replace image
                </button>
                {/* No remove button by design — an image is always required, so user can only swap it */}
              </div>
            ) : (
              existingImageUrl
                ? <img src={existingImageUrl} alt="Mass prayer" className="w-20 h-20 object-cover rounded-md border border-[#e2ddd0]" />
                : <span className="text-sm text-[#0F2A4A]/40">—</span>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
          </Field>

        </div>
      </div>

      {/* Payment mode */}
      <div className="px-7 py-6">
        <SectionHeading>Payment</SectionHeading>

        {isEditing ? (
          isPaidOnlineCompleted ? (
            // Should not normally render since isEditing can't be true here, kept as a safe fallback
            <PaidBadge />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => handlePaymentModeSelect("offline")}
                  className={`px-4 py-3 rounded-[7px] text-sm font-semibold font-[inherit] border-[1.5px] transition-colors cursor-pointer
                    ${form.payment_mode === "offline" ? 'bg-[#0F2A4A] border-[#0F2A4A] text-white' : 'bg-white border-[#d4c9a8] text-[#0F2A4A]/70 hover:border-[#C9A84C]'}`}
                >
                  Offline
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentModeSelect("online")}
                  className={`px-4 py-3 rounded-[7px] text-sm font-semibold font-[inherit] border-[1.5px] transition-colors cursor-pointer
                    ${form.payment_mode === "online" ? 'bg-[#0F2A4A] border-[#0F2A4A] text-white' : 'bg-white border-[#d4c9a8] text-[#0F2A4A]/70 hover:border-[#C9A84C]'}`}
                >
                  Online
                </button>
              </div>

              {errors.payment_mode && <span className="text-xs text-[#c0392b]">{errors.payment_mode}</span>}

              {/* Failed payment notice + retry, only relevant when staying on online */}
              {form.payment_mode === "online" && payment.payment_status === "failed" && (
                <div className="bg-red-50 border border-red-200 rounded-[7px] px-4 py-3 flex items-center justify-between gap-3 max-w-sm">
                  <p className="text-xs text-red-600 leading-relaxed">Your last payment attempt failed.</p>
                  <button
                    type="button"
                    onClick={() => setQrModalOpen(true)}
                    className="shrink-0 text-xs font-bold text-[#0F2A4A] bg-[#C9A84C] hover:bg-[#dbb85a] rounded-[6px] px-3 py-1.5 transition-colors font-[inherit] cursor-pointer"
                  >
                    Retry Payment
                  </button>
                </div>
              )}

              {form.payment_mode === "offline" && (
                <div className="bg-[#fff8e8] border border-[#e8d8a8] rounded-[7px] px-4 py-3 max-w-sm">
                  <p className="text-xs text-[#8a6d23] leading-relaxed">
                    Meet the priest 1hr before the mass to pay the amount of Rs. 200.
                  </p>
                </div>
              )}

              {form.payment_mode === "online" && payment.payment_status !== "failed" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-[7px] px-4 py-3 flex items-center gap-2 max-w-sm">
                  <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                  <p className="text-xs text-emerald-700 leading-relaxed">Payment marked as completed online.</p>
                </div>
              )}
            </div>
          )
        ) : (
          // Read-only view (not editing)
          isPaidOnlineCompleted ? (
            <PaidBadge />
          ) : payment.payment_mode === "online" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#0F2A4A] font-medium">Online</span>
              <PaymentStatusPill status={payment.payment_status} />
            </div>
          ) : payment.payment_mode === "offline" ? (
            <span className="text-sm text-[#0F2A4A] font-medium">Offline</span>
          ) : (
            <span className="text-sm text-[#0F2A4A]/40">—</span>
          )
        )}
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

// ── small sub-components ────────────────────────────────────────────

const PaidBadge = () => (
  <div className="bg-emerald-50 border border-emerald-200 rounded-[7px] px-4 py-3 flex items-center gap-2 w-fit">
    <CheckCircle size={14} className="text-emerald-600 shrink-0" />
    <p className="text-xs text-emerald-700 font-semibold">Paid online</p>
  </div>
);

const paymentStatusStyles = {
  pending:   { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   label: 'Pending'   },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', label: 'Completed' },
  failed:    { bg: 'bg-red-50',     text: 'text-red-500',     border: 'border-red-200',     label: 'Failed'    },
};

const PaymentStatusPill = ({ status }) => {
  const s = paymentStatusStyles[status] ?? paymentStatusStyles.pending;
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide border rounded-full px-2 py-0.5 ${s.bg} ${s.text} ${s.border}`}>
      {s.label}
    </span>
  );
};

// ── Page ─────────────────────────────────────────────────────────────

const MassPrayerRequestEditPage = () => {
  const router = useRouter();
  const { user } = useAuthUser();
  const [allMassPrayerRequests, setAllMassPrayerRequests] = useState([]);
  const [fetching, setFetching] = useState(true);

  const fetchMassPrayerRequests = async () => {
    try {
      const res = await apiGet("/user/mass_prayer");
      if (res.status === "success") setAllMassPrayerRequests(res.data);
      else throw new Error(res?.message);
    } catch (err) {
      toast.error(err.message ?? "Failed to load mass prayer requests.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchMassPrayerRequests(); }, []);

  return (
    <div className="min-h-screen bg-[#f4f2ed]">

      {/* Page header */}
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
              Mass Prayer Requests
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">

        {fetching ? (
          <div className="text-sm text-[#0F2A4A]/40 py-16 text-center">Loading…</div>

        ) : allMassPrayerRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e2ddd0] shadow-sm px-8 py-14 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f4f2ed] border border-[#e2ddd0] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <rect x="7" y="1" width="2" height="14" rx="1" fill="#C9A84C"/>
                <rect x="2" y="5" width="12" height="2" rx="1" fill="#C9A84C"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F2A4A] mb-1">No mass prayer requests yet</p>
              <p className="text-xs text-[#0F2A4A]/45">Submit a new request to get started.</p>
            </div>
            <button
              onClick={() => router.push("/applications/mass_prayer/apply")}
              className="mt-2 flex items-center gap-2 bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A] font-bold text-xs uppercase tracking-[0.8px] px-5 py-2.5 rounded-[7px] transition-colors cursor-pointer border-none font-[inherit]"
            >
              <PlusCircle size={13} />
              Create Request
            </button>
          </div>

        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-[#0F2A4A]/50 leading-relaxed">
                {allMassPrayerRequests.length} request{allMassPrayerRequests.length > 1 ? 's' : ''} found. Pending requests can be edited.
              </p>
              <button
                onClick={() => router.push("/applications/mass_prayer/apply")}
                className="flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A] font-bold text-xs uppercase tracking-[0.8px] px-4 py-2 rounded-[7px] transition-colors cursor-pointer border-none font-[inherit]"
              >
                <PlusCircle size={12} />
                New Request
              </button>
            </div>
            {allMassPrayerRequests.map(massPrayerReq => (
              <MassPrayerReqCard
                key={massPrayerReq._id}
                massPrayerReq={massPrayerReq}
                onUpdated={fetchMassPrayerRequests}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};


export default MassPrayerRequestEditPage;