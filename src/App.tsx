import React, { useState, useEffect, useRef } from 'react'
import type { TabId, Progress, Question, SourceView, SourceExamResult, PracticeView, ExamView, SourceExamQuestion } from './types'
import { QUESTIONS, CATEGORIES, PROGRESS } from './data'
import { loadProgress, saveProgress } from './utils'
import { TabBar }            from './components/TabBar'
import { HomeScreen }        from './screens/HomeScreen'
import { PracticeCatalogScreen }     from './screens/PracticeCatalogScreen'
import { PracticeExamQuestionScreen } from './screens/PracticeExamQuestionScreen'
import { ExamCatalogScreen }       from './screens/ExamCatalogScreen'
import { ExamRunnerScreen }        from './screens/ExamRunnerScreen'
import { ExamRunnerResultScreen }  from './screens/ExamRunnerResultScreen'
import { MistakesScreen }    from './screens/MistakesScreen'
import { ProgressScreen }    from './screens/ProgressScreen'
import { SourceExamScreen }        from './screens/SourceExamScreen'
import { SourceExamStartScreen }   from './screens/SourceExamStartScreen'
import { SourceExamQuestionScreen } from './screens/SourceExamQuestionScreen'
import { SourceExamResultScreen }  from './screens/SourceExamResultScreen'
import { SOURCE_EXAMS }      from './data/sourceExams'
import { SOURCE_EXAMS_DATA }  from './data/source-exams'
import { toSourceExamQuestion } from './data/source-exams/adapter'
import { EXAM_REGISTRY, getExamMeta } from './data/examRegistry'
import { ThemeSheet }         from './components/ThemeSheet'
import { UpdatePrompt }       from './components/UpdatePrompt'
import { InstallPrompt }      from './components/InstallPrompt'
import { AuthSheet }          from './components/AuthSheet'
import { ManualSubscriptionSheet } from './components/ManualSubscriptionSheet'
import { useAuth }            from './auth/useAuth'
import { useEntitlement }     from './auth/useEntitlement'
import { canAccessExam }      from './config/access'
import {
  writeExamProgress, appendExamAttempt, readAllExamProgress, readRecentExamAttempts,
  readBookmarks, writeBookmarks,
  type ExamAttemptReadItem, type ExamProgressReadItem,
} from './data/progress/repo'
import { isPhpBackend } from './config/backend'
import { getToken } from './auth/phpClient'
import { savePhpProgress, loadPhpProgress } from './data/progress/phpProgress'
import type { ThemeMode } from './theme'
import { applyTheme, getStoredMode, setStoredMode, subscribeSystem } from './theme'

// Combined review pool (Phase 7I-1): generic bank + all real source-exam
// questions, so Mistakes can resolve both 'ir-q*' and 'se-NN-MM' wrong ids
// (the two id families are disjoint by design). Static data — built once.
const REVIEW_QUESTIONS: Question[] = [
  ...QUESTIONS,
  ...SOURCE_EXAMS_DATA.flatMap(e => e.questions.map(toSourceExamQuestion)),
]

export default function App() {
  const [tab,       setTab]       = useState<TabId>('home')
  const [progress,  setProgress]  = useState<Progress>(() => loadProgress(PROGRESS))

  // ── Exam-based Exam flow (آزمون tab): catalog → timed runner → result ──
  const [examView,       setExamView]       = useState<ExamView>('catalog')
  const [examFlowId,     setExamFlowId]     = useState<number | null>(null)
  const [examFlowResult, setExamFlowResult] = useState<SourceExamResult | null>(null)

  // ── Dedicated source-exam flow (independent of the generic exam above) ──
  const [sourceView,   setSourceView]   = useState<SourceView>('catalog')
  const [sourceExamNo, setSourceExamNo] = useState<number | null>(null)
  const [sourceResult, setSourceResult] = useState<SourceExamResult | null>(null)

  // ── Exam-based Practice flow (تمرین tab): catalog → per-exam runner ──
  const [practiceView,   setPracticeView]   = useState<PracticeView>('catalog')
  const [practiceExamId, setPracticeExamId] = useState<number | null>(null)

  // ── Review session (Phase 7N, اشتباهات tab): a fixed snapshot of wrong/
  // bookmarked questions taken when the session starts, so clearing a mistake
  // mid-session never reorders or drops the remaining questions. null = list view.
  const [reviewSession, setReviewSession] = useState<SourceExamQuestion[] | null>(null)

  // ── Theme (system / light / dark) ──
  const [themeMode,    setThemeMode]    = useState<ThemeMode>(() => getStoredMode())
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ── Account / auth sheet (Phase 7B) ──
  const [authSheetOpen, setAuthSheetOpen] = useState(false)

  // ── Soft subscription gate (S4B) — purchase sheet opened when a locked exam
  // is tapped. Display only; gating happens at the entry handlers below. ──
  const [purchaseSheetOpen, setPurchaseSheetOpen] = useState(false)

  // ── Auth state (Phase 7G) — read once; used to mirror Practice progress to cloud. ──
  const { status, user } = useAuth()

  // ── Entitlement (S4B) — drives the exam access gate. Active only when the
  // read is ready AND the subscription is active. Fail-closed (loading/guest/
  // unavailable → not active → only free exams). ──
  const { entitlement } = useEntitlement()
  const isActiveSub = entitlement.active && entitlement.status === 'active'

  // ── Recent exam attempts (Phase 7J) — in-memory only, never persisted.
  // null = not loaded / unavailable / read failed; [] = loaded, no attempts yet.
  const [recentAttempts, setRecentAttempts] = useState<ExamAttemptReadItem[] | null>(null)

  // In-flight guard so login fetch and Progress-open retry never overlap.
  const attemptsLoadingRef = useRef(false)

  // ── Per-exam cloud progress (Phase 7M-2) — in-memory only. Feeds the Practice
  // catalog coverage chips. null = not loaded / unavailable / read failed.
  const [examCoverage, setExamCoverage] = useState<ExamProgressReadItem[] | null>(null)
  const coverageLoadingRef = useRef(false)

  // Fail-soft fetch of all per-exam cloud progress. On success it stores the
  // items (coverage chips) and unions the cloud wrong-question pool into local
  // progress — the union is strictly additive and idempotent, so re-running on
  // a Practice-tab retry can never shrink or duplicate local data. Never throws.
  function fetchExamProgress(uid: string) {
    if (coverageLoadingRef.current) return
    coverageLoadingRef.current = true
    void readAllExamProgress(uid).then(res => {
      if (!res.ok) return
      setExamCoverage(res.items)
      const cloudIds = res.items.flatMap(it => it.wrongQuestionIds)
      if (cloudIds.length === 0) return
      setProgress(p => {
        const fresh = [...new Set(cloudIds.filter(id => !p.wrongQuestionIds.includes(id)))]
        if (fresh.length === 0) return p // no new ids — skip the update entirely
        return { ...p, wrongQuestionIds: [...p.wrongQuestionIds, ...fresh] }
      })
    }).catch(() => undefined)
      .finally(() => { coverageLoadingRef.current = false })
  }

  // Fail-soft fetch of recent attempts: on success store them, on failure leave
  // recentAttempts as null (the Progress screen shows a quiet fallback). Never throws.
  function fetchRecentAttempts(uid: string) {
    if (attemptsLoadingRef.current) return
    attemptsLoadingRef.current = true
    void readRecentExamAttempts(uid)
      .then(res => { if (res.ok) setRecentAttempts(res.items) })
      .catch(() => undefined)
      .finally(() => { attemptsLoadingRef.current = false })
  }

  // ── Cloud bookmarks (Phase 7O) — the synced list lives in progress.bookmarked.
  // bookmarksSynced records whether the cloud read has succeeded this session,
  // so a transient failure at login (e.g. flaky connection) can be retried on
  // tab opens instead of silencing sync for the whole session.
  const [bookmarksSynced, setBookmarksSynced] = useState(false)
  const bookmarksLoadingRef = useRef(false)

  // Fail-soft bookmark hydration: union the cloud list into local bookmarks
  // (never destructive — bookmarks made while signed out survive), then push
  // any local-only ids up once so both sides converge. arrayUnion is
  // idempotent, so a duplicated merge-up write is harmless. Never throws.
  function fetchBookmarks(uid: string) {
    if (bookmarksLoadingRef.current) return
    bookmarksLoadingRef.current = true
    void readBookmarks(uid).then(res => {
      if (!res.ok) return
      setBookmarksSynced(true)
      const cloud = res.questionIds
      let missing: string[] = []
      setProgress(p => {
        missing = p.bookmarked.filter(id => !cloud.includes(id))
        const fresh = cloud.filter(id => !p.bookmarked.includes(id))
        if (fresh.length === 0) return p // nothing new — skip the update entirely
        return { ...p, bookmarked: [...p.bookmarked, ...fresh] }
      })
      // Merge local-only bookmarks up after the state update settles.
      setTimeout(() => {
        if (missing.length > 0) {
          void writeBookmarks(uid, { add: missing }).catch(() => undefined)
        }
      }, 0)
    }).catch(() => undefined)
      .finally(() => { bookmarksLoadingRef.current = false })
  }

  // ── Cloud hydration (Phase 7I/7J) — one-time per uid per session. Unions the
  // cloud wrong-question pool into local progress and loads recent exam attempts
  // into memory. Strictly additive: local progress is never shrunk, cleared, or
  // otherwise overwritten; any failure is a silent no-op and the app keeps
  // running on local data.
  const hydratedUidRef = useRef<string | null>(null)
  useEffect(() => {
    if (status !== 'authed' || !user?.uid) {
      hydratedUidRef.current = null
      setRecentAttempts(null)
      attemptsLoadingRef.current = false
      setExamCoverage(null)
      coverageLoadingRef.current = false
      setBookmarksSynced(false)
      bookmarksLoadingRef.current = false
      return
    }
    if (hydratedUidRef.current === user.uid) return
    hydratedUidRef.current = user.uid
    fetchExamProgress(user.uid)
    fetchRecentAttempts(user.uid)
    fetchBookmarks(user.uid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user])

  // Retry the attempts read when Progress, Home, or the Exam catalog opens
  // (Phase 7J follow-up; extended in 7K for Home and 7M for exam status chips):
  // a transient failure at login/session restore (e.g. flaky connection) must
  // not blank the exam stats for the whole session. Runs at most once per
  // visit; the in-flight guard in fetchRecentAttempts prevents overlapping calls.
  useEffect(() => {
    if ((tab !== 'progress' && tab !== 'home' && tab !== 'exam') || status !== 'authed' || !user?.uid) return
    if (recentAttempts !== null) return
    fetchRecentAttempts(user.uid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, status, user, recentAttempts])

  // Same retry for the per-exam coverage read when Practice opens (Phase 7M-2):
  // runs only while the data is still missing; the in-flight guard prevents
  // overlap with the login fetch, and the wrong-id union it performs is idempotent.
  useEffect(() => {
    if (tab !== 'practice' || status !== 'authed' || !user?.uid) return
    if (examCoverage !== null) return
    fetchExamProgress(user.uid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, status, user, examCoverage])

  // Same retry for the bookmark read (Phase 7O) on the tabs where bookmarks
  // are shown, while the cloud list has not been read successfully this session.
  useEffect(() => {
    if ((tab !== 'home' && tab !== 'mistakes' && tab !== 'progress') || status !== 'authed' || !user?.uid) return
    if (bookmarksSynced) return
    fetchBookmarks(user.uid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, status, user, bookmarksSynced])

  // ── PHP backend progress sync (PHP mode only; isPhpBackend gates everything).
  // Mirrors the Firebase hydration above but against the PHP one-blob-per-user
  // API: load once per signed-in user, union it into local state additively, then
  // save the full blob (debounced) on changes. In default (Firebase) mode both
  // effects are inert. localStorage stays the runtime source of truth. ──
  // Load is attempted once per uid; saving is enabled ONLY after a successful
  // load, so a pre-load save can never overwrite the server blob with less data.
  const phpLoadStartedUidRef = useRef<string | null>(null)
  const phpSaveEnabledUidRef = useRef<string | null>(null)
  useEffect(() => {
    if (!isPhpBackend) return
    if (status !== 'authed' || !user?.uid || !getToken()) {
      phpLoadStartedUidRef.current = null
      phpSaveEnabledUidRef.current = null
      return
    }
    if (phpLoadStartedUidRef.current === user.uid) return
    phpLoadStartedUidRef.current = user.uid
    const uid = user.uid
    void loadPhpProgress().then(res => {
      if (!res.ok) return // fail-soft: leave save disabled; never wipe local data
      const { bookmarks, wrongQuestionIds, examProgress, examAttempts } = res.progress
      // Additive union into local progress — never shrink or overwrite local.
      setProgress(p => {
        let next = p
        if (Array.isArray(wrongQuestionIds)) {
          const fresh = wrongQuestionIds.filter(id => !next.wrongQuestionIds.includes(id))
          if (fresh.length) next = { ...next, wrongQuestionIds: [...next.wrongQuestionIds, ...fresh] }
        }
        if (Array.isArray(bookmarks)) {
          const fresh = bookmarks.filter(id => !next.bookmarked.includes(id))
          if (fresh.length) next = { ...next, bookmarked: [...next.bookmarked, ...fresh] }
        }
        return next
      })
      // Fill coverage/attempts only if not already populated (prefer existing).
      if (Array.isArray(examProgress)) setExamCoverage(prev => prev ?? (examProgress as ExamProgressReadItem[]))
      if (Array.isArray(examAttempts)) setRecentAttempts(prev => prev ?? (examAttempts as ExamAttemptReadItem[]))
      phpSaveEnabledUidRef.current = uid // enable saving only after a successful load
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user])

  useEffect(() => {
    if (!isPhpBackend || status !== 'authed' || !user?.uid) return
    if (phpSaveEnabledUidRef.current !== user.uid) return // don't save before the initial load
    const t = setTimeout(() => {
      void savePhpProgress({
        summary: {
          totalQuestions: progress.totalQuestions,
          answered: progress.answered,
          correct: progress.correct,
          wrong: progress.wrong,
          examReadiness: progress.examReadiness,
          bookmarkCount: progress.bookmarked.length,
          weakCount: progress.wrongQuestionIds.length,
        },
        examProgress: examCoverage,
        examAttempts: recentAttempts,
        bookmarks: progress.bookmarked,
        wrongQuestionIds: progress.wrongQuestionIds,
      })
    }, 800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, examCoverage, recentAttempts, status, user])

  // ── PWA prompts: update toast takes priority over the install button. ──
  const [updateVisible, setUpdateVisible] = useState(false)

  // Persist progress (bookmarks, mistakes, stats) on every change.
  useEffect(() => { saveProgress(progress) }, [progress])

  // Apply the resolved theme whenever the mode changes.
  useEffect(() => { applyTheme(themeMode) }, [themeMode])

  // While in 'system' mode, follow live OS/browser color-scheme changes.
  useEffect(() => subscribeSystem(() => {
    if (getStoredMode() === 'system') applyTheme('system')
  }), [])

  function selectTheme(mode: ThemeMode) {
    setStoredMode(mode)
    setThemeMode(mode)
    applyTheme(mode)
  }

  function toggleBookmark(id: string) {
    // Direction is decided from the rendered state the user acted on; the
    // cloud mirror below uses the same decision so both sides stay aligned.
    const adding = !progress.bookmarked.includes(id)
    setProgress(p => ({
      ...p,
      bookmarked: adding
        ? (p.bookmarked.includes(id) ? p.bookmarked : [...p.bookmarked, id])
        : p.bookmarked.filter(x => x !== id),
    }))
    // Best-effort cloud mirror (Phase 7O): fire-and-forget, never blocks the
    // toggle; guests stay local-only. arrayUnion/arrayRemove are idempotent.
    if (status !== 'authed' || !user?.uid) return
    void writeBookmarks(user.uid, adding ? { add: [id] } : { remove: [id] })
      .catch(() => undefined)
  }

  function recordWrong(ids: string[]) {
    setProgress(p => ({
      ...p,
      wrongQuestionIds: [...new Set([...p.wrongQuestionIds, ...ids])],
    }))
  }

  function goToTab(t: TabId) {
    setTab(t)
    // Entering the exam section always starts at the exam catalog.
    if (t === 'exam') {
      setExamView('catalog')
      setExamFlowId(null)
      setExamFlowResult(null)
    }
    // Entering the source section always starts at the catalog.
    if (t === 'source') {
      setSourceView('catalog')
      setSourceExamNo(null)
      setSourceResult(null)
    }
    // Entering Practice always starts at the exam catalog.
    if (t === 'practice') {
      setPracticeView('catalog')
      setPracticeExamId(null)
    }
    // Entering Mistakes always starts at the list, never mid-review.
    if (t === 'mistakes') {
      setReviewSession(null)
    }
  }

  // ── Review-loop handlers (Phase 7N) ──

  // Snapshot the requested ids into a review session. Ids that no longer
  // resolve in the combined pool are dropped; an all-stale request is a no-op.
  function startReview(ids: string[]) {
    const byId = new Map(REVIEW_QUESTIONS.map(q => [q.id, q]))
    const pool = ids
      .map(id => byId.get(id))
      .filter((q): q is Question => q !== undefined)
      .map(q => ({ ...q, hasImage: Boolean(q.image) }))
    if (pool.length === 0) return
    setReviewSession(pool)
  }

  // A correctly re-answered question leaves the mistakes pool: local state
  // updates immediately (and persists via the saveProgress effect); when
  // authed, the id is also pruned best-effort from every cloud examProgress
  // doc that lists it (located via the in-memory coverage from Phase 7M-2).
  // Wrong answers change nothing — the id is already in the pool.
  function handleReviewResult(questionId: string, correct: boolean) {
    if (!correct) return
    setProgress(p => (
      p.wrongQuestionIds.includes(questionId)
        ? { ...p, wrongQuestionIds: p.wrongQuestionIds.filter(id => id !== questionId) }
        : p
    ))
    if (status !== 'authed' || !user?.uid || !examCoverage) return
    const affected = examCoverage.filter(it => it.wrongQuestionIds.includes(questionId))
    if (affected.length === 0) return
    for (const it of affected) {
      void writeExamProgress(user.uid, { examId: it.examId, removeWrongIds: [questionId] })
        .catch(() => undefined)
    }
    // Mirror the prune in memory so repeat clears don't re-issue writes.
    setExamCoverage(items => items?.map(it =>
      it.wrongQuestionIds.includes(questionId)
        ? { ...it, wrongQuestionIds: it.wrongQuestionIds.filter(id => id !== questionId) }
        : it
    ) ?? items)
  }

  function goHome() {
    setTab('home')
  }

  // ── Exam-flow handlers (آزمون tab; registry-driven timed simulation) ──
  function openExam(id: number) {
    // Soft gate (S4B): locked exam → open the purchase sheet instead of starting.
    if (!canAccessExam(isActiveSub, id)) { setPurchaseSheetOpen(true); return }
    setExamFlowId(id)
    setExamFlowResult(null)
    setExamView('active')
  }

  function finishExam(result: SourceExamResult) {
    const wrongIds = result.exam
      .filter((q, i) => result.answers[i] !== q.answer)
      .map(q => q.id)
    recordWrong(wrongIds)
    setExamFlowResult(result)
    setExamView('result')
    mirrorExamAttempt(result, wrongIds)
  }

  // Mirror one finished exam attempt to Firestore (Phase 7H). Best-effort: only
  // when authed, fire-and-forget, never awaited, never blocks scoring or result
  // navigation. Appends to examAttempts and updates a safe subset of examProgress
  // (no bestScore / aggregate passed — those need reads to maintain correctly).
  function mirrorExamAttempt(result: SourceExamResult, wrongIds: string[]) {
    if (status !== 'authed' || !user?.uid) return
    const meta = getExamMeta(result.examNo)
    const passThreshold = meta?.passThreshold ?? Math.ceil(result.total * 26 / 30)
    const passed = result.correct >= passThreshold
    void appendExamAttempt(user.uid, {
      examId: result.examNo,
      score: result.correct,
      totalQuestions: result.total,
      passed,
      durationSeconds: result.timeUsed,
      wrongIds,
    }).catch(() => undefined)
    void writeExamProgress(user.uid, {
      examId: result.examNo,
      official: meta?.official ?? true,
      wrongIds,
      lastScore: result.correct,
      touchAttemptAt: true,
    }).catch(() => undefined)
  }

  function retryExam() {
    setExamFlowResult(null)
    setExamView('active')
  }

  function backToExamCatalog() {
    setExamFlowResult(null)
    setExamFlowId(null)
    setExamView('catalog')
  }

  function reviewExamWrong() {
    backToExamCatalog()
    setTab('mistakes')
  }

  // ── Source-exam flow handlers (do not touch exam-flow state) ──
  function openSourceStart(id: number) {
    setSourceExamNo(id)
    setSourceView('start')
  }

  function launchSourceExam(id: number) {
    setSourceExamNo(id)
    setSourceView('active')
  }

  function finishSourceExam(result: SourceExamResult) {
    const wrongIds = result.exam
      .filter((q, i) => result.answers[i] !== q.answer)
      .map(q => q.id)
    recordWrong(wrongIds)
    setSourceResult(result)
    setSourceView('result')
  }

  function retrySourceExam() {
    setSourceResult(null)
    setSourceView('active')
  }

  function backToSourceCatalog() {
    setSourceResult(null)
    setSourceExamNo(null)
    setSourceView('catalog')
  }

  function reviewSourceWrong() {
    backToSourceCatalog()
    setTab('mistakes')
  }

  // ── Practice-flow handlers (تمرین tab; do not touch exam/source state) ──
  function openPracticeExam(id: number) {
    // Soft gate (S4B): locked exam → open the purchase sheet instead of starting.
    if (!canAccessExam(isActiveSub, id)) { setPurchaseSheetOpen(true); return }
    setPracticeExamId(id)
    setPracticeView('active')
  }

  function backToPracticeCatalog() {
    setPracticeExamId(null)
    setPracticeView('catalog')
  }

  // Mirror one answered Practice question to Firestore (Phase 7G). Best-effort:
  // only when authed, fire-and-forget, never awaited, never blocks the UI. The
  // localStorage Progress above stays the runtime source of truth.
  function mirrorPracticeAnswer(a: { questionId: string; correct: boolean; index: number; official: boolean }) {
    if (status !== 'authed' || !user?.uid || practiceExamId == null) return
    void writeExamProgress(user.uid, {
      examId: practiceExamId,
      official: a.official,
      answeredIds: [a.questionId],
      correctIds: a.correct ? [a.questionId] : undefined,
      wrongIds:   a.correct ? undefined : [a.questionId],
      lastQuestionIndex: a.index,
      touchPracticedAt: true,
    }).catch(() => undefined)
  }

  function renderScreen() {
    if (tab === 'home') {
      return (
        <HomeScreen
          progress={progress}
          categories={CATEGORIES}
          attempts={recentAttempts}
          onContinue={() => goToTab('practice')}
          onPickCategory={() => goToTab('practice')}
          onPractice={() => goToTab('practice')}
          onExam={() => goToTab('exam')}
          onReviewMistakes={() => goToTab('mistakes')}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAccount={() => setAuthSheetOpen(true)}
        />
      )
    }

    if (tab === 'source') {
      if (sourceView === 'start' && sourceExamNo != null) {
        return (
          <SourceExamStartScreen
            examNo={sourceExamNo}
            onStart={() => launchSourceExam(sourceExamNo)}
            onBack={backToSourceCatalog}
          />
        )
      }
      if (sourceView === 'active' && sourceExamNo != null) {
        return (
          <SourceExamQuestionScreen
            examNo={sourceExamNo}
            questions={QUESTIONS}
            categories={CATEGORIES}
            onFinish={finishSourceExam}
            onExit={backToSourceCatalog}
          />
        )
      }
      if (sourceView === 'result' && sourceResult) {
        return (
          <SourceExamResultScreen
            result={sourceResult}
            onReviewWrong={reviewSourceWrong}
            onRetry={retrySourceExam}
            onBackToExams={backToSourceCatalog}
          />
        )
      }
      return (
        <SourceExamScreen
          exams={SOURCE_EXAMS}
          onBack={goHome}
          onOpenExam={openSourceStart}
          onLaunchExam={launchSourceExam}
        />
      )
    }

    if (tab === 'practice') {
      if (practiceView === 'active' && practiceExamId != null) {
        return (
          <PracticeExamQuestionScreen
            examId={practiceExamId}
            fallbackPool={QUESTIONS}
            categories={CATEGORIES}
            progress={progress}
            onToggleBookmark={toggleBookmark}
            onRecordWrong={recordWrong}
            onPracticeAnswer={mirrorPracticeAnswer}
            onExit={backToPracticeCatalog}
          />
        )
      }
      return (
        <PracticeCatalogScreen
          exams={EXAM_REGISTRY}
          coverage={examCoverage}
          onOpenExam={openPracticeExam}
          isLocked={(id) => !canAccessExam(isActiveSub, id)}
          onExitToHome={goHome}
        />
      )
    }

    if (tab === 'exam') {
      if (examView === 'active' && examFlowId != null) {
        return (
          <ExamRunnerScreen
            examId={examFlowId}
            fallbackPool={QUESTIONS}
            categories={CATEGORIES}
            onFinish={finishExam}
            onExit={backToExamCatalog}
          />
        )
      }
      if (examView === 'result' && examFlowResult) {
        return (
          <ExamRunnerResultScreen
            result={examFlowResult}
            onReviewWrong={reviewExamWrong}
            onRetry={retryExam}
            onBackToExams={backToExamCatalog}
          />
        )
      }
      return (
        <ExamCatalogScreen
          exams={EXAM_REGISTRY}
          attempts={recentAttempts}
          onOpenExam={openExam}
          isLocked={(id) => !canAccessExam(isActiveSub, id)}
          onExitToHome={goHome}
        />
      )
    }

    if (tab === 'mistakes') {
      if (reviewSession) {
        return (
          <PracticeExamQuestionScreen
            examId={0}
            fallbackPool={QUESTIONS}
            categories={CATEGORIES}
            progress={progress}
            reviewPool={reviewSession}
            sessionTitle="مرور اشتباهات"
            onToggleBookmark={toggleBookmark}
            onRecordWrong={recordWrong}
            onReviewResult={handleReviewResult}
            onExit={() => setReviewSession(null)}
          />
        )
      }
      return (
        <MistakesScreen
          progress={progress}
          questions={REVIEW_QUESTIONS}
          categories={CATEGORIES}
          onStartReview={startReview}
        />
      )
    }

    if (tab === 'progress') {
      return (
        <ProgressScreen
          progress={progress}
          categories={CATEGORIES}
          questions={REVIEW_QUESTIONS}
          authed={status === 'authed'}
          attempts={recentAttempts}
          onStartExam={() => goToTab('exam')}
          onOpenAccount={() => setAuthSheetOpen(true)}
        />
      )
    }

    return null
  }

  const showTabBar = !(
    (tab === 'exam'   && examView === 'active') ||
    (tab === 'source' && sourceView === 'active')
  )

  return (
    <div className="zd-app">
      {renderScreen()}
      {showTabBar && (
        <TabBar
          active={tab === 'exam' ? 'exam' : tab}
          onChange={goToTab}
        />
      )}
      {settingsOpen && (
        <ThemeSheet
          mode={themeMode}
          onSelect={selectTheme}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      {authSheetOpen && (
        <AuthSheet onClose={() => setAuthSheetOpen(false)} />
      )}
      {purchaseSheetOpen && (
        <ManualSubscriptionSheet onClose={() => setPurchaseSheetOpen(false)} />
      )}
      <UpdatePrompt onVisibleChange={setUpdateVisible} />
      <InstallPrompt hidden={updateVisible} />
    </div>
  )
}
