"use client";

import { apiPost } from '@/services/axios';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

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

const AnointingOfTheSickRequestApplypage = ({ user }) => {
  const router = useRouter();

  const [aosForm, setaosForm] = useState({
    patient_name: "",
    patient_condition: "",
    patient_address: "",
    contact_number: "",
    is_urgent: false,
    relationship_to_patient: "",
    preferred_visit_date_and_time: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!aosForm.patient_name.trim()) e.patient_name = "Patient's name is required";
    if (!aosForm.patient_condition.trim()) e.patient_condition = "Patient's condition is required";
    if (!aosForm.patient_address.trim()) e.patient_address = "Patient's address is required";

    if (!aosForm.contact_number.trim()) e.contact_number = "Contact number is required";
    else if (!/^\d{10}$/.test(aosForm.contact_number.trim()))
      e.contact_number = "Enter a valid 10-digit contact number";

    if (aosForm.preferred_visit_date_and_time && new Date(aosForm.preferred_visit_date_and_time) <= new Date())
      e.preferred_visit_date_and_time = "Preferred date must be in the future";

    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await apiPost("/user/aos_request", { user, ...aosForm });
      if (res?.status === "success") {
        toast.success("Anointing of the Sick request sent to the priest for review. The priest will contact you shortly.");
        setaosForm({
          patient_name: "",
          patient_condition: "",
          patient_address: "",
          contact_number: "",
          is_urgent: false,
          relationship_to_patient: "",
          preferred_visit_date_and_time: "",
        });
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
              Anointing of the Sick Application
            </div>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div className="max-w-5xl mx-auto px-6 py-10">

        <p className="text-sm text-[#0F2A4A]/50 mb-8 leading-relaxed">
          Fill in the details below to request the Anointing of the Sick. If this is urgent, mark it
          so the priest can prioritize accordingly.
        </p>

        <div className="bg-white rounded-xl border border-[#e2ddd0] shadow-sm overflow-hidden">

          {/* Section: Patient Details */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
              Patient Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Field label="Patient's Name" error={errors.patient_name}>
                <input
                  value={aosForm.patient_name}
                  onChange={e => setaosForm(p => ({ ...p, patient_name: e.target.value }))}
                  placeholder="Enter patient's full name"
                  className={inputCls(errors.patient_name)}
                />
              </Field>
              <Field label="Relationship to Patient" error={errors.relationship_to_patient}>
                <input
                  value={aosForm.relationship_to_patient}
                  onChange={e => setaosForm(p => ({ ...p, relationship_to_patient: e.target.value }))}
                  placeholder="e.g. Son, Daughter, Spouse"
                  className={inputCls(errors.relationship_to_patient)}
                />
              </Field>
              <Field label="Patient's Condition" error={errors.patient_condition}>
                <input
                  value={aosForm.patient_condition}
                  onChange={e => setaosForm(p => ({ ...p, patient_condition: e.target.value }))}
                  placeholder="Briefly describe the condition"
                  className={inputCls(errors.patient_condition)}
                />
              </Field>
              <Field label="Contact Number" error={errors.contact_number}>
                <input
                  value={aosForm.contact_number}
                  onChange={e => setaosForm(p => ({ ...p, contact_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  placeholder="Enter contact number"
                  inputMode="numeric"
                  className={inputCls(errors.contact_number)}
                />
              </Field>
              <div className="col-span-2">
                <Field label="Patient's Address" error={errors.patient_address}>
                  <input
                    value={aosForm.patient_address}
                    onChange={e => setaosForm(p => ({ ...p, patient_address: e.target.value }))}
                    placeholder="Enter the patient's full address"
                    className={inputCls(errors.patient_address)}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Section: Visit Details */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
              Visit Details
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 items-start">
              <Field label="Preferred Visit Date & Time (optional)" error={errors.preferred_visit_date_and_time}>
                <input
                  type="datetime-local"
                  value={aosForm.preferred_visit_date_and_time}
                  onChange={e => setaosForm(p => ({ ...p, preferred_visit_date_and_time: e.target.value }))}
                  className={inputCls(errors.preferred_visit_date_and_time) + " cursor-pointer"}
                />
              </Field>

              <div className="flex flex-col gap-1.5">
                <Label>Is this urgent?</Label>
                <button
                  type="button"
                  onClick={() => setaosForm(p => ({ ...p, is_urgent: !p.is_urgent }))}
                  className="flex items-center gap-3 cursor-pointer select-none mt-1"
                >
                  <span
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200
                      ${aosForm.is_urgent ? 'bg-[#C9A84C]' : 'bg-[#d4c9a8]/60'}`}
                  >
                    <span
                      className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform duration-200
                        ${aosForm.is_urgent ? 'translate-x-6' : 'translate-x-1'}`}
                    />
                  </span>
                  <span className={`text-sm font-semibold ${aosForm.is_urgent ? 'text-[#c0392b]' : 'text-[#0F2A4A]/50'}`}>
                    {aosForm.is_urgent ? 'Yes, urgent' : 'No, not urgent'}
                  </span>
                </button>
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

        </div>
      </div>
    </div>
  );
};

export default AnointingOfTheSickRequestApplypage;