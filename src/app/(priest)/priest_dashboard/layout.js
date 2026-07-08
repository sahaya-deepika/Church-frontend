"use client";

import React from "react";
import DashboardSidebar from "./_components/DashboardSidebar";
import DashboardTopbar from "./_components/DashboardTopbar";

const PriestDashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      {/* Sidebar — renders itself only on md+ via hidden md:flex */}
      <DashboardSidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <DashboardTopbar />

        {/* Page content — extra bottom padding on mobile for the tab bar */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          {children}
        </main>

        {/* Footer — desktop only */}
        <footer className="hidden md:flex flex-shrink-0 items-center justify-between px-6 py-3 bg-white border-t border-[#0F2A4A]/6">
          <p className="font-sans text-[10px] text-[#0F2A4A]/30 tracking-wide uppercase">
            Priest Administration Portal
          </p>
          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent" />
          <p className="font-sans text-[10px] text-[#0F2A4A]/25 tracking-wide">
            © {new Date().getFullYear()} Parish Management
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PriestDashboardLayout;