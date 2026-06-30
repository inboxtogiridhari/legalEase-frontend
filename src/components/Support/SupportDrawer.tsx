import { useEffect, useState } from 'react';
import { AlertCircle, Headphones, Loader2, PhoneCall, ReceiptIndianRupee, ShieldCheck, X } from 'lucide-react';
import { apiCreateSupportTicket, apiSupportCaseStatus, apiSupportTickets } from '../../lib/api';
import { SupportTicket } from '../../types';
import { useToast } from '../Toast/ToastProvider';

interface SupportDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CUSTOMER_CARE_NUMBER = import.meta.env.VITE_SUPPORT_PHONE || '+919999999999';

export default function SupportDrawer({ open, onClose }: SupportDrawerProps) {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [latestCase, setLatestCase] = useState<{
    id: string;
    document_type: string;
    status: string;
    payment_status?: string;
    updated_at: string;
  } | null>(null);
  const [creatingCategory, setCreatingCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([apiSupportTickets(), apiSupportCaseStatus()])
      .then(([ticketData, caseData]) => {
        setTickets(ticketData.tickets || []);
        setLatestCase(caseData.document || null);
      })
      .catch((error) => {
        showToast(error instanceof Error ? error.message : 'Failed to load support desk', 'error');
      })
      .finally(() => setLoading(false));
  }, [open, showToast]);

  async function raiseTicket(category: SupportTicket['category']) {
    setCreatingCategory(category);
    try {
      const defaults: Record<SupportTicket['category'], { subject: string; description: string; priority: SupportTicket['priority'] }> = {
        payment_refund: {
          subject: 'Payment or refund assistance required',
          description: 'I need help with a failed UPI transaction, refund, or duplicate payment.',
          priority: 'high',
        },
        case_status: {
          subject: 'Need latest case status update',
          description: latestCase
            ? `Please help me with the latest update for document ${latestCase.id}.`
            : 'Please help me with the latest status of my case.',
          priority: 'medium',
        },
        call_support: {
          subject: 'Requesting a support callback',
          description: `Please contact me on priority. Customer care number tried: ${CUSTOMER_CARE_NUMBER}.`,
          priority: 'medium',
        },
        general: {
          subject: 'General help request',
          description: 'I need help with LegalEase.',
          priority: 'low',
        },
      };

      const next = defaults[category];
      const response = await apiCreateSupportTicket({
        category,
        subject: next.subject,
        description: next.description,
        document_id: latestCase?.id,
        priority: next.priority,
        meta: latestCase ? { latest_case_status: latestCase.status } : undefined,
      });
      setTickets((prev) => [response.ticket, ...prev]);
      showToast('Support ticket created', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create ticket', 'error');
    } finally {
      setCreatingCategory(null);
    }
  }

  return (
    <div className={`fixed inset-0 z-[120] transition ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        className={`absolute inset-0 bg-slate-950/35 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside className={`absolute right-0 top-0 h-full w-full max-w-md transform border-l border-slate-200 bg-[linear-gradient(180deg,#fffdf4,#ffffff_32%,#f5f8ff)] shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Help & Support</p>
            <p className="text-xs text-slate-500">Payments, case status, and customer care</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 overflow-auto px-5 py-5">
          <div className="grid gap-3">
            {[
              { key: 'payment_refund', title: 'Payment / Refunds', icon: ReceiptIndianRupee, copy: 'Raise a ticket for failed UPI or refund issues.' },
              { key: 'case_status', title: 'Case Status', icon: ShieldCheck, copy: 'Fetch your latest document stage and open a support request.' },
              { key: 'call_support', title: 'Call Support', icon: PhoneCall, copy: 'Tap to call customer care on supported devices.' },
            ].map((item) => (
              <div key={item.key} className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-slate-900 p-3 text-white">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.copy}</p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => void raiseTicket(item.key as SupportTicket['category'])}
                        disabled={creatingCategory === item.key}
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {creatingCategory === item.key ? 'Creating...' : 'Raise Ticket'}
                      </button>
                      {item.key === 'call_support' && (
                        <a href={`tel:${CUSTOMER_CARE_NUMBER}`} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">
                          Call Customer Care
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <AlertCircle className="h-4 w-4" />
              Latest Case Snapshot
            </p>
            {loading ? (
              <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading latest status...
              </p>
            ) : latestCase ? (
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{latestCase.document_type.replace(/_/g, ' ')} #{latestCase.id.slice(0, 8)}</p>
                <p className="mt-1">Status: {latestCase.status.replace(/_/g, ' ')}</p>
                <p>Payment: {(latestCase.payment_status || 'pending').replace(/_/g, ' ')}</p>
                <p className="mt-1 text-xs text-slate-500">Updated {new Date(latestCase.updated_at).toLocaleString()}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No recent case found yet.</p>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Headphones className="h-4 w-4" />
              Recent Tickets
            </p>
            {tickets.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No support tickets raised yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-900">{ticket.subject}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">{ticket.category.replace(/_/g, ' ')}</p>
                    <p className="mt-1 text-sm text-slate-600">{ticket.status.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </aside>
    </div>
  );
}
