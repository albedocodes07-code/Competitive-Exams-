import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Database,
  BarChart3,
  FileText,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Layers,
  Copy,
  Check,
  Code,
  Info,
} from 'lucide-react';
import { ExamCategory, MCQ, PastPaper, Province, SubjectConfig, SystemStats } from '../types/index.ts';
import { formatDate } from '../utils/formatters.ts';

interface AdminPortalProps {
  subjects: SubjectConfig[];
  onAdminAuthChange?: (isLoggedIn: boolean) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ subjects, onAdminAuthChange }) => {
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('examprep_admin_token');
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active Admin Tab
  const [adminTab, setAdminTab] = useState<'stats' | 'mcqs' | 'import' | 'papers' | 'provinces' | 'deployment'>('stats');

  // Stats & Attempts
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);

  // MCQs
  const [mcqList, setMcqList] = useState<MCQ[]>([]);
  const [mcqFilterExam, setMcqFilterExam] = useState<string>('ALL');
  const [editingMCQ, setEditingMCQ] = useState<MCQ | null>(null);
  const [isAddingMCQ, setIsAddingMCQ] = useState(false);

  // New MCQ Form State
  const [mcqForm, setMcqForm] = useState({
    examCategory: 'CSS' as ExamCategory,
    province: 'Punjab' as Province,
    subjectId: 'pakistan-affairs',
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctIndex: 0,
    explanation: '',
    topic: '',
    sourceYear: 'CSS 2024',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  });

  // Bulk Import
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ message: string; isError: boolean } | null>(null);

  // Past papers
  const [papersList, setPapersList] = useState<PastPaper[]>([]);
  const [isAddingPaper, setIsAddingPaper] = useState(false);
  const [paperForm, setPaperForm] = useState({
    examCategory: 'CSS' as ExamCategory,
    province: 'Punjab' as Province,
    subjectId: 'pakistan-affairs',
    subjectName: 'Pakistan Affairs',
    year: 2025,
    title: '',
    examType: 'FPSC CSS Written Examination',
    officialSource: 'Federal Public Service Commission (FPSC), Islamabad',
    officialSourceUrl: 'https://fpsc.gov.pk',
    isOfficialVerified: true,
    timeAllowed: '3 Hours',
    maximumMarks: 100,
    description: '',
    instructionText: 'Part-I (MCQs): 20 Marks. Part-II (Subjective): 80 Marks.',
    section1Title: 'Part II Subjective',
    section1Questions: 'Q2: Discuss the geo-economic priorities of Pakistan.\nQ3: Analyze constitutional federalism under the 18th Amendment.',
  });

  // Copy helpers
  const [copiedRule, setCopiedRule] = useState(false);

  // Check login state
  useEffect(() => {
    if (adminToken) {
      loadAdminData();
      onAdminAuthChange?.(true);
    } else {
      onAdminAuthChange?.(false);
    }
  }, [adminToken]);

  const loadAdminData = async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };

      // Load stats
      const statsRes = await fetch('/api/admin/stats', { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setRecentAttempts(statsData.recentAttempts || []);
      }

      // Load MCQs
      const mcqRes = await fetch('/api/admin/mcqs', { headers });
      if (mcqRes.ok) {
        const mcqData = await mcqRes.json();
        setMcqList(mcqData.mcqs || []);
      }

      // Load papers
      const paperRes = await fetch('/api/past-papers');
      if (paperRes.ok) {
        const paperData = await paperRes.json();
        setPapersList(paperData.papers || []);
      }
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setAdminToken(data.token);
      sessionStorage.setItem('examprep_admin_token', data.token);
      setPasswordInput('');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (adminToken) {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
      }
    } catch {
      // ignore
    }
    setAdminToken(null);
    sessionStorage.removeItem('examprep_admin_token');
  };

  // Add MCQ
  const handleSaveMCQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    try {
      const payload = {
        examCategory: mcqForm.examCategory,
        province: mcqForm.examCategory === 'PMS' ? mcqForm.province : undefined,
        subjectId: mcqForm.subjectId,
        question: mcqForm.question,
        options: [mcqForm.optionA, mcqForm.optionB, mcqForm.optionC, mcqForm.optionD],
        correctIndex: Number(mcqForm.correctIndex),
        explanation: mcqForm.explanation,
        topic: mcqForm.topic || 'General Topic',
        sourceYear: mcqForm.sourceYear || 'Recent Paper',
        difficulty: mcqForm.difficulty,
      };

      const res = await fetch('/api/admin/mcqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddingMCQ(false);
        setMcqForm({
          examCategory: 'CSS',
          province: 'Punjab',
          subjectId: 'pakistan-affairs',
          question: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctIndex: 0,
          explanation: '',
          topic: '',
          sourceYear: 'CSS 2024',
          difficulty: 'medium',
        });
        loadAdminData();
      }
    } catch (err) {
      console.error('Error saving MCQ:', err);
    }
  };

  // Delete MCQ
  const handleDeleteMCQ = async (id: string) => {
    if (!adminToken || !confirm('Are you sure you want to permanently delete this MCQ?')) return;
    try {
      const res = await fetch(`/api/admin/mcqs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        setMcqList((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      console.error('Error deleting MCQ:', err);
    }
  };

  // Bulk Import
  const handleBulkImport = async () => {
    if (!adminToken) return;
    try {
      let items: any[] = [];
      try {
        items = JSON.parse(bulkJsonText);
      } catch {
        setImportStatus({
          message: 'Invalid JSON syntax. Ensure it is a valid JSON array of objects.',
          isError: true,
        });
        return;
      }

      const res = await fetch('/api/admin/mcqs/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportStatus({ message: data.message, isError: false });
        setBulkJsonText('');
        loadAdminData();
      } else {
        setImportStatus({ message: data.error || 'Import failed', isError: true });
      }
    } catch (err: any) {
      setImportStatus({ message: err.message || 'Import error', isError: true });
    }
  };

  // Add Past Paper
  const handleSavePastPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    try {
      const questionsList = paperForm.section1Questions
        .split('\n')
        .map((q) => q.trim())
        .filter((q) => q.length > 0);

      const payload = {
        examCategory: paperForm.examCategory,
        province: paperForm.examCategory === 'PMS' ? paperForm.province : undefined,
        subjectId: paperForm.subjectId,
        subjectName: subjects.find((s) => s.id === paperForm.subjectId)?.name || paperForm.subjectName,
        year: Number(paperForm.year),
        title: paperForm.title,
        examType: paperForm.examType,
        officialSource: paperForm.officialSource,
        officialSourceUrl: paperForm.officialSourceUrl,
        isOfficialVerified: paperForm.isOfficialVerified,
        timeAllowed: paperForm.timeAllowed,
        maximumMarks: Number(paperForm.maximumMarks),
        description: paperForm.description,
        instructions: paperForm.instructionText.split('\n').filter((i) => i.trim().length > 0),
        sections: [
          {
            title: paperForm.section1Title,
            questions: questionsList,
          },
        ],
      };

      const res = await fetch('/api/admin/past-papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddingPaper(false);
        loadAdminData();
      }
    } catch (err) {
      console.error('Error saving past paper:', err);
    }
  };

  const handleDeletePaper = async (id: string) => {
    if (!adminToken || !confirm('Are you sure you want to delete this paper?')) return;
    try {
      const res = await fetch(`/api/admin/past-papers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        setPapersList((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting paper:', err);
    }
  };

  // Sample import JSON template
  const sampleImportJson = JSON.stringify(
    [
      {
        examCategory: 'CSS',
        subjectId: 'pakistan-affairs',
        question: 'Under which article of the 1973 Constitution is the National Finance Commission (NFC) established?',
        options: ['Article 160', 'Article 153', 'Article 175', 'Article 213'],
        correctIndex: 0,
        explanation: 'Article 160 of the Constitution of Pakistan empowers the President to constitute the NFC.',
        sourceYear: 'CSS 2024',
        topic: '1973 Constitution',
        difficulty: 'medium',
      },
      {
        examCategory: 'PMS',
        province: 'Punjab',
        subjectId: 'general-knowledge',
        question: 'Which is the largest barrage of Pakistan constructed on River Indus?',
        options: ['Sukkur Barrage', 'Guddu Barrage', 'Kotri Barrage', 'Taunsa Barrage'],
        correctIndex: 0,
        explanation: 'Sukkur Barrage (Lloyd Barrage) on River Indus is the largest irrigation barrage in Pakistan.',
        sourceYear: 'PMS Punjab 2023',
        topic: 'Pakistani Rivers & Barrages',
        difficulty: 'easy',
      },
    ],
    null,
    2
  );

  // ==========================================
  // VIEW: LOGIN GATE
  // ==========================================
  if (!adminToken) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-md mx-auto min-h-[70vh] flex items-center">
        <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-center text-slate-900 font-serif-heading">
            Administrator Authentication
          </h2>
          <p className="text-xs text-center text-slate-500 mt-1 mb-6">
            Authorized administrative access for question bank management, past papers, and provincial syllabi.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Administrator Password / Security Passcode
              </label>
              <input
                type="password"
                placeholder="Enter admin passcode"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Default credentials guidance box for review */}
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-blue-900 block flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Default Access Credentials:
              </span>
              <p className="text-[11px] text-slate-600">
                Passcode: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 font-mono text-blue-800 font-bold">AdminPakistan2026!</code>
              </p>
              <p className="text-[10px] text-slate-500">
                Can be overridden via <code>ADMIN_PASSWORD</code> environment variable.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-sm shadow-md"
            >
              {loading ? 'Authenticating...' : 'Access Administrator Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="py-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold font-serif-heading">Administrator Portal</h1>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  Session Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ExamPrep Pakistan Content Management & Candidate Audit Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAdminData}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800/60 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'stats', label: 'System Overview & Attempts', icon: BarChart3 },
            { id: 'mcqs', label: `MCQ Bank (${mcqList.length})`, icon: BookOpen },
            { id: 'import', label: 'Bulk Import (JSON)', icon: Upload },
            { id: 'papers', label: `Past Papers (${papersList.length})`, icon: FileText },
            { id: 'deployment', label: 'Database & Firebase Setup', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ==================================================== */}
        {/* TAB 1: OVERVIEW & AUDIT */}
        {/* ==================================================== */}
        {adminTab === 'stats' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-bold uppercase">Total MCQs in Bank</span>
                <div className="text-3xl font-extrabold text-blue-700 mt-1">
                  {stats?.totalMCQs || mcqList.length}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">CSS, PMS, PPSC, FPSC</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-bold uppercase">Past Papers (2021–25)</span>
                <div className="text-3xl font-extrabold text-indigo-700 mt-1">
                  {stats?.totalPastPapers || papersList.length}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Authentic Official Archives</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-bold uppercase">Tests Completed</span>
                <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                  {stats?.totalAttempts || recentAttempts.length}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Persistent Candidate Attempts</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-bold uppercase">Average Score</span>
                <div className="text-3xl font-extrabold text-amber-600 mt-1">
                  {stats?.averageScorePercentage || 72}%
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Overall Candidate Performance</span>
              </div>
            </div>

            {/* Recent Candidate Attempts Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Recent Candidate Submissions (Persistent Server Records)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Audit log of tests submitted and scored server-side.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Showing latest {recentAttempts.length}
                </span>
              </div>

              {recentAttempts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No candidate attempts recorded yet. Take a test from the MCQs Practice tab to generate persistent records!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-3 px-4">Ref Code</th>
                        <th className="py-3 px-4">Candidate Name</th>
                        <th className="py-3 px-4">Exam / Stream</th>
                        <th className="py-3 px-4">Subject</th>
                        <th className="py-3 px-4 text-center">Score</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Date Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentAttempts.map((att) => (
                        <tr key={att.referenceCode} className="hover:bg-slate-50/70">
                          <td className="py-3 px-4 font-mono font-bold text-blue-700">
                            {att.referenceCode}
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {att.studentName}
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            <span className="px-2 py-0.5 rounded font-bold text-xs bg-slate-100 border border-slate-200">
                              {att.examCategory}
                            </span>
                            {att.province && (
                              <span className="text-xs text-slate-500 ml-1">({att.province})</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-700">{att.subjectName}</td>
                          <td className="py-3 px-4 text-center font-bold text-blue-700">
                            {att.percentage}% ({att.correctCount}/{att.totalQuestions})
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                att.passed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {att.passed ? 'Qualified' : 'Revise'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-xs">
                            {formatDate(att.completedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: MCQ MANAGEMENT */}
        {/* ==================================================== */}
        {adminTab === 'mcqs' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Filter Exam:</span>
                {(['ALL', 'CSS', 'PMS', 'PPSC', 'FPSC'] as const).map((ex) => (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => setMcqFilterExam(ex)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                      mcqFilterExam === ex
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsAddingMCQ(true)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Single MCQ</span>
              </button>
            </div>

            {/* Add MCQ Form Modal */}
            {isAddingMCQ && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto my-auto">
                  <div className="flex justify-between items-center mb-4 pb-3 border-b">
                    <h3 className="text-lg font-bold text-slate-900">Add New MCQ to Bank</h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingMCQ(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveMCQ} className="space-y-4 text-xs sm:text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Target Exam</label>
                        <select
                          value={mcqForm.examCategory}
                          onChange={(e) =>
                            setMcqForm({ ...mcqForm, examCategory: e.target.value as any })
                          }
                          className="w-full p-2 rounded-xl border border-slate-300"
                        >
                          <option value="CSS">CSS (FPSC)</option>
                          <option value="PMS">PMS (Provincial)</option>
                          <option value="PPSC">PPSC (Punjab)</option>
                          <option value="FPSC">FPSC (Federal)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Subject</label>
                        <select
                          value={mcqForm.subjectId}
                          onChange={(e) => setMcqForm({ ...mcqForm, subjectId: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-300"
                        >
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Question Statement <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={3}
                        value={mcqForm.question}
                        onChange={(e) => setMcqForm({ ...mcqForm, question: e.target.value })}
                        placeholder="Enter the complete question text..."
                        className="w-full p-3 rounded-xl border border-slate-300"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Option A</label>
                        <input
                          type="text"
                          value={mcqForm.optionA}
                          onChange={(e) => setMcqForm({ ...mcqForm, optionA: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Option B</label>
                        <input
                          type="text"
                          value={mcqForm.optionB}
                          onChange={(e) => setMcqForm({ ...mcqForm, optionB: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Option C</label>
                        <input
                          type="text"
                          value={mcqForm.optionC}
                          onChange={(e) => setMcqForm({ ...mcqForm, optionC: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300"
                          required
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Option D</label>
                        <input
                          type="text"
                          value={mcqForm.optionD}
                          onChange={(e) => setMcqForm({ ...mcqForm, optionD: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-300"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Correct Option (0-3)
                        </label>
                        <select
                          value={mcqForm.correctIndex}
                          onChange={(e) =>
                            setMcqForm({ ...mcqForm, correctIndex: Number(e.target.value) })
                          }
                          className="w-full p-2 rounded-xl border border-slate-300 font-bold"
                        >
                          <option value={0}>Option A is Correct</option>
                          <option value={1}>Option B is Correct</option>
                          <option value={2}>Option C is Correct</option>
                          <option value={3}>Option D is Correct</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Exam / Year Source</label>
                        <input
                          type="text"
                          value={mcqForm.sourceYear}
                          onChange={(e) => setMcqForm({ ...mcqForm, sourceYear: e.target.value })}
                          placeholder="e.g. CSS 2024, PMS 2023"
                          className="w-full p-2 rounded-xl border border-slate-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Authoritative Explanation
                      </label>
                      <textarea
                        rows={2}
                        value={mcqForm.explanation}
                        onChange={(e) => setMcqForm({ ...mcqForm, explanation: e.target.value })}
                        placeholder="Explain why the option is correct based on curriculum..."
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => setIsAddingMCQ(false)}
                        className="px-4 py-2 rounded-xl border text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      >
                        Save MCQ to Database
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List MCQs */}
            <div className="space-y-3">
              {mcqList
                .filter((m) => mcqFilterExam === 'ALL' || m.examCategory === mcqFilterExam)
                .map((mcq, idx) => (
                  <div
                    key={mcq.id}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm space-y-2 hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                          {mcq.examCategory}
                        </span>
                        <span className="text-slate-500 font-semibold">{mcq.subjectId}</span>
                        {mcq.sourceYear && (
                          <span className="text-slate-400 font-mono text-[11px]">
                            • {mcq.sourceYear}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteMCQ(mcq.id)}
                        className="text-rose-600 hover:text-rose-700 p-1 rounded"
                        title="Delete question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="font-semibold text-slate-900 leading-snug">
                      #{idx + 1}. {mcq.question}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                      {mcq.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className={`p-1.5 px-2 rounded-lg border ${
                            oIdx === mcq.correctIndex
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          {['A', 'B', 'C', 'D'][oIdx]}: {opt}
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <strong>Explanation:</strong> {mcq.explanation}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: BULK IMPORT */}
        {/* ==================================================== */}
        {adminTab === 'import' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Bulk Import MCQs (JSON Array)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Paste a JSON array of questions to add dozens of MCQs at once.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkJsonText(sampleImportJson)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Load Sample Template</span>
                </button>
              </div>

              <textarea
                rows={10}
                placeholder="[ { ... }, { ... } ]"
                value={bulkJsonText}
                onChange={(e) => setBulkJsonText(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 font-mono text-xs text-slate-900 bg-slate-50 focus:bg-white"
              />

              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-xs sm:text-sm flex items-center gap-2 ${
                    importStatus.isError
                      ? 'bg-rose-50 text-rose-800 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {importStatus.isError ? (
                    <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={!bulkJsonText.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm shadow-md"
                >
                  Validate & Import Questions
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: PAST PAPERS MANAGER */}
        {/* ==================================================== */}
        {adminTab === 'papers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900">Manage 2021–2025 Past Papers</h3>
                <p className="text-xs text-slate-500">Official archives and syllabus structures</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingPaper(true)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Past Paper</span>
              </button>
            </div>

            {/* List Papers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {papersList.map((p) => (
                <div
                  key={p.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {p.examCategory} • {p.year}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePaper(p.id)}
                        className="text-rose-600 hover:text-rose-700 p-1"
                        title="Delete paper"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{p.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{p.officialSource}</p>
                    <div className="text-xs text-slate-600 mt-2 line-clamp-2">{p.description}</div>
                  </div>

                  <div className="pt-3 border-t text-xs text-slate-500 flex justify-between">
                    <span>Marks: {p.maximumMarks}</span>
                    <span>Time: {p.timeAllowed}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: DATABASE & DEPLOYMENT GUIDANCE (FIREBASE) */}
        {/* ==================================================== */}
        {adminTab === 'deployment' && (
          <div className="space-y-6">
            {/* Built-in Status */}
            <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-emerald-900">
                    Active Storage: Persistent Server Database Active
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Currently utilizing atomic filesystem persistence at <code>data/examprep_db.json</code>. All student attempts, MCQs, and past papers survive server restarts and rebuilds.
                  </p>
                </div>
              </div>
            </div>

            {/* Firebase Firestore Setup Guidance */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase mb-2">
                  <Database className="w-3.5 h-3.5 text-amber-600" />
                  Firebase Firestore Enterprise Configuration
                </div>
                <h3 className="text-xl font-bold text-slate-900 font-serif-heading">
                  Firestore Integration & Security Architecture
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Follow these instructions to connect Google Cloud Firebase Firestore for global multi-region persistence and security rule enforcement.
                </p>
              </div>

              {/* Step by Step */}
              <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 font-bold block">
                    Step 1: Firebase Project Creation
                  </strong>
                  <p>
                    Go to the Firebase Console (<code>console.firebase.google.com</code>) and create a project named <strong>examprep-pakistan</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <strong className="text-slate-900 font-bold block">
                    Step 2: Provision Firestore Database & Schema Collections
                  </strong>
                  <p>
                    Create the Cloud Firestore database in native mode with these four primary collections:
                  </p>
                  <ul className="list-disc pl-5 text-slate-600 space-y-1 mt-1 font-mono text-xs">
                    <li><code>attempts</code>: stores student test results with reference code, score, breakdown.</li>
                    <li><code>mcqs</code>: question bank indexed by examCategory and subjectId.</li>
                    <li><code>past_papers</code>: 2021-2025 examination archive.</li>
                    <li><code>config</code>: provincial syllabi settings.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 font-bold block">
                      Step 3: Secure Firestore Rules (`firestore.rules`)
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Student attempts: Can be created by any student, but read ONLY by exact reference match
    match /attempts/{attemptId} {
      allow create: if request.resource.data.studentName is string && request.resource.data.referenceCode is string;
      allow read: if request.auth != null || (request.query.limit <= 1);
      allow update, delete: if request.auth != null && request.auth.token.admin == true;
    }
    // MCQs and Past Papers: Public read, Admin write
    match /mcqs/{mcqId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /past_papers/{paperId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}`);
                        setCopiedRule(true);
                        setTimeout(() => setCopiedRule(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-xs font-semibold flex items-center gap-1"
                    >
                      {copiedRule ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedRule ? 'Copied' : 'Copy Rules'}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] overflow-x-auto font-mono">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /attempts/{attemptId} {
      allow create: if request.resource.data.studentName is string;
      allow read: if request.auth != null;
    }
    match /mcqs/{mcqId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    match /past_papers/{paperId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
