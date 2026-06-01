'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, ChevronRight, Check, AlertCircle, Lightbulb, Package, CheckCircle2, X } from 'lucide-react';
import { useFinancements } from '../context';
import { ProgramDiagnostic } from '@/lib/financements/types';

export default function DiagnosticPage() {
  const router = useRouter();
  const { diagnosticResults } = useFinancements();
  const [selectedProgram, setSelectedProgram] = useState<ProgramDiagnostic | null>(null);

  if (!diagnosticResults) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <div className="text-center">
          <p className="font-body text-[16px] text-[#888888] mb-6">Aucun résultat. Lancez d&apos;abord le diagnostic.</p>
          <button
            onClick={() => router.push('/elyse/financements/upload')}
            className="font-body font-semibold text-[14px] bg-[#111111] text-white px-8 py-3 rounded-full hover:opacity-80 transition-opacity"
          >
            Commencer →
          </button>
        </div>
      </div>
    );
  }

  const programs = diagnosticResults.programs || [];
  const globalScore = programs.length > 0
    ? Math.round(programs.reduce((acc, p) => acc + (p.score || 0), 0) / programs.length)
    : 0;
  const eligibleCount = programs.filter(p => p.status === 'Eligible').length;
  const reviewCount = programs.filter(p => p.status === 'Review').length;
  const ineligibleCount = programs.filter(p => p.status === 'Ineligible').length;

  const getSynthesis = () => {
    if (eligibleCount >= 4) return 'Votre projet est très bien positionné pour le financement.';
    if (eligibleCount >= 2) return 'Votre projet présente un bon potentiel de financement.';
    if (eligibleCount === 1) return 'Votre projet correspond à 1 dispositif. Quelques ajustements débloqueront les autres.';
    return 'Votre projet présente des axes d\'amélioration pour accéder aux dispositifs.';
  };

  const getDetail = () => {
    if (eligibleCount >= 4) return `Votre dossier répond aux critères de ${eligibleCount} dispositifs majeurs. Vous pouvez entamer les démarches avec confiance.`;
    if (eligibleCount >= 2) return `Votre projet correspond à ${eligibleCount} dispositifs. Certains aspects méritent d'être clarifiés.`;
    if (eligibleCount === 1) return `En travaillant les points identifiés ci-dessous, vous pourrez débloquer d'autres sources de financement.`;
    return `Les recommandations ci-dessous vous guideront pour renforcer votre dossier.`;
  };

  const getInnovationLabel = () => {
    if (globalScore >= 80) return 'Innovation forte';
    if (globalScore >= 60) return 'Innovation notable';
    return 'Innovation modérée';
  };

  const getMaturityLabel = () => {
    if (globalScore >= 75) return 'Traction validée';
    if (globalScore >= 50) return 'MVP lancé';
    return 'Phase proto';
  };

  const getDossierLabel = () => {
    if (eligibleCount >= 3) return 'Dossier solide';
    if (eligibleCount >= 1) return 'Dossier correct';
    return 'Dossier à renforcer';
  };

  const getRecommendations = () => {
    const recs: Array<{ action: string; detail: string }> = [];
    programs.forEach(prog => {
      if (prog.status === 'Eligible' || prog.status === 'Review') {
        prog.missingCriteria?.slice(0, 1).forEach(c => recs.push({ action: c, detail: `Pour ${prog.name}` }));
      }
    });
    if (recs.length < 3) recs.push({ action: 'Structurer le business plan', detail: 'Prévisionnel financier 24 mois' });
    return recs.slice(0, 5);
  };

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Diagnostic Elyse — Financements non dilutifs', 20, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 20, 30);
    let y = 45;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text('Synthèse', 20, y); y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const splitSummary = doc.splitTextToSize(diagnosticResults.summary || getSynthesis(), 170);
    doc.text(splitSummary, 20, y); y += splitSummary.length * 6 + 10;
    programs.forEach(prog => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
      doc.text(`${prog.name} — ${prog.score}/100 — ${prog.status}`, 20, y); y += 8;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
      const desc = doc.splitTextToSize(prog.description || '', 170);
      doc.text(desc, 20, y); y += desc.length * 5 + 5;
      doc.setTextColor(0, 120, 0);
      (prog.pros || []).forEach(p => { doc.text(`+ ${p}`, 24, y); y += 5; });
      doc.setTextColor(180, 60, 0);
      [...(prog.cons || []), ...(prog.missingCriteria || [])].forEach(c => { doc.text(`- ${c}`, 24, y); y += 5; });
      doc.setTextColor(0); y += 8;
    });
    doc.save('diagnostic-financements-elyse.pdf');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2]">

      {/* Zone A — Global summary */}
      <div className="bg-white border-b border-[#E4E0DB]">
        <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">
          <p className="font-body text-[13px] uppercase tracking-widest text-[#888888] mb-6">
            Étape 3 sur 3 — Résultats
          </p>
          <div className="flex flex-col md:flex-row items-start gap-8">

            {/* Score circle */}
            <div className="shrink-0">
              <ScoreCircle score={globalScore} size={110} />
            </div>

            {/* Synthesis */}
            <div className="flex-1">
              <h1 className="font-display font-bold text-[#111111] mb-3" style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', lineHeight: 1.15 }}>
                {getSynthesis()}
              </h1>
              <p className="font-body text-[15px] text-[#888888] leading-[1.65] mb-5">{getDetail()}</p>

              {/* Status badges */}
              <div className="flex flex-wrap gap-3 mb-5">
                <StatusBadge count={eligibleCount} label="Éligible" color="green" />
                <StatusBadge count={reviewCount} label="À clarifier" color="yellow" />
                <StatusBadge count={ineligibleCount} label="Non éligible" color="red" />
              </div>

              {/* Indicators */}
              <div className="flex flex-wrap gap-2">
                <Chip icon={<Lightbulb size={14} />} label={getInnovationLabel()} />
                <Chip icon={<Package size={14} />} label={getMaturityLabel()} />
                <Chip icon={<CheckCircle2 size={14} />} label={getDossierLabel()} />
              </div>
            </div>

            {/* Actions */}
            <div className="shrink-0 flex flex-col gap-3">
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 font-body font-semibold text-[14px] bg-[#111111] text-white px-6 py-3 rounded-full hover:opacity-80 transition-opacity"
              >
                <Download size={16} />
                Télécharger PDF
              </button>
              <button
                onClick={() => router.push('/elyse')}
                className="flex items-center gap-2 font-body text-[14px] text-[#888888] hover:text-[#111111] transition-colors px-6 py-3 rounded-full border border-[#E4E0DB] bg-white"
              >
                ← Retour à Elyse
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Zone B + C */}
      <div className="max-w-6xl mx-auto px-6 md:px-12 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Program cards */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {programs.map(program => (
                <ProgramCard key={program.id} program={program} onClick={() => setSelectedProgram(program)} />
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="lg:w-[340px] shrink-0">
            <div className="bg-white rounded-[20px] border border-[#E4E0DB] p-8 lg:sticky lg:top-6">
              <h3 className="font-display font-bold text-[18px] text-[#111111] mb-6">
                Prochaines étapes
              </h3>
              <div className="space-y-5">
                {getRecommendations().map((rec, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="shrink-0 w-6 h-6 rounded-full bg-[#F0EDE9] flex items-center justify-center">
                      <span className="font-body text-[12px] font-bold text-[#888888]">{i + 1}</span>
                    </div>
                    <div>
                      <p className="font-body text-[13px] font-semibold text-[#111111] mb-0.5">{rec.action}</p>
                      <p className="font-body text-[12px] text-[#888888] flex items-center gap-1">
                        <ChevronRight size={12} />
                        {rec.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {selectedProgram && (
        <ProgramDetailModal program={selectedProgram} onClose={() => setSelectedProgram(null)} onExport={exportPDF} />
      )}
    </div>
  );
}

function ScoreCircle({ score, size }: { score: number; size: number }) {
  const getColor = (s: number) => {
    if (s >= 80) return '#1cb785';
    if (s >= 60) return '#2D5BE3';
    if (s >= 40) return '#ff8f27';
    return '#888888';
  };
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E4E0DB" strokeWidth="8" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={getColor(score)} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {size >= 100 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-[28px] text-[#111111]">{score}%</span>
          <span className="font-body text-[10px] uppercase tracking-wider text-[#BBBBBB] font-medium">SCORE</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ count, label, color }: { count: number; label: string; color: 'green' | 'yellow' | 'red' }) {
  const colors = {
    green: { bg: 'rgba(28,183,133,0.08)', text: '#1cb785' },
    yellow: { bg: 'rgba(255,143,39,0.08)', text: '#ff8f27' },
    red: { bg: 'rgba(239,68,68,0.08)', text: '#dc2626' },
  };
  const c = colors[color];
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-body" style={{ background: c.bg }}>
      <span className="text-[18px] font-bold" style={{ color: c.text }}>{count}</span>
      <span className="text-[13px] font-medium" style={{ color: c.text }}>{label}</span>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F0EDE9] rounded-full">
      <span className="text-[#888888]">{icon}</span>
      <span className="font-body text-[12px] font-medium text-[#888888]">{label}</span>
    </div>
  );
}

function ProgramCard({ program, onClick }: { program: ProgramDiagnostic; onClick: () => void }) {
  const statusConfig = {
    Eligible: { bg: 'rgba(28,183,133,0.08)', text: '#1cb785', label: 'ÉLIGIBLE' },
    Review: { bg: 'rgba(255,143,39,0.08)', text: '#ff8f27', label: 'À PRÉCISER' },
    Ineligible: { bg: 'rgba(239,68,68,0.08)', text: '#dc2626', label: 'NON ÉLIGIBLE' },
  };
  const sc = statusConfig[program.status];
  const score = program.score || 0;

  const barColor = (v: number) => {
    if (v >= 80) return '#1cb785';
    if (v >= 60) return '#2D5BE3';
    if (v >= 40) return '#ff8f27';
    return '#888888';
  };

  const criteria = [
    { label: 'Éligibilité', value: score },
    { label: 'Innovation', value: Math.min(100, score + 10) },
    { label: 'Maturité', value: Math.max(0, score - 5) },
  ];

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-[20px] border border-[#E4E0DB] p-6 hover:border-[#111111] transition-colors cursor-pointer relative"
    >
      <div className="absolute top-5 right-5 px-3 py-1 rounded-full font-body text-[11px] font-bold uppercase tracking-wide" style={{ background: sc.bg, color: sc.text }}>
        {sc.label}
      </div>

      <div className="mb-4 pr-24">
        <h3 className="font-display font-bold text-[16px] text-[#111111] mb-0.5">{program.name}</h3>
        <p className="font-body text-[12px] text-[#BBBBBB]">Dispositif de financement</p>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <ScoreCircle score={score} size={48} />
        <div>
          <p className="font-display font-bold text-[22px] text-[#111111]">{score}%</p>
          <p className="font-body text-[12px] text-[#888888]">{score >= 70 ? 'Bon score' : score >= 50 ? 'Score moyen' : 'Score faible'}</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-5">
        {criteria.map(c => (
          <div key={c.label}>
            <div className="flex justify-between mb-1">
              <span className="font-body text-[12px] text-[#888888]">{c.label}</span>
              <span className="font-body text-[12px] text-[#888888]">{c.value}%</span>
            </div>
            <div className="h-1.5 bg-[#E4E0DB] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${c.value}%`, background: barColor(c.value) }} />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5 mb-5">
        {program.pros?.slice(0, 2).map((pro, i) => (
          <div key={i} className="flex items-start gap-2 font-body text-[12px] text-[#555555]">
            <Check size={14} className="text-[#1cb785] mt-0.5 shrink-0" />
            {pro}
          </div>
        ))}
        {program.cons?.slice(0, 1).map((con, i) => (
          <div key={i} className="flex items-start gap-2 font-body text-[12px] text-[#555555]">
            <AlertCircle size={14} className="text-[#ff8f27] mt-0.5 shrink-0" />
            {con}
          </div>
        ))}
      </div>

      <button className="font-body text-[13px] font-medium text-[#2D5BE3] hover:underline flex items-center gap-1">
        Voir le détail <ChevronRight size={14} />
      </button>
    </div>
  );
}

function ProgramDetailModal({ program, onClose, onExport }: { program: ProgramDiagnostic; onClose: () => void; onExport: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6" onClick={onClose}>
      <div className="bg-white rounded-[24px] shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E4E0DB] px-8 py-6 flex justify-between items-start rounded-t-[24px]">
          <h2 className="font-display font-bold text-[22px] text-[#111111] pr-8">{program.name}</h2>
          <button onClick={onClose} className="text-[#888888] hover:text-[#111111] transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-8 space-y-8">
          <div className="flex gap-6">
            <div>
              <p className="font-body text-[12px] uppercase tracking-wider text-[#BBBBBB] mb-1">Score</p>
              <p className="font-display font-bold text-[24px] text-[#111111]">{program.score}%</p>
            </div>
            <div>
              <p className="font-body text-[12px] uppercase tracking-wider text-[#BBBBBB] mb-1">Statut</p>
              <p className="font-body font-semibold text-[15px] text-[#111111]">{program.status}</p>
            </div>
          </div>

          {program.description && (
            <p className="font-body text-[14px] text-[#555555] leading-[1.65]">{program.description}</p>
          )}

          {program.pros && program.pros.length > 0 && (
            <div>
              <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[#111111] mb-1">Points forts</p>
              <div className="w-8 h-0.5 bg-[#1cb785] mb-4" />
              <ul className="space-y-2">
                {program.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-[14px] text-[#555555]">
                    <span className="text-[#1cb785] mt-0.5">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {program.cons && program.cons.length > 0 && (
            <div>
              <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[#111111] mb-1">Points à améliorer</p>
              <div className="w-8 h-0.5 bg-[#ff8f27] mb-4" />
              <ul className="space-y-2">
                {program.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-[14px] text-[#555555]">
                    <span className="text-[#ff8f27] mt-0.5">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {program.missingCriteria && program.missingCriteria.length > 0 && (
            <div>
              <p className="font-body text-[11px] font-bold uppercase tracking-widest text-[#111111] mb-1">Critères manquants</p>
              <div className="w-8 h-0.5 bg-[#dc2626] mb-4" />
              <ul className="space-y-2">
                {program.missingCriteria.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 font-body text-[14px] text-[#555555]">
                    <ChevronRight size={14} className="text-[#dc2626] mt-0.5 shrink-0" /> {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#E4E0DB] px-8 py-5 flex justify-end gap-3 rounded-b-[24px]">
          <button
            onClick={onExport}
            className="flex items-center gap-2 font-body font-semibold text-[13px] bg-[#111111] text-white px-5 py-2.5 rounded-full hover:opacity-80 transition-opacity"
          >
            <Download size={14} /> PDF
          </button>
          <button
            onClick={onClose}
            className="font-body text-[13px] text-[#888888] hover:text-[#111111] px-5 py-2.5 rounded-full border border-[#E4E0DB] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
