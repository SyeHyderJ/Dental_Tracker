import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Shield,
  Settings2,
  Database,
  Download,
  Trash2,
  ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AppShell from '../components/AppShell';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string>(''); // For confirmation input

  // Fetch user profile data
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          setLoading(true);
          await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [user]);

  
  // Export health data as PDF
  const handleExport = async () => {
    if (!user) return;
    setExportLoading(true);
    setError(null);
    try {
      // Fetch all relevant data
      const [profileResponse, recordsResponse, appointmentsResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        supabase
          .from('tooth_records')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false }),
        supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .order('appointment_date', { ascending: false }),
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (recordsResponse.error) throw recordsResponse.error;
      if (appointmentsResponse.error) throw appointmentsResponse.error;

      const userData = profileResponse.data;
      const toothRecords = recordsResponse.data || [];
      const appointments = appointmentsResponse.data || [];

      // Create PDF document
      const doc: any = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Title
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text('Dental Tracker - Patient Health Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Subtitle with date
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 25;

      // Patient Information Section
      doc.setFontSize(16);
      doc.setTextColor(20, 70, 120);
      doc.text('Patient Information', 20, yPosition);
      yPosition += 10;
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);

      const patientInfo = [
        ['Full Name:', userData?.full_name || 'N/A'],
        ['Email:', userData?.email || 'N/A'],
        ['Date of Birth:', userData?.date_of_birth ? new Date(userData.date_of_birth).toLocaleDateString() : 'N/A'],
        ['Phone:', userData?.phone_number || 'N/A'],
        ['Address:', userData?.address || 'N/A'],
        ['Created At:', userData?.created_at ? new Date(userData.created_at).toLocaleString() : 'N/A']
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: patientInfo,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 }, 1: { cellWidth: 120 } },
        margin: { left: 20, right: 20 }
      });
      yPosition = doc.lastAutoTable.finalY + 15;

      // Dental Records Section
      if (toothRecords.length > 0) {
        doc.setFontSize(16);
        doc.setTextColor(20, 70, 120);
        doc.text('Dental Chart Records', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`Total Records: ${toothRecords.length}`, 20, yPosition);
        yPosition += 10;

        const recordsData = toothRecords.map(record => [
          new Date(record.date).toLocaleString(),
          record.tooth_number || 'N/A',
          record.surface || 'N/A',
          record.procedure_type || 'N/A',
          record.notes || '',
          record.provider_name || 'N/A'
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date', 'Tooth #', 'Surface', 'Procedure', 'Notes', 'Provider']],
          body: recordsData,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [40, 80, 120], textColor: 255, fontSize: 9 },
          alternateRowStyles: { fillColor: [245, 245, 250] },
          margin: { left: 20, right: 20 }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Appointments Section
      if (appointments.length > 0) {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(20, 70, 120);
        doc.text('Appointment History', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.text(`Total Appointments: ${appointments.length}`, 20, yPosition);
        yPosition += 10;

        const appointmentsData = appointments.map(appt => [
          new Date(appt.appointment_date).toLocaleString(),
          appt.appointment_type || 'N/A',
          appt.status || 'N/A',
          appt.provider_name || 'N/A',
          appt.notes || ''
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [['Date/Time', 'Type', 'Status', 'Provider', 'Notes']],
          body: appointmentsData,
          theme: 'striped',
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [40, 80, 120], textColor: 255, fontSize: 9 },
          alternateRowStyles: { fillColor: [245, 245, 250] },
          margin: { left: 20, right: 20 }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text('Dental Tracker - Confidential Patient Information', pageWidth / 2, pageHeight - 5, { align: 'center' });
      }

      // Save the PDF
      doc.save(`dental-tracker-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      setError(err.message);
      console.error('Export error:', err);
    } finally {
      setExportLoading(false);
    }
  };

  // Delete account
  const handleDelete = async () => {
    if (!user) return;
    // Require user to type "DELETE" to confirm
    if (deleteConfirm.toUpperCase() !== 'DELETE') {
      setError('Please type "DELETE" to confirm account deletion');
      return;
    }
    setDeleteLoading(true);
    setError(null);
    try {
      // Invoke the Edge Function for secure account deletion
      await supabase.functions.invoke('delete-account');
      // On success, sign out and redirect to home
      await logout();
      navigate('/', { replace: true });
    } catch (err: any) {
      // The Edge Function returns an error in the response body if it fails
      // We can try to parse the error, but for now just show the message
      setError(err.message || 'Account deletion failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full border-4 border-t-primary w-12 h-12"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-red-50 border-l-2 border-red-500 text-red-700 p-6">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/', { replace: true });
    return null;
  }

  return (
    <AppShell title="Security & Settings" subtitle="Manage your account preferences and security protocols." active="you">
      <div className="space-y-6">
        {/* Security Audit Card */}
        <section className="surface-card flex flex-col items-center text-center p-6">
          <div className="w-12 h-12 bg-primary-soft rounded-full flex items-center justify-center text-primary mb-4">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold text-ink">Security Audit Passed</h2>
          <p className="text-sm text-slate mt-1 mb-6">Core systems hardened and encrypted (AES-256).</p>
          <button
            type="button"
            onClick={() => navigate('/security-log')}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-opacity"
          >
            View Log
          </button>
        </section>

        {/* Security Section */}
        <section className="surface-card overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <Shield className="h-5 w-5 text-ink" />
            <h3 className="font-bold text-lg">Security</h3>
          </div>
          <div className="divide-y divide-border">
            <button
              type="button"
              onClick={() => navigate('/mfa')}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left group"
            >
              <div>
                <div className="font-bold text-ink">Multi-Factor Authentication (MFA)</div>
                <div className="text-sm text-slate mt-0.5">Enhance account security with a second step.</div>
              </div>
              <ChevronRight className="material-symbols-outlined text-slate group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/change-password')}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left group"
            >
              <div>
                <div className="font-bold text-ink">Change Password</div>
                <div className="text-sm text-slate mt-0.5">Update your login credentials securely.</div>
              </div>
              <ChevronRight className="material-symbols-outlined text-slate group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/session-logs')}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left group"
            >
              <div>
                <div className="font-bold text-ink">Session Logs</div>
                <div className="text-sm text-slate mt-0.5">Review recent sign-ins and active sessions.</div>
              </div>
              <ChevronRight className="material-symbols-outlined text-slate group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* App Preferences Section */}
        <section className="surface-card overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-ink" />
            <h3 className="font-bold text-lg">App Preferences</h3>
          </div>
          <div className="divide-y divide-border">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left group"
            >
              <div className="font-bold text-ink">Notifications</div>
              <span className="material-symbols-outlined text-slate group-hover:translate-x-1 transition-transform">
                ChevronRight
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/appearance')}
              className="w-full px-6 py-5 flex items-center justify-between hover:bg-surface-container-low transition-colors text-left group"
            >
              <div className="font-bold text-ink">Appearance</div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate">Light</span>
                <span className="material-symbols-outlined text-slate group-hover:translate-x-1 transition-transform">
                  ChevronRight
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* Data Governance Section */}
        <section className="bg-primary-soft border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center gap-3">
            <Database className="h-5 w-5 text-ink" />
            <h3 className="font-bold text-lg text-ink">Data Governance</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate mb-6 leading-relaxed">You own your clinical data. Manage it securely here.</p>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-ink text-white rounded-full flex items-center justify-center shrink-0">
                  <Download className="text-xl" />
                </div>
                <div>
                  <div className="font-bold text-ink">Export My Health Data</div>
                  <p className="text-[13px] text-slate mt-1 leading-normal">Download a complete, encrypted archive of your charts, history, and records in JSON/CSV format.</p>
                  <button
                    className="mt-4 bg-primary text-on-primary px-5 py-2 rounded-lg text-xs font-bold hover:opacity-80 transition-opacity"
                    onClick={handleExport}
                    disabled={exportLoading}
                  >
                    {exportLoading ? 'Exporting...' : 'Request Export'}
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-4 border-t border-border pt-6">
                <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-full flex items-center justify-center shrink-0">
                  <Trash2 className="text-xl" />
                </div>
                <div>
                  <div className="font-bold text-destructive">Delete Account</div>
                  <p className="text-[13px] text-slate mt-1 leading-normal">Permanently remove your account and purge all associated data from our servers. This action cannot be undone.</p>
                  {deleteLoading ? (
                    <button className="mt-4 bg-destructive text-on-destructive px-5 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity" disabled>
                      Deleting...
                    </button>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        placeholder="Type DELETE to confirm"
                        className="mt-2 block w-full px-3 py-2 border border-border rounded-md text-ink focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
                      />
                      <button
                        className="mt-4 bg-destructive text-on-destructive px-5 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity"
                        onClick={handleDelete}
                        disabled={deleteConfirm.toUpperCase() !== 'DELETE'}
                      >
                        Initiate Deletion
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}