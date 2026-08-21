import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/service-worker'

export const metadata: Metadata = {
  title: { default: 'Member WP', template: '%s | Member WP' },
  description: 'Tax client management and compliance workspace',
  manifest: '/manifest.webmanifest',
}
export const viewport: Viewport = { themeColor: '#173b57' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}<ServiceWorkerRegistration/></body></html>
}
