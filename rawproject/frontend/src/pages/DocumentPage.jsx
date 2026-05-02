import React, { useState } from "react";
import {
  faScaleBalanced,
  faGavel,
  faBook,
  faShieldHalved,
  faLandmark,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";

const getDocumentsData = (t) => [
  {
    id: 1,
    title: t('civil_law'),
    icon: faBook,
    short: t('civil_law_short'),
    details: [
      t('civil_1'),
      t('civil_2'),
      t('civil_3'),
      t('civil_4'),
      t('civil_5'),
    ],
  },

  {
    id: 2,
    title: t('criminal_law'),
    icon: faGavel,
    short: t('criminal_law_short'),
    details: [
      t('criminal_1'),
      t('criminal_2'),
      t('criminal_3'),
      t('criminal_4'),
      t('criminal_5'),
    ],
  },

  {
    id: 3,
    title: t('constitution'),
    icon: faLandmark,
    short: t('constitution_short'),
    details: [
      t('const_1'),
      t('const_2'),
      t('const_3'),
      t('const_4'),
      t('const_5'),
    ],
  },

  {
    id: 4,
    title: t('evidence_act'),
    icon: faShieldHalved,
    short: t('evidence_act_short'),
    details: [
      t('evid_1'),
      t('evid_2'),
      t('evid_3'),
      t('evid_4'),
      t('evid_5'),
    ],
  },
];

const DocumentsPage = () => {
  const { t } = useTranslation();
  const documentsData = getDocumentsData(t);
  const [selectedLaw, setSelectedLaw] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-white px-6 py-10 transition-colors duration-300">
      {/* HEADER */}

      <div className="text-center mb-12">
        <div className="flex justify-center items-center gap-3 mb-4">
          <FontAwesomeIcon
            icon={faScaleBalanced}
            className="text-blue-600 dark:text-[#c2a878] text-4xl transition-colors"
          />

          <h1 className="text-4xl font-bold text-blue-600 dark:text-[#c2a878] transition-colors">
            {t('legal_documents')}
          </h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto transition-colors">
          {t('docs_desc')}
        </p>
      </div>

      {/* CARD VIEW */}

      {!selectedLaw && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {documentsData.map((law) => (
            <div
              key={law.id}
              onClick={() => setSelectedLaw(law)}
              className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-6 cursor-pointer hover:border-blue-600 dark:hover:border-[#c2a878] transition duration-300 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <FontAwesomeIcon
                  icon={law.icon}
                  className="text-blue-600 dark:text-[#c2a878] text-3xl"
                />

                <h2 className="text-2xl font-semibold text-blue-600 dark:text-[#c2a878]">
                  {law.title}
                </h2>
              </div>

              <p className="text-gray-600 dark:text-gray-400 leading-7">{law.short}</p>

              <button className="mt-6 bg-blue-600 dark:bg-[#c2a878] text-white dark:text-black px-5 py-2 rounded-lg font-semibold hover:opacity-90 transition-colors">
                {t('explore')}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* DETAILS VIEW */}

      {selectedLaw && (
        <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#2a2a2a] rounded-2xl p-8 transition-colors duration-300 shadow-sm">
          <button
            onClick={() => setSelectedLaw(null)}
            className="mb-8 bg-blue-600 dark:bg-[#c2a878] text-white dark:text-black px-5 py-2 rounded-lg font-semibold transition-colors"
          >
            {t('back')}
          </button>

          <div className="flex items-center gap-4 mb-6">
            <FontAwesomeIcon
              icon={selectedLaw.icon}
              className="text-blue-600 dark:text-[#c2a878] text-4xl"
            />

            <h2 className="text-4xl font-bold text-blue-600 dark:text-[#c2a878]">
              {selectedLaw.title}
            </h2>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-8">
            {selectedLaw.short}
          </p>

          <div className="space-y-5">
            {selectedLaw.details.map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-black border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-5 transition-colors duration-300"
              >
                <h3 className="text-blue-600 dark:text-[#c2a878] text-xl font-semibold mb-2">
                  {t('section')} {index + 1}
                </h3>

                <p className="text-gray-700 dark:text-gray-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPage;