import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'PhotoBuddy privacy policy and data management.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link href="/" className="flex items-center gap-2 w-fit">
            <span className="text-xl">📷</span>
            <span className="font-bold text-slate-900">PhotoBuddy</span>
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-12 prose prose-slate">
        <h1>Privacy Policy</h1>
        <p className="text-slate-500">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mt-8">
          <h2>1. Data We Collect</h2>
          <p>
            PhotoBuddy collects information you provide directly, such as your
            email address, username, display name, and photos you upload. We also
            collect metadata associated with your photos (excluding GPS coordinates,
            which are stripped before public display).
          </p>
        </section>

        <section className="mt-8">
          <h2>2. How We Use Your Data</h2>
          <p>
            We use your data to operate the platform, provide AI-powered photo
            analysis, process payments, and improve our services. We do not sell
            your personal data to third parties.
          </p>
        </section>

        <section className="mt-8">
          <h2>3. Data Retention &amp; Deletion</h2>
          <p>
            You may request deletion of your account and all associated data at
            any time from your account settings. Deletion is processed within 30
            days. Photos are removed from our CDN and comments are anonymised.
          </p>
        </section>

        <section className="mt-8">
          <h2>4. Data Export (GDPR)</h2>
          <p>
            You have the right to export all data we hold about you. Request a
            data export from your account settings page. We will prepare a
            downloadable archive and notify you when it is ready.
          </p>
        </section>

        <section className="mt-8">
          <h2>5. Cookies</h2>
          <p>
            We use essential cookies for authentication and session management.
            No third-party advertising cookies are used.
          </p>
        </section>

        <section className="mt-8">
          <h2>6. Contact</h2>
          <p>
            For privacy-related enquiries, please contact us via the account
            settings page.
          </p>
        </section>
      </main>
    </div>
  )
}
