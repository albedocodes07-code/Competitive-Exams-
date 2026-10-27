import React from 'react';
import { GraduationCap, ShieldCheck, ExternalLink, Heart, BookOpen, FileText, Search, Lock } from 'lucide-react';
import { ExamCategory } from '../types/index.ts';

interface FooterProps {
  onNavigate: (tab: 'home' | 'practice' | 'past-papers' | 'check-result' | 'admin' | 'syllabus') => void;
  onSelectExam?: (exam: ExamCategory) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSelectExam }) => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="text-white font-bold text-lg font-serif-heading">
                ExamPrep <span className="text-blue-400">Pakistan</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dedicated open academic resource for Pakistani civil servants and candidates aspiring for federal and provincial competitive cadres.
            </p>
            <div className="pt-2 text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Free Access • Zero Registration Required</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Platform Features
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('practice')}
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>Timed MCQs Practice</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('past-papers')}
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Five-Year Past Papers (2021–2025)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('check-result')}
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <span>Check My Result Reference</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('admin')}
                  className="hover:text-blue-400 transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Administrator Portal</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Examinations */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Examination Streams
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectExam?.('CSS');
                    onNavigate('practice');
                  }}
                  className="hover:text-white transition-colors"
                >
                  CSS (Federal FPSC)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectExam?.('PMS');
                    onNavigate('practice');
                  }}
                  className="hover:text-white transition-colors"
                >
                  PMS (Punjab & Provincial)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectExam?.('PPSC');
                    onNavigate('practice');
                  }}
                  className="hover:text-white transition-colors"
                >
                  PPSC One-Paper General Ability
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectExam?.('FPSC');
                    onNavigate('practice');
                  }}
                  className="hover:text-white transition-colors"
                >
                  FPSC General Recruitment (GR)
                </button>
              </li>
            </ul>
          </div>

          {/* Official Commission Links */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">
              Official Commission Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://fpsc.gov.pk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <span>FPSC Islamabad (fpsc.gov.pk)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://ppsc.gop.pk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <span>PPSC Lahore (ppsc.gop.pk)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://spsc.gov.pk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <span>SPSC Hyderabad (spsc.gov.pk)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://kppsc.gov.pk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-400 transition-colors flex items-center gap-1"
                >
                  <span>KPPSC Peshawar (kppsc.gov.pk)</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal & Independent Platform Disclaimer */}
        <div className="pt-8 border-t border-slate-900 space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-400">
            <strong className="text-slate-300 font-bold block mb-1">
              Independent Platform Disclaimer:
            </strong>
            <p>
              ExamPrep Pakistan is an independent, non-governmental educational platform built to facilitate Pakistani students preparing for competitive examinations. It is not affiliated with, authorized, maintained, sponsored, or endorsed by the Federal Public Service Commission (FPSC), the Punjab Public Service Commission (PPSC), the Sindh Public Service Commission (SPSC), the Khyber Pakhtunkhwa Public Service Commission (KPPSC), the Balochistan Public Service Commission (BPSC), or any government department or ministry. Official dates, syllabi changes, and gazette notifications must always be confirmed on the official commission websites.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <div>© {new Date().getFullYear()} ExamPrep Pakistan. All rights reserved.</div>
            <div>Built for the civil service aspirants of Pakistan.</div>
          </div>
        </div>
      </div>
    </footer>
  );
};
