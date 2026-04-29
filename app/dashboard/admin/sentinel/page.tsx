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
  Globe
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
  resetErrorCount
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

  // Auto-hide toast
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
      const [data, sync] = await Promise.all([
        getAllSentinelConfigs(),
        syncManifestWithDatabase()
      ]);
      setConfigs(data);
      setSyncData(sync);
    } catch (error: any) {
      showToast("Gagal memuat konfigurasi Sentinel: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(key: string, currentValue: any, forcedValue?: any) {
    if (!user?.id || updating) return;
    
    // Use forced value if provided, otherwise toggle boolean or keep current
    const newValue = forcedValue !== undefined 
      ? forcedValue 
      : (typeof currentValue === 'boolean' ? !currentValue : currentValue);
    
    try {
      setUpdating(key);
      await updateSentinelConfig(key, newValue, user.id);
      
      setConfigs(prev => prev.map(c => 
        c.key === key ? { ...c, value: newValue, updated_at: new Date().toISOString() } : c
      ));
      
      showToast(`${key} berhasil diperbarui`);
    } catch (error: any) {
      showToast("Gagal memperbarui: " + error.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleUpdateRollout(key: string, percentage: number) {
    if (!user?.id || updating) return;

    try {
      setUpdating(key + '_rollout');
      await updateSentinelConfig(key, configs.find(c => c.key === key)?.value, user.id, percentage);
      
      setConfigs(prev => prev.map(c => 
        c.key === key ? { ...c, rollout_percentage: percentage, updated_at: new Date().toISOString() } : c
      ));
      
      showToast(`Rollout ${key} diatur ke ${percentage}%`);
    } catch (error: any) {
      showToast("Gagal memperbarui rollout: " + error.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleToggleRole(key: string, role: string) {
    if (!user?.id || updating) return;

    const config = configs.find(c => c.key === key);
    if (!config) return;

    const currentRoles = config.targeting_roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];

    try {
      setUpdating(key + '_role');
      await updateSentinelConfig(key, config.value, user.id, config.rollout_percentage, newRoles);
      
      setConfigs(prev => prev.map(c => 
        c.key === key ? { ...c, targeting_roles: newRoles, updated_at: new Date().toISOString() } : c
      ));
      
      showToast(`Targeting role untuk ${key} diperbarui`);
    } catch (error: any) {
      showToast("Gagal memperbarui targeting: " + error.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleLock(key: string) {
    if (!user?.id || updating) return;
    try {
      setUpdating(key + '_lock');
      await acquireLock(key, user.id);
      loadConfigs();
      showToast("Konfigurasi berhasil dikunci untuk 5 menit");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleResetErrors(key: string) {
    if (!user?.id || updating) return;
    try {
      setUpdating(key + '_reset');
      await resetErrorCount(key, user.id);
      loadConfigs();
      showToast("Error counter berhasil direset");
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setUpdating(null);
    }
  }

  async function handleSchedule(key: string, pendingValue: any, releaseAt: string) {
    if (!user?.id || updating) return;
    try {
      setUpdating(key + '_schedule');
      await scheduleRelease(key, pendingValue, releaseAt, user.id);
      loadConfigs();
      showToast(`Rilis ${key} dijadwalkan pada ${new Date(releaseAt).toLocaleString()}`);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setUpdating(null);
      setSchedulingKey(null);
    }
  }

  const [schedulingKey, setSchedulingKey] = useState<string | null>(null);
  const [scheduleValue, setScheduleValue] = useState<any>(true);
  const [scheduleDate, setScheduleDate] = useState<string>("");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full animate-pulse"></div>
          <Shield className="w-16 h-16 text-blue-400 animate-pulse relative z-10" />
        </div>
        <p className="text-slate-400 mt-6 font-medium tracking-widest uppercase text-xs">Initializing Sentinel Systems...</p>
      </div>
    );
  }

  const categories = ['system', 'security', 'feature', 'general'];

  return (
    <div className="max-w-7xl mx-auto pb-24 px-6">
      {/* Header Section */}
      <div className="relative mb-12 p-10 rounded-[2.5rem] bg-slate-900/40 border border-white/5 backdrop-blur-sm overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-blue-500/15 transition-colors duration-1000"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              <Shield size={12} className="animate-pulse" />
              <span>Sentinel Gatekeeper v{configs.find(c => c.key === 'system_version')?.value?.toString().replace(/"/g, '') || '1.0.0'}</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight mb-4">Control <span className="text-blue-500">Center</span></h1>
            <p className="text-slate-400 text-lg max-w-xl leading-relaxed font-medium">Platform otoritas tunggal untuk manajemen fitur, keamanan DDoS, dan sinkronisasi status aplikasi secara real-time.</p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-5 px-8 py-5 rounded-3xl bg-white/5 border border-white/5 shadow-xl shadow-black/20">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Activity size={24} />
              </div>
              <div>
                <div className="text-white font-bold text-lg">System Online</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Global Status</div>
              </div>
            </div>
            
            <div className="flex items-center gap-5 px-8 py-5 rounded-3xl bg-white/5 border border-white/5 shadow-xl shadow-black/20">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Globe size={24} />
              </div>
              <div>
                <div className="text-white font-bold text-lg">Broadcast Active</div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Auto Announcement</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detection Engine Status */}
      <div className="mb-12 flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${syncData && (syncData.versionMismatch || syncData.newFeatures.length > 0 || syncData.fingerprintMismatch || syncData.orphanedFeatures.length > 0) ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Detection Engine: {syncData && (syncData.versionMismatch || syncData.newFeatures.length > 0 || syncData.fingerprintMismatch || syncData.orphanedFeatures.length > 0) ? 'Changes Detected' : 'No Changes Found'}
          </span>
        </div>
        <button onClick={loadConfigs} className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase hover:text-blue-300 transition-colors">
          <RefreshCcw size={12} className={loading ? 'animate-spin' : ''} />
          Scan For Changes
        </button>
      </div>

      {/* DDoS Command Center - Streamlined */}
      {configs.find(c => c.key === 'ddos_protection_enabled')?.value === true && (
        <div className="mb-12 p-1 rounded-[2rem] bg-gradient-to-r from-indigo-500/20 via-blue-500/10 to-transparent border border-indigo-500/20 backdrop-blur-xl">
          <div className="bg-slate-950/40 rounded-[1.9rem] p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
                  <Waves size={24} className="animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">DDoS Mitigation Center</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                    <span className="text-indigo-400/70 text-[10px] font-bold uppercase tracking-widest">Monitoring Traffic</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Level</span>
                  <div className="flex gap-1.5">
                    {['low', 'medium', 'high'].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => handleToggle('ddos_protection_level', null, lvl)}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                          configs.find(c => c.key === 'ddos_protection_level')?.value === lvl
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white/5 text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Threshold</span>
                  <span className="text-white font-mono font-bold">{configs.find(c => c.key === 'ddos_rate_limit')?.value || 100} <span className="text-slate-500 font-normal">r/m</span></span>
                </div>

                <button 
                  onClick={() => handleToggle('ddos_protection_enabled', true, false)}
                  className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase hover:bg-red-500 hover:text-white transition-all group"
                >
                  <ZapOff size={14} className="inline mr-2 group-hover:animate-bounce" /> Emergency Stop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Discovery Alert - Modernized */}
      {syncData && (syncData.versionMismatch || syncData.newFeatures.length > 0 || syncData.fingerprintMismatch || syncData.orphanedFeatures.length > 0) && (
        <div className="mb-12 overflow-hidden rounded-[2.5rem] bg-blue-500/5 border border-blue-500/20 backdrop-blur-md">
          <div className="p-8 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[2rem] bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                <RefreshCcw size={32} className="animate-spin-slow" />
              </div>
              <div>
                <h3 className="text-white font-bold text-2xl tracking-tight mb-3">Sync Required</h3>
                <div className="flex flex-wrap gap-2">
                  {syncData.versionMismatch && <span className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-wider border border-purple-500/20">New Version Detected</span>}
                  {syncData.fingerprintMismatch && <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-[9px] font-black uppercase tracking-wider border border-red-500/20">Code Drift Detected</span>}
                  {syncData.newFeatures.length > 0 && <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider border border-emerald-500/20">{syncData.newFeatures.length} New Modules</span>}
                  {syncData.orphanedFeatures.length > 0 && <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-wider border border-orange-500/20">{syncData.orphanedFeatures.length} Legacy Keys</span>}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {syncData.orphanedFeatures.length > 0 && (
                <button 
                  className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-400 font-bold text-sm hover:bg-red-500/10 hover:text-red-400 transition-all"
                  onClick={() => confirm("Cleanup legacy features?") && cleanupOrphanedFeatures(syncData.orphanedFeatures).then(loadConfigs)}
                >
                  Cleanup
                </button>
              )}
              <button 
                className="px-10 py-3.5 rounded-2xl bg-blue-500 text-white font-bold text-sm hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
                onClick={async () => {
                  if (!user?.id) return;
                  setUpdating('sync');
                  try {
                    // 1. Update Version & Fingerprint
                    await updateSentinelConfig('system_version', SYSTEM_MANIFEST.version, user.id);
                    await updateSentinelConfig('code_fingerprint', syncData.codeFingerprint, user.id);
                    
                    // 2. Insert New Features
                    if (syncData.newFeatures.length > 0) {
                      const { supabase } = await import("@/lib/supabase");
                      for (const feature of syncData.newFeatures) {
                        await supabase.from('sentinel_configs').insert({
                          key: feature.key,
                          value: feature.proposedValue,
                          description: feature.description,
                          category: feature.category,
                          is_public: feature.isPublic,
                          metadata: { dev_notes: feature.devNotes },
                          updated_by: user.id
                        });
                      }
                    }
                    
                    loadConfigs();
                    showToast("Sistem berhasil disinkronkan dengan Manifest terbaru");
                  } catch (e: any) {
                    showToast("Gagal sinkronisasi: " + e.message, "error");
                  } finally {
                    setUpdating(null);
                  }
                }}
              >
                {updating === 'sync' ? <RefreshCcw size={18} className="animate-spin" /> : "Synchronize System"}
              </button>
            </div>
          </div>

          {/* New: Detailed Change List */}
          <div className="mx-8 mb-8 p-6 rounded-3xl bg-black/20 border border-white/5">
             <p className="text-[10px] text-slate-500 uppercase font-black mb-4 tracking-widest">Detection Details & Changelog:</p>
             <div className="space-y-3">
                {syncData.newFeatures.map((f: any) => (
                   <div key={f.key} className="flex items-center justify-between text-xs p-2 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-slate-300 font-mono flex items-center gap-2">
                        <Zap size={12} className="text-emerald-400" /> [{f.category}] {f.key}
                      </span>
                      <span className="text-slate-500 italic">Proposed: {JSON.stringify(f.proposedValue)}</span>
                   </div>
                ))}
                {syncData.versionMismatch && (
                   <div className="text-xs text-purple-400 font-mono p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                      <Activity size={12} /> System Upgrade: {syncData.currentDbVersion} → {SYSTEM_MANIFEST.version}
                   </div>
                )}
                {syncData.fingerprintMismatch && (
                   <div className="text-xs text-red-400 font-mono p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                      <Shield size={12} /> Code Structure Modified (Hash Drift Detected)
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Warning Banner if Maintenance Mode is ON */}
      {configs.find(c => c.key === 'maintenance_mode')?.value === true && (
        <div className="mb-10 p-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
            <AlertOctagon size={24} />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-lg leading-tight">MAINTENANCE MODE IS ACTIVE</h3>
            <p className="text-red-400/70 text-sm">Aplikasi saat ini tidak dapat diakses oleh pengguna publik.</p>
          </div>
        </div>
      )}

      {/* Config Sections */}
      <div className="space-y-20">
        {categories.map(category => {
          const categoryConfigs = configs.filter(c => c.category === category);
          if (categoryConfigs.length === 0) return null;

          return (
            <div key={category} className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center gap-4 mb-10 ml-2">
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 group-hover:text-blue-400 transition-colors">
                  {category === 'system' && <Server size={20} />}
                  {category === 'security' && <Lock size={20} />}
                  {category === 'feature' && <Zap size={20} />}
                  {category === 'general' && <Settings size={20} />}
                </div>
                <h2 className="text-2xl font-black text-white capitalize tracking-tight">{category} Protocol</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-6"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
                {categoryConfigs.map(config => (
                  <div 
                    key={config.key} 
                    className="group relative bg-slate-900/30 border border-white/5 hover:border-white/10 rounded-[2.5rem] p-10 transition-all duration-500"
                  >
                    {/* Status Badge - Top Right */}
                    <div className="absolute top-8 right-8">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        config.is_public 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}>
                        {config.is_public ? <Globe size={10} /> : <Shield size={10} />}
                        {config.is_public ? 'Public' : 'Admin'}
                      </div>
                    </div>

                    <div className="flex flex-col h-full">
                      {/* Main Info */}
                      <div className="mb-8">
                        <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                          {config.key.replace(/_/g, ' ')}
                          {syncData?.driftedFeatures?.includes(config.key) && (
                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </h3>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                          {config.description}
                        </p>
                      </div>

                      {/* Stability Monitor - Compact */}
                      {Boolean(config.error_threshold && config.error_threshold > 0) && (
                        <div className="mb-8 bg-black/20 p-4 rounded-2xl border border-white/5">
                          <div className="flex items-center justify-between mb-3">
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={12} /> Stability
                             </span>
                             <button onClick={() => handleResetErrors(config.key)} className="text-[9px] font-bold text-slate-400 hover:text-white transition-colors">Reset</button>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ${
                                    (config.current_errors || 0) >= (config.error_threshold || 0) ? 'bg-red-500' : 'bg-blue-500'
                                  }`}
                                  style={{ width: `${Math.min(100, ((config.current_errors || 0) / (config.error_threshold || 1)) * 100)}%` }}
                                />
                             </div>
                             <span className="text-[10px] font-mono font-bold text-slate-400">{config.current_errors || 0}/{config.error_threshold}</span>
                          </div>
                        </div>
                      )}

                      {/* Dependencies & Canary - Optimized */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        {config.dependencies && config.dependencies.length > 0 && (
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <p className="text-[9px] text-slate-500 uppercase font-black mb-3 tracking-widest">Dependencies</p>
                             <div className="flex flex-wrap gap-1.5">
                                {config.dependencies.map(dep => (
                                   <span key={dep} className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-slate-400 font-mono">{dep}</span>
                                ))}
                             </div>
                          </div>
                        )}

                        {config.category === 'feature' && config.value === true && (
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                             <div className="flex items-center justify-between mb-3">
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Rollout</span>
                                <span className="text-[10px] font-bold text-white">{config.rollout_percentage}%</span>
                             </div>
                             <input 
                                type="range" min="0" max="100" step="10"
                                value={config.rollout_percentage}
                                onChange={(e) => setConfigs(prev => prev.map(c => c.key === config.key ? { ...c, rollout_percentage: parseInt(e.target.value) } : c))}
                                onMouseUp={(e: any) => handleUpdateRollout(config.key, parseInt(e.target.value))}
                                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                             />
                          </div>
                        )}
                      </div>

                      {/* Scheduling & Value Form (New) */}
                      {schedulingKey === config.key ? (
                        <div className="mb-8 p-6 rounded-3xl bg-blue-500/10 border border-blue-500/30 animate-in zoom-in-95 duration-200">
                           <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Schedule Update</span>
                              <button onClick={() => setSchedulingKey(null)} className="text-slate-500 hover:text-white"><RefreshCcw size={12} /></button>
                           </div>
                           <div className="space-y-4">
                              <div>
                                 <label className="text-[8px] text-slate-500 uppercase font-bold block mb-1.5">New Value</label>
                                 <div className="flex gap-2">
                                    <button 
                                      onClick={() => setScheduleValue(true)}
                                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${scheduleValue === true ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-slate-500 border-white/5'}`}
                                    >
                                      True
                                    </button>
                                    <button 
                                      onClick={() => setScheduleValue(false)}
                                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${scheduleValue === false ? 'bg-red-500 text-white border-red-400' : 'bg-white/5 text-slate-500 border-white/5'}`}
                                    >
                                      False
                                    </button>
                                 </div>
                              </div>
                              <div>
                                 <label className="text-[8px] text-slate-500 uppercase font-bold block mb-1.5">Release At</label>
                                 <input 
                                    type="datetime-local" 
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white outline-none focus:border-blue-500"
                                 />
                              </div>
                              <button 
                                onClick={() => handleSchedule(config.key, scheduleValue, scheduleDate)}
                                className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase shadow-lg shadow-blue-500/20"
                              >
                                {updating === config.key + '_schedule' ? 'Scheduling...' : 'Set Schedule'}
                              </button>
                           </div>
                        </div>
                      ) : config.release_at ? (
                        <div className="mb-8 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col gap-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <Activity size={12} className="animate-pulse" /> Scheduled
                              </span>
                              <button 
                                onClick={() => applyReleaseNow(config.key, user?.id!).then(loadConfigs)}
                                className="text-[9px] font-bold text-white bg-amber-500 px-3 py-1 rounded-lg hover:bg-amber-600 transition-colors"
                              >
                                Release Now
                              </button>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-300">New Value: <span className="font-mono text-amber-400">{JSON.stringify(config.pending_value)}</span></span>
                              <span className="text-[9px] text-slate-500 font-medium">{new Date(config.release_at).toLocaleString()}</span>
                           </div>
                        </div>
                      ) : null}

                      {/* Action Row */}
                      <div className="mt-auto pt-8 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           {typeof config.value === 'boolean' ? (
                             <button
                               onClick={() => handleToggle(config.key, config.value)}
                               className={`w-12 h-6 rounded-full p-1 transition-all duration-300 flex items-center ${config.value ? 'bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-slate-800'}`}
                             >
                               <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${config.value ? 'translate-x-6' : 'translate-x-0'}`} />
                             </button>
                           ) : (
                             <div className="text-sm font-mono text-white bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                               {JSON.stringify(config.value)}
                             </div>
                           )}
                           
                           {!schedulingKey && (
                             <button 
                               onClick={() => setSchedulingKey(config.key)}
                               className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-slate-500 hover:text-white transition-all"
                               title="Schedule an update"
                             >
                               <Activity size={14} />
                             </button>
                           )}
                           
                           {config.locked_by && (
                             <div className="flex items-center gap-1.5 text-red-400 animate-pulse">
                               <Lock size={12} />
                               <span className="text-[9px] font-black uppercase">Protected</span>
                             </div>
                           )}
                        </div>

                        <div className="flex items-center gap-2">
                           {!config.locked_by && (
                             <button onClick={() => handleLock(config.key)} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-500 transition-all border border-white/5">
                               <Lock size={14} />
                             </button>
                           )}
                           <div className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter ml-2">
                             {new Date(config.updated_at).toLocaleDateString()}
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Simplified Footer */}
      <div className="mt-32 pt-16 border-t border-white/5 flex flex-col items-center">
        <div className="flex items-center gap-6 mb-8 opacity-20">
          <Shield size={32} className="text-white" />
          <div className="h-10 w-px bg-white" />
          <Globe size={32} className="text-white" />
        </div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.3em] text-center max-w-sm leading-relaxed">
          Sentinel Protocol ensures system integrity and global state synchronization across the MyLearning ecosystem.
        </p>
      </div>

      {/* Custom Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10">
          <div className={`px-6 py-4 rounded-3xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/30 text-red-400 shadow-red-500/20'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertOctagon size={18} />}
            <span className="text-sm font-bold tracking-tight uppercase">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
