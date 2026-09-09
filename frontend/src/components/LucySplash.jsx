import React, { useState, useEffect } from 'react';
import img1 from '../assets/splash/img1.jpg';
import img2 from '../assets/splash/img2.jpg';
import img3 from '../assets/splash/img3.jpg';
import img4 from '../assets/splash/img4.jpg';

import img5 from '../assets/splash/img5.jpeg';
import img6 from '../assets/splash/img6.jpeg';
import img7 from '../assets/splash/img7.jpeg';
import img8 from '../assets/splash/img8.jpeg';

import luffy from '../assets/splash/luffy.jpeg'
import luffy1 from '../assets/splash/luffy1.jpeg';
import luffy2 from '../assets/splash/luffy2.jpeg';
import luffy3 from '../assets/splash/luffy3.jpeg';
import luffy4 from '../assets/splash/luffy4.jpeg';
import luffy5 from '../assets/splash/luffy5.jpeg';
import luffy6 from '../assets/splash/luffy6.jpg';
import luffy7 from '../assets/splash/luffy7.jpeg';
import luffy8 from '../assets/splash/luffy8.jpeg';
import luffy9 from '../assets/splash/luffy9.jpeg';
import luffy10 from '../assets/splash/luffy10.jpeg';
import luffy11 from '../assets/splash/luffy11.jpeg';
import luffy12 from '../assets/splash/luffy12.jpeg';
import luffy13 from '../assets/splash/luffy13.jpeg';
import luffy14 from '../assets/splash/luffy14.jpeg';
import luffy15 from '../assets/splash/luffy15.jpeg';
import luffy16 from '../assets/splash/luffy16.jpeg';
import luffy17 from '../assets/splash/luffy17.jpeg';
import luffy18 from '../assets/splash/luffy18.jpeg';


const ALL_IMAGES = [img5, img6, img7, img8, luffy, luffy1, luffy2, luffy3, luffy4, luffy5, luffy6, luffy7, luffy8, luffy9, luffy10, luffy11, luffy12, luffy13, luffy14, luffy15, luffy16, luffy17, luffy18];
const IMAGE_DURATION = 400; // ms each image stays visible

// Helper to pick 4 unique random images
const getRandomImages = (images, count = 4) => {
  const pool = [...images];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
};

export default function LucySplash({ loading, onDone }) {
  const [images] = useState(() => getRandomImages(ALL_IMAGES, 4));
  const [activeIndex, setActiveIndex] = useState(-1);
  const [allShown, setAllShown] = useState(false);
  const [phase, setPhase] = useState('enter');

  // Step 1: Open image slot after letters appear
  useEffect(() => {
    const t = setTimeout(() => {
      setActiveIndex(0);
      setPhase('cycling');
    }, 350);
    return () => clearTimeout(t);
  }, []);

  // Step 2: Cycle through images
  useEffect(() => {
    if (activeIndex < 0 || activeIndex >= images.length) return;

    const t = setTimeout(() => {
      if (activeIndex < images.length - 1) {
        setActiveIndex((i) => i + 1);
      } else {
        setAllShown(true);
      }
    }, IMAGE_DURATION);

    return () => clearTimeout(t);
  }, [activeIndex, images.length]);

  // Step 3: Once all images shown AND loading done → collapse
  useEffect(() => {
    if (allShown && !loading) {
      const t = setTimeout(() => setPhase('collapse'), 200);
      return () => clearTimeout(t);
    }
  }, [allShown, loading]);

  // Step 4: After collapse animation → notify parent
  useEffect(() => {
    if (phase === 'collapse') {
      const t = setTimeout(() => {
        setPhase('done');
        onDone?.();
      }, 650);
      return () => clearTimeout(t);
    }
  }, [phase, onDone]);

  if (phase === 'done') return null;

  const isOpen = phase === 'cycling' || phase === 'collapse';
  const isCollapse = phase === 'collapse';

  return (
    <div className={`lucy-splash ${isCollapse ? 'lucy-splash--exit' : ''}`}>
      <div className="lucy-row">
        {/* L U */}
        <span className="lucy-char" style={{ animationDelay: '0ms' }}>L</span>
        <span className="lucy-char" style={{ animationDelay: '60ms' }}>U</span>

        {/* Image carousel slot */}
        <div className={`lucy-slot ${isOpen ? 'lucy-slot--open' : ''} ${isCollapse ? 'lucy-slot--close' : ''}`}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              draggable={false}
              className={`lucy-slide ${i === activeIndex ? 'lucy-slide--active' : ''}`}
            />
          ))}
        </div>

        {/* C Y */}
        <span className="lucy-char" style={{ animationDelay: '120ms' }}>C</span>
        <span className="lucy-char" style={{ animationDelay: '180ms' }}>Y</span>
      </div>

      {/* Loading dots */}
      {!isCollapse && (
        <div className="lucy-dots">
          <span /><span /><span />
        </div>
      )}

      <style>{`
        .lucy-splash {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          background: hsl(var(--background));
          transition: opacity 0.45s ease, transform 0.45s ease;
        }
        .lucy-splash--exit {
          opacity: 0;
          transform: scale(1.04);
          pointer-events: none;
        }

        /* ── Letter row ── */
        .lucy-row {
          display: flex;
          align-items: center;
        }

        .lucy-char {
          font-family: var(--font-inter), ui-sans-serif, system-ui, -apple-system, sans-serif;
          font-weight: 800;
          font-size: clamp(4rem, 12vw, 9rem);
          line-height: 1;
          letter-spacing: -0.04em;
          color: hsl(var(--foreground));
          opacity: 0;
          transform: translateY(28px);
          animation: lucyCharIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          user-select: none;
        }

        @keyframes lucyCharIn {
          to { opacity: 1; transform: translateY(0); }
        }

        /* ── Image slot ── */
        .lucy-slot {
          position: relative;
          width: 0;
          height: clamp(5.5rem, 14vw, 11rem);
          overflow: hidden;
          border-radius: 6px;
          margin: 0;
          flex-shrink: 0;
          transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
                      margin 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .lucy-slot--open {
          width: clamp(4.5rem, 11vw, 9rem);
          margin: 0 0.25rem;
        }
        .lucy-slot--close {
          width: 0;
          margin: 0;
          transition: width 0.4s cubic-bezier(0.55, 0, 1, 0.45),
                      margin 0.4s cubic-bezier(0.55, 0, 1, 0.45);
        }

        /* ── Individual slides ── */
        .lucy-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0;
          transform: scale(1.08);
          transition: opacity 0.35s ease, transform 0.5s ease;
          pointer-events: none;
        }
        .lucy-slide--active {
          opacity: 1;
          transform: scale(1);
        }

        /* ── Loading dots ── */
        .lucy-dots {
          display: flex;
          gap: 6px;
        }
        .lucy-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: hsl(var(--muted-foreground));
          animation: lucyDot 1s ease-in-out infinite;
        }
        .lucy-dots span:nth-child(2) { animation-delay: 0.15s; }
        .lucy-dots span:nth-child(3) { animation-delay: 0.3s; }

        @keyframes lucyDot {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50%      { opacity: 0.7; transform: scale(1.15); }
        }

        @media (max-width: 480px) {
          .lucy-slot--open { width: 3.5rem; }
        }
      `}</style>
    </div>
  );
}
