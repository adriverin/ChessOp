import {
    Monitor,
    Moon,
    Volume2,
    VolumeX,
    Sun,
    Type,
} from 'lucide-react'
import type { PlayerPreferences, ThemePreference } from '../types'

interface SettingsPanelProps {
    preferences: PlayerPreferences
    onUpdate: (prefs: PlayerPreferences) => void
}

function SectionHeading({ title, description }: { title: string; description: string }) {
    return (
        <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </div>
    )
}

function Toggle({
    label,
    checked,
    onChange,
}: {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
}) {
    return (
        <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
            <div
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${checked ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                onClick={() => onChange(!checked)}
            >
                <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'
                        }`}
                />
            </div>
        </label>
    )
}

function ThemeOption({
    active,
    icon: Icon,
    label,
    onClick,
}: {
    active: boolean
    icon: React.ElementType
    label: string
    onClick: () => void
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all ${active
                    ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
        >
            <Icon className="h-6 w-6" />
            <span className="text-sm font-medium">{label}</span>
        </button>
    )
}

export function SettingsPanel({ preferences, onUpdate }: SettingsPanelProps) {
    const update = (patch: Partial<PlayerPreferences>) => {
        onUpdate({ ...preferences, ...patch })
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="space-y-4">
                <SectionHeading
                    title="Appearance"
                    description="Customize how Design OS looks on your device."
                />
                <div className="grid grid-cols-3 gap-3">
                    <ThemeOption
                        active={preferences.theme === 'light'}
                        icon={Sun}
                        label="Light"
                        onClick={() => update({ theme: 'light' })}
                    />
                    <ThemeOption
                        active={preferences.theme === 'dark'}
                        icon={Moon}
                        label="Dark"
                        onClick={() => update({ theme: 'dark' })}
                    />
                    <ThemeOption
                        active={preferences.theme === 'system'}
                        icon={Monitor}
                        label="System"
                        onClick={() => update({ theme: 'system' })}
                    />
                </div>
            </div>

            <hr className="border-slate-200 dark:border-slate-800" />

            <div className="space-y-4">
                <SectionHeading
                    title="Training Preferences"
                    description="Fine-tune your training experience."
                />
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                    <div className="p-4">
                        <Toggle
                            label="Sound Effects"
                            checked={preferences.soundEnabled}
                            onChange={(checked) => update({ soundEnabled: checked })}
                        />
                    </div>
                    <div className="p-4">
                        <Toggle
                            label="Move Hints (Guidance Arrows)"
                            checked={preferences.moveHints === 'on'}
                            onChange={(checked) => update({ moveHints: checked ? 'on' : 'off' })}
                        />
                    </div>
                    <div className="p-4">
                        <Toggle
                            label="Auto-promote variations"
                            checked={preferences.autoPromoteLines}
                            onChange={(checked) => update({ autoPromoteLines: checked })}
                        />
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            When you master a variation, automatically unlock the next one in the sequence.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
