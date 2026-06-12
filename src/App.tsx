import React, { useState, useEffect, useRef } from 'react'
import type { TabId, Progress, Question, SourceView, SourceExamResult, PracticeView, ExamView } from './types'
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
import { useAuth }            from './auth/useAuth'
import {
  writeExamProgress, appendExamAttempt, readAllExamProgress, readRecentExamAttempts,
  type ExamAttemptReadItem,
} from './data/progress/repo'
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

  // ── Theme (system / light / dark) ──
  const [themeMode,    setThemeMode]    = useState<ThemeMode>(() => getStoredMode())
  const [settingsOpen, setSettingsOpen] = useState(false)

  // ── Account / auth sheet (Phase 7B) ──
  const [authSheetOpen, setAuthSheetOpen] = useState(false)

  // ── Auth state (Phase 7G) — read once; used to mirror Practice progress to cloud. ──
  const { status, user } = useAuth()

  // ── Recent exam attempts (Phase 7J) — in-memory only, never persisted.
  // null = not loaded / unavailable / read failed; [] = loaded, no attempts yet.
  const [recentAttempts, setRecentAttempts] = useState<ExamAttemptReadItem[] | null>(null)

  // In-flight guard so login fetch and Progress-open retry never overlap.
  const attemptsLoadingRef = useRef(false)

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
      return
    }
    if (hydratedUidRef.current === user.uid) return
    hydratedUidRef.current = user.uid
    void readAllExamProgress(user.uid).then(res => {
      if (!res.ok) return
      const cloudIds = res.items.flatMap(it => it.wrongQuestionIds)
      if (cloudIds.length === 0) return
      setProgress(p => {
        const fresh = [...new Set(cloudIds.filter(id => !p.wrongQuestionIds.includes(id)))]
        if (fresh.length === 0) return p // no new ids — skip the update entirely
        return { ...p, wrongQuestionIds: [...p.wrongQuestionIds, ...fresh] }
      })
    }).catch(() => undefined)
    fetchRecentAttempts(user.uid)
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
    setProgress(p => ({
      ...p,
      bookmarked: p.bookmarked.includes(id)
        ? p.bookmarked.filter(x => x !== id)
        : [...p.bookmarked, id],
    }))
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
  }

  function goHome() {
    setTab('home')
  }

  // ── Exam-flow handlers (آزمون tab; registry-driven timed simulation) ──
  function openExam(id: number) {
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
          onOpenExam={openPracticeExam}
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
          onExitToHome={goHome}
        />
      )
    }

    if (tab === 'mistakes') {
      return (
        <MistakesScreen
          progress={progress}
          questions={REVIEW_QUESTIONS}
          categories={CATEGORIES}
          onRetry={() => goToTab('practice')}
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
      <UpdatePrompt onVisibleChange={setUpdateVisible} />
      <InstallPrompt hidden={updateVisible} />
    </div>
  )
}
