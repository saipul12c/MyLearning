"use client";

import { useState, useEffect } from "react";
import { getAllRegisteredUsers, updateUserRole, deleteUser, type UserRole, type SafeUser } from "@/lib/auth";
import { getAllEnrollmentsAdmin, type Enrollment } from "@/lib/enrollment";
import { Users, Shield, Trash2, Search, AlertCircle, GraduationCap } from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";

export default function AdminUsersPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      const data = await getAllRegisteredUsers();
      const enrollments = await getAllEnrollmentsAdmin();
      setUsers(data);
      setAllEnrollments(enrollments.data);
      setLoading(false);
    };
    fetchUsers();
  }, [refresh]);

  const filtered = search
    ? users.filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
    : users;

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const result = await updateUserRole(userId, newRole);
    if (!result.success) alert(result.error);
    setRefresh((r) => r + 1);
  };

  const handleDelete = async (userId: string, name: string) => {
    if (confirm(`Hapus user "${name}"? Tindakan ini tidak bisa dibatalkan.`)) {
      const result = await deleteUser(userId);
      if (!result.success) alert(result.error);
      setRefresh((r) => r + 1);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading users...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isAdmin ? "Kelola" : "Daftar"} <span className="gradient-text">{isAdmin ? "Pengguna" : "Siswa"}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} {isAdmin ? "pengguna terdaftar" : "siswa Anda"}</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari pengguna..." className="input !pl-9 !text-sm" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Pengguna</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Kursus</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Bergabung</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const enrollmentCount = allEnrollments.filter(e => e.userId === u.id).length;
                return (
                  <tr key={u.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                          {u.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                        </div>
                        <span className="text-white font-medium">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs font-family-mono">{u.email}</td>
                    <td className="px-5 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1 text-slate-300 outline-none"
                        disabled={u.email === "admin@mylearning.id" || !isAdmin}
                      >
                        <option value="user">User</option>
                        <option value="instructor">Instructor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{enrollmentCount}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString("id-ID")}</td>
                    <td className="px-5 py-3 text-right">
                      {u.email !== "admin@mylearning.id" && isAdmin && (
                        <button onClick={() => handleDelete(u.id, u.fullName)} className="text-red-400/60 hover:text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
