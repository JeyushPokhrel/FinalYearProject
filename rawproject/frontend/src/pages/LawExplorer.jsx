import { useState, useRef, useEffect } from "react";
import LawCard from "../components/lawcard/LawCard";
import { getLaws } from "../data/laws";
import { useTranslation } from "react-i18next";

export default function LawExplorer() {
  const { t } = useTranslation();
  const laws = getLaws(t);
  const [selectedLaw, setSelectedLaw] = useState(null);
  const detailsRef = useRef(null);

  useEffect(() => {
    if (selectedLaw && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedLaw]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
    

      <div className="max-w-6xl mx-auto p-8">

        <h1 className="text-gray-900 dark:text-white text-3xl font-bold mb-8 transition-colors">
          {t('law_explorer_title')}
        </h1>

        {/* CARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {laws.map((law) => (
            <LawCard
              key={law.id}
              law={law}
              onClick={() => setSelectedLaw(law)}
              
            />
          ))}
        </div>

        {/* DETAILS PANEL */}
        {selectedLaw && (
          <div 
            ref={detailsRef}
            className="mt-12 bg-white/80 dark:bg-[#1a1614]/80 backdrop-blur-xl border border-gray-200/50 dark:border-[#3d312d] p-10 rounded-[2rem] transition-all duration-500 shadow-2xl animate-in fade-in slide-in-from-bottom-4"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-6">
              <div className="flex-1">
                <h2 className="text-blue-600 dark:text-[#c69f6f] text-4xl font-extrabold tracking-tight mb-2">
                  {selectedLaw.title}
                </h2>
                <div className="flex items-center gap-2">
                   <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                   <span className="text-sm font-medium text-gray-500 dark:text-[#d6c0a5]">{t('official_text')}</span>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end bg-gray-100 dark:bg-[#302623] p-4 rounded-2xl border border-gray-200 dark:border-[#4a3b35]">
                <span className="text-[10px] font-bold text-gray-400 dark:text-[#d6c0a5] uppercase tracking-[0.2em] mb-1">
                  {t('enactment_year')}
                </span>
                <span className="text-2xl font-black text-gray-900 dark:text-[#f5e6d3]">
                  {selectedLaw.date} B.S.
                </span>
              </div>
            </div>

            <div className="space-y-10">
              <section>
                <h3 className="text-xs font-bold text-gray-400 dark:text-[#d6c0a5] uppercase tracking-[0.2em] mb-4">
                  {t('legal_summary')}
                </h3>
                <p className="text-gray-700 dark:text-[#f5e6d3] text-xl leading-relaxed font-medium">
                  {selectedLaw.description}
                </p>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8 border-t border-gray-100 dark:border-[#302623]">
                <section>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-[#d6c0a5] uppercase tracking-[0.2em] mb-4">
                    {t('auth_source')}
                  </h3>
                  <div className="bg-blue-50 dark:bg-[#251e1c] p-5 rounded-2xl border border-blue-100 dark:border-[#4a3b35]">
                    <p className="text-blue-900 dark:text-[#f5e6d3] font-semibold italic text-base leading-snug">
                      {selectedLaw.source}
                    </p>
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-[#d6c0a5] uppercase tracking-[0.2em] mb-4">
                    {t('digital_resources')}
                  </h3>
                  <div className="flex flex-col gap-4">
                    {selectedLaw.links.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-white dark:bg-[#302623] border border-gray-200 dark:border-[#4a3b35] rounded-xl hover:border-blue-500 dark:hover:border-[#c69f6f] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-gray-800 dark:text-[#f5e6d3] font-bold group-hover:text-blue-600 dark:group-hover:text-[#c69f6f]">
                            {link.name}
                          </span>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-[#c69f6f] transform group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}