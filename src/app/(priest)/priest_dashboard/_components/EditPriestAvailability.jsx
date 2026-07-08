import { apiPut, apiGet } from "@/services/axios";
import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  CalendarCheck,
  CalendarX,
  HelpCircle,
  StickyNote,
  RefreshCw,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

// ── Constants ─────────────────────────────────────────────────────
const AVAILABILITY_STATUS = {
  available: {
    label: "Available",
    icon: CheckCircle2,
    accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    panel: "bg-emerald-50/50 border-emerald-100",
    iconColor: "text-emerald-500",
    previewColor: "text-emerald-600",
  },
  not_available: {
    label: "Not Available",
    icon: AlertCircle,
    accent: "bg-red-50 text-red-700 border-red-200",
    panel: "bg-red-50/50 border-red-100",
    iconColor: "text-red-400",
    previewColor: "text-red-500",
  },
  not_set: {
    label: "Not Set",
    icon: HelpCircle,
    accent: "bg-[#0F2A4A]/5 text-[#0F2A4A]/50 border-[#0F2A4A]/10",
    panel: "",
    iconColor: "text-[#0F2A4A]/30",
    previewColor: "",
  },
};

const INITIAL_FORM = {
  availability_status: "",
  available_until: "",   // stored as datetime-local string "YYYY-MM-DDTHH:mm"
  next_available: "",    // stored as datetime-local string "YYYY-MM-DDTHH:mm"
  notes: "",
};

const INITIAL_ERRORS = {
  availability_status: "",
  available_until: "",
  next_available: "",
  notes: "",
};

// ── Helpers ───────────────────────────────────────────────────────
const getNowLocalStr = () => {
  const now = new Date();
  // format to "YYYY-MM-DDTHH:mm" for datetime-local min attribute
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

// Convert ISO / date-only string → datetime-local input value
const toDatetimeLocal = (isoStr) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  if (isNaN(d)) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDisplayDatetime = (datetimeLocalStr) => {
  if (!datetimeLocalStr) return null;
  const d = new Date(datetimeLocalStr);
  if (isNaN(d)) return null;
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// ── Sub-components ────────────────────────────────────────────────
const FieldLabel = ({ htmlFor, children, required }) => (
  <label
    htmlFor={htmlFor}
    className="block font-sans text-[10px] text-[#0F2A4A]/45 uppercase tracking-widest font-medium mb-1.5"
  >
    {children}
    {required && <span className="text-[#C9A84C] ml-0.5">*</span>}
  </label>
);

const FieldError = ({ message }) =>
  message ? (
    <p className="mt-1.5 font-sans text-[11px] text-red-500 flex items-center gap-1">
      <AlertCircle size={11} className="flex-shrink-0" />
      {message}
    </p>
  ) : null;

const StatusOption = ({ status, selected, onClick }) => {
  const cfg = AVAILABILITY_STATUS[status];
  const Icon = cfg.icon;
  return (
    <button
      type="button"
      onClick={() => onClick(status)}
      className={`
        flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-3 sm:py-2.5 rounded-sm border
        font-sans text-[10px] sm:text-xs font-semibold transition-all duration-150 cursor-pointer
        ${
          selected
            ? cfg.accent + " shadow-sm"
            : "bg-white border-[#0F2A4A]/8 text-[#0F2A4A]/40 hover:border-[#0F2A4A]/20 hover:text-[#0F2A4A]/60"
        }
      `}
    >
      <Icon size={14} />
      <span className="text-center leading-tight">{cfg.label}</span>
    </button>
  );
};

// Skeleton
const SkeletonLoader = () => (
  <div className="bg-white rounded-sm border border-[#0F2A4A]/8 p-4 md:p-6 shadow-sm space-y-5 animate-pulse">
    <div className="h-3 w-28 bg-[#0F2A4A]/8 rounded" />
    <div className="flex gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 h-14 sm:h-10 bg-[#0F2A4A]/6 rounded-sm" />
      ))}
    </div>
    <div className="h-3 w-24 bg-[#0F2A4A]/8 rounded" />
    <div className="h-10 bg-[#0F2A4A]/6 rounded-sm" />
    <div className="h-3 w-20 bg-[#0F2A4A]/8 rounded" />
    <div className="h-16 bg-[#0F2A4A]/6 rounded-sm" />
    <div className="h-9 w-28 bg-[#0F2A4A]/8 rounded-sm ml-auto" />
  </div>
);

// Datetime input with clock icon
const DatetimeInput = ({ id, value, onChange, hasError, min }) => (
  <div className="relative">
    <input
      id={id}
      type="datetime-local"
      min={min ?? getNowLocalStr()}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`
        w-full font-sans text-sm text-[#0F2A4A] bg-white border rounded-sm px-3 py-2.5 pr-9
        focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50
        transition-colors duration-150
        ${hasError ? "border-red-300 bg-red-50/20" : "border-[#0F2A4A]/12"}
      `}
    />
    <Clock
      size={13}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0F2A4A]/25 pointer-events-none"
    />
  </div>
);

// ── Main component ────────────────────────────────────────────────
const EditPriestAvailability = ({ loggedInPriestId }) => {
  const [priestAvailabilityData, setPriestAvailabilityData] = useState(null);
  const [fetchingAvailability, setFetchingAvailability] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [isDirty, setIsDirty] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────
  const fetchLoggedInPriestAvailability = useCallback(async () => {
    if (!loggedInPriestId) return;
    try {
      setFetchingAvailability(true);
      setFetchError(null);
      const res = await apiGet(`/priest_availability/${loggedInPriestId}`);
      if (res?.status === "success") {
        setPriestAvailabilityData(res.data);
        mapToForm(res.data);
      } else {
        throw new Error(res?.message || "Failed to fetch availability.");
      }
    } catch (err) {
      const msg = err?.message ?? "Something went wrong. Please try again.";
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setFetchingAvailability(false);
    }
  }, [loggedInPriestId]);

  useEffect(() => {
    fetchLoggedInPriestAvailability();
  }, [fetchLoggedInPriestAvailability]);

  const mapToForm = (data) => {
    if (!data) return;
    setForm({
      availability_status: data.availability_status ?? "",
      available_until: toDatetimeLocal(data.available_until),
      next_available: toDatetimeLocal(data.next_available),
      notes: data.notes ?? "",
    });
    setIsDirty(false);
    setErrors(INITIAL_ERRORS);
  };

  // ── Form change ────────────────────────────────────────────────
  const handleChange = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "available_until") next.next_available = "";
      if (key === "next_available") next.available_until = "";
      if (key === "availability_status") {
        next.available_until = "";
        next.next_available = "";
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setIsDirty(true);
  };

  // ── Validation ─────────────────────────────────────────────────
  const validate = () => {
    const newErrors = { ...INITIAL_ERRORS };
    let valid = true;
    const nowStr = getNowLocalStr();

    if (!form.availability_status) {
      newErrors.availability_status = "Please select an availability status.";
      valid = false;
    }

    if (form.availability_status === "available") {
      if (!form.available_until) {
        newErrors.available_until = "Please specify when you are available until.";
        valid = false;
      } else if (form.available_until <= nowStr) {
        newErrors.available_until = "Available until must be a future date and time.";
        valid = false;
      }
    }

    if (form.availability_status === "not_available") {
      if (!form.next_available) {
        newErrors.next_available = "Please specify when you will next be available.";
        valid = false;
      } else if (form.next_available <= nowStr) {
        newErrors.next_available = "Next available must be a future date and time.";
        valid = false;
      }
    }

    if (form.notes.length > 300) {
      newErrors.notes = "Notes must be 300 characters or fewer.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // ── Submit ─────────────────────────────────────────────────────
  const handleUpdate = async () => {
    if (!validate()) {
      toast.error("Please fix the errors before saving.");
      return;
    }
    try {
      setUpdatingAvailability(true);
      const payload = {
        availability_status: form.availability_status,
        notes: form.notes.trim(),
        available_until:
          form.availability_status === "available"
            ? new Date(form.available_until).toISOString()
            : null,
        next_available:
          form.availability_status === "not_available"
            ? new Date(form.next_available).toISOString()
            : null,
      };
      const res = await apiPut(
        `/priest_availability/${priestAvailabilityData?._id}`,
        payload
      );
      if (res?.status === "success") {
        toast.success("Availability updated successfully.");
        setPriestAvailabilityData((prev) => ({ ...prev, ...payload }));
        setIsDirty(false);
      } else {
        throw new Error(res?.message || "Update failed.");
      }
    } catch (err) {
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleReset = () => {
    mapToForm(priestAvailabilityData);
    toast.info("Changes discarded.");
  };

  // ── Render states ──────────────────────────────────────────────
  if (fetchingAvailability) return <SkeletonLoader />;

  if (fetchError) {
    return (
      <div className="bg-white rounded-sm border border-red-100 p-6 shadow-sm flex flex-col items-center gap-3 text-center">
        <AlertCircle size={28} className="text-red-400" />
        <p className="font-sans text-[#0F2A4A]/60 text-sm">{fetchError}</p>
        <button
          onClick={fetchLoggedInPriestAvailability}
          className="flex items-center gap-2 font-sans text-xs font-semibold text-[#0F2A4A] bg-[#0F2A4A]/5 hover:bg-[#0F2A4A]/10 px-4 py-2 rounded-sm transition-colors duration-150"
        >
          <RefreshCw size={13} />
          Retry
        </button>
      </div>
    );
  }

  const currentStatusCfg = AVAILABILITY_STATUS[form.availability_status];

  return (
    <div className="bg-white rounded-sm border border-[#0F2A4A]/8 shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="px-4 md:px-6 py-4 border-b border-[#0F2A4A]/8 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-sm bg-[#0F2A4A]/5 flex items-center justify-center flex-shrink-0">
            <CalendarCheck size={15} className="text-[#0F2A4A]/50" />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-[#0F2A4A] text-sm font-semibold">
              Availability Settings
            </p>
            <p className="font-sans text-[#0F2A4A]/35 text-[10px] mt-0.5 hidden sm:block">
              Let parishioners know when you're reachable
            </p>
          </div>
        </div>
        {form.availability_status && currentStatusCfg && (
          <span
            className={`flex-shrink-0 flex items-center gap-1.5 text-[9px] sm:text-[10px] font-sans font-semibold uppercase tracking-widest px-2 sm:px-2.5 py-1 rounded-sm border ${currentStatusCfg.accent}`}
          >
            {React.createElement(currentStatusCfg.icon, { size: 10 })}
            <span className="hidden sm:inline">{currentStatusCfg.label}</span>
          </span>
        )}
      </div>

      {/* Form body */}
      <div className="px-4 md:px-6 py-5 md:py-6 space-y-5 md:space-y-6">

        {/* Status selector */}
        <div>
          <FieldLabel required>Availability Status</FieldLabel>
          <div className="flex gap-2">
            {Object.keys(AVAILABILITY_STATUS).map((status) => (
              <StatusOption
                key={status}
                status={status}
                selected={form.availability_status === status}
                onClick={(v) => handleChange("availability_status", v)}
              />
            ))}
          </div>
          <FieldError message={errors.availability_status} />
        </div>

        {/* Available Until (date + time) */}
        {form.availability_status === "available" && (
          <div className={`p-4 rounded-sm border ${AVAILABILITY_STATUS.available.panel}`}>
            <FieldLabel htmlFor="available_until" required>
              <CalendarCheck size={10} className="inline mr-1 text-emerald-500" />
              Available Until — Date &amp; Time
            </FieldLabel>
            <DatetimeInput
              id="available_until"
              value={form.available_until}
              onChange={(v) => handleChange("available_until", v)}
              hasError={!!errors.available_until}
            />
            <FieldError message={errors.available_until} />
            {form.available_until && !errors.available_until && (
              <p className="mt-1.5 font-sans text-[10px] text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={10} />
                Until {formatDisplayDatetime(form.available_until)}
              </p>
            )}
          </div>
        )}

        {/* Next Available (date + time) */}
        {form.availability_status === "not_available" && (
          <div className={`p-4 rounded-sm border ${AVAILABILITY_STATUS.not_available.panel}`}>
            <FieldLabel htmlFor="next_available" required>
              <CalendarX size={10} className="inline mr-1 text-red-400" />
              Next Available From — Date &amp; Time
            </FieldLabel>
            <DatetimeInput
              id="next_available"
              value={form.next_available}
              onChange={(v) => handleChange("next_available", v)}
              hasError={!!errors.next_available}
            />
            <FieldError message={errors.next_available} />
            {form.next_available && !errors.next_available && (
              <p className="mt-1.5 font-sans text-[10px] text-red-500 flex items-center gap-1">
                <AlertCircle size={10} />
                Available again from {formatDisplayDatetime(form.next_available)}
              </p>
            )}
          </div>
        )}

        {/* Notes */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <FieldLabel htmlFor="notes">
              <StickyNote size={10} className="inline mr-1" />
              Notes
            </FieldLabel>
            <span
              className={`font-sans text-[10px] ${
                form.notes.length > 280
                  ? form.notes.length > 300
                    ? "text-red-500"
                    : "text-amber-500"
                  : "text-[#0F2A4A]/25"
              }`}
            >
              {form.notes.length}/300
            </span>
          </div>
          <textarea
            id="notes"
            rows={3}
            placeholder="E.g. Available for emergencies, please call ahead for meetings…"
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            className={`
              w-full font-sans text-sm text-[#0F2A4A] placeholder-[#0F2A4A]/20 bg-[#0F2A4A]/2 border rounded-sm px-3 py-2.5 resize-none
              focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50 focus:bg-white
              transition-colors duration-150
              ${errors.notes ? "border-red-300 bg-red-50/30" : "border-[#0F2A4A]/10"}
            `}
          />
          <FieldError message={errors.notes} />
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-t border-[#0F2A4A]/8 bg-[#0F2A4A]/1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="font-sans text-[10px] text-[#0F2A4A]/25 tracking-wide">
          {isDirty ? "You have unsaved changes." : "No pending changes."}
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isDirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={updatingAvailability}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-sans text-xs font-medium text-[#0F2A4A]/50 hover:text-[#0F2A4A]/80 px-3 py-2 rounded-sm border border-[#0F2A4A]/10 hover:border-[#0F2A4A]/20 transition-colors duration-150 disabled:opacity-40"
            >
              <RefreshCw size={12} />
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={handleUpdate}
            disabled={updatingAvailability || !isDirty}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 font-sans text-xs font-semibold text-white bg-[#0F2A4A] hover:bg-[#0F2A4A]/90 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-sm shadow-sm transition-all duration-150"
          >
            {updatingAvailability ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save size={13} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};



export default EditPriestAvailability;

// import { apiPut, apiGet } from "@/services/axios";
// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { toast } from "sonner";
// import {
//   CalendarCheck,
//   CalendarX,
//   HelpCircle,
//   StickyNote,
//   RefreshCw,
//   Save,
//   Loader2,
//   CheckCircle2,
//   AlertCircle,
//   Clock,
//   ChevronDown,
//   X,
// } from "lucide-react";

// // ─────────────────────────────────────────────────────────────────
// // CONSTANTS
// // ─────────────────────────────────────────────────────────────────
// const AVAILABILITY_STATUS = {
//   available: {
//     label: "Available",
//     icon: CheckCircle2,
//     accent: "bg-emerald-50 text-emerald-700 border-emerald-200",
//     panel: "bg-emerald-50/50 border-emerald-100",
//     previewColor: "text-emerald-600",
//     previewIcon: CheckCircle2,
//   },
//   not_available: {
//     label: "Not Available",
//     icon: AlertCircle,
//     accent: "bg-red-50 text-red-700 border-red-200",
//     panel: "bg-red-50/50 border-red-100",
//     previewColor: "text-red-500",
//     previewIcon: AlertCircle,
//   },
//   not_set: {
//     label: "Not Set",
//     icon: HelpCircle,
//     accent: "bg-[#0F2A4A]/5 text-[#0F2A4A]/50 border-[#0F2A4A]/10",
//     panel: "",
//     previewColor: "",
//     previewIcon: null,
//   },
// };

// const INITIAL_FORM = {
//   availability_status: "",
//   available_until_date: "",
//   available_until_hour: 9,
//   available_until_minute: 0,
//   available_until_period: "AM",
//   next_available_date: "",
//   next_available_hour: 9,
//   next_available_minute: 0,
//   next_available_period: "AM",
//   notes: "",
// };

// const INITIAL_ERRORS = {
//   availability_status: "",
//   available_until: "",
//   next_available: "",
//   notes: "",
// };

// // ─────────────────────────────────────────────────────────────────
// // HELPERS
// // ─────────────────────────────────────────────────────────────────
// const pad = (n) => String(n).padStart(2, "0");

// const getTodayStr = () => {
//   const d = new Date();
//   return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// };

// const toDatetimeParts = (isoStr) => {
//   if (!isoStr) return null;
//   const d = new Date(isoStr);
//   if (isNaN(d)) return null;
//   const h24 = d.getHours();
//   const period = h24 >= 12 ? "PM" : "AM";
//   const hour = h24 % 12 === 0 ? 12 : h24 % 12;
//   return {
//     date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
//     hour,
//     minute: d.getMinutes(),
//     period,
//   };
// };

// const buildISOFromParts = (date, hour, minute, period) => {
//   if (!date) return null;
//   let h = Number(hour);
//   if (period === "AM") {
//     if (h === 12) h = 0;
//   } else {
//     if (h !== 12) h += 12;
//   }
//   return new Date(`${date}T${pad(h)}:${pad(minute)}:00`).toISOString();
// };

// const formatDisplayDatetime = (date, hour, minute, period) => {
//   if (!date) return null;
//   const iso = buildISOFromParts(date, hour, minute, period);
//   if (!iso) return null;
//   const d = new Date(iso);
//   return d.toLocaleString("en-US", {
//     weekday: "short",
//     month: "long",
//     day: "numeric",
//     year: "numeric",
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   });
// };

// // ─────────────────────────────────────────────────────────────────
// // CIRCULAR CLOCK PICKER
// // ─────────────────────────────────────────────────────────────────
// const ClockPicker = ({ hour, minute, period, onChange, onClose, accentColor = "#0F2A4A" }) => {
//   const [mode, setMode] = useState("hour"); // "hour" | "minute"
//   const svgRef = useRef(null);

//   const SIZE = 260;
//   const CX = SIZE / 2;
//   const CY = SIZE / 2;
//   const HOUR_R = 90;
//   const MINUTE_R = 90;
//   const HAND_R_HOUR = 72;
//   const HAND_R_MIN = 72;
//   const DOT_R = 18;
//   const TICK_INNER = 76;
//   const TICK_OUTER = 85;

//   // ── compute angles ──────────────────────────────────────────────
//   const hourAngleDeg = ((hour % 12) / 12) * 360 - 90;
//   const minuteAngleDeg = (minute / 60) * 360 - 90;

//   const polarToCart = (angle, r) => ({
//     x: CX + r * Math.cos((angle * Math.PI) / 180),
//     y: CY + r * Math.sin((angle * Math.PI) / 180),
//   });

//   // ── drag/tap handler ────────────────────────────────────────────
//   const handleSVGInteraction = useCallback(
//     (e) => {
//       e.preventDefault();
//       const svg = svgRef.current;
//       if (!svg) return;
//       const rect = svg.getBoundingClientRect();
//       const clientX = e.touches ? e.touches[0].clientX : e.clientX;
//       const clientY = e.touches ? e.touches[0].clientY : e.clientY;
//       const x = ((clientX - rect.left) / rect.width) * SIZE - CX;
//       const y = ((clientY - rect.top) / rect.height) * SIZE - CY;
//       const angleDeg = (Math.atan2(y, x) * 180) / Math.PI + 90;
//       const normalised = ((angleDeg % 360) + 360) % 360;

//       if (mode === "hour") {
//         const rawHour = Math.round(normalised / 30) % 12 || 12;
//         onChange({ hour: rawHour, minute, period });
//       } else {
//         const rawMinute = Math.round(normalised / 6) % 60;
//         onChange({ hour, minute: rawMinute, period });
//       }
//     },
//     [mode, hour, minute, period, onChange]
//   );

//   // ── build hour/minute labels ────────────────────────────────────
//   const hourLabels = Array.from({ length: 12 }, (_, i) => {
//     const val = i + 1;
//     const ang = (val / 12) * 360 - 90;
//     const pos = polarToCart(ang, HOUR_R - 18);
//     const isActive = hour === val;
//     return { val, pos, isActive };
//   });

//   const minuteLabels = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((val) => {
//     const ang = (val / 60) * 360 - 90;
//     const pos = polarToCart(ang, MINUTE_R - 18);
//     const isActive = minute === val;
//     return { val, pos, isActive };
//   });

//   // ── hand ────────────────────────────────────────────────────────
//   const handAngle = mode === "hour" ? hourAngleDeg : minuteAngleDeg;
//   const handR = mode === "hour" ? HAND_R_HOUR : HAND_R_MIN;
//   const handEnd = polarToCart(handAngle, handR);
//   const dotPos = polarToCart(handAngle, handR);

//   const labels = mode === "hour" ? hourLabels : minuteLabels;
//   const activeVal = mode === "hour" ? hour : minute;

//   return (
//     <div className="bg-white rounded-xl border border-[#0F2A4A]/10 shadow-2xl shadow-[#0F2A4A]/15 overflow-hidden w-72">
//       {/* Header */}
//       <div className="bg-[#0A1F3A] px-5 py-4 flex items-center justify-between">
//         <div className="flex items-center gap-3">
//           {/* Hour */}
//           <button
//             onClick={() => setMode("hour")}
//             className={`font-serif text-4xl font-bold leading-none transition-colors ${
//               mode === "hour" ? "text-[#C9A84C]" : "text-white/35 hover:text-white/60"
//             }`}
//           >
//             {pad(hour)}
//           </button>
//           <span className="text-white/30 font-serif text-3xl font-bold">:</span>
//           {/* Minute */}
//           <button
//             onClick={() => setMode("minute")}
//             className={`font-serif text-4xl font-bold leading-none transition-colors ${
//               mode === "minute" ? "text-[#C9A84C]" : "text-white/35 hover:text-white/60"
//             }`}
//           >
//             {pad(minute)}
//           </button>
//         </div>
//         {/* AM / PM */}
//         <div className="flex flex-col gap-1">
//           {["AM", "PM"].map((p) => (
//             <button
//               key={p}
//               onClick={() => onChange({ hour, minute, period: p })}
//               className={`font-sans text-xs font-bold px-2 py-0.5 rounded transition-all ${
//                 period === p
//                   ? "bg-[#C9A84C] text-[#0A1F3A]"
//                   : "text-white/30 hover:text-white/60"
//               }`}
//             >
//               {p}
//             </button>
//           ))}
//         </div>
//         {/* Close */}
//         <button
//           onClick={onClose}
//           className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-white/40 hover:text-white hover:bg-white/20 transition-colors ml-2"
//         >
//           <X size={12} />
//         </button>
//       </div>

//       {/* Mode tabs */}
//       <div className="flex border-b border-[#0F2A4A]/8">
//         {["hour", "minute"].map((m) => (
//           <button
//             key={m}
//             onClick={() => setMode(m)}
//             className={`flex-1 py-2 font-sans text-[10px] uppercase tracking-widest font-semibold transition-colors ${
//               mode === m
//                 ? "text-[#0F2A4A] border-b-2 border-[#C9A84C]"
//                 : "text-[#0F2A4A]/30 hover:text-[#0F2A4A]/60"
//             }`}
//           >
//             {m === "hour" ? "Hour" : "Minute"}
//           </button>
//         ))}
//       </div>

//       {/* Clock face */}
//       <div className="flex items-center justify-center p-4">
//         <svg
//           ref={svgRef}
//           viewBox={`0 0 ${SIZE} ${SIZE}`}
//           width={SIZE}
//           height={SIZE}
//           style={{ touchAction: "none", cursor: "crosshair" }}
//           onClick={handleSVGInteraction}
//           onMouseMove={(e) => e.buttons === 1 && handleSVGInteraction(e)}
//           onTouchStart={handleSVGInteraction}
//           onTouchMove={handleSVGInteraction}
//         >
//           {/* Clock bg */}
//           <circle cx={CX} cy={CY} r={SIZE / 2 - 4} fill="#F4F6F9" />

//           {/* Minute ticks */}
//           {Array.from({ length: 60 }).map((_, i) => {
//             const ang = (i / 60) * 360 - 90;
//             const isMajor = i % 5 === 0;
//             const p1 = polarToCart(ang, isMajor ? TICK_INNER - 4 : TICK_INNER);
//             const p2 = polarToCart(ang, TICK_OUTER - 2);
//             return (
//               <line
//                 key={i}
//                 x1={p1.x} y1={p1.y}
//                 x2={p2.x} y2={p2.y}
//                 stroke={isMajor ? "#0F2A4A" : "#0F2A4A"}
//                 strokeOpacity={isMajor ? 0.15 : 0.07}
//                 strokeWidth={isMajor ? 1.5 : 0.8}
//               />
//             );
//           })}

//           {/* Center dot */}
//           <circle cx={CX} cy={CY} r={4} fill="#0F2A4A" fillOpacity={0.6} />

//           {/* Hand */}
//           <line
//             x1={CX} y1={CY}
//             x2={handEnd.x} y2={handEnd.y}
//             stroke="#0F2A4A"
//             strokeWidth={2}
//             strokeLinecap="round"
//             strokeOpacity={0.5}
//           />

//           {/* Active dot on hand tip */}
//           <circle
//             cx={dotPos.x} cy={dotPos.y} r={DOT_R}
//             fill="#C9A84C"
//             fillOpacity={0.9}
//           />

//           {/* Labels */}
//           {labels.map(({ val, pos, isActive }) => (
//             <text
//               key={val}
//               x={pos.x}
//               y={pos.y}
//               textAnchor="middle"
//               dominantBaseline="central"
//               fontSize={isActive ? 13 : 12}
//               fontWeight={isActive ? "700" : "500"}
//               fill={isActive ? "#0A1F3A" : "#0F2A4A"}
//               fillOpacity={isActive ? 1 : 0.45}
//               style={{ userSelect: "none", pointerEvents: "none", fontFamily: "sans-serif" }}
//             >
//               {pad(val)}
//             </text>
//           ))}
//         </svg>
//       </div>

//       {/* Quick minute presets */}
//       {mode === "minute" && (
//         <div className="px-4 pb-4 flex gap-2 flex-wrap justify-center">
//           {[0, 15, 30, 45].map((m) => (
//             <button
//               key={m}
//               onClick={() => onChange({ hour, minute: m, period })}
//               className={`font-sans text-xs font-semibold px-3 py-1.5 rounded-sm border transition-all ${
//                 minute === m
//                   ? "bg-[#C9A84C] text-[#0A1F3A] border-[#C9A84C]"
//                   : "bg-white border-[#0F2A4A]/10 text-[#0F2A4A]/50 hover:border-[#C9A84C]/40 hover:text-[#0F2A4A]"
//               }`}
//             >
//               :{pad(m)}
//             </button>
//           ))}
//         </div>
//       )}

//       {/* Confirm */}
//       <div className="px-4 pb-4">
//         <button
//           onClick={onClose}
//           className="w-full bg-[#0F2A4A] hover:bg-[#0F2A4A]/90 text-white font-sans text-xs font-semibold py-2.5 rounded-sm transition-colors"
//         >
//           Confirm Time — {pad(hour)}:{pad(minute)} {period}
//         </button>
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────
// // DATE + TIME FIELD
// // ─────────────────────────────────────────────────────────────────
// const DateTimeField = ({
//   id,
//   dateValue,
//   hour,
//   minute,
//   period,
//   onDateChange,
//   onTimeChange,
//   hasError,
//   accentClass,
// }) => {
//   const [clockOpen, setClockOpen] = useState(false);
//   const wrapRef = useRef(null);

//   // Close on outside click
//   useEffect(() => {
//     if (!clockOpen) return;
//     const handler = (e) => {
//       if (wrapRef.current && !wrapRef.current.contains(e.target)) {
//         setClockOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     document.addEventListener("touchstart", handler);
//     return () => {
//       document.removeEventListener("mousedown", handler);
//       document.removeEventListener("touchstart", handler);
//     };
//   }, [clockOpen]);

//   return (
//     <div className="flex flex-col sm:flex-row gap-2">
//       {/* Date input */}
//       <div className="flex-1">
//         <p className="font-sans text-[9px] text-[#0F2A4A]/40 uppercase tracking-widest mb-1">Date</p>
//         <input
//           id={id}
//           type="date"
//           min={getTodayStr()}
//           value={dateValue}
//           onChange={(e) => onDateChange(e.target.value)}
//           className={`w-full font-sans text-sm text-[#0F2A4A] bg-white border rounded-sm px-3 py-2.5
//             focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50
//             transition-colors duration-150
//             ${hasError ? "border-red-300 bg-red-50/20" : "border-[#0F2A4A]/12"}`}
//         />
//       </div>

//       {/* Time trigger */}
//       <div className="relative" ref={wrapRef}>
//         <p className="font-sans text-[9px] text-[#0F2A4A]/40 uppercase tracking-widest mb-1">Time</p>
//         <button
//           type="button"
//           onClick={() => setClockOpen((v) => !v)}
//           className={`flex items-center gap-2 w-full sm:w-36 font-sans text-sm font-medium border rounded-sm px-3 py-2.5
//             transition-all duration-150 bg-white
//             ${clockOpen
//               ? "border-[#C9A84C]/60 ring-1 ring-[#C9A84C]/30 text-[#0F2A4A]"
//               : hasError
//               ? "border-red-300 text-[#0F2A4A]/60"
//               : "border-[#0F2A4A]/12 text-[#0F2A4A]/60 hover:border-[#0F2A4A]/25 hover:text-[#0F2A4A]"
//             }`}
//         >
//           <Clock size={14} className="text-[#0F2A4A]/30 flex-shrink-0" />
//           <span className="flex-1 text-left">
//             {pad(hour)}:{pad(minute)} {period}
//           </span>
//           <ChevronDown
//             size={13}
//             className={`text-[#0F2A4A]/25 transition-transform ${clockOpen ? "rotate-180" : ""}`}
//           />
//         </button>

//         {/* Clock dropdown — opens upward on mobile to avoid viewport clip */}
//         {clockOpen && (
//           <div className="absolute right-0 z-50 mt-1 sm:mt-1 bottom-full sm:bottom-auto mb-1 sm:mb-0">
//             <ClockPicker
//               hour={hour}
//               minute={minute}
//               period={period}
//               onChange={onTimeChange}
//               onClose={() => setClockOpen(false)}
//             />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────────────────────────
// // SHARED SUB-COMPONENTS
// // ─────────────────────────────────────────────────────────────────
// const FieldLabel = ({ children, required }) => (
//   <label className="block font-sans text-[10px] text-[#0F2A4A]/45 uppercase tracking-widest font-medium mb-2">
//     {children}
//     {required && <span className="text-[#C9A84C] ml-0.5">*</span>}
//   </label>
// );

// const FieldError = ({ message }) =>
//   message ? (
//     <p className="mt-1.5 font-sans text-[11px] text-red-500 flex items-center gap-1">
//       <AlertCircle size={11} className="flex-shrink-0" />
//       {message}
//     </p>
//   ) : null;

// const StatusOption = ({ status, selected, onClick }) => {
//   const cfg = AVAILABILITY_STATUS[status];
//   const Icon = cfg.icon;
//   return (
//     <button
//       type="button"
//       onClick={() => onClick(status)}
//       className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2
//         px-2 sm:px-3 py-3 sm:py-2.5 rounded-sm border
//         font-sans text-[10px] sm:text-xs font-semibold transition-all duration-150 cursor-pointer
//         ${selected
//           ? cfg.accent + " shadow-sm"
//           : "bg-white border-[#0F2A4A]/8 text-[#0F2A4A]/40 hover:border-[#0F2A4A]/20 hover:text-[#0F2A4A]/60"
//         }`}
//     >
//       <Icon size={14} />
//       <span className="text-center leading-tight">{cfg.label}</span>
//     </button>
//   );
// };

// const SkeletonLoader = () => (
//   <div className="bg-white rounded-sm border border-[#0F2A4A]/8 p-4 md:p-6 shadow-sm space-y-5 animate-pulse">
//     <div className="h-3 w-28 bg-[#0F2A4A]/8 rounded" />
//     <div className="flex gap-2">
//       {[1, 2, 3].map((i) => <div key={i} className="flex-1 h-14 sm:h-10 bg-[#0F2A4A]/6 rounded-sm" />)}
//     </div>
//     <div className="h-3 w-24 bg-[#0F2A4A]/8 rounded" />
//     <div className="h-20 bg-[#0F2A4A]/6 rounded-sm" />
//     <div className="h-3 w-20 bg-[#0F2A4A]/8 rounded" />
//     <div className="h-16 bg-[#0F2A4A]/6 rounded-sm" />
//     <div className="h-9 w-28 bg-[#0F2A4A]/8 rounded-sm ml-auto" />
//   </div>
// );

// // ─────────────────────────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────────────────────────
// const EditPriestAvailability = ({ loggedInPriestId }) => {
//   const [priestAvailabilityData, setPriestAvailabilityData] = useState(null);
//   const [fetchingAvailability, setFetchingAvailability] = useState(false);
//   const [fetchError, setFetchError] = useState(null);

//   const [form, setForm] = useState(INITIAL_FORM);
//   const [errors, setErrors] = useState(INITIAL_ERRORS);
//   const [isDirty, setIsDirty] = useState(false);
//   const [updatingAvailability, setUpdatingAvailability] = useState(false);

//   // ── Fetch ────────────────────────────────────────────────────────
//   const fetchLoggedInPriestAvailability = useCallback(async () => {
//     if (!loggedInPriestId) return;
//     try {
//       setFetchingAvailability(true);
//       setFetchError(null);
//       const res = await apiGet(`/priest_availability/${loggedInPriestId}`);
//       if (res?.status === "success") {
//         setPriestAvailabilityData(res.data);
//         mapToForm(res.data);
//       } else {
//         throw new Error(res?.message || "Failed to fetch availability.");
//       }
//     } catch (err) {
//       const msg = err?.message ?? "Something went wrong. Please try again.";
//       setFetchError(msg);
//       toast.error(msg);
//     } finally {
//       setFetchingAvailability(false);
//     }
//   }, [loggedInPriestId]);

//   useEffect(() => {
//     fetchLoggedInPriestAvailability();
//   }, [fetchLoggedInPriestAvailability]);

//   const mapToForm = (data) => {
//     if (!data) return;
//     const auParts = toDatetimeParts(data.available_until);
//     const naParts = toDatetimeParts(data.next_available);
//     setForm({
//       availability_status: data.availability_status ?? "",
//       available_until_date: auParts?.date ?? "",
//       available_until_hour: auParts?.hour ?? 9,
//       available_until_minute: auParts?.minute ?? 0,
//       available_until_period: auParts?.period ?? "AM",
//       next_available_date: naParts?.date ?? "",
//       next_available_hour: naParts?.hour ?? 9,
//       next_available_minute: naParts?.minute ?? 0,
//       next_available_period: naParts?.period ?? "AM",
//       notes: data.notes ?? "",
//     });
//     setIsDirty(false);
//     setErrors(INITIAL_ERRORS);
//   };

//   // ── Handlers ─────────────────────────────────────────────────────
//   const handleChange = (key, value) => {
//     setForm((prev) => {
//       const next = { ...prev, [key]: value };
//       if (key === "availability_status") {
//         // reset both date/time groups on status change
//         next.available_until_date = "";
//         next.available_until_hour = 9;
//         next.available_until_minute = 0;
//         next.available_until_period = "AM";
//         next.next_available_date = "";
//         next.next_available_hour = 9;
//         next.next_available_minute = 0;
//         next.next_available_period = "AM";
//       }
//       return next;
//     });
//     setErrors((prev) => ({ ...prev, [key.startsWith("available_until") ? "available_until" : key.startsWith("next_available") ? "next_available" : key]: "" }));
//     setIsDirty(true);
//   };

//   const handleTimeChange = (prefix, { hour, minute, period }) => {
//     setForm((prev) => ({
//       ...prev,
//       [`${prefix}_hour`]: hour,
//       [`${prefix}_minute`]: minute,
//       [`${prefix}_period`]: period,
//     }));
//     setErrors((prev) => ({ ...prev, [prefix === "available_until" ? "available_until" : "next_available"]: "" }));
//     setIsDirty(true);
//   };

//   // ── Validate ─────────────────────────────────────────────────────
//   const validate = () => {
//     const newErrors = { ...INITIAL_ERRORS };
//     let valid = true;
//     const now = new Date();

//     if (!form.availability_status) {
//       newErrors.availability_status = "Please select an availability status.";
//       valid = false;
//     }

//     if (form.availability_status === "available") {
//       if (!form.available_until_date) {
//         newErrors.available_until = "Please specify a date.";
//         valid = false;
//       } else {
//         const iso = buildISOFromParts(form.available_until_date, form.available_until_hour, form.available_until_minute, form.available_until_period);
//         if (iso && new Date(iso) <= now) {
//           newErrors.available_until = "Available until must be a future date and time.";
//           valid = false;
//         }
//       }
//     }

//     if (form.availability_status === "not_available") {
//       if (!form.next_available_date) {
//         newErrors.next_available = "Please specify a date.";
//         valid = false;
//       } else {
//         const iso = buildISOFromParts(form.next_available_date, form.next_available_hour, form.next_available_minute, form.next_available_period);
//         if (iso && new Date(iso) <= now) {
//           newErrors.next_available = "Next available must be a future date and time.";
//           valid = false;
//         }
//       }
//     }

//     if (form.notes.length > 300) {
//       newErrors.notes = "Notes must be 300 characters or fewer.";
//       valid = false;
//     }

//     setErrors(newErrors);
//     return valid;
//   };

//   // ── Submit ────────────────────────────────────────────────────────
//   const handleUpdate = async () => {
//     if (!validate()) {
//       toast.error("Please fix the errors before saving.");
//       return;
//     }
//     try {
//       setUpdatingAvailability(true);
//       const payload = {
//         availability_status: form.availability_status,
//         notes: form.notes.trim(),
//         available_until:
//           form.availability_status === "available"
//             ? buildISOFromParts(form.available_until_date, form.available_until_hour, form.available_until_minute, form.available_until_period)
//             : null,
//         next_available:
//           form.availability_status === "not_available"
//             ? buildISOFromParts(form.next_available_date, form.next_available_hour, form.next_available_minute, form.next_available_period)
//             : null,
//       };
//       const res = await apiPut(`/priest_availability/${priestAvailabilityData?._id}`, payload);
//       if (res?.status === "success") {
//         toast.success("Availability updated successfully.");
//         setPriestAvailabilityData((prev) => ({ ...prev, ...payload }));
//         setIsDirty(false);
//       } else {
//         throw new Error(res?.message || "Update failed.");
//       }
//     } catch (err) {
//       toast.error(err?.message ?? "Something went wrong. Please try again.");
//     } finally {
//       setUpdatingAvailability(false);
//     }
//   };

//   const handleReset = () => {
//     mapToForm(priestAvailabilityData);
//     toast.info("Changes discarded.");
//   };

//   // ── Render guards ─────────────────────────────────────────────────
//   if (fetchingAvailability) return <SkeletonLoader />;

//   if (fetchError) {
//     return (
//       <div className="bg-white rounded-sm border border-red-100 p-6 shadow-sm flex flex-col items-center gap-3 text-center">
//         <AlertCircle size={28} className="text-red-400" />
//         <p className="font-sans text-[#0F2A4A]/60 text-sm">{fetchError}</p>
//         <button
//           onClick={fetchLoggedInPriestAvailability}
//           className="flex items-center gap-2 font-sans text-xs font-semibold text-[#0F2A4A] bg-[#0F2A4A]/5 hover:bg-[#0F2A4A]/10 px-4 py-2 rounded-sm transition-colors duration-150"
//         >
//           <RefreshCw size={13} />
//           Retry
//         </button>
//       </div>
//     );
//   }

//   const currentStatusCfg = AVAILABILITY_STATUS[form.availability_status];

//   return (
//     <div className="bg-white rounded-sm border border-[#0F2A4A]/8 shadow-sm overflow-hidden">
//       {/* Card header */}
//       <div className="px-4 md:px-6 py-4 border-b border-[#0F2A4A]/8 flex items-center justify-between gap-3">
//         <div className="flex items-center gap-3 min-w-0">
//           <div className="w-8 h-8 rounded-sm bg-[#0F2A4A]/5 flex items-center justify-center flex-shrink-0">
//             <CalendarCheck size={15} className="text-[#0F2A4A]/50" />
//           </div>
//           <div className="min-w-0">
//             <p className="font-serif text-[#0F2A4A] text-sm font-semibold">Availability Settings</p>
//             <p className="font-sans text-[#0F2A4A]/35 text-[10px] mt-0.5 hidden sm:block">
//               Let parishioners know when you're reachable
//             </p>
//           </div>
//         </div>
//         {form.availability_status && currentStatusCfg && (
//           <span className={`flex-shrink-0 flex items-center gap-1.5 text-[9px] sm:text-[10px] font-sans font-semibold uppercase tracking-widest px-2 sm:px-2.5 py-1 rounded-sm border ${currentStatusCfg.accent}`}>
//             {React.createElement(currentStatusCfg.icon, { size: 10 })}
//             <span className="hidden sm:inline">{currentStatusCfg.label}</span>
//           </span>
//         )}
//       </div>

//       {/* Form body */}
//       <div className="px-4 md:px-6 py-5 md:py-6 space-y-5 md:space-y-6">

//         {/* Status selector */}
//         <div>
//           <FieldLabel required>Availability Status</FieldLabel>
//           <div className="flex gap-2">
//             {Object.keys(AVAILABILITY_STATUS).map((status) => (
//               <StatusOption
//                 key={status}
//                 status={status}
//                 selected={form.availability_status === status}
//                 onClick={(v) => handleChange("availability_status", v)}
//               />
//             ))}
//           </div>
//           <FieldError message={errors.availability_status} />
//         </div>

//         {/* Available Until */}
//         {form.availability_status === "available" && (
//           <div className={`p-4 rounded-sm border ${AVAILABILITY_STATUS.available.panel}`}>
//             <FieldLabel required>
//               <CalendarCheck size={10} className="inline mr-1 text-emerald-500" />
//               Available Until — Date &amp; Time
//             </FieldLabel>
//             <DateTimeField
//               id="available_until"
//               dateValue={form.available_until_date}
//               hour={form.available_until_hour}
//               minute={form.available_until_minute}
//               period={form.available_until_period}
//               onDateChange={(v) => handleChange("available_until_date", v)}
//               onTimeChange={(t) => handleTimeChange("available_until", t)}
//               hasError={!!errors.available_until}
//             />
//             <FieldError message={errors.available_until} />
//             {form.available_until_date && !errors.available_until && (
//               <p className="mt-2 font-sans text-[10px] text-emerald-600 flex items-center gap-1">
//                 <CheckCircle2 size={10} />
//                 Until {formatDisplayDatetime(form.available_until_date, form.available_until_hour, form.available_until_minute, form.available_until_period)}
//               </p>
//             )}
//           </div>
//         )}

//         {/* Next Available */}
//         {form.availability_status === "not_available" && (
//           <div className={`p-4 rounded-sm border ${AVAILABILITY_STATUS.not_available.panel}`}>
//             <FieldLabel required>
//               <CalendarX size={10} className="inline mr-1 text-red-400" />
//               Next Available From — Date &amp; Time
//             </FieldLabel>
//             <DateTimeField
//               id="next_available"
//               dateValue={form.next_available_date}
//               hour={form.next_available_hour}
//               minute={form.next_available_minute}
//               period={form.next_available_period}
//               onDateChange={(v) => handleChange("next_available_date", v)}
//               onTimeChange={(t) => handleTimeChange("next_available", t)}
//               hasError={!!errors.next_available}
//             />
//             <FieldError message={errors.next_available} />
//             {form.next_available_date && !errors.next_available && (
//               <p className="mt-2 font-sans text-[10px] text-red-500 flex items-center gap-1">
//                 <AlertCircle size={10} />
//                 Available again from {formatDisplayDatetime(form.next_available_date, form.next_available_hour, form.next_available_minute, form.next_available_period)}
//               </p>
//             )}
//           </div>
//         )}

//         {/* Notes */}
//         <div>
//           <div className="flex items-center justify-between mb-1.5">
//             <FieldLabel>
//               <StickyNote size={10} className="inline mr-1" />
//               Notes
//             </FieldLabel>
//             <span className={`font-sans text-[10px] ${form.notes.length > 280 ? form.notes.length > 300 ? "text-red-500" : "text-amber-500" : "text-[#0F2A4A]/25"}`}>
//               {form.notes.length}/300
//             </span>
//           </div>
//           <textarea
//             rows={3}
//             placeholder="E.g. Available for emergencies, please call ahead for meetings…"
//             value={form.notes}
//             onChange={(e) => handleChange("notes", e.target.value)}
//             className={`w-full font-sans text-sm text-[#0F2A4A] placeholder-[#0F2A4A]/20 bg-[#0F2A4A]/2 border rounded-sm px-3 py-2.5 resize-none
//               focus:outline-none focus:ring-1 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C]/50 focus:bg-white transition-colors duration-150
//               ${errors.notes ? "border-red-300 bg-red-50/30" : "border-[#0F2A4A]/10"}`}
//           />
//           <FieldError message={errors.notes} />
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="px-4 md:px-6 py-3 md:py-4 border-t border-[#0F2A4A]/8 bg-[#0F2A4A]/1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
//         <p className="font-sans text-[10px] text-[#0F2A4A]/25 tracking-wide">
//           {isDirty ? "You have unsaved changes." : "No pending changes."}
//         </p>
//         <div className="flex items-center gap-2 w-full sm:w-auto">
//           {isDirty && (
//             <button
//               type="button"
//               onClick={handleReset}
//               disabled={updatingAvailability}
//               className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-sans text-xs font-medium text-[#0F2A4A]/50 hover:text-[#0F2A4A]/80 px-3 py-2 rounded-sm border border-[#0F2A4A]/10 hover:border-[#0F2A4A]/20 transition-colors duration-150 disabled:opacity-40"
//             >
//               <RefreshCw size={12} />
//               Discard
//             </button>
//           )}
//           <button
//             type="button"
//             onClick={handleUpdate}
//             disabled={updatingAvailability || !isDirty}
//             className="flex-1 sm:flex-none flex items-center justify-center gap-2 font-sans text-xs font-semibold text-white bg-[#0F2A4A] hover:bg-[#0F2A4A]/90 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-sm shadow-sm transition-all duration-150"
//           >
//             {updatingAvailability ? (
//               <><Loader2 size={13} className="animate-spin" />Saving…</>
//             ) : (
//               <><Save size={13} />Save Changes</>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EditPriestAvailability;