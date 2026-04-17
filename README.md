# 🌿 Areej — عَرَج

> *"And do good — indeed, Allah loves the doers of good."* — Surah Al-Baqarah 2:195

---

## 💚 Why I Built This

This app was built as an act of love and intention.

I made Areej for someone I dearly love — as a gift, and as a means of ongoing reward for her. Every user who opens this app, learns a hadith, builds a sunnah habit, or writes their shukr — she receives sadaqah jariyah for being the inspiration behind it.

Every good deed earned from this website, every young Muslim who learns something, every act of worship inspired here — is all for her.

May Allah accept it from her, and may it be a source of light for everyone who uses it.

**All praise is due to Allah. This is from Him and returns to Him.**

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 📗 **Quran Reader** | Full Quran with Arabic + English translation, checkpoint saving |
| 📜 **Hadiths** | Browse Bukhari, Muslim, Abu Dawud, Tirmidhi + 5 more collections |
| 📖 **40 Nawawi Hadith** | Memorise with flip cards and quiz mode |
| 🔤 **Arabic Words** | 30 Islamic vocabulary words with Quran & hadith examples |
| ☀️ **Sunnah Habits** | 12 daily sunnah acts with sahabi context and rewards |
| 🤲 **Anger Guide** | Prophetic steps — a'udhu, sit, wudu, silence |
| ✨ **Shukr Log** | Daily gratitude journal tied to Quran verses |
| 🎯 **My Goals** | Set personal goals with 48 curated Islamic suggestions |
| 🌟 **Daily Challenge** | A different deed every day with its reward mentioned |
| 🏅 **Badges** | Earn badges as you grow in knowledge and practice |
| 🌙 **Dark Mode** | Easy on the eyes for night reading |
| ♡ **Areej** | A private dedication page |

---

## 🛠 Stack

```
Frontend   →  Vite + Vanilla JS
Auth       →  Supabase (email + Google OAuth)
Database   →  Supabase (PostgreSQL)
Quran API  →  api.quran.com
Hadith API →  sunnah.com (free API key required)
Hosting    →  Vercel
```

---

## 🚀 Local Setup

```bash
# 1. Clone
git clone https://github.com/PrimelPJ/areej.git
cd areej

# 2. Install
npm install

# 3. Environment
cp .env.example .env
# Fill in:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
# VITE_SUNNAH_API_KEY  (free key from sunnah.com/api)

# 4. Run
npm run dev
```

---

## 🗄 Database

Run `src/schema.sql` in your Supabase SQL editor to create all tables.

Tables: `profiles` · `hadith_progress` · `sunnah_log` · `shukr_log` · `goals` · `quran_progress` · `hadith_bookmarks`

---

## 🌐 Deploy

Push to `main` — Vercel auto-deploys in ~30 seconds.

Add these to Vercel → Settings → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUNNAH_API_KEY`

---

## 🤲 Dedication

*To her — may Allah grant you the highest level of Jannah, fill your life with barakah, and accept every good deed done in your name. This is the least of what you deserve.*

*And to every young Muslim who opens this app — may it bring you closer to Allah, one habit at a time.*

---

<p align="center">
  Made with sincerity · بسم الله الرحمن الرحيم
</p>
