"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { 
  getUsersPaginatedAdmin, 
  updateUserRole, 
  deleteUser, 
  toggleUserBan,
  BAN_REASONS,
  type UserRole, 
  type SafeUser 
} from "@/lib/auth";
import { getAllEnrollmentsAdmin, type Enrollment } from "@/lib/enrollment";
import { 
  Users, Shield, Trash2, Search, AlertCircle, 
  Ban, ShieldCheck, UserCheck, MoreVertical, 
  History, Calendar, Mail, Phone, Info,
  Filter, X, ChevronDown, CheckCircle2, User,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import Skeleton from "@/app/components/ui/Skeleton";

export default function AdminUsersPage() {
  const { user, isAdmin, isInstructor } = useAuth();
  const [instructorId, setInstructorId] = useState<string | null>(null);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search state with debouncing
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter & Pagination state
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [refresh, setRefresh] = useState(0);
  
  // Get instructor profile if needed
  useEffect(() => {
    if (isInstructor && !isAdmin && user) {
      const fetchInstructor = async () => {
        const { getInstructorProfile } = await import("@/lib/instructor");
        const profile = await getInstructorProfile(user.id);
        if (profile) setInstructorId(profile.id);
      };
      fetchInstructor();
    }
  }, [isInstructor, isAdmin, user]);

  // Modal States
  const [selectedUser, setSelectedUser] = useState<SafeUser | null>(null);
  const [banModalUser, setBanModalUser] = useState<SafeUser | null>(null);
  const [banReason, setBanReason] = useState(BAN_REASONS[0]);

  // Debouncing search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch Users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const { data, totalCount } = await getUsersPaginatedAdmin({
          page,
          pageSize,
          search: searchQuery,
          role: roleFilter,
          status: statusFilter,
          instructorId: instructorId || undefined
        });
        
        setUsers(data);
        setTotalCount(totalCount);
      } catch (err: any) {
        console.error("Fetch users error:", err);
        setError("Gagal memuat daftar pengguna.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, searchQuery, roleFilter, statusFilter, refresh]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const result = await updateUserRole(userId, newRole);
    if (!result.success) alert(result.error);
    else setRefresh((r) => r + 1);
  };

  const handleDelete = async (userId: string, name: string) => {
    if (confirm(`Hapus user "${name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      const result = await deleteUser(userId);
      if (!result.success) alert(result.error);
      else setRefresh((r) => r + 1);
    }
  };

  const handleBan = async () => {
    if (!banModalUser) return;
    const result = await toggleUserBan(banModalUser.id, true, banReason);
    if (!result.success) alert(result.error);
    else {
      setRefresh((r) => r + 1);
      setBanModalUser(null);
    }
  };

  const handleUnban = async (userId: string) => {
    if (confirm("Cabut ban untuk pengguna ini?")) {
      const result = await toggleUserBan(userId, false);
      if (!result.success) alert(result.error);
      else setRefresh((r) => r + 1);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (error) {
    return (
      <div className="card p-8 text-center bg-red-500/5 border-red-500/20">
        <AlertCircle className="mx-auto text-red-400 mb-3" size={32} />
        <h3 className="text-white font-bold mb-2">Terjadi Kesalahan</h3>
        <p className="text-slate-400 text-sm mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary !py-2 px-6 text-sm mx-auto">
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Users className="text-purple-400" /> Kelola <span className="gradient-text">Pengguna</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2">
            Pantau profil, ubah peran, dan kelola akses keamanan komunitas MyLearning (Skalabilitas Jutaan Data).
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 shadow-inner">
          <div className="px-4 py-2">
            <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Database</div>
            <div className="text-xl font-bold text-white">{totalCount.toLocaleString()}</div>
          </div>
          <div className="w-px h-8 bg-white/10 mx-1"></div>
          <div className="px-4 py-2 text-right">
            <div className="text-[10px] text-purple-500 uppercase font-bold tracking-widest">Ditemukan</div>
            <div className="text-xl font-bold text-white">{totalCount >= 1000000 ? (totalCount / 1000000).toFixed(1) + 'M+' : totalCount.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-[#0f0f1a] p-4 rounded-3xl border border-white/5 shadow-xl">
        <div className="relative col-span-1 lg:col-span-2">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            value={searchInput} 
            onChange={(e) => setSearchInput(e.target.value)} 
            placeholder="Cari nama atau email..." 
            className="input !pl-11 !h-12 !rounded-2xl !bg-[#151525]" 
          />
          {loading && searchInput !== searchQuery && (
             <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
             </div>
          )}
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <select 
            value={roleFilter} 
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }} 
            className="input !pl-11 !h-12 !rounded-2xl !bg-[#151525] appearance-none cursor-pointer"
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="user">User</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
        </div>
        <div className="relative">
          <Info size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <select 
            value={statusFilter} 
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }} 
            className="input !pl-11 !h-12 !rounded-2xl !bg-[#151525] appearance-none cursor-pointer"
          >
            <option value="all">Keduanya</option>
            <option value="active">Aktif</option>
            <option value="banned">Banned</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
        </div>
      </div>

      {/* Users Table */}
      <div className="card !p-0 overflow-hidden border-white/5 shadow-2xl relative">
        {loading && users.length > 0 && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10 flex items-center justify-center">
             <div className="bg-[#0f0f1a] p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
                <span className="text-white text-sm font-medium">Memuat Data...</span>
             </div>
          </div>
        )}
        
        {loading && users.length === 0 && (
          <div className="p-6 space-y-4">
             {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                   <Skeleton className="w-10 h-10 rounded-2xl" />
                   <div className="flex-1 space-y-2">
                      <Skeleton className="w-1/3 h-4" />
                      <Skeleton className="w-1/4 h-3" />
                   </div>
                   <Skeleton className="w-20 h-4 rounded-full" />
                   <Skeleton className="w-24 h-8 rounded-xl" />
                </div>
             ))}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Pengguna</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Peran</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Kursus</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {users.length > 0 ? users.map((u) => {
                const enrollmentCount = u.enrollmentCount || 0;
                return (
                  <tr key={u.id} className={`hover:bg-white/[0.02] transition-colors ${u.isBanned ? "bg-red-500/[0.02]" : ""}`}>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedUser(u)} className="flex items-center gap-4 text-left group">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br transition-all ${u.role === 'admin' ? 'from-purple-500 to-indigo-600' : 'from-slate-700 to-slate-800'} flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-black/20 group-hover:scale-105`}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt="" className="w-full h-full rounded-2xl object-cover" />
                          ) : (
                            u.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-semibold group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                            {u.fullName}
                            {u.isBanned && <Ban size={12} className="text-red-500" />}
                          </span>
                          <span className="text-slate-500 text-[10px] font-mono">{u.email}</span>
                        </div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {u.isBanned ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/10 text-[10px] font-bold uppercase tracking-wider">
                          <Ban size={10} /> Banned
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-[10px] font-bold uppercase tracking-wider">
                          <UserCheck size={10} /> Aktif
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className={`bg-white/5 border border-white/10 rounded-xl text-xs px-3 py-1.5 outline-none transition-all focus:ring-2 focus:ring-purple-500/40 ${
                            u.role === 'admin' ? 'text-purple-400 border-purple-500/30' : 
                            u.role === 'instructor' ? 'text-cyan-400 border-cyan-500/30' : 'text-slate-400'
                          }`}
                          disabled={u.email === "admin@mylearning.id"}
                        >
                          <option value="user">User</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest ${
                          u.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                          u.role === 'instructor' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 
                          'bg-white/5 text-slate-500 border-white/10'
                        }`}>
                          {u.role}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-white font-medium">
                         <History size={14} className="text-slate-600" /> {enrollmentCount}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.email !== "admin@mylearning.id" && isAdmin && (
                          <>
                            {u.isBanned ? (
                              <button 
                                onClick={() => handleUnban(u.id)}
                                title="Cabut Ban"
                                className="p-2 hover:bg-emerald-500/10 text-emerald-500/60 hover:text-emerald-500 rounded-lg transition-all"
                              >
                                <ShieldCheck size={18} />
                              </button>
                            ) : (
                              <button 
                                onClick={() => setBanModalUser(u)}
                                title="Ban Akun"
                                className="p-2 hover:bg-red-500/10 text-red-500/60 hover:text-red-500 rounded-lg transition-all"
                              >
                                <Ban size={18} />
                              </button>
                            )}
                            <button 
                              onClick={() => handleDelete(u.id, u.fullName)} 
                              title="Hapus Permanen"
                              className="p-2 hover:bg-red-500/10 text-red-400/60 hover:text-red-400 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => setSelectedUser(u)}
                          title="Lihat Detail"
                          className="p-2 hover:bg-white/5 text-slate-500 hover:text-white rounded-lg transition-all"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500 flex flex-col items-center">
                    <Search size={40} className="text-slate-800 mb-4" />
                    <p>Tidak ada pengguna yang ditemukan dengan kriteria tersebut.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Improved Pagination Controls */}
        <div className="px-6 py-5 bg-white/[0.02] border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
           <p className="text-xs text-slate-500">
             Menampilkan <span className="text-white font-bold">{users.length}</span> dari <span className="text-white font-bold">{totalCount.toLocaleString()}</span> pengguna
           </p>
           
           <div className="flex items-center gap-1.5">
             <button 
               onClick={() => setPage(p => Math.max(1, p - 1))}
               disabled={page === 1 || loading}
               className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
             >
               <ChevronLeft size={18} />
             </button>
             
             <div className="flex items-center gap-1 px-4 text-sm">
                <span className="text-purple-400 font-bold">{page}</span>
                <span className="text-slate-600">/</span>
                <span className="text-slate-400">{totalPages || 1}</span>
             </div>

             <button 
               onClick={() => setPage(p => Math.min(totalPages, p + 1))}
               disabled={page === totalPages || totalPages === 0 || loading}
               className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
             >
               <ChevronRight size={18} />
             </button>
           </div>
        </div>
      </div>

      {/* Ban Modal */}
      {banModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="card max-w-md w-full !p-8 border-red-500/30 overflow-hidden relative shadow-[0_0_50px_rgba(239,68,68,0.15)]">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <Ban size={120} className="text-red-500" />
            </div>
            
            <h2 className="text-xl font-extrabold text-white mb-2 underline decoration-red-500 decoration-4">Ban Pengguna</h2>
            <p className="text-slate-400 text-sm mb-6">
              Anda akan mem-ban <span className="text-white font-bold">{banModalUser.fullName}</span>. Pengguna ini tidak akan bisa login ke MyLearning.
            </p>

            <div className="space-y-4 relative z-10">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Alasan Ban</label>
              <div className="relative">
                <select 
                  value={banReason} 
                  onChange={(e) => setBanReason(e.target.value)} 
                  className="input !h-12 !pr-10 appearance-none bg-[#151525] focus:border-red-500/50 cursor-pointer"
                >
                  {BAN_REASONS.map((reason) => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>

              <div className="flex gap-3 pt-4">
                <button onClick={() => setBanModalUser(null)} className="flex-1 px-4 py-3 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/5">
                  Batal
                </button>
                <button onClick={handleBan} className="flex-1 px-4 py-3 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500 transition-all shadow-lg shadow-red-900/30">
                  Ya, Ban Akun
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
            <div className="card !p-0 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
               {/* Hero Header */}
               <div className="h-32 bg-gradient-to-r from-purple-600/20 to-cyan-600/20 relative">
                 <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all">
                    <X size={20} />
                 </button>
               </div>
               
               <div className="px-8 pb-10 -mt-12 relative">
                 <div className="flex flex-col md:flex-row items-end gap-6 mb-8">
                   <div className="w-24 h-24 rounded-3xl bg-slate-900 border-4 border-[#0f0f1a] overflow-hidden shadow-2xl">
                     {selectedUser.avatarUrl ? (
                        <img src={selectedUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-white/5 text-slate-500">
                          {selectedUser.fullName[0].toUpperCase()}
                        </div>
                      )}
                   </div>
                   <div className="flex-1 pb-2">
                     <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                       {selectedUser.fullName}
                       {selectedUser.isBanned && <Ban size={20} className="text-red-500" />}
                     </h2>
                     <p className="text-slate-400 flex items-center gap-2 text-sm">
                       <Mail size={14} className="text-slate-600" /> {selectedUser.email}
                     </p>
                   </div>
                   <div className="hidden md:block">
                     <div className={`px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest ${selectedUser.isBanned ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {selectedUser.isBanned ? 'Terblokir' : 'Aktif'}
                     </div>
                   </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Tentang Pengguna</h3>
                        <p className="text-slate-300 text-sm leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 italic">
                          "{selectedUser.bio || 'Tidak ada biografi yang dibagikan.'}"
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                           <div className="text-[10px] text-slate-500 uppercase mb-1">Role</div>
                           <div className="text-sm font-bold text-white capitalize">{selectedUser.role}</div>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                           <div className="text-[10px] text-slate-500 uppercase mb-1">Telepon</div>
                           <div className="text-sm font-bold text-white">{selectedUser.phone || '-'}</div>
                        </div>
                      </div>
                   </div>

                   <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Sistem</h3>
                        <div className="space-y-3">
                           <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                              <span className="text-slate-500 flex items-center gap-2"><Calendar size={14} /> Terdaftar</span>
                              <span className="text-white font-medium">{new Date(selectedUser.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                           </div>
                           <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                              <span className="text-slate-500 flex items-center gap-2"><CheckCircle2 size={14} /> Terakhir Aktif</span>
                              <span className="text-white font-medium">{selectedUser.lastSeenAt ? new Date(selectedUser.lastSeenAt).toLocaleString("id-ID") : 'Mungkin tidak pernah'}</span>
                           </div>
                           <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                              <span className="text-slate-500 flex items-center gap-2"><Users size={14} /> Status Online</span>
                              <span className={selectedUser.isOnline ? "text-emerald-400 font-bold" : "text-slate-600"}>
                                {selectedUser.isOnline ? "Sedang Online" : "Offline"}
                              </span>
                           </div>
                           {selectedUser.isBanned && (
                             <div className="mt-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                               <div className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1">Alasan Ban</div>
                               <div className="text-xs text-red-400 italic">"{selectedUser.banReason}"</div>
                             </div>
                           )}
                        </div>
                      </div>
                   </div>
                 </div>
                 
                 <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-4">
                    <button 
                      onClick={() => {
                        window.open(`mailto:${selectedUser.email}`);
                      }}
                      className="btn-primary !px-6 !py-3 flex items-center gap-2"
                    >
                      <Mail size={18} /> Hubungi Lewat Email
                    </button>
                    <button 
                       onClick={() => setSelectedUser(null)}
                       className="px-6 py-3 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-all border border-white/10"
                    >
                      Tutup
                    </button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
