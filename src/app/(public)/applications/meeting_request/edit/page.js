"use client";

import { useAuthUser } from '@/hooks/useAuthUser';
import { apiGet, apiPatch, apiPost } from '@/services/axios';
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, X, Save, PlusCircle, Loader2, XCircle, MoreVertical } from 'lucide-react';

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

const formatDate     = (v) => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatDateTime = (v) => v ? new Date(v).toLocaleString('en-IN',  { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const toDateTimeValue = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d) ? '' : d.toISOString().slice(0, 16);
};

// ── Card ─────────────────────────────────────────────────────────────

const MeetReqCard = ({ MeetReq, onUpdated }) => {
  const [isEditing,     setIsEditing]     = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [cancelling,    setCancelling]    = useState(false);
  const [cababMenuOpen, setCababMenuOpen] = useState(false);

  const canEdit   = MeetReq.status === 'pending';
  const canCancel = MeetReq.status === 'pending';

  const menuRef = useRef(null);

  useEffect(() => {
    if (!cababMenuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setCababMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cababMenuOpen]);

  const [form, setForm] = useState({
    person_name:                     MeetReq.person_name                     ?? '',
    meeting_purpose:                 MeetReq.meeting_purpose                 ?? '',
    preferred_meeting_date_and_time: toDateTimeValue(MeetReq.preferred_meeting_date_and_time),
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.person_name.trim())                  e.person_name                     = "Person's name is required";
    if (!form.meeting_purpose.trim())              e.meeting_purpose                 = "Meeting purpose is required";
    if (!form.preferred_meeting_date_and_time)     e.preferred_meeting_date_and_time = "Preferred date & time is required";
    else if (new Date(form.preferred_meeting_date_and_time) <= new Date())
                                                   e.preferred_meeting_date_and_time = "Preferred date must be in the future";
    return e;
  };

  const handleCancel = () => {
    setForm({
      person_name:                     MeetReq.person_name                     ?? '',
      meeting_purpose:                 MeetReq.meeting_purpose                 ?? '',
      preferred_meeting_date_and_time: toDateTimeValue(MeetReq.preferred_meeting_date_and_time),
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await apiPatch(`/user/meeting_request/${MeetReq._id}`, form);
      if (res.status === 'success') {
        toast.success("Request updated successfully.");
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
      const res = await apiPost(`/user/meeting_request/${MeetReq._id}/cancel`);
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

        {/* Left: status + meta */}
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <StatusBadge status={MeetReq.status} />
          <span className="text-xs text-[#0F2A4A]/40 shrink-0">
            Submitted {formatDate(MeetReq.createdAt)}
          </span>
          {MeetReq?.priest_response && (
            <span className="text-gray-800 text-xs md:text-sm">
              <span className="font-semibold">Priest Response:</span> {MeetReq.priest_response}
            </span>
          )}
        </div>

        {/* Right: actions */}
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
                onClick={handleCancel}
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

          {/* Kebab menu */}
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
                {cancelling
                  ? <Loader2 size={13} className="animate-spin" />
                  : <MoreVertical size={13} />}
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

      {/* Person details */}
      <div className="px-7 py-6 border-b border-[#f0ece0]">
        <SectionHeading>Person's Details</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Person's Name" error={errors.person_name}>
            {isEditing
              ? <input value={form.person_name} onChange={set('person_name')} placeholder="Enter meeting person's full name" className={inputCls(errors.person_name)} />
              : <span className="text-sm text-[#0F2A4A] font-medium">{MeetReq.person_name || '—'}</span>
            }
          </Field>
          <Field label="Preferred Meeting Date & Time" error={errors.preferred_meeting_date_and_time}>
            {isEditing
              ? <input type="datetime-local" value={form.preferred_meeting_date_and_time} onChange={set('preferred_meeting_date_and_time')} className={inputCls(errors.preferred_meeting_date_and_time) + ' cursor-pointer'} />
              : <span className="text-sm text-[#0F2A4A] font-medium">{formatDateTime(MeetReq.preferred_meeting_date_and_time)}</span>
            }
          </Field>
        </div>
      </div>

      {/* Meeting purpose */}
      <div className="px-7 py-6">
        <SectionHeading>Meeting Purpose</SectionHeading>
        <Field label="Purpose of Meeting" error={errors.meeting_purpose}>
          {isEditing
            ? <textarea
                rows={3}
                value={form.meeting_purpose}
                onChange={set('meeting_purpose')}
                placeholder="Briefly describe the purpose of this meeting request…"
                className={inputCls(errors.meeting_purpose) + ' resize-none'}
              />
            : <span className="text-sm text-[#0F2A4A] font-medium whitespace-pre-wrap">{MeetReq.meeting_purpose || '—'}</span>
          }
        </Field>
      </div>

    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────

const MeetingRequestEditPage = () => {
  const router = useRouter();
  const { user } = useAuthUser();
  const [allMeetingRequests, setAllMeetingRequests] = useState([]);
  const [fetching, setFetching] = useState(true);

  const fetchExistingMeetingRequests = async () => {
    try {
      const res = await apiGet("/user/meeting_request");
      if (res.status === "success") setAllMeetingRequests(res.data);
      else throw new Error(res?.message);
    } catch (err) {
      toast.error(err.message ?? "Failed to load meeting requests.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchExistingMeetingRequests(); }, []);

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
              Meeting Request
            </div>
            <div className="text-white font-bold text-base tracking-[0.2px] leading-none">
              Meeting Requests
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-10">

        {fetching ? (
          <div className="text-sm text-[#0F2A4A]/40 py-16 text-center">Loading…</div>

        ) : allMeetingRequests.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#e2ddd0] shadow-sm px-8 py-14 flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#f4f2ed] border border-[#e2ddd0] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <rect x="7" y="1" width="2" height="14" rx="1" fill="#C9A84C" />
                <rect x="2" y="5" width="12" height="2" rx="1" fill="#C9A84C" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F2A4A] mb-1">No meeting requests yet</p>
              <p className="text-xs text-[#0F2A4A]/45">Submit a new request to get started.</p>
            </div>
            <button
              onClick={() => router.push("/applications/meeting_request/apply")}
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
                {allMeetingRequests.length} request{allMeetingRequests.length > 1 ? 's' : ''} found. Pending requests can be edited.
              </p>
              <button
                onClick={() => router.push("/applications/meeting_request/apply")}
                className="flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A] font-bold text-xs uppercase tracking-[0.8px] px-4 py-2 rounded-[7px] transition-colors cursor-pointer border-none font-[inherit]"
              >
                <PlusCircle size={12} />
                New Request
              </button>
            </div>
            {allMeetingRequests.map(MeetReq => (
              <MeetReqCard
                key={MeetReq._id}
                MeetReq={MeetReq}
                onUpdated={fetchExistingMeetingRequests}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MeetingRequestEditPage;