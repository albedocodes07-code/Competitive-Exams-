import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Hero } from './components/Hero.tsx';
import { ExamCategoriesSection } from './components/ExamCategoriesSection.tsx';
import { PopularSubjectsSection } from './components/PopularSubjectsSection.tsx';
import { PracticeSection } from './components/PracticeSection.tsx';
import { PastPapersSection } from './components/PastPapersSection.tsx';
import { CheckResultSection } from './components/CheckResultSection.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { Footer } from './components/Footer.tsx';
import { ExamCategory, Province, SubjectConfig, SystemStats } from './types/index.ts';
import { SUBJECTS } from '../server/seedData.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'home' | 'practice' | 'past-papers' | 'check-result' | 'admin' | 'syllabus'
  >('home');

  // Global selections carried across views
  const [selectedExam, setSelectedExam] = useState<ExamCategory>('CSS');
  const [selectedProvince, setSelectedProvince] = useState<Province>('Punjab');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [subjects, setSubjects] = useState<SubjectConfig[]>(SUBJECTS);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Fetch initial config from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.subjects && data.subjects.length > 0) {
            setSubjects(data.subjects);
          }
          if (data.stats) {
            setSystemStats(data.stats);
          }
        }
      } catch (err) {
        console.warn('Backend config fetch fallback to seed:', err);
      }
    };
    fetchConfig();
  }, []);

  // Handlers for interactive transitions
  const handleStartPractice = (exam: ExamCategory = 'CSS', province: Province = 'Punjab', subjectId: string = 'all') => {
    setSelectedExam(exam);
    if (province) setSelectedProvince(province);
    setSelectedSubjectId(subjectId);
    setActiveTab('practice');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBrowsePastPapers = (exam?: ExamCategory, province?: Province, subjectId?: string) => {
    if (exam) setSelectedExam(exam);
    if (province) setSelectedProvince(province);
    if (subjectId) setSelectedSubjectId(subjectId);
    setActiveTab('past-papers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCheckResult = () => {
    setActiveTab('check-result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectExam={(cat) => handleStartPractice(cat)}
        isAdminLoggedIn={isAdminLoggedIn}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME */}
        {activeTab === 'home' && (
          <div>
            <Hero
              onStartPractice={() => handleStartPractice('CSS')}
              onBrowsePastPapers={() => handleBrowsePastPapers()}
              onCheckResult={handleCheckResult}
            />

            <ExamCategoriesSection
              onSelectPractice={(cat, prov) => handleStartPractice(cat, prov || 'Punjab')}
              onSelectPastPapers={(cat, prov) => handleBrowsePastPapers(cat, prov)}
              selectedProvince={selectedProvince}
              onChangeProvince={(prov) => setSelectedProvince(prov)}
            />

            <PopularSubjectsSection
              subjects={subjects}
              onStartSubjectPractice={(subjId, exam) => handleStartPractice(exam, 'Punjab', subjId)}
              onViewSubjectPastPapers={(subjId, exam) => handleBrowsePastPapers(exam, 'Punjab', subjId)}
            />

            {/* Quick Check Result Teaser Banner on Homepage */}
            <section className="py-12 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-t border-slate-800">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h3 className="text-xl sm:text-3xl font-extrabold font-serif-heading mb-3">
                  Have an Existing Reference Code?
                </h3>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-6">
                  Candidate test submissions are permanently archived. Enter your candidate name and private reference code to view or reprint your official scorecard anytime.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleCheckResult}
                    className="px-6 py-3 rounded-xl font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg transition-all"
                  >
                    Check My Result Scorecard
                  </button>
                  <button
                    onClick={() => handleStartPractice('CSS')}
                    className="px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
                  >
                    Start a New Practice Test
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* VIEW 2: MCQS PRACTICE */}
        {activeTab === 'practice' && (
          <PracticeSection
            subjects={subjects}
            initialExam={selectedExam}
            initialProvince={selectedProvince}
            initialSubjectId={selectedSubjectId}
            onNavigateToCheckResult={handleCheckResult}
          />
        )}

        {/* VIEW 3: PAST PAPERS (2021-2025) */}
        {activeTab === 'past-papers' && (
          <PastPapersSection
            subjects={subjects}
            initialExam={selectedExam}
            initialProvince={selectedProvince}
            initialSubjectId={selectedSubjectId}
          />
        )}

        {/* VIEW 4: CHECK MY RESULT */}
        {activeTab === 'check-result' && (
          <CheckResultSection onStartNewPractice={() => handleStartPractice('CSS')} />
        )}

        {/* VIEW 5: ADMIN PORTAL */}
        {activeTab === 'admin' && (
          <AdminPortal
            subjects={subjects}
            onAdminAuthChange={(isAuth) => setIsAdminLoggedIn(isAuth)}
          />
        )}
      </main>

      {/* Footer & Disclaimer */}
      <Footer
        onNavigate={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectExam={(exam) => handleStartPractice(exam)}
      />
    </div>
  );
}
