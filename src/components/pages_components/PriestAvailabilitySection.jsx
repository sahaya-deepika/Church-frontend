"use client";
import { apiGet } from '@/services/axios';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import { UserCircle2, CheckCircle2, XCircle, Clock, StickyNote, CalendarCheck, CalendarX } from 'lucide-react';

const PriestAvailabilitySection = () => {
  const [priestAvailabilityData, setPriestAvailabilityData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPriestAvailabilityData();
  }, []);

  const fetchPriestAvailabilityData = async () => {
    try {
      setLoading(true);
      const responseData = await apiGet(`/priest_availability/${process.env.NEXT_PUBLIC_MAIN_PRIEST_ID}`);
      if (responseData?.status === "failure") {
        throw new Error(responseData?.message);
      }
      setPriestAvailabilityData(responseData.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin" />
          <p className="text-[#0F2A4A]/50 font-sans text-sm tracking-wide">Checking availability...</p>
        </div>
      </div>
    );
  }

  if (!priestAvailabilityData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <XCircle size={32} className="text-[#0F2A4A]/20" />
        <p className="text-[#0F2A4A]/40 font-sans text-sm">No availability data found.</p>
      </div>
    );
  }

  const { priest, availability_status, available_until, next_available, notes } = priestAvailabilityData;

  const isAvailable = availability_status === "available";
  const isBusy = availability_status === "not_available";

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white border border-[#0F2A4A]/10 rounded-xl shadow-md overflow-hidden">

        {/* Status bar */}
        <div className={`h-1.5 ${isAvailable ? 'bg-emerald-400' : isBusy ? 'bg-rose-400' : 'bg-amber-400'}`} />

        <div className="p-8">
          {/* Priest identity */}
          <div className="flex items-center gap-4 mb-7">
            <div className="w-14 h-14 rounded-full bg-[#0F2A4A]/5 border border-[#C9A84C]/20 flex items-center justify-center flex-shrink-0">
              <UserCircle2 size={28} className="text-[#0F2A4A]/40" />
            </div>
            <div>
              <p className="text-[#C9A84C] uppercase text-[10px] tracking-[0.3em] font-sans mb-0.5">Parish Priest</p>
              <h3 className="text-[#0F2A4A] font-serif text-xl font-semibold">{priest.priest_name}</h3>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#0F2A4A]/6 mb-7" />

          {/* Status badge */}
          <div className="flex items-center gap-3 mb-5">
            {isAvailable ? (
              <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
            ) : isBusy ? (
              <XCircle size={20} className="text-rose-500 flex-shrink-0" />
            ) : (
              <Clock size={20} className="text-amber-500 flex-shrink-0" />
            )}
            <div>
              <p className="text-[#0F2A4A]/50 font-sans text-xs uppercase tracking-widest mb-0.5">Status</p>
              <p className={`font-sans font-semibold text-sm tracking-wide ${
                isAvailable ? 'text-emerald-600' :
                isBusy ? 'text-rose-600' :
                'text-amber-600'
              }`}>
                {isAvailable ? 'Available' : isBusy ? 'Not Available' : availability_status}
              </p>
            </div>
          </div>

          {/* Conditional date info */}
          {isAvailable && available_until && (
            <div className="flex items-center gap-3 mb-5">
              <CalendarCheck size={20} className="text-[#0F2A4A]/30 flex-shrink-0" />
              <div>
                <p className="text-[#0F2A4A]/50 font-sans text-xs uppercase tracking-widest mb-0.5">Available Until</p>
                <p className="text-[#0F2A4A] font-sans text-sm font-medium">{formatDateTime(available_until)}</p>
              </div>
            </div>
          )}

          {isBusy && next_available && (
            <div className="flex items-center gap-3 mb-5">
              <CalendarX size={20} className="text-[#0F2A4A]/30 flex-shrink-0" />
              <div>
                <p className="text-[#0F2A4A]/50 font-sans text-xs uppercase tracking-widest mb-0.5">Next Available</p>
                <p className="text-[#0F2A4A] font-sans text-sm font-medium">{formatDateTime(next_available)}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {notes && (
            <>
              <div className="h-px bg-[#0F2A4A]/6 mb-5" />
              <div className="flex gap-3">
                <StickyNote size={18} className="text-[#C9A84C] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[#0F2A4A]/50 font-sans text-xs uppercase tracking-widest mb-1">Notes</p>
                  <p className="text-[#0F2A4A]/70 font-sans text-sm leading-relaxed">{notes}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const formatDateTime = (dateString) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export default PriestAvailabilitySection;