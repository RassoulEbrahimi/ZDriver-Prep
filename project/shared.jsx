// ZDriver — shared screen primitives:
// Header, TabBar, ProgressRing, QuestionCard, OptionRow, JourneyPath

const { useState, useEffect, useRef, useMemo } = React;

// Tiny helper: persian digits
const fa = (n) => String(n).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

// ─────────────────────────────────────────────────────────────
// Header — top bar inside each screen
// title, subtitle, optional left/right glyphs
// ─────────────────────────────────────────────────────────────
function ZDHeader({ title, subtitle, leading, trailing, dark = false, decorative = false }) {
  return (
    <div className="zd-header" style={{
      background: decorative
        ? 'transparent'
        : 'transparent',
    }}>
      <div className="zd-header-row">
        <div>{leading}</div>
        <div style={{ display: 'flex', gap: 8 }}>{trailing}</div>
      </div>
      {(title || subtitle) && (
        <div style={{ marginTop: 6 }}>
          {subtitle && <div className="zd-eyebrow" style={{ marginBottom: 4, color: decorative ? 'rgba(255,255,255,0.7)' : 'var(--ink-3)' }}>{subtitle}</div>}
          {title && <div className="zd-h1" style={{ color: decorative ? '#fff' : 'var(--ink)' }}>{title}</div>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// TabBar — floating bottom nav
// ─────────────────────────────────────────────────────────────
function ZDTabBar({ active, onChange }) {
  const tabs = [
    { id: 'home',     label: 'مسیر',    icon: ZD_ICONS.home },
    { id: 'practice', label: 'تمرین',   icon: ZD_ICONS.book },
    { id: 'exam',     label: 'آزمون',   icon: ZD_ICONS.trophy },
    { id: 'mistakes', label: 'اشتباهات', icon: ZD_ICONS.flag },
    { id: 'progress', label: 'پیشرفت', icon: ZD_ICONS.chart },
  ];
  return (
    <div className="zd-tabbar" role="tablist">
      {tabs.map(t => {
        const Icon = t.icon;
        const isActive = active === t.id;
        return (
          <div key={t.id} role="tab" aria-selected={isActive}
               className={`zd-tab ${isActive ? 'is-active' : ''}`}
               onClick={() => onChange(t.id)}>
            <Icon size={22} stroke={isActive ? 2.1 : 1.7} />
            <div>{t.label}</div>
            <div className="zd-tab-dot" />
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ProgressRing — SVG-based circular progress
// ─────────────────────────────────────────────────────────────
function ZDRing({ value = 0, size = 140, stroke = 12, color = 'var(--accent)', bg = 'rgba(255,255,255,0.18)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={bg} strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={off}
                style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.5,.1,.2,1)' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// JourneyPath — a winding road metaphor of category nodes
// ─────────────────────────────────────────────────────────────
function ZDJourney({ categories, onPick }) {
  // layout: 5 nodes on a zigzag inside an SVG, alternating right/left
  const W = 320, H = 460;
  const positions = [
    { x: 250, y: 60 },
    { x: 100, y: 140 },
    { x: 240, y: 230 },
    { x: 110, y: 320 },
    { x: 250, y: 410 },
  ];
  // Smooth path
  const pathD = positions.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = positions[i-1];
    const cx1 = prev.x; const cy1 = (prev.y + p.y) / 2;
    const cx2 = p.x; const cy2 = (prev.y + p.y) / 2;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`;
  }, '');

  return (
    <div style={{ position: 'relative', width: '100%', height: H, margin: '0 auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
           style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="zd-journey-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="var(--grad-via)" stopOpacity="0.35"/>
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.55"/>
          </linearGradient>
        </defs>
        {/* dashed path (the road) */}
        <path d={pathD} stroke="var(--line-2)" strokeWidth="3" fill="none"
              strokeDasharray="2 7" strokeLinecap="round" opacity="0.65"/>
        {/* progress path (filled to completed nodes) */}
      </svg>
      {positions.map((p, i) => {
        const cat = categories[i];
        if (!cat) return null;
        const pct = Math.round((cat.done / cat.total) * 100);
        const done = pct >= 100;
        const started = pct > 0;
        return (
          <button key={cat.id}
                  onClick={() => onPick && onPick(cat)}
                  style={{
                    position: 'absolute',
                    right: `${(W - p.x - 35) / W * 100}%`,
                    top: p.y - 35,
                    width: 70, height: 70,
                    borderRadius: 24,
                    background: done
                      ? 'var(--success)'
                      : started
                        ? `linear-gradient(135deg, ${cat.color}, color-mix(in oklab, ${cat.color} 60%, var(--accent)))`
                        : 'var(--card)',
                    border: started ? 'none' : `2px dashed var(--line-2)`,
                    color: started ? '#fff' : 'var(--ink-3)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: started ? '0 8px 20px rgba(75,58,140,0.20)' : 'none',
                    fontFamily: 'var(--font)',
                    transition: 'transform .15s',
                    padding: 0,
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
                  onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ textAlign: 'center', fontSize: 11, lineHeight: 1.2, padding: '0 6px' }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{cat.emoji}</div>
              <div style={{ fontSize: 10, fontWeight: 600, marginTop: 2 }}>
                {fa(pct)}٪
              </div>
            </div>
          </button>
        );
      })}
      {positions.map((p, i) => {
        const cat = categories[i];
        if (!cat) return null;
        const isLeft = p.x < W / 2;
        return (
          <div key={cat.id + '-l'} style={{
            position: 'absolute',
            top: p.y - 16,
            [isLeft ? 'left' : 'right']: isLeft ? 12 : 12,
            [isLeft ? 'right' : 'left']: 'auto',
            width: 130,
            textAlign: isLeft ? 'left' : 'right',
            direction: 'rtl',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{cat.title}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
              {fa(cat.done)} از {fa(cat.total)} سؤال
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// QuestionCard — displays a question + 4 options + (optional) explanation
// ─────────────────────────────────────────────────────────────
function ZDQuestionCard({
  question, selected, onSelect, submitted, showExplanation = true,
  bookmarked = false, onBookmark, signKind, // optional 'stop'|'warn'|'mandatory'|'speed'
  signN,
}) {
  const correctIdx = question.answer;
  const isCorrect = submitted && selected === correctIdx;
  const isWrong = submitted && selected !== null && selected !== correctIdx;

  let Sign = null;
  if (signKind && ZD_SIGN[signKind]) Sign = ZD_SIGN[signKind];

  return (
    <div className="zd-card zd-fade-up" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <span className="zd-chip">
          <span style={{ width: 6, height: 6, borderRadius: 99, background: 'var(--primary)' }} />
          {question.catLabel || 'تمرین'}
        </span>
        <button onClick={onBookmark}
                aria-label="نشان‌گذاری"
                style={{
                  background: bookmarked ? 'color-mix(in oklab, var(--accent) 18%, transparent)' : 'transparent',
                  border: 'none', cursor: 'pointer',
                  width: 36, height: 36, borderRadius: 12,
                  display: 'grid', placeItems: 'center',
                  color: bookmarked ? 'var(--accent-deep)' : 'var(--ink-3)',
                }}>
          {bookmarked ? <ZD_ICONS.bookmarkFill size={20}/> : <ZD_ICONS.bookmark size={20}/>}
        </button>
      </div>

      {Sign && (
        <div style={{
          background: 'var(--bg-deeper)',
          borderRadius: 16, padding: 18,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          marginBottom: 14,
        }}>
          <Sign size={88} n={signN} />
        </div>
      )}

      <div style={{ fontSize: 17, lineHeight: 1.65, fontWeight: 600, color: 'var(--ink)' }}>
        {question.text}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
        {question.options.map((opt, i) => {
          const isSel = selected === i;
          let cls = 'zd-option';
          if (submitted) {
            if (i === correctIdx) cls += ' is-correct';
            else if (isSel) cls += ' is-wrong';
          } else if (isSel) cls += ' is-selected';
          return (
            <div key={i} className={cls} onClick={() => !submitted && onSelect(i)}>
              <div className="zd-opt-letter">{['الف','ب','ج','د'][i]}</div>
              <div className="zd-opt-text">{opt}</div>
              <div className="zd-opt-mark">
                {submitted && i === correctIdx && <ZD_ICONS.check size={22} color="var(--success)" stroke={2.4}/>}
                {submitted && isSel && i !== correctIdx && <ZD_ICONS.x size={22} color="var(--danger)" stroke={2.4}/>}
              </div>
            </div>
          );
        })}
      </div>

      {submitted && showExplanation && (
        <div className="zd-fade-up" style={{
          marginTop: 16,
          padding: 14,
          background: isCorrect ? 'var(--success-soft)' : 'var(--primary-soft)',
          borderRadius: 14,
          border: `1px solid ${isCorrect ? 'color-mix(in oklab, var(--success) 30%, transparent)' : 'color-mix(in oklab, var(--primary) 20%, transparent)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 8,
              background: isCorrect ? 'var(--success)' : 'var(--primary)',
              color: '#fff', display: 'grid', placeItems: 'center',
            }}>
              {isCorrect ? <ZD_ICONS.check size={16} stroke={2.6}/> : <ZD_ICONS.bulb size={16} stroke={2}/>}
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: isCorrect ? 'var(--success)' : 'var(--primary-ink)' }}>
              {isCorrect ? 'پاسخ درست' : 'توضیح'}
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65 }}>
            {question.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Stat card mini
// ─────────────────────────────────────────────────────────────
function ZDStat({ label, value, sub, color = 'var(--primary)', icon }) {
  const Icon = icon;
  return (
    <div className="zd-card" style={{ padding: 14, flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: `color-mix(in oklab, ${color} 14%, transparent)`,
            color: color,
            display: 'grid', placeItems: 'center',
          }}>
            <Icon size={16} stroke={2}/>
          </div>
        )}
      </div>
      <div className="zd-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, { ZDHeader, ZDTabBar, ZDRing, ZDJourney, ZDQuestionCard, ZDStat, fa });
