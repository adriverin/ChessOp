export interface User {
  id: string
  displayName: string
  username: string
  avatarUrl: string | null
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
  isPremium: boolean
}

export type Side = 'white' | 'black'

export type Difficulty = 'beginner' | 'intermediate' | 'advanced'

export interface Opening {
  id: string
  name: string
  description: string
  side: Side
  eco: string
  imageUrl: string | null
  variationCount: number
  isPremium: boolean
}

export interface Variation {
  id: string
  openingId: string
  name: string
  description: string
  moves: string
  moveCount: number
  difficulty: Difficulty
  isPremium: boolean
}

export interface UserProgress {
  id: string
  userId: string
  variationId: string
  masteryPercent: number
  streak: number
  nextReviewDate: string | null
  interval: number
  easeFactor: number
  totalReviews: number
  correctReviews: number
  lastReviewedAt: string | null
}

export interface UserMistake {
  id: string
  userId: string
  variationId: string
  fen: string
  wrongMove: string
  correctMove: string
  explanation: string
  occurredAt: string
  reviewedCount: number
  lastReviewedAt: string | null
}

export interface DailyQuest {
  id: string
  userId: string
  title: string
  description: string
  target: number
  progress: number
  completedAt: string | null
  expiresAt: string
}

export interface Badge {
  id: string
  userId: string
  title: string
  description: string
  earnedAt: string
}

