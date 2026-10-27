import React from 'react';
import {
  BookOpen,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { ExamCategory } from '../types/index.ts';

interface HeroProps {
  onStartPractice: (exam?: ExamCategory) => void;
  onBrowsePastPapers: (exam?: ExamCategory) => void;
  onCheckResult: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onStartPractice,
  onBrowsePastPapers,
  onCheckResult,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-blue-950 text-white border-b border-slate-800">
      {/* Background Decorative Grid and Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 sm:pt-16 sm:pb-24">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Pakistan’s Free & Open Academic Examination Portal</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight font-serif-heading mb-6">
            Master Competitive Examinations in{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-sky-300 bg-clip-text text-transparent">
              Pakistan
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 leading-relaxed font-normal mb-8 max-w-2xl mx-auto">
            Targeted preparation for <strong className="text-white">CSS</strong>,{' '}
            <strong className="text-white">Punjab PMS</strong>,{' '}
            <strong className="text-white">PPSC</strong>, and{' '}
            <strong className="text-white">FPSC</strong>. Practice authentic timed MCQs, review five-year past papers (2021–2025), and get verified results without registration.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 mb-12">
            <button
              onClick={() => onStartPractice()}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-700/40 hover:shadow-blue-600/60 transition-all flex items-center justify-center gap-2.5 text-base"
            >
              <BookOpen className="w-5 h-5" />
              <span>Start Practising Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onBrowsePastPapers()}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-200 bg-slate-800/90 hover:bg-slate-700/90 hover:text-white border border-slate-700 active:scale-95 transition-all flex items-center justify-center gap-2.5 text-base"
            >
              <FileText className="w-5 h-5 text-blue-400" />
              <span>5-Year Past Papers</span>
            </button>

            <button
              onClick={onCheckResult}
              className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 text-base"
            >
              <Search className="w-4 h-4 text-amber-400" />
              <span>Check My Result</span>
            </button>
          </div>

          {/* Value Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-left">
            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">No Login Required</h4>
                <p className="text-[11px] sm:text-xs text-slate-400">Simply enter your name & start immediately</p>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Timed Mock Exams</h4>
                <p className="text-[11px] sm:text-xs text-slate-400">Real commission timer & negative marking options</p>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">2021–2025 Archive</h4>
                <p className="text-[11px] sm:text-xs text-slate-400">Five years of official questions & verified outlines</p>
              </div>
            </div>

            <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/60 rounded-xl p-3.5 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">Verified Scorecard</h4>
                <p className="text-[11px] sm:text-xs text-slate-400">Unique reference code & printable PDF report</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
