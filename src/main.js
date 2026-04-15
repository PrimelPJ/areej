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
  {ar:"الْحَلَالُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ",en:"The halal is clear and the haram is clear. Between them are doubtful matters.",src:"Nu'man ibn Bashir · Bukhari & Muslim"},
  {ar:"الدِّينُ النَّصِيحَةُ",en:"The religion is sincere advice — to Allah, His Book, His Messenger, the leaders, and their common people.",src:"Tamim Al-Dari · Muslim"},
  {ar:"مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ",en:"Whatever I forbid you, avoid it. Whatever I command you, do as much of it as you are able.",src:"Abu Hurairah · Bukhari & Muslim"},
  {ar:"إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا",en:"Allah is pure and accepts only what is pure.",src:"Abu Hurairah · Muslim"},
  {ar:"دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ",en:"Leave what makes you doubt for what does not make you doubt.",src:"Al-Hasan ibn Ali · Tirmidhi"},
  {ar:"مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ",en:"Part of the perfection of a person's Islam is leaving alone what does not concern him.",src:"Abu Hurairah · Tirmidhi"},
  {ar:"لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",en:"None of you truly believes until he loves for his brother what he loves for himself.",src:"Anas ibn Malik · Bukhari & Muslim"},
]

const arabicWords = [
  {ar:"صَبْر",trans:"Sabr",mean:"Patience",cat:"Character",exAr:"وَاللَّهُ يُحِبُّ الصَّابِرِينَ",exEn:"And Allah loves the patient. — Surah Ali Imran 3:146"},
  {ar:"شُكْر",trans:"Shukr",mean:"Gratitude",cat:"Character",exAr:"لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",exEn:"If you are grateful, I will surely increase you. — Surah Ibrahim 14:7"},
  {ar:"تَوَكُّل",trans:"Tawakkul",mean:"Trust in Allah",cat:"Faith",exAr:"وَعَلَى اللَّهِ فَتَوَكَّلُوا",exEn:"And upon Allah rely. — Surah Al-Ma'idah 5:23"},
  {ar:"إِخْلَاص",trans:"Ikhlas",mean:"Sincerity",cat:"Faith",exAr:"إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",exEn:"Actions are judged by intentions. — Bukhari & Muslim"},
  {ar:"رَحْمَة",trans:"Rahmah",mean:"Mercy",cat:"Divine attribute",exAr:"وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ",exEn:"My mercy encompasses all things. — Surah Al-A'raf 7:156"},
  {ar:"تَقْوَى",trans:"Taqwa",mean:"God-consciousness",cat:"Faith",exAr:"إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ",exEn:"The most noble of you in the sight of Allah is the most righteous. — Surah Al-Hujurat 49:13"},
  {ar:"نِيَّة",trans:"Niyyah",mean:"Intention",cat:"Practice",exAr:"إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",exEn:"Actions are judged by intentions. — Bukhari"},
  {ar:"دُعَاء",trans:"Du'a",mean:"Supplication",cat:"Worship",exAr:"ادْعُونِي أَسْتَجِبْ لَكُمْ",exEn:"Call upon Me; I will respond to you. — Surah Ghafir 40:60"},
  {ar:"ذِكْر",trans:"Dhikr",mean:"Remembrance of Allah",cat:"Worship",exAr:"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",exEn:"Verily, in the remembrance of Allah do hearts find rest. — Surah Ar-Ra'd 13:28"},
  {ar:"عِلْم",trans:"'Ilm",mean:"Knowledge",cat:"Virtue",exAr:"اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",exEn:"Read in the name of your Lord who created. — Surah Al-Alaq 96:1"},
]

const sunnahActs = [
  {name:"Miswak before salah",sahabi:"Practiced by Abdullah ibn Masud RA",reward:"Multiplies the reward of salah 70 times"},
  {name:"Drink water in 3 sips",sahabi:"Narrated by Anas ibn Malik RA",reward:"Following the prophetic way in eating and drinking"},
  {name:"Sleep on right side",sahabi:"Practiced by Al-Bara ibn Azib RA",reward:"Dying in a state of fitrah if sleep takes you"},
]

const angerSteps = [
  {n:"1",title:"Seek refuge in Allah",ar:"أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",sub:"Say it aloud — repeat until you feel it"},
  {n:"2",title:"Change your position",ar:"",sub:"If standing, sit. If sitting, lie down."},
  {n:"3",title:"Make wudu",ar:"",sub:"Anger is from fire — water extinguishes fire."},
  {n:"4",title:"Stay silent",ar:"",sub:"\"When one of you is angry, let him be silent.\" — Bukhari"},
]

const ayahs = [
  {text:'"If you are grateful, I will surely increase you in favour..."',ref:"Surah Ibrahim · 14:7"},
  {text:'"And He gave you of all that you asked of Him. If you count the blessings of Allah, you could never enumerate them..."',ref:"Surah Ibrahim · 14:34"},
  {text:'"So remember Me; I will remember you. And be grateful to Me and do not deny Me."',ref:"Surah Al-Baqarah · 2:152"},
]

const dailyChallenges = [
  {text:"Say Bismillah before every action today — eating, drinking, leaving the house.",reward:"Barakah in every action"},
  {text:"Smile at every Muslim you see or speak to today.",reward:"Smiling is sadaqah"},
  {text:"Read Ayatul Kursi after every salah.",reward:"Nothing stands between you and Jannah except death"},
  {text:"Say SubhanAllah 33 times, Alhamdulillah 33 times, Allahu Akbar 34 times after Asr.",reward:"Sins forgiven even if like the foam of the sea"},
  {text:"Make dua for 3 Muslims by name today.",reward:"The angels say Ameen and say the same for you"},
  {text:"Recite Surah Al-Kahf today.",reward:"Light from this Friday to the next"},
  {text:"Give something in charity today — even a smile counts.",reward:"Sadaqah extinguishes sins like water extinguishes fire"},
]

const badgesData = [
  {id:'first_login',icon:'🌱',name:'First Step',desc:'Signed in for the first time',req:1},
  {id:'hadith_5',icon:'📖',name:'Seeker',desc:'Memorised 5 hadith',req:5},
  {id:'hadith_10',icon:'📚',name:'Student',desc:'Memorised 10 hadith',req:10},
  {id:'hadith_40',icon:'🏆',name:'Hafidh',desc:'Memorised all 40 hadith',req:40},
  {id:'shukr_7',icon:'✨',name:'Grateful',desc:'7 days of shukr',req:7},
  {id:'shukr_30',icon:'💎',name:'Thankful Heart',desc:'30 days of shukr',req:30},
  {id:'sunnah_streak',icon:'☀️',name:'Sunnah Keeper',desc:'All 3 sunnahs in a day',req:3},
  {id:'quiz_perfect',icon:'🧠',name:'Scholar',desc:'Perfect quiz score',req:5},
]

// ─── STATE ───────────────────────────────────────────────────────────────────

let currentUser = null
let learned = new Set()
let sunnahDone = [false, false, false]
let shukrLog = []
let reviewQueue = [0, 1, 2, 3, 4]
let reviewIdx = 0
let flipped = false
let wordIdx = 0
let quizIdx = 0
let quizScore = 0
let quizQuestions = []
let quizAnswered = false
let earnedBadges = new Set()

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
  try { await signIn(email, pw) } catch (e) { showErr('login-err', e.message) }
}
async function doSignup() {
  const name = document.getElementById('signup-name').value.trim()
  const email = document.getElementById('signup-email').value.trim()
  const pw = document.getElementById('signup-pw').value
  if (!name || !email || !pw) return showErr('signup-err', 'Please fill in all fields.')
  if (pw.length < 8) return showErr('signup-err', 'Password must be at least 8 characters.')
  try { await signUp(name, email, pw); showToast('Account created! Check your email to confirm.') }
  catch (e) { showErr('signup-err', e.message) }
}
async function doGoogle() {
  try { await signInWithGoogle() } catch (e) { showErr('login-err', e.message) }
}
async function doLogout() { await signOut() }

// ─── APP INIT ────────────────────────────────────────────────────────────────

async function initApp(user) {
  currentUser = user
  const [learnedArr, sunnahArr, shukrArr] = await Promise.all([
    loadHadithProgress(user.id),
    loadTodaySunnah(user.id),
    loadShukrLog(user.id),
  ])
  learned = new Set(learnedArr)
  sunnahDone = sunnahArr
  shukrLog = shukrArr

  const name = user.user_metadata?.full_name || user.email.split('@')[0]
  document.getElementById('sidebar-name').textContent = name
  document.getElementById('sidebar-email').textContent = user.email
  document.getElementById('home-greeting').textContent = `Assalamu Alaykum, ${name.split(' ')[0]}`
  document.getElementById('home-date').textContent = new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})

  // Daily challenge
  const dayIdx = new Date().getDay()
  const ch = dailyChallenges[dayIdx]
  document.getElementById('challenge-text').textContent = ch.text
  document.getElementById('challenge-reward').textContent = '✦ Reward: ' + ch.reward

  renderAll()
  checkBadges()
  showToast(`Welcome back, ${name.split(' ')[0]} 🌿`)
}

// ─── NAVIGATION ──────────────────────────────────────────────────────────────

function goTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.s-item').forEach(i => i.classList.remove('active'))
  document.getElementById('page-' + page).classList.add('active')
  const map = {home:0,hadith:1,arabic:2,sunnah:3,anger:4,shukr:5,badges:6}
  document.querySelectorAll('.s-item')[map[page]]?.classList.add('active')
}

// ─── DARK MODE ───────────────────────────────────────────────────────────────

function toggleDark() {
  const html = document.documentElement
  const isDark = html.getAttribute('data-theme') === 'dark'
  html.setAttribute('data-theme', isDark ? 'light' : 'dark')
  document.getElementById('dark-toggle').textContent = isDark ? '🌙 Dark mode' : '☀️ Light mode'
}

// ─── RENDER ALL ──────────────────────────────────────────────────────────────

function renderAll() {
  renderHadith()
  renderSunnah()
  renderAnger()
  renderShukrLog()
  renderWords()
  renderBadges()
  updateStats()
  loadFlipCard(reviewIdx)
}

// ─── HADITH ──────────────────────────────────────────────────────────────────

function renderHadith() {
  document.getElementById('hadith-list').innerHTML = hadithData.map((h, i) => `
    <div class="h-row ${learned.has(i) ? 'learned' : ''}">
      <div class="h-num">${i + 1}</div>
      <div style="flex:1;">
        <div class="h-ar">${h.ar}</div>
        <div style="font-size:11px;color:var(--gm);">${h.src.split('·')[0].trim()}</div>
      </div>
      <div style="font-size:11px;color:var(--gm);">${learned.has(i) ? '✓' : ''}</div>
    </div>`).join('')
}

function switchHadithMode(mode) {
  document.querySelectorAll('.mode-tab').forEach((t,i) => {
    const modes = ['list','review','quiz']
    t.classList.toggle('active', modes[i] === mode)
  })
  document.getElementById('hmode-list').style.display = mode === 'list' ? '' : 'none'
  document.getElementById('hmode-review').style.display = mode === 'review' ? '' : 'none'
  document.getElementById('hmode-quiz').style.display = mode === 'quiz' ? '' : 'none'
  if (mode === 'quiz') startQuiz()
  if (mode === 'review') { reviewIdx = 0; loadFlipCard(0) }
}

function loadFlipCard(idx) {
  if (idx >= hadithData.length) idx = 0
  const h = hadithData[idx]
  document.getElementById('rev-ar').textContent = h.ar
  document.getElementById('rev-num').textContent = `Hadith ${idx + 1} of ${hadithData.length}`
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
  if (knew) learned.add(reviewIdx)
  reviewIdx = (reviewIdx + 1) % hadithData.length
  loadFlipCard(reviewIdx)
  updateStats()
  checkBadges()
  await saveHadithProgress(currentUser.id, [...learned])
}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────

function startQuiz() {
  quizIdx = 0; quizScore = 0; quizAnswered = false
  const shuffled = [...hadithData].sort(() => Math.random() - 0.5).slice(0, 5)
  quizQuestions = shuffled.map(h => {
    const wrong = hadithData.filter(x => x.en !== h.en).sort(() => Math.random() - 0.5).slice(0, 3)
    const options = [...wrong, h].sort(() => Math.random() - 0.5)
    return { question: h.ar, answer: h.en, options: options.map(o => o.en) }
  })
  document.getElementById('quiz-active').style.display = ''
  document.getElementById('quiz-done').style.display = 'none'
  loadQuizQuestion()
}

function loadQuizQuestion() {
  if (quizIdx >= quizQuestions.length) return showQuizResult()
  const q = quizQuestions[quizIdx]
  document.getElementById('quiz-progress').textContent = `Question ${quizIdx + 1} of ${quizQuestions.length}`
  document.getElementById('quiz-score-live').textContent = `Score: ${quizScore}`
  document.getElementById('quiz-q').textContent = q.question
  document.getElementById('quiz-opts').innerHTML = q.options.map(o =>
    `<div class="quiz-option" onclick="answerQuiz(this, '${o.replace(/'/g,"\\'")}', '${q.answer.replace(/'/g,"\\'")}')"> ${o}</div>`
  ).join('')
  quizAnswered = false
}

function answerQuiz(el, chosen, correct) {
  if (quizAnswered) return
  quizAnswered = true
  const isCorrect = chosen === correct
  el.classList.add(isCorrect ? 'correct' : 'wrong')
  if (!isCorrect) {
    document.querySelectorAll('.quiz-option').forEach(o => {
      if (o.textContent.trim() === correct) o.classList.add('correct')
    })
  }
  if (isCorrect) quizScore++
  setTimeout(() => { quizIdx++; loadQuizQuestion() }, 1200)
}

function showQuizResult() {
  document.getElementById('quiz-active').style.display = 'none'
  document.getElementById('quiz-done').style.display = ''
  const pct = Math.round(quizScore / quizQuestions.length * 100)
  document.getElementById('final-score').textContent = `${quizScore} / ${quizQuestions.length}`
  document.getElementById('quiz-score-display').textContent = `${quizScore}/${quizQuestions.length}`
  const msgs = ['Keep going — review more hadith!', 'Good effort — try again!', 'Well done!', 'Excellent! MashaAllah!', 'Perfect! SubhanAllah!']
  document.getElementById('final-msg').textContent = msgs[quizScore] || msgs[4]
  if (quizScore === quizQuestions.length) { earnedBadges.add('quiz_perfect'); renderBadges() }
}

// ─── ARABIC WORDS ─────────────────────────────────────────────────────────────

function renderWords() {
  loadWord(wordIdx)
  document.getElementById('word-list').innerHTML = arabicWords.map((w, i) => `
    <div class="h-row" onclick="loadWord(${i});goTo('arabic');" style="cursor:pointer;">
      <div style="font-family:'Playfair Display',serif;font-size:18px;color:var(--g);direction:rtl;width:60px;text-align:right;">${w.ar}</div>
      <div style="flex:1;padding-left:12px;">
        <div style="font-size:13px;color:var(--text);font-weight:500;">${w.mean}</div>
        <div style="font-size:11px;color:var(--gm);">${w.trans} · ${w.cat}</div>
      </div>
    </div>`).join('')
}

function loadWord(idx) {
  wordIdx = idx
  const w = arabicWords[idx]
  document.getElementById('w-ar').textContent = w.ar
  document.getElementById('w-trans').textContent = w.trans
  document.getElementById('w-mean').textContent = w.mean
  document.getElementById('w-cat').textContent = w.cat
  document.getElementById('w-ex-ar').textContent = w.exAr
  document.getElementById('w-ex-en').textContent = w.exEn
}

function nextWord() { loadWord((wordIdx + 1) % arabicWords.length) }
function prevWord() { loadWord((wordIdx - 1 + arabicWords.length) % arabicWords.length) }

// ─── SUNNAH ──────────────────────────────────────────────────────────────────

function renderSunnah() {
  document.getElementById('sunnah-list').innerHTML = sunnahActs.map((s, i) => `
    <div class="sunnah-item ${sunnahDone[i] ? 'done' : ''}" onclick="toggleSunnah(${i})">
      <div class="chk"><div class="chk-mark"></div></div>
      <div>
        <div class="sunnah-name">${s.name}</div>
        <div class="sunnah-sahabi">${s.sahabi}</div>
        <div class="sunnah-reward">${s.reward}</div>
      </div>
    </div>`).join('')
}

async function toggleSunnah(i) {
  sunnahDone[i] = !sunnahDone[i]
  renderSunnah()
  updateStats()
  checkBadges()
  await saveSunnahLog(currentUser.id, sunnahDone)
  showToast(sunnahDone[i] ? 'Sunnah recorded ✓' : 'Unmarked')
}

// ─── ANGER ───────────────────────────────────────────────────────────────────

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
    angerSteps.forEach((_, i) => document.getElementById('astep-' + i)?.classList.toggle('active-step', i === step))
    if (step < angerSteps.length - 1) { step++; setTimeout(go, 2000) }
  }
  go()
}

// ─── SHUKR ───────────────────────────────────────────────────────────────────

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
  checkBadges()
  const a = ayahs[Math.floor(Math.random() * ayahs.length)]
  document.getElementById('ayah-text').textContent = a.text
  document.getElementById('ayah-ref').textContent = a.ref
  showToast('Shukr saved — may Allah increase your blessings 🌿')
}

// ─── DAILY CHALLENGE ─────────────────────────────────────────────────────────

function completeChallenge() {
  showToast('JazakAllahu khairan — challenge complete! 🌿')
  document.querySelector('.challenge-done').textContent = 'Done ✓'
  document.querySelector('.challenge-done').style.opacity = '0.5'
  document.querySelector('.challenge-done').disabled = true
}

// ─── BADGES ──────────────────────────────────────────────────────────────────

function checkBadges() {
  if (learned.size >= 5) earnedBadges.add('hadith_5')
  if (learned.size >= 10) earnedBadges.add('hadith_10')
  if (learned.size >= 40) earnedBadges.add('hadith_40')
  if (shukrLog.length >= 7) earnedBadges.add('shukr_7')
  if (shukrLog.length >= 30) earnedBadges.add('shukr_30')
  if (sunnahDone.every(Boolean)) earnedBadges.add('sunnah_streak')
  earnedBadges.add('first_login')
  renderBadges()
}

function renderBadges() {
  document.getElementById('badges-grid').innerHTML = badgesData.map(b => `
    <div class="badge-item ${earnedBadges.has(b.id) ? 'earned' : ''}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
    </div>`).join('')
}

// ─── STATS ───────────────────────────────────────────────────────────────────

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

// ─── EXPOSE TO HTML ──────────────────────────────────────────────────────────

window.showLogin = showLogin
window.showSignup = showSignup
window.doLogin = doLogin
window.doSignup = doSignup
window.doGoogle = doGoogle
window.doLogout = doLogout
window.goTo = goTo
window.toggleDark = toggleDark
window.flipCard = flipCard
window.markHadith = markHadith
window.switchHadithMode = switchHadithMode
window.startQuiz = startQuiz
window.answerQuiz = answerQuiz
window.loadWord = loadWord
window.nextWord = nextWord
window.prevWord = prevWord
window.toggleSunnah = toggleSunnah
window.activateGuide = activateGuide
window.saveShukr = saveShukr
window.completeChallenge = completeChallenge

// ─── BOOT ────────────────────────────────────────────────────────────────────

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