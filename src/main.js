import { supabase, signUp, signIn, signInWithGoogle, signOut, onAuthChange,
  saveHadithProgress, loadHadithProgress,
  saveSunnahLog, loadTodaySunnah,
  saveShukrEntry, loadShukrLog } from './supabase.js'

// ─── DATA ────────────────────────────────────────────────────────────────────

const hadithData = [
  {ar:"إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",en:"Actions are judged by intentions. Every person will have what they intended.",src:"Umar ibn Al-Khattab · Bukhari & Muslim"},
  {ar:"الإِسْلَامُ أَنْ تَشْهَدَ أَنْ لَا إِلَهَ إِلَّا اللَّهُ",en:"Islam is to testify there is no god but Allah and Muhammad is His messenger, establish prayer, give zakat, fast Ramadan, and perform Hajj.",src:"Umar ibn Al-Khattab · Muslim"},
  {ar:"بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ",en:"Islam is built on five pillars: the testimony, prayer, zakat, fasting, and Hajj.",src:"Ibn Umar · Bukhari & Muslim"},
  {ar:"إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ",en:"Each of you is formed in your mother's womb for forty days as a drop, then a clot, then a lump — then the angel breathes the soul into it.",src:"Abdullah ibn Masud · Bukhari & Muslim"},
  {ar:"مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ",en:"Whoever introduces into this matter of ours something that does not belong to it, it is rejected.",src:"Aisha · Bukhari & Muslim"},
  {ar:"الْحَلَالُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ",en:"The halal is clear and the haram is clear. Between them are doubtful matters. Whoever avoids the doubtful safeguards his religion and honour.",src:"Nu'man ibn Bashir · Bukhari & Muslim"},
  {ar:"الدِّينُ النَّصِيحَةُ",en:"The religion is sincere advice — to Allah, His Book, His Messenger, the leaders of the Muslims, and their common people.",src:"Tamim Al-Dari · Muslim"},
  {ar:"مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ",en:"Whatever I forbid you, avoid it. Whatever I command you, do as much of it as you are able.",src:"Abu Hurairah · Bukhari & Muslim"},
  {ar:"إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا",en:"Allah is pure and accepts only what is pure. He commanded the believers as He commanded the messengers: eat from the good things and act righteously.",src:"Abu Hurairah · Muslim"},
  {ar:"دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ",en:"Leave what makes you doubt for what does not make you doubt. Truthfulness brings tranquility; lying brings doubt.",src:"Al-Hasan ibn Ali · Tirmidhi"},
  {ar:"مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ",en:"Part of the perfection of a person's Islam is leaving alone what does not concern him.",src:"Abu Hurairah · Tirmidhi"},
  {ar:"لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",en:"None of you truly believes until he loves for his brother what he loves for himself.",src:"Anas ibn Malik · Bukhari & Muslim"},
]

const sunnahActs = [
  { name:"Miswak before salah", sahabi:"Practiced by Abdullah ibn Masud RA" },
  { name:"Drink water in 3 sips", sahabi:"Narrated by Anas ibn Malik RA" },
  { name:"Sleep on right side", sahabi:"Practiced by Al-Bara ibn Azib RA" },
]

const angerSteps = [
  { n:"1", title:"Seek refuge in Allah", ar:"أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", sub:"Say it aloud — repeat until you feel it" },
  { n:"2", title:"Change your position", ar:"", sub:"If standing, sit. If sitting, lie down." },
  { n:"3", title:"Make wudu", ar:"", sub:"Anger is from fire — water extinguishes fire." },
  { n:"4", title:"Stay silent", ar:"", sub:"\"When one of you is angry, let him be silent.\" — Bukhari" },
]

const ayahs = [
  { text:'"If you are grateful, I will surely increase you in favour..."', ref:"Surah Ibrahim · 14:7" },
  { text:'"And He gave you of all that you asked of Him. If you count the blessings of Allah, you could never enumerate them..."', ref:"Surah Ibrahim · 14:34" },
  { text:'"So remember Me; I will remember you. And be grateful to Me and do not deny Me."', ref:"Surah Al-Baqarah · 2:152" },
]

// ─── STATE ───────────────────────────────────────────────────────────────────

let currentUser = null
let learned = new Set()
let sunnahDone = [false, false, false]
let shukrLog = []
let reviewQueue = [0, 1, 2]
let reviewIdx = 0
let flipped = false

// ─── AUTH ────────────────────────────────────────────────────────────────────

function showLogin() {
  document.getElementById('login-card').style.display = ''
  document.getElementById('signup-card').style.display = 'none'
  clearErrors()
}

function showSignup() {
  document.getElementById('signup-card').style.display = ''
  document.getElementById('login-card').style.display = 'none'
  clearErrors()
}

function clearErrors() {
  document.getElementById('login-err').style.display = 'none'
  document.getElementById('signup-err').style.display = 'none'
}

function showErr(id, msg) {
  const el = document.getElementById(id)
  el.textContent = msg
  el.style.display = 'block'
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim()
  const pw = document.getElementById('login-pw').value
  if (!email || !pw) return showErr('login-err', 'Please fill in all fields.')
  try {
    await signIn(email, pw)
    // onAuthChange handles the rest
  } catch (e) {
    showErr('login-err', e.message)
  }
}

async function doSignup() {
  const name = document.getElementById('signup-name').value.trim()
  const email = document.getElementById('signup-email').value.trim()
  const pw = document.getElementById('signup-pw').value
  if (!name || !email || !pw) return showErr('signup-err', 'Please fill in all fields.')
  if (pw.length < 8) return showErr('signup-err', 'Password must be at least 8 characters.')
  try {
    await signUp(name, email, pw)
    showToast('Account created! Check your email to confirm.')
  } catch (e) {
    showErr('signup-err', e.message)
  }
}

async function doGoogle() {
  try {
    await signInWithGoogle()
  } catch (e) {
    showErr('login-err', e.message)
  }
}

async function doLogout() {
  await signOut()
}

// ─── APP INIT ────────────────────────────────────────────────────────────────

async function initApp(user) {
  currentUser = user

  // Load user's data from Supabase
  const [learnedArr, sunnahArr, shukrArr] = await Promise.all([
    loadHadithProgress(user.id),
    loadTodaySunnah(user.id),
    loadShukrLog(user.id),
  ])

  learned = new Set(learnedArr)
  sunnahDone = sunnahArr
  shukrLog = shukrArr

  // Set user info in sidebar
  const name = user.user_metadata?.full_name || user.email.split('@')[0]
  document.getElementById('sidebar-name').textContent = name
  document.getElementById('sidebar-email').textContent = user.email
  document.getElementById('home-greeting').textContent = `Assalamu Alaykum, ${name.split(' ')[0]}`
  document.getElementById('home-date').textContent = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  renderAll()
  showToast(`Welcome back, ${name.split(' ')[0]} 🌿`)
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

function goTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.s-item').forEach(i => i.classList.remove('active'))
  document.getElementById('page-' + page).classList.add('active')
  const idx = { home:0, hadith:1, sunnah:2, anger:3, shukr:4 }
  document.querySelectorAll('.s-item')[idx[page]].classList.add('active')
}

// ─── RENDER ──────────────────────────────────────────────────────────────────

function renderAll() {
  renderHadith()
  renderSunnah()
  renderAnger()
  renderShukrLog()
  updateStats()
}

function renderHadith() {
  document.getElementById('hadith-list').innerHTML = hadithData.map((h, i) => `
    <div class="h-row ${learned.has(i) ? 'learned' : ''}">
      <div class="h-num">${i + 1}</div>
      <div style="flex:1;">
        <div class="h-ar">${h.ar}</div>
        <div style="font-size:11px;color:#7aaa8a;">${h.src.split('·')[0].trim()}</div>
      </div>
      <div style="font-size:11px;color:var(--gm);">${learned.has(i) ? '✓' : ''}</div>
    </div>`).join('')
}

function startReview() {
  reviewIdx = 0
  flipped = false
  document.getElementById('list-mode').classList.add('hidden')
  document.getElementById('review-mode').classList.add('active')
  loadReviewCard()
}

function exitReview() {
  document.getElementById('list-mode').classList.remove('hidden')
  document.getElementById('review-mode').classList.remove('active')
  document.getElementById('flip-inner').classList.remove('flipped')
  document.getElementById('rev-btns').style.display = 'none'
  flipped = false
  renderHadith()
}

function loadReviewCard() {
  if (reviewIdx >= reviewQueue.length) {
    exitReview()
    showToast('Review complete! JazakAllahu khairan ✓')
    return
  }
  const h = hadithData[reviewQueue[reviewIdx]]
  document.getElementById('rev-ar').textContent = h.ar
  document.getElementById('rev-num').textContent = `Hadith ${reviewQueue[reviewIdx] + 1} of 40`
  document.getElementById('rev-en').textContent = h.en
  document.getElementById('rev-src').textContent = h.src
  document.getElementById('flip-inner').classList.remove('flipped')
  document.getElementById('rev-btns').style.display = 'none'
  flipped = false
}

function flipCard() {
  if (!flipped) {
    document.getElementById('flip-inner').classList.add('flipped')
    document.getElementById('rev-btns').style.display = 'flex'
    flipped = true
  }
}

async function markHadith(knew) {
  if (knew) learned.add(reviewQueue[reviewIdx])
  reviewIdx++
  loadReviewCard()
  updateStats()
  await saveHadithProgress(currentUser.id, [...learned])
}

function renderSunnah() {
  document.getElementById('sunnah-list').innerHTML = sunnahActs.map((s, i) => `
    <div class="sunnah-item ${sunnahDone[i] ? 'done' : ''}" onclick="toggleSunnah(${i})">
      <div class="chk"><div class="chk-mark"></div></div>
      <div>
        <div class="sunnah-name">${s.name}</div>
        <div class="sunnah-sahabi">${s.sahabi}</div>
      </div>
    </div>`).join('')
}

async function toggleSunnah(i) {
  sunnahDone[i] = !sunnahDone[i]
  renderSunnah()
  updateStats()
  await saveSunnahLog(currentUser.id, sunnahDone)
  showToast(sunnahDone[i] ? 'Sunnah recorded ✓' : 'Unmarked')
}

function renderAnger() {
  document.getElementById('anger-steps').innerHTML = angerSteps.map((s, i) => `
    <div class="step-item" id="astep-${i}">
      <div class="step-num">${s.n}</div>
      <div>
        <div class="step-title">${s.title}</div>
        ${s.ar ? `<div class="step-ar">${s.ar}</div>` : ''}
        <div class="step-sub">${s.sub}</div>
      </div>
    </div>`).join('')
}

function activateGuide() {
  let step = 0
  const go = () => {
    angerSteps.forEach((_, i) => {
      const el = document.getElementById('astep-' + i)
      if (el) el.classList.toggle('active-step', i === step)
    })
    if (step < angerSteps.length - 1) { step++; setTimeout(go, 2000) }
  }
  go()
}

function renderShukrLog() {
  document.getElementById('shukr-log').innerHTML = shukrLog.map(e => `
    <div class="shukr-entry">
      <div class="shukr-date">${e.date}</div>
      ${e.blessings.map(b => `<div class="shukr-b"><div class="shukr-b-dot"></div><span>${b}</span></div>`).join('')}
    </div>`).join('')
}

async function saveShukr() {
  const b1 = document.getElementById('b1').value.trim()
  const b2 = document.getElementById('b2').value.trim()
  const b3 = document.getElementById('b3').value.trim()
  const blessings = [b1, b2, b3].filter(Boolean)
  if (!blessings.length) { showToast('Enter at least one blessing'); return }

  await saveShukrEntry(currentUser.id, blessings)
  shukrLog = await loadShukrLog(currentUser.id)

  document.getElementById('b1').value = ''
  document.getElementById('b2').value = ''
  document.getElementById('b3').value = ''

  renderShukrLog()
  updateStats()

  const a = ayahs[Math.floor(Math.random() * ayahs.length)]
  document.getElementById('ayah-text').textContent = a.text
  document.getElementById('ayah-ref').textContent = a.ref

  showToast('Shukr saved — may Allah increase your blessings 🌿')
}

function updateStats() {
  const lc = learned.size
  const sc = sunnahDone.filter(Boolean).length
  const shc = shukrLog.length

  document.getElementById('h-count').textContent = lc
  document.getElementById('hm').textContent = lc
  document.getElementById('hl').textContent = 40 - lc
  document.getElementById('h-prog').style.width = Math.round(lc / 40 * 100) + '%'
  document.getElementById('h-badge').textContent = lc + ' memorised'

  document.getElementById('s-count').textContent = sc
  document.getElementById('s-prog').style.width = Math.round(sc / 3 * 100) + '%'
  document.getElementById('s-badge').textContent = sc + ' / 3 done'

  document.getElementById('shukr-count').textContent = shc
  document.getElementById('shukr-badge').textContent = 'Day ' + shc
  document.getElementById('streak-val').textContent = shc
}

function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2800)
}

// ─── BOOT ────────────────────────────────────────────────────────────────────

// Expose functions to HTML onclick handlers
window.showLogin = showLogin
window.showSignup = showSignup
window.doLogin = doLogin
window.doSignup = doSignup
window.doGoogle = doGoogle
window.doLogout = doLogout
window.goTo = goTo
window.startReview = startReview
window.exitReview = exitReview
window.flipCard = flipCard
window.markHadith = markHadith
window.toggleSunnah = toggleSunnah
window.activateGuide = activateGuide
window.saveShukr = saveShukr

// Listen for auth state — this fires on page load and on login/logout
onAuthChange(async (user) => {
  document.getElementById('loading').style.display = 'none'
  if (user) {
    document.getElementById('auth-wrap').style.display = 'none'
    document.getElementById('app-wrap').style.display = 'block'
    await initApp(user)
  } else {
    document.getElementById('auth-wrap').style.display = 'flex'
    document.getElementById('app-wrap').style.display = 'none'
    showLogin()
  }
})