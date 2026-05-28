// ZDriver — Home & Progress & Mistakes screens

const { useState: useStateH, useMemo: useMemoH } = React;

// ─────────────────────────────────────────────────────────────
// HOME SCREEN — greeting, hero progress, continue card, journey
// ─────────────────────────────────────────────────────────────
function ZDHomeScreen({ progress, categories, onContinue, onPickCategory, onStartExam, dark }) {
  const pct = Math.round((progress.answered / progress.totalQuestions) * 100);
  return (
    <div className="zd-scroll">
      {/* Dusk hero panel */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="zd-dusk-bg" />
        {/* decorative stars */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[ [40,80,2], [200,60,1.5], [320,120,2.5], [80,170,1.5], [280,190,2], [160,40,1.2] ].map(([x,y,r], i) => (
            <div key={i} style={{
              position: 'absolute', left: x, top: y, width: r*2, height: r*2,
              borderRadius: '50%', background: '#fff', opacity: 0.5,
            }} />
          ))}
        </div>

        <div style={{ position: 'relative', padding: '54px 20px 28px' }}>
          {/* top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 14,
                background: 'rgba(255,255,255,0.18)',
                border: '1px solid rgba(255,255,255,0.25)',
                display: 'grid', placeItems: 'center',
                color: '#fff', fontWeight: 800, fontSize: 14,
                backdropFilter: 'blur(10px)',
              }}>ز</div>
              <div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>سلام،</div>
                <div style={{ fontSize: 15, color: '#fff', fontWeight: 700 }}>زهرا</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button aria-label="اعلان‌ها" style={pillBtn}>
                <ZD_ICONS.bell size={18} color="#fff" />
                <span style={{
                  position: 'absolute', top: 8, left: 8,
                  width: 8, height: 8, borderRadius: 99,
                  background: 'var(--accent)', border: '1.5px solid var(--grad-via)',
                }}/>
              </button>
              <button aria-label="تنظیمات" style={pillBtn}>
                <ZD_ICONS.settings size={18} color="#fff" />
              </button>
            </div>
          </div>

          {/* Hero ring + headline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 6 }}>
            <ZDRing value={pct} size={108} stroke={9} color="var(--accent)" bg="rgba(255,255,255,0.18)">
              <div className="zd-num" style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {fa(pct)}<span style={{ fontSize: 14, marginRight: 2 }}>٪</span>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>آمادگی کلی</div>
            </ZDRing>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 6 }}>
                ادامهٔ مسیر یادگیری
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55 }}>
                {fa(progress.answered)} از {fa(progress.totalQuestions)} سؤال
                {' · '}
                {fa(progress.daysToExam)} روز تا آزمون
              </div>
              <button className="zd-btn zd-btn-accent" style={{ marginTop: 12, height: 42, padding: '0 18px', fontSize: 14 }}
                      onClick={onContinue}>
                <ZD_ICONS.play size={14} stroke={2.4}/>
                ادامه دادن
              </button>
            </div>
          </div>

          {/* mini stats row */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            {[
              { icon: ZD_ICONS.fire, value: `${fa(progress.streakDays)} روز`, label: 'نوبت متوالی' },
              { icon: ZD_ICONS.check, value: fa(progress.correct), label: 'پاسخ درست' },
              { icon: ZD_ICONS.x,     value: fa(progress.wrong), label: 'اشتباه' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} style={{
                  flex: 1, borderRadius: 16, padding: '10px 12px',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent-warm)', marginBottom: 4 }}>
                    <Icon size={14} stroke={2.2}/>
                    <div className="zd-num" style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{s.value}</div>
                  </div>
                  <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.7)' }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick exam shortcut */}
      <div style={{ padding: '18px 20px 4px' }}>
        <button onClick={onStartExam}
                className="zd-card"
                style={{
                  width: '100%', padding: 16, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--card)', textAlign: 'right',
                  fontFamily: 'var(--font)',
                  borderRadius: 18,
                }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-deep))',
            display: 'grid', placeItems: 'center',
            color: '#fff', flexShrink: 0,
          }}>
            <ZD_ICONS.trophy size={26} stroke={1.9}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>شبیه‌ساز آزمون رسمی</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>۳۰ سؤال · ۲۰ دقیقه · امتیاز قبولی ۲۵</div>
          </div>
          <ZD_ICONS.chevL size={18} color="var(--ink-3)" stroke={2.2}/>
        </button>
      </div>

      {/* Tip of the day */}
      <div style={{ padding: '12px 20px 4px' }}>
        <div className="zd-card" style={{
          padding: 14,
          display: 'flex', gap: 12, alignItems: 'flex-start',
          background: 'color-mix(in oklab, var(--accent) 8%, var(--card))',
          border: '1px solid color-mix(in oklab, var(--accent) 24%, transparent)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'color-mix(in oklab, var(--accent) 22%, transparent)',
            color: 'var(--accent-deep)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <ZD_ICONS.bulb size={18}/>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-deep)' }}>نکتهٔ روز</div>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 4, lineHeight: 1.6 }}>
              فاصلهٔ ایمن از خودروی جلویی را با قانون «دو ثانیه» تخمین بزن؛ روی جادهٔ خیس این فاصله را دو برابر کن.
            </div>
          </div>
        </div>
      </div>

      {/* Categories — journey path */}
      <div style={{ padding: '24px 20px 8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div className="zd-h2">مسیر یادگیری</div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>۵ موضوع</div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 4 }}>
          هر گره یک موضوع است — برای ورود لمس کن
        </div>
      </div>

      <div style={{ padding: '0 8px' }}>
        <ZDJourney categories={categories} onPick={onPickCategory}/>
      </div>
    </div>
  );
}

const pillBtn = {
  position: 'relative',
  width: 38, height: 38, borderRadius: 12,
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.18)',
  display: 'grid', placeItems: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
};

// ─────────────────────────────────────────────────────────────
// PROGRESS SCREEN — stats + category breakdown + readiness
// ─────────────────────────────────────────────────────────────
function ZDProgressScreen({ progress, categories }) {
  const readiness = progress.examReadiness;
  const readyLabel = readiness >= 75 ? 'آمادهٔ آزمون' : readiness >= 50 ? 'مسیر خوبی داری' : 'هنوز نیاز به تمرین داری';
  const readyColor = readiness >= 75 ? 'var(--success)' : readiness >= 50 ? 'var(--accent)' : 'var(--warn)';

  return (
    <div className="zd-scroll">
      <ZDHeader title="پیشرفت من" subtitle="تصویری از وضعیت یادگیری"
        trailing={<button className="zd-icon-btn"><ZD_ICONS.more size={18}/></button>}/>

      <div style={{ padding: '0 20px' }}>
        {/* Readiness hero */}
        <div className="zd-card" style={{
          padding: 22, display: 'flex', gap: 18, alignItems: 'center',
          background: 'linear-gradient(135deg, var(--card) 0%, var(--card-2) 100%)',
        }}>
          <ZDRing value={readiness} size={110} stroke={10} color={readyColor} bg="var(--line)">
            <div className="zd-num" style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)' }}>
              {fa(readiness)}<span style={{ fontSize: 14 }}>٪</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>آمادگی</div>
          </ZDRing>
          <div style={{ flex: 1 }}>
            <div className="zd-eyebrow" style={{ color: readyColor, fontWeight: 700 }}>وضعیت آزمون</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', marginTop: 4, lineHeight: 1.3 }}>
              {readyLabel}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.6 }}>
              تخمین آمادگی بر اساس درصد پاسخ‌های درست و موضوعات کامل‌شده
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <ZDStat label="پاسخ درست" value={fa(progress.correct)} sub={`از ${fa(progress.answered)}`} color="var(--success)" icon={ZD_ICONS.check}/>
          <ZDStat label="پاسخ اشتباه" value={fa(progress.wrong)} sub={`نیاز به مرور`} color="var(--danger)" icon={ZD_ICONS.x}/>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <ZDStat label="نوبت متوالی" value={`${fa(progress.streakDays)} روز`} sub="استمرار خوب" color="var(--accent)" icon={ZD_ICONS.fire}/>
          <ZDStat label="نشان‌شده" value={fa(progress.bookmarked.length)} sub="برای مرور بعدی" color="var(--primary)" icon={ZD_ICONS.bookmarkFill}/>
        </div>

        {/* Accuracy trend */}
        <div className="zd-card" style={{ padding: 18, marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div className="zd-eyebrow">دقت در ۷ روز اخیر</div>
              <div className="zd-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', marginTop: 4 }}>
                {fa(80)}<span style={{ fontSize: 13 }}>٪</span>
              </div>
            </div>
            <span className="zd-chip zd-chip-success">+۶٪ این هفته</span>
          </div>
          <BarChart values={[58, 64, 72, 68, 75, 80, 84]} labels={['ش','ی','د','س','چ','پ','ج']} />
        </div>

        {/* Category breakdown */}
        <div style={{ marginTop: 20 }}>
          <div className="zd-h2" style={{ marginBottom: 12 }}>پیشرفت موضوعی</div>
          <div className="zd-card" style={{ padding: 14 }}>
            {categories.map((c, i) => {
              const pct = Math.round((c.done / c.total) * 100);
              return (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 4px',
                  borderTop: i > 0 ? '1px solid var(--line)' : 'none',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 12,
                    background: `color-mix(in oklab, ${c.color} 14%, transparent)`,
                    color: c.color,
                    display: 'grid', placeItems: 'center',
                    fontWeight: 800, fontSize: 18,
                    flexShrink: 0,
                  }}>{c.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{c.title}</div>
                      <div className="zd-num" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                        {fa(c.done)}/{fa(c.total)}
                      </div>
                    </div>
                    <div className="zd-bar">
                      <div className="zd-bar-fill" style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${c.color}, color-mix(in oklab, ${c.color} 60%, var(--accent)))`,
                      }}/>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements */}
        <div style={{ marginTop: 20 }}>
          <div className="zd-h2" style={{ marginBottom: 12 }}>نشان‌های من</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { icon: ZD_ICONS.fire, label: '۵ روز پشت سر هم', got: true, color: 'var(--accent)' },
              { icon: ZD_ICONS.award, label: 'اولین موضوع کامل', got: true, color: 'var(--primary)' },
              { icon: ZD_ICONS.target, label: '۱۰۰ پاسخ درست', got: false, color: 'var(--success)' },
              { icon: ZD_ICONS.shield, label: 'نمرهٔ کامل', got: false, color: 'var(--ink-3)' },
            ].map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} style={{
                  textAlign: 'center',
                  padding: '12px 6px',
                  borderRadius: 16,
                  background: b.got ? 'var(--card)' : 'var(--bg-deeper)',
                  border: '1px solid var(--line)',
                  opacity: b.got ? 1 : 0.55,
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14, margin: '0 auto',
                    background: b.got ? `color-mix(in oklab, ${b.color} 16%, transparent)` : 'var(--line)',
                    color: b.got ? b.color : 'var(--ink-4)',
                    display: 'grid', placeItems: 'center',
                    marginBottom: 6,
                  }}>
                    {b.got ? <Icon size={22}/> : <ZD_ICONS.lock size={18}/>}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-2)', lineHeight: 1.3 }}>{b.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChart({ values, labels }) {
  const max = Math.max(...values);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 76 }}>
      {values.map((v, i) => {
        const h = (v / max) * 100;
        const isLast = i === values.length - 1;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
              <div style={{
                width: '100%',
                height: `${h}%`,
                borderRadius: '8px 8px 4px 4px',
                background: isLast
                  ? 'linear-gradient(180deg, var(--accent), var(--accent-deep))'
                  : 'linear-gradient(180deg, var(--grad-via), color-mix(in oklab, var(--grad-via) 60%, var(--accent)))',
                opacity: isLast ? 1 : 0.85,
                transition: 'height .6s',
              }}/>
            </div>
            <div style={{ fontSize: 10, color: 'var(--ink-3)' }}>{labels[i]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MISTAKES SCREEN — list of wrong + bookmarked
// ─────────────────────────────────────────────────────────────
function ZDMistakesScreen({ progress, questions, categories, onRetry }) {
  const [tab, setTab] = useStateH('wrong'); // 'wrong' | 'bookmark'
  const cats = useMemoH(() => Object.fromEntries(categories.map(c => [c.id, c])), [categories]);
  const list = tab === 'wrong' ? progress.wrongQuestionIds : progress.bookmarked;
  const items = list.map(id => questions.find(q => q.id === id)).filter(Boolean);

  return (
    <div className="zd-scroll">
      <ZDHeader title="اشتباهات و مرور"
        subtitle="جایی برای رفع نقاط ضعف"
        trailing={<button className="zd-icon-btn"><ZD_ICONS.refresh size={18}/></button>}/>

      <div style={{ padding: '0 20px' }}>
        {/* Segmented control */}
        <div style={{
          background: 'var(--bg-deeper)',
          padding: 4,
          borderRadius: 14,
          display: 'flex',
          gap: 4,
          marginBottom: 16,
        }}>
          {[
            { id: 'wrong',    label: `اشتباهات (${fa(progress.wrongQuestionIds.length)})`, icon: ZD_ICONS.x },
            { id: 'bookmark', label: `نشان‌شده (${fa(progress.bookmarked.length)})`,     icon: ZD_ICONS.bookmarkFill },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, height: 38, border: 'none', cursor: 'pointer',
                background: active ? 'var(--card)' : 'transparent',
                color: active ? 'var(--ink)' : 'var(--ink-3)',
                borderRadius: 11, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Icon size={15} stroke={2.1}/>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Retry CTA */}
        {items.length > 0 && (
          <button onClick={onRetry} className="zd-btn zd-btn-primary zd-btn-block" style={{ marginBottom: 16 }}>
            <ZD_ICONS.refresh size={18} stroke={2.2}/>
            مرور {fa(items.length)} سؤال
          </button>
        )}

        {/* Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((q, i) => {
            const cat = cats[q.cat];
            const correctText = q.options[q.answer];
            return (
              <div key={q.id} className="zd-card" style={{ padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="zd-chip" style={{
                    background: `color-mix(in oklab, ${cat?.color || 'var(--primary)'} 14%, transparent)`,
                    color: cat?.color || 'var(--primary)',
                  }}>
                    {cat?.emoji} {cat?.title}
                  </span>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fa(2)} روز پیش</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.6, marginBottom: 10 }}>
                  {q.text}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, color: 'var(--success)', fontWeight: 600,
                  padding: '8px 10px',
                  background: 'var(--success-soft)',
                  borderRadius: 10,
                }}>
                  <ZD_ICONS.check size={16} stroke={2.4}/>
                  <span style={{ color: 'var(--ink-2)' }}>پاسخ درست: </span>
                  <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{correctText}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="zd-btn zd-btn-ghost" style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}>
                    دوباره امتحان کن
                  </button>
                  <button className="zd-btn zd-btn-outline" style={{ padding: '10px 14px', fontSize: 13 }}>
                    توضیح
                  </button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="zd-card" style={{ padding: 28, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 6 }}>🎉</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>هنوز اشتباهی ثبت نشده</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>به تمرین ادامه بده تا نکات ضعف مشخص شوند.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ZDHomeScreen, ZDProgressScreen, ZDMistakesScreen });
