"use client";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import {
  X,
  FileUp,
  FileText,
  Trash2,
  Upload,
  Loader2,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { apiGet, apiPost } from "@/services/axios";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// USAGE:
//
// MODE 1 — User upload:
//   <PriestViewFamilyCardModal
//     mode="upload"
//     onCancel={() => setOpen(false)}
//     onSuccess={() => { setOpen(false); refetch(); }}
//   />
//
// MODE 2 — Priest view (fetches PDF from DB by family/user id):
//   <PriestViewFamilyCardModal
//     mode="view"
//     familyCardUrl="https://your-s3-or-cdn-url/family_card.pdf"
//     onCancel={() => setOpen(false)}
//   />
//
//   If you fetch the URL lazily (e.g. from an API), pass `fetchUrl` instead:
//   <PriestViewFamilyCardModal
//     mode="view"
//     fetchUrl="/priest/family_card/userId123"
//     onCancel={() => setOpen(false)}
//   />
// ─────────────────────────────────────────────────────────────────────────────

const PriestViewFamilyCardModal = ({
  mode = "upload",          // "upload" | "view"
  onCancel,
  onSuccess,                // upload mode only
  familyCardUrl,            // view mode — direct URL string
  fetchUrl,                 // view mode — API endpoint to fetch PDF URL from
}) => {
  const overlayRef = useRef(null);
  const inputRef   = useRef(null);

  // ── upload mode state ──
  const [selectedFile, setSelectedFile] = useState(null);
  const [localFileUrl, setLocalFileUrl] = useState(null);
  const [uploading,    setUploading]    = useState(false);

  // ── view mode state ──
  const [remoteUrl,     setRemoteUrl]     = useState(familyCardUrl ?? null);
  const [fetchingPdf,   setFetchingPdf]   = useState(false);
  const [fetchError,    setFetchError]    = useState(null);

  // Revoke local object URL on unmount
  useEffect(() => {
    return () => { if (localFileUrl) URL.revokeObjectURL(localFileUrl); };
  }, [localFileUrl]);

  // If view mode + fetchUrl provided, load the PDF URL from API
  useEffect(() => {
    if (mode !== "view" || !fetchUrl || familyCardUrl) return;
    const load = async () => {
      setFetchingPdf(true);
      setFetchError(null);
      try {
        const res = await apiGet(fetchUrl);
        if (res.status !== "success") throw new Error(res.message || "Failed to load family card.");
        // expect res.data to be the PDF URL string or { url: "..." }
        setRemoteUrl(typeof res.data === "string" ? res.data : res.data?.url);
      } catch (err) {
        setFetchError(err.message);
        toast.error(err.message);
      } finally {
        setFetchingPdf(false);
      }
    };
    load();
  }, [mode, fetchUrl, familyCardUrl]);

  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current && !uploading) onCancel?.();
  };

  // ── upload mode handlers ──────────────────────────────────────────
  const processFile = (file) => {
    if (file.type !== "application/pdf") { toast.error("Only PDF files are accepted."); return; }
    if (file.size > MAX_FILE_SIZE_BYTES) { toast.error(`File size must be under ${MAX_FILE_SIZE_MB}MB.`); return; }
    if (localFileUrl) URL.revokeObjectURL(localFileUrl);
    setLocalFileUrl(URL.createObjectURL(file));
    setSelectedFile(file);
  };

  const handleFileSelect = (e) => { const f = e.target.files?.[0]; if (f) processFile(f); };
  const handleDrop       = (e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) processFile(f); };

  const handleRemoveFile = () => {
    if (localFileUrl) URL.revokeObjectURL(localFileUrl);
    setLocalFileUrl(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!selectedFile) { toast.warning("Please select a PDF file first."); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("family_card", selectedFile);
      const res = await apiPost("/uploads/family_card", formData);
      if (res.status !== "success") throw new Error(res.message);
      toast.success("Family card uploaded successfully.");
      onSuccess?.();
    } catch (err) {
      toast.error(err?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ── derived ───────────────────────────────────────────────────────
  const isUpload     = mode === "upload";
  const isView       = mode === "view";
  const previewUrl   = isUpload ? localFileUrl : remoteUrl;
  const fileSizeLabel = selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : null;

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      className="fixed inset-0 z-[9999] bg-[rgba(10,22,40,0.65)] flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        {/* ── Header ── */}
        <div className="bg-[#0F2A4A] px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center">
              {isUpload
                ? <FileUp className="w-4 h-4 text-[#C9A84C]" strokeWidth={1.5} />
                : <Eye    className="w-4 h-4 text-[#C9A84C]" strokeWidth={1.5} />}
            </div>
            <div>
              <p className="text-white text-sm font-medium leading-tight">
                {isUpload ? "Upload Family Card" : "Family Card"}
              </p>
              <p className="text-[#C9A84C]/60 text-[10px] uppercase tracking-widest">
                {isUpload ? `PDF only · Max ${MAX_FILE_SIZE_MB}MB` : "Read-only · Submitted by family"}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={uploading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ══ UPLOAD MODE ══ */}
          {isUpload && (
            <>
              {/* Drop zone */}
              {!selectedFile && (
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => inputRef.current?.click()}
                  className="border-2 border-dashed border-[#0F2A4A]/20 hover:border-[#C9A84C]/60 rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#0F2A4A]/5 group-hover:bg-[#C9A84C]/10 flex items-center justify-center transition-colors">
                    <FileText className="w-6 h-6 text-[#0F2A4A]/30 group-hover:text-[#C9A84C] transition-colors" strokeWidth={1.4} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-[#0F2A4A]">Drag & drop your PDF here</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      or <span className="text-[#C9A84C] underline underline-offset-2">browse to choose</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#0F2A4A]/4 rounded-lg px-3 py-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0F2A4A]/30" />
                    <span className="text-[11px] text-[#0F2A4A]/40">PDF format · Max {MAX_FILE_SIZE_MB}MB</span>
                  </div>
                </div>
              )}

              <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="hidden" />

              {/* File chip */}
              {selectedFile && (
                <div className="flex items-center gap-3 bg-[#0F2A4A]/4 border border-[#0F2A4A]/10 rounded-xl px-4 py-3">
                  <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/15 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#C9A84C]" strokeWidth={1.4} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F2A4A] truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fileSizeLabel}</p>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    disabled={uploading}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition-colors disabled:opacity-30 flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* ══ VIEW MODE ══ */}
          {isView && fetchingPdf && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-[#0F2A4A]/30 animate-spin" />
              <p className="text-xs text-[#0F2A4A]/40 uppercase tracking-widest">Loading document…</p>
            </div>
          )}

          {isView && fetchError && !fetchingPdf && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-300" />
              </div>
              <p className="text-sm font-medium text-[#0F2A4A]">Could not load document</p>
              <p className="text-xs text-gray-400">{fetchError}</p>
            </div>
          )}

          {isView && !fetchingPdf && !fetchError && !remoteUrl && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-10 h-10 rounded-full bg-[#0F2A4A]/5 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#0F2A4A]/20" />
              </div>
              <p className="text-sm font-medium text-[#0F2A4A]">No family card uploaded</p>
              <p className="text-xs text-gray-400">This family hasn't submitted a card yet.</p>
            </div>
          )}

          {/* ── Shared PDF preview (both modes) ── */}
          {previewUrl && (
            <div className="rounded-xl overflow-hidden border border-[#0F2A4A]/10">
              <div className="bg-[#0F2A4A]/4 px-4 py-2 border-b border-[#0F2A4A]/5 flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-widest font-medium text-[#0F2A4A]/40">
                  {isUpload ? "Preview" : "Document"}
                </p>
                {isView && (
                  <a
                    href={remoteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#C9A84C] hover:underline underline-offset-2 uppercase tracking-widest font-medium"
                  >
                    Open in new tab ↗
                  </a>
                )}
              </div>
              <iframe
                src={previewUrl}
                className="w-full"
                style={{ height: "320px" }}
                title="Family Card PDF"
              />
            </div>
          )}

        </div>

        {/* ── Footer ── */}
        <div className="px-5 pb-5 pt-3 border-t border-[#0F2A4A]/5 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={onCancel}
            disabled={uploading}
            className="flex-1 border border-[#0F2A4A]/20 hover:border-[#0F2A4A]/40 hover:bg-[#0F2A4A]/5 text-[#0F2A4A] text-sm font-medium rounded-xl py-2.5 transition-colors disabled:opacity-40"
          >
            {isView ? "Close" : "Cancel"}
          </button>

          {/* Upload button — only in upload mode */}
          {isUpload && (
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#0F2A4A] hover:bg-[#1a3d6b] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl py-2.5 transition-colors"
            >
              {uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                : <><Upload className="w-4 h-4 text-[#C9A84C]" /> Upload</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PriestViewFamilyCardModal;



// // ── User side: upload their family card ──
// <PriestViewFamilyCardModal
//   mode="upload"
//   onCancel={() => setModalOpen(false)}
//   onSuccess={() => { setModalOpen(false); refetch(); }}
// />

// // ── Priest side (option A): you already have the PDF URL from the list API ──
// <PriestViewFamilyCardModal
//   mode="view"
//   familyCardUrl={selectedFamily.family_card_url}
//   onCancel={() => setModalOpen(false)}
// />

// // ── Priest side (option B): fetch the URL lazily by user/family id ──
// <PriestViewFamilyCardModal
//   mode="view"
//   fetchUrl={`/priest/family_card/${selectedFamily._id}`}
//   onCancel={() => setModalOpen(false)}
// />