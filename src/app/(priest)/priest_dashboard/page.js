"use client";

import React from "react";
import EditPriestAvailability from "./_components/EditPriestAvailability";
import {
  CalendarDays,
  UserCog,
  Megaphone,
  ClipboardList,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useAuthPriest } from "@/hooks/useAuthPriest";

// ── Stat card ────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="bg-white rounded-sm border border-[#0F2A4A]/8 p-5 flex items-start gap-4 shadow-sm hover:shadow-md hover:border-[#C9A84C]/25 transition-all duration-200 group">
    <div
      className={`w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 transition-all duration-200 ${accent}`}
    >
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="font-sans text-[10px] text-[#0F2A4A]/45 uppercase tracking-widest font-medium">
        {label}
      </p>
      <p className="font-serif text-[#0F2A4A] text-xl font-semibold leading-tight mt-0.5">
        {value}
      </p>
    </div>
  </div>
);

// ── Quick-link placeholder card ─────────────────────────────────
const QuickCard = ({ icon: Icon, label, href, description }) => (
  <Link
    href={href}
    className="group bg-white rounded-sm border border-[#0F2A4A]/8 p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-[#C9A84C]/30 transition-all duration-200"
  >
    <div className="w-10 h-10 rounded-sm bg-[#0F2A4A]/5 flex items-center justify-center flex-shrink-0 group-hover:bg-[#C9A84C]/10 transition-colors duration-200">
      <Icon size={18} className="text-[#0F2A4A]/50 group-hover:text-[#C9A84C] transition-colors duration-200" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-sans text-[#0F2A4A] text-sm font-semibold truncate">{label}</p>
      <p className="font-sans text-[#0F2A4A]/45 text-xs truncate mt-0.5">{description}</p>
    </div>
    <ChevronRight size={15} className="text-[#0F2A4A]/25 group-hover:text-[#C9A84C] flex-shrink-0 transition-colors duration-200" />
  </Link>
);

// ── Section heading ──────────────────────────────────────────────
const SectionHeading = ({ children }) => (
  <div className="flex items-center gap-3 mb-4">
    <h2 className="font-serif text-[#0F2A4A] text-base font-semibold tracking-wide">
      {children}
    </h2>
    <div className="flex-1 h-px bg-[#0F2A4A]/8" />
  </div>
);

// ── Placeholder section ──────────────────────────────────────────
const PlaceholderSection = ({ label }) => (
  <div className="bg-white rounded-sm border border-dashed border-[#0F2A4A]/15 p-8 flex flex-col items-center justify-center gap-2">
    <p className="font-sans text-[#0F2A4A]/30 text-xs uppercase tracking-widest font-medium">
      {label}
    </p>
    <p className="font-sans text-[#0F2A4A]/20 text-xs">Coming soon</p>
  </div>
);

// ── Main ─────────────────────────────────────────────────────────
const PriestDashboardPage = () => {
  const { loggedInPriest } = useAuthPriest();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome banner */}
      <div className="bg-[#0F2A4A] rounded-sm px-6 py-5 flex items-center justify-between border border-[#0F2A4A] shadow-lg overflow-hidden relative">
        {/* Decorative cross watermark */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/3 font-serif text-[80px] font-bold select-none pointer-events-none">
          ✝
        </div>
        <div>
          <p className="font-sans text-[#C9A84C]/80 text-[10px] uppercase tracking-widest font-medium">
            Welcome back
          </p>
          <h1 className="font-serif text-white text-xl font-semibold mt-0.5">
            {loggedInPriest?.priest_name
              ? `Father ${loggedInPriest.priest_name}`
              : "Father"}
          </h1>
          <p className="font-sans text-white/40 text-xs mt-1 tracking-wide">
            Manage your parish responsibilities from this portal.
          </p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <p className="font-sans text-white/30 text-[10px] uppercase tracking-widest">
            Today
          </p>
          <p className="font-serif text-[#C9A84C] text-sm font-medium">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div>
        <SectionHeading>Overview</SectionHeading>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={CalendarDays}
            label="Available Slots"
            value="—"
            accent="bg-[#0F2A4A]/8 text-[#0F2A4A]/60"
          />
          <StatCard
            icon={ClipboardList}
            label="Pending Requests"
            value="—"
            accent="bg-[#C9A84C]/10 text-[#C9A84C]"
          />
          <StatCard
            icon={Megaphone}
            label="Announcements"
            value="—"
            accent="bg-[#0F2A4A]/8 text-[#0F2A4A]/60"
          />
          <StatCard
            icon={UserCog}
            label="Profile Status"
            value="Active"
            accent="bg-emerald-50 text-emerald-600"
          />
        </div>
      </div>

      {/* Availability (implemented) */}
      <div>
        <SectionHeading>Availability</SectionHeading>
        <EditPriestAvailability loggedInPriestId={loggedInPriest?._id} />
      </div>

      {/* Quick links to not-yet-implemented sections */}
      <div>
        <SectionHeading>Manage</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickCard
            icon={UserCog}
            label="Edit Profile"
            href="/priest_dashboard/profile"
            description="Update your name, contact & parish details"
          />
          <QuickCard
            icon={ClipboardList}
            label="Upcoming Activities"
            href="/priest_dashboard/activities"
            description="Add or edit upcoming parish events"
          />
          <QuickCard
            icon={Megaphone}
            label="Announcements"
            href="/priest_dashboard/announcements"
            description="Post and manage parish announcements"
          />
          <QuickCard
            icon={ClipboardList}
            label="Requests"
            href="/priest_dashboard/requests"
            description="Review and respond to parishioner requests"
          />
        </div>
      </div>

      {/* Placeholder sections for upcoming features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionHeading>Recent Requests</SectionHeading>
          <PlaceholderSection label="Recent Requests" />
        </div>
        <div>
          <SectionHeading>Latest Announcements</SectionHeading>
          <PlaceholderSection label="Latest Announcements" />
        </div>
      </div>
    </div>
  );
};

export default PriestDashboardPage;