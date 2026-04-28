import { ProjectData, QuestionnaireData, GlobalDiagnostic, ProgramDiagnostic } from './types';
import programsConfig from './programs.json';

interface ProgramConfig {
  id: string;
  name: string;
  description: string;
  criteria: Criterion[];
  scoring: {
    threshold_eligible: number;
    threshold_review: number;
  };
  recommendations: Record<string, string>;
}

interface Criterion {
  id: string;
  label: string;
  field: string;
  operator: string;
  value: string | number | boolean | string[] | number[];
  weight: number;
  mandatory: boolean;
}

interface EvaluationResult {
  met: boolean;
  score: number;
  criterion: Criterion;
}

const evaluateCriterion = (
  criterion: Criterion,
  projectData: ProjectData,
  questionnaireData: QuestionnaireData
): EvaluationResult => {
  const field = criterion.field as keyof (ProjectData & QuestionnaireData);
  let fieldValue: string | number | boolean | undefined;

  if (field in questionnaireData) {
    fieldValue = questionnaireData[field as keyof QuestionnaireData];
  } else if (field in projectData) {
    fieldValue = projectData[field as keyof ProjectData];
  }

  let met = false;

  switch (criterion.operator) {
    case 'not_empty':
      met = fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      break;
    case 'equals':
      met = fieldValue === criterion.value;
      break;
    case 'not_equals':
      met = fieldValue !== criterion.value;
      break;
    case 'greater_than':
      met = Number(fieldValue) > criterion.value;
      break;
    case 'greater_than_or_equal':
      met = Number(fieldValue) >= criterion.value;
      break;
    case 'less_than':
      met = Number(fieldValue) < criterion.value;
      break;
    case 'less_than_or_equal':
      met = Number(fieldValue) <= criterion.value;
      break;
    case 'in':
      met = Array.isArray(criterion.value) && criterion.value.includes(fieldValue);
      break;
    case 'between':
      if (Array.isArray(criterion.value) && criterion.value.length === 2) {
        const numValue = Number(fieldValue);
        met = numValue >= criterion.value[0] && numValue <= criterion.value[1];
      }
      break;
    case 'age_less_than':
      if (fieldValue && fieldValue !== 'not-created') {
        const incorporationDate = new Date(fieldValue);
        const now = new Date();
        const ageInYears = (now.getTime() - incorporationDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        met = ageInYears < criterion.value;
      } else {
        met = false;
      }
      break;
    case 'age_greater_than':
      if (fieldValue && fieldValue !== 'not-created') {
        const incorporationDate = new Date(fieldValue);
        const now = new Date();
        const ageInYears = (now.getTime() - incorporationDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        met = ageInYears > criterion.value;
      } else {
        met = false;
      }
      break;
    case 'revenue_under_10M':
      if (fieldValue === '>500k') {
        met = false;
      } else if (fieldValue && fieldValue !== '0') {
        met = true;
      } else if (fieldValue === '0') {
        met = true;
      } else {
        met = false;
      }
      break;
    default:
      met = false;
  }

  return { met, score: met ? criterion.weight : 0, criterion };
};

const evaluateProgram = (
  program: ProgramConfig,
  projectData: ProjectData,
  questionnaireData: QuestionnaireData
): ProgramDiagnostic => {
  const results = program.criteria.map(criterion =>
    evaluateCriterion(criterion, projectData, questionnaireData)
  );

  const totalWeight = program.criteria.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = results.reduce((sum, r) => sum + r.score, 0);
  const score = Math.round((earnedWeight / totalWeight) * 100);

  const mandatoryCriteria = results.filter(r => r.criterion.mandatory);
  const allMandatoryMet = mandatoryCriteria.every(r => r.met);

  let status: 'Eligible' | 'Ineligible' | 'Review';
  if (!allMandatoryMet) {
    status = 'Ineligible';
  } else if (score >= program.scoring.threshold_eligible) {
    status = 'Eligible';
  } else if (score >= program.scoring.threshold_review) {
    status = 'Review';
  } else {
    status = 'Ineligible';
  }

  const pros = results.filter(r => r.met).map(r => r.criterion.label);
  const cons = results.filter(r => !r.met && !r.criterion.mandatory).map(r => r.criterion.label);
  const missingCriteria = results
    .filter(r => !r.met && r.criterion.mandatory)
    .map(r => program.recommendations[`missing_${r.criterion.id}`] || r.criterion.label);
  const additionalRecommendations = results
    .filter(r => !r.met && !r.criterion.mandatory)
    .map(r => program.recommendations[`missing_${r.criterion.id}`])
    .filter(Boolean);

  return {
    id: program.id,
    name: program.name,
    status,
    score,
    pros,
    cons,
    missingCriteria: [...missingCriteria, ...additionalRecommendations],
    description: program.description,
  };
};

export const generateDiagnosticFromRules = (
  projectData: ProjectData,
  questionnaireData: QuestionnaireData
): GlobalDiagnostic => {
  const programs = (programsConfig.programs as ProgramConfig[]).map(program =>
    evaluateProgram(program, projectData, questionnaireData)
  );

  const eligibleCount = programs.filter(p => p.status === 'Eligible').length;
  const reviewCount = programs.filter(p => p.status === 'Review').length;

  let summary = '';
  if (eligibleCount >= 4) {
    summary = `Votre projet est très bien positionné pour le financement. Vous êtes éligible à ${eligibleCount} dispositifs majeurs.`;
  } else if (eligibleCount >= 2) {
    summary = `Votre projet présente un bon potentiel de financement. Vous êtes éligible à ${eligibleCount} dispositifs.`;
  } else if (eligibleCount === 1) {
    summary = `Votre projet correspond à 1 dispositif de financement. Certains aspects méritent d'être renforcés.`;
  } else if (reviewCount > 0) {
    summary = `Votre projet nécessite quelques ajustements pour améliorer son éligibilité aux ${reviewCount} dispositifs à clarifier.`;
  } else {
    summary = `Votre projet présente des axes d'amélioration pour accéder aux dispositifs de financement analysés.`;
  }

  return { programs, summary };
};
