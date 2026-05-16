// src/lib/stores/authStore.ts
import { create } from 'zustand'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User } from '@/lib/types'

interface AuthState {
  firebaseUser: FirebaseUser | null
  dbUser: User | null
  isLoading: boolean
  isInitialized: boolean
  setFirebaseUser: (user: FirebaseUser | null) => void
  setDbUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setInitialized: (initialized: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  dbUser: null,
  isLoading: true,
  isInitialized: false,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  setDbUser: (user) => set({ dbUser: user }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  clearAuth: () => set({ firebaseUser: null, dbUser: null, isLoading: false }),
}))
