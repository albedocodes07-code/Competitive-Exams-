import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { ExamCategory, Province } from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '5mb' }));

// Request IP extraction for rate-limiting
const getClientIp = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
};

// Rate limiter middleware for public verification and submission
const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = getClientIp(req);
  if (!db.checkRateLimit(ip, 120, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
  }
  next();
};

// Admin Auth Middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required' });
  }
  const token = authHeader.substring(7);
  if (!db.isValidAdminToken(token)) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired admin session token' });
  }
  next();
};

// --- PUBLIC API ROUTES ---

// Health & System Info
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// System configuration & stats
app.get('/api/config', (_req: Request, res: Response) => {
  try {
    const subjects = db.getSubjects();
    const provinces = db.getProvinces();
    const stats = db.getSystemStats();
    res.json({
      examCategories: ['CSS', 'PMS', 'PPSC', 'FPSC'],
      subjects,
      provinces,
      stats,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching configuration' });
  }
});

// Filtered Subjects
app.get('/api/subjects', (req: Request, res: Response) => {
  const category = req.query.category as ExamCategory | undefined;
  const subjects = db.getSubjects(category);
  res.json({ subjects });
});

// MCQs for Student Practice (Stripped of answers in practice mode so questions are secure)
app.get('/api/mcqs', (req: Request, res: Response) => {
  try {
    const examCategory = req.query.examCategory as ExamCategory | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const province = req.query.province as Province | undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const practiceMode = (req.query.mode as string) || 'practice';

    const mcqs = db.getMCQs({
      examCategory,
      subjectId,
      province,
      limit,
      mode: practiceMode,
    });

    // Strip correctIndex and explanation from student client view for test integrity
    const clientQuestions = mcqs.map((m) => ({
      id: m.id,
      examCategory: m.examCategory,
      province: m.province,
      subjectId: m.subjectId,
      question: m.question,
      options: m.options,
      sourceYear: m.sourceYear,
      topic: m.topic,
    }));

    res.json({
      questions: clientQuestions,
      totalCount: clientQuestions.length,
      examCategory,
      subjectId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed fetching MCQs' });
  }
});

// Student Submission & Server-Side Scoring
app.post('/api/attempts/submit', rateLimitMiddleware, (req: Request, res: Response) => {
  try {
    const { studentName, examCategory, province, subjectId, practiceMode, timeTakenSeconds, answers } = req.body;

    if (!studentName || typeof studentName !== 'string' || studentName.trim().length === 0) {
      return res.status(400).json({ error: 'Please enter your name to complete the examination attempt.' });
    }

    if (!examCategory || !subjectId || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Invalid submission payload format.' });
    }

    const sanitizedName = studentName.trim().substring(0, 80);

    const record = db.submitAttempt({
      studentName: sanitizedName,
      examCategory,
      province,
      subjectId,
      practiceMode: practiceMode || 'standard',
      timeTakenSeconds: Number(timeTakenSeconds) || 0,
      answers,
    });

    res.json({
      success: true,
      message: 'Examination submitted and scored successfully.',
      attempt: record,
    });
  } catch (err: any) {
    console.error('Error in attempt submission:', err);
    res.status(500).json({ error: err.message || 'Failed to score and record attempt' });
  }
});

// Check My Result verification (strict name + reference code lookup)
app.post('/api/attempts/verify', rateLimitMiddleware, (req: Request, res: Response) => {
  try {
    const { studentName, referenceCode } = req.body;

    if (!studentName || !referenceCode) {
      return res.status(400).json({
        error: 'Both Student Full Name and Result Reference Code are required to verify results.',
      });
    }

    const result = db.verifyResult(studentName, referenceCode);

    if (!result) {
      return res.status(404).json({
        error:
          'No matching result found. Please ensure both your Name and Reference Code (e.g. EP-2026-XXXXX) match your test confirmation.',
      });
    }

    res.json({
      success: true,
      result,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed verifying result' });
  }
});

// Past Papers
app.get('/api/past-papers', (req: Request, res: Response) => {
  try {
    const examCategory = req.query.examCategory as ExamCategory | undefined;
    const subjectId = req.query.subjectId as string | undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;
    const province = req.query.province as Province | undefined;

    const papers = db.getPastPapers({
      examCategory,
      subjectId,
      year,
      province,
    });

    res.json({
      papers,
      total: papers.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed fetching past papers' });
  }
});

app.get('/api/past-papers/:id', (req: Request, res: Response) => {
  const paper = db.getPastPaperById(req.params.id);
  if (!paper) {
    return res.status(404).json({ error: 'Past paper not found' });
  }
  res.json({ paper });
});

// --- ADMIN API ROUTES ---

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Administrator password required' });
  }

  const token = db.verifyAdminPassword(password);
  if (!token) {
    return res.status(401).json({ error: 'Invalid administrator credentials. Access denied.' });
  }

  res.json({
    success: true,
    token,
    message: 'Administrator session authenticated successfully.',
  });
});

app.post('/api/admin/logout', requireAdmin, (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.substring(7);
    db.logoutAdmin(token);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Admin Stats & Attempts
app.get('/api/admin/stats', requireAdmin, (_req: Request, res: Response) => {
  const stats = db.getSystemStats();
  const recentAttempts = db.getRecentAttemptsForAdmin(100);
  res.json({ stats, recentAttempts });
});

// Admin MCQ Management
app.get('/api/admin/mcqs', requireAdmin, (req: Request, res: Response) => {
  const category = req.query.category as ExamCategory | undefined;
  const subjectId = req.query.subjectId as string | undefined;
  const mcqs = db.getMCQs({ examCategory: category, subjectId, limit: 1000 });
  res.json({ mcqs, total: mcqs.length });
});

app.post('/api/admin/mcqs', requireAdmin, (req: Request, res: Response) => {
  try {
    const { examCategory, province, subjectId, question, options, correctIndex, explanation, sourceYear, difficulty, topic } =
      req.body;

    if (!question || !Array.isArray(options) || options.length !== 4 || typeof correctIndex !== 'number') {
      return res.status(400).json({ error: 'Invalid MCQ structure. Exactly 4 options and valid correct index required.' });
    }

    const created = db.addMCQ({
      examCategory,
      province,
      subjectId,
      question: question.trim(),
      options: options.map((o: string) => String(o).trim()) as [string, string, string, string],
      correctIndex: Number(correctIndex),
      explanation: explanation || 'Curriculum explanation verified.',
      sourceYear: sourceYear || 'Recent Examination',
      difficulty: difficulty || 'medium',
      topic: topic || 'General Topic',
    });

    res.status(201).json({ success: true, mcq: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed adding MCQ' });
  }
});

app.put('/api/admin/mcqs/:id', requireAdmin, (req: Request, res: Response) => {
  const updated = db.updateMCQ(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'MCQ not found' });
  }
  res.json({ success: true, mcq: updated });
});

app.delete('/api/admin/mcqs/:id', requireAdmin, (req: Request, res: Response) => {
  const success = db.deleteMCQ(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'MCQ not found or already deleted' });
  }
  res.json({ success: true, message: 'MCQ deleted successfully' });
});

// Admin Bulk Import (JSON / CSV formatted)
app.post('/api/admin/mcqs/import', requireAdmin, (req: Request, res: Response) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Import items must be a non-empty array' });
    }

    const result = db.bulkImportMCQs(items);
    res.json({
      success: true,
      message: `Successfully imported ${result.added} MCQs (${result.errors} skipped due to invalid format).`,
      added: result.added,
      errors: result.errors,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Bulk import failed' });
  }
});

// Admin Past Papers Management
app.post('/api/admin/past-papers', requireAdmin, (req: Request, res: Response) => {
  try {
    const paper = db.addPastPaper(req.body);
    res.status(201).json({ success: true, paper });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed creating past paper' });
  }
});

app.delete('/api/admin/past-papers/:id', requireAdmin, (req: Request, res: Response) => {
  const success = db.deletePastPaper(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Past paper not found' });
  }
  res.json({ success: true, message: 'Past paper deleted successfully' });
});

// Admin Provincial Syllabi Configuration
app.put('/api/admin/provinces', requireAdmin, (req: Request, res: Response) => {
  try {
    const { selectedDefault, provincesList } = req.body;
    db.setProvincesConfig({ selectedDefault, provincesList });
    res.json({ success: true, message: 'Provincial syllabi settings updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed updating provinces configuration' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ExamPrep Pakistan] Server active and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
