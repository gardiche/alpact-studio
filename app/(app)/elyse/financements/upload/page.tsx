'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { useFinancements } from '../context';
import { fileToBase64, parseDeck } from '@/lib/financements/geminiService';

const loadingMessages = [
  'Scan en cours… respirez normalement.',
  'Interrogation de la slide 3… elle coopère.',
  'Mise sous pression du business model… il tient le coup.',
  'On cuisine vos métriques… al dente.',
  'Lecture entre les lignes… intéressant.',
  'Calibration du radar à financeurs… bip bip.',
  'Détection de synergies… prometteur.',
  'Compression du pitch… sans perdre la magie.',
  'Scan des incohérences… élimination en cours.',
];

export default function UploadPage() {
  const router = useRouter();
  const { setFile, setProjectData, setQuestionnaireData } = useFinancements();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
        setIsVisible(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleProcessFile = async (selectedFile: File) => {
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Le fichier dépasse 20 Mo.');
      return;
    }
    setError(null);
    setFile(selectedFile);
    setMessageIndex(0);
    setIsVisible(true);
    setIsLoading(true);

    try {
      const base64 = await fileToBase64(selectedFile);
      const { projectData: extractedProject, questionnaireData: extractedQuestionnaire } = await parseDeck(base64, selectedFile.type);
      setProjectData(extractedProject);
      setQuestionnaireData(prev => ({ ...prev, ...extractedQuestionnaire }));
      router.push('/elyse/financements/extraction');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'analyse du deck.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleProcessFile(e.dataTransfer.files[0]);
  }, []);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleProcessFile(e.target.files[0]);
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl">

        {/* Header */}
        <div className="mb-10">
          <p className="font-body text-[13px] uppercase tracking-widest text-[#888888] mb-3">
            Éligibilité aux financements non dilutifs
          </p>
          <h1 className="font-display font-bold text-[#111111] mb-4" style={{ fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.1 }}>
            Importez votre Pitch Deck
          </h1>
          <p className="font-body text-[16px] text-[#888888] leading-[1.65]">
            Elyse analyse votre pitch deck et croise vos données avec les dispositifs de financement non dilutif actifs — Bourse French Tech, Bpifrance, Réseau Entreprendre et plus. En 2 minutes, vous savez où concentrer vos efforts.
          </p>
          <p className="font-body text-[13px] text-[#BBBBBB] mt-3">Format PDF · Max 20 Mo</p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={[
            'relative rounded-[20px] border-2 border-dashed h-72 flex flex-col items-center justify-center transition-all duration-200',
            isDragging ? 'border-[#111111] bg-[#F0EDE9]' : 'border-[#E4E0DB] bg-white hover:border-[#BBBBBB]',
          ].join(' ')}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 px-6 text-center">
              <video
                src="/elyse-app/loader.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-48 h-48 object-contain"
              />
              <p className="font-body font-semibold text-[16px] text-[#111111]">Analyse en cours</p>
              <p
                className="font-body text-[13px] text-[#888888] transition-opacity duration-500"
                style={{ opacity: isVisible ? 1 : 0 }}
              >
                {loadingMessages[messageIndex]}
              </p>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept=".pdf"
                onChange={onFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="bg-[#F0EDE9] p-4 rounded-full mb-4">
                <UploadCloud className="w-7 h-7 text-[#888888]" />
              </div>
              <p className="font-body font-semibold text-[15px] text-[#111111] mb-1">Glissez-déposez ou cliquez</p>
              <p className="font-body text-[13px] text-[#BBBBBB]">pour uploader votre fichier</p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-[12px] flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/elyse')}
            className="font-body text-[13px] text-[#888888] hover:text-[#111111] transition-colors"
          >
            ← Retour à Elyse
          </button>
        </div>
      </div>
    </div>
  );
}
