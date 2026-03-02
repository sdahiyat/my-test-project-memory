import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Upload Photo',
  description: 'Upload a new photo to PhotoBuddy.',
}

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-slate-900">Upload Photo</h1>
      <p className="text-slate-500">
        Photo upload will be implemented in the Photo Upload &amp; Storage feature.
      </p>
    </main>
  )
}
