"use client";

import { apiPost } from '@/services/axios';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import UserFamilyCardUploadModal from '@/components/common_components/UserFamilyCardUploadModal';

// ── Moved outside component to prevent re-creation on every render ──

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

// ────────────────────────────────────────────────────────────────────

const MarriageRequestApplypage = ({ user }) => {
  const router = useRouter();

  const [mRForm, setmRForm] = useState({
    groom_name: "",
    bride_name: "",
    groom_location: "",
    bride_location: "",
    groom_mobile_number: "",
    bride_mobile_number: "",
    preferred_marriage_date_and_time: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [familyCardUploadModalOpen, setFamilyCardUploadModalOpen] = useState(false);

  const validate = () => {
    const e = {};
    if (!mRForm.groom_name.trim()) e.groom_name = "Groom's name is required";
    if (!mRForm.bride_name.trim()) e.bride_name = "Bride's name is required";
    if (!mRForm.groom_location.trim()) e.groom_location = "Groom's location is required";
    if (!mRForm.bride_location.trim()) e.bride_location = "Bride's location is required";

    if (!mRForm.groom_mobile_number.trim()) e.groom_mobile_number = "Groom's mobile number is required";
    else if (!/^\d{10}$/.test(mRForm.groom_mobile_number.trim()))
      e.groom_mobile_number = "Enter a valid 10-digit mobile number";

    if (!mRForm.bride_mobile_number.trim()) e.bride_mobile_number = "Bride's mobile number is required";
    else if (!/^\d{10}$/.test(mRForm.bride_mobile_number.trim()))
      e.bride_mobile_number = "Enter a valid 10-digit mobile number";

    if (!mRForm.preferred_marriage_date_and_time) e.preferred_marriage_date_and_time = "Preferred date & time is required";
    else if (new Date(mRForm.preferred_marriage_date_and_time) <= new Date())
      e.preferred_marriage_date_and_time = "Preferred date must be in the future";

    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await apiPost("/user/marriage_request", { user, ...mRForm });
      if (res?.status === "success") {
        toast.success("Marriage request sent to the priest for review. The priest will contact you shortly.");
        setmRForm({
          groom_name: "",
          bride_name: "",
          groom_location: "",
          bride_location: "",
          groom_mobile_number: "",
          bride_mobile_number: "",
          preferred_marriage_date_and_time: "",
        });
      } else {
        throw new Error(res?.message);
      }
    } catch (err) {
      if (err?.message === "You have not uploaded family card document or its not verified yet so please contact priest" || err?.message === "Family card was not found in the server, so please upload again") {
        setFamilyCardUploadModalOpen(true);
      }
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
              Marriage Application
            </div>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="max-w-5xl mx-auto px-6 py-10">

        <p className="text-sm text-[#0F2A4A]/50 mb-8 leading-relaxed">
          Fill in the details below to submit a marriage request. The priest will review your application
          and reach out to confirm the schedule.
        </p>

        <div className="bg-white rounded-xl border border-[#e2ddd0] shadow-sm overflow-hidden">

          {/* Section: Groom Details */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
              Groom Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Groom's Name" error={errors.groom_name}>
                <input
                  value={mRForm.groom_name}
                  onChange={e => setmRForm(p => ({ ...p, groom_name: e.target.value }))}
                  placeholder="Enter groom's full name"
                  className={inputCls(errors.groom_name)}
                />
              </Field>
              <Field label="Groom's Location" error={errors.groom_location}>
                <input
                  value={mRForm.groom_location}
                  onChange={e => setmRForm(p => ({ ...p, groom_location: e.target.value }))}
                  placeholder="Enter groom's location"
                  className={inputCls(errors.groom_location)}
                />
              </Field>
              <Field label="Groom's Mobile Number" error={errors.groom_mobile_number}>
                <input
                  value={mRForm.groom_mobile_number}
                  onChange={e => setmRForm(p => ({ ...p, groom_mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="Enter groom's mobile number"
                  inputMode="numeric"
                  className={inputCls(errors.groom_mobile_number)}
                />
              </Field>
            </div>
          </div>

          {/* Section: Bride Details */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
              Bride Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Bride's Name" error={errors.bride_name}>
                <input
                  value={mRForm.bride_name}
                  onChange={e => setmRForm(p => ({ ...p, bride_name: e.target.value }))}
                  placeholder="Enter bride's full name"
                  className={inputCls(errors.bride_name)}
                />
              </Field>
              <Field label="Bride's Location" error={errors.bride_location}>
                <input
                  value={mRForm.bride_location}
                  onChange={e => setmRForm(p => ({ ...p, bride_location: e.target.value }))}
                  placeholder="Enter bride's location"
                  className={inputCls(errors.bride_location)}
                />
              </Field>
              <Field label="Bride's Mobile Number" error={errors.bride_mobile_number}>
                <input
                  value={mRForm.bride_mobile_number}
                  onChange={e => setmRForm(p => ({ ...p, bride_mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="Enter bride's mobile number"
                  inputMode="numeric"
                  className={inputCls(errors.bride_mobile_number)}
                />
              </Field>
            </div>
          </div>

          {/* Section: Marriage Schedule */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
              Marriage Schedule
            </div>
            <div className="grid grid-cols-1 gap-x-6">
              <Field label="Preferred Marriage Date & Time" error={errors.preferred_marriage_date_and_time}>
                <input
                  type="datetime-local"
                  value={mRForm.preferred_marriage_date_and_time}
                  onChange={e => setmRForm(p => ({ ...p, preferred_marriage_date_and_time: e.target.value }))}
                  className={inputCls(errors.preferred_marriage_date_and_time) + " cursor-pointer"}
                />
              </Field>
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

          {familyCardUploadModalOpen && (
            <UserFamilyCardUploadModal mode='upload' onCancel={() => setFamilyCardUploadModalOpen(false)} onSuccess={() => setFamilyCardUploadModalOpen(false)} />
          )}

        </div>
      </div>
    </div>
  );
};

export default MarriageRequestApplypage;