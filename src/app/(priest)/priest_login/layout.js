import React from 'react'
import Link from 'next/link'
import { Church, ArrowLeft } from 'lucide-react'

const PriestLoginLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex">

      {/* Left Panel — decorative / brand side */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0F2A4A] flex-col justify-between p-12 overflow-hidden">
        {/* Background cross watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none">
          <svg viewBox="0 0 200 200" className="w-[500px] h-[500px]" fill="white">
            <rect x="85" y="10" width="30" height="180" />
            <rect x="10" y="70" width="180" height="30" />
          </svg>
        </div>

        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#C9A84C]/10 blur-3xl pointer-events-none" />

        {/* Gold accent top line */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full p-2.5">
            <Church size={22} className="text-[#C9A84C]" />
          </div>
          <div>
            <span className="block text-white font-serif text-base font-semibold tracking-wide">St. Antony's Church</span>
            <span className="block text-[#C9A84C]/60 text-[10px] font-sans uppercase tracking-[0.2em]">Okkur</span>
          </div>
        </div>

        {/* Center quote */}
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-[#C9A84C]/40" />
            <div className="w-1.5 h-1.5 rotate-45 bg-[#C9A84C]/60" />
            <div className="h-px w-12 bg-[#C9A84C]/40" />
          </div>
          <blockquote className="text-white/70 font-serif text-xl italic leading-relaxed max-w-xs mx-auto">
            "I am the good shepherd. The good shepherd lays down his life for the sheep."
          </blockquote>
          <p className="mt-4 text-[#C9A84C]/70 font-sans text-xs tracking-widest uppercase">John 10:11</p>
        </div>

        {/* Bottom label */}
        <div className="relative z-10">
          <p className="text-white/25 font-sans text-xs tracking-widest uppercase">Priest Portal</p>
        </div>
      </div>

      {/* Right Panel — form side */}
      <div className="w-full lg:w-1/2 bg-[#F9F6F0] flex flex-col">
        {/* Back button */}
        <div className="px-8 pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#0F2A4A]/50 hover:text-[#0F2A4A] font-sans text-sm transition-colors duration-200 group"
          >
            <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to Home
          </Link>
        </div>

        <main className="flex-1 flex items-center justify-center px-8 py-12">
          {children}
        </main>

        <div className="px-8 pb-6 text-center">
          <p className="text-[#0F2A4A]/30 font-sans text-xs">St. Antony's Church — Priest Portal</p>
        </div>
      </div>
    </div>
  )
}

export default PriestLoginLayout;