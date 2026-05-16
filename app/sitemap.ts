import { MetadataRoute } from 'next'
import { getCourses } from '@/lib/courses'
import { getEvents } from '@/lib/events'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my-learning-projek.netlify.app'

  // 1. Daftar rute statis
  const staticRoutes = [
    '',
    '/about',
    '/contact',
    '/courses',
    '/events',
    '/faq',
    '/privasi',
    '/terms',
    '/pricing',
    '/security',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // 2. Ambil rute dinamis untuk kursus
  let courseRoutes: MetadataRoute.Sitemap = []
  try {
    const courses = await getCourses({ status: 'published', pageSize: 100 })
    courseRoutes = courses.map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: new Date(course.updatedAt || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.error('Error generating course sitemap:', error)
  }

  // 3. Ambil rute dinamis untuk event
  let eventRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: events } = await getEvents({ limit: 100 })
    eventRoutes = events.map((event) => ({
      url: `${baseUrl}/events/${event.slug}`,
      lastModified: new Date(event.updatedAt || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch (error) {
    console.error('Error generating event sitemap:', error)
  }

  return [...staticRoutes, ...courseRoutes, ...eventRoutes]
}
