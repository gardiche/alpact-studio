export interface ProjectData {
  summary: string;
  market: string;
  problem: string;
  solution: string;
  innovation: string;
  business_model: string;
  team: string;
  traction: string;
  maturity: string;
  financial_need: string;
  product_state: string;
  sector: string;
}

export interface QuestionnaireData {
  location: string;
  department: string;
  departmentName: string;
  incorporationDate: string;
  sector: string;
  personalInvestment: string;
  revenue: string;
  amountRequested: string;
  jobsPlanned: number;
  legalStructure: string;
  trlLevel: string;
  innovationLevel: string;
  isInnovative: boolean;
  fundsUsage: string;
}

export interface ProgramDiagnostic {
  id: string;
  name: string;
  status: 'Eligible' | 'Ineligible' | 'Review';
  score: number;
  pros: string[];
  cons: string[];
  missingCriteria: string[];
  description: string;
}

export interface GlobalDiagnostic {
  programs: ProgramDiagnostic[];
  summary: string;
}

export const INITIAL_PROJECT_DATA: ProjectData = {
  summary: "",
  market: "",
  problem: "",
  solution: "",
  innovation: "",
  business_model: "",
  team: "",
  traction: "",
  maturity: "",
  financial_need: "",
  product_state: "",
  sector: "",
};

export const INITIAL_QUESTIONNAIRE_DATA: QuestionnaireData = {
  location: "",
  department: "",
  departmentName: "",
  incorporationDate: "",
  sector: "Tech & Internet",
  personalInvestment: "",
  revenue: "0",
  amountRequested: "",
  jobsPlanned: 3,
  legalStructure: "SAS",
  trlLevel: "Idéation",
  innovationLevel: "Innovation forte",
  isInnovative: true,
  fundsUsage: "R&D",
};
