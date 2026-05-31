import React, { useState, useEffect } from 'react'
import type { TabId, ExamState, ExamResult, Progress } from './types'
import { QUESTIONS, CATEGORIES, PROGRESS } from './data'
import { examLength, passThreshold, loadProgress, saveProgress } from './utils'
import { TabBar }            from './components/TabBar'
import { HomeScreen }        from './screens/HomeScreen'
import { PracticeScreen }    from './screens/PracticeScreen'
import { ExamScreen }        from './screens/ExamScreen'
import { ExamResultScreen }  from './screens/ExamResultScreen'
import { MistakesScreen }    from './screens/MistakesScreen'
import { ProgressScreen }    from './screens/ProgressScreen'

const examSize  = examLength(QUESTIONS.length)
const passScore = passThreshold(examSize)

export default function App() {
  const [tab,       setTab]       = useState<TabId>('home')
  const [examState, setExamState] = useState<ExamState>('idle')
  const [examResult, setExamResult] = useState<ExamResult | null>(null)
  const [progress,  setProgress]  = useState<Progress>(() => loadProgress(PROGRESS))

  // Persist progress (bookmarks, mistakes, stats) on every change.
  useEffect(() => { saveProgress(progress) }, [progress])

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
    if (t === 'exam') {
      setTab('exam')
      setExamState('active')
      setExamResult(null)
    } else {
      setTab(t)
      setExamState('idle')
    }
  }

  function goHome() {
    setTab('home')
    setExamState('idle')
  }

  function handleExamFinish(result: ExamResult) {
    const wrongIds = result.exam
      .filter((q, i) => result.answers[i] !== q.answer)
      .map(q => q.id)
    recordWrong(wrongIds)
    setExamResult(result)
    setExamState('result')
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
        />
      )
    }

    if (tab === 'practice') {
      return (
        <PracticeScreen
          questions={QUESTIONS}
          categories={CATEGORIES}
          progress={progress}
          onToggleBookmark={toggleBookmark}
          onRecordWrong={recordWrong}
          onExitToHome={goHome}
        />
      )
    }

    if (tab === 'exam') {
      if (examState === 'result' && examResult) {
        return (
          <ExamResultScreen
            result={examResult}
            onRetry={() => { setExamState('active'); setExamResult(null) }}
            onReviewWrong={() => { setTab('mistakes'); setExamState('idle') }}
            onHome={goHome}
          />
        )
      }
      return (
        <ExamScreen
          questions={QUESTIONS}
          categories={CATEGORIES}
          onFinish={handleExamFinish}
          onExit={goHome}
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

  const showTabBar = !(tab === 'exam' && examState === 'active')

  return (
    <div className="zd-app">
      {renderScreen()}
      {showTabBar && (
        <TabBar
          active={tab === 'exam' ? 'exam' : tab}
          onChange={goToTab}
        />
      )}
    </div>
  )
}
