export type ExamCategory = 'CSS' | 'PMS' | 'PPSC' | 'FPSC';

export type Province = 'Punjab' | 'Sindh' | 'KPK' | 'Balochistan';

export type SubjectClassification = 'compulsory' | 'screening' | 'optional';

export interface SubjectConfig {
  id: string;
  name: string;
  examCategories: ExamCategory[];
  classificationByExam: Record<ExamCategory, SubjectClassification>;
  description: string;
  iconName: string;
  totalQuestionsAvailable?: number;
}

export interface MCQ {
  id: string;
  examCategory: ExamCategory;
  province?: Province;
  subjectId: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0-3
  explanation: string;
  sourceYear?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface QuestionClientView {
  id: string;
  examCategory: ExamCategory;
  province?: Province;
  subjectId: string;
  question: string;
  options: [string, string, string, string];
  sourceYear?: string;
  topic: string;
}

export interface AttemptAnswerInput {
  questionId: string;
  selectedIndex: number | null; // null if unanswered
}

export interface AttemptSubmissionInput {
  studentName: string;
  examCategory: ExamCategory;
  province?: Province;
  subjectId: string;
  practiceMode: 'quick' | 'standard' | 'mock' | 'all';
  timeTakenSeconds: number;
  answers: AttemptAnswerInput[];
}

export interface AnswerBreakdown {
  questionId: string;
  question: string;
  options: [string, string, string, string];
  selectedIndex: number | null;
  correctIndex: number;
  isCorrect: boolean;
  explanation: string;
  topic: string;
  sourceYear?: string;
}

export interface StudentAttemptRecord {
  referenceCode: string;
  studentName: string;
  examCategory: ExamCategory;
  province?: Province;
  subjectId: string;
  subjectName: string;
  practiceMode: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  percentage: number;
  passed: boolean;
  timeTakenSeconds: number;
  completedAt: string;
  answers: AnswerBreakdown[];
}

export interface PastPaperSection {
  title: string;
  marks?: number;
  instructions?: string;
  questions: string[];
}

export interface PastPaper {
  id: string;
  examCategory: ExamCategory;
  province?: Province;
  subjectId: string;
  subjectName: string;
  year: number; // 2021 - 2025
  title: string;
  examType: string; // e.g. "CSS Competitive Examination", "Punjab PMS Written", "PPSC Combined Competitive", "FPSC General Recruitment"
  officialSource: string;
  officialSourceUrl: string;
  isOfficialVerified: boolean;
  description: string;
  timeAllowed: string;
  maximumMarks: number;
  instructions: string[];
  sections: PastPaperSection[];
  downloadableDemoContent?: string;
}

export interface SystemStats {
  totalMCQs: number;
  totalPastPapers: number;
  totalAttempts: number;
  averageScorePercentage: number;
  activeExamsCount: number;
}
