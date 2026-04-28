'use client';

import { useRouter } from 'next/navigation';
import { useFinancements } from '../context';
import { ProjectData } from '@/lib/financements/types';
import { Target, TrendingUp, Lightbulb, Zap, DollarSign, Users } from 'lucide-react';

const sections = [
  { key: 'summary', label: 'Résumé du Projet', icon: Target, colSpan: true },
  { key: 'problem', label: 'Problème & Marché', icon: TrendingUp, colSpan: false },
  { key: 'solution', label: 'Solution', icon: Lightbulb, colSpan: false },
  { key: 'innovation', label: 'Innovation', icon: Zap, colSpan: false },
  { key: 'business_model', label: 'Modèle Éco', icon: DollarSign, colSpan: false },
  { key: 'team', label: 'Équipe', icon: Users, colSpan: false },
  { key: 'financial_need', label: 'Besoin Financier', icon: TrendingUp, colSpan: false },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-[#E4E0DB] rounded-full overflow-hidden">
      <div className="h-full bg-[#111111] rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function ExtractionPage() {
  const router = useRouter();
  const { projectData, setProjectData } = useFinancements();

  const handleFieldChange = (key: keyof ProjectData, value: string) => {
    setProjectData({ ...projectData, [key]: value });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] pb-32">
      <div className="max-w-5xl mx-auto px-6 pt-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="font-body text-[13px] uppercase tracking-widest text-[#888888] mb-2">
              Étape 1 sur 3
            </p>
            <h1 className="font-display font-bold text-[#111111]" style={{ fontSize: 'clamp(24px, 2.5vw, 36px)', lineHeight: 1.1 }}>
              Vérifiez les données extraites
            </h1>
            <p className="font-body text-[15px] text-[#888888] mt-2">
              Elyse a analysé votre deck. Corrigez ou complétez si nécessaire.
            </p>
          </div>
          <div className="w-36 shrink-0 pt-1">
            <ProgressBar value={33} />
            <p className="font-body text-[11px] text-[#BBBBBB] text-right mt-1">33%</p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map(({ key, label, icon: Icon, colSpan }) => (
            <div
              key={key}
              className={[
                'bg-white rounded-[16px] border border-[#E4E0DB] p-5 group hover:border-[#111111] transition-colors',
                colSpan ? 'md:col-span-2' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-[#BBBBBB] group-hover:text-[#111111] transition-colors" />
                <span className="font-body text-[11px] font-semibold uppercase tracking-widest text-[#BBBBBB] group-hover:text-[#888888] transition-colors">
                  {label}
                </span>
              </div>
              <textarea
                className="w-full font-body text-[14px] text-[#111111] leading-[1.6] bg-transparent resize-none focus:outline-none min-h-[80px]"
                value={projectData[key as keyof ProjectData]}
                onChange={e => handleFieldChange(key as keyof ProjectData, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#E4E0DB] p-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <button
            onClick={() => router.push('/elyse/financements/upload')}
            className="font-body text-[14px] text-[#888888] hover:text-[#111111] transition-colors"
          >
            ← Retour
          </button>
          <button
            onClick={() => router.push('/elyse/financements/questionnaire')}
            className="font-body font-semibold text-[14px] bg-[#111111] text-white px-8 py-3 rounded-full hover:opacity-80 transition-opacity"
          >
            Valider et continuer →
          </button>
        </div>
      </div>
    </div>
  );
}
