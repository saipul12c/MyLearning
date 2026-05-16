import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my-learning-projek.netlify.app'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/profile',
          '/login',
          '/register',
          '/verify',
          '/verify-signature',
          '/security-check',
          '/maintenance',
          '/test-certificate',
          '/api/', // Sembunyikan API route jika ada
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
