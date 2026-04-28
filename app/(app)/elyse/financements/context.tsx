'use client';

import React, { createContext, useContext, useState } from 'react';
import {
  ProjectData,
  QuestionnaireData,
  GlobalDiagnostic,
  INITIAL_PROJECT_DATA,
  INITIAL_QUESTIONNAIRE_DATA,
} from '@/lib/financements/types';

interface FinancementsContextType {
  projectData: ProjectData;
  setProjectData: (data: ProjectData) => void;
  questionnaireData: QuestionnaireData;
  setQuestionnaireData: (data: QuestionnaireData | ((prev: QuestionnaireData) => QuestionnaireData)) => void;
  diagnosticResults: GlobalDiagnostic | null;
  setDiagnosticResults: (results: GlobalDiagnostic) => void;
  file: File | null;
  setFile: (file: File | null) => void;
}

const FinancementsContext = createContext<FinancementsContextType | undefined>(undefined);

export const FinancementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projectData, setProjectData] = useState<ProjectData>(INITIAL_PROJECT_DATA);
  const [questionnaireData, setQuestionnaireData] = useState<QuestionnaireData>(INITIAL_QUESTIONNAIRE_DATA);
  const [diagnosticResults, setDiagnosticResults] = useState<GlobalDiagnostic | null>(null);
  const [file, setFile] = useState<File | null>(null);

  return (
    <FinancementsContext.Provider value={{
      projectData, setProjectData,
      questionnaireData, setQuestionnaireData,
      diagnosticResults, setDiagnosticResults,
      file, setFile,
    }}>
      {children}
    </FinancementsContext.Provider>
  );
};

export const useFinancements = () => {
  const context = useContext(FinancementsContext);
  if (!context) throw new Error('useFinancements must be used within FinancementsProvider');
  return context;
};
