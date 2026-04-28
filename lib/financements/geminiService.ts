import { GoogleGenAI, Type, Schema } from '@google/genai';
import { ProjectData, QuestionnaireData } from './types';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let encoded = (reader.result?.toString() || '').replace(/^data:(.*,)?/, '');
      if (encoded && encoded.length % 4 > 0) {
        encoded += '='.repeat(4 - (encoded.length % 4));
      }
      resolve(encoded || '');
    };
    reader.onerror = (error) => reject(error);
  });
};

const getAI = () => new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });

const projectSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    market: { type: Type.STRING },
    problem: { type: Type.STRING },
    solution: { type: Type.STRING },
    innovation: { type: Type.STRING },
    business_model: { type: Type.STRING },
    team: { type: Type.STRING },
    traction: { type: Type.STRING },
    maturity: { type: Type.STRING },
    financial_need: { type: Type.STRING },
    product_state: { type: Type.STRING },
    sector: { type: Type.STRING },
    location: { type: Type.STRING },
    department: { type: Type.STRING },
    departmentName: { type: Type.STRING },
    incorporationDate: { type: Type.STRING },
    personalInvestment: { type: Type.STRING },
    revenue: { type: Type.STRING },
    amountRequested: { type: Type.STRING },
    jobsPlanned: { type: Type.NUMBER },
    legalStructure: { type: Type.STRING },
    trlLevel: { type: Type.STRING },
    innovationLevel: { type: Type.STRING },
    fundsUsage: { type: Type.STRING },
  },
  required: ['summary', 'market', 'problem', 'solution', 'innovation', 'team'],
};

export const parseDeck = async (
  base64Data: string,
  mimeType: string
): Promise<{ projectData: ProjectData; questionnaireData: Partial<QuestionnaireData> }> => {
  const ai = getAI();
  const cleanMimeType = mimeType === 'application/pdf' ? 'application/pdf' : mimeType;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: cleanMimeType, data: base64Data } },
          {
            text: `Analyze this pitch deck and extract the following information into a structured JSON object.
            Be concise, professional, and accurate. If a field is not explicitly found, try to infer it from context or leave it as "Non spécifié".
            Translate extracted content to French.

            IMPORTANT: Also try to extract company details when available:
            - location: Company headquarters location (city name in France)
            - department: Department code if mentioned or can be inferred
            - departmentName: Department name if mentioned or can be inferred
            - incorporationDate: Date of company creation (format YYYY-MM-DD), or "not-created" if not yet incorporated
            - sector: Business sector (Agriculture et agroalimentaire, Industrie, Energie, Commerce et artisanat, Tourisme, Tech & Internet, Recherche, Finance & assurance)
            - personalInvestment: Amount of personal investment by founders (as a number string)
            - revenue: Current revenue range ("0", "1-50k", "50k-200k", "200k-500k", ">500k")
            - amountRequested: Funding amount requested (as a number string), or "unknown" if not specified
            - jobsPlanned: Number of employees planned in 2 years (as a number)
            - legalStructure: Legal structure (SAS, SASU, SARL, SA, SCI, Association, Auto-entrepreneur)
            - trlLevel: Technology Readiness Level ("Idéation", "Prototype/MVP en cours", "MVP lancé", "Premiers utilisateurs/clients", "Croissance initiale")
            - innovationLevel: Level of innovation ("Non innovant", "Amélioration incrémentale", "Innovation forte", "Innovation de rupture")
            - fundsUsage: Main use of funds ("R&D", "Recrutement", "Marketing", "Infrastructure", "Autre")`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: projectSchema,
      },
    });

    if (response.text) {
      const extracted: Record<string, unknown> = JSON.parse(response.text);
      const str = (v: unknown): string => (typeof v === 'string' ? v : '');

      const projectData: ProjectData = {
        summary: str(extracted.summary),
        market: str(extracted.market),
        problem: str(extracted.problem),
        solution: str(extracted.solution),
        innovation: str(extracted.innovation),
        business_model: str(extracted.business_model),
        team: str(extracted.team),
        traction: str(extracted.traction),
        maturity: str(extracted.maturity),
        financial_need: str(extracted.financial_need),
        product_state: str(extracted.product_state),
        sector: str(extracted.sector),
      };

      const questionnaireData: Partial<QuestionnaireData> = {};
      if (extracted.location) questionnaireData.location = str(extracted.location);
      if (extracted.department) questionnaireData.department = str(extracted.department);
      if (extracted.departmentName) questionnaireData.departmentName = str(extracted.departmentName);
      if (extracted.incorporationDate) questionnaireData.incorporationDate = str(extracted.incorporationDate);
      if (extracted.sector) questionnaireData.sector = str(extracted.sector);
      if (extracted.personalInvestment) questionnaireData.personalInvestment = str(extracted.personalInvestment);
      if (extracted.revenue) questionnaireData.revenue = str(extracted.revenue);
      if (extracted.amountRequested) questionnaireData.amountRequested = str(extracted.amountRequested);
      if (extracted.jobsPlanned !== undefined) questionnaireData.jobsPlanned = Number(extracted.jobsPlanned);
      if (extracted.legalStructure) questionnaireData.legalStructure = str(extracted.legalStructure);
      if (extracted.trlLevel) questionnaireData.trlLevel = str(extracted.trlLevel);
      if (extracted.innovationLevel) questionnaireData.innovationLevel = str(extracted.innovationLevel);
      if (extracted.fundsUsage) questionnaireData.fundsUsage = str(extracted.fundsUsage);

      return { projectData, questionnaireData };
    }
    throw new Error('No response from AI');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('API key')) {
      throw new Error('Clé API Gemini invalide. Vérifiez vos variables d\'environnement.');
    }
    if (msg.includes('quota')) {
      throw new Error('Quota API dépassé. Attendez quelques minutes.');
    }
    throw new Error(msg || 'Erreur lors de l\'analyse du deck');
  }
};
