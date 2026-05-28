import React from 'react'

export interface IconProps {
  size?: number
  color?: string
  stroke?: number
}

type FC = (props: IconProps) => React.JSX.Element

const I = (children: React.ReactNode, opts?: { fill?: string }): FC =>
  ({ size = 22, color = 'currentColor', stroke = 1.8 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24"
         fill={opts?.fill ?? 'none'} stroke={color}
         strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )

export const HomeIcon    = I(<path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-3v-7H9v7H5a2 2 0 01-2-2v-9z"/>)
export const BookIcon    = I(<><path d="M4 4.5A2.5 2.5 0 016.5 2H20v18H6.5A2.5 2.5 0 014 17.5v-13z"/><path d="M4 17.5A2.5 2.5 0 016.5 15H20"/></>)
export const TrophyIcon  = I(<><path d="M7 4h10v3a5 5 0 01-10 0V4z"/><path d="M7 4H4v2a3 3 0 003 3M17 4h3v2a3 3 0 01-3 3"/><path d="M12 14v3M8 21h8"/></>)
export const FlagIcon    = I(<><path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/></>)
export const ChartIcon   = I(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>)
export const BookmarkIcon       = I(<path d="M6 3h12v18l-6-4-6 4V3z"/>)
export const BookmarkFilledIcon = I(<path d="M6 3h12v18l-6-4-6 4V3z" />, { fill: 'currentColor' })
export const CheckIcon   = I(<path d="M4 12l5 5L20 6"/>)
export const CloseIcon   = I(<path d="M6 6l12 12M18 6L6 18"/>)
export const ChevRightIcon = I(<path d="M9 6l6 6-6 6"/>)
export const ChevLeftIcon  = I(<path d="M15 6l-6 6 6 6"/>)
export const ClockIcon   = I(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>)
export const FireIcon    = I(<><path d="M12 3c1.5 3 4 4.5 4 8a4 4 0 01-8 0c0-1.5.7-2.7 1.5-3.5C9.5 6 11 5 12 3z"/><path d="M12 12c.7 1.2 1.8 1.7 1.8 3a1.8 1.8 0 11-3.6 0c0-.8.5-1.4 1-1.8.4-.4.6-.7.8-1.2z" fill="currentColor" stroke="none"/></>)
export const BellIcon    = I(<><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8z"/><path d="M10 19a2 2 0 004 0"/></>)
export const SettingsIcon= I(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/></>)
export const RefreshIcon = I(<><path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5"/></>)
export const TargetIcon  = I(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/></>)
export const AwardIcon   = I(<><circle cx="12" cy="9" r="6"/><path d="M9 14l-2 7 5-3 5 3-2-7"/></>)
export const LockIcon    = I(<><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></>)
export const PlayIcon    = I(<path d="M7 4l13 8-13 8V4z"/>, { fill: 'currentColor' })
export const MoreIcon    = I(<><circle cx="6"  cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.6" fill="currentColor" stroke="none"/></>)
export const ShieldIcon  = I(<path d="M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-3z"/>)
export const BulbIcon    = I(<><path d="M9 18h6M10 21h4M12 3a6 6 0 016 6c0 3-2 4.5-2.5 6h-7C8 13.5 6 12 6 9a6 6 0 016-6z"/></>)

/* ── Road signs ────────────────────────────────────────────── */
export function StopSign({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="30,8 70,8 92,30 92,70 70,92 30,92 8,70 8,30" fill="#C53030" stroke="#fff" strokeWidth="4"/>
      <text x="50" y="58" textAnchor="middle" fontSize="20" fontWeight="900" fill="#fff" fontFamily="Vazirmatn, sans-serif">ایست</text>
    </svg>
  )
}

export function WarnSign({ size = 96, children = '!' }: { size?: number; children?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,10 92,86 8,86" fill="#FFC833" stroke="#1A1A1A" strokeWidth="5" strokeLinejoin="round"/>
      <text x="50" y="74" textAnchor="middle" fontSize="40" fontWeight="900" fill="#1A1A1A">{children}</text>
    </svg>
  )
}

export function MandatorySign({ size = 96 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="42" fill="#2459B3" stroke="#fff" strokeWidth="4"/>
      <path d="M50 28V72M50 28L40 40M50 28L60 40" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

export function SpeedSign({ size = 96, n = '۵۰' }: { size?: number; n?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="42" fill="#fff" stroke="#C53030" strokeWidth="8"/>
      <text x="50" y="62" textAnchor="middle" fontSize="32" fontWeight="900" fill="#1A1A1A" fontFamily="Vazirmatn, sans-serif">{n}</text>
    </svg>
  )
}
