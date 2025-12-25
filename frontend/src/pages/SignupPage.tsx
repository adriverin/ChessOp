import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export const SignupPage = () => {
    const { signup } = useUser()
    const navigate = useNavigate()
    const location = useLocation()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        setIsLoading(true)
        try {
            await signup({ email, password, confirmPassword })

            const fromState = location.state?.from
            const from =
                (fromState?.pathname || '/') +
                (fromState?.search || '') +
                (fromState?.hash || '')

            if (location.state?.from) {
                navigate(from, { replace: true })
                return
            }

            if (window.history.length > 1) {
                navigate(-1)
            } else {
                navigate('/')
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Signup failed. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
            <h1 className="text-2xl font-bold text-white mb-2 font-heading">Create your account</h1>
            <p className="text-slate-400 text-sm mb-6 font-body">Start training and track your progress.</p>

            {error && (
                <div className="mb-4 p-3 bg-rose-500/15 text-rose-100 rounded-lg border border-rose-400/30 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-200 font-body">Email</label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
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
                        minLength={10}
                        className="bg-slate-950 border-slate-700"
                        placeholder="Min. 10 characters"
                    />
                    <p className="text-xs text-slate-500 font-body">Min. 10 characters</p>
                </div>
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-200 font-body">Confirm password</label>
                    <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {isLoading ? 'Creating account...' : 'Sign Up'}
                </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400 font-body">
                Already have an account?{' '}
                <Link
                    to="/login"
                    className="text-emerald-500 hover:text-emerald-400 font-medium"
                    state={location.state}
                >
                    Log in
                </Link>
            </div>
        </div>
    )
}
