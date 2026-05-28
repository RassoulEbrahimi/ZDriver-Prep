// ZDriver — Main App: state machine, screen routing, tweaks panel.

const { useState: useStateA, useEffect: useEffectA } = React;

// Palette: store as a string key. Map → CSS data-palette attr on root.
const PALETTES = {
  dusk:  { name: 'dusk',  colors: ['#4B3A8C', '#7B5FB8', '#F39867'], label: 'Dusk · indigo + coral' },
  ocean: { name: 'ocean', colors: ['#1F5687', '#4E9EC9', '#F2C04D'], label: 'Ocean · navy + sun' },
  ember: { name: 'ember', colors: ['#6E2E50', '#B5536E', '#F2B33E'], label: 'Ember · plum + amber' },
};

function ZDApp({ tweaks }) {
  const [tab, setTab] = useStateA('home'); // home | practice | exam | mistakes | progress
  const [examState, setExamState] = useStateA('idle'); // idle | active | result
  const [examResult, setExamResult] = useStateA(null);

  const goHome = () => { setTab('home'); setExamState('idle'); };
  const startExam = () => { setTab('exam'); setExamState('active'); };

  const onExamFinish = (result) => {
    setExamResult(result);
    setExamState('result');
  };

  const renderScreen = () => {
    if (tab === 'home')
      return <ZDHomeScreen
        progress={ZD_PROGRESS}
        categories={ZD_CATEGORIES}
        onContinue={() => setTab('practice')}
        onPickCategory={() => setTab('practice')}
        onStartExam={startExam}
        dark={tweaks.theme === 'dark'}
      />;
    if (tab === 'practice')
      return <ZDPracticeScreen
        questions={ZD_QUESTIONS}
        categories={ZD_CATEGORIES}
        progress={ZD_PROGRESS}
        onExitToHome={() => setTab('home')}
      />;
    if (tab === 'exam') {
      if (examState === 'result' && examResult)
        return <ZDExamResult
          result={examResult}
          onRetry={() => { setExamState('active'); setExamResult(null); }}
          onReviewWrong={() => { setTab('mistakes'); setExamState('idle'); }}
          onHome={goHome}
        />;
      return <ZDExamScreen
        questions={ZD_QUESTIONS}
        categories={ZD_CATEGORIES}
        onFinish={onExamFinish}
        onExit={goHome}
      />;
    }
    if (tab === 'mistakes')
      return <ZDMistakesScreen
        progress={ZD_PROGRESS}
        questions={ZD_QUESTIONS}
        categories={ZD_CATEGORIES}
        onRetry={() => setTab('practice')}
      />;
    if (tab === 'progress')
      return <ZDProgressScreen progress={ZD_PROGRESS} categories={ZD_CATEGORIES}/>;
  };

  // hide tab bar during active exam (focus mode)
  const showTabBar = !(tab === 'exam' && examState === 'active');

  return (
    <div className="zd-app" data-palette={tweaks.palette} data-theme={tweaks.theme} data-card={tweaks.cardStyle}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {renderScreen()}
        {showTabBar && <ZDTabBar active={tab === 'exam' ? 'exam' : tab} onChange={(t) => {
          if (t === 'exam') startExam();
          else { setTab(t); setExamState('idle'); }
        }}/>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tweaks-aware root
// ─────────────────────────────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "dusk",
  "theme": "light",
  "cardStyle": "soft",
  "showSpec": true
}/*EDITMODE-END*/;

function ZDRoot() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // mirror palette / theme to <html> so spec card under the device also restyles
  useEffectA(() => {
    document.documentElement.dataset.palette = tweaks.palette;
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.card = tweaks.cardStyle;
  }, [tweaks.palette, tweaks.theme, tweaks.cardStyle]);

  return (
    <>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 16px 60px',
        background: tweaks.theme === 'dark'
          ? 'radial-gradient(80% 60% at 50% 0%, #2a1f4e 0%, #0B0A1E 100%)'
          : 'radial-gradient(80% 60% at 50% 0%, #3a2c6e 0%, #1f1a36 100%)',
        position: 'relative',
        transition: 'background .4s',
      }}>
        {/* Brand mark above device */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 24,
          color: 'rgba(255,255,255,0.92)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'linear-gradient(135deg, #F39867, #C76B6B)',
            display: 'grid', placeItems: 'center',
            color: '#fff', fontWeight: 900, fontSize: 17,
            fontFamily: "'Vazirmatn', sans-serif",
            boxShadow: '0 6px 18px rgba(243,152,103,0.35)',
          }}>ز</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'Vazirmatn', sans-serif" }}>ZDriver</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: -2, fontFamily: "'Vazirmatn', sans-serif" }}>
              همراه آزمون رانندگی
            </div>
          </div>
        </div>

        {/* Phone */}
        <IOSDevice width={402} height={874} dark={tweaks.theme === 'dark'}>
          <ZDApp tweaks={tweaks} />
        </IOSDevice>

        {/* Caption */}
        <div style={{
          marginTop: 18, fontSize: 12, color: 'rgba(255,255,255,0.5)',
          fontFamily: "'Vazirmatn', sans-serif", textAlign: 'center', maxWidth: 380,
        }}>
          از نوار پایین برای جابه‌جایی بین صفحات استفاده کن · پنل Tweaks بالا‌سمت‌چپ
        </div>

        {/* Design system spec card */}
        {tweaks.showSpec && <ZDSpecCard />}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection title="Palette">
          <PaletteSwatchPicker value={tweaks.palette} onChange={v => setTweak('palette', v)}/>
        </TweakSection>

        <TweakSection title="Appearance">
          <TweakRadio label="Mode" value={tweaks.theme}
            onChange={v => setTweak('theme', v)}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark',  label: 'Dark' },
            ]}/>
          <TweakRadio label="Card style" value={tweaks.cardStyle}
            onChange={v => setTweak('cardStyle', v)}
            options={[
              { value: 'soft',  label: 'Soft' },
              { value: 'flat',  label: 'Flat' },
              { value: 'glass', label: 'Glass' },
            ]}/>
        </TweakSection>

        <TweakSection title="Layout">
          <TweakToggle label="Show design system spec" value={tweaks.showSpec}
            onChange={v => setTweak('showSpec', v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

// Custom swatch picker that emits a palette key string
function PaletteSwatchPicker({ value, onChange }) {
  return (
    <TweakRow label="Theme">
      <div style={{ display: 'flex', gap: 8 }}>
        {Object.values(PALETTES).map(p => {
          const selected = value === p.name;
          return (
            <button key={p.name} onClick={() => onChange(p.name)} title={p.label}
                    style={{
                      flex: 1, height: 44, borderRadius: 10,
                      padding: 0, cursor: 'pointer', overflow: 'hidden',
                      border: selected ? '2px solid #fff' : '1px solid rgba(255,255,255,0.15)',
                      boxShadow: selected ? '0 0 0 2px rgba(255,255,255,0.5)' : 'none',
                      display: 'flex',
                      background: 'transparent',
                    }}>
              <div style={{ flex: 2, background: p.colors[0] }}/>
              <div style={{ flex: 1, background: p.colors[1] }}/>
              <div style={{ flex: 1, background: p.colors[2] }}/>
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}

// ─────────────────────────────────────────────────────────────
// Design system spec card (below the phone)
// ─────────────────────────────────────────────────────────────
function ZDSpecCard() {
  const colorSwatches = [
    { name: 'grad-from', token: '--grad-from', use: 'Hero deep' },
    { name: 'grad-via',  token: '--grad-via',  use: 'Primary' },
    { name: 'grad-to',   token: '--grad-to',   use: 'Hero light' },
    { name: 'accent',    token: '--accent',    use: 'Action / highlight' },
    { name: 'success',   token: '--success',   use: 'Correct' },
    { name: 'danger',    token: '--danger',    use: 'Wrong' },
    { name: 'ink',       token: '--ink',       use: 'Primary text' },
    { name: 'ink-3',     token: '--ink-3',     use: 'Muted text' },
    { name: 'bg',        token: '--bg',        use: 'App background' },
    { name: 'card',      token: '--card',      use: 'Surfaces' },
  ];

  return (
    <div style={{
      marginTop: 48,
      width: 'min(880px, 100%)',
      background: 'rgba(255,255,255,0.97)',
      borderRadius: 24,
      padding: 28,
      fontFamily: "'Vazirmatn', sans-serif",
      color: '#1F1A36',
      boxShadow: '0 28px 60px rgba(0,0,0,0.35)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: '#7E7896', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
            Design System · ZDriver
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4 }}>
            Visual system — tokens & primitives
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#7E7896', maxWidth: 320, textAlign: 'left' }}>
          A calm "Tehran dusk" palette: indigo→violet gradients warmed by sunset coral. Built for adult, focused learning.
        </div>
      </div>

      {/* Colors */}
      <div style={{ marginBottom: 24 }}>
        <div style={specSection}>Colors</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {colorSwatches.map(s => (
            <div key={s.token} style={{
              borderRadius: 14, overflow: 'hidden',
              border: '1px solid rgba(31,26,54,0.08)',
            }}>
              <div style={{ height: 56, background: `var(${s.token})` }}/>
              <div style={{ padding: '8px 10px', background: '#fff' }}>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'ui-monospace, "SF Mono", monospace' }}>
                  {s.token}
                </div>
                <div style={{ fontSize: 10, color: '#7E7896', marginTop: 2 }}>{s.use}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div style={{ marginBottom: 24 }}>
        <div style={specSection}>Typography · Vazirmatn</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, direction: 'rtl' }}>
          {[
            { size: 28, weight: 800, label: 'H1 / 28 · 800', sample: 'مسیر یادگیری' },
            { size: 20, weight: 700, label: 'H2 / 20 · 700', sample: 'پیشرفت موضوعی' },
            { size: 17, weight: 600, label: 'Body / 17 · 600', sample: 'سرعت مجاز در شهر چقدر است؟' },
            { size: 15, weight: 500, label: 'Body / 15 · 500', sample: 'پاسخ درست را انتخاب کنید.' },
            { size: 13, weight: 600, label: 'Label / 13 · 600', sample: 'پاسخ درست' },
            { size: 11, weight: 600, label: 'Caption / 11 · 600', sample: '۲ روز پیش' },
          ].map((t, i) => (
            <div key={i} style={{ padding: 12, background: '#FBF9F5', borderRadius: 12 }}>
              <div style={{ fontSize: 10, color: '#7E7896', marginBottom: 8, direction: 'ltr', textAlign: 'left' }}>{t.label}</div>
              <div style={{ fontSize: t.size, fontWeight: t.weight, color: '#1F1A36', lineHeight: 1.3 }}>{t.sample}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Components */}
      <div style={{ marginBottom: 24 }}>
        <div style={specSection}>Core components</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, direction: 'rtl' }}>
          <SpecBox label="Primary button">
            <button style={{
              padding: '12px 18px', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, var(--grad-via), var(--grad-to))',
              color: '#fff', fontWeight: 700, fontFamily: 'inherit', fontSize: 14,
              boxShadow: '0 6px 16px color-mix(in oklab, var(--grad-via) 35%, transparent)',
            }}>ادامه دادن</button>
          </SpecBox>
          <SpecBox label="Accent button">
            <button style={{
              padding: '12px 18px', borderRadius: 12, border: 'none',
              background: 'var(--accent)', color: '#fff', fontWeight: 700,
              fontFamily: 'inherit', fontSize: 14,
              boxShadow: '0 6px 16px color-mix(in oklab, var(--accent) 30%, transparent)',
            }}>شبیه‌ساز آزمون</button>
          </SpecBox>
          <SpecBox label="Chips">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span className="zd-chip">تابلوها</span>
              <span className="zd-chip zd-chip-success">درست</span>
              <span className="zd-chip zd-chip-danger">اشتباه</span>
            </div>
          </SpecBox>
          <SpecBox label="Option (idle)">
            <div className="zd-option" style={{ width: '100%' }}>
              <div className="zd-opt-letter">الف</div>
              <div className="zd-opt-text">پاسخ نمونه</div>
            </div>
          </SpecBox>
          <SpecBox label="Option (correct)">
            <div className="zd-option is-correct" style={{ width: '100%' }}>
              <div className="zd-opt-letter">ب</div>
              <div className="zd-opt-text">پاسخ نمونه</div>
              <div className="zd-opt-mark" style={{ opacity: 1 }}>
                <ZD_ICONS.check size={20} color="var(--success)" stroke={2.4}/>
              </div>
            </div>
          </SpecBox>
          <SpecBox label="Progress">
            <div style={{ width: '100%' }}>
              <div className="zd-bar" style={{ marginBottom: 4 }}><div className="zd-bar-fill" style={{ width: '64%' }}/></div>
              <div style={{ fontSize: 11, color: '#7E7896' }}>۶۴٪ تکمیل شده</div>
            </div>
          </SpecBox>
        </div>
      </div>

      {/* Tokens summary */}
      <div>
        <div style={specSection}>Spacing / Radii / Shadow</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <SpecBox label="Radii">
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {[8, 12, 18, 24, 32].map(r => (
                <div key={r} style={{
                  width: 38, height: 38, background: 'var(--primary-soft)',
                  borderRadius: r, border: '1px solid var(--primary)',
                }} title={`${r}px`}/>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#7E7896', marginTop: 8, direction: 'ltr', textAlign: 'left' }}>
              8 · 12 · 18 · 24 · 32
            </div>
          </SpecBox>
          <SpecBox label="Spacing scale">
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[4, 8, 12, 16, 20, 24, 32].map(s => (
                <div key={s} style={{ width: s, height: 24, background: 'var(--accent)', opacity: 0.6 }}/>
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#7E7896', marginTop: 8, direction: 'ltr', textAlign: 'left' }}>
              4 · 8 · 12 · 16 · 20 · 24 · 32
            </div>
          </SpecBox>
          <SpecBox label="Elevation">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 38, height: 38, background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}/>
              <div style={{ width: 38, height: 38, background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-md)' }}/>
              <div style={{ width: 38, height: 38, background: '#fff', borderRadius: 10, boxShadow: 'var(--shadow-lg)' }}/>
            </div>
            <div style={{ fontSize: 10, color: '#7E7896', marginTop: 8, direction: 'ltr', textAlign: 'left' }}>
              sm · md · lg
            </div>
          </SpecBox>
        </div>
      </div>

      {/* Interaction notes */}
      <div style={{ marginTop: 24, padding: 16, background: '#FBF9F5', borderRadius: 14, fontSize: 13, color: '#4A4566', lineHeight: 1.8 }}>
        <div style={specSection}>Interaction notes</div>
        <ul style={{ paddingRight: 18, margin: 0 }}>
          <li>Right-to-left throughout; chevrons in flows mirror direction.</li>
          <li>Persian numerals (۰-۹) inside the app; tabular figures via <code style={specCode}>font-variant-numeric: tabular-nums</code>.</li>
          <li>Press scales tappables to 0.98–0.94 for tactile feedback; no abrupt color flashes.</li>
          <li>Question results animate in via <code style={specCode}>zd-fade-up</code>; result award via <code style={specCode}>zd-pop</code>.</li>
          <li>Exam timer turns danger-red under one minute; tab bar is hidden during active exam (focus mode).</li>
        </ul>
      </div>
    </div>
  );
}

const specSection = {
  fontSize: 11, fontWeight: 700, color: '#7E7896',
  textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12,
};
const specCode = {
  background: 'rgba(75,58,140,0.08)', padding: '1px 6px', borderRadius: 4,
  fontFamily: 'ui-monospace, monospace', fontSize: 11, direction: 'ltr',
};

function SpecBox({ label, children }) {
  return (
    <div style={{
      padding: 14, background: '#FBF9F5', borderRadius: 14,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      gap: 10, minHeight: 90,
    }}>
      <div style={{ fontSize: 10, color: '#7E7896', fontWeight: 600, direction: 'ltr', alignSelf: 'flex-start' }}>
        {label}
      </div>
      <div style={{ width: '100%' }}>{children}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ZDRoot />);
