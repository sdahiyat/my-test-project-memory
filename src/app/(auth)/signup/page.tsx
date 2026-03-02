import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign up',
  description: 'Create your free PhotoBuddy account.',
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">📷</span>
            <span className="text-2xl font-bold text-slate-900">PhotoBuddy</span>
          </Link>
          <p className="mt-3 text-slate-600">Create your free account</p>
        </div>

        {/* Form placeholder */}
        <div className="card">
          <p className="text-center text-sm text-slate-500">
            Sign-up form will be implemented in the Authentication feature (Task 2).
          </p>
          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
