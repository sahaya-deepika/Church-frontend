"use client";
import React, { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "@/services/axios";
import { toast } from "sonner";
import {
  CalendarDays,
  RefreshCcw,
  CheckCircle,
  XCircle,
  Loader2,
  Inbox,
  User,
  Phone,
  MessageSquarePlus,
  ChevronLeft,
  HandshakeIcon,
  ClipboardList,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";

// ─── helpers ──────────────────────────────────────────────────────────────────
const safeFormat = (dateStr, fmt = "dd MMM yyyy, hh:mm a") => {
  if (!dateStr) return "—";
  try {
    return format(parseISO(dateStr), fmt);
  } catch {
    return dateStr;
  }
};

const STATUS_STYLES = {
  pending:  "bg-amber-50 text-amber-600 border-amber-200",
  approved: "bg-green-50 text-green-600 border-green-200",
  rejected: "bg-red-50 text-red-500 border-red-200",
};

// ─── main page ────────────────────────────────────────────────────────────────
const ViewAllMeetingRequestsPage = () => {
  const router = useRouter();
  const [requests,   setRequests]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [submitting, setSubmitting] = useState({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet("/priest/meeting_requests");
      if (res.status !== "success") throw new Error(res.message || "Failed to fetch requests.");
      setRequests(
        res.data.map((req) => ({ ...req, priest_response: req.priest_response ?? "" }))
      );
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const updateResponse = (id, value) => {
    setRequests((prev) =>
      prev.map((r) => (r._id === id ? { ...r, priest_response: value } : r))
    );
  };

  const handleReview = async (req, decision) => {
    if (!req.priest_response.trim()) {
      toast.warning("Please enter a response before submitting.");
      return;
    }
    setSubmitting((prev) => ({ ...prev, [req._id]: decision }));
    try {
      const res = await apiPost(`/priest/meeting_requests/${req._id}`, {
        status: decision,
        priest_response: req.priest_response.trim(),
      });
      if (res.status !== "success") throw new Error(res.message || "Action failed.");
      toast.success(`Request ${decision === "approved" ? "approved" : "rejected"} successfully.`);
      setRequests((prev) =>
        prev.map((r) => (r._id === req._id ? { ...r, status: decision } : r))
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting((prev) => ({ ...prev, [req._id]: null }));
    }
  };

  if (loading) return <PageShell router={router} loading={loading} onRefresh={fetchRequests}><LoadingSkeleton /></PageShell>;
  if (error)   return <PageShell router={router} loading={loading} onRefresh={fetchRequests}><ErrorState message={error} onRetry={fetchRequests} /></PageShell>;
  if (requests.length === 0) return <PageShell router={router} loading={loading} onRefresh={fetchRequests}><EmptyState /></PageShell>;

  return (
    <PageShell router={router} loading={loading} onRefresh={fetchRequests}>
      <div className="grid grid-cols-1 gap-5">
        {requests.map((req) => (
          <MeetingRequestCard
            key={req._id}
            req={req}
            submitting={submitting[req._id]}
            onResponseChange={(val) => updateResponse(req._id, val)}
            onApprove={() => handleReview(req, "approved")}
            onReject={() => handleReview(req, "rejected")}
          />
        ))}
      </div>
    </PageShell>
  );
};

// ─── page shell ───────────────────────────────────────────────────────────────
function PageShell({ children, router, loading, onRefresh }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-[#0F2A4A]/50 hover:text-[#0F2A4A] mb-2 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <p className="text-xs uppercase tracking-widest text-[#C9A84C] font-medium mb-1">
            Meeting
          </p>
          <h1
            className="text-2xl font-semibold text-[#0F2A4A]"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Pending Requests
          </h1>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-[#0F2A4A]/60 hover:text-[#0F2A4A] border border-[#0F2A4A]/15 hover:border-[#0F2A4A]/30 rounded-lg px-3 py-2 transition-all disabled:opacity-40"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      {children}
    </div>
  );
}

// ─── request card ─────────────────────────────────────────────────────────────
function MeetingRequestCard({ req, submitting, onResponseChange, onApprove, onReject }) {
  const isActedOn = req.status && req.status !== "pending";
  const isLoading = !!submitting;

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden
        ${isActedOn ? "opacity-70 border-[#0F2A4A]/10" : "border-[#0F2A4A]/10 hover:shadow-md hover:border-[#C9A84C]/40"}`}
    >
      {/* Card top bar */}
      <div className="bg-[#0F2A4A] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
            <HandshakeIcon className="w-4 h-4 text-amber-500" strokeWidth={1.5} />
          </div>
          <span className="text-white text-sm font-medium">Meeting Request</span>
        </div>
        {req.status && (
          <span className={`text-[11px] uppercase tracking-widest font-semibold border rounded-full px-3 py-0.5 ${STATUS_STYLES[req.status] ?? STATUS_STYLES.pending}`}>
            {req.status}
          </span>
        )}
      </div>

      {/* Info grid */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InfoRow icon={<User className="w-4 h-4" />} label="Submitted by">
          <span>{req.user?.user_name ?? "—"}</span>
          {req.user?.user_mobile_number && (
            <span className="flex items-center gap-1 text-gray-400 text-xs mt-0.5">
              <Phone className="w-3 h-3" /> {req.user?.user_mobile_number}
            </span>
          )}
        </InfoRow>

        <InfoRow icon={<User className="w-4 h-4" />} label="Meeting Person">
          <span>{req.person_name ?? "—"}</span>
        </InfoRow>

        <InfoRow icon={<CalendarDays className="w-4 h-4" />} label="Preferred Meeting Date">
          <span>{safeFormat(req.preferred_meeting_date_and_time)}</span>
        </InfoRow>

        {/* meeting_purpose spans full width since it can be long */}
        <InfoRow icon={<ClipboardList className="w-4 h-4" />} label="Meeting Purpose" fullWidth>
          <span className="whitespace-pre-wrap">{req.meeting_purpose ?? "—"}</span>
        </InfoRow>
      </div>

      {/* Response + actions */}
      {!isActedOn && (
        <div className="px-5 pb-5 border-t border-[#0F2A4A]/5 pt-4">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[#0F2A4A]/60 mb-2 uppercase tracking-wide">
            <MessageSquarePlus className="w-3.5 h-3.5" />
            Your response <span className="text-red-400">*</span>
          </label>
          <textarea
            rows={2}
            placeholder="Enter a message for the person — e.g. confirmed meeting time, location, or reason for rejection…"
            value={req.priest_response}
            onChange={(e) => onResponseChange(e.target.value)}
            disabled={isLoading}
            className="w-full text-sm rounded-xl border border-[#0F2A4A]/15 focus:border-[#0F2A4A]/40 focus:outline-none focus:ring-2 focus:ring-[#0F2A4A]/10 px-3.5 py-2.5 text-[#0F2A4A] placeholder:text-gray-300 resize-none disabled:opacity-50 transition"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={onApprove}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0F2A4A] hover:bg-[#1a3d6b] disabled:opacity-50 text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
            >
              {submitting === "approved"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <CheckCircle className="w-4 h-4 text-[#C9A84C]" />}
              Approve
            </button>
            <button
              onClick={onReject}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 border border-red-200 hover:bg-red-50 disabled:opacity-50 text-red-500 text-sm font-medium rounded-xl py-2.5 transition-colors"
            >
              {submitting === "rejected"
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <XCircle className="w-4 h-4" />}
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Already-reviewed banner */}
      {isActedOn && (
        <div className="px-5 pb-4">
          <p className="text-xs text-gray-400 italic">
            Response sent: &ldquo;{req.priest_response}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────
function InfoRow({ icon, label, children, fullWidth }) {
  return (
    <div className={`flex flex-col gap-0.5 ${fullWidth ? "sm:col-span-2" : ""}`}>
      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-medium text-[#0F2A4A]/40">
        {icon} {label}
      </span>
      <div className="text-sm font-medium text-[#0F2A4A] flex flex-col">{children}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-[#0F2A4A]/10 overflow-hidden animate-pulse">
          <div className="h-12 bg-gray-100" />
          <div className="p-5 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-2">
                <div className="h-3 w-1/3 bg-gray-100 rounded" />
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          <div className="px-5 pb-5 space-y-3">
            <div className="h-16 bg-gray-100 rounded-xl" />
            <div className="flex gap-3">
              <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
              <div className="flex-1 h-10 bg-gray-100 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <RefreshCcw className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-[#0F2A4A] font-medium mb-1">Failed to load requests</p>
      <p className="text-sm text-gray-400 mb-5">{message}</p>
      <button
        onClick={onRetry}
        className="text-sm bg-[#0F2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1a3d6b] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-[#0F2A4A]/5 flex items-center justify-center mb-4">
        <Inbox className="w-6 h-6 text-[#0F2A4A]/30" />
      </div>
      <p className="text-[#0F2A4A] font-medium mb-1">No pending requests</p>
      <p className="text-sm text-gray-400">All meeting requests have been reviewed.</p>
    </div>
  );
}

export default ViewAllMeetingRequestsPage;