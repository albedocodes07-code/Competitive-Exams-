import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  FileText,
  Search,
  Lock,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { ExamCategory } from '../types/index.ts';

interface NavbarProps {
  activeTab: 'home' | 'practice' | 'past-papers' | 'check-result' | 'admin' | 'syllabus';
  setActiveTab: (tab: 'home' | 'practice' | 'past-papers' | 'check-result' | 'admin' | 'syllabus') => void;
  onSelectExam?: (category: ExamCategory) => void;
  isAdminLoggedIn?: boolean;
}

interface NavItem {
  id: 'home' | 'practice' | 'past-papers' | 'check-result' | 'admin';
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isAdminLoggedIn,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', icon: GraduationCap },
    { id: 'practice', label: 'MCQs Practice', icon: BookOpen },
    { id: 'past-papers', label: 'Past Papers (2021–2025)', icon: FileText },
    { id: 'check-result', label: 'Check My Result', icon: Search },
    { id: 'admin', label: 'Admin Portal', icon: Lock, badge: isAdminLoggedIn ? 'Active' : undefined },
  ];

  const handleNavClick = (id: typeof activeTab) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-md">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-blue-100 text-xs py-1.5 px-4 text-center border-b border-blue-800/60 hidden sm:flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Open Access
          </span>
          <span>No candidate registration or login required — Free for all Pakistani students</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-[11px]">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Verified Syllabus 2021–2025
          </span>
          <span className="text-blue-300 font-medium">CSS • PMS • PPSC • FPSC</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo Brand */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-lg shadow-blue-900/40 ring-1 ring-white/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-serif-heading">
                  ExamPrep
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-blue-400">
                  Pakistan
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-400 tracking-wider uppercase">
                CSS • Punjab PMS • PPSC • FPSC
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-700/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-emerald-600 text-white rounded font-mono">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action Button */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => handleNavClick('practice')}
              className="px-4 py-2 text-sm font-bold rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-900/50 hover:shadow-lg transition-all duration-150 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Start Practising</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-blue-400" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2">
            <button
              onClick={() => handleNavClick('practice')}
              className="w-full py-3 px-4 rounded-xl text-center font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg"
            >
              Start Practising Now (No Login Required)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
