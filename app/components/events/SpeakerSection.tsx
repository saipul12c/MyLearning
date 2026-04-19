"use client";

import { User, Globe } from "lucide-react";

// Inline SVGs for compatibility with older lucide-react versions
const SocialIcons = {
  Twitter: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  LinkedIn: (props: any) => (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
};

interface Speaker {
  name: string;
  role: string;
  company?: string;
  bio?: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
}

interface SpeakerSectionProps {
  speakers: Speaker[];
}

export default function SpeakerSection({ speakers }: SpeakerSectionProps) {
  if (!speakers || speakers.length === 0) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-white/5 pb-6">
         <User className="text-purple-500" size={24} />
         <h2 className="text-xl font-bold uppercase tracking-widest">Pembicara / Mentor</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {speakers.map((speaker, i) => (
          <div key={i} className="group p-6 rounded-[2rem] bg-white/5 border border-white/10 hover:border-purple-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10">
            <div className="flex items-start gap-4">
               <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-white/10 group-hover:border-purple-500 transition-colors">
                    {speaker.avatarUrl ? (
                      <img src={speaker.avatarUrl} alt={speaker.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-500">
                        <User size={32} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-purple-600 border-2 border-[#09090f] flex items-center justify-center text-[10px] text-white font-black">
                    #{i + 1}
                  </div>
               </div>
               
               <div className="flex-1 space-y-1">
                  <h3 className="font-bold text-lg text-white group-hover:text-purple-400 transition-colors">{speaker.name}</h3>
                  <p className="text-xs font-medium text-slate-400">
                    {speaker.role} {speaker.company && <span className="text-purple-500/50 block sm:inline sm:before:content-['@'] sm:before:mx-1">{speaker.company}</span>}
                  </p>
               </div>
            </div>

            {speaker.bio && (
              <p className="mt-4 text-xs text-slate-500 leading-relaxed line-clamp-2 italic">
                "{speaker.bio}"
              </p>
            )}

            <div className="mt-6 flex items-center gap-3 pt-6 border-t border-white/5">
                {speaker.linkedinUrl && (
                  <a href={speaker.linkedinUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-all">
                    <SocialIcons.LinkedIn size={16} />
                  </a>
                )}
                {speaker.twitterUrl && (
                  <a href={speaker.twitterUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all">
                    <SocialIcons.Twitter size={16} />
                  </a>
                )}
               {speaker.websiteUrl && (
                 <a href={speaker.websiteUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-purple-400 transition-all">
                   <Globe size={16} />
                 </a>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
