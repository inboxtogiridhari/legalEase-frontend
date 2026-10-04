import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  AdminStats,
  AdminUserUpsertPayload,
  apiAdminCreateUser,
  apiAdminDeleteUser,
  apiAdminLogin,
  apiAdminLoginEvents,
  apiAdminStats,
  apiAdminUpdateUser,
  apiAdminUserDetail,
  apiAdminUsers,
  apiAdminVerify,
  apiDocumentNotifications,
  LoginEvent,
} from '../../lib/api';
import { Profile } from '../../types';
import { useToast } from '../Toast/ToastProvider';
import UserListingPage from './UserListingPage';
import UserFormModal from './UserFormModal';
import UserDetailView from './UserDetailView';
import { AdminDoc, AdminRole, UserFormData, UserFormFiles, VerifyMode } from './adminTypes';
import {
  Bell,
  CalendarClock,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type AdminScreen = 'login' | 'overview' | 'lawyers' | 'clients' | 'audit' | 'view';
const SOCKET_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

interface AdminPanelProps {
  onBack: () => void;
}

function emptyForm(role: AdminRole): UserFormData {
  return {
    role,
    full_name: '',
    email: '',
    password: '',
    phone_number: '',
    phone_verified: false,
    address: '',
    government_id_type: '',
    government_id_number: '',
    government_id_status: 'unsubmitted',
    profile_photo_url: '',
    identity_proof_url: '',
    bar_council_id: '',
    license_state: '',
    years_experience: '',
    firm_name: '',
    office_address: '',
    signature_url: '',
    bar_certificate_url: '',
    verification_status: 'unsubmitted',
  };
}

function emptyFiles(): UserFormFiles {
  return { profile_photo: null, identity_proof: null, signature: null, bar_certificate: null };
}

function formToPayload(form: UserFormData, files: UserFormFiles): AdminUserUpsertPayload {
  return {
    role: form.role,
    full_name: form.full_name.trim(),
    email: form.email.trim() || null,
    password: form.password.trim() || undefined,
    phone_number: form.phone_number.trim() || null,
    phone_verified: form.phone_verified,
    address: form.address.trim() || null,
    government_id_type: form.government_id_type || null,
    government_id_number: form.government_id_number.trim() || null,
    government_id_status: form.government_id_status,
    profile_photo_url: form.profile_photo_url.trim() || null,
    identity_proof_url: form.identity_proof_url.trim() || null,
    bar_council_id: form.bar_council_id.trim() || null,
    license_state: form.license_state.trim() || null,
    years_experience: form.years_experience ? Number(form.years_experience) : null,
    firm_name: form.firm_name.trim() || null,
    office_address: form.office_address.trim() || null,
    signature_url: form.signature_url.trim() || null,
    bar_certificate_url: form.bar_certificate_url.trim() || null,
    verification_status: form.verification_status,
    profile_photo: files.profile_photo,
    identity_proof: files.identity_proof,
    signature: files.signature,
    bar_certificate: files.bar_certificate,
  };
}

function profileToForm(user: Profile): UserFormData {
  return {
    role: user.role,
    full_name: user.full_name || '',
    email: user.email || '',
    password: '',
    phone_number: user.phone_number || '',
    phone_verified: !!user.phone_verified,
    address: user.address || '',
    government_id_type: (user.government_id_type as UserFormData['government_id_type']) || '',
    government_id_number: user.government_id_number || '',
    government_id_status: user.government_id_status || 'unsubmitted',
    profile_photo_url: user.profile_photo_url || '',
    identity_proof_url: user.identity_proof_url || '',
    bar_council_id: user.bar_council_id || '',
    license_state: user.license_state || '',
    years_experience: user.years_experience ? String(user.years_experience) : '',
    firm_name: user.firm_name || '',
    office_address: user.office_address || '',
    signature_url: user.signature_url || '',
    bar_certificate_url: user.bar_certificate_url || '',
    verification_status: user.verification_status || 'unsubmitted',
  };
}

function validateRoleRequired(form: UserFormData, files: UserFormFiles, isEdit = false): string[] {
  const missing: string[] = [];
  if (!form.full_name.trim()) missing.push('full_name');
  if (!form.phone_number.trim()) missing.push('phone_number');
  if (!form.address.trim()) missing.push('address');
  if (!form.government_id_type) missing.push('government_id_type');
  if (!form.government_id_number.trim()) missing.push('government_id_number');
  if (!isEdit && !files.profile_photo && !form.profile_photo_url) missing.push('profile_photo');
  if (!isEdit && !files.identity_proof && !form.identity_proof_url) missing.push('identity_proof');

  if (form.role === 'lawyer') {
    if (!form.bar_council_id.trim()) missing.push('bar_council_id');
    if (!form.license_state.trim()) missing.push('license_state');
    if (!form.years_experience.trim()) missing.push('years_experience');
    if (!form.firm_name.trim()) missing.push('firm_name');
    if (!form.office_address.trim()) missing.push('office_address');
    if (!isEdit && !files.signature && !form.signature_url) missing.push('signature');
    if (!isEdit && !files.bar_certificate && !form.bar_certificate_url) missing.push('bar_certificate');
  }
  return missing;
}

const donutColors = ['#2980B9', '#5DADE2', '#95A5A6'];

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { showToast } = useToast();
  const [screen, setScreen] = useState<AdminScreen>('login');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [adminSocketToken, setAdminSocketToken] = useState('');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [govFilter, setGovFilter] = useState<'' | 'unsubmitted' | 'pending' | 'verified' | 'rejected'>('');
  const [verificationFilter, setVerificationFilter] = useState<'' | 'unsubmitted' | 'pending' | 'verified' | 'rejected'>('');
  const [stateFilter, setStateFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [detailUser, setDetailUser] = useState<Profile | null>(null);
  const [detailDocs, setDetailDocs] = useState<AdminDoc[]>([]);
  const [detailMode, setDetailMode] = useState<VerifyMode>('view');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState<UserFormData>(emptyForm('client'));
  const [createFiles, setCreateFiles] = useState<UserFormFiles>(emptyFiles());
  const [editForm, setEditForm] = useState<UserFormData>(emptyForm('client'));
  const [editFiles, setEditFiles] = useState<UserFormFiles>(emptyFiles());

  const [bellOpen, setBellOpen] = useState(false);
  const [docNotifications, setDocNotifications] = useState<{ pending_unclaimed: number } | null>(null);
  const refreshAdminSocketRef = useRef<() => void>(() => undefined);

  const roleContext: AdminRole = screen === 'lawyers' ? 'lawyer' : 'client';

  async function loginAdmin() {
    try {
      const data = await apiAdminLogin({ email: adminEmail, password: adminPassword });
      setAdminToken(data.admin_token);
      setAdminSocketToken(data.session_token);
      setScreen('overview');
      showToast('Admin login successful', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Admin login failed', 'error');
    }
  }

  async function loadUsers(role: AdminRole) {
    setLoading(true);
    try {
      const data = await apiAdminUsers(adminToken, {
        role,
        q: query || undefined,
        page,
        limit: 10,
        government_id_status: govFilter || undefined,
        verification_status: verificationFilter || undefined,
      });
      setUsers(data.users || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setSelectedIds([]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    setLoading(true);
    try {
      const data = await apiAdminStats(adminToken);
      setStats(data);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load stats', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadAudit() {
    setLoading(true);
    try {
      const data = await apiAdminLoginEvents(adminToken);
      setEvents(data.events || []);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadNotifications() {
    try {
      const data = await apiDocumentNotifications();
      setDocNotifications(data);
    } catch {
      setDocNotifications({ pending_unclaimed: 0 });
    }
  }

  refreshAdminSocketRef.current = () => {
    void loadNotifications();
    if (screen === 'overview') void loadStats();
    if (screen === 'lawyers') void loadUsers('lawyer');
    if (screen === 'clients') void loadUsers('client');
    if (screen === 'audit') void loadAudit();
    if (screen === 'view' && detailUser) {
      void apiAdminUserDetail(adminToken, detailUser.id).then((data) => {
        setDetailUser(data.user);
        setDetailDocs((data.documents as AdminDoc[]) || []);
      }).catch((error) => console.error('Admin realtime refresh failed:', error));
    }
  };

  async function openView(id: string, mode: VerifyMode = 'view') {
    try {
      const data = await apiAdminUserDetail(adminToken, id);
      setDetailUser(data.user);
      setDetailDocs((data.documents as AdminDoc[]) || []);
      setDetailMode(mode);
      setScreen('view');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to fetch user detail', 'error');
    }
  }

  async function openEdit(id: string) {
    try {
      const data = await apiAdminUserDetail(adminToken, id);
      setDetailUser(data.user);
      setEditForm(profileToForm(data.user));
      setEditFiles(emptyFiles());
      setEditOpen(true);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to open edit', 'error');
    }
  }

  async function onCreateSubmit() {
    const missing = validateRoleRequired(createForm, createFiles);
    if (missing.length) return showToast(`Missing required fields: ${missing.join(', ')}`, 'error');
    try {
      await apiAdminCreateUser(adminToken, formToPayload(createForm, createFiles));
      showToast('User created', 'success');
      setCreateOpen(false);
      const role = createForm.role;
      setCreateForm(emptyForm(role));
      setCreateFiles(emptyFiles());
      setPage(1);
      await loadUsers(role);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to create user', 'error');
    }
  }

  async function onEditSubmit() {
    if (!detailUser) return;
    const missing = validateRoleRequired(editForm, editFiles, true);
    if (missing.length) return showToast(`Missing required fields: ${missing.join(', ')}`, 'error');
    try {
      await apiAdminUpdateUser(adminToken, detailUser.id, formToPayload(editForm, editFiles));
      showToast('User updated', 'success');
      setEditOpen(false);
      await loadUsers(editForm.role);
      if (screen === 'view') {
        const data = await apiAdminUserDetail(adminToken, detailUser.id);
        setDetailUser(data.user);
        setDetailDocs((data.documents as AdminDoc[]) || []);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to update user', 'error');
    }
  }

  async function onDelete(id: string) {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await apiAdminDeleteUser(adminToken, id);
      showToast('User deleted', 'success');
      setPage(1);
      await loadUsers(roleContext);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to delete user', 'error');
    }
  }

  async function applyVerification(user: Profile, decision: 'verified' | 'rejected') {
    try {
      const payload: { government_id_status: 'verified' | 'rejected'; status?: 'verified' | 'rejected' } = {
        government_id_status: decision,
      };
      if (user.role === 'lawyer') payload.status = decision;
      await apiAdminVerify(adminToken, user.id, payload);
      showToast(`User ${decision}`, 'success');
      if (screen === 'view') {
        const data = await apiAdminUserDetail(adminToken, user.id);
        setDetailUser(data.user);
        setDetailDocs((data.documents as AdminDoc[]) || []);
        await loadUsers(user.role);
      } else {
        await loadUsers(roleContext);
      }
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to verify user', 'error');
    }
  }

  async function onBulkVerify(decision: 'verified' | 'rejected') {
    if (!selectedIds.length) return;
    if (!window.confirm(`Apply ${decision} to ${selectedIds.length} selected users?`)) return;
    try {
      for (const id of selectedIds) {
        const user = users.find((u) => u.id === id);
        if (!user) continue;
        await applyVerification(user, decision);
      }
      setSelectedIds([]);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Bulk verify failed', 'error');
    }
  }

  async function onBulkDelete() {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected users?`)) return;
    try {
      for (const id of selectedIds) {
        await apiAdminDeleteUser(adminToken, id);
      }
      showToast('Selected users deleted', 'success');
      setSelectedIds([]);
      await loadUsers(roleContext);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Bulk delete failed', 'error');
    }
  }

  useEffect(() => {
    if (!adminToken || screen === 'login' || screen === 'view') return;
    if (screen === 'overview') loadStats();
    if (screen === 'lawyers') loadUsers('lawyer');
    if (screen === 'clients') loadUsers('client');
    if (screen === 'audit') loadAudit();
  }, [screen, adminToken, query, page, govFilter, verificationFilter]);

  useEffect(() => {
    if (!adminToken || screen === 'login') return;
    loadNotifications();
  }, [adminToken, screen]);

  useEffect(() => {
    if (!adminSocketToken || screen === 'login') return;
    const socket = io(SOCKET_BASE, {
      transports: ['websocket'],
      auth: { token: adminSocketToken },
    });
    ['document:created', 'document:assigned', 'document:updated', 'document:verified', 'document:revision_requested', 'lawyer:verification_updated']
      .forEach((event) => socket.on(event, () => refreshAdminSocketRef.current()));
    return () => socket.disconnect();
  }, [adminSocketToken, screen]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filteredUsers = useMemo(() => {
    const stateNeedle = stateFilter.trim().toLowerCase();
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    if (!stateNeedle && !fromDate && !toDate) return users;
    return users.filter((u) => {
      const stateMatch = !stateNeedle
        || (u.license_state || '').toLowerCase().includes(stateNeedle)
        || (u.address || '').toLowerCase().includes(stateNeedle);
      if (!stateMatch) return false;
      const created = new Date(u.created_at);
      if (fromDate && created < fromDate) return false;
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        if (created > end) return false;
      }
      return true;
    });
  }, [users, stateFilter, dateFrom, dateTo]);

  const growthPct = useMemo(() => {
    const list = stats?.monthly_applications || [];
    if (list.length < 2) return 0;
    const last = list[list.length - 1].count;
    const prev = list[list.length - 2].count || 0;
    if (!prev) return last ? 100 : 0;
    return Math.round(((last - prev) / prev) * 100);
  }, [stats]);

  const chartData = useMemo(() => {
    if (!stats?.monthly_applications?.length) return [];
    const total = stats.by_type.legal_notice + stats.by_type.rent_agreement + stats.by_type.affidavit || 1;
    const legalRatio = stats.by_type.legal_notice / total;
    const rentRatio = stats.by_type.rent_agreement / total;
    return stats.monthly_applications.map((m) => ({
      month: m.month,
      legal_notice: Math.round(m.count * legalRatio),
      rent_agreement: Math.round(m.count * rentRatio),
    }));
  }, [stats]);

  const donutData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Legal Notice', value: stats.by_type.legal_notice },
      { name: 'Rent Agreement', value: stats.by_type.rent_agreement },
      { name: 'Affidavit', value: stats.by_type.affidavit },
    ];
  }, [stats]);

  if (screen === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 admin-shell">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Admin Login</h1>
            <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-900">Back</button>
          </div>
          <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="Admin email" className="w-full px-3 py-2 border rounded-lg" />
          <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Admin password" className="w-full px-3 py-2 border rounded-lg" />
          <button onClick={loginAdmin} className="w-full px-4 py-2 bg-[#2980B9] text-white rounded-lg">Sign In</button>
        </div>
      </div>
    );
  }

  const bellCount = (stats?.overview.pending_review || 0) + (docNotifications?.pending_unclaimed || 0);
  const trendUp = growthPct >= 0;

  return (
    <div className="h-screen admin-shell bg-slate-100 flex overflow-hidden">
      <aside className="w-72 bg-[#2C3E50] text-white p-5 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-300">LegalEase</p>
            <h2 className="text-2xl font-bold">Command Center</h2>
          </div>
          <LayoutDashboard size={26} />
        </div>
        <nav className="space-y-2">
          <button onClick={() => setScreen('overview')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${screen === 'overview' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
            <LayoutDashboard size={18} /> Overview
          </button>
          <button onClick={() => setScreen('lawyers')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${screen === 'lawyers' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
            <ShieldCheck size={18} /> Lawyers
          </button>
          <button onClick={() => setScreen('clients')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${screen === 'clients' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
            <Users size={18} /> Clients
          </button>
          <button onClick={() => setScreen('audit')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 ${screen === 'audit' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
            <CalendarClock size={18} /> Audit Logs
          </button>
        </nav>
        <div className="mt-auto space-y-3">
          <div className="text-xs uppercase tracking-wide text-slate-300">Admin Token</div>
          <input type="password" value={adminToken} onChange={(e) => setAdminToken(e.target.value)} placeholder="ADMIN_TOKEN" className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm" />
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col gap-5 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 sticky top-0 z-30 bg-slate-100">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Admin Console</p>
            <h1 className="text-3xl font-extrabold text-slate-900 capitalize">{screen === 'view' ? 'Verification Review' : screen}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setBellOpen((v) => !v)} className="relative p-2 rounded-xl bg-white shadow-sm border border-slate-200">
                <Bell size={18} />
                {bellCount > 0 && <span className="absolute -top-1 -right-1 text-[10px] bg-[#2980B9] text-white rounded-full px-1.5">{bellCount}</span>}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border shadow-lg p-3 text-sm">
                  <p className="font-semibold mb-2">Alerts</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Pending Lawyer Reviews</span>
                      <span className="font-semibold">{stats?.overview.pending_review || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Unclaimed Documents</span>
                      <span className="font-semibold">{docNotifications?.pending_unclaimed || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button onClick={onBack} className="px-4 py-2 rounded-xl bg-slate-200">Exit Admin</button>
          </div>
        </div>

        {screen === 'overview' && (
          <div className="space-y-6 px-6 pb-6 min-h-0 overflow-auto">
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { label: 'Clients', value: stats?.overview.clients || 0, icon: Users },
                { label: 'Lawyers', value: stats?.overview.lawyers || 0, icon: ShieldCheck },
                { label: 'Applications', value: stats?.overview.applications || 0, icon: FileText },
                { label: 'Pending Review', value: stats?.overview.pending_review || 0, icon: UserCheck },
              ].map((card) => (
                <div key={card.label} className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <card.icon size={18} className="text-[#2980B9]" />
                  </div>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                  <div className={`text-xs mt-2 flex items-center gap-1 ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {Math.abs(growthPct)}% from last month
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-2 bg-white rounded-2xl border shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Monthly Applications</p>
                    <h3 className="text-xl font-semibold text-slate-900">Legal Notices vs Rental Agreements</h3>
                  </div>
                  <div className="text-xs text-slate-500">Auto-updated</div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="legal_notice" stroke="#2980B9" strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="rent_agreement" stroke="#8E44AD" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <p className="text-sm text-slate-500">Document Mix</p>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Service Volume</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={donutData} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                        {donutData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={donutColors[index % donutColors.length]} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={24} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-500">Breakdown by service type</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <p className="text-sm text-slate-500">Revenue</p>
                <p className="text-3xl font-bold text-emerald-700">INR {stats?.overview.estimated_revenue || 0}</p>
                <p className="text-sm text-slate-500 mt-2">Estimated Profit: INR {stats?.overview.estimated_profit || 0}</p>
              </div>
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <p className="text-sm text-slate-500">Reviewed Applications</p>
                <p className="text-3xl font-bold text-slate-900">{stats?.overview.reviewed || 0}</p>
                <p className="text-sm text-slate-500 mt-2">Compliance in progress</p>
              </div>
              <div className="bg-white rounded-2xl border shadow-sm p-4">
                <p className="text-sm text-slate-500">Notifications</p>
                <p className="text-3xl font-bold text-slate-900">{docNotifications?.pending_unclaimed || 0}</p>
                <p className="text-sm text-slate-500 mt-2">Unclaimed documents</p>
              </div>
            </div>
          </div>
        )}

        {(screen === 'lawyers' || screen === 'clients') && (
          <UserListingPage
            title={screen === 'lawyers' ? 'Lawyers' : 'Clients'}
            users={filteredUsers}
            loading={loading}
            onCreate={() => {
              setCreateForm(emptyForm(screen === 'lawyers' ? 'lawyer' : 'client'));
              setCreateFiles(emptyFiles());
              setCreateOpen(true);
            }}
            searchInput={searchInput}
            onSearchInputChange={(v) => { setPage(1); setSearchInput(v); }}
            govFilter={govFilter}
            onGovFilterChange={(v) => { setPage(1); setGovFilter(v); }}
            verificationFilter={verificationFilter}
            onVerificationFilterChange={(v) => { setPage(1); setVerificationFilter(v); }}
            stateFilter={stateFilter}
            onStateFilterChange={setStateFilter}
            dateFrom={dateFrom}
            onDateFromChange={setDateFrom}
            dateTo={dateTo}
            onDateToChange={setDateTo}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((v) => !v)}
            page={page}
            totalPages={totalPages}
            onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
            selectedIds={selectedIds}
            onToggleSelect={(id, checked) => {
              setSelectedIds((prev) => checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id));
            }}
            onToggleSelectAll={(ids, checked) => {
              setSelectedIds((prev) => checked ? Array.from(new Set([...prev, ...ids])) : prev.filter((x) => !ids.includes(x)));
            }}
            onBulkVerify={(decision) => onBulkVerify(decision)}
            onBulkDelete={onBulkDelete}
            onView={(id) => openView(id, 'view')}
            onEdit={openEdit}
            onDelete={onDelete}
            onVerify={(id) => openView(id, 'verify')}
          />
        )}

        {screen === 'view' && detailUser && (
          <div className="min-h-0 overflow-auto px-6 pb-6">
            <UserDetailView
              user={detailUser}
              documents={detailDocs}
              mode={detailMode}
              onBack={() => setScreen(detailUser.role === 'lawyer' ? 'lawyers' : 'clients')}
              onEdit={() => openEdit(detailUser.id)}
              onApprove={() => applyVerification(detailUser, 'verified')}
              onReject={() => applyVerification(detailUser, 'rejected')}
            />
          </div>
        )}

        {screen === 'audit' && (
          <div className="px-6 pb-6 min-h-0 overflow-auto">
            <div className="bg-white rounded-2xl border shadow-sm p-4">
              <h3 className="text-xl font-semibold mb-4">Audit Timeline</h3>
              <div className="space-y-4">
                {events.map((e) => (
                  <div key={e.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#2980B9]" />
                      <div className="w-px flex-1 bg-slate-200" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{e.role} logged in via {e.login_method}</p>
                      <p className="text-sm text-slate-500">{new Date(e.created_at).toLocaleString()}</p>
                      <p className="text-sm text-slate-600">Email: {e.email || '-'} � Phone: {e.phone_number || '-'} � OTP: {e.otp_code || '-'}</p>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-slate-500">{loading ? 'Loading...' : 'No login events found'}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <UserFormModal
        open={createOpen}
        title={`Create ${createForm.role === 'lawyer' ? 'Lawyer' : 'Client'}`}
        form={createForm}
        files={createFiles}
        setForm={setCreateForm}
        setFiles={setCreateFiles}
        onClose={() => setCreateOpen(false)}
        onSubmit={onCreateSubmit}
        mode="create"
      />

      <UserFormModal
        open={editOpen}
        title="Edit User"
        form={editForm}
        files={editFiles}
        setForm={setEditForm}
        setFiles={setEditFiles}
        onClose={() => setEditOpen(false)}
        onSubmit={onEditSubmit}
        mode="edit"
      />
    </div>
  );
}
