import React, { useState } from 'react';
import {
  BookOpen,
  FlaskConical,
  Calculator,
  Landmark,
  MoonStar,
  Globe,
  Compass,
  Laptop,
  ScrollText,
  CheckCircle2,
  Filter,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { ExamCategory, SubjectConfig, SubjectClassification } from '../types/index.ts';

interface PopularSubjectsSectionProps {
  subjects: SubjectConfig[];
  onStartSubjectPractice: (subjectId: string, examCategory: ExamCategory) => void;
  onViewSubjectPastPapers: (subjectId: string, examCategory: ExamCategory) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen,
  FlaskConical,
  Calculator,
  Landmark,
  MoonStar,
  Globe,
  Compass,
  Laptop,
  ScrollText,
};

export const PopularSubjectsSection: React.FC<PopularSubjectsSectionProps> = ({
  subjects,
  onStartSubjectPractice,
  onViewSubjectPastPapers,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<ExamCategory | 'ALL'>('ALL');

  const filteredSubjects = subjects.filter((subj) => {
    if (selectedFilter === 'ALL') return true;
    return subj.examCategories.includes(selectedFilter);
  });

  const getClassificationBadge = (subj: SubjectConfig, exam: ExamCategory | 'ALL') => {
    let classification: SubjectClassification = 'screening';

    if (exam !== 'ALL') {
      classification = subj.classificationByExam[exam] || 'screening';
    } else {
      // If CSS or PMS compulsory, mark as compulsory
      if (subj.classificationByExam.CSS === 'compulsory' || subj.classificationByExam.PMS === 'compulsory') {
        classification = 'compulsory';
      }
    }

    if (classification === 'compulsory') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          Compulsory Subject
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
        Screening-Test Subject
      </span>
    );
  };

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            Curriculum Alignment
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-heading">
            Subjects & Syllabus Breakdown
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Syllabus-aligned preparation strictly distinguishing between compulsory written papers and screening-test subjects for each competitive commission.
          </p>

          {/* Exam Category Filter Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              Filter by Exam:
            </span>
            {(['ALL', 'CSS', 'PMS', 'PPSC', 'FPSC'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  selectedFilter === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                }`}
              >
                {cat === 'ALL' ? 'All Subjects' : `${cat} Syllabus`}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((subj) => {
            const IconComponent = ICON_MAP[subj.iconName] || BookOpen;
            const primaryExam: ExamCategory =
              selectedFilter !== 'ALL' ? selectedFilter : subj.examCategories[0];

            return (
              <div
                key={subj.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>{getClassificationBadge(subj, selectedFilter)}</div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{subj.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {subj.description}
                  </p>

                  {/* Relevant Exam Badges */}
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                      Applicable in:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {subj.examCategories.map((cat) => {
                        const isComp = subj.classificationByExam[cat] === 'compulsory';
                        return (
                          <span
                            key={cat}
                            className={`text-[11px] px-2 py-0.5 rounded font-bold border ${
                              isComp
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {cat} ({isComp ? 'Compulsory' : 'Screening'})
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onStartSubjectPractice(subj.id, primaryExam)}
                    className="py-2 px-2.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Practice MCQs</span>
                  </button>

                  <button
                    onClick={() => onViewSubjectPastPapers(subj.id, primaryExam)}
                    className="py-2 px-2.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Past Papers</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
