"use client";
import { useAuthPriest } from "@/hooks/useAuthPriest";
import { apiPut } from "@/services/axios";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  UserCog,
  Save,
  Loader2,
  User,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";

const PriestProfilePage = () => {
  const router = useRouter();
  const { loggedInPriest } = useAuthPriest();

  const [form, setForm] = useState({ priest_name: "" });
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const { setLoggedInPriest } = useAuthPriest();

  // Sync once priest data is available (e.g. after async auth hydration)
  useEffect(() => {
    if (loggedInPriest) {
      setForm({ priest_name: loggedInPriest.priest_name ?? "" });
    }
  }, [loggedInPriest]);

  const handleChange = (key, value) => {
    if (!key || !(key in form)) return;
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const validate = () => {
    if (!form.priest_name.trim()) {
      toast.warning("Priest name cannot be empty.");
      return false;
    }
    if (form.priest_name.trim().length < 3) {
      toast.warning("Name must be at least 3 characters.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!loggedInPriest) return;
    if (!validate()) return;

    setSaving(true);
    try {
      const res = await apiPut(`/priest/${loggedInPriest._id}`, {
        ...form,
        priest_name: form.priest_name.trim(),
      });
      if (res?.status !== "success") throw new Error(res?.message || "Update failed.");
      toast.success("Profile updated successfully.");
      setLoggedInPriest(res?.data);
      setIsDirty(false);
    } catch (err) {
      toast.error(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-xs text-[#0F2A4A]/50 hover:text-[#0F2A4A] mb-3 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <p className="text-xs uppercase tracking-widest text-[#C9A84C] font-medium mb-1">
          Account
        </p>
        <h1
          className="text-2xl font-semibold text-[#0F2A4A]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          My Profile
        </h1>
      </div>

      {/* Avatar + name display */}
      <div className="bg-[#0F2A4A] rounded-2xl px-6 py-6 flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
          <User className="w-7 h-7 text-[#C9A84C]" strokeWidth={1.4} />
        </div>
        <div>
          <p className="text-white font-semibold text-base leading-tight">
            {loggedInPriest?.priest_name ?? "—"}
          </p>
          <p className="text-[#C9A84C]/70 text-xs mt-0.5 uppercase tracking-widest">
            Parish Priest
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-[#0F2A4A]/10 shadow-sm overflow-hidden">

        <div className="px-5 py-4 border-b border-[#0F2A4A]/5 flex items-center gap-2">
          <UserCog className="w-4 h-4 text-[#0F2A4A]/40" />
          <span className="text-xs uppercase tracking-widest font-medium text-[#0F2A4A]/40">
            Edit details
          </span>
        </div>

        <div className="p-5 space-y-5">

          {/* Priest name field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest font-medium text-[#0F2A4A]/50">
              Priest name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.priest_name}
              onChange={(e) => handleChange("priest_name", e.target.value)}
              disabled={saving}
              placeholder="Enter your name"
              className="w-full text-sm rounded-xl border border-[#0F2A4A]/15 focus:border-[#0F2A4A]/40 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/10 px-3.5 py-2.5 text-[#0F2A4A] placeholder:text-gray-300 disabled:opacity-50 transition"
            />
          </div>

          {/* Coming soon notice */}
          <div className="flex items-start gap-3 bg-[#C9A84C]/8 border border-[#C9A84C]/25 rounded-xl px-4 py-3">
            <Clock className="w-4 h-4 text-[#C9A84C] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#0F2A4A]/60 leading-relaxed">
              More fields — profile photo, age, bio and contact details — are coming soon.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handleSubmit}
            disabled={saving || !isDirty}
            className="w-full flex items-center justify-center gap-2 bg-[#0F2A4A] hover:bg-[#1a3d6b] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-3 transition-colors"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Save className="w-4 h-4 text-[#C9A84C]" /> Save changes</>}
          </button>
          {!isDirty && !saving && (
            <p className="text-center text-xs text-gray-300 mt-2">No changes to save</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default PriestProfilePage;