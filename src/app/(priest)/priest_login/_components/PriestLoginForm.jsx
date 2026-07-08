"use client";
import { useAuthPriest } from '@/hooks/useAuthPriest';
import { apiPost } from '@/services/axios';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { toast } from 'sonner';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

// ── Validation ──────────────────────────────────────────────────
const validateForm = ({ priest_email, priest_password }) => {
  const errors = {};
  if (!priest_email.trim()) {
    errors.priest_email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(priest_email)) {
    errors.priest_email = "Enter a valid email address.";
  }
  if (!priest_password) {
    errors.priest_password = "Password is required.";
  } else if (priest_password.length < 6) {
    errors.priest_password = "Password must be at least 6 characters.";
  }
  return errors;
};

// ── Field component ──────────────────────────────────────────────
const FormField = ({ label, icon: Icon, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[#0F2A4A]/70 font-sans text-xs uppercase tracking-widest font-medium">
      {label}
    </label>
    <div className={`relative flex items-center border rounded-sm transition-all duration-200 bg-white
      ${error
        ? 'border-rose-400 ring-1 ring-rose-300'
        : 'border-[#0F2A4A]/15 focus-within:border-[#C9A84C] focus-within:ring-1 focus-within:ring-[#C9A84C]/30'
      }`}>
      <Icon size={15} className={`absolute left-3.5 ${error ? 'text-rose-400' : 'text-[#0F2A4A]/30'}`} />
      {children}
    </div>
    {error && (
      <div className="flex items-center gap-1.5 text-rose-500 font-sans text-xs">
        <AlertCircle size={11} />
        <span>{error}</span>
      </div>
    )}
  </div>
);

// ── Main component ───────────────────────────────────────────────
const PriestLoginForm = () => {
  const [loginForm, setLoginForm] = useState({ priest_email: "eugine@gmail.com", priest_password: "Eugine@123" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const { setLoggedInPriest } = useAuthPriest();

  const handleChange = (field) => (e) => {
    setLoginForm(prev => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (serverError) setServerError("");
  };

  const handleLogin = async () => {
    setServerError("");
    const errors = validateForm(loginForm);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    try {
      setLoading(true);
      const response = await apiPost("/auth/priest", loginForm);
      if (response?.status === "failure") {
        setServerError(response?.message || "Login failed. Please try again.");
        return;
      }
      toast.success("Welcome back, Father.");
      setLoggedInPriest(response?.data ?? null);
      router.push("/priest_dashboard");
    } catch (err) {
      setServerError(err?.message || "Something went wrong. Please try again.");
      toast.error(err?.message || "Login error");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) handleLogin();
  };

  return (
    <div className="flex flex-col gap-6" onKeyDown={handleKeyDown}>

      {/* Server-level error banner */}
      {serverError && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-sm px-4 py-3">
          <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-rose-600 font-sans text-sm leading-snug">{serverError}</p>
        </div>
      )}

      {/* Email */}
      <FormField label="Email Address" icon={Mail} error={fieldErrors.priest_email}>
        <input
          type="email"
          value={loginForm.priest_email}
          onChange={handleChange("priest_email")}
          placeholder="priest@church.org"
          autoComplete="email"
          className="w-full pl-9 pr-4 py-3 bg-transparent font-sans text-sm text-[#0F2A4A] placeholder-[#0F2A4A]/25 outline-none"
        />
      </FormField>

      {/* Password */}
      <FormField label="Password" icon={Lock} error={fieldErrors.priest_password}>
        <input
          type={showPassword ? "text" : "password"}
          value={loginForm.priest_password}
          onChange={handleChange("priest_password")}
          placeholder="••••••••"
          autoComplete="current-password"
          className="w-full pl-9 pr-10 py-3 bg-transparent font-sans text-sm text-[#0F2A4A] placeholder-[#0F2A4A]/25 outline-none"
        />
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="absolute right-3 text-[#0F2A4A]/30 hover:text-[#0F2A4A]/60 transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </FormField>

      {/* Divider */}
      <div className="h-px bg-[#0F2A4A]/8 my-1" />

      {/* Submit */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 bg-[#0F2A4A] hover:bg-[#16376b] disabled:bg-[#0F2A4A]/50 text-white font-sans font-semibold text-sm tracking-wide py-3.5 rounded-sm transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In to Priest Portal"
        )}
      </button>

      {/* Gold bottom accent */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C9A84C]/40 to-transparent mt-2" />
    </div>
  );
};

export default PriestLoginForm;