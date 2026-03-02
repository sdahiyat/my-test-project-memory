import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to your PhotoBuddy account.',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">📷</span>
            <span className="text-2xl font-bold text-slate-900">PhotoBuddy</span>
          </Link>
          <p className="mt-3 text-slate-600">Sign in to your account</p>
        </div>

        {/* Form placeholder — wired up in auth feature task */}
        <div className="card">
          <p className="text-center text-sm text-slate-500">
            Login form will be implemented in the Authentication feature (Task 2).
          </p>
          <div className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
