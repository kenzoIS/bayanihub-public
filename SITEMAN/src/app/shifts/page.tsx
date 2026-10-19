"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Clock, Check, X, User } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Shift {
  id: string;
  volunteer_name: string;
  clock_in: string;
  clock_out: string | null;
  status: string;
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchShifts = async () => {
    try {
      setErrorMsg(null);
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/shifts/pending`);
      // 404 → table likely not migrated yet, show empty state
      if (res.status === 404) {
        setShifts([]);
        setErrorMsg("Shifts table not found. Please contact your administrator.");
        return;
      }
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Server error ${res.status}`);
      }
      const data = await res.json();
      setShifts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // Network error (backend not running)
      if (err.message?.includes('fetch')) {
        setErrorMsg("Cannot connect to backend at port 3001. Make sure the backend is running.");
      } else {
        setErrorMsg(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/shifts/${id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to approve");
      }
      setShifts(prev => prev.filter(s => s.id !== id));
      alert("Shift approved and hours logged!");
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (id: string) => {
    setActionLoading(id);
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/api/shifts/${id}/deny`, { method: 'POST' });
      if (!res.ok) throw new Error("Failed to deny");
      setShifts(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Ongoing";
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '24px', marginTop: '8px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: '12px', margin: '0 0 8px 0' }}>
            <Clock size={28} color="#5C6ED5" />
            Review Shift Hours
          </h1>
          <p style={{ color: '#6B7280', margin: 0 }}>Review and approve volunteer hours for recent deployments.</p>
        </div>

        {errorMsg && (
          <div style={{ padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', borderRadius: '12px', marginBottom: '24px', fontWeight: 500 }}>
            {errorMsg}
          </div>
        )}

        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          {loading ? (
            <LoadingSpinner text="Loading pending shifts..." />
          ) : shifts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
              <Clock size={40} color="#D1D5DB" style={{ marginBottom: '16px' }} />
              <p>No pending shifts require approval.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {shifts.map(shift => (
                <div key={shift.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', border: '1px solid #E5E7EB', borderRadius: '12px', backgroundColor: shift.status === 'flagged' ? '#FEF2F2' : '#F9FAFB' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(92, 110, 213, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={24} color="#5C6ED5" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '16px', color: '#111827', marginBottom: '4px' }}>{shift.volunteer_name}</div>
                      <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', gap: '16px' }}>
                        <span><strong>In:</strong> {formatDate(shift.clock_in)}</span>
                        <span><strong>Out:</strong> {formatDate(shift.clock_out)}</span>
                      </div>
                      {shift.status === 'flagged' && <div style={{ fontSize: '12px', color: '#DC2626', marginTop: '4px', fontWeight: 500 }}>⚠️ Flagged for review</div>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleDeny(shift.id)}
                      disabled={actionLoading === shift.id || !shift.clock_out}
                      style={{ padding: '8px 16px', backgroundColor: 'white', border: '1px solid #E5E7EB', color: '#DC2626', borderRadius: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '6px', cursor: (actionLoading === shift.id || !shift.clock_out) ? 'not-allowed' : 'pointer', opacity: (actionLoading === shift.id || !shift.clock_out) ? 0.5 : 1 }}
                    >
                      <X size={16} /> Flag
                    </button>
                    <button
                      onClick={() => handleApprove(shift.id)}
                      disabled={actionLoading === shift.id || !shift.clock_out}
                      style={{ padding: '8px 16px', backgroundColor: '#10B981', border: 'none', color: 'white', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: (actionLoading === shift.id || !shift.clock_out) ? 'not-allowed' : 'pointer', opacity: (actionLoading === shift.id || !shift.clock_out) ? 0.5 : 1, boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}
                    >
                      <Check size={16} /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
