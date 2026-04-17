import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export async function signUp(name, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  })
  // Supabase returns a user even when email confirmation is required,
  // but identities will be empty if they need to confirm first.
  if (error) throw error
  if (data.user && data.user.identities && data.user.identities.length === 0) {
    throw new Error('This email is already registered. Please sign in instead.')
  }
  // Save profile row regardless — if email confirmation is disabled, this runs immediately
  if (data.user) {
    await supabase.from('profiles').upsert({ id: data.user.id, name, email })
  }
  return data.user
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Make Supabase error messages friendlier
    if (error.message.includes('Invalid login credentials')) throw new Error('Incorrect email or password.')
    if (error.message.includes('Email not confirmed')) throw new Error('Please check your email and confirm your account first.')
    throw error
  }
  return data.user
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}

// ─── HADITH (NAWAWI 40) ───────────────────────────────────────────────────────

export async function saveHadithProgress(userId, learnedArray) {
  const { error } = await supabase.from('hadith_progress').upsert(
    { user_id: userId, learned: learnedArray, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) throw error
}

export async function loadHadithProgress(userId) {
  const { data, error } = await supabase.from('hadith_progress').select('learned').eq('user_id', userId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data?.learned ?? []
}

// ─── SUNNAH LOG ──────────────────────────────────────────────────────────────

export async function saveSunnahLog(userId, completions) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('sunnah_log').upsert(
    { user_id: userId, date: today, completions, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) throw error
}

export async function loadTodaySunnah(userId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase.from('sunnah_log').select('completions').eq('user_id', userId).eq('date', today).single()
  if (error && error.code !== 'PGRST116') throw error
  return data?.completions ?? Array(12).fill(false)
}

// ─── SHUKR LOG ───────────────────────────────────────────────────────────────

export async function saveShukrEntry(userId, blessings) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('shukr_log').upsert(
    { user_id: userId, date: today, blessings, created_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) throw error
}

export async function loadShukrLog(userId) {
  const { data, error } = await supabase.from('shukr_log').select('date, blessings').eq('user_id', userId).order('date', { ascending: false }).limit(30)
  if (error) throw error
  return data ?? []
}

// ─── GOALS ───────────────────────────────────────────────────────────────────

export async function saveGoal(userId, text, category) {
  const { data, error } = await supabase.from('goals').insert({ user_id: userId, text, category }).select().single()
  if (error) throw error
  return data
}

export async function loadGoals(userId) {
  const { data, error } = await supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function toggleGoalDone(goalId, done) {
  const { error } = await supabase.from('goals').update({ done }).eq('id', goalId)
  if (error) throw error
}

export async function deleteGoal(goalId) {
  const { error } = await supabase.from('goals').delete().eq('id', goalId)
  if (error) throw error
}

// ─── QURAN PROGRESS ──────────────────────────────────────────────────────────

export async function saveQuranProgress(userId, surahNumber, surahName, ayahNumber) {
  const { error } = await supabase.from('quran_progress').upsert(
    { user_id: userId, surah_number: surahNumber, surah_name: surahName, ayah_number: ayahNumber, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' }
  )
  if (error) throw error
}

export async function loadQuranProgress(userId) {
  const { data, error } = await supabase.from('quran_progress').select('*').eq('user_id', userId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data ?? null
}

// ─── HADITH BOOKMARKS ────────────────────────────────────────────────────────

export async function saveHadithBookmark(userId, collection, bookNumber, hadithNumber, hadithText) {
  const { data, error } = await supabase.from('hadith_bookmarks')
    .insert({ user_id: userId, collection, book_number: bookNumber, hadith_number: hadithNumber, hadith_text: hadithText })
    .select().single()
  if (error) throw error
  return data
}

export async function loadHadithBookmarks(userId) {
  const { data, error } = await supabase.from('hadith_bookmarks').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function deleteHadithBookmark(id) {
  const { error } = await supabase.from('hadith_bookmarks').delete().eq('id', id)
  if (error) throw error
}