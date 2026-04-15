# 🌿 Areej — عَرَج

> *"And do good — indeed, Allah loves the doers of good."* — Surah Al-Baqarah 2:195

---

## 💚 Why I Built This

This app was built as an act of love and intention.

I made Areej for someone I love — as a gift, and as a means of ongoing reward for her. Every user who opens this app, learns a hadith, builds a sunnah habit, or writes their shukr — she receives sadaqah jariyah for being the inspiration behind it.

May Allah accept it from her, and may it be a source of light for everyone who uses it.

**All praise is due to Allah. This is from Him and returns to Him.**

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 📖 **40 Hadith** | Memorise Nawawi's 40 with flip cards and quiz mode |
| 🔤 **Arabic Words** | Learn Islamic vocabulary with Quran & hadith examples |
| ☀️ **Sunnah Habits** | Daily sunnah tracker with sahabi context and rewards |
| 🤲 **Anger Guide** | Prophetic steps to manage anger — a'udhu, sit, wudu, silence |
| ✨ **Shukr Log** | Daily gratitude journal tied to Quran verses |
| 🌟 **Daily Challenge** | A new deed every day with its reward mentioned |
| 🏅 **Badges** | Earn badges as you grow in knowledge and practice |
| 🌙 **Dark Mode** | Easy on the eyes for night reading |

---

## 🛠 Stack

```
Frontend   →  Vite + Vanilla JS
Auth       →  Supabase (email + Google OAuth)
Database   →  Supabase (PostgreSQL)
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
# Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 4. Run
npm run dev
```

---

## 🗄 Database

Run `src/schema.sql` in your Supabase SQL editor to create all tables.

Tables: `profiles` · `hadith_progress` · `sunnah_log` · `shukr_log`

---

## 🌐 Deploy

Push to `main` — Vercel auto-deploys in ~30 seconds.

---

## 🤲 Dedication

*To her — may Allah grant you the highest level of Jannah, fill your life with barakah, and accept every good deed done in your name. This is the least of what you deserve.*

*And to every young Muslim who opens this app — may it bring you closer to Allah, one habit at a time.*

---

<p align="center">
  Made with sincerity · بسم الله الرحمن الرحيم
</p>
