import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  ExternalLink,
  Printer,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  X,
  BookOpen,
  Eye,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ExamCategory, PastPaper, Province, SubjectConfig } from '../types/index.ts';
import { getExamFullName } from '../utils/formatters.ts';

interface PastPapersSectionProps {
  subjects: SubjectConfig[];
  initialExam?: ExamCategory;
  initialSubjectId?: string;
  initialProvince?: Province;
}

export const PastPapersSection: React.FC<PastPapersSectionProps> = ({
  subjects,
  initialExam,
  initialSubjectId,
  initialProvince,
}) => {
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamCategory | 'ALL'>(initialExam || 'ALL');
  const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || 'ALL');
  const [selectedProvince, setSelectedProvince] = useState<Province | 'ALL'>(initialProvince || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activePaperModal, setActivePaperModal] = useState<PastPaper | null>(null);

  useEffect(() => {
    fetchPapers();
  }, [selectedExam, selectedYear, selectedSubjectId, selectedProvince]);

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedExam !== 'ALL') params.append('examCategory', selectedExam);
      if (selectedYear !== 'ALL') params.append('year', String(selectedYear));
      if (selectedSubjectId !== 'ALL') params.append('subjectId', selectedSubjectId);
      if (selectedExam === 'PMS' && selectedProvince !== 'ALL') {
        params.append('province', selectedProvince);
      }

      const res = await fetch(`/api/past-papers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPapers(data.papers || []);
      }
    } catch (err) {
      console.error('Error fetching past papers:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPapers = papers.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.subjectName.toLowerCase().includes(q) ||
      p.examCategory.toLowerCase().includes(q) ||
      p.officialSource.toLowerCase().includes(q)
    );
  });

  const years = [2025, 2024, 2023, 2022, 2021];

  const handlePrintPaper = () => {
    window.print();
  };

  return (
    <section className="py-12 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            Official Examination Repository
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-heading">
            Five-Year Past Papers Archive (2021–2025)
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Authentic, syllabus-verified past examination papers categorized by commission, subject, and year with official links and printable reading view.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-200 mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Exam Commission Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Examination Commission
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value as any)}
                className="w-full text-xs sm:text-sm font-semibold p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Examinations (CSS, PMS, PPSC, FPSC)</option>
                <option value="CSS">CSS (Federal FPSC)</option>
                <option value="PMS">PMS (Punjab / Provincial)</option>
                <option value="PPSC">PPSC (Punjab Commission)</option>
                <option value="FPSC">FPSC (General Recruitment)</option>
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Examination Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) =>
                  setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                }
                className="w-full text-xs sm:text-sm font-semibold p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All 5 Years (2021–2025)</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs sm:text-sm font-semibold p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Search Papers</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. 2024, Precis, GK, FIA..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* If PMS selected, allow province selection */}
          {selectedExam === 'PMS' && (
            <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Province:</span>
              {(['ALL', 'Punjab', 'Sindh', 'KPK', 'Balochistan'] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => setSelectedProvince(prov)}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all ${
                    selectedProvince === prov
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {prov === 'ALL' ? 'All Provinces' : `${prov} PMS`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Papers Grid */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Loading authenticated past papers...</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200 p-8">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No past papers found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Try adjusting your filter criteria or switch between examination categories to view available archives.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                      {paper.examCategory} • {paper.year}
                    </span>
                    {paper.isOfficialVerified ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Official Archive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        Verified Demo
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-2">
                    {paper.title}
                  </h3>

                  <div className="text-xs text-slate-500 space-y-1 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Time: {paper.timeAllowed} • Max Marks: {paper.maximumMarks}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="line-clamp-1">{paper.officialSource}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                    {paper.description}
                  </p>
                </div>

                {/* Paper Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActivePaperModal(paper)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Full Paper</span>
                  </button>

                  <a
                    href={paper.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                    title="Visit Official Commission Website"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Portal</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Paper Viewer */}
        {activePaperModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-300 animate-in fade-in zoom-in-95 my-auto">
              {/* Modal Top Bar */}
              <div className="no-print p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-3xl">
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase">
                    {activePaperModal.examCategory} {activePaperModal.year} Paper
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-1">
                    {activePaperModal.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintPaper}
                    className="p-2 rounded-xl text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1 text-xs font-semibold"
                    title="Print / Save as PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Print Paper</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePaperModal(null)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable / Viewable Paper Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-900">
                {/* Academic Letterhead */}
                <div className="text-center pb-6 border-b-2 border-slate-800">
                  <h2 className="text-lg sm:text-xl font-bold font-serif-heading uppercase tracking-wide">
                    {activePaperModal.officialSource}
                  </h2>
                  <h3 className="text-base sm:text-lg font-extrabold text-blue-900 mt-1">
                    {activePaperModal.title}
                  </h3>
                  <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-700 mt-4 max-w-lg mx-auto">
                    <span>TIME ALLOWED: {activePaperModal.timeAllowed}</span>
                    <span>MAXIMUM MARKS: {activePaperModal.maximumMarks}</span>
                  </div>
                </div>

                {/* Instructions Box */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm space-y-1.5">
                  <strong className="block text-slate-800 uppercase text-xs font-bold">
                    Official Candidate Instructions:
                  </strong>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700">
                    {activePaperModal.instructions.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>

                {/* Sections & Questions */}
                <div className="space-y-6">
                  {activePaperModal.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="space-y-3">
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg text-xs sm:text-sm font-bold flex justify-between items-center">
                        <span>{sec.title}</span>
                        {sec.marks && <span>[{sec.marks} Marks]</span>}
                      </div>

                      {sec.instructions && (
                        <p className="text-xs text-slate-600 italic px-2">{sec.instructions}</p>
                      )}

                      <div className="space-y-2.5 pl-2 sm:pl-4">
                        {sec.questions.map((qText, qIdx) => (
                          <div
                            key={qIdx}
                            className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed"
                          >
                            {qText}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Official Verification Notice */}
                <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Archived for academic training by ExamPrep Pakistan</span>
                  </div>
                  <a
                    href={activePaperModal.officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Verify at {activePaperModal.officialSource}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
