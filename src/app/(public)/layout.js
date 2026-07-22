"use client";
import React from 'react'
import NavBar from '@/components/layout/NavBar'
import { useState } from 'react';
import LoginSignupModal from '@/components/common_components/LoginSignupModal';
import { apiPost } from '@/services/axios';
import { toast } from 'sonner';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useRouter } from 'next/navigation';

const PublicLayout = ({ children }) => {
  const [loginOrSignupModal, setloginOrSignupModal] = useState(false);
  const { setUser } = useAuthUser();
  const router = useRouter();

  const handleLogoutUser = async () => {
    try {
      const res = await apiPost(`/auth/user/logout`);
      if(res.status === "failure") {
        toast.error("Failed to logout, try later");
      }
      router.push("/");
      setUser(null);
      toast.success("logged out successfully");
    } catch(err) {
      toast.error("Failed to logout, "+err.message);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9F6F0] font-serif">
      <NavBar onLoginOrSignupClick={() => setloginOrSignupModal(true)} onLogoutClick={handleLogoutUser} />
      <main className="pt-20">
        {children}
      </main>
      <footer className="bg-[#0F2A4A] text-[#C9A84C] text-center py-8 mt-20 text-sm tracking-widest uppercase font-sans">
        © {new Date().getFullYear()} St. Antony's Church, Okkur — All Rights Reserved
      </footer>
      {loginOrSignupModal && (
        <div className='h-screen flex items-center justify-center'>
          <LoginSignupModal onCancel={() => setloginOrSignupModal(false)} onSuccess={() => { setloginOrSignupModal(false); }} />
        </div>)
      }
    </div>
  )
}

export default PublicLayout;