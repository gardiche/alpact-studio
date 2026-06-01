'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useFinancements } from '../context';
import { generateDiagnosticFromRules } from '@/lib/financements/scoringService';
import { searchFrenchCities, AddressSuggestion } from '@/lib/financements/addressService';

const QUESTION_CONFIG = [
  { index: 0, key: 'location' },
  { index: 1, key: 'incorporationDate' },
  { index: 2, key: 'sector' },
  { index: 3, key: 'personalInvestment' },
  { index: 4, key: 'revenue' },
  { index: 5, key: 'amountRequested' },
  { index: 6, key: 'jobsPlanned' },
  { index: 7, key: 'trlLevel' },
  { index: 8, key: 'innovationLevel' },
] as const;

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-1.5 bg-[#E4E0DB] rounded-full overflow-hidden">
      <div className="h-full bg-[#111111] rounded-full transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function QuestionnairePage() {
  const router = useRouter();
  const { questionnaireData, setQuestionnaireData, projectData, setDiagnosticResults } = useFinancements();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [locationInput, setLocationInput] = useState(questionnaireData.location || '');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const questionStatus = useMemo(() => QUESTION_CONFIG.map(q => ({
    ...q,
    hasAnswer: questionnaireData[q.key as keyof typeof questionnaireData] !== undefined &&
               questionnaireData[q.key as keyof typeof questionnaireData] !== '' &&
               questionnaireData[q.key as keyof typeof questionnaireData] !== null,
  })), [questionnaireData]);

  const answeredCount = questionStatus.filter(q => q.hasAnswer).length;
  const totalQuestions = QUESTION_CONFIG.length;
  const isCurrentQuestionPrefilled = questionStatus[currentStep]?.hasAnswer ?? false;
  const currentQuestionIndex = QUESTION_CONFIG[currentStep]?.index ?? 0;
  const progress = 66 + (currentStep / totalQuestions) * 34;

  useEffect(() => {
    if (questionnaireData.location) setLocationInput(questionnaireData.location);
  }, [questionnaireData.location]);

  useEffect(() => {
    const search = async () => {
      if (locationInput.length < 2) { setSuggestions([]); return; }
      const results = await searchFrenchCities(locationInput);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [locationInput]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox'
      ? (e.target as HTMLInputElement).checked
      : e.target.value;
    setQuestionnaireData(prev => ({ ...prev, [e.target.name]: value }));
  };

  const handleLocationSelect = (s: AddressSuggestion) => {
    setLocationInput(s.city);
    setQuestionnaireData(prev => ({ ...prev, location: s.city, department: s.department, departmentName: s.departmentName }));
    setShowSuggestions(false);
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const results = generateDiagnosticFromRules(projectData, questionnaireData);
      setDiagnosticResults(results);
      router.push('/elyse/financements/diagnostic');
    } catch {
      alert('Une erreur est survenue lors de la génération du diagnostic.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full p-4 font-body text-[15px] text-[#111111] bg-[#F7F5F2] rounded-[12px] border border-[#E4E0DB] focus:outline-none focus:border-[#111111] transition-colors';
  const selectClass = inputClass;

  const innovationOptions = [
    { value: 'Non innovant', title: 'Non innovant / Innovation limitée', desc: 'Solution similaire à l\'existant, sans différenciation significative.' },
    { value: 'Amélioration incrémentale', title: 'Amélioration incrémentale', desc: 'Vous améliorez une solution existante : ergonomie, fonctionnalités, service.' },
    { value: 'Innovation forte', title: 'Innovation forte', desc: 'Nouvelle technologie, nouveau modèle ou nouveau mode d\'usage.' },
    { value: 'Innovation de rupture', title: 'Innovation de rupture / Deeptech', desc: 'Technologie propriétaire, création d\'un nouveau standard ou marché.' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col items-center pt-12 p-6">
      <div className="w-full max-w-2xl space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <p className="font-body text-[13px] uppercase tracking-widest text-[#888888]">
            Étape 2 sur 3
          </p>
          <h1 className="font-display font-bold text-[#111111]" style={{ fontSize: 'clamp(24px, 2.5vw, 36px)' }}>
            Détails de l&apos;entreprise
          </h1>
          {answeredCount > 0 && (
            <div className="inline-flex items-center gap-2 font-body text-[13px] text-[#1cb785] bg-[rgba(28,183,133,0.08)] rounded-full px-4 py-2">
              <Sparkles className="w-3.5 h-3.5" />
              {answeredCount} question{answeredCount > 1 ? 's' : ''} pré-remplie{answeredCount > 1 ? 's' : ''} depuis votre deck
            </div>
          )}
          <p className="font-body text-[13px] text-[#BBBBBB]">
            Question {currentStep + 1} sur {totalQuestions}
          </p>
          <div className="w-48 mx-auto">
            <ProgressBar value={progress} />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-white rounded-[20px] border border-[#E4E0DB] p-8 min-h-[260px] flex flex-col justify-center gap-6">
          {isCurrentQuestionPrefilled && (
            <div className="inline-flex items-center gap-2 font-body text-[12px] text-[#1cb785] bg-[rgba(28,183,133,0.08)] rounded-full px-3 py-1.5 w-fit">
              <Sparkles className="w-3 h-3" />
              Pré-rempli depuis votre deck
            </div>
          )}

          {currentQuestionIndex === 0 && (
            <div className="space-y-3">
              <label className="font-display font-bold text-[20px] text-[#111111]">Localisation (Siège)</label>
              <div className="relative" ref={suggestionRef}>
                <input
                  type="text"
                  value={locationInput}
                  onChange={e => { setLocationInput(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="ex : Paris, Lyon, Montpellier..."
                  className={inputClass}
                  autoFocus
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#E4E0DB] rounded-[12px] shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleLocationSelect(s)}
                        className="w-full px-4 py-3 text-left font-body text-[14px] text-[#111111] hover:bg-[#F7F5F2] transition-colors border-b border-[#F0EDE9] last:border-b-0"
                      >
                        {s.city}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {currentQuestionIndex === 1 && (
            <div className="space-y-3">
              <label className="font-display font-bold text-[20px] text-[#111111]">Date de création</label>
              <input
                type="date"
                name="incorporationDate"
                value={questionnaireData.incorporationDate === 'not-created' ? '' : questionnaireData.incorporationDate}
                onChange={handleChange}
                disabled={questionnaireData.incorporationDate === 'not-created'}
                className={inputClass + (questionnaireData.incorporationDate === 'not-created' ? ' opacity-40 cursor-not-allowed' : '')}
              />
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={questionnaireData.incorporationDate === 'not-created'}
                  onChange={e => setQuestionnaireData(prev => ({ ...prev, incorporationDate: e.target.checked ? 'not-created' : '' }))}
                  className="w-4 h-4 rounded accent-[#111111]"
                />
                <span className="font-body text-[14px] text-[#888888]">Entreprise pas encore créée</span>
              </label>
            </div>
          )}

          {currentQuestionIndex === 2 && (
            <div className="space-y-3">
              <label className="font-display font-bold text-[20px] text-[#111111]">Secteur d&apos;activité</label>
              <select name="sector" value={questionnaireData.sector} onChange={handleChange} className={selectClass}>
                <option value="Agriculture et agroalimentaire">Agriculture et agroalimentaire</option>
                <option value="Industrie">Industrie</option>
                <option value="Energie">Energie</option>
                <option value="Commerce et artisanat">Commerce et artisanat</option>
                <option value="Tourisme">Tourisme</option>
                <option value="Tech & Internet">Tech & Internet</option>
                <option value="Recherche">Recherche</option>
                <option value="Finance & assurance">Finance & assurance</option>
              </select>
            </div>
          )}

          {currentQuestionIndex === 3 && (
            <div className="space-y-3">
              <label className="font-display font-bold text-[20px] text-[#111111]">Investissement personnel ou prévu</label>
              <div className="relative">
                <input
                  type="number"
                  name="personalInvestment"
                  value={questionnaireData.personalInvestment || ''}
                  onChange={handleChange}
                  className={inputClass + ' pr-10'}
                  autoFocus
                />
                <span className="absolute right-4 top-4 font-body text-[15px] text-[#888888]">€</span>
              </div>
            </div>
          )}

          {currentQuestionIndex === 4 && (
            <div className="space-y-3">
              <label className="font-display font-bold text-[20px] text-[#111111]">Chiffre d&apos;affaires actuel</label>
              <select name="revenue" value={questionnaireData.revenue} onChange={handleChange} className={selectClass}>
                <option value="0">0 €</option>
                <option value="1-50k">1 – 50 000 €</option>
                <option value="50k-200k">50 000 – 200 000 €</option>
                <option value="200k-500k">200 000 – 500 000 €</option>
                <option value=">500k">Plus de 500 000 €</option>
              </select>
            </div>
          )}

          {currentQuestionIndex === 5 && (
            <div className="space-y-3">
              <label className="font-display font-bold text-[20px] text-[#111111]">Montant recherché</label>
              <div className="relative">
                <input
                  type="number"
                  name="amountRequested"
                  value={questionnaireData.amountRequested === 'unknown' ? '' : questionnaireData.amountRequested}
                  onChange={handleChange}
                  disabled={questionnaireData.amountRequested === 'unknown'}
                  className={inputClass + ' pr-10' + (questionnaireData.amountRequested === 'unknown' ? ' opacity-40 cursor-not-allowed' : '')}
                  autoFocus={questionnaireData.amountRequested !== 'unknown'}
                />
                <span className="absolute right-4 top-4 font-body text-[15px] text-[#888888]">€</span>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={questionnaireData.amountRequested === 'unknown'}
                  onChange={e => setQuestionnaireData(prev => ({ ...prev, amountRequested: e.target.checked ? 'unknown' : '' }))}
                  className="w-4 h-4 rounded accent-[#111111]"
                />
                <span className="font-body text-[14px] text-[#888888]">Je ne sais pas encore</span>
              </label>
            </div>
          )}

          {currentQuestionIndex === 6 && (
            <div className="space-y-3">
              <label className="font-display font-bold text-[20px] text-[#111111]">Effectif prévu à 2 ans</label>
              <input
                type="number"
                name="jobsPlanned"
                value={questionnaireData.jobsPlanned}
                onChange={handleChange}
                className={inputClass}
                autoFocus
              />
            </div>
          )}

          {currentQuestionIndex === 7 && (
            <div className="space-y-3">
              <label className="font-display font-bold text-[20px] text-[#111111]">Stade de maturité</label>
              <select name="trlLevel" value={questionnaireData.trlLevel} onChange={handleChange} className={selectClass}>
                <option value="Idéation">Idéation</option>
                <option value="Prototype/MVP en cours">Prototype / MVP en cours</option>
                <option value="MVP lancé">MVP lancé</option>
                <option value="Premiers utilisateurs/clients">Premiers utilisateurs / clients</option>
                <option value="Croissance initiale">Croissance initiale</option>
              </select>
            </div>
          )}

          {currentQuestionIndex === 8 && (
            <div className="space-y-3">
              <label className="font-display font-bold text-[20px] text-[#111111]">Niveau d&apos;innovation</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {innovationOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setQuestionnaireData(prev => ({ ...prev, innovationLevel: opt.value }))}
                    className={[
                      'p-4 rounded-[12px] text-left border-2 transition-all',
                      questionnaireData.innovationLevel === opt.value
                        ? 'bg-[#111111] border-[#111111] text-white'
                        : 'bg-[#F7F5F2] border-transparent text-[#111111] hover:border-[#E4E0DB]',
                    ].join(' ')}
                  >
                    <p className="font-body font-semibold text-[13px] mb-1">{opt.title}</p>
                    <p className={`font-body text-[12px] leading-[1.5] ${questionnaireData.innovationLevel === opt.value ? 'text-white/60' : 'text-[#888888]'}`}>
                      {opt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex justify-between items-center pb-8">
          <button
            onClick={() => {
              if (currentStep > 0) setCurrentStep(s => s - 1);
              else router.push('/elyse/financements/extraction');
            }}
            className="flex items-center gap-2 font-body text-[14px] text-[#888888] hover:text-[#111111] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex items-center gap-2 font-body font-semibold text-[14px] bg-[#111111] text-white px-8 py-3 rounded-full hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {loading ? 'Génération...' : currentStep === totalQuestions - 1 ? 'Lancer le diagnostic' : 'Suivant'}
            {!loading && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
