import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Link to="/" className="flex items-center gap-2 group" aria-label="ChessOp home">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-sm group-hover:bg-emerald-600 transition-colors">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
                aria-hidden="true"
              >
                <path d="M11.5 13a3.5 3.5 0 0 0 0-7h5a3.5 3.5 0 0 1 0 7h-5Z" />
                <path d="M5.5 13a3.5 3.5 0 0 0 0-7h5a3.5 3.5 0 0 1 0 7h-5Z" />
                <path d="M5.5 13a3.5 3.5 0 0 1 0 7h5a3.5 3.5 0 0 0 0-7h-5Z" />
              </svg>
            </div>
            <span className="text-2xl font-bold font-heading text-white tracking-tight">
              ChessOp
            </span>
          </Link>
        </div>

        {children}
      </div>
    </div>
  )
}


