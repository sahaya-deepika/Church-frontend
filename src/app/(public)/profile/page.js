"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { apiPatch, apiPost } from '@/services/axios';
import { toast } from 'sonner';
import {
  Pencil, X, Save, Loader2, User, Phone, Heart, MapPin,
  Users, FileText, ExternalLink, ChevronDown, Check, Eye, ArrowLeft
} from 'lucide-react';
import FamilyCardUploadModal from '@/components/common_components/UserFamilyCardUploadModal';
import { useRouter } from 'next/navigation';

// ── Shared primitives ────────────────────────────────────────────────

const Label = ({ children }) => (
  <label className="text-[11px] font-semibold text-[#0F2A4A]/60 tracking-wider uppercase">
    {children}
  </label>
);

const inputCls = (error) => `
  w-full px-3.5 py-2.5 rounded-[7px] text-sm text-[#0F2A4A] font-[inherit]
  border-[1.5px] outline-none transition-colors box-border bg-white
  focus:border-[#C9A84C]
  ${error ? 'border-[#e05252] bg-[#fff5f5] focus:border-[#e05252]' : 'border-[#d4c9a8]'}
`;

const Field = ({ label, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <Label>{label}</Label>
    {children}
    {error && <span className="text-xs text-[#c0392b]">{error}</span>}
  </div>
);

const SectionHeading = ({ children }) => (
  <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-5">
    {children}
  </div>
);

const PRAYER_GROUPS = ["St.Antony prayer group", "St.Mary prayer group", "Vellai mariyal prayer group"];
const CHURCH_ORGS = ["Vincent de paul organization", "Younger services group", "Women services group"];

// ── Multi-select dropdown with removable chips ──────────────────────

const MultiSelectOrgs = ({ value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleOrg = (org) => {
    if (value.includes(org)) onChange(value.filter(v => v !== org));
    else onChange([...value, org]);
  };

  const removeOrg = (org) => onChange(value.filter(v => v !== org));

  return (
    // position:relative container — dropdown escapes the card's overflow:hidden via fixed positioning
    <div className="flex flex-col gap-2">
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen(p => !p)}
          className={inputCls(error) + ' flex items-center justify-between cursor-pointer text-left'}
        >
          <span className={value.length ? 'text-[#0F2A4A]' : 'text-[#0F2A4A]/40'}>
            {value.length ? `${value.length} selected` : 'Select organizations'}
          </span>
          <ChevronDown size={14} className={`text-[#0F2A4A]/40 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          // Use fixed positioning anchored via a useLayoutEffect, but a simpler fix:
          // render portal-style with fixed + JS coords, OR simply use position:absolute
          // with overflow visible on all parents. We fix the parents instead (see card below).
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[200] bg-white border border-[#e2ddd0] rounded-[9px] shadow-lg overflow-hidden">
            {CHURCH_ORGS.map(org => {
              const selected = value.includes(org);
              return (
                <button
                  key={org}
                  type="button"
                  onClick={() => toggleOrg(org)}
                  className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-sm font-[inherit] transition-colors cursor-pointer text-left
                    ${selected ? 'bg-[#fdf8ee] text-[#0F2A4A] font-semibold' : 'text-[#0F2A4A]/80 hover:bg-[#f4f2ed]'}`}
                >
                  <span>{org}</span>
                  {selected && <Check size={14} className="text-[#C9A84C] shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(org => (
            <span
              key={org}
              className="inline-flex items-center gap-1.5 bg-[#fdf8ee] border border-[#e7d9ad] text-[#0F2A4A] text-xs font-semibold px-2.5 py-1 rounded-full"
            >
              {org}
              <button
                type="button"
                onClick={() => removeOrg(org)}
                className="text-[#0F2A4A]/40 hover:text-[#c0392b] transition-colors cursor-pointer border-none bg-transparent p-0 flex items-center"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────

const UserProfilePage = () => {
  const { user, setUser } = useAuthUser();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const router = useRouter();

  // 'closed' | 'view'  — there is no separate "upload" modal mode anymore;
  // replacing the document now happens via a direct file-picker, either from
  // the file row's Replace button or from inside the view modal.
  const [familyCardModal, setFamilyCardModal] = useState('closed');
  const [replacingCard, setReplacingCard] = useState(false);
  
  const fileUrl = user?.family_card_document?.file_path
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/${user.family_card_document.file_path.replaceAll('\\', '/')}`
    : '';
  const replaceInputRef = useRef(null);

  const buildFormFromUser = (u) => ({
    user_name: u?.user_name ?? '',
    user_mobile_number: u?.user_mobile_number ?? '',
    prayer_group: u?.prayer_group ?? '',
    church_organizations: u?.church_organizations ?? [],
    spouse_name: u?.spouse_name ?? '',
    address: u?.address ?? '',
  });

  const [form, setForm] = useState(buildFormFromUser(user));

  // Keep form in sync if user loads asynchronously
  useEffect(() => {
    if (user) {
      setForm(buildFormFromUser(user));
    }
  }, [user]);

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.user_name.trim()) e.user_name = "Name is required";

    if (!form.user_mobile_number.trim()) e.user_mobile_number = "Mobile number is required";
    else if (!/^\d{10}$/.test(form.user_mobile_number.trim()))
      e.user_mobile_number = "Enter a valid 10-digit mobile number";

    if (!form.prayer_group) e.prayer_group = "Please select a prayer group";

    return e;
  };

  const handleCancel = () => {
    setForm(buildFormFromUser(user));
    setErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      // ← updated endpoint
      const res = await apiPatch(`/user/${user._id}`, form);
      if (res?.status === 'success') {
        toast.success('Profile updated successfully.');
        setUser?.(prev => ({ ...prev, ...form }));
        setIsEditing(false);
      } else {
        throw new Error(res?.message);
      }
    } catch (err) {
      toast.error(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyCardSuccess = (newUserData) => {
    setUser?.(newUserData);
    setFamilyCardModal('closed');
  };

  // ── Direct "Replace" from the file row: opens the OS file picker immediately,
  // no intermediate dropzone modal. Used by the Replace button in the table row.
  const isValidCardFile = (f) => {
    if (!f) return false;
    if (f.type !== 'application/pdf' && !f.type.startsWith('image/')) {
      toast.error('Only PDF or image files are allowed.');
      return false;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB.');
      return false;
    }
    return true;
  };

  const handleRowReplaceClick = () => {
    replaceInputRef.current?.click();
  };

  const handleRowFileChosen = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file later
    if (!isValidCardFile(f)) return;

    setReplacingCard(true);
    try {
      const formData = new FormData();
      formData.append('family_card', f);
      const res = await apiPost('/uploads/family_card', formData);
      if (res?.status === 'success') {
        handleFamilyCardSuccess(res?.data);
        toast.success('Family card replaced successfully.');
      } else {
        throw new Error(res?.message);
      }
    } catch (err) {
      toast.error(err.message ?? 'Something went wrong while replacing.');
    } finally {
      setReplacingCard(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f4f2ed] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0F2A4A]/30" size={28} />
      </div>
    );
  }


  const verificationStyles = {
    pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   label: 'Pending Verification' },
    verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Verified' },
    rejected: { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     label: 'Rejected' },
  };
  const vStyle = verificationStyles[user.verification_status] ?? verificationStyles.pending;

  return (
    <div className="min-h-screen bg-[#f4f2ed]">

      {/* Page header bar */}
           {/* Page header bar */}
      <div className="bg-[#0F2A4A] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors bg-white/10 hover:bg-white/15 border border-white/15 rounded-md px-3 py-1.5 text-xs font-semibold font-[inherit] cursor-pointer shrink-0"
          >
            <ArrowLeft size={12} />
            Back
          </button>
          <div className="h-5 w-px bg-white/20" />
          <div>
            <div className="text-white/50 text-[10px] font-semibold tracking-[1.5px] uppercase leading-none mb-0.5">
              Profile Page
            </div>
            <div className="text-white font-bold text-base tracking-[0.2px] leading-none">
              Baptism Application
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6">

        {/* Profile details card — overflow visible so the org dropdown can escape */}
        <div className="bg-white rounded-xl border border-[#e2ddd0] shadow-sm overflow-visible">

          {/* Card header / actions */}
          <div className="px-7 py-5 border-b border-[#f0ece0] flex items-center justify-between rounded-t-xl">
            <div>
              <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-1">
                Profile Details
              </div>
              <p className="text-xs text-[#0F2A4A]/40">
                {isEditing ? 'Editing your profile information' : 'Your parish registration details'}
              </p>
            </div>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-[#0F2A4A]/60 hover:text-[#0F2A4A] bg-white hover:bg-[#f4f2ed] border border-[#d4c9a8] rounded-md px-3.5 py-2 text-xs font-semibold font-[inherit] transition-colors cursor-pointer"
              >
                <Pencil size={12} /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-[#0F2A4A]/50 hover:text-[#0F2A4A] bg-white hover:bg-[#f4f2ed] border border-[#d4c9a8] rounded-md px-3.5 py-2 text-xs font-semibold font-[inherit] transition-colors cursor-pointer disabled:opacity-40"
                >
                  <X size={12} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold font-[inherit] border-none transition-colors cursor-pointer
                    ${loading ? 'bg-[#a89050] text-white cursor-not-allowed' : 'bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A]'}`}
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  {loading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          {/* Personal Details */}
          <div className="px-7 py-6 border-b border-[#f0ece0]">
            <SectionHeading>Personal Details</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">

              <Field label="Full Name" error={errors.user_name}>
                {isEditing
                  ? <input value={form.user_name} onChange={set('user_name')} placeholder="Enter your full name" className={inputCls(errors.user_name)} />
                  : <span className="flex items-center gap-2 text-sm text-[#0F2A4A] font-medium"><User size={14} className="text-[#0F2A4A]/30" />{user.user_name || '—'}</span>
                }
              </Field>

              <Field label="Email">
                <span className="flex items-center gap-2 text-sm text-[#0F2A4A]/50 font-medium">
                  {user.user_email || '—'}
                </span>
              </Field>

              <Field label="Mobile Number" error={errors.user_mobile_number}>
                {isEditing
                  ? <input
                      value={form.user_mobile_number}
                      onChange={e => setForm(p => ({ ...p, user_mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                      placeholder="Enter mobile number"
                      inputMode="numeric"
                      className={inputCls(errors.user_mobile_number)}
                    />
                  : <span className="flex items-center gap-2 text-sm text-[#0F2A4A] font-medium"><Phone size={14} className="text-[#0F2A4A]/30" />{user.user_mobile_number || '—'}</span>
                }
              </Field>

              <Field label="Spouse's Name" error={errors.spouse_name}>
                {isEditing
                  ? <input value={form.spouse_name} onChange={set('spouse_name')} placeholder="Enter spouse's name (if applicable)" className={inputCls(errors.spouse_name)} />
                  : <span className="flex items-center gap-2 text-sm text-[#0F2A4A] font-medium"><Heart size={14} className="text-[#0F2A4A]/30" />{user.spouse_name || '—'}</span>
                }
              </Field>

              <div className="sm:col-span-2">
                <Field label="Address" error={errors.address}>
                  {isEditing
                    ? <input value={form.address} onChange={set('address')} placeholder="Enter your address" className={inputCls(errors.address)} />
                    : <span className="flex items-center gap-2 text-sm text-[#0F2A4A] font-medium"><MapPin size={14} className="text-[#0F2A4A]/30 shrink-0" />{user.address || '—'}</span>
                  }
                </Field>
              </div>

            </div>
          </div>

          {/* Parish Affiliation */}
          <div className="px-7 py-6">
            <SectionHeading>Parish Affiliation</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">

              <Field label="Prayer Group" error={errors.prayer_group}>
                {isEditing ? (
                  <select
                    value={form.prayer_group}
                    onChange={set('prayer_group')}
                    className={inputCls(errors.prayer_group) + ' cursor-pointer appearance-none'}
                  >
                    <option value="" disabled>Select a prayer group</option>
                    {PRAYER_GROUPS.map(pg => (
                      <option key={pg} value={pg}>{pg}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm text-[#0F2A4A] font-medium">{user.prayer_group || '—'}</span>
                )}
              </Field>

              <Field label="Church Organizations" error={errors.church_organizations}>
                {isEditing ? (
                  <MultiSelectOrgs
                    value={form.church_organizations}
                    onChange={(orgs) => setForm(p => ({ ...p, church_organizations: orgs }))}
                    error={errors.church_organizations}
                  />
                ) : user.church_organizations?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {user.church_organizations.map(org => (
                      <span key={org} className="inline-flex items-center bg-[#fdf8ee] border border-[#e7d9ad] text-[#0F2A4A] text-xs font-semibold px-2.5 py-1 rounded-full">
                        {org}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-[#0F2A4A]/40">None selected</span>
                )}
              </Field>

            </div>
          </div>

        </div>

        {/* Family Card section */}
        <div className="bg-white rounded-xl border border-[#e2ddd0] shadow-sm overflow-hidden">
          <div className="px-7 py-5 border-b border-[#f0ece0] flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[11px] font-bold text-[#C9A84C] tracking-[1.4px] uppercase mb-1">
                Family Card Document
              </div>
              <p className="text-xs text-[#0F2A4A]/40">
                Used to verify your family details for sacrament requests
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${vStyle.bg} ${vStyle.text} ${vStyle.border}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
              {vStyle.label}
            </span>
          </div>

          <div className="px-7 py-6">
            {/* Hidden input shared by the row's Replace button — opens the file
                manager directly and uploads as soon as a file is chosen. */}
            <input
              ref={replaceInputRef}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={handleRowFileChosen}
            />

            {fileUrl ? (
              <div className="flex flex-col gap-4">
                {/* Compact file row — no inline preview, just the name + two action buttons */}
                <div className="flex items-center gap-3 p-3.5 rounded-lg border border-[#e2ddd0] bg-[#faf9f6]">
                  <FileText size={18} className="text-[#0F2A4A]/25 shrink-0" strokeWidth={1.5} />
                  <span className="text-sm text-[#0F2A4A]/60 truncate flex-1 min-w-0">
                    {user.family_card_document?.file_name || 'Family card document'}
                  </span>

                  {/* View Fully */}
                  <button
                    onClick={() => setFamilyCardModal('view')}
                    className="flex items-center gap-1.5 text-[#0F2A4A]/60 hover:text-[#0F2A4A] bg-white hover:bg-[#f4f2ed] border border-[#d4c9a8] rounded-[7px] px-3 py-1.5 text-xs font-semibold font-[inherit] transition-colors cursor-pointer shrink-0"
                  >
                    <Eye size={12} /> View Fully
                  </button>

                  {/* Replace — opens the file manager directly, no modal */}
                  <button
                    onClick={handleRowReplaceClick}
                    disabled={replacingCard}
                    className="flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A] font-bold text-xs uppercase tracking-[0.6px] px-3 py-1.5 rounded-[7px] transition-colors cursor-pointer border-none font-[inherit] shrink-0 disabled:opacity-60"
                  >
                    {replacingCard ? <Loader2 size={13} className="animate-spin" /> : <RefreshIcon />}
                    {replacingCard ? 'Replacing…' : 'Replace'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <FileText size={26} className="text-[#0F2A4A]/20" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-semibold text-[#0F2A4A] mb-1">No family card uploaded</p>
                  <p className="text-xs text-[#0F2A4A]/40">Upload one to get verified for sacrament requests.</p>
                </div>
                <button
                  onClick={handleRowReplaceClick}
                  disabled={replacingCard}
                  className="mt-1 flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#dbb85a] text-[#0F2A4A] font-bold text-xs uppercase tracking-[0.6px] px-4 py-2 rounded-[7px] transition-colors cursor-pointer border-none font-[inherit] disabled:opacity-60"
                >
                  {replacingCard ? <Loader2 size={13} className="animate-spin" /> : 'Upload Document'}
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal: view mode — also has its own "Replace" button (next to Close)
          that opens the file manager directly and uploads on selection. */}
      {familyCardModal === 'view' && (
        <FamilyCardUploadModal
          mode="view"
          familyCardUrl={fileUrl}
          fileName={user.family_card_document?.file_name}
          showVerifyActions={false}
          onCancel={() => setFamilyCardModal('closed')}
          onReplace={handleFamilyCardSuccess}
          onSuccess={handleFamilyCardSuccess}
        />
      )}

    </div>
  );
};

// small inline icon
const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default UserProfilePage;