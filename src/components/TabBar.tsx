import React from 'react'
import type { TabId } from '../types'
import { HomeIcon, BookIcon, TrophyIcon, FlagIcon, ChartIcon } from './Icons'

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

const TABS: { id: TabId; label: string; icon: React.FC<{ size?: number; stroke?: number }> }[] = [
  { id: 'home',     label: 'مسیر',     icon: HomeIcon },
  { id: 'practice', label: 'تمرین',    icon: BookIcon },
  { id: 'exam',     label: 'آزمون',    icon: TrophyIcon },
  { id: 'mistakes', label: 'اشتباهات', icon: FlagIcon },
  { id: 'progress', label: 'پیشرفت',  icon: ChartIcon },
]

export function TabBar({ active, onChange }: Props) {
  return (
    <div className="zd-tabbar" role="tablist">
      {TABS.map(({ id, label, icon: Icon }) => {
        const isActive = active === id
        return (
          <button key={id} role="tab" aria-selected={isActive}
                  className={`zd-tab${isActive ? ' is-active' : ''}`}
                  onClick={() => onChange(id)}>
            <Icon size={22} stroke={isActive ? 2.1 : 1.7} />
            <span>{label}</span>
            <div className="zd-tab-dot" />
          </button>
        )
      })}
    </div>
  )
}
