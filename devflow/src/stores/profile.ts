import type { Profile } from '@/types'
import { useDatabase } from './db'

export type ProfileEditable = Pick<Profile, 'name' | 'targetRole' | 'weeklyGoalHours'>

export function updateProfile(patch: Partial<ProfileEditable>): Profile {
  const db = useDatabase()

  const next = { ...patch }

  if (typeof next.weeklyGoalHours === 'number') {
    next.weeklyGoalHours = Math.min(80, Math.max(1, Math.round(next.weeklyGoalHours)))
  }

  Object.assign(db.profile, next)
  return db.profile
}
