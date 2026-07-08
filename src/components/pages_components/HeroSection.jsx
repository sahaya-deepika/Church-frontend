"use client";
import { ChevronDown, BookOpen, Calendar, Phone } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/church-hero.jpg')" }}
      />
      {/* Deep navy overlay with slight gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F2A4A]/80 via-[#0F2A4A]/70 to-[#0F2A4A]/90" />

      {/* Subtle cross watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
        <svg viewBox="0 0 200 200" className="w-[600px] h-[600px]" fill="white">
          <rect x="85" y="10" width="30" height="180" />
          <rect x="10" y="70" width="180" height="30" />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
        {/* Small label */}
        <p className="text-[#C9A84C] uppercase text-xs tracking-[0.4em] font-sans mb-6 opacity-90">
          Welcome to
        </p>

        {/* Church Name */}
        <h1 className="text-white font-serif text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 drop-shadow-lg">
          St. Antony's
          <br />
          <span className="text-[#C9A84C]">Church</span>
        </h1>

        {/* Location tag */}
        <p className="text-white/60 font-sans text-sm uppercase tracking-[0.3em] mb-8">
          Illuppur, Tamil Nadu
        </p>

        {/* Gold divider */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-px w-16 bg-[#C9A84C]/60" />
          <div className="w-1.5 h-1.5 rotate-45 bg-[#C9A84C]" />
          <div className="h-px w-16 bg-[#C9A84C]/60" />
        </div>

        {/* Tagline */}
        <p className="text-white/75 font-serif text-lg md:text-xl leading-relaxed mb-12 max-w-xl mx-auto">
          View Priest Availability, explore Upcoming Activities, apply for Services, and much more.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#services"
            className="flex items-center gap-2 bg-[#C9A84C] hover:bg-[#b8973b] text-[#0F2A4A] px-7 py-3 font-sans font-semibold text-sm tracking-wide transition-all duration-200 rounded-sm shadow-lg hover:shadow-xl"
          >
            <BookOpen size={16} />
            Our Services
          </a>
          <a
            href="#activities"
            className="flex items-center gap-2 border border-white/30 hover:border-[#C9A84C]/70 text-white hover:text-[#C9A84C] px-7 py-3 font-sans text-sm tracking-wide transition-all duration-200 rounded-sm"
          >
            <Calendar size={16} />
            Activities
          </a>
          <a
            href="#contact"
            className="flex items-center gap-2 border border-white/30 hover:border-[#C9A84C]/70 text-white hover:text-[#C9A84C] px-7 py-3 font-sans text-sm tracking-wide transition-all duration-200 rounded-sm"
          >
            <Phone size={16} />
            Contact
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-50 animate-bounce">
        <span className="text-white font-sans text-[10px] tracking-widest uppercase">Scroll</span>
        <ChevronDown size={16} className="text-[#C9A84C]" />
      </div>
    </section>
  );
};

export default HeroSection;