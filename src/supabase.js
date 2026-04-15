import { createClient } from '@supabase/supabase-js'

// These values come from your .env file
// Never commit your real keys — .env is in .gitignore
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)


// ─── AUTH ────────────────────────────────────────────────────────────────────

// Sign up with email + password
// Also saves the user's display name to the profiles table
export async function signUp(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  })
  if (error) throw error

  // Create a profile row so we can store the name
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      name,
      email
    })
  }

  return data.user
}


// Sign in with email + password
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data.user
}


// Sign in with Google OAuth
// Supabase handles the full redirect + token exchange automatically
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin   // brings them back to your app
    }
  })
  if (error) throw error
}


// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}


// Get the currently logged-in user (null if not logged in)
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}


// Listen for auth state changes (login, logout, token refresh)
// Pass a callback: onAuthChange((user) => { ... })
export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}


// ─── HADITH PROGRESS ─────────────────────────────────────────────────────────

// Save which hadith a user has memorised
// learnedArray = [0, 1, 5, 11, ...] — array of hadith indexes
export async function saveHadithProgress(userId, learnedArray) {
  const { error } = await supabase
    .from('hadith_progress')
    .upsert({
      user_id: userId,
      learned: learnedArray,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })
  if (error) throw error
}


// Load a user's hadith progress
export async function loadHadithProgress(userId) {
  const { data, error } = await supabase
    .from('hadith_progress')
    .select('learned')
    .eq('user_id', userId)
    .single()
  if (error && error.code !== 'PGRST116') throw error  // PGRST116 = no row yet
  return data?.learned ?? []
}


// ─── SUNNAH LOG ──────────────────────────────────────────────────────────────

// Save today's sunnah completions
// completions = [true, false, true] — matches the order of sunnahActs array
export async function saveSunnahLog(userId, completions) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('sunnah_log')
    .upsert({
      user_id: userId,
      date: today,
      completions,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' })
  if (error) throw error
}


// Load today's sunnah completions
export async function loadTodaySunnah(userId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('sunnah_log')
    .select('completions')
    .eq('user_id', userId)
    .eq('date', today)
    .single()
  if (error && error.code !== 'PGRST116') throw error
  return data?.completions ?? [false, false, false]
}


// ─── SHUKR LOG ───────────────────────────────────────────────────────────────

// Save today's shukr entry
// blessings = ['blessing 1', 'blessing 2', 'blessing 3']
export async function saveShukrEntry(userId, blessings) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase
    .from('shukr_log')
    .upsert({
      user_id: userId,
      date: today,
      blessings,
      created_at: new Date().toISOString()
    }, { onConflict: 'user_id,date' })
  if (error) throw error
}


// Load all past shukr entries for a user, newest first
export async function loadShukrLog(userId) {
  const { data, error } = await supabase
    .from('shukr_log')
    .select('date, blessings')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(30)
  if (error) throw error
  return data ?? []
}