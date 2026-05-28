import React, { useState } from 'react'
import type { TabId, ExamState, ExamResult } from './types'
import { QUESTIONS, CATEGORIES, PROGRESS } from './data'
import { TabBar }            from './components/TabBar'
import { HomeScreen }        from './screens/HomeScreen'
import { PracticeScreen }    from './screens/PracticeScreen'
import { ExamScreen }        from './screens/ExamScreen'
import { ExamResultScreen }  from './screens/ExamResultScreen'
import { MistakesScreen }    from './screens/MistakesScreen'
import { ProgressScreen }    from './screens/ProgressScreen'

export default function App() {
  const [tab,       setTab]       = useState<TabId>('home')
  const [examState, setExamState] = useState<ExamState>('idle')
  const [examResult, setExamResult] = useState<ExamResult | null>(null)

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
    setExamResult(result)
    setExamState('result')
  }

  function renderScreen() {
    if (tab === 'home') {
      return (
        <HomeScreen
          progress={PROGRESS}
          categories={CATEGORIES}
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
          progress={PROGRESS}
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
          progress={PROGRESS}
          questions={QUESTIONS}
          categories={CATEGORIES}
          onRetry={() => goToTab('practice')}
        />
      )
    }

    if (tab === 'progress') {
      return <ProgressScreen progress={PROGRESS} categories={CATEGORIES} />
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
