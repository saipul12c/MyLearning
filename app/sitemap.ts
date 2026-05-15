import { MetadataRoute } from 'next'
import { getCourses } from '@/lib/courses'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://my-learning-projek.netlify.app'

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
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // 2. Ambil rute dinamis untuk kursus dari database
  let courseRoutes: MetadataRoute.Sitemap = []
  try {
    const courses = await getCourses({ status: 'published', pageSize: 100 })
    courseRoutes = courses.map((course) => ({
      url: `${baseUrl}/courses/${course.slug}`,
      lastModified: new Date(course.updatedAt || new Date()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error)
  }

  return [...staticRoutes, ...courseRoutes]
}
