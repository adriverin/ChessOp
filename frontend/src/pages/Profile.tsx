import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type MistakesResponse } from '../api/client'
import { PlayerProfile } from '../components/PlayerProfile/components'
import type {
  Opening as BackendOpening,
  OpeningsResponse,
  RepertoireResponse,
  Variation as BackendVariation,
} from '../types'
import type {
  Opening,
  OpeningProgress,
  PlayerPreferences,
  PlayerProfileUiState,
  Side,
  User,
  UserMistake,
  Variation,
} from '../components/PlayerProfile/types'
import { useTheme } from '../context/ThemeContext'
import { useUser } from '../context/UserContext'

const PREFERENCES_STORAGE_KEY = 'playerProfile.preferences'

function inferSideFromTags(tags: string[]): Side {
  return tags.includes('Black') ? 'black' : 'white'
}

function asDifficulty(value: string | undefined): Variation['difficulty'] {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced') return value
  return 'beginner'
}

function getStableUserId(fallback: string, user: { id?: string } | null): string {
  return user?.id ?? fallback
}

function getDefaultPreferences(theme: PlayerPreferences['theme']): PlayerPreferences {
  return {
    theme,
    soundEnabled: true,
    moveHints: 'on',
    autoPromoteLines: true,
  }
}

function readStoredPreferences(theme: PlayerPreferences['theme']): PlayerPreferences {
  const defaults = getDefaultPreferences(theme)
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY)
    if (!raw) return defaults
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return defaults
    const obj = parsed as Record<string, unknown>

    const storedTheme = obj.theme
    const nextTheme =
      storedTheme === 'system' || storedTheme === 'light' || storedTheme === 'dark'
        ? storedTheme
        : defaults.theme

    const soundEnabled = typeof obj.soundEnabled === 'boolean' ? obj.soundEnabled : defaults.soundEnabled
    const moveHints = obj.moveHints === 'on' || obj.moveHints === 'off' ? obj.moveHints : defaults.moveHints
    const autoPromoteLines =
      typeof obj.autoPromoteLines === 'boolean' ? obj.autoPromoteLines : defaults.autoPromoteLines

    return { theme: nextTheme, soundEnabled, moveHints, autoPromoteLines }
  } catch {
    return defaults
  }
}

function writeStoredPreferences(prefs: PlayerPreferences) {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

function mapOpeningsToProfile(
  openingsResponse: OpeningsResponse,
  repertoire: RepertoireResponse | null
) {
  const openings: Opening[] = []
  const variations: Variation[] = []
  const openingProgress: OpeningProgress[] = []

  const seenOpenings = new Set<string>()
  const seenVariations = new Set<string>()

  const pushOpening = (opening: Opening) => {
    if (seenOpenings.has(opening.id)) return
    seenOpenings.add(opening.id)
    openings.push(opening)
  }

  const pushVariation = (variation: Variation) => {
    if (seenVariations.has(variation.id)) return
    seenVariations.add(variation.id)
    variations.push(variation)
  }

  Object.values(openingsResponse).forEach((categoryOpenings) => {
    categoryOpenings.forEach((opening: BackendOpening) => {
      const side = inferSideFromTags(opening.tags)
      const openingId = opening.id

      pushOpening({
        id: openingId,
        name: opening.name,
        description: '',
        side,
        eco: '—',
        imageUrl: '',
        variationCount: opening.variations.length,
        isPremium: false,
      })

      opening.variations.forEach((variation: BackendVariation) => {
        const variationId = variation.id
        pushVariation({
          id: variationId,
          openingId,
          name: variation.name,
          description: '',
          moves: '',
          moveCount: variation.moves.length,
          difficulty: asDifficulty(variation.difficulty),
          isPremium: false,
          isLocked: variation.locked,
          isInRepertoire: false,
        })
      })

      const whiteIds = repertoire?.white.map((o) => o.opening_id) ?? []
      const blackIds = repertoire?.black.map((o) => o.opening_id) ?? []
      const inRepertoire = whiteIds.includes(openingId) || blackIds.includes(openingId)

      const progress = opening.progress
      if (!progress) return

      // if (progress.percentage <= 0 && progress.completed <= 0) return
      if (progress.percentage <= 0 && progress.completed <= 0 && !inRepertoire) return

      const status: OpeningProgress['status'] =
        progress.total > 0 && progress.completed >= progress.total ? 'mastered' : 'inProgress'

      openingProgress.push({
        openingId,
        status,
        masteryPercent: progress.percentage,
        masteredVariations: progress.completed,
        totalVariations: progress.total,
        lastTrainedAt: null,
        nextReviewDate: null,
        isInRepertoire: inRepertoire,
      })
    })
  })

  return { openings, variations, openingProgress }
}

function mapMistakesToProfile(response: MistakesResponse): UserMistake[] {
  return response.mistakes.map((m) => {
    const variationId =
      m.variation_id === null || m.variation_id === undefined ? `unknown-${m.id}` : String(m.variation_id)

    return {
      id: String(m.id),
      variationId,
      fen: m.fen,
      wrongMove: m.wrong_move,
      correctMove: m.correct_move,
      explanation: 'Replay this position in Training Arena to see the correct plan.',
      occurredAt: m.created_at,
      reviewedCount: 0,
      lastReviewedAt: null,
      tags: [],
      note: null,
    }
  })
}

export function Profile() {
  const navigate = useNavigate()
  const { user, loading: userLoading } = useUser()
  const { themePreference, setThemePreference } = useTheme()

  const [openingsResponse, setOpeningsResponse] = useState<OpeningsResponse | null>(null)
  const [mistakesResponse, setMistakesResponse] = useState<MistakesResponse | null>(null)
  const [repertoireResponse, setRepertoireResponse] = useState<RepertoireResponse | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)

  const [ui, setUi] = useState<PlayerProfileUiState>({
    activeTab: 'overview',
    selectedOpeningId: null,
    selectedMistakeId: null,
  })

  const [preferences, setPreferences] = useState<PlayerPreferences>(() =>
    readStoredPreferences(themePreference)
  )

  useEffect(() => {
    if (userLoading) return
    if (!user?.is_authenticated) return

    Promise.all([api.getOpenings(), api.getMistakes(), api.getRepertoire()])
      .then(([openings, mistakes, repertoire]) => {
        setDataError(null)
        setOpeningsResponse(openings)
        setMistakesResponse(mistakes)
        setRepertoireResponse(repertoire)
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : 'Failed to load profile data'
        setDataError(message)
      })
      .finally(() => setDataLoading(false))
  }, [userLoading, user?.is_authenticated])

  const { openings, variations, openingProgress } = useMemo(() => {
    if (!openingsResponse) return { openings: [], variations: [], openingProgress: [] }
    return mapOpeningsToProfile(openingsResponse, repertoireResponse)
  }, [openingsResponse, repertoireResponse])

  const userMistakes = useMemo(() => {
    if (!mistakesResponse) return []
    return mapMistakesToProfile(mistakesResponse)
  }, [mistakesResponse])

  const handleClearAllMistakes = () => {
    if (!mistakesResponse || mistakesResponse.mistakes.length === 0) return
    const previous = mistakesResponse
    setMistakesResponse((prev) => (prev ? { ...prev, mistakes: [] } : prev))
    api.clearAllMistakes()
      .then(() => {
        // Force refresh to sync with backend
        return api.getMistakes().then(data => setMistakesResponse(data));
      })
      .catch((err) => {
        setMistakesResponse(previous)
        console.error('Failed to clear mistakes', err)
      })
  }

  const isPremium = Boolean(
    user?.effective_premium ?? user?.is_premium ?? user?.is_staff ?? user?.is_superuser
  )

  const displayName = (() => {
    const email = user?.email
    if (typeof email === 'string' && email.includes('@')) return email.split('@')[0] ?? 'Player'
    return 'Player'
  })()

  const username = (() => {
    const email = user?.email
    if (typeof email === 'string' && email.includes('@')) return email.split('@')[0] ?? 'player'
    return 'player'
  })()

  const profileUser: User = {
    id: getStableUserId('me', user),
    displayName,
    username,
    avatarUrl: '/vite.svg',
    totalXp: user?.xp ?? 0,
    level: user?.level ?? 1,
    currentStreak: user?.one_move_current_streak ?? 0,
    longestStreak: user?.one_move_best_streak ?? 0,
    isPremium,
  }

  if (!user?.is_authenticated) {
    return <div className="p-10 text-center">Please log in to view your profile.</div>
  }

  if (dataLoading) {
    return <div className="p-10 text-center text-slate-500 dark:text-slate-400">Loading profile…</div>
  }

  if (dataError) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-700 dark:text-slate-300">Could not load your profile.</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{dataError}</p>
      </div>
    )
  }

  return (
    <PlayerProfile
      user={profileUser}
      openings={openings}
      variations={variations}
      userProgress={[]}
      openingProgress={openingProgress}
      userMistakes={userMistakes}
      preferences={preferences}
      ui={ui}
      isGuest={false}
      isPremium={isPremium}
      onSelectTab={(tab) => setUi((prev) => ({ ...prev, activeTab: tab }))}
      onTrainOpening={(openingId) => {
        const next = new URLSearchParams()
        next.set('opening_id', openingId)
        next.set('t', String(Date.now()))
        navigate(`/train?${next.toString()}`)
      }}
      onSelectOpening={(openingId) => setUi((prev) => ({ ...prev, selectedOpeningId: openingId }))}
      onViewMistake={(mistakeId) => setUi((prev) => ({ ...prev, selectedMistakeId: mistakeId }))}
      onRetryMistake={(mistakeId) => {
        const next = new URLSearchParams()
        next.set('mistake_id', mistakeId)
        next.set('t', String(Date.now()))
        navigate(`/train?${next.toString()}`)
      }}
      onDismissMistake={(mistakeId) => {
        // Optimistic update
        setMistakesResponse((prev) => {
          if (!prev) return null
          return {
            ...prev,
            mistakes: prev.mistakes.filter((m) => String(m.id) !== mistakeId),
          }
        })
        api.dismissMistake(mistakeId).catch(() => {
          // Revert on failure (could refetch, but silent fail is often acceptable for dismiss actions)
          // For now, we'll just log
          console.error('Failed to dismiss mistake')
        })
      }}
      onUpdatePreferences={(next) => {
        setPreferences(next)
        writeStoredPreferences(next)
        setThemePreference(next.theme)
      }}
      onClearAllMistakes={handleClearAllMistakes}
    />
  )
}
