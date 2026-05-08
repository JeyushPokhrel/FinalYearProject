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
            style={{ borderColor: cat.accent, color: cat.accent }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            &nbsp; Back to {cat.label}
          </button>

          <div className="doc-detail-header">
            <div className="doc-detail-icon-wrap">
              <FontAwesomeIcon icon={faBook} style={{ color: cat.accent }} />
            </div>
            <div>
              <div className="doc-cat-badge" style={{ background: cat.accent + "22", color: cat.accent }}>
                {cat.label}
              </div>
              <h2 className="doc-detail-title" style={{ color: cat.accent }}>
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
              <FontAwesomeIcon icon={cat.icon} style={{ color: cat.accent }} />
            </div>
            <div>
              <h2 className="doc-cat-banner-title" style={{ color: cat.accent }}>
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
              <div className="doc-law-cat-tag" style={{ color: cat.accent }}>
                {cat.label}
              </div>
              <h3 className="doc-law-title">{law.title}</h3>
              <p className="doc-law-desc">{law.description}</p>
              <div className="doc-law-footer" style={{ color: cat.accent }}>
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
        <div className="doc-header-icon-wrap">
          <FontAwesomeIcon icon={faScaleBalanced} className="doc-header-icon" />
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
                  <FontAwesomeIcon icon={cat.icon} style={{ color: cat.accent }} />
                </div>
                <h2 className="doc-cat-name" style={{ color: cat.accent }}>
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
                  <span className="doc-cat-law-count" style={{ background: cat.accent + "22", color: cat.accent }}>
                    {lawCount} {lawCount === 1 ? "Law" : "Laws"}
                  </span>
                  <span className="doc-cat-explore" style={{ color: cat.accent }}>
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
          background: var(--doc-bg, #f8f9fa);
          padding: 2.5rem 1.5rem 4rem;
          transition: background 0.3s;
        }
        .dark .doc-page {
          background: #0a0a0f;
        }

        /* ─── HEADER ─── */
        .doc-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .doc-header-icon-wrap {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px; height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #1e3a8a, #1d4ed8);
          margin-bottom: 1rem;
          box-shadow: 0 8px 32px rgba(29,78,216,0.3);
        }
        .dark .doc-header-icon-wrap {
          background: linear-gradient(135deg, #92400e, #b45309);
          box-shadow: 0 8px 32px rgba(180,83,9,0.3);
        }
        .doc-header-icon {
          font-size: 1.75rem;
          color: #fff;
        }
        .doc-header-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1e3a8a;
          margin: 0 0 0.75rem;
          letter-spacing: -0.5px;
        }
        .dark .doc-header-title { color: #c2a878; }
        .doc-header-subtitle {
          color: #64748b;
          max-width: 560px;
          margin: 0 auto;
          font-size: 1.05rem;
          line-height: 1.7;
        }
        .dark .doc-header-subtitle { color: #94a3b8; }

        /* ─── CATEGORY GRID ─── */
        .doc-categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ─── CATEGORY CARD ─── */
        .doc-cat-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s, border-color 0.3s;
          min-height: 220px;
          display: flex;
          flex-direction: column;
          background: #fff;
          border: 1px solid #e2e8f0;
        }
        .dark .doc-cat-card {
          background: #111111;
          border-color: #2a2a2a;
        }
        .doc-cat-card:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow: 0 24px 60px rgba(0,0,0,0.1);
          border-color: #1d4ed8;
        }
        .dark .doc-cat-card:hover {
          box-shadow: 0 24px 60px rgba(0,0,0,0.4);
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
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          margin-bottom: 1rem;
          transition: background 0.3s;
        }
        .dark .doc-cat-icon-circle {
          background: #1e1e1e;
        }
        .doc-cat-card:hover .doc-cat-icon-circle {
          background: #e2e8f0;
        }
        .dark .doc-cat-card:hover .doc-cat-icon-circle {
          background: #2a2a2a;
        }
        .doc-cat-name {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0 0 0.4rem;
          line-height: 1.3;
        }
        .doc-cat-subtitle {
          font-size: 0.875rem;
          color: #64748b;
          margin: 0 0 1rem;
          line-height: 1.5;
        }
        .dark .doc-cat-subtitle {
          color: #94a3b8;
        }
        .doc-cat-preview {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex: 1;
        }
        .doc-cat-preview-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dark .doc-cat-preview-item {
          color: #94a3b8;
        }
        .doc-cat-preview-icon {
          font-size: 0.7rem;
          opacity: 0.6;
        }
        .doc-cat-preview-more {
          font-size: 0.75rem;
          color: #94a3b8;
          font-style: italic;
          margin-top: 0.2rem;
        }
        .doc-cat-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .doc-cat-law-count {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.3rem 0.75rem;
          border-radius: 100px;
          background: #f1f5f9;
          color: #1e3a8a;
        }
        .dark .doc-cat-law-count {
          background: #1e1e1e;
          color: #c2a878;
        }
        .doc-cat-explore {
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          transition: gap 0.2s;
        }
        .doc-cat-card:hover .doc-cat-explore {
          gap: 0.6rem;
        }

        /* ─── CATEGORY BANNER (drill-down) ─── */
        .doc-cat-banner {
          border-radius: 20px;
          padding: 2rem;
          margin-bottom: 2rem;
          max-width: 1200px;
          margin-left: auto;
          margin-right: auto;
          background: #fff;
          border: 1px solid #e2e8f0;
          position: relative;
        }
        .dark .doc-cat-banner {
          background: #111111;
          border-color: #2a2a2a;
        }
        .doc-cat-banner-inner {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin: 1rem 0 0.5rem;
        }
        .doc-cat-banner-icon {
          width: 60px; height: 60px;
          border-radius: 16px;
          background: #f1f5f9;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem;
          border: 1px solid #e2e8f0;
        }
        .dark .doc-cat-banner-icon {
          background: #1e1e1e;
          border-color: #2a2a2a;
        }
        .doc-cat-banner-title {
          font-size: 1.75rem;
          font-weight: 800;
          margin: 0 0 0.2rem;
        }
        .doc-cat-banner-subtitle {
          color: #64748b;
          margin: 0;
          font-size: 0.9rem;
        }
        .dark .doc-cat-banner-subtitle {
          color: #94a3b8;
        }
        .doc-cat-count {
          color: #94a3b8;
          font-size: 0.85rem;
          margin: 0;
        }

        /* ─── LAWS GRID ─── */
        .doc-laws-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.25rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* ─── LAW CARD ─── */
        .doc-law-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
        }
        .dark .doc-law-card {
          background: #111118;
          border-color: #1e1e2e;
        }
        .doc-law-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.15);
          border-color: var(--cat-accent);
        }
        .dark .doc-law-card:hover {
          box-shadow: 0 16px 40px rgba(0,0,0,0.4);
        }
        .doc-law-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .doc-law-icon {
          width: 42px; height: 42px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.1rem;
        }
        .doc-law-year {
          font-size: 0.78rem;
          font-weight: 600;
          color: #94a3b8;
          background: #f1f5f9;
          padding: 0.25rem 0.6rem;
          border-radius: 100px;
        }
        .dark .doc-law-year {
          background: #1e1e2e;
          color: #64748b;
        }
        .doc-law-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.6rem;
          line-height: 1.4;
        }
        .dark .doc-law-title { color: #e2e8f0; }
        .doc-law-desc {
          font-size: 0.85rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 1.25rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .dark .doc-law-desc { color: #64748b; }
        .doc-law-footer {
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .doc-law-arrow {
          transition: transform 0.2s;
          font-size: 0.75rem;
        }
        .doc-law-card:hover .doc-law-arrow {
          transform: translateX(4px);
        }

        /* ─── DETAIL VIEW ─── */
        .doc-detail-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .doc-detail-header {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          background: #fff;
          margin-bottom: 1.5rem;
        }
        .dark .doc-detail-header { 
          background: #111111; 
          border-color: #2a2a2a;
        }
        .doc-detail-icon-wrap {
          width: 56px; height: 56px;
          border-radius: 14px;
          background: #f1f5f9;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }
        .dark .doc-detail-icon-wrap {
          background: #1e1e1e;
        }
        .doc-detail-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0 0 0.3rem;
        }
        .doc-detail-year {
          font-size: 0.82rem;
          color: #94a3b8;
          font-weight: 500;
        }
        .doc-detail-desc {
          font-size: 1rem;
          color: #475569;
          line-height: 1.8;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .dark .doc-detail-desc {
          background: #111118;
          border-color: #1e1e2e;
          color: #94a3b8;
        }
        .doc-cat-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          margin-bottom: 0.5rem;
        }
        .doc-detail-info {
          margin-bottom: 1.5rem;
        }
        .doc-info-label {
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
          margin: 0 0 0.75rem;
        }
        .doc-law-cat-tag {
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.4rem;
          opacity: 0.8;
        }
        .doc-source-text {
          font-size: 0.88rem;
          color: #64748b;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 1rem 1.25rem;
          line-height: 1.7;
          margin: 0;
        }
        .dark .doc-source-text {
          background: #111118;
          border-color: #1e1e2e;
          color: #64748b;
        }
        .doc-links-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .doc-link-card {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          padding: 1rem 1.25rem;
          background: #fff;
          border: 1px solid;
          border-radius: 12px;
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .dark .doc-link-card { background: #111118; }
        .doc-link-card:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
        }
        .doc-link-icon { font-size: 1.1rem; flex-shrink: 0; }
        .doc-link-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #1e293b;
          flex: 1;
        }
        .dark .doc-link-name { color: #e2e8f0; }
        .doc-link-arrow { font-size: 0.8rem; flex-shrink: 0; opacity: 0.7; }

        /* ─── BACK BUTTON ─── */
        .doc-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.1rem;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, color 0.2s, border-color 0.2s;
          margin-bottom: 1.5rem;
          color: #1e3a8a;
        }
        .dark .doc-back-btn {
          background: #111111;
          border-color: #2a2a2a;
          color: #c2a878;
        }
        .doc-back-btn:hover { 
          background: #f1f5f9; 
          border-color: #1d4ed8;
        }
        .dark .doc-back-btn:hover {
          background: #1e1e1e;
          border-color: #c2a878;
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
