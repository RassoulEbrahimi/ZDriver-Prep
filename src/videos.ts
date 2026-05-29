export interface VideoEntry {
  id: string
  title: string      // Persian
  subtitle: string   // Persian — short description
  duration: string   // e.g. '۱:۴۵'
  src: string        // resolved URL
  poster?: string    // resolved URL — omit or leave undefined for no poster
}

const BASE = import.meta.env.BASE_URL

export const VIDEOS: VideoEntry[] = [
  {
    id: 'v01',
    title: 'آموزش رانندگی با ماشین دنده‌ای',
    subtitle: 'شروع حرکت و کنترل اولیه خودرو',
    duration: '۱:۳۰',
    src: `${BASE}videos/video-01.mp4`,
    poster: `${BASE}videos/posters/video-01.jpg`,
  },
  {
    id: 'v02',
    title: 'کنترل کلاچ در رانندگی',
    subtitle: 'تمرین تسلط روی کلاچ و حرکت نرم',
    duration: '۲:۱۰',
    src: `${BASE}videos/video-02.mp4`,
    poster: `${BASE}videos/posters/video-02.jpg`,
  },
  {
    id: 'v03',
    title: 'آموزش دنده دستی',
    subtitle: 'اصول اولیه تعویض دنده و کنترل خودرو',
    duration: '۱:۵۵',
    src: `${BASE}videos/video-03.mp4`,
    poster: `${BASE}videos/posters/video-03.jpg`,
  },
]
