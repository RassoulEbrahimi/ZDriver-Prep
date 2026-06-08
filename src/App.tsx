import React, { useState, useEffect } from 'react'
import type { TabId, Progress, SourceView, SourceExamResult, PracticeView, ExamView } from './types'
import { QUESTIONS, CATEGORIES, PROGRESS } from './data'
import { examLength, passThreshold, loadProgress, saveProgress } from './utils'
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
import { EXAM_REGISTRY }      from './data/examRegistry'
import { ThemeSheet }         from './components/ThemeSheet'
import type { ThemeMode } from './theme'
import { applyTheme, getStoredMode, setStoredMode, subscribeSystem } from './theme'

const examSize  = examLength(QUESTIONS.length)
const passScore = passThreshold(examSize)

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

  function renderScreen() {
    if (tab === 'home') {
      return (
        <HomeScreen
          progress={progress}
          categories={CATEGORIES}
          examSize={examSize}
          passScore={passScore}
          onContinue={() => goToTab('practice')}
          onPickCategory={() => goToTab('practice')}
          onStartExam={() => goToTab('exam')}
          onOpenSourceExams={() => goToTab('exam')}
          onOpenSettings={() => setSettingsOpen(true)}
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
          onOpenExam={openExam}
          onExitToHome={goHome}
        />
      )
    }

    if (tab === 'mistakes') {
      return (
        <MistakesScreen
          progress={progress}
          questions={QUESTIONS}
          categories={CATEGORIES}
          onRetry={() => goToTab('practice')}
        />
      )
    }

    if (tab === 'progress') {
      return <ProgressScreen progress={progress} categories={CATEGORIES} />
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
    </div>
  )
}
