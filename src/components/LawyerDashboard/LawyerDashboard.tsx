import { useState, useEffect, useMemo } from 'react';
import { FileText, Clock, CheckCircle, Eye, Wallet, Star, Banknote, UserRound, ListChecks } from 'lucide-react';
import { apiClaimDocument, apiDocumentNotifications, apiDocumentsList, apiLawyerBankSave, apiLawyerWallet, apiLawyerWithdrawRequest } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Document } from '../../types';
import DashboardLayout from '../Layout/DashboardLayout';
import DocumentReview from './DocumentReview';
import ProfilePage from '../Profile/ProfilePage';
import { useToast } from '../Toast/ToastProvider';

export default function LawyerDashboard() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [pendingUnclaimed, setPendingUnclaimed] = useState(0);
  const [filter, setFilter] = useState<'all' | 'lawyer_review' | 'verified'>('all');
  const [tab, setTab] = useState<'overview' | 'transactions' | 'payment' | 'profile'>('overview');
  const [wallet, setWallet] = useState<{
    balance: number;
    pending_earnings: number;
    total_earned: number;
    total_withdrawn: number;
    currency: string;
  } | null>(null);
  const [transactions, setTransactions] = useState<Array<{ id: string; document_id: string | null; amount: number; status: string; created_at: string; meta: Record<string, unknown> }>>([]);
  const [bankForm, setBankForm] = useState({ account_name: '', account_number: '', ifsc: '', upi_id: '' });
  const [savingBank, setSavingBank] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadNotifications();
    loadWallet();
    const timer = window.setInterval(() => {
      loadDocuments();
      loadNotifications();
      loadWallet();
    }, 20000);
    return () => window.clearInterval(timer);
  }, []);

  async function loadDocuments() {
    try {
      const data = await apiDocumentsList() as Document[];
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifications() {
    try {
      const data = await apiDocumentNotifications();
      setPendingUnclaimed(data.pending_unclaimed || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  async function loadWallet() {
    try {
      const data = await apiLawyerWallet();
      setWallet(data.wallet);
      setTransactions(data.transactions || []);
      setBankForm({
        account_name: data.bank?.account_name || '',
        account_number: data.bank?.account_number || '',
        ifsc: data.bank?.ifsc || '',
        upi_id: data.bank?.upi_id || '',
      });
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  }

  async function handleClaim(docId: string) {
    try {
      await apiClaimDocument(docId);
      await loadDocuments();
      await loadNotifications();
      showToast('Document claimed successfully', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to claim document', 'error');
    }
  }

  async function saveBankDetails() {
    setSavingBank(true);
    try {
      await apiLawyerBankSave(bankForm);
      showToast('Bank details saved', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save bank details', 'error');
    } finally {
      setSavingBank(false);
    }
  }

  async function requestWithdrawal() {
    setWithdrawing(true);
    try {
      await apiLawyerWithdrawRequest({ amount: Number(withdrawAmount) });
      setWithdrawAmount('');
      showToast('Withdrawal request submitted', 'success');
      await loadWallet();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to request withdrawal', 'error');
    } finally {
      setWithdrawing(false);
    }
  }

  function handleReviewComplete() {
    setSelectedDocument(null);
    loadDocuments();
    loadWallet();
  }

  const filteredDocuments = documents.filter((doc) => {
    if (filter === 'all') return true;
    if (filter === 'lawyer_review') return ['lawyer_review', 'pending_review'].includes(doc.status);
    if (filter === 'verified') return ['verified', 'reviewed'].includes(doc.status);
    return doc.status === filter;
  });

  const statusColors = {
    draft: 'bg-slate-100 text-slate-700',
    drafting: 'bg-slate-100 text-slate-700',
    pending_review: 'bg-yellow-100 text-yellow-700',
    lawyer_review: 'bg-yellow-100 text-yellow-700',
    reviewed: 'bg-blue-100 text-blue-700',
    verified: 'bg-blue-100 text-blue-700',
    signed: 'bg-violet-100 text-violet-700',
    payment: 'bg-indigo-100 text-indigo-700',
    sent_soft_copy: 'bg-cyan-100 text-cyan-700',
    out_for_delivery: 'bg-orange-100 text-orange-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-green-100 text-green-700',
  } as const;

  const statusIcons = {
    draft: Clock,
    drafting: Clock,
    pending_review: Clock,
    lawyer_review: Clock,
    reviewed: CheckCircle,
    verified: CheckCircle,
    signed: CheckCircle,
    payment: CheckCircle,
    sent_soft_copy: CheckCircle,
    out_for_delivery: CheckCircle,
    delivered: CheckCircle,
    completed: CheckCircle,
  } as const;

  const totalVerified = documents.filter((d) => ['reviewed', 'verified'].includes(d.status)).length;
  const pendingReview = documents.filter((d) => ['pending_review', 'lawyer_review'].includes(d.status)).length;
  const totalEarnings = wallet?.total_earned || 0;
  const pendingEarnings = wallet?.pending_earnings || 0;
  const availableBalance = wallet?.balance || 0;
  const rating = profile?.rating ?? 4.8;

  const heatmapDays = useMemo(() => {
    const days: Array<{ date: Date; count: number }> = [];
    for (let i = 27; i >= 0; i -= 1) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ date: d, count: 0 });
    }
    documents.forEach((doc) => {
      if (!doc.reviewed_at) return;
      const reviewed = new Date(doc.reviewed_at);
      reviewed.setHours(0, 0, 0, 0);
      const entry = days.find((d) => d.date.getTime() === reviewed.getTime());
      if (entry) entry.count += 1;
    });
    return days;
  }, [documents]);

  if (selectedDocument) {
    return (
      <DashboardLayout onProfileClick={() => setTab('profile')}>
        <DocumentReview document={selectedDocument} onClose={handleReviewComplete} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onProfileClick={() => setTab('profile')}>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Lawyer Command Center</h2>
          <p className="text-slate-600">Track earnings, verify notices, and manage your clients.</p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-indigo-900">
          New unclaimed documents: <strong>{pendingUnclaimed}</strong>
          {profile?.verification_status !== 'verified' && (
            <p className="text-sm mt-1">Complete profile and get verified to claim/review documents.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { key: 'overview', label: 'Overview', icon: ListChecks },
            { key: 'transactions', label: 'Transactions', icon: Wallet },
            { key: 'payment', label: 'Payment Settings', icon: Banknote },
            { key: 'profile', label: 'Profile', icon: UserRound },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors inline-flex items-center gap-2 ${
                tab === t.key ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <ProfilePage onBack={() => setTab('overview')} />
        )}

        {tab === 'payment' && (
          <div className="bg-white rounded-xl shadow-md border p-6 space-y-4 max-w-2xl">
            <h3 className="text-xl font-semibold text-slate-900">Payment Settings</h3>
            <p className="text-sm text-slate-600">Save your payout details to receive earnings.</p>
            <input
              className="w-full px-3 py-2 border rounded"
              placeholder="Account Name"
              value={bankForm.account_name}
              onChange={(e) => setBankForm({ ...bankForm, account_name: e.target.value })}
            />
            <input
              className="w-full px-3 py-2 border rounded"
              placeholder="Account Number"
              value={bankForm.account_number}
              onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })}
            />
            <div className="grid md:grid-cols-2 gap-3">
              <input
                className="w-full px-3 py-2 border rounded"
                placeholder="IFSC"
                value={bankForm.ifsc}
                onChange={(e) => setBankForm({ ...bankForm, ifsc: e.target.value })}
              />
              <input
                className="w-full px-3 py-2 border rounded"
                placeholder="UPI ID"
                value={bankForm.upi_id}
                onChange={(e) => setBankForm({ ...bankForm, upi_id: e.target.value })}
              />
            </div>
            <button
              onClick={saveBankDetails}
              disabled={savingBank}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg disabled:opacity-60"
            >
              {savingBank ? 'Saving...' : 'Save Bank Details'}
            </button>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Withdraw Request</p>
              <p className="mt-1 text-xs text-slate-500">Available balance: INR {availableBalance}</p>
              <p className="mt-1 text-xs text-amber-700">Pending after verification/payment release: INR {pendingEarnings}</p>
              <div className="mt-3 flex gap-3">
                <input
                  type="number"
                  min="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full rounded-lg border px-3 py-2"
                />
                <button
                  onClick={requestWithdrawal}
                  disabled={withdrawing || !withdrawAmount}
                  className="rounded-lg bg-emerald-700 px-4 py-2 text-white disabled:opacity-60"
                >
                  {withdrawing ? 'Requesting...' : 'Withdraw'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'transactions' && (
          <div className="bg-white rounded-xl shadow-md border p-6">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Transaction History</h3>
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left bg-slate-50">
                  <tr>
                    <th className="p-2">Date</th>
                    <th className="p-2">Document</th>
                    <th className="p-2">Amount Earned</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-t">
                      <td className="p-2">{new Date(tx.created_at).toLocaleString()}</td>
                      <td className="p-2">{tx.document_id || '-'}</td>
                      <td className="p-2">INR {tx.amount}</td>
                      <td className="p-2 capitalize">{tx.status}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td className="p-4 text-slate-500" colSpan={4}>No transactions yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'overview' && (
          <>
            <div className="bg-white rounded-xl shadow-md p-6 grid md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{totalVerified}</p>
                <p className="text-sm text-slate-600">Total Verified</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingReview}</p>
                <p className="text-sm text-slate-600">Pending Reviews</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">INR {totalEarnings}</p>
                <p className="text-sm text-slate-600">Total Earnings</p>
              </div>
              <div className="text-center flex flex-col items-center">
                <p className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> {rating.toFixed(1)}
                </p>
                <p className="text-sm text-slate-600">Global Rating</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <p className="text-sm font-semibold text-amber-900">Escrow Pending</p>
                <p className="mt-2 text-3xl font-bold text-amber-700">INR {pendingEarnings}</p>
                <p className="mt-1 text-sm text-amber-800">Verified work awaiting payment confirmation stays here automatically.</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-900">Withdrawable Balance</p>
                <p className="mt-2 text-3xl font-bold text-emerald-700">INR {availableBalance}</p>
                <p className="mt-1 text-sm text-emerald-800">This balance is released after payment confirmation and can be withdrawn.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Activity Heatmap</h3>
              <div className="grid grid-cols-7 gap-2">
                {heatmapDays.map((d) => {
                  const intensity = d.count >= 4 ? 'bg-emerald-600' : d.count >= 2 ? 'bg-emerald-400' : d.count === 1 ? 'bg-emerald-200' : 'bg-slate-100';
                  return (
                    <div
                      key={d.date.toISOString()}
                      className={`w-8 h-8 rounded ${intensity}`}
                      title={`${d.date.toLocaleDateString()}: ${d.count} reviews`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-slate-500 mt-2">Last 28 days of verified reviews</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                All Documents
              </button>
              <button
                onClick={() => setFilter('lawyer_review')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'lawyer_review'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Pending Review
              </button>
              <button
                onClick={() => setFilter('verified')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'verified'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Reviewed
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-slate-900"></div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-slate-300">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No documents to display</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDocuments.map((doc) => {
                  const StatusIcon = statusIcons[doc.status];
                  return (
                    <div
                      key={doc.id}
                      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-slate-700" />
                            <h4 className="font-semibold text-slate-900 capitalize">
                              {doc.document_type.replace('_', ' ')}
                            </h4>
                          </div>
                          <p className="text-sm text-slate-600 mb-3">
                            Created on {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[doc.status]}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="capitalize">{doc.status.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedDocument(doc)}
                          disabled={doc.assigned_lawyer_id !== user?.id}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                        {!doc.assigned_lawyer_id && (
                          <button
                            onClick={() => handleClaim(doc.id)}
                            disabled={profile?.verification_status !== 'verified'}
                            className="ml-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Claim Review
                          </button>
                        )}
                        {doc.assigned_lawyer_id && doc.assigned_lawyer_id !== user?.id && (
                          <span className="ml-2 text-sm text-slate-500">Claimed by another lawyer</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
