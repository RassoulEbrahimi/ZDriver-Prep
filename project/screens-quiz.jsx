// ZDriver — Practice, Exam, Result screens

const { useState: useStateQ, useEffect: useEffectQ, useMemo: useMemoQ, useRef: useRefQ } = React;

// ─────────────────────────────────────────────────────────────
// PRACTICE SCREEN — single question with explanation, bookmark
// ─────────────────────────────────────────────────────────────
function ZDPracticeScreen({ questions, categories, progress, onExitToHome }) {
  const cats = useMemoQ(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);
  const [idx, setIdx] = useStateQ(0);
  const [selected, setSelected] = useStateQ(null);
  const [submitted, setSubmitted] = useStateQ(false);
  const [bookmarks, setBookmarks] = useStateQ(new Set(progress.bookmarked));
  const [streak, setStreak] = useStateQ(0);

  const q = questions[idx];
  const cat = cats[q.cat];
  const qWithLabel = { ...q, catLabel: cat?.title };

  // pick sign kind based on category for visual variety
  const signKind = useMemoQ(() => {
    if (q.cat !== 'signs') return null;
    if (idx % 4 === 0) return 'stop';
    if (idx % 4 === 1) return 'mandatory';
    if (idx % 4 === 2) return 'warn';
    return 'speed';
  }, [q.id, idx]);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === q.answer) setStreak(s => s + 1);
    else setStreak(0);
  };

  const handleNext = () => {
    setSelected(null);
    setSubmitted(false);
    setIdx(i => (i + 1) % questions.length);
  };

  const toggleBookmark = () => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  };

  const sessionProgress = ((idx + 1) / questions.length) * 100;

  return (
    <div className="zd-scroll">
      <div className="zd-header">
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onExitToHome}>
            <ZD_ICONS.chevR size={18}/>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>
            <ZD_ICONS.fire size={16} color="var(--accent)" stroke={2.2}/>
            <span className="zd-num">{fa(streak)} درست پشت سر هم</span>
          </div>
          <button className="zd-icon-btn"><ZD_ICONS.more size={18}/></button>
        </div>

        {/* session progress */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>تمرین موضوعی</div>
            <div className="zd-num" style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 700 }}>
              {fa(idx + 1)} از {fa(questions.length)}
            </div>
          </div>
          <div className="zd-bar"><div className="zd-bar-fill" style={{ width: `${sessionProgress}%` }}/></div>
        </div>
      </div>

      <div style={{ padding: '8px 16px' }}>
        <ZDQuestionCard
          question={qWithLabel}
          selected={selected}
          onSelect={setSelected}
          submitted={submitted}
          bookmarked={bookmarks.has(q.id)}
          onBookmark={toggleBookmark}
          signKind={signKind}
          signN={q.text.includes('۵۰') ? '۵۰' : '۸۰'}
          showExplanation={true}
        />

        {!submitted ? (
          <button onClick={handleSubmit}
                  disabled={selected === null}
                  className={`zd-btn zd-btn-primary zd-btn-block ${selected === null ? '' : ''}`}
                  style={{
                    marginTop: 16, height: 54, fontSize: 16,
                    opacity: selected === null ? 0.5 : 1,
                    cursor: selected === null ? 'not-allowed' : 'pointer',
                  }}>
            بررسی پاسخ
            <ZD_ICONS.check size={18} stroke={2.4}/>
          </button>
        ) : (
          <button onClick={handleNext}
                  className="zd-btn zd-btn-primary zd-btn-block"
                  style={{ marginTop: 16, height: 54, fontSize: 16 }}>
            سؤال بعدی
            <ZD_ICONS.chevR size={18} stroke={2.4}/>
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EXAM SCREEN — 30 questions, timer, no immediate feedback
// ─────────────────────────────────────────────────────────────
function ZDExamScreen({ questions, categories, onFinish, onExit }) {
  const cats = useMemoQ(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);
  // build a 30-item exam (loop through pool)
  const exam = useMemoQ(() => {
    const arr = [];
    for (let i = 0; i < 30; i++) arr.push(questions[i % questions.length]);
    return arr;
  }, [questions]);

  const [idx, setIdx] = useStateQ(0);
  const [answers, setAnswers] = useStateQ(Array(30).fill(null));
  const [selected, setSelected] = useStateQ(null);
  const [timeLeft, setTimeLeft] = useStateQ(20 * 60); // 20 min

  useEffectQ(() => {
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); finish(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  // restore selection if going back
  useEffectQ(() => { setSelected(answers[idx]); }, [idx]);

  const q = exam[idx];
  const cat = cats[q.cat];

  const finish = () => {
    const updated = [...answers];
    if (selected !== null) updated[idx] = selected;
    const correct = updated.filter((a, i) => a === exam[i].answer).length;
    onFinish({ answers: updated, exam, correct, total: 30, timeUsed: 20*60 - timeLeft });
  };

  const handleNext = () => {
    const updated = [...answers];
    updated[idx] = selected;
    setAnswers(updated);
    if (idx === exam.length - 1) {
      const correct = updated.filter((a, i) => a === exam[i].answer).length;
      onFinish({ answers: updated, exam, correct, total: 30, timeUsed: 20*60 - timeLeft });
    } else {
      setIdx(idx + 1);
    }
  };

  const handlePrev = () => {
    if (idx === 0) return;
    const updated = [...answers];
    updated[idx] = selected;
    setAnswers(updated);
    setIdx(idx - 1);
  };

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const lowTime = timeLeft < 60;

  return (
    <div className="zd-scroll" style={{ background: 'var(--bg-deeper)' }}>
      {/* Exam header */}
      <div style={{
        padding: '54px 20px 16px',
        background: 'linear-gradient(180deg, var(--card) 0%, var(--bg-deeper) 100%)',
        borderBottom: '1px solid var(--line)',
      }}>
        <div className="zd-header-row">
          <button className="zd-icon-btn" onClick={onExit}>
            <ZD_ICONS.x size={18}/>
          </button>

          {/* timer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px',
            borderRadius: 12,
            background: lowTime ? 'var(--danger-soft)' : 'var(--primary-soft)',
            color: lowTime ? 'var(--danger)' : 'var(--primary-ink)',
            fontWeight: 700,
          }}>
            <ZD_ICONS.clock size={16} stroke={2.2}/>
            <span className="zd-num" style={{ fontSize: 15, letterSpacing: 0.5 }}>
              {fa(mm)}:{fa(ss)}
            </span>
          </div>

          <button className="zd-icon-btn" onClick={finish}>
            <ZD_ICONS.flag size={18}/>
          </button>
        </div>

        {/* Question dots / progress */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div>
              <div className="zd-eyebrow">شبیه‌ساز آزمون</div>
              <div className="zd-num" style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>
                سؤال {fa(idx + 1)} <span style={{ color: 'var(--ink-3)', fontWeight: 600 }}>/ {fa(30)}</span>
              </div>
            </div>
            <span className="zd-chip" style={{
              background: `color-mix(in oklab, ${cat?.color || 'var(--primary)'} 14%, transparent)`,
              color: cat?.color || 'var(--primary)',
            }}>
              {cat?.emoji} {cat?.title}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 3, flexWrap: 'nowrap' }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const answered = answers[i] !== null && i !== idx;
              const current = i === idx;
              return (
                <div key={i} style={{
                  flex: 1, height: 6, borderRadius: 999,
                  background: current ? 'var(--primary)' : answered ? 'var(--primary-soft)' : 'var(--line)',
                  border: current ? 'none' : answered ? `1px solid color-mix(in oklab, var(--primary) 35%, transparent)` : 'none',
                  transition: 'background .2s',
                }}/>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <ZDQuestionCard
          question={{ ...q, catLabel: cat?.title }}
          selected={selected}
          onSelect={setSelected}
          submitted={false}
          bookmarked={false}
          onBookmark={() => {}}
          showExplanation={false}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={handlePrev}
                  disabled={idx === 0}
                  className="zd-btn zd-btn-outline"
                  style={{ flex: 1, height: 50, opacity: idx === 0 ? 0.5 : 1 }}>
            <ZD_ICONS.chevR size={18}/>
            قبلی
          </button>
          <button onClick={handleNext}
                  className="zd-btn zd-btn-primary"
                  style={{ flex: 2, height: 50 }}>
            {idx === 29 ? 'پایان آزمون' : 'بعدی'}
            <ZD_ICONS.chevL size={18} stroke={2.4}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// EXAM RESULT
// ─────────────────────────────────────────────────────────────
function ZDExamResult({ result, onRetry, onReviewWrong, onHome }) {
  const { correct, total, timeUsed, exam, answers } = result;
  const pass = correct >= 25;
  const pct = Math.round((correct / total) * 100);

  const mm = String(Math.floor(timeUsed / 60)).padStart(2, '0');
  const ss = String(timeUsed % 60).padStart(2, '0');

  const wrongCount = total - correct;

  return (
    <div className="zd-scroll">
      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden', paddingTop: 60, paddingBottom: 28 }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: pass
            ? 'radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, var(--success) 30%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--card), var(--bg))'
            : 'radial-gradient(120% 90% at 50% 0%, color-mix(in oklab, var(--danger) 22%, transparent) 0%, transparent 60%), linear-gradient(180deg, var(--card), var(--bg))',
        }}/>
        <div style={{ position: 'relative', textAlign: 'center', padding: '0 24px' }}>
          <div className="zd-pop" style={{
            width: 96, height: 96, borderRadius: 32,
            margin: '0 auto 18px',
            background: pass
              ? 'linear-gradient(135deg, var(--success), color-mix(in oklab, var(--success) 70%, #fff))'
              : 'linear-gradient(135deg, var(--danger), color-mix(in oklab, var(--danger) 70%, #fff))',
            display: 'grid', placeItems: 'center',
            color: '#fff',
            boxShadow: pass
              ? '0 14px 32px color-mix(in oklab, var(--success) 35%, transparent)'
              : '0 14px 32px color-mix(in oklab, var(--danger) 30%, transparent)',
          }}>
            {pass ? <ZD_ICONS.award size={56} stroke={1.8}/> : <ZD_ICONS.x size={48} stroke={2.4}/>}
          </div>

          <div className="zd-eyebrow" style={{ color: pass ? 'var(--success)' : 'var(--danger)', fontWeight: 700, fontSize: 13 }}>
            {pass ? 'تبریک — قبول شدی' : 'این بار قبول نشدی'}
          </div>
          <div className="zd-h1" style={{ marginTop: 6 }}>
            <span className="zd-num">{fa(correct)} از {fa(total)}</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-3)', marginTop: 6 }}>
            {pass
              ? 'برای آزمون رسمی آماده‌ای — یک بار دیگر هم تکرار کن.'
              : `${fa(25 - correct)} پاسخ درست دیگر تا قبولی نیاز داشتی.`}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 20px' }}>
        {/* Result stats */}
        <div className="zd-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div className="zd-eyebrow">امتیاز شما</div>
              <div className="zd-num" style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>
                {fa(pct)}<span style={{ fontSize: 16 }}>٪</span>
              </div>
            </div>
            <ZDRing value={pct} size={70} stroke={6}
                    color={pass ? 'var(--success)' : 'var(--danger)'}
                    bg="var(--line)">
              <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{pass ? 'قبول' : 'رد'}</div>
            </ZDRing>
          </div>
          <div className="zd-bar" style={{ marginTop: 14 }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: pass ? 'var(--success)' : 'var(--danger)',
              borderRadius: 999, transition: 'width .8s',
            }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>
            <span>۰</span>
            <span>قبولی: {fa(25)}</span>
            <span>{fa(30)}</span>
          </div>
        </div>

        {/* Detailed stats */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <ZDStat label="پاسخ درست" value={fa(correct)} color="var(--success)" icon={ZD_ICONS.check}/>
          <ZDStat label="پاسخ اشتباه" value={fa(wrongCount)} color="var(--danger)" icon={ZD_ICONS.x}/>
          <ZDStat label="زمان" value={`${fa(mm)}:${fa(ss)}`} color="var(--primary)" icon={ZD_ICONS.clock}/>
        </div>

        {/* Per-question pills */}
        <div className="zd-card" style={{ padding: 18, marginTop: 14 }}>
          <div className="zd-eyebrow" style={{ marginBottom: 10 }}>پاسخ‌نامه</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(10, 1fr)',
            gap: 5,
          }}>
            {exam.map((q, i) => {
              const ans = answers[i];
              const correct = ans === q.answer;
              const skipped = ans === null;
              return (
                <div key={i} style={{
                  aspectRatio: '1/1',
                  borderRadius: 8,
                  background: skipped ? 'var(--line)' : correct ? 'var(--success)' : 'var(--danger)',
                  color: '#fff',
                  display: 'grid', placeItems: 'center',
                  fontSize: 10, fontWeight: 700,
                }}>
                  {fa(i + 1)}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 11, color: 'var(--ink-3)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--success)' }}/> درست
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--danger)' }}/> اشتباه
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--line)' }}/> پاسخ نداده
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          <button onClick={onReviewWrong} className="zd-btn zd-btn-primary zd-btn-block" style={{ height: 50 }}>
            <ZD_ICONS.refresh size={18} stroke={2.2}/>
            مرور سؤالات اشتباه
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRetry} className="zd-btn zd-btn-outline" style={{ flex: 1, height: 46 }}>
              آزمون جدید
            </button>
            <button onClick={onHome} className="zd-btn zd-btn-ghost" style={{ flex: 1, height: 46 }}>
              بازگشت به مسیر
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ZDPracticeScreen, ZDExamScreen, ZDExamResult });
