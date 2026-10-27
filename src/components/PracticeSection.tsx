import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Printer,
  Copy,
  Check,
  Flag,
  Share2,
  Award,
  ChevronRight,
  Sliders,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  ExamCategory,
  Province,
  SubjectConfig,
  QuestionClientView,
  StudentAttemptRecord,
  AttemptAnswerInput,
} from '../types/index.ts';
import { formatTime, formatDate, getExamFullName } from '../utils/formatters.ts';

interface PracticeSectionProps {
  subjects: SubjectConfig[];
  initialExam?: ExamCategory;
  initialSubjectId?: string;
  initialProvince?: Province;
  onNavigateToCheckResult?: () => void;
}

type TestMode = 'quick' | 'standard' | 'mock' | 'untimed';

export const PracticeSection: React.FC<PracticeSectionProps> = ({
  subjects,
  initialExam = 'CSS',
  initialSubjectId,
  initialProvince = 'Punjab',
  onNavigateToCheckResult,
}) => {
  // Config state
  const [studentName, setStudentName] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamCategory>(initialExam);
  const [selectedProvince, setSelectedProvince] = useState<Province>(initialProvince);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || 'all');
  const [testMode, setTestMode] = useState<TestMode>('standard');
  const [nameError, setNameError] = useState('');

  // Active Test state
  const [testState, setTestState] = useState<'config' | 'testing' | 'confirming' | 'result'>('config');
  const [questions, setQuestions] = useState<QuestionClientView[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number | null>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [timeTakenTotal, setTimeTakenTotal] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Result state
  const [attemptResult, setAttemptResult] = useState<StudentAttemptRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct' | 'unanswered'>('all');

  // Filter subjects strictly relevant to selected exam
  const relevantSubjects = subjects.filter((s) => s.examCategories.includes(selectedExam));

  // Auto-update subject if not relevant
  useEffect(() => {
    if (selectedSubjectId !== 'all') {
      const isStillValid = relevantSubjects.some((s) => s.id === selectedSubjectId);
      if (!isStillValid) {
        setSelectedSubjectId(relevantSubjects[0]?.id || 'all');
      }
    }
  }, [selectedExam, relevantSubjects, selectedSubjectId]);

  // Sync initial props
  useEffect(() => {
    if (initialExam) setSelectedExam(initialExam);
    if (initialSubjectId) setSelectedSubjectId(initialSubjectId);
    if (initialProvince) setSelectedProvince(initialProvince);
  }, [initialExam, initialSubjectId, initialProvince]);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (testState === 'testing' && !isTimerPaused) {
      interval = setInterval(() => {
        setTimeTakenTotal((prev) => prev + 1);

        if (testMode !== 'untimed') {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              // Time's up - auto submit
              handleFinalSubmit();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testState, isTimerPaused, testMode]);

  // Start Test Handler
  const handleStartTest = async () => {
    if (!studentName.trim()) {
      setNameError('Please enter your full name before beginning.');
      return;
    }
    setNameError('');
    setLoading(true);
    setErrorMsg('');

    try {
      let limit = 20;
      let initialTimerSeconds = 20 * 60;

      if (testMode === 'quick') {
        limit = 10;
        initialTimerSeconds = 10 * 60;
      } else if (testMode === 'standard') {
        limit = 20;
        initialTimerSeconds = 20 * 60;
      } else if (testMode === 'mock') {
        limit = 40;
        initialTimerSeconds = 40 * 60;
      } else if (testMode === 'untimed') {
        limit = 20;
        initialTimerSeconds = 0;
      }

      const params = new URLSearchParams({
        examCategory: selectedExam,
        limit: String(limit),
        mode: testMode,
      });

      if (selectedSubjectId !== 'all') {
        params.append('subjectId', selectedSubjectId);
      }
      if (selectedExam === 'PMS') {
        params.append('province', selectedProvince);
      }

      const res = await fetch(`/api/mcqs?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Could not load test questions from server.');
      }
      const data = await res.json();

      if (!data.questions || data.questions.length === 0) {
        throw new Error('No questions found for the selected criteria. Try another subject.');
      }

      setQuestions(data.questions);
      setSelectedAnswers({});
      setFlaggedQuestions(new Set());
      setCurrentIdx(0);
      setSecondsRemaining(initialTimerSeconds);
      setTimeTakenTotal(0);
      setTestState('testing');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error starting test');
    } finally {
      setLoading(false);
    }
  };

  // Option selection
  const handleSelectOption = (qId: string, optIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optIndex,
    }));
  };

  // Clear choice
  const handleClearChoice = (qId: string) => {
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  // Toggle flag
  const handleToggleFlag = (qId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // Final Server Submission
  const handleFinalSubmit = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const answersPayload: AttemptAnswerInput[] = questions.map((q) => ({
        questionId: q.id,
        selectedIndex: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : null,
      }));

      const res = await fetch('/api/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName.trim(),
          examCategory: selectedExam,
          province: selectedExam === 'PMS' ? selectedProvince : undefined,
          subjectId: selectedSubjectId,
          practiceMode: testMode,
          timeTakenSeconds: timeTakenTotal,
          answers: answersPayload,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server submission error');
      }

      const data = await res.json();
      setAttemptResult(data.attempt);
      setTestState('result');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit test');
      setTestState('testing');
    } finally {
      setLoading(false);
    }
  };

  // Copy Reference Code
  const handleCopyCode = () => {
    if (attemptResult?.referenceCode) {
      navigator.clipboard.writeText(attemptResult.referenceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Print Scorecard
  const handlePrintScorecard = () => {
    window.print();
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = questions.length - answeredCount;
  const flaggedCount = flaggedQuestions.size;
  const currentQ = questions[currentIdx];

  // ==========================================
  // VIEW 1: PRE-TEST CONFIGURATION
  // ==========================================
  if (testState === 'config') {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-6 sm:p-8 text-white border-b border-blue-950">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Direct Student Entry (No Login Required)
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-heading">
              Competitive Exam Practice Portal
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Enter your candidate name, choose your target commission stream, select your subject, and start practicing verified MCQs with instant server-side scoring.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {errorMsg && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Candidate Name Input */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Candidate Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Muhammad Ali, Ayesha Khan, Bilal Ahmed"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  if (nameError) setNameError('');
                }}
                className={`w-full px-4 py-3 rounded-xl border text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  nameError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-white'
                }`}
              />
              {nameError ? (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{nameError}</p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  No password required. Used on your official Result Card and Verification lookup.
                </p>
              )}
            </div>

            {/* Exam Category Selector */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">
                Target Examination Commission <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['CSS', 'PMS', 'PPSC', 'FPSC'] as ExamCategory[]).map((exam) => (
                  <button
                    key={exam}
                    type="button"
                    onClick={() => setSelectedExam(exam)}
                    className={`py-3 px-4 rounded-xl text-center border font-bold text-sm transition-all ${
                      selectedExam === exam
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-base">{exam}</div>
                    <div className="text-[10px] font-normal opacity-80 mt-0.5">
                      {exam === 'CSS' && 'FPSC Federal'}
                      {exam === 'PMS' && 'Provincial Cadre'}
                      {exam === 'PPSC' && 'Punjab Commission'}
                      {exam === 'FPSC' && 'General Recruitment'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* If PMS: Provincial Syllabus Selector */}
            {selectedExam === 'PMS' && (
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800">
                    Select Provincial PMS Syllabus:
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300">
                    {selectedProvince} PMS Active
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Punjab', 'Sindh', 'KPK', 'Balochistan'] as Province[]).map((prov) => (
                    <button
                      key={prov}
                      type="button"
                      onClick={() => setSelectedProvince(prov)}
                      className={`text-xs py-2 px-3 rounded-xl font-semibold transition-all ${
                        selectedProvince === prov
                          ? 'bg-blue-700 text-white shadow-sm'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {prov} PMS
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subject Selector (Dynamically Filtered!) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-slate-800">
                  Select Subject <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  Showing only subjects relevant to {selectedExam}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setSelectedSubjectId('all')}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    selectedSubjectId === 'all'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                      : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="text-sm font-semibold">Comprehensive Mixed Mock</div>
                    <div className="text-[11px] opacity-80">All {selectedExam} subjects combined</div>
                  </div>
                  <Sparkles className="w-4 h-4 opacity-75" />
                </button>

                {relevantSubjects.map((s) => {
                  const classification = s.classificationByExam[selectedExam] || 'screening';
                  const isSelected = selectedSubjectId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSubjectId(s.id)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-sm font-bold">{s.name}</span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                            isSelected
                              ? 'bg-white/20 text-white border-white/30'
                              : classification === 'compulsory'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : 'bg-blue-100 text-blue-800 border-blue-300'
                          }`}
                        >
                          {classification === 'compulsory' ? 'Compulsory' : 'Screening'}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] line-clamp-1 ${
                          isSelected ? 'text-blue-100' : 'text-slate-500'
                        }`}
                      >
                        {s.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Practice Mode */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">
                Practice Mode & Duration
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setTestMode('quick')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    testMode === 'quick'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-bold">Quick Drill</div>
                  <div className="text-xs opacity-80">10 MCQs • 10 Mins</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTestMode('standard')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    testMode === 'standard'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-bold">Standard Test</div>
                  <div className="text-xs opacity-80">20 MCQs • 20 Mins</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTestMode('mock')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    testMode === 'mock'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-bold">Full Mock</div>
                  <div className="text-xs opacity-80">40 MCQs • 40 Mins</div>
                </button>

                <button
                  type="button"
                  onClick={() => setTestMode('untimed')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    testMode === 'untimed'
                      ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-sm font-bold">Untimed Study</div>
                  <div className="text-xs opacity-80">Practice at leisure</div>
                </button>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                Attempt results are securely stored and retrievable via <span className="font-semibold text-slate-700">Check My Result</span> anytime.
              </div>
              <button
                type="button"
                onClick={handleStartTest}
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-base"
              >
                {loading ? (
                  <span>Preparing Examination...</span>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5" />
                    <span>Begin Examination</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE EXAMINATION INTERFACE
  // ==========================================
  if (testState === 'testing' || testState === 'confirming') {
    return (
      <div className="min-h-screen bg-slate-100 py-6 px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Top Exam Header Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase">
                  {selectedExam} Examination
                </span>
                {selectedExam === 'PMS' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    {selectedProvince}
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  Candidate: <strong className="text-white">{studentName}</strong>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-serif-heading">
                {selectedSubjectId === 'all'
                  ? 'Comprehensive Mixed Test'
                  : relevantSubjects.find((s) => s.id === selectedSubjectId)?.name || 'Subject Test'}
              </h2>
            </div>

            {/* Timer Display */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-base sm:text-lg font-bold border ${
                  testMode === 'untimed'
                    ? 'bg-slate-800 text-slate-300 border-slate-700'
                    : secondsRemaining < 180
                    ? 'bg-rose-950/80 text-rose-300 border-rose-500 animate-pulse'
                    : 'bg-blue-950/80 text-blue-200 border-blue-600'
                }`}
              >
                <Clock className="w-5 h-5 text-blue-400" />
                <span>
                  {testMode === 'untimed' ? formatTime(timeTakenTotal) : formatTime(secondsRemaining)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setTestState('confirming')}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md active:scale-95 transition-all"
              >
                Submit Test
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Main Question Card */}
          {currentQ && (
            <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200">
              {/* Question metadata */}
              <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  {currentQ.sourceYear && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {currentQ.sourceYear}
                    </span>
                  )}
                  {currentQ.topic && (
                    <span className="text-xs text-slate-500 hidden sm:inline-block">
                      • {currentQ.topic}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQ.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      flaggedQuestions.has(currentQ.id)
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-500" />
                    <span>{flaggedQuestions.has(currentQ.id) ? 'Flagged' : 'Flag'}</span>
                  </button>

                  {selectedAnswers[currentQ.id] !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleClearChoice(currentQ.id)}
                      className="text-xs text-slate-500 hover:text-rose-600 font-medium px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Question Statement */}
              <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed mb-6">
                {currentQ.question}
              </div>

              {/* 4 Options */}
              <div className="space-y-3">
                {currentQ.options.map((optionText, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIdx;
                  const optionLetters = ['A', 'B', 'C', 'D'];

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQ.id, optIdx)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {optionLetters[optIdx]}
                      </div>
                      <div className="text-sm sm:text-base text-slate-800 font-medium pt-0.5 leading-snug">
                        {optionText}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Card Navigation Actions */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((prev) => prev - 1)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 border transition-all ${
                    currentIdx === 0
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs font-semibold text-slate-500">
                  Answered: <strong className="text-blue-700">{answeredCount}</strong> / {questions.length}
                </div>

                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentIdx((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2 shadow-sm transition-all"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTestState('confirming')}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-sm transition-all"
                  >
                    <span>Finalize Test</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Question Grid Palette Drawer */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Question Quick-Navigate
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
                  Answered ({answeredCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" />
                  Flagged ({flaggedCount})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-slate-200 inline-block" />
                  Unanswered ({unansweredCount})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIdx;
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(q.id);

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-lg text-xs font-bold transition-all relative ${
                      isCurrent ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                    } ${
                      isAnswered
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submission Confirmation Modal */}
          {testState === 'confirming' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-center text-slate-900 mb-2 font-serif-heading">
                  Submit Examination?
                </h3>

                <p className="text-xs sm:text-sm text-center text-slate-600 mb-6">
                  Candidate: <strong className="text-slate-900">{studentName}</strong>
                </p>

                <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-6 border border-slate-200 text-xs sm:text-sm">
                  <div className="flex justify-between text-slate-700">
                    <span>Total Questions:</span>
                    <strong className="text-slate-900">{questions.length}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-700">
                    <span>Answered:</span>
                    <strong className="font-bold">{answeredCount}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Unanswered:</span>
                    <strong className={unansweredCount > 0 ? 'text-amber-600 font-bold' : ''}>
                      {unansweredCount}
                    </strong>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Flagged for Review:</span>
                    <strong>{flaggedCount}</strong>
                  </div>
                </div>

                {unansweredCount > 0 && (
                  <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200 mb-5">
                    Note: You have {unansweredCount} question(s) unattempted. They will be marked as unanswered.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTestState('testing')}
                    className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 transition-colors"
                  >
                    Return to Test
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <span>Calculating...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Score</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: RESULT SCORECARD & REVIEW
  // ==========================================
  if (testState === 'result' && attemptResult) {
    const isPass = attemptResult.passed;

    const filteredAnswers = attemptResult.answers.filter((a) => {
      if (reviewFilter === 'correct') return a.isCorrect;
      if (reviewFilter === 'incorrect') return !a.isCorrect && a.selectedIndex !== null;
      if (reviewFilter === 'unanswered') return a.selectedIndex === null;
      return true;
    });

    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Action Bar (Print / Retake) */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Result permanently saved to server database</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintScorecard}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition-all flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setTestState('config')}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Another</span>
              </button>
            </div>
          </div>

          {/* The Scorecard (Rendered both in screen and custom print layout) */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print-card">
            {/* Academic Certificate Header */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 text-center border-b border-blue-900 relative">
              <div className="inline-block p-2 rounded-xl bg-blue-600/30 border border-blue-400/30 mb-2">
                <Award className="w-8 h-8 text-amber-400 mx-auto" />
              </div>
              <h1 className="text-xl sm:text-3xl font-extrabold font-serif-heading">
                ExamPrep Pakistan Official Scorecard
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Competitive Examination Performance Assessment Report
              </p>

              {/* Private Reference Code Badge */}
              <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900/60 border border-blue-400/40 text-blue-200 text-xs sm:text-sm font-mono font-bold">
                <span>Result Reference Code:</span>
                <span className="text-amber-300 text-base">{attemptResult.referenceCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="no-print p-1 hover:text-white rounded"
                  title="Copy reference code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Keep this reference code and your candidate name to verify your result on the Check My Result page.
              </p>
            </div>

            {/* Candidate & Exam Metadata Grid */}
            <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/60">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">Candidate Name</span>
                  <span className="font-bold text-slate-900 text-base">{attemptResult.studentName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">Target Examination</span>
                  <span className="font-bold text-slate-900">
                    {getExamFullName(attemptResult.examCategory)}
                  </span>
                  {attemptResult.province && (
                    <span className="text-xs text-blue-700 block font-semibold">
                      {attemptResult.province} Province
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">Subject</span>
                  <span className="font-bold text-slate-900">{attemptResult.subjectName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">Assessment Date</span>
                  <span className="font-semibold text-slate-800">{formatDate(attemptResult.completedAt)}</span>
                  <span className="text-xs text-slate-500 block">
                    Duration: {formatTime(attemptResult.timeTakenSeconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Scores & Statistics */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Score & Percentage */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-500 uppercase">Score / Percentage</span>
                  <div className="text-3xl font-extrabold text-blue-700 mt-1">
                    {attemptResult.percentage}%
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mt-0.5">
                    {attemptResult.correctCount} / {attemptResult.totalQuestions} Marks
                  </div>
                </div>

                {/* Correct */}
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-center">
                  <span className="text-xs font-bold text-emerald-700 uppercase">Correct Answers</span>
                  <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                    {attemptResult.correctCount}
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 mt-0.5">Verified Accurate</div>
                </div>

                {/* Incorrect */}
                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-200 text-center">
                  <span className="text-xs font-bold text-rose-700 uppercase">Incorrect</span>
                  <div className="text-3xl font-extrabold text-rose-700 mt-1">
                    {attemptResult.incorrectCount}
                  </div>
                  <div className="text-xs font-semibold text-rose-600 mt-0.5">Areas for Revision</div>
                </div>

                {/* Unanswered */}
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-center">
                  <span className="text-xs font-bold text-amber-700 uppercase">Unanswered</span>
                  <div className="text-3xl font-extrabold text-amber-700 mt-1">
                    {attemptResult.unansweredCount}
                  </div>
                  <div className="text-xs font-semibold text-amber-600 mt-0.5">Skipped Questions</div>
                </div>
              </div>

              {/* Status Outcome Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 mb-8 ${
                  isPass
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isPass ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-7 h-7 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="text-base font-extrabold">
                      {isPass ? 'Examination Qualified / Benchmark Cleared' : 'Needs Reinforcement (< 50%)'}
                    </h4>
                    <p className="text-xs opacity-90">
                      {isPass
                        ? 'Congratulations! Your score meets the competitive qualifying threshold. Review the answer explanations below to consolidate your preparation.'
                        : 'Your performance demonstrates understanding, but requires additional revision of core concepts. Check the detailed explanations below.'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                      isPass
                        ? 'bg-emerald-600 text-white border-emerald-700'
                        : 'bg-amber-600 text-white border-amber-700'
                    }`}
                  >
                    {isPass ? 'Passed' : 'Revise'}
                  </span>
                </div>
              </div>

              {/* Question By Question Review Filter (Screen Only) */}
              <div className="no-print mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    Question-by-Question Detailed Review
                  </h3>

                  <div className="flex gap-1.5">
                    {(
                      [
                        { id: 'all', label: `All (${attemptResult.answers.length})` },
                        { id: 'incorrect', label: `Incorrect (${attemptResult.incorrectCount})` },
                        { id: 'correct', label: `Correct (${attemptResult.correctCount})` },
                        { id: 'unanswered', label: `Unanswered (${attemptResult.unansweredCount})` },
                      ] as const
                    ).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setReviewFilter(f.id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                          reviewFilter === f.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Answers Detailed List */}
              <div className="space-y-4">
                {filteredAnswers.map((item, index) => {
                  const letters = ['A', 'B', 'C', 'D'];
                  const statusColor = item.isCorrect
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : item.selectedIndex === null
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-rose-300 bg-rose-50/30';

                  return (
                    <div
                      key={item.questionId}
                      className={`p-4 sm:p-5 rounded-2xl border ${statusColor} space-y-3`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold text-slate-700">
                          Question #{index + 1}
                        </span>
                        <div>
                          {item.isCorrect ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Correct (+1)
                            </span>
                          ) : item.selectedIndex === null ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                              Unanswered (0)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              Incorrect (0)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-sm sm:text-base font-semibold text-slate-900">
                        {item.question}
                      </div>

                      {/* Options preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        {item.options.map((optText, oIdx) => {
                          const isChosen = item.selectedIndex === oIdx;
                          const isOfficialCorrect = item.correctIndex === oIdx;

                          let optStyle = 'border-slate-200 bg-white text-slate-700';
                          if (isOfficialCorrect) {
                            optStyle = 'border-emerald-500 bg-emerald-100 text-emerald-900 font-bold';
                          } else if (isChosen && !item.isCorrect) {
                            optStyle = 'border-rose-400 bg-rose-100 text-rose-900 font-bold';
                          }

                          return (
                            <div
                              key={oIdx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${optStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-[11px] bg-slate-200/80">
                                  {letters[oIdx]}
                                </span>
                                <span>{optText}</span>
                              </div>
                              {isOfficialCorrect && (
                                <span className="text-[10px] text-emerald-800 uppercase font-extrabold">
                                  Correct
                                </span>
                              )}
                              {isChosen && !isOfficialCorrect && (
                                <span className="text-[10px] text-rose-800 uppercase font-extrabold">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Authoritative Explanation */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700">
                        <strong className="text-blue-900 block mb-1">Official Explanation:</strong>
                        <p>{item.explanation}</p>
                        {item.topic && (
                          <div className="text-[11px] text-slate-500 mt-1">Topic: {item.topic}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Print Certificate Footer (Print layout) */}
              <div className="print-only mt-8 pt-6 border-t border-slate-300 text-center text-xs text-slate-500">
                <p>ExamPrep Pakistan • Verified Academic Examination Portal</p>
                <p>Authentic Result Verification Code: {attemptResult.referenceCode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
