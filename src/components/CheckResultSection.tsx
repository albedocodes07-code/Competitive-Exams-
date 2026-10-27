import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Printer,
  Copy,
  Check,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { StudentAttemptRecord } from '../types/index.ts';
import { formatTime, formatDate, getExamFullName } from '../utils/formatters.ts';

interface CheckResultSectionProps {
  onStartNewPractice?: () => void;
}

export const CheckResultSection: React.FC<CheckResultSectionProps> = ({ onStartNewPractice }) => {
  const [studentName, setStudentName] = useState('');
  const [referenceCode, setReferenceCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedResult, setVerifiedResult] = useState<StudentAttemptRecord | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'incorrect' | 'correct' | 'unanswered'>('all');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !referenceCode.trim()) {
      setErrorMessage('Please provide both your Student Full Name and Result Reference Code.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setVerifiedResult(null);

    try {
      const res = await fetch('/api/attempts/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName.trim(),
          referenceCode: referenceCode.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify examination result.');
      }

      setVerifiedResult(data.result);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'No record matched. Verify the candidate name and reference code.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (verifiedResult?.referenceCode) {
      navigator.clipboard.writeText(verifiedResult.referenceCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-3">
            <Search className="w-3.5 h-3.5 text-blue-600" />
            Verification Portal
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-heading">
            Check My Examination Result
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600">
            Retrieve your persistent examination score, accuracy breakdown, and verified performance report using your private reference code.
          </p>
        </div>

        {/* Verification Form Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Candidate Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Muhammad Ali"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Must match the name entered during the test
                </span>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5">
                  Result Reference Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. EP-2026-A1B2C"
                  value={referenceCode}
                  onChange={(e) => setReferenceCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Found on your test submission confirmation
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Server-side verification strictly protects candidate privacy</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-md shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <span>Verifying Record...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Verify & Retrieve Result</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Verified Result Display */}
        {verifiedResult && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden print-card animate-in fade-in slide-in-from-bottom-4">
            {/* Action Bar */}
            <div className="no-print p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-800 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Candidate Record Verified Authentically</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Scorecard PDF</span>
                </button>
              </div>
            </div>

            {/* Academic Certificate Header */}
            <div className="bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 text-center border-b border-blue-900">
              <Award className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <h3 className="text-xl sm:text-2xl font-bold font-serif-heading">
                ExamPrep Pakistan Scorecard
              </h3>
              <p className="text-xs text-slate-300 mt-1">Official Candidate Assessment Certificate</p>

              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-900/60 border border-blue-400/40 text-blue-200 text-xs sm:text-sm font-mono">
                <span>Reference:</span>
                <span className="text-amber-300 font-bold">{verifiedResult.referenceCode}</span>
                <button type="button" onClick={handleCopyCode} className="no-print p-0.5 hover:text-white">
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Candidate & Metadata */}
            <div className="p-6 bg-slate-50/70 border-b border-slate-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">Candidate</span>
                  <strong className="text-slate-900 text-base">{verifiedResult.studentName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">Exam Stream</span>
                  <strong className="text-slate-900">{getExamFullName(verifiedResult.examCategory)}</strong>
                  {verifiedResult.province && (
                    <span className="text-xs text-blue-700 block font-semibold">
                      {verifiedResult.province} PMS
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">Subject</span>
                  <strong className="text-slate-900">{verifiedResult.subjectName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">Date & Time</span>
                  <span className="text-slate-800 font-medium">{formatDate(verifiedResult.completedAt)}</span>
                  <span className="text-xs text-slate-500 block">
                    Duration: {formatTime(verifiedResult.timeTakenSeconds)}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs text-slate-500 uppercase font-bold">Score</span>
                  <div className="text-3xl font-extrabold text-blue-700 mt-1">
                    {verifiedResult.percentage}%
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    {verifiedResult.correctCount} / {verifiedResult.totalQuestions} Marks
                  </div>
                </div>

                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                  <span className="text-xs text-emerald-700 uppercase font-bold">Correct</span>
                  <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                    {verifiedResult.correctCount}
                  </div>
                  <div className="text-xs text-emerald-600 font-semibold">Accurate</div>
                </div>

                <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
                  <span className="text-xs text-rose-700 uppercase font-bold">Incorrect</span>
                  <div className="text-3xl font-extrabold text-rose-700 mt-1">
                    {verifiedResult.incorrectCount}
                  </div>
                  <div className="text-xs text-rose-600 font-semibold">Errors</div>
                </div>

                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
                  <span className="text-xs text-amber-700 uppercase font-bold">Unanswered</span>
                  <div className="text-3xl font-extrabold text-amber-700 mt-1">
                    {verifiedResult.unansweredCount}
                  </div>
                  <div className="text-xs text-amber-600 font-semibold">Skipped</div>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-4 mb-8 ${
                  verifiedResult.passed
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold">
                      {verifiedResult.passed ? 'Benchmark Qualified (Pass)' : 'Needs Improvement'}
                    </h4>
                    <p className="text-xs opacity-90">
                      Minimum qualification benchmark is 50% for standard screening tests.
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    verifiedResult.passed ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}
                >
                  {verifiedResult.passed ? 'Pass' : 'Revise'}
                </span>
              </div>

              {/* Detailed Breakdown Filter & List */}
              <div className="no-print flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-900">Response Verification Sheet</h4>
                <div className="flex gap-1.5">
                  {(
                    [
                      { id: 'all', label: `All (${verifiedResult.answers.length})` },
                      { id: 'incorrect', label: `Incorrect (${verifiedResult.incorrectCount})` },
                      { id: 'correct', label: `Correct (${verifiedResult.correctCount})` },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setReviewFilter(f.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${
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

              <div className="space-y-3">
                {verifiedResult.answers
                  .filter((a) => {
                    if (reviewFilter === 'correct') return a.isCorrect;
                    if (reviewFilter === 'incorrect') return !a.isCorrect;
                    return true;
                  })
                  .map((ans, idx) => (
                    <div
                      key={ans.questionId}
                      className={`p-4 rounded-xl border text-xs sm:text-sm space-y-2 ${
                        ans.isCorrect
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : ans.selectedIndex === null
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-rose-200 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <strong className="text-slate-800">#{idx + 1}. {ans.question}</strong>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ans.isCorrect
                              ? 'bg-emerald-100 text-emerald-800'
                              : ans.selectedIndex === null
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {ans.isCorrect ? 'Correct' : ans.selectedIndex === null ? 'Unanswered' : 'Incorrect'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <strong className="text-slate-900">Your Answer:</strong>{' '}
                          {ans.selectedIndex !== null ? ans.options[ans.selectedIndex] : 'Not attempted'}
                        </div>
                        <div>
                          <strong className="text-emerald-700">Official Correct Answer:</strong>{' '}
                          {ans.options[ans.correctIndex]}
                        </div>
                        <div className="mt-1 text-slate-500 italic">{ans.explanation}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
