import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const LoginPage = () => {
    const { login } = useUser()
    const navigate = useNavigate()
    const location = useLocation()

    // Fallback to home if no state
    const fromState = location.state?.from
    const from =
        (fromState?.pathname || '/') + (fromState?.search || '') + (fromState?.hash || '')

    const [identifier, setIdentifier] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            await login({ identifier, password })

            if (location.state?.from) {
                navigate(from, { replace: true })
            } else {
                if (window.history.length > 1) {
                    navigate(-1)
                } else {
                    navigate('/')
                }
            }
        } catch (err: any) {
            if (err.response?.status === 429) {
                setError('Too many attempts, try again later.')
            } else {
                setError(err.response?.data?.error || 'Invalid username/email or password.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2 font-heading">Welcome back</h1>
            <p className="text-slate-400 text-sm mb-6 font-body">Log in to continue your training.</p>

            {error && (
                <div className="mb-4 p-3 bg-rose-500/15 text-rose-100 rounded-lg border border-rose-400/30 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-200 font-body">Email or username</label>
                    <Input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        autoFocus
                        className="bg-slate-950 border-slate-700"
                        placeholder="you@example.com"
                    />
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-200 font-body">Password</label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-950 border-slate-700"
                        placeholder="••••••••••"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                >
                    {isLoading ? 'Logging in...' : 'Log In'}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400 font-body">
                Don&apos;t have an account?{' '}
                <Link
                    to="/signup"
                    className="text-emerald-500 hover:text-emerald-400 font-medium"
                    state={location.state}
                >
                    Sign up
                </Link>
            </div>
        </div>
    )
}
