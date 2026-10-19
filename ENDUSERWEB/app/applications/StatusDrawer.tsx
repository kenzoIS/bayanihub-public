"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";

export type Application = {
  refId: string;
  applicantId: string;
  applicantName: string;
  applicationType: string;
  submittedAt: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  rejectionReason?: string;
  updatedAt: string;
  qrToken?: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ApprovedState({ app }: { app: Application }) {
  const qrRef = useRef<SVGSVGElement>(null);
  const handleSave = () => {
    const svg = qrRef.current;
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 300, 300);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 300, 300);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `BayaniHub-Pass-${app.refId}.png`; a.click();
        URL.revokeObjectURL(url);
      });
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgStr)));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <p className="text-lg font-bold text-gray-900">Application Approved!</p>
        <p className="text-sm text-gray-500">Your event pass is ready for use.</p>
      </div>

      <div className="w-full rounded-lg p-5 flex flex-col items-center gap-3" style={{ backgroundColor: "#0f2a3d" }}>
        <p className="text-xs text-emerald-300 uppercase tracking-widest font-semibold">Event Pass</p>
        <div className="bg-white p-3 rounded">
          <QRCode ref={qrRef as any} value={app.qrToken || app.refId} size={180} />
        </div>
        <p className="text-xs text-yellow-300">{app.refId}</p>
        <p className="text-xs text-gray-400">Scan at the entrance kiosk</p>
      </div>

      <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm text-white" style={{ backgroundColor: "#1a4f7a" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        Save QR Code
      </button>
      <div className="w-full rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
        Present this pass with a valid photo ID at the venue.
      </div>
      <p className="text-xs text-gray-400">Last updated: {formatDate(app.updatedAt)}</p>
    </div>
  );
}

function PendingState({ app, onRefresh, refreshing }: { app: Application; onRefresh: () => void; refreshing: boolean }) {
  const steps = ["Submitted", "Under Review", "Decision"];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
      </div>
      <p className="text-lg font-bold text-gray-900">Under Review</p>
      <p className="text-sm text-gray-500 text-center">Your application is being processed. Processing usually takes 2–3 business days.</p>

      <div className="w-full">
        <div className="flex justify-between mb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-col items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= 1 ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-400"}`}>{i + 1}</div>
              <span className="text-xs mt-1 text-gray-500 text-center">{s}</span>
            </div>
          ))}
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full" style={{ width: "66%" }} />
        </div>
      </div>

      <button onClick={onRefresh} disabled={refreshing} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition">
        <svg className={refreshing ? "animate-spin" : ""} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
        {refreshing ? "Refreshing..." : "Refresh Status"}
      </button>
      <p className="text-xs text-gray-400">Last updated: {formatDate(app.updatedAt)}</p>
    </div>
  );
}

function RejectedState({ app }: { app: Application }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </div>
      <p className="text-lg font-bold text-gray-900">Application Not Approved</p>

      {app.rejectionReason && (
        <div className="w-full rounded-lg bg-red-50 border border-red-200 p-3">
          <p className="text-xs font-semibold text-red-700 uppercase mb-1">Reason</p>
          <p className="text-sm text-red-800">{app.rejectionReason}</p>
        </div>
      )}

      <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 transition">
          What can I do next?
          <svg className={`transition-transform ${open ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
        </button>
        {open && (
          <div className="p-3 text-sm text-gray-600 border-t border-gray-200">
            You may reapply with complete documents, or contact support for clarification on the decision.
          </div>
        )}
      </div>

      <a href="/volunteer" className="w-full text-center py-2.5 rounded-lg font-semibold text-sm text-white" style={{ backgroundColor: "#1a4f7a", display: "block" }}>Reapply</a>
      <a href="tel:+639123456789" className="text-sm text-blue-600 hover:underline">Contact Support</a>
      <p className="text-xs text-gray-400">Last updated: {formatDate(app.updatedAt)}</p>
    </div>
  );
}

export default function StatusDrawer({ app, onClose, onRefresh, refreshing }: {
  app: Application | null; onClose: () => void; onRefresh: (refId: string) => void; refreshing: boolean;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleCopy = () => {
    if (!app) return;
    navigator.clipboard.writeText(app.refId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    APPROVED: { bg: "bg-green-100", text: "text-green-700", label: "Approved" },
    PENDING:  { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
    REJECTED: { bg: "bg-red-100",   text: "text-red-700",   label: "Rejected" },
  };

  return (
    <>
      {/* Overlay */}
      <div className={`fixed inset-0 bg-black/30 z-30 transition-opacity ${app ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white z-40 shadow-2xl flex flex-col transition-transform duration-300 ${app ? "translate-x-0" : "translate-x-full"}`}>
        {app && (
          <>
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xl font-bold text-gray-900">{app.applicantName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{app.applicationType}</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition p-1">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <span className="font-mono font-semibold text-gray-800">{app.refId}</span>
                  <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600">
                    {copied ? <span className="text-green-500 text-xs">Copied!</span> : <CopyIcon />}
                  </button>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusStyles[app.status].bg} ${statusStyles[app.status].text}`}>
                  {statusStyles[app.status].label}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Submitted: {formatDate(app.submittedAt)}</p>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {app.status === "APPROVED" && <ApprovedState app={app} />}
              {app.status === "PENDING"  && <PendingState app={app} onRefresh={() => onRefresh(app.refId)} refreshing={refreshing} />}
              {app.status === "REJECTED" && <RejectedState app={app} />}
            </div>
          </>
        )}
      </div>
    </>
  );
}
