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

const EucharistRequestApplypage = ({ user }) => {
  const router = useRouter();

  const [eRForm, seteRForm] = useState({
    father_name: "",
    mother_name: "",
    eucharist_person_name: "",
    preferred_eucharist_date_and_time: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [familyCardUploadModalOpen, setFamilyCardUploadModalOpen] = useState(false);

  const validate = () => {
    const e = {};
    if (!eRForm.father_name.trim()) e.father_name = "Father's name is required";
    if (!eRForm.mother_name.trim()) e.mother_name = "Mother's name is required";
    if (!eRForm.eucharist_person_name.trim()) e.eucharist_person_name = "Eucharist person's name is required";
    if (!eRForm.preferred_eucharist_date_and_time) e.preferred_eucharist_date_and_time = "Preferred date & time is required";
    else if (new Date(eRForm.preferred_eucharist_date_and_time) <= new Date())
      e.preferred_eucharist_date_and_time = "Preferred date must be in the future";
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await apiPost("/user/eucharist_request", { user, ...eRForm });
      if (res?.status === "success") {
        toast.success("Eucharist request sent to the priest for review. The priest will contact you shortly.");
        seteRForm({
          father_name: "",
          mother_name: "",
          eucharist_person_name: "",
          preferred_eucharist_date_and_time: "",
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
              Eucharist Application
            </div>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="max-w-5xl mx-auto px-6 py-10">

        <p className="text-sm text-[#0F2A4A]/50 mb-8 leading-relaxed">
          Fill in the details below to submit a eucharist request. The priest will review your application
          and reach out to confirm the schedule.
        </p>

        <div className="bg-white rounded-xl border border-[#e2ddd0] shadow-sm overflow-hidden">

          {/* Section: Parent Details */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
              Parent Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Father's Name" error={errors.father_name}>
                <input
                  value={eRForm.father_name}
                  onChange={e => seteRForm(p => ({ ...p, father_name: e.target.value }))}
                  placeholder="Enter father's full name"
                  className={inputCls(errors.father_name)}
                />
              </Field>
              <Field label="Mother's Name" error={errors.mother_name}>
                <input
                  value={eRForm.mother_name}
                  onChange={e => seteRForm(p => ({ ...p, mother_name: e.target.value }))}
                  placeholder="Enter mother's full name"
                  className={inputCls(errors.mother_name)}
                />
              </Field>
            </div>
          </div>

          {/* Section: Eucharist person Details */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
              Eucharist Person Details
            </div>
            <div className="flex flex-col gap-5">
              <Field label="Eucharist person's Name" error={errors.eucharist_person_name}>
                <input
                  value={eRForm.eucharist_person_name}
                  onChange={e => seteRForm(p => ({ ...p, eucharist_person_name: e.target.value }))}
                  placeholder="Enter eucharist person's full name"
                  className={inputCls(errors.eucharist_person_name)}
                />
              </Field>
              <div className="grid grid-cols-1 gap-x-6">
                <Field label="Preferred Baptism Date & Time" error={errors.preferred_eucharist_date_and_time}>
                  <input
                    type="datetime-local"
                    value={eRForm.preferred_eucharist_date_and_time}
                    onChange={e => seteRForm(p => ({ ...p, preferred_eucharist_date_and_time: e.target.value }))}
                    className={inputCls(errors.preferred_eucharist_date_and_time) + " cursor-pointer"}
                  />
                </Field>
              </div>
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

export default EucharistRequestApplypage;