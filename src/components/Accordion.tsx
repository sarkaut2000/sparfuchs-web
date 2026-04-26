import { useState, useRef, useEffect } from 'react';

interface Props {
  titel: string;
  children: React.ReactNode;
  defaultOffen?: boolean;
  badge?: string;
}

export default function Accordion({ titel, children, defaultOffen = true, badge }: Props) {
  const [offen, setOffen] = useState(defaultOffen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hoehe, setHoehe] = useState<string>(defaultOffen ? 'auto' : '0px');

  useEffect(() => {
    if (offen) {
      const h = contentRef.current?.scrollHeight ?? 0;
      setHoehe(`${h}px`);
      const t = setTimeout(() => setHoehe('auto'), 350);
      return () => clearTimeout(t);
    } else {
      const h = contentRef.current?.scrollHeight ?? 0;
      setHoehe(`${h}px`);
      requestAnimationFrame(() => requestAnimationFrame(() => setHoehe('0px')));
    }
  }, [offen]);

  return (
    <div style={{
      background: 'var(--surface)',
      backdropFilter: 'blur(20px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
      borderRadius: 'var(--radius)',
      border: '1px solid rgba(255,255,255,0.6)',
      boxShadow: 'var(--shadow)',
      marginBottom: 14,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOffen(!offen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '16px 18px',
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
          {titel}
          {badge && (
            <span style={{ background: 'var(--accent2)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 7px' }}>
              {badge}
            </span>
          )}
        </span>
        <span style={{
          fontSize: 14, color: 'var(--text3)',
          transform: offen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'inline-block',
        }}>▼</span>
      </button>
      <div
        ref={contentRef}
        style={{
          height: hoehe,
          overflow: 'hidden',
          transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div style={{ padding: '0 18px 16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
