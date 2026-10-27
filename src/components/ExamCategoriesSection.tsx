import React, { useState } from 'react';
import {
  GraduationCap,
  Building2,
  BookOpen,
  FileText,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ExamCategory, Province } from '../types/index.ts';

interface ExamCategoriesSectionProps {
  onSelectPractice: (category: ExamCategory, province?: Province) => void;
  onSelectPastPapers: (category: ExamCategory, province?: Province) => void;
  selectedProvince: Province;
  onChangeProvince: (prov: Province) => void;
}

export const ExamCategoriesSection: React.FC<ExamCategoriesSectionProps> = ({
  onSelectPractice,
  onSelectPastPapers,
  selectedProvince,
  onChangeProvince,
}) => {
  const [activeProvinceTab, setActiveProvinceTab] = useState<Province>(selectedProvince);

  const handleProvinceSelect = (prov: Province) => {
    setActiveProvinceTab(prov);
    onChangeProvince(prov);
  };

  const categories = [
    {
      id: 'CSS' as ExamCategory,
      title: 'CSS (Central Superior Services)',
      commission: 'Federal Public Service Commission (FPSC), Islamabad',
      tagline: 'Pakistan Premier Federal Bureaucracy Examination',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      description:
        'Comprehensive preparation for CSS MPT Screening and 6 Compulsory Written Papers: English Precis & Composition, Essay, General Science & Ability, Current Affairs, Pakistan Affairs, and Islamic Studies.',
      stats: '1,200 Total Marks • 6 Compulsory + 600 Optional',
      keyHighlights: ['CSS MPT Screening Module', '2021–2025 Compulsory Past Papers', 'Deep Analytical Explanations'],
    },
    {
      id: 'PMS' as ExamCategory,
      title: 'PMS (Provincial Management Service)',
      commission: 'Provincial Public Service Commissions (PPSC / SPSC / KPPSC / BPSC)',
      tagline: 'Provincial Civil Service Leadership',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-300',
      description:
        'Targeted for Punjab PMS (100 Marks General Knowledge MCQ Paper, English Essay, Precis, Urdu, Islamiyat & Pak Studies), with customizable provincial syllabi for Sindh CCE, KP PMS, and Balochistan BPSC.',
      stats: '600 Compulsory Marks (GK 100 MCQs Paper)',
      isProvincial: true,
      keyHighlights: ['Punjab PMS 100 MCQs GK Paper', 'Urdu Compulsory Past Papers', 'Configurable Provincial Syllabi'],
    },
    {
      id: 'PPSC' as ExamCategory,
      title: 'PPSC (Punjab Public Service Commission)',
      commission: 'Punjab Public Service Commission, Lahore',
      tagline: 'One-Paper MCQs & Provincial Cadres',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
      description:
        'Preparation for 100-mark / 90-minute General Ability screening tests for Tehsildar, Sub-Inspector, Assistant Director, Lecturer, and Municipal Officers with negative marking practice.',
      stats: '100 MCQs • 90 Mins • 0.25 Negative Marking',
      keyHighlights: ['100-Mark Composite Test Engine', 'Computer Knowledge & MS Office', 'Everyday Science & Math'],
    },
    {
      id: 'FPSC' as ExamCategory,
      title: 'FPSC (Federal Public Service Commission)',
      commission: 'Federal Public Service Commission, Islamabad',
      tagline: 'General Recruitment (GR) & Screening Tests',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
      description:
        'Screening tests for Inspector FIA, Assistant Director, Custom Appraising Officer, NAB, and Intelligence Bureau. Part-I English Grammar (20 marks) & Part-II General Intelligence (80 marks).',
      stats: '100 Marks • Two-Part Pattern (English + GR)',
      keyHighlights: ['FIA / Customs / NAB Patterns', 'Part I English Grammar Mastery', 'Recent 2021–2025 Archives'],
    },
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Competitive Examination Streams
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-serif-heading">
            Four Core Examination Categories
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Select your target examination stream below to start subject-wise MCQ practice or explore official five-year past papers.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-slate-50/70 hover:bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Top Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold border mb-2 ${cat.badgeColor}`}
                    >
                      {cat.id} Competitive Cadre
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {cat.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {cat.commission}
                    </p>
                  </div>
                </div>

                {/* Tagline / Subtitle */}
                <div className="text-xs font-semibold text-blue-700 bg-blue-50/80 px-3 py-1 rounded-md mb-3 inline-block">
                  {cat.tagline}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  {cat.description}
                </p>

                {/* Provincial Selector if PMS */}
                {cat.isProvincial && (
                  <div className="mb-4 p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/80">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        Provincial Syllabus Active:
                      </span>
                      <span className="text-xs font-extrabold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-300">
                        {activeProvinceTab} PMS (Active)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {(['Punjab', 'Sindh', 'KPK', 'Balochistan'] as Province[]).map((prov) => (
                        <button
                          key={prov}
                          type="button"
                          onClick={() => handleProvinceSelect(prov)}
                          className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all text-center ${
                            activeProvinceTab === prov
                              ? 'bg-blue-600 text-white font-bold shadow-sm'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {prov}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Highlights */}
                <div className="space-y-1.5 mb-6">
                  {cat.keyHighlights.map((hl, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{hl}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Split Action Buttons: MCQs Practice & Past Papers */}
              <div className="pt-4 border-t border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                  Two Dedicated Sections:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() =>
                      onSelectPractice(
                        cat.id,
                        cat.id === 'PMS' ? activeProvinceTab : undefined
                      )
                    }
                    className="w-full py-2.5 px-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>MCQs Practice</span>
                  </button>

                  <button
                    onClick={() =>
                      onSelectPastPapers(
                        cat.id,
                        cat.id === 'PMS' ? activeProvinceTab : undefined
                      )
                    }
                    className="w-full py-2.5 px-3.5 rounded-xl font-bold text-sm text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-300 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Past Papers (2021–25)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
