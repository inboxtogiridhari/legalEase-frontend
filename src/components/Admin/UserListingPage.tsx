import { useMemo, useState } from 'react';
import { Profile } from '../../types';
import { CheckCircle2, Filter, MoreHorizontal, Search, Trash2, UserCheck, UserCog } from 'lucide-react';

interface Props {
  title: string;
  users: Profile[];
  loading: boolean;
  onCreate: () => void;
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  govFilter: '' | 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  onGovFilterChange: (v: '' | 'unsubmitted' | 'pending' | 'verified' | 'rejected') => void;
  verificationFilter: '' | 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  onVerificationFilterChange: (v: '' | 'unsubmitted' | 'pending' | 'verified' | 'rejected') => void;
  stateFilter: string;
  onStateFilterChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  page: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  selectedIds: string[];
  onToggleSelect: (id: string, checked: boolean) => void;
  onToggleSelectAll: (ids: string[], checked: boolean) => void;
  onBulkVerify: (decision: 'verified' | 'rejected') => void;
  onBulkDelete: () => void;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onVerify: (id: string) => void;
}

const badgeStyles: Record<string, string> = {
  verified: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  rejected: 'bg-rose-100 text-rose-700',
  unsubmitted: 'bg-slate-100 text-slate-600',
};

export default function UserListingPage({
  title,
  users,
  loading,
  onCreate,
  searchInput,
  onSearchInputChange,
  govFilter,
  onGovFilterChange,
  verificationFilter,
  onVerificationFilterChange,
  stateFilter,
  onStateFilterChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  filtersOpen,
  onToggleFilters,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onBulkVerify,
  onBulkDelete,
  onView,
  onEdit,
  onDelete,
  onVerify,
}: Props) {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const allIds = useMemo(() => users.map((u) => u.id), [users]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));

  return (
    <div className="space-y-4 h-full flex flex-col overflow-hidden min-w-0 px-6 pb-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Smart Management</p>
          <h2 className="text-3xl font-bold text-slate-900">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleFilters} className="px-4 py-2 rounded-xl border border-slate-200 bg-white flex items-center gap-2">
            <Filter size={16} /> Filters
          </button>
          <button onClick={onCreate} className="px-4 py-2 bg-[#2980B9] text-white rounded-xl">Create</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Smart search by name, phone, email, state"
              className="w-full pl-9 pr-3 py-2 border rounded-xl"
            />
          </div>
          <div className="text-sm text-slate-500">Page {page} / {totalPages || 1}</div>
          <button onClick={onPrevPage} disabled={page <= 1} className="px-3 py-2 rounded-xl border disabled:opacity-50">Prev</button>
          <button onClick={onNextPage} disabled={page >= totalPages} className="px-3 py-2 rounded-xl border disabled:opacity-50">Next</button>
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">Selected: {selectedIds.length}</span>
            <button onClick={() => onBulkVerify('verified')} className="px-3 py-1 rounded-lg bg-emerald-600 text-white flex items-center gap-1">
              <CheckCircle2 size={14} /> Verify
            </button>
            <button onClick={() => onBulkVerify('rejected')} className="px-3 py-1 rounded-lg bg-amber-600 text-white flex items-center gap-1">
              <UserCheck size={14} /> Reject
            </button>
            <button onClick={onBulkDelete} className="px-3 py-1 rounded-lg bg-rose-600 text-white flex items-center gap-1">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      {filtersOpen && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 grid md:grid-cols-4 gap-3">
          <select value={govFilter} onChange={(e) => onGovFilterChange(e.target.value as Props['govFilter'])} className="px-3 py-2 border rounded-lg">
            <option value="">All Govt ID Status</option>
            <option value="unsubmitted">Unsubmitted</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={verificationFilter} onChange={(e) => onVerificationFilterChange(e.target.value as Props['verificationFilter'])} className="px-3 py-2 border rounded-lg">
            <option value="">All Lawyer Status</option>
            <option value="unsubmitted">Unsubmitted</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <input value={stateFilter} onChange={(e) => onStateFilterChange(e.target.value)} placeholder="State (license/address)" className="px-3 py-2 border rounded-lg" />
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="px-2 py-2 border rounded-lg w-full" />
            <span className="text-xs text-slate-400">to</span>
            <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="px-2 py-2 border rounded-lg w-full" />
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-auto flex-1 min-h-0 min-w-0">
        <table className="w-full text-sm min-w-[1600px]">
          <thead className="bg-slate-50 text-left sticky top-0 z-10">
            <tr>
              <th className="p-3 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(allIds, e.target.checked)}
                />
              </th>
              <th className="p-3">Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Address</th>
              <th className="p-3">Gov Status</th>
              <th className="p-3">Lawyer Status</th>
              <th className="p-3">State</th>
              <th className="p-3">Firm</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t align-top hover:bg-slate-50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(u.id)}
                    onChange={(e) => onToggleSelect(u.id, e.target.checked)}
                  />
                </td>
                <td className="p-3 font-medium text-slate-900">{u.full_name}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3">{u.email || '-'}</td>
                <td className="p-3">{u.phone_number || '-'}</td>
                <td className="p-3 max-w-[220px] truncate" title={u.address || ''}>{u.address || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${badgeStyles[u.government_id_status || 'unsubmitted'] || badgeStyles.unsubmitted}`}>
                    {u.government_id_status || 'unsubmitted'}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${badgeStyles[u.verification_status || 'unsubmitted'] || badgeStyles.unsubmitted}`}>
                    {u.verification_status || 'unsubmitted'}
                  </span>
                </td>
                <td className="p-3">{u.license_state || '-'}</td>
                <td className="p-3">{u.firm_name || '-'}</td>
                <td className="p-3 relative">
                  <button onClick={() => setMenuOpenId(menuOpenId === u.id ? null : u.id)} className="px-2 py-1 rounded-lg border bg-white flex items-center gap-1">
                    <MoreHorizontal size={16} />
                  </button>
                  {menuOpenId === u.id && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border rounded-xl shadow-lg z-20">
                      <button onClick={() => onView(u.id)} className="w-full text-left px-3 py-2 hover:bg-slate-50">View</button>
                      <button onClick={() => onEdit(u.id)} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"><UserCog size={14} /> Edit</button>
                      <button onClick={() => onVerify(u.id)} className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2"><UserCheck size={14} /> Verify</button>
                      <button onClick={() => onDelete(u.id)} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-rose-600 flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td className="p-4 text-slate-500" colSpan={11}>{loading ? 'Loading...' : 'No records found'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
