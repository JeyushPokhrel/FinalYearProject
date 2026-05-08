import { useState } from "react";
import {
  faScaleBalanced,
  faLandmark,
  faGavel,
  faCoins,
  faBriefcase,
  faHouseChimney,
  faHandHoldingHeart,
  faCity,
  faMicrochip,
  faLeaf,
  faArrowLeft,
  faFile,
  faArrowUpRightFromSquare,
  faChevronRight,
  faBook,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslation } from "react-i18next";
import { getLaws } from "../data/laws";

// Map law IDs to categories
const CATEGORIES = [
  {
    id: "foundational",
    label: "Foundational Law",
    subtitle: "The supreme law of Nepal",
    icon: faLandmark,
    accent: "#c2a878",
    lawIds: [1],
  },
  {
    id: "procedural",
    label: "Procedural & Evidence",
    subtitle: "Civil, criminal procedure & evidence",
    icon: faGavel,
    accent: "#c2a878",
    lawIds: [2, 3, 4],
  },
  {
    id: "economic",
    label: "Economic & Financial",
    subtitle: "Taxation, commerce & banking",
    icon: faCoins,
    accent: "#c2a878",
    lawIds: [11, 12, 13, 14, 15, 20],
  },
  {
    id: "labour",
    label: "Labour & Employment",
    subtitle: "Workers' rights & foreign employment",
    icon: faBriefcase,
    accent: "#c2a878",
    lawIds: [6, 10],
  },
  {
    id: "property",
    label: "Property & Land",
    subtitle: "Land rights & ownership laws",
    icon: faHouseChimney,
    accent: "#c2a878",
    lawIds: [7],
  },
  {
    id: "social",
    label: "Social Protection",
    subtitle: "Domestic safety & consumer rights",
    icon: faHandHoldingHeart,
    accent: "#c2a878",
    lawIds: [8, 17],
  },
  {
    id: "governance",
    label: "Governance & Rights",
    subtitle: "Local governance & information access",
    icon: faCity,
    accent: "#c2a878",
    lawIds: [9, 16],
  },
  {
    id: "digital",
    label: "Digital & Modern",
    subtitle: "Electronic transactions & cyber law",
    icon: faMicrochip,
    accent: "#c2a878",
    lawIds: [5],
  },
  {
    id: "ip_env",
    label: "Intellectual Property & Environment",
    subtitle: "Copyright & environmental protection",
    icon: faLeaf,
    accent: "#c2a878",
    lawIds: [18, 19],
  },
];

const DocumentsPage = () => {
  const { t } = useTranslation();
  const laws = getLaws(t);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLaw, setSelectedLaw] = useState(null);

  const getLawById = (id) => laws.find((l) => l.id === id);

  // --- DETAIL VIEW ---
  if (selectedLaw) {
    const cat = selectedCategory;
    return (
      <div className="doc-page">
        <div className="doc-detail-container">
          <button
            className="doc-back-btn"
            onClick={() => setSelectedLaw(null)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            &nbsp; Back to {cat.label}
          </button>

          <div className="doc-detail-header">
            <div className="doc-detail-icon-wrap">
              <FontAwesomeIcon icon={faBook} />
            </div>
            <div>
              <div className="doc-cat-badge">
                {cat.label}
              </div>
              <h2 className="doc-detail-title">
                {selectedLaw.title}
              </h2>
              <span className="doc-detail-year">
                Enacted: {selectedLaw.date} B.S.
              </span>
            </div>
          </div>

          <p className="doc-detail-desc">{selectedLaw.description}</p>

          <div className="doc-detail-info">
            <h3 className="doc-info-label">Source</h3>
            <p className="doc-source-text">{selectedLaw.source}</p>
          </div>

          {selectedLaw.links && selectedLaw.links.length > 0 && (
            <div className="doc-detail-info">
              <h3 className="doc-info-label">Official Documents</h3>
              <div className="doc-links-list">
                {selectedLaw.links.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="doc-link-card"
                    style={{ borderColor: cat.accent + "55" }}
                  >
                    <FontAwesomeIcon
                      icon={faFile}
                      style={{ color: cat.accent }}
                      className="doc-link-icon"
                    />
                    <span className="doc-link-name">{link.name}</span>
                    <FontAwesomeIcon
                      icon={faArrowUpRightFromSquare}
                      className="doc-link-arrow"
                      style={{ color: cat.accent }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- LAWS LIST VIEW (within category) ---
  if (selectedCategory) {
    const cat = selectedCategory;
    const categoryLaws = cat.lawIds.map(getLawById).filter(Boolean);

    return (
      <div className="doc-page">
        {/* Category Hero Banner */}
        <div className="doc-cat-banner">
          <button
            className="doc-back-btn"
            onClick={() => setSelectedCategory(null)}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            &nbsp; All Categories
          </button>
          <div className="doc-cat-banner-inner">
            <div className="doc-cat-banner-icon">
              <FontAwesomeIcon icon={cat.icon} />
            </div>
            <div>
              <h2 className="doc-cat-banner-title">
                {cat.label}
              </h2>
              <p className="doc-cat-banner-subtitle">{cat.subtitle}</p>
            </div>
          </div>
          <p className="doc-cat-count">
            {categoryLaws.length} {categoryLaws.length === 1 ? "Law" : "Laws"}
          </p>
        </div>

        {/* Laws List */}
        <div className="doc-laws-grid">
          {categoryLaws.map((law) => (
            <div
              key={law.id}
              className="doc-law-card"
              onClick={() => setSelectedLaw(law)}
            >
              <div className="doc-law-card-top">
                <div
                  className="doc-law-icon"
                >
                  <FontAwesomeIcon icon={faFile} style={{ color: cat.accent }} />
                </div>
                <span className="doc-law-year">{law.date} B.S.</span>
              </div>
              <div className="doc-law-cat-tag">
                {cat.label}
              </div>
              <h3 className="doc-law-title">{law.title}</h3>
              <p className="doc-law-desc">{law.description}</p>
              <div className="doc-law-footer">
                View Details &nbsp;
                <FontAwesomeIcon icon={faChevronRight} className="doc-law-arrow" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- MAIN CATEGORY GRID ---
  return (
    <div className="doc-page">
      {/* Header */}
      <div className="doc-header">
        <div className="doc-brand-logo">
          <FontAwesomeIcon icon={faScaleBalanced} />
        </div>
        <h1 className="doc-header-title">{t("legal_documents")}</h1>
        <p className="doc-header-subtitle">{t("docs_desc")}</p>
      </div>

      {/* Category Cards Grid */}
      <div className="doc-categories-grid">
        {CATEGORIES.map((cat) => {
          const lawCount = cat.lawIds.length;
          return (
            <div
              key={cat.id}
              className="doc-cat-card"
              onClick={() => setSelectedCategory(cat)}
            >
              <div className="doc-cat-card-content">
                <div className="doc-cat-icon-circle">
                  <FontAwesomeIcon icon={cat.icon} />
                </div>
                <h2 className="doc-cat-name">
                  {cat.label}
                </h2>
                <p className="doc-cat-subtitle">{cat.subtitle}</p>
                
                {/* Law Preview List */}
                <div className="doc-cat-preview">
                  {cat.lawIds.slice(0, 3).map(id => {
                    const law = getLawById(id);
                    return law ? (
                      <div key={id} className="doc-cat-preview-item">
                        <FontAwesomeIcon icon={faFile} className="doc-cat-preview-icon" />
                        <span>{law.title}</span>
                      </div>
                    ) : null;
                  })}
                  {cat.lawIds.length > 3 && (
                    <div className="doc-cat-preview-more">
                      + {cat.lawIds.length - 3} more laws
                    </div>
                  )}
                </div>

                <div className="doc-cat-footer">
                  <span className="doc-cat-law-count">
                    {lawCount} {lawCount === 1 ? "Law" : "Laws"}
                  </span>
                  <span className="doc-cat-explore">
                    Explore <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: "0.75rem" }} />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .doc-page {
          min-height: 100vh;
          background: #f5f7f9;
          padding: 2.5rem 1.5rem 4rem;
          transition: background 0.3s;
        }
        .dark .doc-page {
          background: #0c0a09;
        }

        /* ─── HEADER ─── */
        .doc-header {
          text-align: center;
          margin-bottom: 4rem;
        }
        .doc-brand-logo {
          display: inline-flex;
          padding: 1.25rem;
          background: #2563eb;
          color: white;
          border-radius: 1.5rem;
          font-size: 2.5rem;
          margin-bottom: 2rem;
        }
        .dark .doc-brand-logo {
          background: #c69f6f;
          color: #1a1614;
        }
        .doc-header-title {
          font-size: 3.5rem;
          font-weight: 900;
          color: #111827;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }
        .dark .doc-header-title {
          color: white;
        }
        .doc-header-subtitle {
          font-size: 1.25rem;
          color: #4b5563;
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.6;
        }
        .dark .doc-header-subtitle {
          color: #d6c0a5;
        }

        /* ─── CATEGORY GRID ─── */
        .doc-categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1.75rem;
          max-width: 1300px;
          margin: 0 auto;
        }

        /* ─── CATEGORY CARD ─── */
        .doc-cat-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          min-height: 280px;
          height: 100%;
          display: flex;
          background: #fff;
          border: 1px solid #e2e8f0;
        }
        .dark .doc-cat-card {
          background: #111111;
          border-color: #2a2a2a;
        }
        .doc-cat-card:hover {
          box-shadow: 0 20px 40px rgba(30, 58, 138, 0.1);
          border-color: #2563eb;
        }
        .dark .doc-cat-card:hover {
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          border-color: #c2a878;
        }
        .doc-cat-card-content {
          position: relative;
          z-index: 2;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .doc-cat-icon-circle {
          width: 52px; height: 52px;
          border-radius: 14px;
          background: #2563eb;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          margin-bottom: 1rem;
        }
        .dark .doc-cat-icon-circle {
          background: #c69f6f;
          color: #1a1614;
        }
        .doc-cat-card:hover .doc-cat-icon-circle {
          background: #dbeafe;
        }
        .dark .doc-cat-card:hover .doc-cat-icon-circle {
          background: #2a2a2a;
        }
        .doc-cat-name {
          font-size: 1.25rem;
          font-weight: 800;
          margin: 0 0 0.5rem;
          line-height: 1.3;
          color: #111827;
        }
        .dark .doc-cat-name {
          color: #c2a878;
        }
        .doc-cat-subtitle {
          font-size: 0.9rem;
          color: #4b5563; /* gray-600 */
          margin: 0 0 1.25rem;
          line-height: 1.5;
        }
        .dark .doc-cat-subtitle {
          color: #94a3b8;
        }
        .doc-cat-preview {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 1.75rem;
          flex: 1;
        }
        .doc-cat-preview-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.85rem;
          color: #6b7280; /* gray-500 */
          white-space: normal;
        }
        .dark .doc-cat-preview-item {
          color: #94a3b8;
        }
        .doc-cat-preview-icon {
          font-size: 0.75rem;
          color: #2563eb; /* blue-600 */
          opacity: 0.7;
        }
        .dark .doc-cat-preview-icon {
          color: #c2a878;
        }
        .doc-cat-preview-more {
          font-size: 0.8rem;
          color: #9ca3af; /* gray-400 */
          font-style: italic;
          margin-top: 0.25rem;
        }
        .doc-cat-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6; /* gray-100 */
        }
        .dark .doc-cat-footer {
          border-top-color: #1e1e1e;
        }
        .doc-cat-law-count {
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.35rem 0.85rem;
          border-radius: 100px;
          background: #f3f4f6; /* gray-100 */
          color: #4b5563; /* gray-600 */
        }
        .dark .doc-cat-law-count {
          background: #1e1e1e;
          color: #c2a878;
        }
        .doc-cat-explore {
          font-size: 0.9rem;
          font-weight: 700;
          color: #2563eb; /* blue-600 */
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .dark .doc-cat-explore {
          color: #c2a878;
        }
        .doc-cat-card:hover .doc-cat-explore {
          gap: 0.4rem;
        }

        /* ─── CATEGORY BANNER (drill-down) ─── */
        .doc-cat-banner {
          border-radius: 24px;
          padding: 2.5rem;
          margin-bottom: 2.5rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          background: #fff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.02);
          position: relative;
        }
        .dark .doc-cat-banner {
          background: #111111;
          border-color: #2a2a2a;
          box-shadow: none;
        }
        .doc-cat-banner-inner {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin: 1.5rem 0 0.75rem;
        }
        .doc-cat-banner-icon {
          width: 72px; height: 72px;
          border-radius: 20px;
          background: #2563eb;
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem;
          border: 1px solid #2563eb;
        }
        .dark .doc-cat-banner-icon {
          background: #c69f6f;
          color: #1a1614;
          border-color: #c69f6f;
        }
        .doc-cat-banner-title {
          font-size: 2rem;
          font-weight: 900;
          margin: 0 0 0.25rem;
          color: #111827; /* gray-900 */
        }
        .dark .doc-cat-banner-title {
          color: #c2a878;
        }
        .doc-cat-banner-subtitle {
          color: #4b5563; /* gray-600 */
          margin: 0;
          font-size: 1rem;
        }
        .dark .doc-cat-banner-subtitle {
          color: #94a3b8;
        }
        .doc-cat-count {
          color: #6b7280; /* gray-500 */
          font-size: 0.9rem;
          font-weight: 500;
          margin: 0;
        }

        /* ─── LAWS GRID ─── */
        .doc-laws-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 1.75rem;
          max-width: 1300px;
          margin: 0 auto;
        }

        /* ─── LAW CARD ─── */
        .doc-law-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.75rem;
          cursor: pointer;
          min-height: 280px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .dark .doc-law-card {
          background: #111111;
          border-color: #2a2a2a;
        }
        .doc-law-card:hover {
          box-shadow: 0 15px 35px rgba(30, 58, 138, 0.08);
          border-color: #2563eb;
        }
        .dark .doc-law-card:hover {
          box-shadow: 0 15px 35px rgba(0,0,0,0.4);
          border-color: #c2a878;
        }
        .doc-law-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .doc-law-icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: #2563eb;
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem;
        }
        .dark .doc-law-icon {
          background: #c69f6f;
          color: #1a1614;
        }
        .doc-law-year {
          font-size: 0.8rem;
          font-weight: 700;
          color: #6b7280; /* gray-500 */
          background: #f3f4f6; /* gray-100 */
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
        }
        .dark .doc-law-year {
          background: #1e1e1e;
          color: #c2a878;
        }
        .doc-law-cat-tag {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.5rem;
          color: #2563eb; /* blue-600 */
        }
        .dark .doc-law-cat-tag {
          color: #c2a878;
        }
        .doc-law-title {
          font-size: 1.15rem;
          font-weight: 800;
          color: #111827; /* gray-900 */
          margin: 0 0 0.75rem;
          line-height: 1.4;
        }
        .dark .doc-law-title { color: #e2e8f0; }
        .doc-law-desc {
          font-size: 0.9rem;
          color: #4b5563; /* gray-600 */
          line-height: 1.6;
          margin: 0 0 1.5rem;
          flex: 1;
        }
        .dark .doc-law-desc { color: #94a3b8; }
        .doc-law-footer {
          font-size: 0.9rem;
          font-weight: 700;
          color: #2563eb; /* blue-600 */
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .dark .doc-law-footer {
          color: #c2a878;
        }
        .doc-law-arrow {
          font-size: 0.8rem;
        }
        .doc-law-card:hover .doc-law-arrow {
          transform: none;
        }

        /* ─── DETAIL VIEW ─── */
        .doc-detail-container {
          max-width: 850px;
          margin: 0 auto;
        }
        .doc-detail-header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: #fff;
          margin-bottom: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        .dark .doc-detail-header { 
          background: #111111; 
          border-color: #2a2a2a;
          box-shadow: none;
        }
        .doc-detail-icon-wrap {
          width: 64px; height: 64px;
          border-radius: 18px;
          background: #2563eb;
          color: white;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem;
          flex-shrink: 0;
          border: 1px solid #2563eb;
        }
        .dark .doc-detail-icon-wrap {
          background: #c69f6f;
          color: #1a1614;
          border-color: #c69f6f;
        }
        .doc-cat-badge {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.75px;
          padding: 0.35rem 0.85rem;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          background: #eff6ff;
          color: #2563eb;
        }
        .dark .doc-cat-badge {
          background: #1e1e1e;
          color: #c2a878;
        }
        .doc-detail-title {
          font-size: 2.25rem;
          font-weight: 900;
          margin: 0 0 0.5rem;
          color: #2563eb;
          line-height: 1.1;
        }
        .dark .doc-detail-title {
          color: #c2a878;
        }
        .doc-detail-year {
          font-size: 0.95rem;
          color: #6b7280; /* gray-500 */
          font-weight: 600;
        }
        .doc-detail-desc {
          font-size: 1.1rem;
          color: #374151; /* gray-700 */
          line-height: 1.8;
          background: #fff;
          border: 1px solid #e5e7eb; /* gray-200 */
          border-radius: 20px;
          padding: 1.75rem 2rem;
          margin-bottom: 2rem;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
        }
        .dark .doc-detail-desc {
          background: #111111;
          border-color: #2a2a2a;
          color: #cbd5e1;
          box-shadow: none;
        }
        .doc-detail-info {
          margin-bottom: 2rem;
        }
        .doc-info-label {
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #94a3b8;
          margin: 0 0 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .doc-info-label::after {
          content: '';
          height: 1px;
          flex: 1;
          background: #f1f5f9;
        }
        .dark .doc-info-label::after {
          background: #1e1e1e;
        }
        .doc-source-text {
          font-size: 1rem;
          color: #1e3a8a; /* blue-900 */
          background: #eff6ff; /* blue-50 */
          border: 1px solid #dbeafe; /* blue-100 */
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          line-height: 1.7;
          margin: 0;
          font-weight: 600;
          font-style: italic;
        }
        .dark .doc-source-text {
          background: #151515;
          border-color: #1e1e2e;
          color: #94a3b8;
        }
        .doc-links-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }
        .doc-link-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          text-decoration: none;
        }
        .dark .doc-link-card { 
          background: #111111; 
          border-color: #2a2a2a;
        }
        .doc-link-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 25px rgba(37, 99, 235, 0.1);
          border-color: #2563eb;
        }
        .dark .doc-link-card:hover {
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          border-color: #c2a878;
        }
        .doc-link-icon { 
          font-size: 1.25rem; 
          flex-shrink: 0; 
          color: #2563eb;
        }
        .dark .doc-link-icon {
          color: #c2a878;
        }
        .doc-link-name {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1e293b;
          flex: 1;
        }
        .dark .doc-link-name { color: #e2e8f0; }
        .doc-link-arrow { 
          font-size: 0.9rem; 
          flex-shrink: 0; 
          opacity: 0.5; 
          color: #2563eb;
        }
        .dark .doc-link-arrow { color: #c2a878; }
        .doc-link-card:hover .doc-link-arrow {
          opacity: 1;
        }

        /* ─── BACK BUTTON ─── */
        .doc-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.65rem 1.25rem;
          border-radius: 12px;
          border: 2px solid #f3f4f6; /* gray-100 */
          background: #fff;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 2rem;
          color: #4b5563; /* gray-600 */
        }
        .dark .doc-back-btn {
          background: #111111;
          border-color: #2a2a2a;
          color: #c2a878;
        }
        .doc-back-btn:hover { 
          background: #f9fafb; /* gray-50 */
          border-color: #2563eb; /* blue-600 */
          color: #2563eb;
        }
        .dark .doc-back-btn:hover {
          background: #1e1e1e;
          border-color: #c2a878;
          color: #c2a878;
        }

        @media (max-width: 640px) {
          .doc-header-title { font-size: 1.8rem; }
          .doc-categories-grid { grid-template-columns: 1fr; }
          .doc-laws-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default DocumentsPage;
