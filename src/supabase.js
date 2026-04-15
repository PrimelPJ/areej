import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function signUp(name, email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
  if (error) throw error
  if (data.user) await supabase.from('profiles').upsert({ id: data.user.id, name, email })
  return data.user
}
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data.user
}
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
  if (error) throw error
}
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
export function onAuthChange(callback) {
  supabase.auth.onAuthStateChange((_event, session) => { callback(session?.user ?? null) })
}

export async function saveHadithProgress(userId, learnedArray) {
  const { error } = await supabase.from('hadith_progress').upsert({ user_id: userId, learned: learnedArray, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}
export async function loadHadithProgress(userId) {
  const { data, error } = await supabase.from('hadith_progress').select('learned').eq('user_id', userId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data?.learned ?? []
}

export async function saveSunnahLog(userId, completions) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('sunnah_log').upsert({ user_id: userId, date: today, completions, updated_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
  if (error) throw error
}
export async function loadTodaySunnah(userId) {
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase.from('sunnah_log').select('completions').eq('user_id', userId).eq('date', today).single()
  if (error && error.code !== 'PGRST116') throw error
  return data?.completions ?? [false, false, false]
}

export async function saveShukrEntry(userId, blessings) {
  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('shukr_log').upsert({ user_id: userId, date: today, blessings, created_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
  if (error) throw error
}
export async function loadShukrLog(userId) {
  const { data, error } = await supabase.from('shukr_log').select('date, blessings').eq('user_id', userId).order('date', { ascending: false }).limit(30)
  if (error) throw error
  return data ?? []
}

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