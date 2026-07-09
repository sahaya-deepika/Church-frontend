import { useAuthUser } from '@/hooks/useAuthUser'
import { apiPost } from '@/services/axios'
import { useRouter } from 'next/navigation'
import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

const PRAYER_GROUPS = [
  'St.Antony prayer group',
  'St.Mary prayer group',
  'Vellai mariyal prayer group',
]

function validateEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }
function validateMobile(m) { return /^\d{10}$/.test(m) }

function getLoginErrors(f) {
  const e = {}
  if (!f.user_email.trim()) e.user_email = 'User email is required'
  if (!f.user_password) e.user_password = 'Password is required'
  return e
}

function getSignupErrors(f) {
  const e = {}
  if (!f.user_name.trim()) e.user_name = 'Username is required'
  if (!f.user_email.trim()) e.user_email = 'Email is required'
  else if (!validateEmail(f.user_email)) e.user_email = 'Enter a valid email address'
  if (!f.user_password) e.user_password = 'Password is required'
  else if (f.user_password.length < 6) e.user_password = 'Minimum 6 characters'
  if (!f.confirm_user_password) e.confirm_user_password = 'Confirm Password is required'
  else if (f.user_password !== f.confirm_user_password) e.confirm_user_password = 'Confirm user password should match the password you entered'
  if (!f.user_mobile_number.trim()) e.user_mobile_number = 'Mobile number is required'
  else if (!validateMobile(f.user_mobile_number)) e.user_mobile_number = 'Enter a valid 10-digit number'
  if (!f.prayer_group) e.prayer_group = 'Please select a prayer group'
  return e
}

function Field({ label, type = 'text', value, onChange, error, placeholder, autoComplete, children }) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold text-[#0F2A4A] tracking-wider uppercase">
        {label}
      </label>
      {children ?? (
        <div className="relative">
          <input
            type={isPassword && show ? 'text' : type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
            className={`
              w-full px-3.5 py-2.5 rounded-[7px] text-sm text-[#0F2A4A] font-[inherit]
              border-[1.5px] outline-none transition-colors box-border
              ${error
                ? 'border-[#e05252] bg-[#fff5f5] focus:border-[#e05252]'
                : 'border-[#d4c9a8] bg-white focus:border-[#C9A84C]'}
              ${isPassword ? 'pr-14' : ''}
            `}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 text-[#8a7a55] text-[11px] font-semibold tracking-[0.3px]"
            >
              {show ? 'HIDE' : 'SHOW'}
            </button>
          )}
        </div>
      )}
      {error && <span className="text-xs text-[#c0392b] mt-0.5">{error}</span>}
    </div>
  )
}

const LoginSignupModal = ({ onSuccess, onCancel, onSuccessGoToLink }) => {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [loginErrors, setLoginErrors] = useState({})
  const [signupErrors, setSignupErrors] = useState({})
  const overlayRef = useRef(null)

  const [loginForm, setLoginForm] = useState({ user_email: 'deepika@gmail.com', user_password: 'Deepika@123' })
  const [signupForm, setSignupForm] = useState({
    user_name: '', user_email: '', user_password: '', confirm_user_password: "",
    user_mobile_number: '', prayer_group: '',
  })
  const { setUser } = useAuthUser();
  const router = useRouter();

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onCancel?.() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onCancel])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  function switchMode(next) {
    setMode(next)
    setLoginErrors({})
    setSignupErrors({})
  }

  const handleLogin = async () => {
    const errors = getLoginErrors(loginForm)
    if (Object.keys(errors).length) { setLoginErrors(errors); return }
    setLoginErrors({})
    setLoading(true)
    try {
      const res = await apiPost('/auth/user/login', loginForm)
      if (res.status === 'success') {
        toast.success('Logged in successfully')
        setUser(res.data);
        if (onSuccessGoToLink) {
          onSuccess();
          router.push(onSuccessGoToLink);
          return;
        }
        onSuccess?.()
      } else {
        throw new Error(res.message ?? 'Login failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? err.message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async () => {
    const errors = getSignupErrors(signupForm)
    if (Object.keys(errors).length) { setSignupErrors(errors); return }
    setSignupErrors({})
    setLoading(true)
    try {
      const payload = {
        user_name: signupForm.user_name,
        user_email: signupForm.user_email,
        user_password: signupForm.user_password,
        user_mobile_number: signupForm.user_mobile_number,
        prayer_group: signupForm.prayer_group,
      }
      const res = await apiPost('/auth/user/signup', payload)
      if (res.status === 'success') {
        toast.success('Account created! Log in to continue.')
        switchMode('login')
        setLoginForm({ user_email: res.data.user_email, user_password: "" })
      } else {
        throw new Error(res.data?.message ?? 'Signup failed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message ?? err.message ?? 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdrop = e => { if (e.target === overlayRef.current) onCancel?.() }

  const selectError = !!signupErrors.prayer_group

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-[9999] bg-[rgba(10,22,40,0.65)] flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[#f8f7f4] rounded-2xl w-full overflow-hidden shadow-[0_24px_80px_rgba(10,22,40,0.35)] transition-[max-width] duration-200 ease-in-out"
        style={{ maxWidth: mode === 'signup' ? 520 : 440 }}
      >
        {/* Header */}
        <div className="bg-[#0F2A4A] px-8 pt-7 pb-6 relative">
          <button
            onClick={onCancel}
            aria-label="Close"
            className="absolute top-3.5 right-4 bg-white/10 border border-white/20 rounded-md w-7 h-7 cursor-pointer text-white text-sm font-bold flex items-center justify-center font-[inherit]"
          >
            ✕
          </button>

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-full border-2 border-[#C9A84C] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="7" y="1" width="2" height="14" rx="1" fill="#C9A84C" />
                <rect x="2" y="5" width="12" height="2" rx="1" fill="#C9A84C" />
              </svg>
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-[0.3px]">St. Antony's Church</div>
              <div className="text-[#C9A84C] text-[11px] tracking-[1.2px] uppercase">Illuppur</div>
            </div>
          </div>

          <div className="text-white/55 text-[11px] font-semibold tracking-[1.5px] uppercase mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </div>
          <div className="text-white text-xl font-bold tracking-[0.2px]">
            {mode === 'login' ? 'Sign in to continue' : 'Join the community'}
          </div>

          <div className="flex mt-5 rounded-[7px] bg-white/[0.08] p-[3px] gap-[3px]">
            {['login', 'signup'].map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`
                  flex-1 py-2 rounded-[5px] border-none font-bold text-[13px] cursor-pointer
                  tracking-[0.4px] font-[inherit] transition-all duration-[180ms]
                  ${mode === m
                    ? 'bg-[#C9A84C] text-[#0F2A4A]'
                    : 'bg-transparent text-white/65'}
                `}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className={`${mode === 'signup' ? 'px-8 pt-6 pb-7' : 'px-8 pt-7 pb-8'}`}>
          {mode === 'login' ? (
            <div className="flex flex-col gap-4">
              <Field
                label="User Email"
                value={loginForm.user_email}
                onChange={e => setLoginForm(p => ({ ...p, user_email: e.target.value }))}
                error={loginErrors.user_email}
                placeholder="Enter your user email id"
                autoComplete="email"
              />
              <Field
                label="Password"
                type="password"
                value={loginForm.user_password}
                onChange={e => setLoginForm(p => ({ ...p, user_password: e.target.value }))}
                error={loginErrors.user_password}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <div className="mt-1">
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className={`
                    w-full py-3 rounded-[7px] font-bold text-sm text-[#0F2A4A]
                    border-none uppercase tracking-[0.8px] font-[inherit] transition-colors duration-150
                    ${loading ? 'bg-[#a89050] cursor-not-allowed' : 'bg-[#C9A84C] cursor-pointer hover:bg-[#e2c06a]'}
                  `}
                >
                  {loading ? 'Signing in…' : 'Log in'}
                </button>
              </div>
              <div className="text-center text-[13px] text-[#6b6040]">
                Don't have an account?{' '}
                <button
                  onClick={() => switchMode('signup')}
                  className="bg-transparent border-none cursor-pointer text-[#0F2A4A] font-bold text-[13px] p-0 underline underline-offset-2 font-[inherit]"
                >
                  Sign up
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-5 gap-y-3.5">
              <div className="col-span-2">
                <Field
                  label="Username"
                  value={signupForm.user_name}
                  onChange={e => setSignupForm(p => ({ ...p, user_name: e.target.value }))}
                  error={signupErrors.user_name}
                  placeholder="Choose a username"
                  autoComplete="username"
                />
              </div>

              <Field
                label="Email address"
                type="email"
                value={signupForm.user_email}
                onChange={e => setSignupForm(p => ({ ...p, user_email: e.target.value }))}
                error={signupErrors.user_email}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <Field
                label="Mobile number"
                value={signupForm.user_mobile_number}
                onChange={(e) => {
                  const value = e.target.value;

                  if (/^\d{0,10}$/.test(value)) {
                    setSignupForm((prev) => ({
                      ...prev,
                      user_mobile_number: value,
                    }));
                  }
                }}
                error={signupErrors.user_mobile_number}
                placeholder="10-digit number"
                autoComplete="tel"
              />

              <Field
                label="Password"
                type="password"
                value={signupForm.user_password}
                onChange={e => setSignupForm(p => ({ ...p, user_password: e.target.value }))}
                error={signupErrors.user_password}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
              />

              <Field
                label="Confirm Password"
                type="password"
                value={signupForm.confirm_user_password}
                onChange={e => setSignupForm(p => ({ ...p, confirm_user_password: e.target.value }))}
                error={signupErrors.confirm_user_password}
                placeholder="Enter your password again to confirm it"
                autoComplete="new-password"
              />

              <div className="col-span-2">
                <Field label="Prayer group" error={signupErrors.prayer_group}>
                  <select
                    value={signupForm.prayer_group}
                    onChange={e => setSignupForm(p => ({ ...p, prayer_group: e.target.value }))}
                    className={`
                      w-full px-3.5 py-2.5 rounded-[7px] text-sm text-[#0F2A4A] font-[inherit]
                      border-[1.5px] outline-none appearance-none cursor-pointer box-border
                      bg-no-repeat bg-[right_14px_center]
                      transition-colors
                      ${selectError
                        ? 'border-[#e05252] bg-[#fff5f5] focus:border-[#e05252]'
                        : 'border-[#d4c9a8] bg-white focus:border-[#C9A84C]'}
                    `}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%230F2A4A' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                      paddingRight: 36,
                    }}
                  >
                    <option value="">Select your prayer group</option>
                    {PRAYER_GROUPS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="col-span-2 mt-0.5">
                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className={`
                    w-full py-3 rounded-[7px] font-bold text-sm text-[#0F2A4A]
                    border-none uppercase tracking-[0.8px] font-[inherit] transition-colors duration-150
                    ${loading ? 'bg-[#a89050] cursor-not-allowed' : 'bg-[#C9A84C] cursor-pointer hover:bg-[#e2c06a]'}
                  `}
                >
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </div>

              <div className="col-span-2 text-center text-[13px] text-[#6b6040]">
                Already have an account?{' '}
                <button
                  onClick={() => switchMode('login')}
                  className="bg-transparent border-none cursor-pointer text-[#0F2A4A] font-bold text-[13px] p-0 underline underline-offset-2 font-[inherit]"
                >
                  Log in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginSignupModal