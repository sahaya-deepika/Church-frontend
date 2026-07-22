"use client";

import { Church } from 'lucide-react'
import React, { useState } from 'react'
import Link from 'next/link'
import { useAuthUser } from '@/hooks/useAuthUser';

const NavBar = ({ onLoginOrSignupClick, onLogoutClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuthUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0F2A4A]/95 backdrop-blur-md shadow-lg">
      {/* Gold top border */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-[#C9A84C]/10 border border-[#C9A84C]/30 rounded-full p-2 group-hover:bg-[#C9A84C]/20 transition-all duration-300">
            <Church size={22} className="text-[#C9A84C]" />
          </div>
          <div className="leading-tight">
            <span className="block text-white font-serif text-base font-semibold tracking-wide">
              St. Antony's Church
            </span>
            <span className="block text-[#C9A84C]/70 text-[10px] font-sans uppercase tracking-[0.2em]">
              Okkur
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-1 font-sans text-sm">
          {[
            { label: 'Services', href: '#services' },
            { label: 'Activities', href: '#activities' },
          ].map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="px-4 py-2 text-[#D9CDB8] hover:text-[#C9A84C] transition-colors duration-200 tracking-wide"
              >
                {item.label}
              </a>
            </li>
          ))}

          {user && (
            <li className='ml-2'>
              <Link
                href='/profile'
                className="px-4 py-2 text-[#D9CDB8] hover:text-[#C9A84C] transition-colors duration-200 tracking-wide"
              >
                Profile
              </Link>
            </li>
          )}

          {!user ? (
            <li>
              <button
                onClick={onLoginOrSignupClick}
                className="px-4 py-2 text-[#D9CDB8] hover:text-[#C9A84C] transition-colors duration-200 tracking-wide"
              >
                Login/Signup
              </button>
            </li>
          ) : (
            <li>
              <button
                onClick={onLogoutClick}
                className="px-4 py-2 text-[#D9CDB8] hover:text-[#C9A84C] transition-colors duration-200 tracking-wide"
              >
                Logout
              </button>
            </li>
          )}

          <li className="ml-2">
            <Link
              href="/priest_login"
              className="px-5 py-2 bg-[#C9A84C] hover:bg-[#b8973b] text-[#0F2A4A] font-semibold rounded-sm tracking-wide transition-all duration-200 text-sm"
            >
              Priest Login
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#C9A84C] focus:outline-none"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#0F2A4A] border-t border-[#C9A84C]/20 px-6 pb-6 pt-2 flex flex-col gap-3 font-sans text-sm">
          <a href="#services" className="text-[#D9CDB8] py-2 border-b border-white/5">Services</a>
          <a href="#activities" className="text-[#D9CDB8] py-2 border-b border-white/5">Activities</a>
          <Link href="/login" className="text-[#D9CDB8] py-2 border-b border-white/5">Login</Link>
          <Link href="/priest_login" className="text-[#C9A84C] font-semibold py-2">Priest Login →</Link>
        </div>
      )}
    </nav>
  )
}

export default NavBar