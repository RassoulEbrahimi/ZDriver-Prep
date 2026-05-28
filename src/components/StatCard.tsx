import React from 'react'
import type { IconProps } from './Icons'

interface Props {
  label: string
  value: string
  sub?: string
  color?: string
  icon?: (props: IconProps) => React.JSX.Element
}

export function StatCard({ label, value, sub, color = 'var(--primary)', icon: Icon }: Props) {
  return (
    <div className="zd-card flex-1 min-w-0" style={{ padding: 14 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{label}</div>
        {Icon && (
          <div style={{
            width: 28, height: 28, borderRadius: 9,
            background: `color-mix(in oklab, ${color} 14%, transparent)`,
            color,
            display: 'grid', placeItems: 'center',
          }}>
            <Icon size={16} stroke={2} />
          </div>
        )}
      </div>
      <div className="zd-num" style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
