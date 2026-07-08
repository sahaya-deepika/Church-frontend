"use client";
import { apiGet } from "@/services/axios";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Droplets,
  ArrowRight,
  Loader2,
  Inbox,
  RefreshCcw,
  Clock,
  Cross,
  PersonStanding,
  MessageSquareQuoteIcon,
  BookPlus,
  MapPinPlusInside,
  UserRoundPlusIcon,
  BriefcaseMedicalIcon
} from "lucide-react";

// ─── config: add more request types here as the app grows ───────────────────
const REQUEST_TYPES = [
  {
    id: "baptism",
    title: "Baptism Requests",
    description: "Sacrament registration submissions awaiting review",
    icon: Droplets,
    route: "/priest_dashboard/requests/baptism_requests",
    fetchEndpoint: "/priest/baptism_requests",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  {
    id: "eucharist",
    title: "Eucharist Requests",
    description: "Sacrament registration submissions awaiting review",
    icon: Cross,
    route: "/priest_dashboard/requests/eucharist_requests",
    fetchEndpoint: "/priest/eucharist_requests",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  {
    id: "confession",
    title: "Confession Requests",
    description: "Sacrament registration submissions awaiting review",
    icon: PersonStanding,
    route: "/priest_dashboard/requests/confession_requests",
    fetchEndpoint: "/priest/confession_requests",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  {
    id: "marriage",
    title: "Marriage Requests",
    description: "Sacrament registration submissions awaiting review",
    icon:  UserRoundPlusIcon,
    route: "/priest_dashboard/requests/marriage_requests",
    fetchEndpoint: "/priest/marriage_requests",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  {
    id: "confirmation",
    title: "Confirmation Requests",
    description: "Sacrament registration submissions awaiting review",
    icon: BookPlus,
    route: "/priest_dashboard/requests/confirmation_requests",
    fetchEndpoint: "/priest/confirmation_requests",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  {
    id: "anointing_of_the_sick",
    title: "Anointing Of The Sick Requests",
    description: "Sacrament registration submissions awaiting review",
    icon: BriefcaseMedicalIcon ,
    route: "/priest_dashboard/requests/anointing_of_the_sick_requests",
    fetchEndpoint: "/priest/aos_requests",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  {
    id: "mass_prayer",
    title: "Mass Prayers",
    description: "Mass prayers",
    icon: MapPinPlusInside,
    route: "/priest_dashboard/requests/mass_prayers",
    fetchEndpoint: "/priest/mass_prayers",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  {
    id: "meeting",
    title: "Meeting Requests",
    description: "Meet with priest like one-on-one meeting",
    icon: MessageSquareQuoteIcon,
    route: "/priest_dashboard/requests/meeting_requests",
    fetchEndpoint: "/priest/meeting_requests",
    accentColor: "text-sky-500",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-200",
  },
  // Add more here: { id: "marriage", title: "Marriage Requests", ... }
];

// ─── main page ───────────────────────────────────────────────────────────────
const RequestsPage = () => {
  const router = useRouter();

  const [counts, setCounts] = useState({}); // { baptism: 3, ... }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllCounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        REQUEST_TYPES.map((type) =>
          apiGet(type.fetchEndpoint).then((res) => {
            if (res.status !== "success") throw new Error(res.message);
            return { id: type.id, count: Array.isArray(res.data) ? res.data.length : 0 };
          })
        )
      );

      const newCounts = {};
      let anyFailed = false;

      results.forEach((result, i) => {
        if (result.status === "fulfilled") {
          newCounts[result.value.id] = result.value.count;
        } else {
          anyFailed = true;
          newCounts[REQUEST_TYPES[i].id] = null; // null = failed
          console.error(`Failed to fetch ${REQUEST_TYPES[i].title}:`, result.reason);
        }
      });

      setCounts(newCounts);
      if (anyFailed) toast.warning("Some request counts could not be loaded.");
    } catch (err) {
      setError(err.message || "Failed to load requests.");
      toast.error(err.message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCounts();
  }, []);

  const pendingTypes = REQUEST_TYPES.filter(
    (type) => counts[type.id] !== null && counts[type.id] > 0
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#C9A84C] font-medium mb-1">
            Dashboard
          </p>
          <h1 className="text-2xl font-semibold text-[#0F2A4A]" style={{ fontFamily: "Georgia, serif" }}>
            Pending Requests
          </h1>
        </div>
        <button
          onClick={fetchAllCounts}
          disabled={loading}
          className="flex items-center gap-2 text-sm text-[#0F2A4A]/60 hover:text-[#0F2A4A] border border-[#0F2A4A]/15 hover:border-[#0F2A4A]/30 rounded-lg px-3 py-2 transition-all disabled:opacity-40"
        >
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REQUEST_TYPES.map((type) => (
            <div key={type.id} className="bg-white rounded-2xl border border-[#0F2A4A]/10 overflow-hidden animate-pulse">
              <div className="h-24 bg-gray-100" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-2/3 bg-gray-100 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-4/5 bg-gray-100 rounded" />
                <div className="h-9 w-full bg-gray-100 rounded-lg mt-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hard error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <RefreshCcw className="w-5 h-5 text-red-400" />
          </div>
          <p className="text-[#0F2A4A] font-medium mb-1">Something went wrong</p>
          <p className="text-sm text-gray-400 mb-5">{error}</p>
          <button
            onClick={fetchAllCounts}
            className="text-sm bg-[#0F2A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1a3d6b] transition-colors"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && pendingTypes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-[#0F2A4A]/5 flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-[#0F2A4A]/30" />
          </div>
          <p className="text-[#0F2A4A] font-medium mb-1">All clear</p>
          <p className="text-sm text-gray-400">No pending requests at the moment.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && !error && pendingTypes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pendingTypes.map((type) => (
            <RequestFaceCard
              key={type.id}
              type={type}
              count={counts[type.id]}
              onNavigate={() => router.push(type.route)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── card component ──────────────────────────────────────────────────────────
function RequestFaceCard({ type, count, onNavigate }) {
  const Icon = type.icon;

  return (
    <div className="group bg-white rounded-2xl border border-[#0F2A4A]/10 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#C9A84C]/50 transition-all duration-200 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="bg-[#0F2A4A] px-6 py-6 flex items-center justify-between relative">
        <div className={`w-12 h-12 rounded-xl ${type.bgColor} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${type.accentColor}`} strokeWidth={1.5} />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white leading-none">{count}</p>
          <p className="text-[10px] uppercase tracking-widest text-[#C9A84C] mt-1">Pending</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1">
        <h3 className="text-[#0F2A4A] font-semibold text-[15px] mb-1">{type.title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{type.description}</p>

        <div className="flex items-center gap-1.5 mt-3">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs text-amber-500 font-medium">Awaiting your review</span>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5">
        <button
          onClick={onNavigate}
          className="w-full flex items-center justify-between bg-[#0F2A4A] hover:bg-[#1a3d6b] text-white rounded-xl px-4 py-3 transition-colors"
        >
          <span className="text-sm font-medium">Review all requests</span>
          <ArrowRight className="w-4 h-4 text-[#C9A84C]" />
        </button>
      </div>
    </div>
  );
}

export default RequestsPage;