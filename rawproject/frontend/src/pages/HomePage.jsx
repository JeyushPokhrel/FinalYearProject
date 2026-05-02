import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faScaleBalanced, 
  faGavel, 
  faBook, 
  faShieldHalved,
  faLandmark,
  faSection,
  faFileContract,
  faBalanceScale
} from '@fortawesome/free-solid-svg-icons';

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  const phrases = [
    t('typing_1'),
    t('typing_2'),
    t('typing_3'),
    t('typing_4')
  ];

  useEffect(() => {
    const handleTyping = () => {
      const current = loopNum % phrases.length;
      const fullText = phrases[current];

      if (isDeleting) {
        setDisplayText(fullText.substring(0, displayText.length - 1));
        setTypingSpeed(50);
      } else {
        setDisplayText(fullText.substring(0, displayText.length + 1));
        setTypingSpeed(150);
      }

      if (!isDeleting && displayText === fullText) {
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, typingSpeed]);

  // Generate a jittered grid to ensure even distribution and no overlap
  const backgroundLogos = useMemo(() => {
    const icons = [faScaleBalanced, faGavel, faBook, faShieldHalved, faLandmark, faSection, faFileContract, faBalanceScale];
    const items = [];
    const rows = 5;
    const cols = 6;
    
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const iconIndex = (r * cols + c) % icons.length;
        // Jitter the position slightly within the grid cell
        const jitterX = (Math.random() - 0.5) * 10; // +/- 5%
        const jitterY = (Math.random() - 0.5) * 10; // +/- 5%
        
        items.push({
          icon: icons[iconIndex],
          top: `${(r * 100 / rows) + 10 + jitterY}%`,
          left: `${(c * 100 / cols) + 8 + jitterX}%`,
          rotation: `${(Math.random() * 40) - 20}deg`,
          size: `${(Math.random() * 1.5) + 3.5}rem`, // 3.5rem to 5rem (Professional size)
        });
      }
    }
    return items;
  }, []);

  return (
    <div className="home-container">
      
      {/* Jittered Grid Background Layer */}
      <div className="background-decor">
        {backgroundLogos.map((logo, index) => (
          <div 
            key={index} 
            className="bg-logo-item" 
            style={{ 
              top: logo.top, 
              left: logo.left, 
              transform: `rotate(${logo.rotation})`,
              fontSize: logo.size
            }}
          >
            <FontAwesomeIcon icon={logo.icon} />
          </div>
        ))}
      </div>

      {/* Hero Card */}
      <div className="hero-card">
        <div className="card-inner">
          
          <div className="brand-logo">
            <FontAwesomeIcon icon={faScaleBalanced} />
          </div>

          <h1 className="title">
            {t('app_name')}
          </h1>

          <div className="typing-box">
            <p className="typing-text">{displayText}</p>
          </div>

          <p className="description">
            {t('home_desc')}
          </p>

          <div className="button-group">
            <button 
              className="btn-primary"
              onClick={() => navigate('/chatbot')}
            >
              {t('start_chat')}
            </button>

            <button 
              className="btn-secondary"
              onClick={() => navigate('/law-explorer')}
            >
              {t('law_explorer')}
            </button>
          </div>
          
          <div className="trust-badges">
            <div className="badge">
              <FontAwesomeIcon icon={faShieldHalved} />
              <span>{t('secure')}</span>
            </div>
            <div className="badge">
              <FontAwesomeIcon icon={faScaleBalanced} />
              <span>{t('reliable')}</span>
            </div>
            <div className="badge">
              <FontAwesomeIcon icon={faGavel} />
              <span>{t('official_sources')}</span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .home-container {
          min-height: calc(100vh - 80px);
          background-color: #f5f7f9;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 1rem;
        }
        
        .dark .home-container {
          background-color: #0c0a09;
        }

        .background-decor {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .bg-logo-item {
          position: absolute;
          color: rgba(37, 99, 235, 0.08); /* Clear but professional opacity */
          transition: color 0.3s;
          user-select: none;
        }

        .dark .bg-logo-item {
          color: rgba(198, 159, 111, 0.1);
        }

        .hero-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 850px;
        }

        .card-inner {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          padding: 5rem 3rem;
          border-radius: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.08);
          text-align: center;
        }

        .dark .card-inner {
          background: #1a1614;
          border-color: #3d312d;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .brand-logo {
          display: inline-flex;
          padding: 1.25rem;
          background: #2563eb;
          color: white;
          border-radius: 1.5rem;
          font-size: 2.5rem;
          margin-bottom: 2rem;
        }

        .dark .brand-logo {
          background: #c69f6f;
          color: #1a1614;
        }

        .title {
          font-size: 3.5rem;
          font-weight: 900;
          color: #111827;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .dark .title {
          color: white;
        }

        .typing-box {
          height: 4rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2.5rem;
        }

        .typing-text {
          font-size: 1.5rem;
          font-weight: 700;
          color: #2563eb;
        }

        .dark .typing-text {
          color: #c69f6f;
        }

        .description {
          font-size: 1.25rem;
          color: #4b5563;
          max-width: 650px;
          margin: 0 auto 3.5rem auto;
          line-height: 1.6;
        }

        .dark .description {
          color: #d6c0a5;
        }

        .button-group {
          display: flex;
          gap: 1.5rem;
          justify-content: center;
          margin-bottom: 5rem;
        }

        .btn-primary {
          padding: 1.1rem 3rem;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 1.1rem;
          font-size: 1.25rem;
          font-weight: 700;
          cursor: pointer;
        }

        .dark .btn-primary {
          background: #c69f6f;
          color: #1a1614;
        }

        .btn-secondary {
          padding: 1.1rem 3rem;
          background: white;
          border: 1px solid #e5e7eb;
          color: #374151;
          border-radius: 1.1rem;
          font-size: 1.25rem;
          font-weight: 700;
          cursor: pointer;
        }

        .dark .btn-secondary {
          background: #2a2420;
          border-color: #4a3b35;
          color: #f5e6d3;
        }

        .trust-badges {
          display: flex;
          justify-content: center;
          gap: 3rem;
          border-top: 1px solid #f3f4f6;
          padding-top: 3rem;
          opacity: 0.7;
        }

        .dark .trust-badges {
          border-color: #302623;
        }

        .badge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #4b5563;
        }

        .dark .badge {
          color: #f5e6d3;
        }

        @media (max-width: 768px) {
          .title { font-size: 2.8rem; }
          .button-group { flex-direction: column; }
          .trust-badges { gap: 1.5rem; flex-wrap: wrap; }
          .bg-logo-item { font-size: 3rem !important; }
        }
      `}} />
    </div>
  );
};

export default HomePage;