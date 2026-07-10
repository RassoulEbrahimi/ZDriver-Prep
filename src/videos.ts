export interface VideoEntry {
  id: string
  title: string      // Persian
  subtitle: string   // Persian — short description
  duration: string   // e.g. '۱:۴۵'
  src: string        // resolved URL
  poster?: string    // resolved URL — omit or leave undefined for no poster
}

const BASE = import.meta.env.BASE_URL

// Social-batch-01 quiz reels (G01–G03), re-encoded for web (720x1280 H.264,
// ~5 MB each, faststart). Titles/hooks come from
// marketing/social-batch-01/video-groups.json; durations are the real
// encoded lengths. Posters are real frames (webp) — these fixed the old
// missing-poster 404s.
export const VIDEOS: VideoEntry[] = [
  {
    id: 'v01',
    title: 'تابلوها و سرعت مجاز',
    subtitle: 'سه سؤال آیین‌نامه با پاسخ — این‌ها رو می‌شناسی؟',
    duration: '۱:۲۱',
    src: `${BASE}videos/video-01.mp4`,
    poster: `${BASE}videos/posters/video-01.webp`,
  },
  {
    id: 'v02',
    title: 'تابلو، چراغ و خودرو',
    subtitle: 'سه سؤال آیین‌نامه با پاسخ — چند تا رو بلدی؟',
    duration: '۱:۲۵',
    src: `${BASE}videos/video-02.mp4`,
    poster: `${BASE}videos/posters/video-02.webp`,
  },
  {
    id: 'v03',
    title: 'تابلو و کمک‌های اولیه',
    subtitle: 'سه سؤال آیین‌نامه با پاسخ — نکته‌های مهم امدادی',
    duration: '۱:۲۲',
    src: `${BASE}videos/video-03.mp4`,
    poster: `${BASE}videos/posters/video-03.webp`,
  },
]
