import React from 'react'

interface Props {
  value: number
  size?: number
  stroke?: number
  color?: string
  bg?: string
  children?: React.ReactNode
}

export function ProgressRing({ value, size = 140, stroke = 12, color = 'var(--accent)', bg = 'rgba(255,255,255,0.18)', children }: Props) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
  return (
    <div className="relative" style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={off}
                style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.5,.1,.2,1)' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  )
}
