"use client";

import { useState, useEffect } from "react";
import { 
  Shield, 
  Activity, 
  Lock, 
  Unlock, 
  Save, 
  RefreshCcw, 
  AlertOctagon, 
  ToggleLeft, 
  ToggleRight,
  Info,
  Server,
  Settings,
  Cpu,
  Waves,
  ZapOff,
  Zap,
  Globe,
  MapPin,
  Clock,
  Megaphone,
  ChevronDown,
  ChevronUp,
  Search,
  Trash2,
  Skull,
  History,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/app/components/AuthContext";
import { 
  getAllSentinelConfigs, 
  updateSentinelConfig, 
  syncManifestWithDatabase, 
  applyReleaseNow, 
  scheduleRelease,
  cleanupOrphanedFeatures,
  acquireLock,
  releaseLock,
  resetErrorCount,
  updateErrorThreshold,
  getBlockedIPs,
  unblockIP,
  getSentinelLogs
} from "@/lib/sentinel/actions";

import { SentinelConfig } from "@/lib/sentinel/types";
import { SYSTEM_MANIFEST } from "@/lib/sentinel/manifest";

export default function SentinelGatekeeperPage() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<SentinelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncData, setSyncData] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<'features' | 'threat'>('features');
  const [blockedIPs, setBlockedIPs] = useState<any[]>([]);
  const [sentinelLogs, setSentinelLogs] = useState<any[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<SentinelConfig | null>(null);
  const [schedulingKey, setSchedulingKey] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState<any>(true);
  const [scheduleDate, setScheduleDate] = useState<string>("");

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    try {
      setLoading(true);
      const [data, sync, blocked, logs] = await Promise.all([
        getAllSentinelConfigs(),
        syncManifestWithDatabase(),
        getBlockedIPs(),
        getSentinelLogs(50)
      ]);
      setConfigs(data);
      setSyncData(sync);
      setBlockedIPs(blocked);
      setSentinelLogs(logs);
    } catch (error: any) {
      showToast("Gagal memuat data Sentinel: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnblock(ip: string) {
    if (!user?.id || updating) return;
    try {
      setUpdating(`unblock_${ip}`);
      await unblockIP(ip, user.id);
      setBlockedIPs(prev => prev.filter(b => b.ip_address !== ip));
      showToast(`IP ${ip} berhasil dibuka blokirnya`);
      const logs = await getSentinelLogs(50);
      setSentinelLogs(logs);
    } catch (error: any) {
      showToast("Gagal membuka blokir IP: " + error.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleToggle(key: string, currentValue: any, forcedValue?: any) {
    if (!user?.id || updating) return;
    
    const criticalKeys = ['maintenance_mode', 'security_lockdown', 'ddos_protection_enabled', 'module_auth_enabled'];
    if (criticalKeys.includes(key)) {
      const actionName = forcedValue === false || (forcedValue === undefined && currentValue === true) ? "MENONAKTIFKAN" : "MENGAKTIFKAN";
      if (!confirm(`PERINGATAN!\n\nAnda akan ${actionName} fitur kritis: ${key.toUpperCase()}. Lanjutkan?`)) return;
    }

    const newValue = forcedValue !== undefined ? forcedValue : (typeof currentValue === 'boolean' ? !currentValue : currentValue);
    
    try {
      setUpdating(key);
      await updateSentinelConfig(key, newValue, user.id);
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, value: newValue, updated_at: new Date().toISOString() } : c));
      showToast(`${key} diperbarui`);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleUpdateRollout(key: string, percentage: number) {
    if (!user?.id || updating) return;
    try {
      setUpdating(key + '_rollout');
      await updateSentinelConfig(key, configs.find(c => c.key === key)?.value, user.id, percentage);
      setConfigs(prev => prev.map(c => c.key === key ? { ...c, rollout_percentage: percentage } : c));
      showToast(`Rollout ${key} diatur ke ${percentage}%`);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleSaveAdvanced(key: string) {
    if (!user?.id || !editingConfig) return;
    try {
      setUpdating(key + '_advanced');
      await updateSentinelConfig(
        key, 
        editingConfig.value, 
        user.id, 
        editingConfig.rollout_percentage, 
        editingConfig.targeting_roles,
        editingConfig.allowed_countries,
        editingConfig.rate_limit_overrides,
        editingConfig.expire_at || undefined,
        editingConfig.broadcast_on_disable,
        editingConfig.broadcast_message
      );
      loadConfigs();
      showToast("Pengaturan lanjutan berhasil disimpan");
      setExpandedKey(null);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Shield className="w-16 h-16 text-blue-400 animate-pulse" />
        <p className="text-slate-400 mt-6 font-medium tracking-widest uppercase text-xs">Initializing Sentinel...</p>
      </div>
    );
  }

  const categories = ['system', 'security', 'feature', 'general'];
  const countries = [
    { code: 'ID', name: 'Indonesia' },
    { code: 'US', name: 'United States' },
    { code: 'SG', name: 'Singapore' },
    { code: 'MY', name: 'Malaysia' }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-24 px-6">
      {/* Header Section */}
      <div className="relative mb-12 p-10 rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-sm overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-500/15 transition-colors duration-1000"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              <Shield size={12} className="animate-pulse" />
              <span>Sentinel Gatekeeper v1.1.0</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4">Control <span className="text-blue-500">Center</span></h1>
            <p className="text-slate-400 text-lg max-w-xl leading-relaxed font-medium">Platform otoritas tunggal untuk manajemen fitur dan keamanan real-time.</p>
            <div className="mt-6 flex items-center gap-4">
              <a 
                href="/docs/sentinel/SECURITY_GUIDE.md" 
                target="_blank" 
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Info size={14} /> Security Guide
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 p-1.5 rounded-2xl bg-white/5 border border-white/10">
            <button onClick={() => setSelectedTab('features')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === 'features' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:text-white'}`}>System Controls</button>
            <button onClick={() => setSelectedTab('threat')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === 'threat' ? 'bg-red-500 text-white' : 'text-slate-500 hover:text-white'}`}>Threat Intel</button>
          </div>
        </div>
      </div>

      {selectedTab === 'features' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section Introduction */}
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest">Sistem Navigasi Kontrol</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
              Gunakan panel ini untuk mengelola fungsionalitas inti MyLearning. Setiap perubahan di sini akan berdampak langsung pada pengalaman pengguna di seluruh platform. Pastikan Anda memahami level **Impact** sebelum melakukan perubahan.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Cari fitur (contoh: 'maintenance', 'payment', 'ddos')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-white text-lg outline-none focus:border-blue-500/50 focus:bg-white/[0.07] transition-all placeholder:text-slate-600"
            />
          </div>

          {/* Sync Alert */}
          {syncData && (syncData.versionMismatch || syncData.newFeatures.length > 0) && (
            <div className="p-8 rounded-[2rem] bg-blue-500/5 border border-blue-500/20 flex flex-col lg:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-6">
                 <RefreshCcw size={32} className="text-blue-400 animate-spin-slow" />
                 <div>
                   <h3 className="text-white font-bold text-2xl tracking-tight mb-2">Sinkronisasi Diperlukan</h3>
                   <p className="text-slate-400 text-sm">Versi sistem atau manifest fitur tidak cocok dengan database. Sinkronisasi sekarang untuk menerapkan perubahan kode terbaru ke antarmuka ini.</p>
                 </div>
               </div>
               <button onClick={loadConfigs} className="px-10 py-4 rounded-2xl bg-blue-500 text-white text-[11px] font-black uppercase shadow-xl shadow-blue-500/20 hover:scale-105 transition-all">Synchronize Now</button>
            </div>
          )}

          {/* Feature Sections */}
          <div className="space-y-24">
            {categories.map(category => {
              const categoryConfigs = configs
                .filter(c => c.category === category)
                .filter(c => c.key.toLowerCase().includes(searchTerm.toLowerCase()) || (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()));
              
              if (categoryConfigs.length === 0) return null;

              return (
                <div key={category} className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                  <div className="flex items-center gap-4 mb-10 ml-2">
                    <div className="flex flex-col">
                      <h2 className="text-2xl font-black text-white capitalize tracking-tight">{category} Protocol</h2>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                        {category === 'system' ? 'Konfigurasi Inti Platform' : category === 'security' ? 'Proteksi & Akses Data' : 'Fitur & Pengalaman Pengguna'}
                      </p>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-6"></div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {categoryConfigs.map(config => (
                      <div key={config.key} className="group relative bg-slate-900/30 border border-white/5 hover:border-white/10 rounded-[2.5rem] p-10 transition-all duration-500">
                        <div className="absolute top-8 right-8 flex items-center gap-3">
                          {/* Impact Badge */}
                          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-wider border ${
                            config.impact === 'critical' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            config.impact === 'high' ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' :
                            config.impact === 'medium' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                            'bg-slate-500/10 border-slate-500/20 text-slate-400'
                          }`}>
                            {config.impact || 'low'} Impact
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${config.is_public ? 'bg-emerald-500/10 text-emerald-400' : 'bg-purple-500/10 text-purple-400'}`}>
                            {config.is_public ? 'Public' : 'Admin'}
                          </div>
                        </div>

                        <div className="flex flex-col h-full">
                          <div className="mb-8">
                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{config.key.replace(/_/g, ' ')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">{config.description}</p>
                          </div>

                          <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {typeof config.value === 'boolean' ? (
                                <button
                                  onClick={() => handleToggle(config.key, config.value)}
                                  className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${config.value ? 'bg-blue-600' : 'bg-slate-800'}`}
                                >
                                  <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 ${config.value ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                              ) : (
                                <div className="text-sm font-mono text-white bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">{JSON.stringify(config.value)}</div>
                              )}
                              <button onClick={() => { setExpandedKey(expandedKey === config.key ? null : config.key); setEditingConfig(config); }} className={`p-2.5 rounded-xl transition-all border ${expandedKey === config.key ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-500'}`}>
                                <Settings size={14} />
                              </button>
                            </div>
                          </div>

                          {expandedKey === config.key && editingConfig && (
                            <div className="mt-8 pt-8 border-t border-white/10 animate-in slide-in-from-top-4">
                               <div className="space-y-6">
                                  {config.category === 'feature' && (
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                      <div className="flex items-center justify-between mb-3 text-[10px] font-black uppercase tracking-widest text-blue-500">
                                        <span>Rollout Percentage</span>
                                        <span className="text-white">{config.rollout_percentage}%</span>
                                      </div>
                                      <input type="range" min="0" max="100" step="10" value={config.rollout_percentage} onChange={(e) => handleUpdateRollout(config.key, parseInt(e.target.value))} className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                                    </div>
                                  )}
                                  
                                  {config.key === 'ip_whitelist' && (
                                    <div className="space-y-4">
                                       <textarea 
                                         value={JSON.stringify(editingConfig.value, null, 2)}
                                         onChange={(e) => {
                                           try { setEditingConfig({ ...editingConfig, value: JSON.parse(e.target.value) }); } catch(e){}
                                         }}
                                         className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-mono text-white min-h-[100px]"
                                       />
                                    </div>
                                  )}

                                  <button onClick={() => handleSaveAdvanced(config.key)} className="w-full py-4 rounded-2xl bg-blue-500 text-white text-[11px] font-black uppercase shadow-xl shadow-blue-500/20">Simpan Perubahan</button>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedTab === 'threat' && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Section Introduction */}
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-sm font-black text-red-500 uppercase tracking-widest">Intelijen & Pertahanan</h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
              Monitor ancaman secara real-time. Bagian ini mendata aktivitas mencurigakan, serangan brute-force, dan anomali trafik yang telah diredam oleh sistem Sentinel untuk menjaga stabilitas MyLearning.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-1">
              <div className="sticky top-12 p-8 rounded-[2rem] bg-slate-900/40 border border-red-500/20 backdrop-blur-xl">
                <Skull size={32} className="text-red-500 mb-6" />
                <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Blocked IPs</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                  Daftar alamat IP yang telah dilarang masuk karena melanggar protokol keamanan, mencoba melakukan serangan injeksi, atau gagal login berkali-kali.
                </p>
                <div className="pt-8 border-t border-white/5 text-center">
                  <div className="text-5xl font-black text-white">{blockedIPs.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-2">Active Bans</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {blockedIPs.length === 0 ? (
                <div className="p-20 rounded-[2.5rem] bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center">
                  <Shield size={48} className="text-emerald-500/20 mb-6" />
                  <p className="text-slate-500 text-center font-medium">Sistem bersih dari ancaman.<br/><span className="text-[10px] uppercase font-black tracking-widest text-slate-600 mt-2 block">All clear</span></p>
                </div>
              ) : (
                blockedIPs.map(threat => (
                  <div key={threat.ip_address} className="p-6 rounded-[1.5rem] bg-slate-900/40 border border-white/10 flex items-center justify-between group hover:border-red-500/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                        <AlertCircle size={20} />
                      </div>
                      <div>
                        <div className="text-lg font-mono font-bold text-white">{threat.ip_address}</div>
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] text-red-500 uppercase font-black mt-1">{threat.reason || 'Security Violation'}</div>
                          <span className="text-[10px] text-slate-600 font-medium italic">Sejak {new Date(threat.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleUnblock(threat.ip_address)} className="px-6 py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20 opacity-0 group-hover:opacity-100 transition-all hover:scale-105 active:scale-95">Unblock Access</button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="p-10 rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                <History size={24} className="text-blue-500" /> Security Audit Logs
              </h3>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Real-time Event Stream</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    <th className="pb-4">Timestamp</th>
                    <th className="pb-4">Event</th>
                    <th className="pb-4">IP Address</th>
                    <th className="pb-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sentinelLogs.map((log, idx) => (
                    <tr key={idx}>
                      <td className="py-4 text-[10px] text-slate-400 font-mono">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.event_type.includes('block') ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>{log.event_type.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="py-4 text-xs font-mono text-slate-300">{log.ip_address || '---'}</td>
                      <td className="py-4 text-[10px] text-slate-500 font-medium">{typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-32 pt-16 border-t border-white/5 flex flex-col items-center opacity-30">
        <Shield size={32} className="text-white mb-6" />
        <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.5em] text-center max-w-sm">Sentinel Protocol // Secure Command Center</p>
      </div>

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10">
          <div className={`px-8 py-5 rounded-[2rem] border backdrop-blur-xl shadow-2xl flex items-center gap-4 ${toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            <Info size={20} />
            <span className="text-sm font-black uppercase tracking-tight">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
