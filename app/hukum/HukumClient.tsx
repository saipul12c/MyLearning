"use client";

import { 
  Scale, 
  ShieldCheck, 
  Globe, 
  Lock, 
  FileText, 
  CheckCircle, 
  ExternalLink,
  ArrowLeft,
  Zap,
  UserCheck,
  Server,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const laws = [
  {
    id: "uupdp",
    title: "UU PDP No. 27/2022",
    region: "Indonesia",
    fullTitle: "Undang-Undang Perlindungan Data Pribadi",
    description: "Regulasi komprehensif pertama di Indonesia yang mengatur hak subjek data dan kewajiban pengendali data.",
    keyPoints: [
      "Persyaratan persetujuan yang jelas",
      "Hak untuk penghapusan data",
      "Kewajiban penunjukan DPO",
      "Notifikasi kebocoran data"
    ],
    color: "from-emerald-500/20 to-emerald-600/5",
    iconColor: "text-emerald-400"
  },
  {
    id: "gdpr",
    title: "GDPR",
    region: "Uni Eropa",
    fullTitle: "General Data Protection Regulation",
    description: "Standar privasi paling ketat di dunia yang memberikan kontrol penuh kepada individu atas data mereka.",
    keyPoints: [
      "Privacy by Design & Default",
      "Right to Portability",
      "Right to be Forgotten",
      "Strict data processing logs"
    ],
    color: "from-blue-500/20 to-blue-600/5",
    iconColor: "text-blue-400"
  },
  {
    id: "ccpa",
    title: "CCPA / CPRA",
    region: "USA (California)",
    fullTitle: "California Consumer Privacy Act",
    description: "Undang-undang yang memperkuat hak privasi dan perlindungan konsumen bagi penduduk California.",
    keyPoints: [
      "Right to Opt-out of sale",
      "Right to limit sensitive info",
      "Transparency on data value",
      "Anti-discrimination protection"
    ],
    color: "from-indigo-500/20 to-indigo-600/5",
    iconColor: "text-indigo-400"
  },
  {
    id: "uuite",
    title: "UU ITE No. 1/2024",
    region: "Indonesia",
    fullTitle: "UU Informasi dan Transaksi Elektronik",
    description: "Mengatur tata kelola sistem elektronik yang aman, handal, dan bertanggung jawab.",
    keyPoints: [
      "Validitas tanda tangan digital",
      "Integritas sistem elektronik",
      "Perlindungan transaksi online",
      "Pencegahan akses ilegal"
    ],
    color: "from-amber-500/20 to-amber-600/5",
    iconColor: "text-amber-400"
  },
  {
    id: "cbpr",
    title: "APEC CBPR",
    region: "Asia-Pasifik",
    fullTitle: "Cross-Border Privacy Rules",
    description: "Sistem sertifikasi multilateral untuk memfasilitasi aliran data antar negara anggota APEC secara aman.",
    keyPoints: [
      "Accountability in transfers",
      "Interoperable privacy standards",
      "Consumer trust across borders",
      "Dispute resolution framework"
    ],
    color: "from-cyan-500/20 to-cyan-600/5",
    iconColor: "text-cyan-400"
  }
];

export default function HukumClient() {
  return (
    <div className="min-h-screen bg-[#050508] text-slate-200 selection:bg-yellow-500/30 overflow-hidden pb-20">
      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-yellow-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[100px] rounded-full" />
      </div>

      <header className="relative z-50 max-w-7xl mx-auto px-8 py-10 flex items-center justify-between">
        <Link href="/privasi" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">Kembali ke Privasi</span>
        </Link>
        <div className="flex items-center gap-3">
           <Scale className="text-yellow-500 w-5 h-5" />
           <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Legal Registry v1.1</span>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8">
        {/* Hero */}
        <section className="pt-10 pb-20 border-b border-white/5 mb-20">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="max-w-4xl"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-6">
              <ShieldCheck size={12} />
              Global Legal Compliance
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none">
              Menjamin Keadilan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">Dalam Data.</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-3xl">
              Di MyLearning, kepatuhan hukum bukan sekadar centang kotak administrasi. Kami secara aktif menyelaraskan infrastruktur kami dengan regulasi privasi tercanggih di dunia untuk melindungi setiap bit informasi Anda.
            </motion.p>
          </motion.div>
        </section>

        {/* Legal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {laws.map((law, i) => (
            <motion.div 
              key={law.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-8 rounded-[2.5rem] bg-slate-900/40 border border-white/5 hover:border-yellow-500/30 transition-all duration-500"
            >
              <div className="flex items-center justify-between mb-8">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${law.color} border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Scale className={`${law.iconColor} w-6 h-6`} />
                </div>
                <div className="text-[10px] font-black text-yellow-500/60 uppercase tracking-widest bg-yellow-500/5 px-3 py-1 rounded-full border border-yellow-500/10">
                  {law.region}
                </div>
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2">{law.title}</h3>
              <p className="text-[10px] font-bold text-slate-500 mb-4 uppercase tracking-wider">{law.fullTitle}</p>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">{law.description}</p>
              
              <div className="space-y-3">
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Pilar Kepatuhan Kami:</p>
                 {law.keyPoints.map((point, idx) => (
                   <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                      {point}
                   </div>
                 ))}
              </div>
            </motion.div>
          ))}

          {/* Compliance Status Card */}
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/20 flex flex-col justify-center items-center text-center">
             <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6 animate-pulse">
                <Zap size={32} className="text-yellow-500" />
             </div>
             <h3 className="text-xl font-bold text-white mb-2">Semua Sistem Aktif</h3>
             <p className="text-slate-500 text-xs mb-6">Monitoring kepatuhan otomatis Sentinel melakukan audit setiap 24 jam.</p>
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Status: Compliant
             </div>
          </div>
        </div>

        {/* Detailed Breakdown Section */}
        <section className="mt-32">
           <div className="grid md:grid-cols-2 gap-20 items-center">
              <div>
                 <h2 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight">Bagaimana Kami <br /> <span className="text-yellow-500">Menaati Hukum?</span></h2>
                 <div className="space-y-8">
                    {[
                       { 
                         icon: Server, 
                         title: "Lokalisasi Data (Data Residency)", 
                         desc: "Kami menyimpan data siswa Indonesia di pusat data lokal untuk mematuhi UU PDP, sementara data internasional diproses sesuai dengan regulasi wilayah masing-masing." 
                       },
                       { 
                         icon: UserCheck, 
                         title: "Audit DPO Independen", 
                         desc: "Tim perlindungan data kami melakukan audit rutin secara independen untuk memastikan setiap fitur baru memenuhi standar privasi global sebelum dirilis." 
                       },
                       { 
                         icon: Lock, 
                         title: "Pseudonimisasi Otomatis", 
                         desc: "Kami meminimalisir identifikasi data sensitif dengan teknik enkripsi satu arah, sehingga privasi tetap terjaga bahkan saat diolah oleh sistem analitik." 
                       }
                    ].map((item, i) => (
                       <div key={i} className="flex gap-6">
                          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                             <item.icon className="text-yellow-500 w-6 h-6" />
                          </div>
                          <div>
                             <h4 className="text-white font-bold mb-2">{item.title}</h4>
                             <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="relative">
                 <div className="aspect-square bg-yellow-500/5 border border-white/5 rounded-[3rem] p-10 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]" />
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 opacity-10"
                    >
                       <Scale className="w-full h-full text-yellow-500" />
                    </motion.div>
                    <div className="relative z-10 text-center">
                       <AlertCircle size={64} className="text-yellow-500 mx-auto mb-6" />
                       <h3 className="text-2xl font-black text-white mb-2">Zero Tolerance Policy</h3>
                       <p className="text-slate-500 text-sm italic">"Keamanan data bukan sekadar opsi, melainkan janji hukum kami kepada Anda."</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* CTA Footer */}
        <section className="mt-32 text-center py-20 bg-white/[0.02] rounded-[3rem] border border-white/5">
           <h2 className="text-3xl font-black text-white mb-4">Punya Pertanyaan Hukum Spesifik?</h2>
           <p className="text-slate-400 mb-8">Tim legal dan DPO kami siap membantu Anda memahami lebih lanjut.</p>
           <Link href="/contact" className="px-10 py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-yellow-500/20 active:scale-95 inline-flex items-center gap-2">
              Hubungi Tim Legal <ExternalLink size={18} />
           </Link>
        </section>
      </main>
    </div>
  );
}
