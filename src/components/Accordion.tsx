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
      background: 'rgba(10,10,10,0.6)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOffen(!offen)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '16px 20px',
          background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)',
          }}>{titel}</span>
          {badge && (
            <span style={{
              background: 'rgba(0,242,255,0.1)', color: '#00f2ff',
              border: '1px solid rgba(0,242,255,0.25)',
              fontSize: 9, fontWeight: 700, borderRadius: 10,
              padding: '2px 7px', fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.05em',
            }}>{badge}</span>
          )}
        </span>
        <span style={{
          fontSize: 10, color: 'rgba(255,255,255,0.3)',
          transform: offen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          display: 'inline-block', fontFamily: 'monospace',
        }}>▼</span>
      </button>
      <div ref={contentRef} style={{ height: hoehe, overflow: 'hidden', transition: 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)' }}>
        <div style={{ padding: '0 20px 18px' }}>{children}</div>
      </div>
    </div>
  );
}
