import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  MCQ,
  PastPaper,
  SubjectConfig,
  StudentAttemptRecord,
  AttemptSubmissionInput,
  AnswerBreakdown,
  SystemStats,
  ExamCategory,
  Province,
} from '../src/types/index.ts';
import { SUBJECTS, INITIAL_MCQS, INITIAL_PAST_PAPERS } from './seedData.ts';

interface DatabaseSchema {
  subjects: SubjectConfig[];
  mcqs: MCQ[];
  pastPapers: PastPaper[];
  attempts: StudentAttemptRecord[];
  activeProvinces: {
    selectedDefault: Province;
    provincesList: { id: Province; name: string; commission: string; description: string }[];
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'examprep_db.json');

const DEFAULT_PROVINCES: DatabaseSchema['activeProvinces'] = {
  selectedDefault: 'Punjab',
  provincesList: [
    {
      id: 'Punjab',
      name: 'Punjab PMS',
      commission: 'Punjab Public Service Commission (PPSC)',
      description: 'Standard Punjab PMS 600-marks compulsory (GK, English Essay, Precis, Urdu, Pak Studies, Islamiyat) + optional syllabus.',
    },
    {
      id: 'Sindh',
      name: 'Sindh CCE / PMS',
      commission: 'Sindh Public Service Commission (SPSC)',
      description: 'Combined Competitive Examination (CCE) syllabus conforming to SPSC regulations.',
    },
    {
      id: 'KPK',
      name: 'Khyber Pakhtunkhwa PMS',
      commission: 'KP Public Service Commission (KPPSC)',
      description: 'KP Provincial Management Service curriculum with Pashto/regional language options.',
    },
    {
      id: 'Balochistan',
      name: 'Balochistan PMS',
      commission: 'Balochistan Public Service Commission (BPSC)',
      description: 'BPSC competitive examination syllabus with Balochi/Brahvi/Pashto and provincial affairs.',
    },
  ],
};

class DatabaseService {
  private data: DatabaseSchema;
  private adminTokens: Set<string> = new Set();
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    this.data = this.loadOrInit();
  }

  private loadOrInit(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure defaults if missing
        if (!parsed.subjects || parsed.subjects.length === 0) parsed.subjects = SUBJECTS;
        if (!parsed.mcqs || parsed.mcqs.length === 0) parsed.mcqs = INITIAL_MCQS;
        if (!parsed.pastPapers || parsed.pastPapers.length === 0) parsed.pastPapers = INITIAL_PAST_PAPERS;
        if (!parsed.attempts) parsed.attempts = [];
        if (!parsed.activeProvinces) parsed.activeProvinces = DEFAULT_PROVINCES;
        return parsed;
      }
    } catch (err) {
      console.error('Failed reading database file, initializing fallback:', err);
    }

    const initialData: DatabaseSchema = {
      subjects: SUBJECTS,
      mcqs: INITIAL_MCQS,
      pastPapers: INITIAL_PAST_PAPERS,
      attempts: [],
      activeProvinces: DEFAULT_PROVINCES,
    };

    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving initial database file:', err);
    }

    return initialData;
  }

  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  // Rate Limiter
  public checkRateLimit(ip: string, limit = 60, windowMs = 60000): boolean {
    const now = Date.now();
    const record = this.rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
      return true;
    }
    if (record.count >= limit) {
      return false;
    }
    record.count++;
    return true;
  }

  // Subjects & Provinces
  public getSubjects(examCategory?: ExamCategory): SubjectConfig[] {
    if (!examCategory) {
      return this.data.subjects;
    }
    return this.data.subjects.filter((s) => s.examCategories.includes(examCategory));
  }

  public getProvinces() {
    return this.data.activeProvinces;
  }

  public setProvincesConfig(activeProvinces: DatabaseSchema['activeProvinces']) {
    this.data.activeProvinces = activeProvinces;
    this.persist();
  }

  // MCQs
  public getMCQs(filters: {
    examCategory?: ExamCategory;
    subjectId?: string;
    province?: Province;
    limit?: number;
    mode?: string;
  }): MCQ[] {
    let list = this.data.mcqs;

    if (filters.examCategory) {
      list = list.filter((m) => m.examCategory === filters.examCategory);
    }

    if (filters.subjectId && filters.subjectId !== 'all') {
      list = list.filter((m) => m.subjectId === filters.subjectId);
    }

    if (filters.province && filters.examCategory === 'PMS') {
      list = list.filter((m) => !m.province || m.province === filters.province);
    }

    // Shuffle for practice variety
    const shuffled = [...list].sort(() => 0.5 - Math.random());

    if (filters.limit && filters.limit > 0) {
      return shuffled.slice(0, filters.limit);
    }

    return shuffled;
  }

  public getMCQById(id: string): MCQ | undefined {
    return this.data.mcqs.find((m) => m.id === id);
  }

  public addMCQ(mcqInput: Omit<MCQ, 'id'>): MCQ {
    const newMCQ: MCQ = {
      ...mcqInput,
      id: `mcq-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.data.mcqs.unshift(newMCQ);
    this.persist();
    return newMCQ;
  }

  public updateMCQ(id: string, updates: Partial<MCQ>): MCQ | null {
    const idx = this.data.mcqs.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.data.mcqs[idx] = { ...this.data.mcqs[idx], ...updates, id };
    this.persist();
    return this.data.mcqs[idx];
  }

  public deleteMCQ(id: string): boolean {
    const initialLen = this.data.mcqs.length;
    this.data.mcqs = this.data.mcqs.filter((m) => m.id !== id);
    if (this.data.mcqs.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public bulkImportMCQs(importedList: Array<Omit<MCQ, 'id'>>): { added: number; errors: number } {
    let added = 0;
    let errors = 0;

    for (const item of importedList) {
      if (
        item.question &&
        Array.isArray(item.options) &&
        item.options.length === 4 &&
        typeof item.correctIndex === 'number' &&
        item.correctIndex >= 0 &&
        item.correctIndex <= 3 &&
        item.subjectId &&
        item.examCategory
      ) {
        const newMCQ: MCQ = {
          ...item,
          id: `mcq-imp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          difficulty: item.difficulty || 'medium',
          topic: item.topic || 'General Examination Syllabus',
          explanation: item.explanation || 'Verified as per official examination curriculum answer key.',
        };
        this.data.mcqs.push(newMCQ);
        added++;
      } else {
        errors++;
      }
    }

    if (added > 0) {
      this.persist();
    }
    return { added, errors };
  }

  // Student Attempt Submission & Server-Side Scoring
  public submitAttempt(submission: AttemptSubmissionInput): StudentAttemptRecord {
    const { studentName, examCategory, province, subjectId, practiceMode, timeTakenSeconds, answers } = submission;

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    const breakdown: AnswerBreakdown[] = [];

    const subjectObj = this.data.subjects.find((s) => s.id === subjectId);
    const subjectName = subjectObj ? subjectObj.name : 'Comprehensive Mixed Test';

    for (const ans of answers) {
      const mcq = this.getMCQById(ans.questionId);
      if (!mcq) {
        continue;
      }

      const isUnanswered = ans.selectedIndex === null || ans.selectedIndex === undefined || ans.selectedIndex < 0;
      const isCorrect = !isUnanswered && ans.selectedIndex === mcq.correctIndex;

      if (isUnanswered) {
        unansweredCount++;
      } else if (isCorrect) {
        correctCount++;
      } else {
        incorrectCount++;
      }

      breakdown.push({
        questionId: mcq.id,
        question: mcq.question,
        options: mcq.options,
        selectedIndex: isUnanswered ? null : ans.selectedIndex,
        correctIndex: mcq.correctIndex,
        isCorrect,
        explanation: mcq.explanation,
        topic: mcq.topic,
        sourceYear: mcq.sourceYear,
      });
    }

    const totalQuestions = answers.length;
    const rawScore = correctCount; // 1 mark per question
    const percentage = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 100) : 0;
    const passed = percentage >= 50;

    // Generate unique private reference code: e.g. EP-2026-X89K2
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const referenceCode = `EP-2026-${randomSuffix}`;

    const record: StudentAttemptRecord = {
      referenceCode,
      studentName: (studentName || 'Student Candidate').trim(),
      examCategory,
      province,
      subjectId,
      subjectName,
      practiceMode,
      totalQuestions,
      correctCount,
      incorrectCount,
      unansweredCount,
      percentage,
      passed,
      timeTakenSeconds,
      completedAt: new Date().toISOString(),
      answers: breakdown,
    };

    // Store attempt in persistent array
    this.data.attempts.unshift(record);
    this.persist();

    return record;
  }

  // Check My Result - strict lookup requiring both student name & reference code
  public verifyResult(studentName: string, referenceCode: string): StudentAttemptRecord | null {
    const cleanCode = referenceCode.trim().toUpperCase();
    const cleanName = studentName.trim().toLowerCase();

    const match = this.data.attempts.find((att) => {
      return (
        att.referenceCode.toUpperCase() === cleanCode &&
        att.studentName.trim().toLowerCase() === cleanName
      );
    });

    return match || null;
  }

  // Past Papers
  public getPastPapers(filters: {
    examCategory?: ExamCategory;
    subjectId?: string;
    year?: number;
    province?: Province;
  }): PastPaper[] {
    let papers = this.data.pastPapers;

    if (filters.examCategory) {
      papers = papers.filter((p) => p.examCategory === filters.examCategory);
    }
    if (filters.subjectId && filters.subjectId !== 'all') {
      papers = papers.filter((p) => p.subjectId === filters.subjectId);
    }
    if (filters.year) {
      papers = papers.filter((p) => p.year === filters.year);
    }
    if (filters.province && filters.examCategory === 'PMS') {
      papers = papers.filter((p) => !p.province || p.province === filters.province);
    }

    return papers.sort((a, b) => b.year - a.year);
  }

  public getPastPaperById(id: string): PastPaper | undefined {
    return this.data.pastPapers.find((p) => p.id === id);
  }

  public addPastPaper(paperInput: Omit<PastPaper, 'id'>): PastPaper {
    const newPaper: PastPaper = {
      ...paperInput,
      id: `pp-${paperInput.examCategory.toLowerCase()}-${paperInput.year}-${Date.now().toString(36)}`,
    };
    this.data.pastPapers.unshift(newPaper);
    this.persist();
    return newPaper;
  }

  public deletePastPaper(id: string): boolean {
    const initLen = this.data.pastPapers.length;
    this.data.pastPapers = this.data.pastPapers.filter((p) => p.id !== id);
    if (this.data.pastPapers.length !== initLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // Admin Auth & Stats
  public verifyAdminPassword(inputPass: string): string | null {
    const expectedPassword = process.env.ADMIN_PASSWORD || 'AdminPakistan2026!';
    if (inputPass.trim() === expectedPassword.trim()) {
      const token = `adm_${crypto.randomBytes(24).toString('hex')}`;
      this.adminTokens.add(token);
      return token;
    }
    return null;
  }

  public isValidAdminToken(token: string): boolean {
    if (!token) return false;
    return this.adminTokens.has(token);
  }

  public logoutAdmin(token: string) {
    this.adminTokens.delete(token);
  }

  public getSystemStats(): SystemStats {
    const totalMCQs = this.data.mcqs.length;
    const totalPastPapers = this.data.pastPapers.length;
    const totalAttempts = this.data.attempts.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round(this.data.attempts.reduce((acc, cur) => acc + cur.percentage, 0) / totalAttempts)
        : 72;

    return {
      totalMCQs,
      totalPastPapers,
      totalAttempts,
      averageScorePercentage: avgScore,
      activeExamsCount: 4,
    };
  }

  public getRecentAttemptsForAdmin(limit = 50): Array<Omit<StudentAttemptRecord, 'answers'>> {
    return this.data.attempts.slice(0, limit).map((a) => ({
      referenceCode: a.referenceCode,
      studentName: a.studentName,
      examCategory: a.examCategory,
      province: a.province,
      subjectId: a.subjectId,
      subjectName: a.subjectName,
      practiceMode: a.practiceMode,
      totalQuestions: a.totalQuestions,
      correctCount: a.correctCount,
      incorrectCount: a.incorrectCount,
      unansweredCount: a.unansweredCount,
      percentage: a.percentage,
      passed: a.passed,
      timeTakenSeconds: a.timeTakenSeconds,
      completedAt: a.completedAt,
    }));
  }
}

export const db = new DatabaseService();
