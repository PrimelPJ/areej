import {
  supabase, signUp, signIn, signInWithGoogle, signOut, onAuthChange,
  saveHadithProgress, loadHadithProgress, saveSunnahLog, loadTodaySunnah,
  saveShukrEntry, loadShukrLog, saveGoal, loadGoals, toggleGoalDone, deleteGoal,
  saveQuranProgress, loadQuranProgress, saveHadithBookmark, loadHadithBookmarks, deleteHadithBookmark,
  loadSunnahHistory
} from './supabase.js'

// ─── API CONFIG ───────────────────────────────────────────────────────────────
// Quran: free, no key needed
const QURAN_API = 'https://api.quran.com/api/v4'
// Sunnah.com: free API key from sunnah.com/api — add VITE_SUNNAH_API_KEY to .env
const SUNNAH_KEY = import.meta.env.VITE_SUNNAH_API_KEY || ''
const SUNNAH_API = 'https://api.sunnah.com/v1'

// ─── HADITH COLLECTIONS ──────────────────────────────────────────────────────
// These are the official sunnah.com collection identifiers
const hadithCollections = [
  { id: 'bukhari',        name: 'Sahih Al-Bukhari',      icon: '📗', desc: 'Imam Bukhari · ~7,563 hadith' },
  { id: 'muslim',         name: 'Sahih Muslim',           icon: '📘', desc: 'Imam Muslim · ~7,453 hadith' },
  { id: 'abudawud',       name: 'Sunan Abu Dawud',        icon: '📙', desc: 'Imam Abu Dawud · ~5,274 hadith' },
  { id: 'tirmidhi',       name: 'Jami At-Tirmidhi',       icon: '📒', desc: 'Imam Tirmidhi · ~3,956 hadith' },
  { id: 'nasai',          name: "Sunan An-Nasa'i",         icon: '📓', desc: "Imam Nasa'i · ~5,761 hadith" },
  { id: 'ibnmajah',       name: 'Sunan Ibn Majah',         icon: '📔', desc: 'Imam Ibn Majah · ~4,341 hadith' },
  { id: 'malik',          name: 'Muwatta Malik',           icon: '📕', desc: 'Imam Malik · ~1,594 hadith' },
  { id: 'riyadussalihin', name: 'Riyad As-Salihin',        icon: '🌿', desc: 'Imam Nawawi · ~1,896 hadith' },
  { id: 'adab',           name: 'Al-Adab Al-Mufrad',       icon: '✨', desc: 'Imam Bukhari · ~1,322 hadith' },
]

// Helper: build sunnah.com API headers with the key
function sunnahHeaders() {
  return { 'X-API-Key': SUNNAH_KEY, 'Accept': 'application/json' }
}

// ─── NAWAWI 40 DATA ──────────────────────────────────────────────────────────
const hadithData = [
  { ar: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", en: "Actions are judged by intentions, and every person will get what they intended.", src: "Umar ibn Al-Khattab · Bukhari & Muslim" },
  { ar: "الإِسْلَامُ أَنْ تَشْهَدَ أَنْ لَا إِلَهَ إِلَّا اللَّهُ", en: "Islam is to testify there is no god but Allah and Muhammad is His messenger, establish prayer, give zakat, fast Ramadan, and perform Hajj.", src: "Umar ibn Al-Khattab · Muslim" },
  { ar: "بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ", en: "Islam is built on five pillars: the testimony, prayer, zakat, fasting Ramadan, and Hajj.", src: "Ibn Umar · Bukhari & Muslim" },
  { ar: "إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ", en: "Each of you is formed in your mother's womb for forty days as a drop, then a clot, then a lump — then an angel breathes the soul into it.", src: "Abdullah ibn Masud · Bukhari & Muslim" },
  { ar: "مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ", en: "Whoever introduces into this matter of ours something that is not from it, it is rejected.", src: "Aisha · Bukhari & Muslim" },
  { ar: "الْحَلَالُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ", en: "The halal is clear and the haram is clear. Between them are doubtful matters. Whoever guards against the doubtful matters has protected his religion and honour.", src: "Nu'man ibn Bashir · Bukhari & Muslim" },
  { ar: "الدِّينُ النَّصِيحَةُ", en: "The religion is sincere advice — to Allah, His Book, His Messenger, the leaders, and their common people.", src: "Tamim Al-Dari · Muslim" },
  { ar: "مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ", en: "Whatever I have forbidden you, avoid it. Whatever I have commanded you, do as much of it as you are able.", src: "Abu Hurairah · Bukhari & Muslim" },
  { ar: "إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا", en: "Allah is pure and accepts only what is pure. He commanded believers as He commanded the messengers: eat from good things and do righteous deeds.", src: "Abu Hurairah · Muslim" },
  { ar: "دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ", en: "Leave what makes you doubt for what does not make you doubt. Truthfulness brings tranquility and lying brings doubt.", src: "Al-Hasan ibn Ali · Tirmidhi" },
  { ar: "مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ", en: "Part of the perfection of someone's Islam is his leaving alone that which does not concern him.", src: "Abu Hurairah · Tirmidhi" },
  { ar: "لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ", en: "None of you truly believes until he loves for his brother what he loves for himself.", src: "Anas ibn Malik · Bukhari & Muslim" },
  { ar: "لَا تَغْضَبْ", en: "Do not get angry. The man asked repeatedly and the Prophet kept saying: do not get angry.", src: "Abu Hurairah · Bukhari" },
  { ar: "اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ", en: "Fear Allah wherever you are, follow up a bad deed with a good deed to wipe it out, and treat people with good character.", src: "Abu Dharr & Muadh · Tirmidhi" },
  { ar: "احْفَظِ اللَّهَ يَحْفَظْكَ", en: "Guard Allah and He will guard you. Guard Allah and you will find Him before you. Know Allah in ease and He will know you in difficulty.", src: "Ibn Abbas · Tirmidhi" },
  { ar: "اسْتَعِنْ بِاللَّهِ وَلَا تَعْجِزْ", en: "Seek help from Allah and do not be incapable. If something afflicts you, say: Allah decreed it and He does what He wills.", src: "Abu Hurairah · Muslim" },
  { ar: "الطَّهُورُ شَطْرُ الْإِيمَانِ", en: "Purification is half of faith. Alhamdulillah fills the scale. SubhanAllah and Alhamdulillah fill what is between the heavens and the earth.", src: "Abu Malik Al-Ash'ari · Muslim" },
  { ar: "كُلُّ مَعْرُوفٍ صَدَقَةٌ", en: "Every act of goodness is sadaqah.", src: "Jabir · Muslim" },
  { ar: "لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ", en: "The strong man is not the one who overpowers others. The strong man is the one who controls himself when angry.", src: "Abu Hurairah · Bukhari & Muslim" },
  { ar: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا", en: "Whoever treads a path seeking knowledge, Allah will make easy for him a path to Jannah.", src: "Abu Hurairah · Muslim" },
  { ar: "إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ", en: "Allah loves that when one of you does a deed, he does it with excellence.", src: "Aisha · Bayhaqi" },
  { ar: "خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ", en: "The best of you are those who learn the Quran and teach it.", src: "Uthman ibn Affan · Bukhari" },
  { ar: "لَا ضَرَرَ وَلَا ضِرَارَ", en: "There should be no harm and no reciprocating harm.", src: "Ibn Abbas · Ibn Majah & Malik" },
  { ar: "مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ", en: "Whoever sees an evil, let him change it with his hand. If he cannot, then with his tongue. If he cannot, then with his heart — and that is the weakest of faith.", src: "Abu Said Al-Khudri · Muslim" },
  { ar: "مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ", en: "Whoever guides someone to goodness will have a reward equal to the one who did it.", src: "Abu Masud · Muslim" },
  { ar: "إِنَّمَا الصَّبْرُ عِنْدَ الصَّدْمَةِ الْأُولَى", en: "True patience is at the first strike of calamity.", src: "Anas ibn Malik · Bukhari & Muslim" },
  { ar: "إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ", en: "Allah does not look at your forms or your wealth, but He looks at your hearts and your deeds.", src: "Abu Hurairah · Muslim" },
  { ar: "الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ", en: "A Muslim is the one from whose tongue and hand the Muslims are safe.", src: "Abdullah ibn Amr · Bukhari & Muslim" },
  { ar: "لَا يَشْكُرُ اللَّهَ مَنْ لَا يَشْكُرُ النَّاسَ", en: "He who does not thank people has not thanked Allah.", src: "Abu Hurairah · Abu Dawud & Tirmidhi" },
  { ar: "خَيْرُ الناسِ أَنفَعُهُمْ لِلنَّاسِ", en: "The best of people are those most beneficial to people.", src: "Jabir · Tabarani" },
  { ar: "كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ", en: "Be in this world as if you were a stranger or a traveller passing through.", src: "Ibn Umar · Bukhari" },
  { ar: "الْبِرُّ حُسْنُ الْخُلُقِ", en: "Righteousness is good character. Sin is what wavers in your chest and you dislike people knowing about it.", src: "An-Nawwas ibn Sam'an · Muslim" },
  { ar: "إِنَّكَ لَنْ تَدَعَ شَيْئًا لِلَّهِ إِلَّا بَدَّلَكَ اللَّهُ بِهِ مَا هُوَ خَيْرٌ", en: "You will never leave something for the sake of Allah except that Allah will replace it with something better.", src: "Ahmad" },
  { ar: "مَا مِنْ أَيَّامٍ الْعَمَلُ الصَّالِحُ فِيهَا أَحَبُّ إِلَى اللَّهِ", en: "There are no days in which righteous deeds are more beloved to Allah than the first ten days of Dhul Hijjah.", src: "Ibn Abbas · Bukhari" },
  { ar: "اجْعَلِ الدُّنْيَا فِي يَدِكَ لَا فِي قَلْبِكَ", en: "Make the dunya in your hand, not in your heart.", src: "Ali ibn Abi Talib" },
  { ar: "الزُّهْدُ فِي الدُّنْيَا يُرِيحُ الْقَلْبَ وَالْبَدَنَ", en: "Detachment from the dunya brings rest to the heart and body.", src: "Ibn Masud · Bayhaqi" },
  { ar: "مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ", en: "Whoever believes in Allah and the Last Day, let him say something good or keep silent.", src: "Abu Hurairah · Bukhari & Muslim" },
  { ar: "مَنْ صَامَ رَمَضَانَ إِيمَانًا وَاحْتِسَابًا", en: "Whoever fasts Ramadan with faith and seeking reward, his previous sins will be forgiven.", src: "Abu Hurairah · Bukhari & Muslim" },
  { ar: "إِذَا مَاتَ الْإِنْسَانُ انْقَطَعَ عَنْهُ عَمَلُهُ إِلَّا مِنْ ثَلَاثَةٍ", en: "When a person dies, all deeds are cut off except three: ongoing charity, beneficial knowledge, or a righteous child who prays for him.", src: "Abu Hurairah · Muslim" },
  { ar: "بُعِثْتُ لِأُتَمِّمَ مَكَارِمَ الْأَخْلَاقِ", en: "I was sent to perfect good character.", src: "Abu Hurairah · Bukhari" },
]

// ─── ARABIC WORDS ────────────────────────────────────────────────────────────
const arabicWords = [
  { ar:"صَبْر", trans:"Sabr", mean:"Patience", cat:"Character", exAr:"وَاللَّهُ يُحِبُّ الصَّابِرِينَ", exEn:"And Allah loves the patient. — Surah Ali Imran 3:146" },
  { ar:"شُكْر", trans:"Shukr", mean:"Gratitude", cat:"Character", exAr:"لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", exEn:"If you are grateful, I will surely increase you. — Surah Ibrahim 14:7" },
  { ar:"تَوَكُّل", trans:"Tawakkul", mean:"Trust in Allah", cat:"Faith", exAr:"وَعَلَى اللَّهِ فَتَوَكَّلُوا", exEn:"And upon Allah rely. — Surah Al-Ma'idah 5:23" },
  { ar:"إِخْلَاص", trans:"Ikhlas", mean:"Sincerity", cat:"Character", exAr:"إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", exEn:"Actions are judged by intentions. — Bukhari" },
  { ar:"رَحْمَة", trans:"Rahmah", mean:"Mercy", cat:"Divine Attribute", exAr:"وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ", exEn:"My mercy encompasses all things. — Surah Al-A'raf 7:156" },
  { ar:"تَقْوَى", trans:"Taqwa", mean:"God-consciousness", cat:"Faith", exAr:"إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ", exEn:"The most noble of you is the most righteous. — Surah Al-Hujurat 49:13" },
  { ar:"نِيَّة", trans:"Niyyah", mean:"Intention", cat:"Practice", exAr:"إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ", exEn:"Actions are judged by intentions. — Bukhari" },
  { ar:"دُعَاء", trans:"Du'a", mean:"Supplication", cat:"Worship", exAr:"ادْعُونِي أَسْتَجِبْ لَكُمْ", exEn:"Call upon Me; I will respond. — Surah Ghafir 40:60" },
  { ar:"ذِكْر", trans:"Dhikr", mean:"Remembrance of Allah", cat:"Worship", exAr:"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", exEn:"In the remembrance of Allah do hearts find rest. — Surah Ar-Ra'd 13:28" },
  { ar:"عِلْم", trans:"Ilm", mean:"Knowledge", cat:"Virtue", exAr:"اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ", exEn:"Read in the name of your Lord who created. — Surah Al-Alaq 96:1" },
  { ar:"تَوْبَة", trans:"Tawbah", mean:"Repentance", cat:"Faith", exAr:"إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ", exEn:"Indeed Allah loves those who repent. — Surah Al-Baqarah 2:222" },
  { ar:"صِدْق", trans:"Sidq", mean:"Truthfulness", cat:"Character", exAr:"كُونُوا مَعَ الصَّادِقِينَ", exEn:"Be with the truthful. — Surah At-Tawbah 9:119" },
  { ar:"عَدْل", trans:"Adl", mean:"Justice", cat:"Virtue", exAr:"إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ", exEn:"Allah commands justice and excellence. — Surah An-Nahl 16:90" },
  { ar:"إِحْسَان", trans:"Ihsan", mean:"Excellence", cat:"Virtue", exAr:"إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ", exEn:"Allah loves the doers of good. — Surah Al-Baqarah 2:195" },
  { ar:"حَيَاء", trans:"Haya", mean:"Modesty", cat:"Character", exAr:"الْحَيَاءُ مِنَ الْإِيمَانِ", exEn:"Modesty is a branch of faith. — Bukhari & Muslim" },
  { ar:"أَمَانَة", trans:"Amanah", mean:"Trustworthiness", cat:"Character", exAr:"إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ", exEn:"Allah commands you to fulfil your trusts. — Surah An-Nisa 4:58" },
  { ar:"رِضَا", trans:"Rida", mean:"Contentment / Divine pleasure", cat:"Faith", exAr:"رَضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ", exEn:"Allah is pleased with them and they with Him. — Surah Al-Ma'idah 5:119" },
  { ar:"يَقِين", trans:"Yaqeen", mean:"Certainty of faith", cat:"Faith", exAr:"وَبِالْآخِرَةِ هُمْ يُوقِنُونَ", exEn:"And of the Hereafter they are certain. — Surah Al-Baqarah 2:4" },
  { ar:"حِكْمَة", trans:"Hikmah", mean:"Wisdom", cat:"Virtue", exAr:"يُؤْتِي الْحِكْمَةَ مَن يَشَاءُ", exEn:"He grants wisdom to whom He wills. — Surah Al-Baqarah 2:269" },
  { ar:"صَدَقَة", trans:"Sadaqah", mean:"Voluntary charity", cat:"Practice", exAr:"كُلُّ مَعْرُوفٍ صَدَقَةٌ", exEn:"Every act of goodness is sadaqah. — Muslim" },
  { ar:"خُشُوع", trans:"Khushu", mean:"Humility in worship", cat:"Worship", exAr:"الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ", exEn:"Those who have khushu in their prayers. — Surah Al-Mu'minun 23:2" },
  { ar:"إِسْتِغْفَار", trans:"Istighfar", mean:"Seeking forgiveness", cat:"Practice", exAr:"وَاسْتَغْفِرِ اللَّهَ إِنَّ اللَّهَ كَانَ غَفُورًا", exEn:"Seek Allah's forgiveness — He is Ever-Forgiving. — Surah An-Nisa 4:106" },
  { ar:"بَرَكَة", trans:"Barakah", mean:"Divine blessing", cat:"Spirituality", exAr:"لَفَتَحْنَا عَلَيْهِم بَرَكَاتٍ مِّنَ السَّمَاءِ", exEn:"We would have opened blessings from the sky. — Surah Al-A'raf 7:96" },
  { ar:"تَفَكُّر", trans:"Tafakkur", mean:"Deep reflection", cat:"Spirituality", exAr:"إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ لَآيَاتٍ", exEn:"In creation of the heavens and earth are signs. — Surah Ali Imran 3:190" },
  { ar:"أَدَب", trans:"Adab", mean:"Good manners", cat:"Character", exAr:"وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ", exEn:"You are of the most exalted character. — Surah Al-Qalam 68:4" },
  { ar:"وَرَع", trans:"Wara", mean:"Scrupulous piety", cat:"Spirituality", exAr:"دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ", exEn:"Leave what makes you doubt. — Tirmidhi" },
  { ar:"مُحَاسَبَة", trans:"Muhasabah", mean:"Self-accountability", cat:"Spirituality", exAr:"وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ", exEn:"Let every soul consider what it sends ahead. — Surah Al-Hashr 59:18" },
  { ar:"قَنَاعَة", trans:"Qana'ah", mean:"Contentment", cat:"Character", exAr:"الْغِنَى غِنَى النَّفْسِ", exEn:"Richness is contentment of the soul. — Bukhari" },
  { ar:"جِهَاد", trans:"Jihad", mean:"Striving for Allah", cat:"Practice", exAr:"وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ", exEn:"Those who strive for Us — We will guide them. — Surah Al-Ankabut 29:69" },
  { ar:"زُهْد", trans:"Zuhd", mean:"Detachment from dunya", cat:"Spirituality", exAr:"اعْلَمُوا أَنَّمَا الْحَيَاةُ الدُّنْيَا لَعِبٌ", exEn:"Know that the life of this world is only play. — Surah Al-Hadid 57:20" },
]

const sunnahActs = [
  { name:"Miswak before salah", sahabi:"Practiced by Abdullah ibn Masud RA", reward:"Multiplies the reward of salah 70 times" },
  { name:"Drink water in 3 sips", sahabi:"Narrated by Anas ibn Malik RA", reward:"Following the way of the Prophet ﷺ" },
  { name:"Sleep on your right side", sahabi:"Practiced by Al-Bara ibn Azib RA", reward:"Dying in a state of fitrah if sleep takes you" },
  { name:"Say Bismillah before eating", sahabi:"Narrated by Umar ibn Abi Salamah RA", reward:"Barakah in your food and protection from shaytan" },
  { name:"Eat with your right hand", sahabi:"Narrated by Ibn Umar RA", reward:"Following the sunnah in every meal" },
  { name:"Enter home with right foot", sahabi:"Practiced by Aisha RA", reward:"Barakah entering the home" },
  { name:"Say salah on Prophet after adhan", sahabi:"Narrated by Abdullah ibn Amr RA", reward:"Ten blessings from Allah upon you" },
  { name:"Pray 2 sunnah before Fajr", sahabi:"Narrated by Aisha RA", reward:"Better than the dunya and everything in it" },
  { name:"Read Ayatul Kursi after salah", sahabi:"Narrated by Abu Umamah RA", reward:"Nothing stands between you and Jannah except death" },
  { name:"Say SubhanAllah 33x after salah", sahabi:"Narrated by Abu Hurairah RA", reward:"Sins forgiven even if like the foam of the sea" },
  { name:"Fast Mondays and Thursdays", sahabi:"Narrated by Abu Hurairah RA", reward:"Deeds presented to Allah on those days" },
  { name:"Give sadaqah even a little", sahabi:"Narrated by Adiy ibn Hatim RA", reward:"A shield from the hellfire, even with half a date" },
]

const angerSteps = [
  { n:"1", title:"Seek refuge in Allah", ar:"أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", sub:"Say it aloud — repeat until you feel it" },
  { n:"2", title:"Change your position", ar:"", sub:"If standing, sit. If sitting, lie down." },
  { n:"3", title:"Make wudu", ar:"", sub:"Anger is from fire — water extinguishes fire." },
  { n:"4", title:"Stay silent", ar:"", sub:'"When one of you is angry, let him be silent." — Bukhari' },
]

const ayahs = [
  { text:'"If you are grateful, I will surely increase you in favour..."', ref:"Surah Ibrahim · 14:7" },
  { text:'"And He gave you of all that you asked of Him..."', ref:"Surah Ibrahim · 14:34" },
  { text:'"So remember Me; I will remember you."', ref:"Surah Al-Baqarah · 2:152" },
  { text:'"Indeed, with hardship will be ease."', ref:"Surah Ash-Sharh · 94:6" },
]

const dailyChallenges = [
  { text:"Say Bismillah before every action today — eating, drinking, leaving the house.", reward:"Barakah in every action" },
  { text:"Smile at every Muslim you see or speak to today.", reward:"Smiling is sadaqah" },
  { text:"Read Ayatul Kursi after every obligatory salah today.", reward:"Nothing between you and Jannah except death" },
  { text:"Say SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34 after every salah.", reward:"Sins forgiven even if like the foam of the sea" },
  { text:"Make dua for 3 Muslims by name today.", reward:"The angels say Ameen and say the same for you" },
  { text:"Recite Surah Al-Kahf today.", reward:"Light from this Friday to the next" },
  { text:"Give something in charity today — even a smile counts.", reward:"Sadaqah extinguishes sins like water extinguishes fire" },
]

const goalSuggestions = [
  { cat:"🙏 Prayer", suggestions:["Pray all 5 prayers on time every day","Start praying Fajr consistently","Pray Tahajjud at least once a week","Learn the meaning of what I recite in salah","Pray all sunnah prayers alongside fard","Stop delaying Asr and Isha"] },
  { cat:"📖 Quran", suggestions:["Read one page of Quran every day","Memorise Surah Al-Mulk","Memorise Surah Al-Kahf","Read the Quran with translation","Complete one full khatm this year","Study the tafsir of Surah Al-Baqarah"] },
  { cat:"🌿 Habits", suggestions:["Wake up before Fajr every day","Read morning and evening adhkar daily","Fast every Monday and Thursday","Give sadaqah every week","Reduce time on social media","Sleep before midnight consistently"] },
  { cat:"💬 Character", suggestions:["Stop backbiting completely","Control my anger when provoked","Be more patient with my family","Lower my gaze consistently","Be more honest even when it's hard","Be kinder to my parents daily"] },
  { cat:"📚 Knowledge", suggestions:["Learn the 99 names of Allah","Study the seerah of the Prophet ﷺ","Memorise Nawawi's 40 Hadith","Learn basic Arabic vocabulary","Take an Islamic course online","Read one Islamic book per month"] },
  { cat:"❤️ Community", suggestions:["Visit the masjid at least once a week","Reconnect with family I've drifted from","Volunteer for a local Islamic cause","Check on my neighbours regularly","Make dua for the ummah every day"] },
]

const badgesData = [
  { id:'first_login', icon:'🌱', name:'First Step', desc:'Signed in for the first time' },
  { id:'hadith_5', icon:'📖', name:'Seeker', desc:'Memorised 5 Nawawi hadith' },
  { id:'hadith_10', icon:'📚', name:'Student', desc:'Memorised 10 Nawawi hadith' },
  { id:'hadith_40', icon:'🏆', name:'Hafidh', desc:'Memorised all 40 Nawawi hadith' },
  { id:'quran_started', icon:'📗', name:'Reader', desc:'Started reading the Quran' },
  { id:'shukr_7', icon:'✨', name:'Grateful', desc:'7 days of shukr' },
  { id:'shukr_30', icon:'💎', name:'Thankful Heart', desc:'30 days of shukr' },
  { id:'sunnah_streak', icon:'☀️', name:'Sunnah Keeper', desc:'All sunnahs done in a day' },
  { id:'quiz_perfect', icon:'🧠', name:'Scholar', desc:'Perfect quiz score' },
  { id:'goal_set', icon:'🎯', name:'Purposeful', desc:'Set your first goal' },
  { id:'goal_done', icon:'✅', name:'Committed', desc:'Completed your first goal' },
  { id:'hadith_bookmarked', icon:'📜', name:'Hadith Lover', desc:'Bookmarked a hadith' },
]

// ─── STATE ───────────────────────────────────────────────────────────────────
let currentUser = null
let expandedHadith = null
let sunnahHistory = []
let learned = new Set()
let sunnahDone = Array(12).fill(false)
let shukrLog = []
let goals = []
let quranProgress = null
let hadithBookmarks = []
let reviewIdx = 0
let flipped = false
let wordIdx = 0
let quizIdx = 0, quizScore = 0, quizQuestions = [], quizAnswered = false
let earnedBadges = new Set()
let activeSuggestionCat = 0
let allSurahs = []
let currentSurahNum = 1
let currentCollection = null
let currentHadiths = []
let filteredHadiths = []
let sunnahApiAvailable = false  // tracks whether sunnah.com key exists

// ─── AUTH ─────────────────────────────────────────────────────────────────────
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
  ['login-err','signup-err'].forEach(id => { document.getElementById(id).style.display = 'none' })
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
  const btn = document.querySelector('#login-card .auth-btn')
  btn.textContent = 'Signing in...'; btn.disabled = true
  try {
    await signIn(email, pw)
    // onAuthChange handles the transition to the app
  } catch(e) {
    showErr('login-err', e.message)
    btn.textContent = 'Sign in'; btn.disabled = false
  }
}

async function doSignup() {
  const name = document.getElementById('signup-name').value.trim()
  const email = document.getElementById('signup-email').value.trim()
  const pw = document.getElementById('signup-pw').value
  if (!name || !email || !pw) return showErr('signup-err', 'Please fill in all fields.')
  if (pw.length < 8) return showErr('signup-err', 'Password must be at least 8 characters.')
  const btn = document.querySelector('#signup-card .auth-btn')
  btn.textContent = 'Creating account...'; btn.disabled = true
  try {
    await signUp(name, email, pw)
    // If email confirmation is disabled in Supabase, onAuthChange fires immediately.
    // If confirmation is still enabled, show a helpful message.
    showErr('signup-err', 'Account created! If you do not enter the app automatically, check your email for a confirmation link.')
    document.getElementById('signup-err').style.background = '#e6f5ec'
    document.getElementById('signup-err').style.borderColor = '#0d5c30'
    document.getElementById('signup-err').style.color = '#0d5c30'
  } catch(e) {
    showErr('signup-err', e.message)
    btn.textContent = 'Create account'; btn.disabled = false
  }
}

async function doGoogle() {
  try { await signInWithGoogle() }
  catch(e) { showErr('login-err', e.message) }
}

async function doLogout() { await signOut() }

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function initApp(user) {
  currentUser = user
  // Load everything in parallel for speed
  const [learnedArr, sunnahArr, shukrArr, goalsArr, quranProg, bookmarks, sunnahHist] = await Promise.all([
    loadHadithProgress(user.id),
    loadTodaySunnah(user.id),
    loadShukrLog(user.id),
    loadGoals(user.id),
    loadQuranProgress(user.id),
    loadHadithBookmarks(user.id),
    loadSunnahHistory(user.id),
  ])
  sunnahHistory = sunnahHist
  learned = new Set(learnedArr)
  sunnahDone = Array.isArray(sunnahArr) && sunnahArr.length === 12 ? sunnahArr : Array(12).fill(false)
  shukrLog = shukrArr
  goals = goalsArr
  quranProgress = quranProg
  hadithBookmarks = bookmarks

  // Check whether the sunnah.com API key is configured
  sunnahApiAvailable = Boolean(SUNNAH_KEY && SUNNAH_KEY.length > 5)

  const name = user.user_metadata?.full_name || user.email.split('@')[0]
  document.getElementById('sidebar-name').textContent = name
  document.getElementById('sidebar-email').textContent = user.email
  document.getElementById('home-greeting').textContent = `Assalamu Alaykum, ${name.split(' ')[0]}`
  document.getElementById('home-date').textContent = new Date().toLocaleDateString('en-US', {
    weekday:'long', year:'numeric', month:'long', day:'numeric'
  })

  const ch = dailyChallenges[new Date().getDay() % dailyChallenges.length]
  document.getElementById('challenge-text').textContent = ch.text
  document.getElementById('challenge-reward').textContent = '✦ Reward: ' + ch.reward

  if (quranProgress) {
    earnedBadges.add('quran_started')
    document.getElementById('quran-badge').textContent = `${quranProgress.surah_name} · Ayah ${quranProgress.ayah_number}`
  }

  renderAll()
  checkBadges()
  showToast(`Welcome back, ${name.split(' ')[0]} 🌿`)
  loadSurahs()
  renderCollections()
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function goTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.querySelectorAll('.s-item').forEach(i => i.classList.remove('active'))
  document.getElementById('page-' + page).classList.add('active')
  const map = { home:0, quran:1, hadiths:2, nawawi:3, arabic:4, names:5, sunnah:6, anger:7, shukr:8, goals:9, duas:10, badges:11, progress:12 }
  document.querySelectorAll('.s-item')[map[page]]?.classList.add('active')
}

function toggleDark() {
  const html = document.documentElement
  const isDark = html.getAttribute('data-theme') === 'dark'
  html.setAttribute('data-theme', isDark ? 'light' : 'dark')
  document.getElementById('dark-toggle').textContent = isDark ? '🌙 Dark mode' : '☀️ Light mode'
}

function renderAll() {
  renderProgressPage()
  renderDuasPage()
  renderNamesPage()
  renderHadith()
  renderSunnah()
  renderAnger()
  renderShukrLog()
  renderWords()
  renderGoals()
  renderBadges()
  updateStats()
}


// ─── QURAN FONT SIZE ─────────────────────────────────────────────────────────
let quranArabicSize = 20   // default px for arabic text
let quranEnglishSize = 13  // default px for english text

const fontSizeLabels = {
  12: 'Tiny', 14: 'Small', 16: 'Small', 18: 'Medium',
  20: 'Medium', 22: 'Large', 24: 'Large', 26: 'X-Large',
  28: 'X-Large', 30: 'Huge', 32: 'Huge'
}

function changeQuranFont(delta) {
  quranArabicSize = Math.min(36, Math.max(14, quranArabicSize + delta))
  quranEnglishSize = Math.min(22, Math.max(11, quranEnglishSize + (delta > 0 ? 1 : -1)))
  applyQuranFontSize()
}

function applyQuranFontSize() {
  document.querySelectorAll('.ayah-ar').forEach(el => el.style.fontSize = quranArabicSize + 'px')
  document.querySelectorAll('.ayah-en').forEach(el => el.style.fontSize = quranEnglishSize + 'px')
  const label = document.getElementById('font-size-label')
  if (label) label.textContent = fontSizeLabels[quranArabicSize] || 'Custom'
}

// ─── QURAN READER ─────────────────────────────────────────────────────────────
// Uses api.quran.com which is reliable and well-maintained
async function loadSurahs() {
  try {
    const res = await fetch(`${QURAN_API}/chapters?language=en`)
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    allSurahs = data.chapters
    renderSurahList(allSurahs)

    // Show continue banner if user has a saved checkpoint
    if (quranProgress) {
      document.getElementById('quran-checkpoint-banner').style.display = 'block'
      document.getElementById('quran-checkpoint-banner').innerHTML = `
        <div class="checkpoint-banner">
          <span>📍 Continue: <strong>Surah ${quranProgress.surah_number} — ${quranProgress.surah_name}</strong>, Ayah ${quranProgress.ayah_number}</span>
          <button class="checkpoint-btn" onclick="openSurah(${quranProgress.surah_number}, ${quranProgress.ayah_number})">Continue →</button>
        </div>`
    }
  } catch(e) {
    document.getElementById('surah-list').innerHTML =
      '<div class="quran-loader">Could not load surahs — check your internet connection and refresh.</div>'
  }
}

function renderSurahList(surahs) {
  document.getElementById('surah-list').innerHTML = surahs.map(s => `
    <div class="surah-row" onclick="openSurah(${s.id})">
      <div class="surah-num">${s.id}</div>
      <div class="surah-info">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="surah-name-en">${s.name_simple}</div>
          <div class="surah-name-ar">${s.name_arabic}</div>
        </div>
        <div class="surah-meta">${s.translated_name.name} · ${s.verses_count} ayahs · ${s.revelation_place}</div>
      </div>
    </div>`).join('')
}

function filterSurahs() {
  const q = document.getElementById('surah-search').value.toLowerCase()
  const filtered = q
    ? allSurahs.filter(s => s.name_simple.toLowerCase().includes(q) || s.translated_name.name.toLowerCase().includes(q) || s.id.toString() === q)
    : allSurahs
  renderSurahList(filtered)
}

async function openSurah(num, scrollToAyah = null) {
  currentSurahNum = num
  document.getElementById('quran-surah-list-view').style.display = 'none'
  document.getElementById('quran-surah-reader').style.display = 'block'
  document.getElementById('quran-checkpoint-banner').style.display = 'none'
  document.getElementById('surah-ayahs').innerHTML = '<div class="quran-loader">Loading ayahs...</div>'

  const s = allSurahs.find(x => x.id === num)
  if (s) document.getElementById('surah-header').innerHTML = `
    <div class="surah-header-ar">${s.name_arabic}</div>
    <div class="surah-header-en">${s.name_simple} — ${s.translated_name.name}</div>
    <div class="surah-header-meta">${s.verses_count} ayahs · ${s.revelation_place}</div>`

  document.getElementById('prev-surah-btn').disabled = num <= 1
  document.getElementById('next-surah-btn').disabled = num >= 114

  try {
    // Fetch Arabic text and English translation in one call
    const res = await fetch(`${QURAN_API}/verses/by_chapter/${num}?language=en&words=false&translations=131&fields=text_uthmani&per_page=300`)
    if (!res.ok) throw new Error('API error')
    const data = await res.json()
    const verses = data.verses

    const checkAyah = quranProgress?.surah_number === num ? quranProgress.ayah_number : null
    // Bismillah appears on every surah except Al-Fatihah (1) and At-Tawbah (9)
    const bismillah = (num !== 1 && num !== 9)
      ? `<div class="bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>`
      : ''

    document.getElementById('surah-ayahs').innerHTML = bismillah + verses.map(v => `
      <div class="ayah-row ${checkAyah === v.verse_number ? 'bookmarked' : ''}" id="ayah-${v.verse_number}">
        <div class="ayah-ar">${v.text_uthmani} ﴿${v.verse_number}﴾</div>
        <div class="ayah-en">${v.translations?.[0]?.text?.replace(/<[^>]*>/g,'') || ''}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
          <div class="ayah-num">Ayah ${v.verse_number} · Surah ${num}</div>
          <button class="ayah-bookmark-btn ${checkAyah === v.verse_number ? 'active' : ''}"
            onclick="event.stopPropagation(); bookmarkAyah(${num}, ${v.verse_number})"
            title="Bookmark this ayah">
            ${checkAyah === v.verse_number ? '📍 Bookmarked' : '📍'}
          </button>
        </div>
      </div>`).join('')

    if (scrollToAyah) {
      setTimeout(() => {
        const el = document.getElementById('ayah-' + scrollToAyah)
        if (el) el.scrollIntoView({ behavior:'smooth', block:'center' })
      }, 400)
    }

    applyQuranFontSize()
    earnedBadges.add('quran_started')
    renderBadges()
  } catch(e) {
    document.getElementById('surah-ayahs').innerHTML = '<div class="quran-loader">Could not load ayahs. Check your connection.</div>'
  }
}

function backToSurahList() {
  document.getElementById('quran-surah-list-view').style.display = 'block'
  document.getElementById('quran-surah-reader').style.display = 'none'
  if (quranProgress) document.getElementById('quran-checkpoint-banner').style.display = 'block'
}

function navigateSurah(dir) {
  const next = currentSurahNum + dir
  if (next >= 1 && next <= 114) openSurah(next)
}


async function bookmarkAyah(surahNum, ayahNum) {
  const s = allSurahs.find(x => x.id === surahNum)
  const surahName = s?.name_simple || ''
  await saveQuranProgress(currentUser.id, surahNum, surahName, ayahNum)
  quranProgress = { surah_number: surahNum, surah_name: surahName, ayah_number: ayahNum }
  document.getElementById('quran-badge').textContent = surahName + ' · Ayah ' + ayahNum
  // Re-render to update highlighted bookmark
  document.querySelectorAll('.ayah-bookmark-btn').forEach(btn => {
    btn.classList.remove('active')
    btn.textContent = '📍'
  })
  const target = document.getElementById('ayah-' + ayahNum)
  if (target) {
    target.classList.add('bookmarked')
    const btn = target.querySelector('.ayah-bookmark-btn')
    if (btn) { btn.classList.add('active'); btn.textContent = '📍 Bookmarked' }
  }
  showToast('Bookmark saved — Ayah ' + ayahNum + ' of Surah ' + surahNum + ' 📍')
}

async function saveCheckpoint() {
  // Find the first visible ayah by looking at which element is near the top of the scroll container
  const container = document.querySelector('.main')
  let visibleAyah = 1
  document.querySelectorAll('.ayah-row').forEach(a => {
    const rect = a.getBoundingClientRect()
    if (rect.top < 300) visibleAyah = parseInt(a.id.replace('ayah-', ''))
  })
  const s = allSurahs.find(x => x.id === currentSurahNum)
  const surahName = s?.name_simple || ''
  await saveQuranProgress(currentUser.id, currentSurahNum, surahName, visibleAyah)
  quranProgress = { surah_number: currentSurahNum, surah_name: surahName, ayah_number: visibleAyah }
  document.getElementById('quran-badge').textContent = `${surahName} · Ayah ${visibleAyah}`
  showToast(`Checkpoint saved — Surah ${currentSurahNum}, Ayah ${visibleAyah} 📍`)
}

// ─── HADITHS (SUNNAH.COM API) ─────────────────────────────────────────────────
function renderCollections() {
  document.getElementById('collections-grid').innerHTML = hadithCollections.map(c => `
    <div class="collection-card" onclick="openCollection('${c.id}','${c.name}')">
      <div class="collection-icon">${c.icon}</div>
      <div class="collection-name">${c.name}</div>
      <div class="collection-count">${c.desc}</div>
    </div>`).join('')

  // Show API key setup notice if key is not configured yet
  if (!sunnahApiAvailable) {
    document.getElementById('sunnah-api-notice').style.display = 'block'
  }
}

async function openCollection(id, name) {
  currentCollection = { id, name }

  if (!sunnahApiAvailable) {
    showToast('Add your sunnah.com API key to .env to browse hadiths')
    return
  }

  document.getElementById('hadiths-collections-view').style.display = 'none'
  document.getElementById('hadiths-books-view').style.display = 'block'
  document.getElementById('hadiths-items-view').style.display = 'none'

  document.getElementById('hadiths-breadcrumb').innerHTML = `
    <div class="breadcrumb-item" onclick="backToCollections()">Hadiths</div>
    <div class="breadcrumb-sep">›</div>
    <div class="breadcrumb-item" style="color:var(--text);font-weight:500;">${name}</div>`
  document.getElementById('books-list').innerHTML = '<div class="hadith-loader">Loading books...</div>'

  try {
    const res = await fetch(`${SUNNAH_API}/collections/${id}/books?limit=100`, { headers: sunnahHeaders() })
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error('Invalid API key. Check your VITE_SUNNAH_API_KEY in .env.')
      throw new Error('Could not load books.')
    }
    const data = await res.json()
    const books = data.data || []
    document.getElementById('books-list').innerHTML = books.map(b => `
      <div class="book-row" onclick="openBook(${b.bookNumber},'${(b.nameTranslated||b.book||'Book '+b.bookNumber).replace(/'/g,"\\'")}')">
        <div>
          <div class="book-name">${b.nameTranslated || b.book || 'Book ' + b.bookNumber}</div>
          <div class="book-count">${b.hadithEndNumber - b.hadithStartNumber + 1} hadith</div>
        </div>
        <div style="color:var(--gm);font-size:18px;">›</div>
      </div>`).join('')
  } catch(e) {
    document.getElementById('books-list').innerHTML = `<div class="hadith-loader">${e.message}</div>`
  }
}

async function openBook(bookNum, bookName) {
  document.getElementById('hadiths-books-view').style.display = 'none'
  document.getElementById('hadiths-items-view').style.display = 'block'
  document.getElementById('hadiths-items-breadcrumb').innerHTML = `
    <div class="breadcrumb-item" onclick="backToCollections()">Hadiths</div>
    <div class="breadcrumb-sep">›</div>
    <div class="breadcrumb-item" onclick="openCollection('${currentCollection.id}','${currentCollection.name}')">${currentCollection.name}</div>
    <div class="breadcrumb-sep">›</div>
    <div class="breadcrumb-item" style="color:var(--text);font-weight:500;">${bookName}</div>`
  document.getElementById('hadiths-items-container').innerHTML = '<div class="hadith-loader">Loading hadiths...</div>'
  document.getElementById('hadith-search').value = ''

  try {
    const res = await fetch(`${SUNNAH_API}/collections/${currentCollection.id}/books/${bookNum}/hadiths?limit=100`, { headers: sunnahHeaders() })
    if (!res.ok) throw new Error('Could not load hadiths.')
    const data = await res.json()
    currentHadiths = data.data || []
    filteredHadiths = [...currentHadiths]
    renderHadithItems(bookNum)
  } catch(e) {
    document.getElementById('hadiths-items-container').innerHTML = `<div class="hadith-loader">${e.message}</div>`
  }
}

function renderHadithItems(bookNum) {
  const bookmarkedKeys = new Set(hadithBookmarks.map(b => `${b.collection}-${b.hadith_number}`))
  document.getElementById('hadiths-items-container').innerHTML = filteredHadiths.slice(0, 100).map(h => {
    const hadithNum = h.hadithNumber
    const key = `${currentCollection.id}-${hadithNum}`
    const isBookmarked = bookmarkedKeys.has(key)
    const arabic = h.hadith?.[0]?.body || ''
    const english = h.hadith?.[1]?.body || h.hadith?.[0]?.body || ''
    const grade = h.hadith?.[0]?.grades?.[0]?.grade || ''
    return `<div class="hadith-item">
      ${arabic ? `<div class="hadith-item-arabic">${arabic}</div>` : ''}
      <div class="hadith-item-text">${english}</div>
      <div class="hadith-item-meta">
        <div>
          <div class="hadith-item-ref">${currentCollection.name} · Hadith ${hadithNum}</div>
          ${grade ? `<div class="hadith-grade">${grade}</div>` : ''}
        </div>
        <button class="bookmark-btn ${isBookmarked ? 'saved' : ''}"
          onclick="toggleHadithBookmark(this,'${key}','${currentCollection.id}',${bookNum || 1},${hadithNum},'${english.replace(/'/g,"\\'").replace(/\n/g,' ')}')">
          ${isBookmarked ? '✓ Saved' : '+ Save'}
        </button>
      </div>
    </div>`
  }).join('') + (filteredHadiths.length > 100
    ? `<div style="padding:16px;text-align:center;font-size:12px;color:var(--gm);">Showing first 100. Use search to find specific hadith.</div>`
    : '')
}

function filterHadiths() {
  const q = document.getElementById('hadith-search').value.toLowerCase()
  filteredHadiths = q
    ? currentHadiths.filter(h => (h.hadith?.[1]?.body || h.hadith?.[0]?.body || '').toLowerCase().includes(q))
    : [...currentHadiths]
  renderHadithItems()
}

async function toggleHadithBookmark(btn, key, collection, bookNum, hadithNum, text) {
  if (btn.classList.contains('saved')) {
    const bm = hadithBookmarks.find(b => `${b.collection}-${b.hadith_number}` === key)
    if (bm) { await deleteHadithBookmark(bm.id); hadithBookmarks = hadithBookmarks.filter(b => b.id !== bm.id) }
    btn.classList.remove('saved'); btn.textContent = '+ Save'
  } else {
    const bm = await saveHadithBookmark(currentUser.id, collection, bookNum, hadithNum, text)
    hadithBookmarks = [bm, ...hadithBookmarks]
    btn.classList.add('saved'); btn.textContent = '✓ Saved'
    earnedBadges.add('hadith_bookmarked'); renderBadges()
    showToast('Hadith saved to bookmarks')
  }
}

function backToCollections() {
  document.getElementById('hadiths-collections-view').style.display = 'block'
  document.getElementById('hadiths-books-view').style.display = 'none'
  document.getElementById('hadiths-items-view').style.display = 'none'
}


// ─── HADITH EXPLANATIONS ─────────────────────────────────────────────────────
const hadithExplanations = [
  "This is the first and most foundational hadith. Every action is judged by the intention behind it. If you pray, fast, or give charity for Allah's sake, you receive the full reward. If your intention is to show off or gain worldly benefit, you receive no reward with Allah. This hadith teaches us to constantly renew and purify our intentions.",
  "This hadith outlines the five pillars of Islam in summary form. The testimony of faith is the entry into Islam. Prayer connects the servant to Allah five times a day. Zakat purifies wealth and supports the community. Fasting in Ramadan builds taqwa. Hajj is the global gathering of the ummah. These five form the skeleton of a Muslim's life.",
  "The Prophet ﷺ listed the five pillars in order of importance. The shahada comes first as it is the foundation. Prayer is the most important act of worship after the shahada. Zakat is mentioned third, then fasting, then Hajj — which is only obligatory for those who are able.",
  "This hadith teaches us about the origins of the human soul. Each person is formed in the womb in stages — a drop of fluid, then a clot, then a lump. At 120 days an angel breathes the soul into the body and records four things: the person's provision, lifespan, deeds, and whether they will be happy or miserable. This reminds us that Allah knows and controls all.",
  "Any innovation in the religion that has no basis in the Quran or Sunnah is rejected. This protects the purity of Islam from additions and changes. The Prophet ﷺ said: 'Every innovation is misguidance, and every misguidance leads to the Fire.' This does not refer to worldly innovations like technology, but to newly invented acts of worship.",
  "The halal is clear — what Allah has permitted is known. The haram is clear — what Allah has forbidden is known. Between them are matters that are unclear to many people. Whoever stays away from the doubtful out of caution has protected their deen and their honour. Whoever falls into the doubtful may fall into the haram — like a shepherd grazing near a protected area.",
  "The entire religion can be summarised as sincere advice and goodwill. To Allah — by believing in Him, obeying Him, avoiding what He hates. To His Book — by reciting, understanding, and acting by it. To His Messenger ﷺ — by following his sunnah. To the leaders — by obeying in what is good. To the people — by wanting for them what you want for yourself.",
  "This hadith refers to the command given to the early Muslims to fight those who refused to accept Islam. Scholars explain this refers to a specific historical context — the Arabian Peninsula — not a general command to fight all non-Muslims forever. When the conditions are met, fighting stops.",
  "The Prophet ﷺ told us to avoid what he forbade and do what he commanded as much as we are able. The phrase 'as much as you are able' shows the mercy of Islam — we are not expected to do the impossible. But avoidance of prohibitions is absolute — there is no 'as much as you can' when it comes to staying away from the haram.",
  "Allah is pure and only accepts what is pure. He commanded the believers to eat from the good and lawful, just as He commanded the prophets. This hadith reminds us that our sustenance must be halal — haram food and income can block our duas from being answered.",
  "Leaving what doesn't concern you is a sign of good Islam. A person who wastes no time on irrelevant matters, gossip, or things unrelated to their deen and dunya has perfected something important. The Prophet ﷺ said this is from the excellence of a person's Islam — meaning it is a high rank, not the bare minimum.",
  "True faith is not just about what you believe — it must translate into how you treat others. If you love for your brother what you love for yourself, you cannot envy him, cannot cheat him, and cannot harm him. This hadith sets a very high standard for how believers relate to one another.",
  "Anger is one of the most dangerous doors through which shaytan enters. The Prophet ﷺ repeated this advice three times — showing how serious and difficult it is. When we are angry we say things we regret, we make decisions we regret, and we act in ways that damage our relationships and our deen.",
  "Fearing Allah is the foundation of taqwa. Following a bad deed with a good deed wipes it out — this gives hope to the sinner. Treating people with good character is a summary of social ethics in Islam. These three principles — taqwa, tawbah, and good character — cover our relationship with Allah and with people.",
  "This hadith teaches us to guard Allah's commands and He will guard us in return. If you protect the boundaries Allah set — the halal and haram — He will protect you in your deen, your life, and your family. The second part is equally powerful: know Allah in times of ease and He will know you in times of difficulty.",
  "We should seek help from Allah and not give up. When something bad happens, we should not dwell on 'if only I had done differently' — because that opens the door to shaytan. Instead say: 'Allah decreed this and He does what He wills.' Accept the decree with patience while still doing your best to improve your situation.",
  "Purification is half of faith — both physical purity (wudu, ghusl) and spiritual purity (tawbah, sincerity). Alhamdulillah fills the scale — the most weighty thing on the scale of deeds on the Day of Judgment. SubhanAllah and Alhamdulillah together fill what is between the heavens and earth — an enormous reward for just a few words.",
  "Every single act of goodness is a form of charity. Removing harm from the road, smiling at your brother, giving good advice, visiting the sick, making dua for others — all of this is sadaqah. Islam is a religion of constant charity, and this hadith shows that sadaqah is not limited to money.",
  "The truly strong person is not the one who wins fights — it is the one who can control themselves when they are angry. Controlling anger requires immense strength of character. The Prophet ﷺ said this to correct our understanding of strength — real power is internal, not physical.",
  "Seeking knowledge is one of the greatest acts of worship. Whoever walks a path to seek knowledge — literally or metaphorically — Allah makes the path to Jannah easy for them. This applies to knowledge of the deen, and also to beneficial worldly knowledge when sought with the right intention.",
  "Allah loves excellence — in worship, in work, in relationships, in everything. When you do something, do it well. Pray with khushu, work with care, help people thoroughly. Doing things with ihsan (excellence) is a form of worship. The Prophet ﷺ said Allah does not just want you to do good things — He wants you to do them with excellence.",
  "The best of people in terms of religious benefit to the ummah are those who learn the Quran and teach it to others. This is sadaqah jariyah — the one who teaches passes on knowledge that outlives them. Every person who learns from you and then teaches others — you get a share of their reward too.",
  "Harm must not be inflicted or returned. If something harms you, you cannot harm others to compensate. This is the foundation of Islamic law regarding harm, compensation, and rights. It protects the weak from oppression and prevents cycles of revenge and harm.",
  "Every Muslim has a duty to change evil — with their hand if they have authority, with their tongue if they can, and with their heart at minimum. This hadith shows that the duty to oppose evil is graduated based on ability. Changing evil with the heart — hating it sincerely — is the bare minimum of faith.",
  "Guiding someone to good is as if you did the good yourself. This means that teachers, parents, scholars, and friends who guide others to good deeds receive a reward equal to every good deed those people do, without the person's reward being reduced at all. This is one of the most powerful motivations for dawah.",
  "Patience is only truly valuable at the moment the calamity first strikes — before you have processed it, before the shock wears off. Patience after the initial shock is easier and less meritorious. The real test is the first moment: can you say Inna lillahi wa inna ilayhi raji'un and mean it?",
  "Allah does not judge you by your appearance or your wealth — He judges you by what is in your heart and what you do. This removes all forms of discrimination based on looks, race, or status in Islam. The one with the best heart and the best deeds is the most honoured in the sight of Allah.",
  "A Muslim is defined not just by what they believe but by how they treat others. The one whose neighbours and fellow Muslims are safe from their tongue and their hands has fulfilled a major obligation. This makes safety — not just prayer and fasting — a defining characteristic of a Muslim.",
  "Gratitude to people is connected to gratitude to Allah. If a person cannot bring themselves to thank the people who benefit them, it reflects an inability to truly appreciate and be grateful to Allah. Start with thanking the people around you — your parents, teachers, friends — and this trains the heart for shukr to Allah.",
  "The best people are those who benefit others the most. This is a standard by which to measure your life: how much have you benefited the people around you? It could be through teaching, helping, giving, listening, advising, or any form of service. Being beneficial to others is one of the highest honours.",
  "Live in this world as a traveller — lightly, with your eyes on the destination, not getting too attached to the comforts of the road. The traveller does not furnish the hotel room. They stay briefly and move on. This world is your journey, the akhirah is your home. Don't decorate the journey at the expense of the destination.",
  "Righteousness is good character — how you treat people, how you speak, how you carry yourself. Sin is what disturbs your conscience and what you would be embarrassed for people to know about. These two tests — one internal and one social — cover the full range of moral life.",
  "When you leave something for the sake of Allah — a haram relationship, a forbidden income, a bad habit — Allah replaces it with something better. This requires trust. The replacement may not be immediate or obvious. But the promise of the Prophet ﷺ is certain: leave it for Allah and He will give you better.",
  "The first ten days of Dhul Hijjah are the most virtuous days of the year — more than Ramadan according to many scholars. Good deeds done in these days are the most beloved to Allah. Make the most of them with extra prayer, fasting, dhikr, sadaqah, and recitation of the Quran.",
  "The dunya should be in your hand — used as a tool — not in your heart where it controls and distracts you. You can have wealth, comfort, and success, as long as your heart is free of attachment to them. The test is simple: if you lost everything tomorrow, would your heart be at peace? That is where the dunya should sit.",
  "Detachment from the dunya brings rest to the heart and body. Chasing the world — its wealth, its status, its pleasures — brings endless anxiety, sleeplessness, and exhaustion. The person who is satisfied with what Allah has given them and is not consumed by worldly desire lives with a lightness and peace that money cannot buy.",
  "Whoever believes in Allah and the Last Day must guard their tongue — say good or stay silent. The tongue is the most dangerous limb. More people enter the Fire because of what their tongues say than almost anything else. Honouring the neighbour and the guest are marks of a person of complete faith.",
  "Fasting Ramadan with true faith and seeking the reward of Allah — not just habit or social obligation — leads to the forgiveness of all past sins. The condition is sincerity: iman and ihtisab. This is one of the greatest gifts of the month.",
  "After death, most deeds are cut off — except three that continue to bring reward: ongoing charity (a well, a masjid, a school), beneficial knowledge that others use, and a righteous child who prays for you. Building these three in your lifetime is the wisest investment a person can make.",
  "The Prophet ﷺ was sent to complete and perfect good character. Islam is not just rituals — it is above all else a refinement of character. Honesty, generosity, patience, kindness, justice — these are what Islam came to perfect. Judge the quality of your Islam by the quality of your character.",
]

// ─── NAWAWI 40 ────────────────────────────────────────────────────────────────
function renderHadith() {
  document.getElementById('hadith-list').innerHTML = hadithData.map((h, i) => {
    const isExpanded = expandedHadith === i
    const isLearned = learned.has(i)
    return `
      <div class="h-row ${isLearned ? 'learned' : ''} ${isExpanded ? 'h-row-expanded' : ''}" onclick="toggleHadithExpand(${i})">
        <div class="h-num">${i + 1}</div>
        <div style="flex:1;">
          <div class="h-ar">${h.ar}</div>
          <div style="font-size:11px;color:var(--gm);">${h.src.split('·')[0].trim()}</div>
        </div>
        <div style="font-size:13px;color:var(--gm);padding-left:8px;">${isExpanded ? '▲' : '▼'}</div>
      </div>
      ${isExpanded ? `
      <div class="h-expand-body">
        <div class="h-expand-ar">${h.ar}</div>
        <div class="h-expand-en">"${h.en}"</div>
        <div class="h-expand-src">— ${h.src}</div>
        <div class="h-expand-exp">
          <div class="h-expand-exp-label">What this means</div>
          ${hadithExplanations[i] || ''}
        </div>
        <button class="h-learned-btn ${isLearned ? 'done' : ''}" onclick="event.stopPropagation(); markLearnedFromList(${i})">
          ${isLearned ? '✓ Marked as memorised' : '+ Mark as memorised'}
        </button>
      </div>` : ''}
    `
  }).join('')
}

function toggleHadithExpand(i) {
  expandedHadith = expandedHadith === i ? null : i
  renderHadith()
  if (expandedHadith !== null) {
    setTimeout(() => {
      const rows = document.querySelectorAll('.h-expand-body')
      if (rows.length) rows[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 50)
  }
}

async function markLearnedFromList(i) {
  learned.add(i)
  renderHadith()
  updateStats()
  checkBadges()
  await saveHadithProgress(currentUser.id, [...learned])
  showToast('Hadith ' + (i+1) + ' marked as memorised ✓')
}

function switchHadithMode(mode) {
  document.querySelectorAll('.mode-tab').forEach((t, i) => t.classList.toggle('active', ['list','review','quiz'][i] === mode))
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
  document.getElementById('rev-num').textContent = `Hadith ${idx + 1} of 40`
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
  updateStats(); checkBadges()
  await saveHadithProgress(currentUser.id, [...learned])
}

function startQuiz() {
  quizIdx = 0; quizScore = 0; quizAnswered = false
  const shuffled = [...hadithData].sort(() => Math.random() - .5).slice(0, 5)
  quizQuestions = shuffled.map(h => {
    const wrong = hadithData.filter(x => x.en !== h.en).sort(() => Math.random() - .5).slice(0, 3)
    return { question: h.ar, answer: h.en, options: [...wrong, h].sort(() => Math.random() - .5).map(o => o.en) }
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
  document.getElementById('quiz-opts').innerHTML = q.options.map((o, i) =>
    `<div class="quiz-option" onclick="answerQuiz(this,${i},'${o.replace(/'/g,"\\'")}','${q.answer.replace(/'/g,"\\'")}')"> ${o}</div>`
  ).join('')
  quizAnswered = false
}

function answerQuiz(el, idx, chosen, correct) {
  if (quizAnswered) return
  quizAnswered = true
  const isCorrect = chosen === correct
  el.classList.add(isCorrect ? 'correct' : 'wrong')
  if (!isCorrect) document.querySelectorAll('.quiz-option').forEach(o => { if (o.textContent.trim() === correct) o.classList.add('correct') })
  if (isCorrect) quizScore++
  setTimeout(() => { quizIdx++; loadQuizQuestion() }, 1400)
}

function showQuizResult() {
  document.getElementById('quiz-active').style.display = 'none'
  document.getElementById('quiz-done').style.display = ''
  document.getElementById('final-score').textContent = `${quizScore} / ${quizQuestions.length}`
  document.getElementById('quiz-score-display').textContent = `${quizScore}/${quizQuestions.length}`
  document.getElementById('final-msg').textContent = ['Keep reviewing!','Getting there!','Good effort!','Well done! MashaAllah!','Perfect! SubhanAllah! 🏆'][quizScore] || 'MashaAllah!'
  if (quizScore === quizQuestions.length) { earnedBadges.add('quiz_perfect'); renderBadges() }
}

// ─── ARABIC WORDS ─────────────────────────────────────────────────────────────
function renderWords() {
  loadWord(wordIdx)
  document.getElementById('word-list').innerHTML = arabicWords.map((w, i) => `
    <div class="h-row" onclick="loadWordGo(${i})" style="cursor:pointer;">
      <div style="font-family:'Playfair Display',serif;font-size:18px;color:var(--g);direction:rtl;min-width:60px;text-align:right;">${w.ar}</div>
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
  document.getElementById('w-counter').textContent = `${idx + 1} / ${arabicWords.length}`
}
function loadWordGo(idx) { loadWord(idx); goTo('arabic') }
function nextWord() { loadWord((wordIdx + 1) % arabicWords.length) }
function prevWord() { loadWord((wordIdx - 1 + arabicWords.length) % arabicWords.length) }

// ─── SUNNAH HABITS ────────────────────────────────────────────────────────────
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
  renderSunnah(); updateStats(); checkBadges()
  await saveSunnahLog(currentUser.id, sunnahDone)
  showToast(sunnahDone[i] ? 'Sunnah recorded ✓' : 'Unmarked')
}

// ─── ANGER GUIDE ─────────────────────────────────────────────────────────────
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

// ─── SHUKR LOG ───────────────────────────────────────────────────────────────
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
  renderShukrLog(); updateStats(); checkBadges()
  const a = ayahs[Math.floor(Math.random() * ayahs.length)]
  document.getElementById('ayah-text').textContent = a.text
  document.getElementById('ayah-ref').textContent = a.ref
  showToast('Shukr saved — may Allah increase your blessings 🌿')
}

// ─── GOALS ───────────────────────────────────────────────────────────────────
function renderGoals() {
  const active = goals.filter(g => !g.done)
  const done = goals.filter(g => g.done)
  const el = document.getElementById('goals-list')
  if (!goals.length) {
    el.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text2);font-size:13px;">No goals yet — add one or pick a suggestion below</div>`
    return
  }
  el.innerHTML = [...active, ...done].map(g => `
    <div class="goal-item ${g.done ? 'done' : ''}">
      <div class="goal-chk" onclick="doneGoal('${g.id}',${!g.done})">${g.done ? '✓' : ''}</div>
      <div class="goal-body"><div class="goal-text">${g.text}</div><div class="goal-cat">${g.category}</div></div>
      <button class="goal-del" onclick="removeGoal('${g.id}')">×</button>
    </div>`).join('')
}

function renderGoalSuggestions() {
  const cat = goalSuggestions[activeSuggestionCat]
  document.getElementById('suggestion-tabs').innerHTML = goalSuggestions.map((c, i) =>
    `<div class="sug-tab ${i === activeSuggestionCat ? 'active' : ''}" onclick="setSugCat(${i})">${c.cat}</div>`
  ).join('')
  document.getElementById('suggestion-list').innerHTML = cat.suggestions.map(s => `
    <div class="sug-item" onclick="addSuggestion('${s.replace(/'/g,"\\'")}','${cat.cat}')">
      <span>${s}</span><span class="sug-add">+ Add</span>
    </div>`).join('')
}

function setSugCat(i) { activeSuggestionCat = i; renderGoalSuggestions() }

async function addGoalFromInput() {
  const input = document.getElementById('goal-input')
  const text = input.value.trim()
  if (!text) { showToast('Write your goal first'); return }
  const cat = document.getElementById('goal-cat-select').value
  const newGoal = await saveGoal(currentUser.id, text, cat)
  goals = [newGoal, ...goals]
  input.value = ''
  renderGoals(); checkBadges()
  showToast('Goal added — may Allah make it easy for you 🌿')
}

async function addSuggestion(text, cat) {
  const newGoal = await saveGoal(currentUser.id, text, cat)
  goals = [newGoal, ...goals]
  renderGoals(); checkBadges()
  showToast('Goal added 🌿')
}

async function doneGoal(id, done) {
  await toggleGoalDone(id, done)
  goals = goals.map(g => g.id === id ? {...g, done} : g)
  renderGoals(); checkBadges()
  if (done) showToast('MashaAllah — goal completed! ✓')
}

async function removeGoal(id) {
  await deleteGoal(id)
  goals = goals.filter(g => g.id !== id)
  renderGoals()
}

function completeChallenge() {
  showToast('JazakAllahu khairan — challenge complete! 🌿')

  // Pick a new challenge different from the current one
  const currentText = document.getElementById('challenge-text').textContent
  const remaining = dailyChallenges.filter(c => c.text !== currentText)
  const next = remaining[Math.floor(Math.random() * remaining.length)]

  const card = document.querySelector('.challenge-card')

  // Fade out
  card.style.transition = 'opacity 0.4s'
  card.style.opacity = '0'

  setTimeout(() => {
    // Show completion message briefly
    card.innerHTML = `
      <div style="text-align:center;padding:8px 0;">
        <div style="font-size:22px;margin-bottom:8px;">✓</div>
        <div style="font-size:15px;color:#fff;font-family:'Playfair Display',serif;margin-bottom:4px;">Challenge complete</div>
        <div style="font-size:12px;color:#88c9a0;">JazakAllahu khairan — may Allah accept it</div>
      </div>`
    card.style.opacity = '1'

    // After 2 seconds show the next challenge
    setTimeout(() => {
      card.style.opacity = '0'
      setTimeout(() => {
        card.innerHTML = `
          <div class="challenge-label">New Challenge</div>
          <div class="challenge-text" id="challenge-text">${next.text}</div>
          <div class="challenge-reward" id="challenge-reward">✦ Reward: ${next.reward}</div>
          <button class="challenge-done" onclick="completeChallenge()">Mark as done ✓</button>`
        card.style.opacity = '1'
      }, 400)
    }, 2000)
  }, 400)
}

// ─── BADGES ───────────────────────────────────────────────────────────────────
function checkBadges() {
  earnedBadges.add('first_login')
  if (learned.size >= 5) earnedBadges.add('hadith_5')
  if (learned.size >= 10) earnedBadges.add('hadith_10')
  if (learned.size >= 40) earnedBadges.add('hadith_40')
  if (shukrLog.length >= 7) earnedBadges.add('shukr_7')
  if (shukrLog.length >= 30) earnedBadges.add('shukr_30')
  if (sunnahDone.every(Boolean)) earnedBadges.add('sunnah_streak')
  if (goals.length >= 1) earnedBadges.add('goal_set')
  if (goals.some(g => g.done)) earnedBadges.add('goal_done')
  renderBadges()
}

function renderBadges() {
  document.getElementById('badges-count').textContent = `${earnedBadges.size} / ${badgesData.length} earned`
  document.getElementById('badges-grid').innerHTML = badgesData.map(b => `
    <div class="badge-item ${earnedBadges.has(b.id) ? 'earned' : ''}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
    </div>`).join('')
}

function updateStats() {
  renderProgressPage()
  const lc = learned.size, sc = sunnahDone.filter(Boolean).length, shc = shukrLog.length
  document.getElementById('h-count').textContent = lc
  document.getElementById('hm').textContent = lc
  document.getElementById('hl').textContent = 40 - lc
  document.getElementById('h-prog').style.width = Math.round(lc / 40 * 100) + '%'
  document.getElementById('h-badge').textContent = lc + ' / 40'
  document.getElementById('s-count').textContent = sc
  document.getElementById('shukr-count').textContent = shc
  document.getElementById('streak-val').textContent = shc
  document.getElementById('goals-count').textContent = goals.filter(g => !g.done).length + ' active'
}

function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg; t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 2800)
}


// ─── 99 NAMES OF ALLAH ───────────────────────────────────────────────────────
const allahNames = [
  {num:1,ar:"اللَّهُ",trans:"Allah",mean:"The One God",cat:"Essence",desc:"The greatest name — the one who alone deserves worship. All other names are attributes of this one name."},
  {num:2,ar:"الرَّحْمَٰنُ",trans:"Ar-Rahman",mean:"The Most Gracious",cat:"Mercy",desc:"The one whose mercy encompasses all of creation — believers and disbelievers, humans and animals. His mercy in this world is general."},
  {num:3,ar:"الرَّحِيمُ",trans:"Ar-Rahim",mean:"The Most Merciful",cat:"Mercy",desc:"The one whose mercy is specific to the believers in the hereafter. A deep and continuous mercy reserved for those who believe."},
  {num:4,ar:"الْمَلِكُ",trans:"Al-Malik",mean:"The King",cat:"Sovereignty",desc:"The sovereign owner of all dominion. Everything in the heavens and earth belongs to Him and He rules with absolute authority."},
  {num:5,ar:"الْقُدُّوسُ",trans:"Al-Quddus",mean:"The Most Pure / Holy",cat:"Perfection",desc:"The one who is free from all defects, imperfections, and partners. Utterly pure and beyond any comparison."},
  {num:6,ar:"السَّلَامُ",trans:"As-Salam",mean:"The Source of Peace",cat:"Perfection",desc:"The one from whom all peace comes. He is free from all deficiencies and grants peace to His creation."},
  {num:7,ar:"الْمُؤْمِنُ",trans:"Al-Mu'min",mean:"The Guardian of Faith",cat:"Protection",desc:"The one who gives security and protects His servants. He confirms His messengers and grants safety to the believers."},
  {num:8,ar:"الْمُهَيْمِنُ",trans:"Al-Muhaymin",mean:"The Overseer / Protector",cat:"Protection",desc:"The one who watches over, guards, and preserves all things. Nothing escapes His observation and care."},
  {num:9,ar:"الْعَزِيزُ",trans:"Al-Aziz",mean:"The Almighty",cat:"Power",desc:"The one who is all-powerful and cannot be overcome. His might is absolute and He is never in need of anyone."},
  {num:10,ar:"الْجَبَّارُ",trans:"Al-Jabbar",mean:"The Compeller / Restorer",cat:"Power",desc:"The one who compels all things to His will and who also repairs and restores the broken-hearted. He mends what is broken."},
  {num:11,ar:"الْمُتَكَبِّرُ",trans:"Al-Mutakabbir",mean:"The Supremely Great",cat:"Greatness",desc:"The one who is truly great and above all things. Greatness belongs to Allah alone — arrogance in humans is forbidden, but in Allah it is a divine attribute."},
  {num:12,ar:"الْخَالِقُ",trans:"Al-Khaliq",mean:"The Creator",cat:"Creation",desc:"The one who creates everything from nothing. He created the heavens, earth, and all that exists without any prior example."},
  {num:13,ar:"الْبَارِئُ",trans:"Al-Bari",mean:"The Originator / Maker",cat:"Creation",desc:"The one who creates things and distinguishes them from one another. He fashions creation with perfect distinction."},
  {num:14,ar:"الْمُصَوِّرُ",trans:"Al-Musawwir",mean:"The Fashioner of Forms",cat:"Creation",desc:"The one who gives form and shape to everything He creates. He fashions each creation in its unique and perfect form."},
  {num:15,ar:"الْغَفَّارُ",trans:"Al-Ghaffar",mean:"The Ever-Forgiving",cat:"Forgiveness",desc:"The one who forgives repeatedly and covers the sins of His servants. He forgives abundantly, time after time."},
  {num:16,ar:"الْقَهَّارُ",trans:"Al-Qahhar",mean:"The Subduer",cat:"Power",desc:"The one who overpowers and subdues all of creation. Nothing can resist His will or escape His dominion."},
  {num:17,ar:"الْوَهَّابُ",trans:"Al-Wahhab",mean:"The Bestower",cat:"Generosity",desc:"The one who gives freely and generously without any expectation of return. All gifts and blessings come from Him."},
  {num:18,ar:"الرَّزَّاقُ",trans:"Ar-Razzaq",mean:"The Provider",cat:"Generosity",desc:"The one who provides sustenance for all of creation. Every living thing receives its provision from Allah, without exception."},
  {num:19,ar:"الْفَتَّاحُ",trans:"Al-Fattah",mean:"The Opener / Judge",cat:"Justice",desc:"The one who opens what is closed — doors of provision, mercy, and knowledge. He also judges between His creation with perfect justice."},
  {num:20,ar:"الْعَلِيمُ",trans:"Al-Alim",mean:"The All-Knowing",cat:"Knowledge",desc:"The one whose knowledge encompasses all things — the seen and unseen, the past, present, and future. Nothing is hidden from Him."},
  {num:21,ar:"الْقَابِضُ",trans:"Al-Qabid",mean:"The Withholder",cat:"Balance",desc:"The one who withholds and restricts as He wills. He constricts provision and sustenance according to His perfect wisdom."},
  {num:22,ar:"الْبَاسِطُ",trans:"Al-Basit",mean:"The Expander",cat:"Balance",desc:"The one who expands and extends His provision and mercy as He wills. He opens the hand of generosity to whom He chooses."},
  {num:23,ar:"الْخَافِضُ",trans:"Al-Khafid",mean:"The Abaser",cat:"Justice",desc:"The one who lowers and humbles whoever He wills. He brings the arrogant low and raises the humble."},
  {num:24,ar:"الرَّافِعُ",trans:"Ar-Rafi",mean:"The Exalter",cat:"Justice",desc:"The one who raises and elevates whoever He wills in rank, station, and honour."},
  {num:25,ar:"الْمُعِزُّ",trans:"Al-Mu'izz",mean:"The Honourer",cat:"Justice",desc:"The one who grants honour and dignity to whom He wills. All honour belongs to Allah and He gives it to whoever He chooses."},
  {num:26,ar:"الْمُذِلُّ",trans:"Al-Mudhill",mean:"The Humiliator",cat:"Justice",desc:"The one who humiliates and disgraces whoever He wills. No one can grant honour to whom Allah has humiliated."},
  {num:27,ar:"السَّمِيعُ",trans:"As-Sami",mean:"The All-Hearing",cat:"Knowledge",desc:"The one who hears all sounds and voices — public and private, loud and silent. Every supplication and every whisper reaches Him."},
  {num:28,ar:"الْبَصِيرُ",trans:"Al-Basir",mean:"The All-Seeing",cat:"Knowledge",desc:"The one who sees all things — the visible and invisible, the smallest particle and the furthest star."},
  {num:29,ar:"الْحَكَمُ",trans:"Al-Hakam",mean:"The Judge",cat:"Justice",desc:"The one who judges between His creation with absolute justice and wisdom. His judgment is always the truth."},
  {num:30,ar:"الْعَدْلُ",trans:"Al-Adl",mean:"The Just",cat:"Justice",desc:"The one who is perfectly just in all matters. He never wrongs anyone — not even by the weight of an atom."},
  {num:31,ar:"اللَّطِيفُ",trans:"Al-Latif",mean:"The Subtle / Kind",cat:"Mercy",desc:"The one who is aware of the subtlest details and who is gentle and kind to His servants in ways they may not even perceive."},
  {num:32,ar:"الْخَبِيرُ",trans:"Al-Khabir",mean:"The All-Aware",cat:"Knowledge",desc:"The one who has complete awareness of all things — their inner realities, hidden states, and deepest secrets."},
  {num:33,ar:"الْحَلِيمُ",trans:"Al-Halim",mean:"The Forbearing",cat:"Mercy",desc:"The one who is patient and does not rush to punish despite witnessing disobedience. He gives people time to repent."},
  {num:34,ar:"الْعَظِيمُ",trans:"Al-Azim",mean:"The Magnificent",cat:"Greatness",desc:"The one of incomprehensible greatness and majesty. His greatness is beyond the capacity of creation to fully comprehend."},
  {num:35,ar:"الْغَفُورُ",trans:"Al-Ghafur",mean:"The All-Forgiving",cat:"Forgiveness",desc:"The one who forgives all sins — no matter how great — for whoever turns to Him in sincere repentance."},
  {num:36,ar:"الشَّكُورُ",trans:"Ash-Shakur",mean:"The Appreciative",cat:"Generosity",desc:"The one who appreciates and rewards even the smallest good deeds. He multiplies rewards far beyond what is deserved."},
  {num:37,ar:"الْعَلِيُّ",trans:"Al-Ali",mean:"The Most High",cat:"Greatness",desc:"The one who is above all things in His essence, His attributes, and His power. Nothing and no one is above Him."},
  {num:38,ar:"الْكَبِيرُ",trans:"Al-Kabir",mean:"The Most Great",cat:"Greatness",desc:"The one whose greatness is absolute and incomparable. All greatness belongs to Him alone."},
  {num:39,ar:"الْحَفِيظُ",trans:"Al-Hafiz",mean:"The Preserver",cat:"Protection",desc:"The one who preserves and guards all things. He maintains the universe, records all deeds, and protects His servants."},
  {num:40,ar:"الْمُقِيتُ",trans:"Al-Muqit",mean:"The Sustainer",cat:"Generosity",desc:"The one who provides the sustenance needed for every living being. He maintains and nourishes all of creation."},
  {num:41,ar:"الْحَسِيبُ",trans:"Al-Hasib",mean:"The Reckoner",cat:"Justice",desc:"The one who takes account of all deeds and is sufficient for all needs. He is aware of and will account for every single action."},
  {num:42,ar:"الْجَلِيلُ",trans:"Al-Jalil",mean:"The Majestic",cat:"Greatness",desc:"The one who possesses perfect majesty in all His attributes — His knowledge, power, and grandeur."},
  {num:43,ar:"الْكَرِيمُ",trans:"Al-Karim",mean:"The Generous",cat:"Generosity",desc:"The one of infinite generosity who gives without limit and without being asked. His generosity has no end."},
  {num:44,ar:"الرَّقِيبُ",trans:"Ar-Raqib",mean:"The Watchful",cat:"Protection",desc:"The one who watches over all things at all times. Nothing escapes His surveillance — He is ever watchful over every soul."},
  {num:45,ar:"الْمُجِيبُ",trans:"Al-Mujib",mean:"The Responsive",cat:"Mercy",desc:"The one who answers and responds to every supplication. He hears every call and responds to whoever calls upon Him."},
  {num:46,ar:"الْوَاسِعُ",trans:"Al-Wasi",mean:"The All-Encompassing",cat:"Greatness",desc:"The one whose knowledge, mercy, and provision are vast and all-encompassing. His capacity and generosity are without limit."},
  {num:47,ar:"الْحَكِيمُ",trans:"Al-Hakim",mean:"The All-Wise",cat:"Knowledge",desc:"The one whose wisdom is perfect and whose every act contains profound wisdom, even when not apparent to human understanding."},
  {num:48,ar:"الْوَدُودُ",trans:"Al-Wadud",mean:"The Loving",cat:"Mercy",desc:"The one who loves His believing servants and is loved by them. His love for the believers is real, deep, and everlasting."},
  {num:49,ar:"الْمَجِيدُ",trans:"Al-Majid",mean:"The Most Glorious",cat:"Greatness",desc:"The one who combines perfect greatness with perfect generosity. He is glorious in His essence, attributes, and actions."},
  {num:50,ar:"الْبَاعِثُ",trans:"Al-Ba'ith",mean:"The Resurrector",cat:"Power",desc:"The one who will resurrect all creation after death on the Day of Judgment. He brings the dead back to life."},
  {num:51,ar:"الشَّهِيدُ",trans:"Ash-Shahid",mean:"The Witness",cat:"Knowledge",desc:"The one who witnesses all things at all times. He is present with His knowledge and nothing occurs without His witnessing it."},
  {num:52,ar:"الْحَقُّ",trans:"Al-Haqq",mean:"The Truth",cat:"Essence",desc:"The one who is the absolute truth — in His existence, His attributes, and His promises. Everything other than Allah is contingent."},
  {num:53,ar:"الْوَكِيلُ",trans:"Al-Wakil",mean:"The Trustee",cat:"Protection",desc:"The one in whom all trust is placed. Whoever places their affairs in His hands will find He is the best disposer of them."},
  {num:54,ar:"الْقَوِيُّ",trans:"Al-Qawi",mean:"The All-Powerful",cat:"Power",desc:"The one whose power is perfect and complete. He is never weak, never tired, and His strength knows no limit."},
  {num:55,ar:"الْمَتِينُ",trans:"Al-Matin",mean:"The Firm",cat:"Power",desc:"The one whose power and firmness are unshakeable. His strength is absolute and He cannot be weakened or overcome."},
  {num:56,ar:"الْوَلِيُّ",trans:"Al-Wali",mean:"The Protecting Friend",cat:"Protection",desc:"The one who is the ally and protector of the believers. He supports them, loves them, and takes care of their affairs."},
  {num:57,ar:"الْحَمِيدُ",trans:"Al-Hamid",mean:"The Praiseworthy",cat:"Greatness",desc:"The one who is deserving of all praise. All praise ultimately returns to Him whether or not creation acknowledges it."},
  {num:58,ar:"الْمُحْصِيُّ",trans:"Al-Muhsi",mean:"The All-Enumerating",cat:"Knowledge",desc:"The one who has counted and recorded everything in precise detail. Not a single thing in creation escapes His count."},
  {num:59,ar:"الْمُبْدِئُ",trans:"Al-Mubdi",mean:"The Originator",cat:"Creation",desc:"The one who begins and originates creation from nothing, without any prior model or example."},
  {num:60,ar:"الْمُعِيدُ",trans:"Al-Mu'id",mean:"The Restorer",cat:"Creation",desc:"The one who brings creation back after it ceases to exist — who will restore and resurrect everything on the Day of Judgment."},
  {num:61,ar:"الْمُحْيِي",trans:"Al-Muhyi",mean:"The Giver of Life",cat:"Power",desc:"The one who gives life to whatever He wills. He gave us life in this world and will give us life again after death."},
  {num:62,ar:"الْمُمِيتُ",trans:"Al-Mumit",mean:"The Creator of Death",cat:"Power",desc:"The one who causes death at the appointed time. Death is under His command alone and no one can escape it."},
  {num:63,ar:"الْحَيُّ",trans:"Al-Hayy",mean:"The Ever-Living",cat:"Essence",desc:"The one whose life has no beginning and no end. He is eternally alive and His life is unlike anything in creation."},
  {num:64,ar:"الْقَيُّومُ",trans:"Al-Qayyum",mean:"The Self-Sustaining",cat:"Essence",desc:"The one who sustains all of existence and who Himself needs nothing. He is the sustainer of all, sustained by none."},
  {num:65,ar:"الْوَاجِدُ",trans:"Al-Wajid",mean:"The Finder / All-Perceiving",cat:"Knowledge",desc:"The one who finds and perceives everything. He is never in need and never lacks anything He wills."},
  {num:66,ar:"الْمَاجِدُ",trans:"Al-Majid",mean:"The All-Glorious",cat:"Greatness",desc:"The one who is noble, bountiful, and glorious. He is generous and His glory is boundless."},
  {num:67,ar:"الْوَاحِدُ",trans:"Al-Wahid",mean:"The One",cat:"Essence",desc:"The one who is unique and singular. He has no partner, no equal, and no rival in any of His attributes."},
  {num:68,ar:"الأَحَدُ",trans:"Al-Ahad",mean:"The Unique",cat:"Essence",desc:"The one who is absolutely and completely unique in every sense. There is nothing like Him and nothing comparable to Him."},
  {num:69,ar:"الصَّمَدُ",trans:"As-Samad",mean:"The Eternal / Self-Sufficient",cat:"Essence",desc:"The one to whom all creation turns in need, while He Himself is in need of nothing. He is the master who is depended upon."},
  {num:70,ar:"الْقَادِرُ",trans:"Al-Qadir",mean:"The All-Capable",cat:"Power",desc:"The one who has power over all things. He can do whatever He wills and nothing is beyond His capability."},
  {num:71,ar:"الْمُقْتَدِرُ",trans:"Al-Muqtadir",mean:"The Powerful",cat:"Power",desc:"The one who executes His power and carries out what He wills with perfect effectiveness. His power is enacted and active."},
  {num:72,ar:"الْمُقَدِّمُ",trans:"Al-Muqaddim",mean:"The Expediter",cat:"Balance",desc:"The one who brings forward what He wills and places things in their proper priority according to His wisdom."},
  {num:73,ar:"الْمُؤَخِّرُ",trans:"Al-Mu'akhkhir",mean:"The Delayer",cat:"Balance",desc:"The one who delays and puts back what He wills. He places things in their proper time according to His perfect knowledge."},
  {num:74,ar:"الأَوَّلُ",trans:"Al-Awwal",mean:"The First",cat:"Essence",desc:"The one who is first with no beginning before Him. He existed before everything and nothing preceded Him."},
  {num:75,ar:"الآخِرُ",trans:"Al-Akhir",mean:"The Last",cat:"Essence",desc:"The one who remains after everything perishes. He has no end and will remain after all of creation ceases to exist."},
  {num:76,ar:"الظَّاهِرُ",trans:"Az-Zahir",mean:"The Manifest",cat:"Essence",desc:"The one who is apparent and above all things. He is manifest through His signs, His creation, and His power."},
  {num:77,ar:"الْبَاطِنُ",trans:"Al-Batin",mean:"The Hidden",cat:"Essence",desc:"The one who is hidden from the perception of creation. His essence cannot be perceived by the senses or comprehended by the mind."},
  {num:78,ar:"الْوَالِي",trans:"Al-Wali",mean:"The Governor",cat:"Sovereignty",desc:"The one who governs and administers all of creation. He manages the affairs of the universe in perfect order."},
  {num:79,ar:"الْمُتَعَالِي",trans:"Al-Muta'ali",mean:"The Most Exalted",cat:"Greatness",desc:"The one who is exalted far above anything that creation can attribute to Him. He transcends all comparison and limitation."},
  {num:80,ar:"الْبَرُّ",trans:"Al-Barr",mean:"The Source of Goodness",cat:"Mercy",desc:"The one who is kind and good to His servants. He fulfils His promises and shows perfect goodness to those who believe."},
  {num:81,ar:"التَّوَّابُ",trans:"At-Tawwab",mean:"The Accepter of Repentance",cat:"Forgiveness",desc:"The one who accepts repentance and turns to the repentant with mercy. He loves those who repent and return to Him."},
  {num:82,ar:"الْمُنْتَقِمُ",trans:"Al-Muntaqim",mean:"The Avenger",cat:"Justice",desc:"The one who takes retribution from those who persist in wrongdoing and oppression. His justice is always served."},
  {num:83,ar:"الْعَفُوُّ",trans:"Al-Afuw",mean:"The Pardoner",cat:"Forgiveness",desc:"The one who pardons and erases sins entirely, leaving no trace of them. His pardon is complete and absolute."},
  {num:84,ar:"الرَّؤُوفُ",trans:"Ar-Ra'uf",mean:"The Most Kind",cat:"Mercy",desc:"The one who shows the deepest and most tender kindness. His compassion for His creation is profound and gentle."},
  {num:85,ar:"مَالِكُ الْمُلْكِ",trans:"Malik Al-Mulk",mean:"Owner of All Sovereignty",cat:"Sovereignty",desc:"The one who possesses and controls all dominion. He gives power to whom He wills and takes it from whom He wills."},
  {num:86,ar:"ذُو الْجَلَالِ وَالإِكْرَامِ",trans:"Dhul-Jalali Wal-Ikram",mean:"Lord of Majesty and Bounty",cat:"Greatness",desc:"The one who combines supreme majesty with supreme generosity. He is to be glorified and called upon by this name."},
  {num:87,ar:"الْمُقْسِطُ",trans:"Al-Muqsit",mean:"The Equitable",cat:"Justice",desc:"The one who is perfectly equitable and just in all His dealings. He will settle all accounts with complete fairness."},
  {num:88,ar:"الْجَامِعُ",trans:"Al-Jami",mean:"The Gatherer",cat:"Power",desc:"The one who gathers all of creation on the Day of Judgment. He brings together what He wills when He wills."},
  {num:89,ar:"الْغَنِيُّ",trans:"Al-Ghani",mean:"The Self-Sufficient",cat:"Essence",desc:"The one who is free from all need. He does not need creation at all, while all of creation is in constant need of Him."},
  {num:90,ar:"الْمُغْنِي",trans:"Al-Mughni",mean:"The Enricher",cat:"Generosity",desc:"The one who enriches and fulfils the needs of His creation. He makes rich whoever He wills from His infinite treasures."},
  {num:91,ar:"الْمَانِعُ",trans:"Al-Mani",mean:"The Withholder",cat:"Balance",desc:"The one who withholds what He wills. When He withholds, it is an act of wisdom and mercy, not deprivation."},
  {num:92,ar:"الضَّارُّ",trans:"Ad-Darr",mean:"The Distresser",cat:"Balance",desc:"The one who allows harm to reach whoever He wills as a test, a lesson, or a consequence. Harm only occurs by His will."},
  {num:93,ar:"النَّافِعُ",trans:"An-Nafi",mean:"The Benefiter",cat:"Generosity",desc:"The one who causes benefit to reach whoever He wills. All benefit and good in the world comes from Him alone."},
  {num:94,ar:"النُّورُ",trans:"An-Nur",mean:"The Light",cat:"Essence",desc:"The one who is the light of the heavens and the earth. His light illuminates the hearts of the believers and the entire universe."},
  {num:95,ar:"الْهَادِي",trans:"Al-Hadi",mean:"The Guide",cat:"Mercy",desc:"The one who guides whoever He wills to the straight path. Guidance of the heart and soul belongs entirely to Him."},
  {num:96,ar:"الْبَدِيعُ",trans:"Al-Badi",mean:"The Incomparable Originator",cat:"Creation",desc:"The one who creates in a wondrous and incomparable way with no prior model. His creation is uniquely beautiful."},
  {num:97,ar:"الْبَاقِي",trans:"Al-Baqi",mean:"The Ever-Lasting",cat:"Essence",desc:"The one who endures forever with no end. While all creation perishes, He remains eternal and everlasting."},
  {num:98,ar:"الْوَارِثُ",trans:"Al-Warith",mean:"The Inheritor",cat:"Sovereignty",desc:"The one who inherits the earth and all it contains after creation perishes. Everything returns to Him in the end."},
  {num:99,ar:"الرَّشِيدُ",trans:"Ar-Rashid",mean:"The Guide to the Right Path",cat:"Knowledge",desc:"The one who directs all affairs with perfect wisdom and guides His creation to what is right and correct."},
]

const nameCategories = ['All', 'Essence', 'Mercy', 'Power', 'Knowledge', 'Forgiveness', 'Justice', 'Greatness', 'Creation', 'Generosity', 'Protection', 'Sovereignty', 'Balance', 'Perfection']
let activeNameCat = 'All'
let filteredAllahNames = [...allahNames]

function renderNamesPage() {
  // Filter tabs
  document.getElementById('names-filter').innerHTML = nameCategories.map(c =>
    `<button class="names-filter-btn ${c === activeNameCat ? 'active' : ''}" onclick="setNameCat('${c}')">${c}</button>`
  ).join('')
  // Grid
  document.getElementById('names-grid').innerHTML = filteredAllahNames.map(n => `
    <div class="name-card" onclick="showNameDetail(${n.num})">
      <div class="name-ar">${n.ar}</div>
      <div class="name-trans">${n.trans}</div>
      <div class="name-mean">${n.mean}</div>
      <div class="name-num">${n.num} of 99</div>
    </div>`).join('')
}

function setNameCat(cat) {
  activeNameCat = cat
  applyNameFilter()
}

function filterNames() {
  applyNameFilter()
}

function applyNameFilter() {
  const q = document.getElementById('names-search').value.toLowerCase()
  filteredAllahNames = allahNames.filter(n => {
    const matchCat = activeNameCat === 'All' || n.cat === activeNameCat
    const matchQ = !q || n.trans.toLowerCase().includes(q) || n.mean.toLowerCase().includes(q) || n.ar.includes(q)
    return matchCat && matchQ
  })
  renderNamesPage()
}

function showNameDetail(num) {
  const n = allahNames.find(x => x.num === num)
  const panel = document.getElementById('name-detail-panel')
  panel.style.display = 'block'
  panel.innerHTML = `
    <div class="name-detail">
      <div class="name-detail-ar">${n.ar}</div>
      <div class="name-detail-trans">${n.trans} · ${n.num} of 99</div>
      <div class="name-detail-mean">${n.mean}</div>
      <div class="name-detail-desc">${n.desc}</div>
      <div class="name-detail-ref">${n.cat}</div>
    </div>`
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
}


// ─── DUA COLLECTION ──────────────────────────────────────────────────────────
const duaCategories = [
  {
    id:"morning", icon:"🌅", name:"Morning Adhkar", desc:"Start your day with protection and remembrance",
    duas:[
      {title:"Dua upon waking up", ar:"الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", trans:"Alhamdu lillahil-ladhi ahyana ba\'da ma amatana wa ilayhin-nushur", mean:"All praise is for Allah who gave us life after having taken it from us and unto Him is the resurrection.", src:"Bukhari"},
      {title:"Dua for leaving the house", ar:"بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", trans:"Bismillah, tawakkaltu alallah, wa la hawla wa la quwwata illa billah", mean:"In the name of Allah, I place my trust in Allah, and there is no might nor power except with Allah.", src:"Abu Dawud & Tirmidhi"},
      {title:"Morning protection", ar:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ", trans:"A\'udhu bikalimatillahit-tammati min sharri ma khalaq", mean:"I seek refuge in the perfect words of Allah from the evil of what He has created.", src:"Muslim"},
      {title:"Sayyid al-Istighfar", ar:"اللَّهُمَّ أَنْتَ رَبِّي لاَ إِلَهَ إِلاَّ أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ", trans:"Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana abduk", mean:"O Allah, You are my Lord. There is no god but You. You created me and I am Your slave.", src:"Bukhari"},
      {title:"Morning remembrance", ar:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ", trans:"Asbahna wa asbahal mulku lillah, walhamdu lillah", mean:"We have entered a new morning and with it all dominion belongs to Allah, and all praise is for Allah.", src:"Muslim"},
    ]
  },
  {
    id:"evening", icon:"🌙", name:"Evening Adhkar", desc:"End your day with remembrance and protection",
    duas:[
      {title:"Evening remembrance", ar:"أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ", trans:"Amsayna wa amsal mulku lillah, walhamdu lillah", mean:"We have entered the evening and with it all dominion belongs to Allah, and all praise is for Allah.", src:"Muslim"},
      {title:"Dua before sleeping", ar:"اللَّهُمَّ بِاسْمِكَ أَمُوتُ وَأَحْيَا", trans:"Allahumma bismika amutu wa ahya", mean:"O Allah, in Your name I die and I live.", src:"Bukhari"},
      {title:"Ayatul Kursi before sleep", ar:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", trans:"Allahu la ilaha illa huwal-hayyul-qayyum", mean:"Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Recite the full Ayatul Kursi.", src:"Bukhari"},
      {title:"Protection at night", ar:"بِسْمِكَ اللَّهُمَّ أَضَعُ جَنْبِي وَبِكَ أَرْفَعُهُ", trans:"Bismika allahumma ada\'u janbi, wa bika arfa\'uh", mean:"In Your name O Allah, I lay down my side, and in Your name I raise it.", src:"Bukhari & Muslim"},
      {title:"Tasbih before sleep", ar:"سُبْحَانَ اللَّهِ — الْحَمْدُ لِلَّهِ — اللَّهُ أَكْبَرُ", trans:"SubhanAllah 33x — Alhamdulillah 33x — Allahu Akbar 34x", mean:"Glory be to Allah — All praise is for Allah — Allah is the Greatest. Say this before sleeping, it is better than a servant.", src:"Bukhari & Muslim"},
    ]
  },
  {
    id:"salah", icon:"🕌", name:"Prayer (Salah)", desc:"Duas before, during, and after salah",
    duas:[
      {title:"Opening dua in salah", ar:"سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ وَتَبَارَكَ اسْمُكَ وَتَعَالَى جَدُّكَ وَلَا إِلَهَ غَيْرُكَ", trans:"Subhanakal-lahumma wa bihamdika wa tabarakasmuka wa ta\'ala jadduka wa la ilaha ghayruk", mean:"How perfect You are O Allah, and I praise You. Blessed is Your name and exalted is Your majesty. There is no god but You.", src:"Abu Dawud & Tirmidhi"},
      {title:"Dua in ruku", ar:"سُبْحَانَ رَبِّيَ الْعَظِيمِ", trans:"Subhana Rabbiyal-Azim", mean:"How perfect is my Lord, the Most Great.", src:"Muslim"},
      {title:"Rising from ruku", ar:"رَبَّنَا وَلَكَ الْحَمْدُ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ", trans:"Rabbana wa lakal-hamd, hamdan kathiran tayyiban mubarakan fih", mean:"Our Lord, to You is all praise — an abundant, beautiful, blessed praise.", src:"Bukhari"},
      {title:"Dua in sujud", ar:"سُبْحَانَ رَبِّيَ الأَعْلَى", trans:"Subhana Rabbiyal-A\'la", mean:"How perfect is my Lord, the Most High.", src:"Muslim"},
      {title:"Between the two sujud", ar:"رَبِّ اغْفِرْ لِي رَبِّ اغْفِرْ لِي", trans:"Rabbighfir li, rabbighfir li", mean:"My Lord, forgive me. My Lord, forgive me.", src:"Ibn Majah"},
      {title:"After salah — Ayatul Kursi", ar:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ", trans:"Allahu la ilaha illa huwal-hayyul-qayyum", mean:"Recite Ayatul Kursi after every salah — nothing stands between you and Jannah except death.", src:"Nasa\'i"},
    ]
  },
  {
    id:"food", icon:"🍽️", name:"Eating & Drinking", desc:"Duas before and after meals",
    duas:[
      {title:"Before eating", ar:"بِسْمِ اللَّهِ", trans:"Bismillah", mean:"In the name of Allah. If you forget at the beginning say: Bismillahi fi awwalihi wa akhirihi.", src:"Abu Dawud & Tirmidhi"},
      {title:"Before eating (full)", ar:"اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْرًا مِنْهُ", trans:"Allahumma barik lana fihi wa at\'imna khayran minh", mean:"O Allah, bless it for us and feed us something better than it.", src:"Tirmidhi"},
      {title:"After eating", ar:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مِنَ الْمُسْلِمِينَ", trans:"Alhamdu lillahil-ladhi at\'amana wa saqana wa ja\'alana minal-muslimin", mean:"All praise is for Allah who fed us and gave us drink and made us Muslims.", src:"Abu Dawud & Tirmidhi"},
      {title:"Dua when breaking fast", ar:"اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ", trans:"Allahumma laka sumtu wa ala rizqika aftartu", mean:"O Allah, for You I fasted and upon Your provision I break my fast.", src:"Abu Dawud"},
    ]
  },
  {
    id:"travel", icon:"✈️", name:"Travel", desc:"Duas for journeys and returning home",
    duas:[
      {title:"Dua for travelling", ar:"اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا", trans:"Allahu akbar x3. Subhanal-ladhi sakhkhara lana hadha wa ma kunna lahu muqrinin", mean:"Allah is the Greatest x3. How perfect He is, the One who has subjected this for us — for we ourselves could not have done it.", src:"Muslim"},
      {title:"Dua when returning home", ar:"آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ", trans:"Ayibuna ta\'ibuna abiduna lirabbina hamidun", mean:"We return, we repent, we worship and we praise our Lord.", src:"Muslim"},
      {title:"Dua for riding a vehicle", ar:"بِسْمِ اللَّهِ، الْحَمْدُ لِلَّهِ، سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا", trans:"Bismillah, alhamdulillah, subhanal-ladhi sakhkhara lana hadha", mean:"In the name of Allah, all praise to Allah, how perfect He is who has subjected this for us.", src:"Abu Dawud & Tirmidhi"},
    ]
  },
  {
    id:"anxiety", icon:"💙", name:"Anxiety & Hardship", desc:"Duas for difficult times and seeking ease",
    duas:[
      {title:"Dua for anxiety and grief", ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ", trans:"Allahumma inni a\'udhu bika minal-hammi wal-hazan, wal-ajzi wal-kasal, wal-bukhli wal-jubn", mean:"O Allah, I seek refuge in You from worry and grief, from incapacity and laziness, from miserliness and cowardice, and from the burden of debt.", src:"Bukhari"},
      {title:"Dua of Prophet Yunus", ar:"لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ", trans:"La ilaha illa anta subhanaka inni kuntu minaz-zalimin", mean:"There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.", src:"Quran 21:87"},
      {title:"For relief from hardship", ar:"اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا", trans:"Allahumma la sahla illa ma ja\'altahu sahla, wa anta taj\'alul hazna idha shi\'ta sahla", mean:"O Allah, there is no ease except what You make easy. And You make the difficult, if You wish, easy.", src:"Ibn Hibban"},
      {title:"Dua for strength", ar:"حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ", trans:"Hasbunallahu wa ni\'mal wakil", mean:"Allah is sufficient for us and He is the best disposer of affairs.", src:"Quran 3:173 & Bukhari"},
    ]
  },
  {
    id:"forgiveness", icon:"🌿", name:"Forgiveness & Repentance", desc:"Duas for seeking forgiveness",
    duas:[
      {title:"Sayyid al-Istighfar", ar:"اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ", trans:"Allahumma anta rabbi la ilaha illa ant, khalaqtani wa ana abduk, wa ana ala ahdika wa wa\'dika mastata\'t", mean:"O Allah, You are my Lord, there is no god but You. You created me and I am Your slave. I am committed to Your covenant and promise as much as I can.", src:"Bukhari"},
      {title:"Short istighfar", ar:"أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ", trans:"Astaghfirullahil-azimal-ladhi la ilaha illa huwal-hayyul-qayyumu wa atubu ilaih", mean:"I seek the forgiveness of Allah the Mighty, whom there is no god but He, the Living, the Eternal, and I repent to Him.", src:"Abu Dawud & Tirmidhi"},
      {title:"Dua for forgiveness", ar:"رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ إِنَّكَ أَنْتَ التَّوَّابُ الرَّحِيمُ", trans:"Rabbighfir li wa tub alayya innaka antal-tawwabur-rahim", mean:"My Lord, forgive me and accept my repentance. Indeed You are the Ever-Returning, the Most Merciful.", src:"Ahmad"},
    ]
  },
  {
    id:"parents", icon:"❤️", name:"Parents & Family", desc:"Duas for your parents and loved ones",
    duas:[
      {title:"Dua for parents", ar:"رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا", trans:"Rabbir hamhuma kama rabbayani saghira", mean:"My Lord, have mercy upon them as they raised me when I was small.", src:"Quran 17:24"},
      {title:"Dua for parents (extended)", ar:"اللَّهُمَّ اغْفِرْ لِي وَلِوَالِدَيَّ وَارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا", trans:"Allahummagh-fir li wa liwalidayya war-hamhuma kama rabbayani saghira", mean:"O Allah, forgive me and my parents and have mercy on them as they raised me when I was young.", src:"Quran 17:24"},
      {title:"Dua for good character", ar:"اللَّهُمَّ كَمَا حَسَّنْتَ خَلْقِي فَحَسِّنْ خُلُقِي", trans:"Allahumma kama hassanta khalqi fahassin khuluqi", mean:"O Allah, as You have made my physical form beautiful, make my character beautiful too.", src:"Ahmad"},
    ]
  },
  {
    id:"knowledge", icon:"📚", name:"Knowledge & Study", desc:"Duas for seeking beneficial knowledge",
    duas:[
      {title:"Dua for knowledge", ar:"رَّبِّ زِدْنِي عِلْمًا", trans:"Rabbi zidni ilma", mean:"My Lord, increase me in knowledge.", src:"Quran 20:114"},
      {title:"Before studying", ar:"اللَّهُمَّ انْفَعْنِي بِمَا عَلَّمْتَنِي وَعَلِّمْنِي مَا يَنْفَعُنِي", trans:"Allahumma infa\'ni bima allamtani wa allimni ma yanfa\'uni", mean:"O Allah, benefit me with what You have taught me, and teach me that which will benefit me.", src:"Tirmidhi & Ibn Majah"},
      {title:"Dua for understanding", ar:"رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", trans:"Rabbish-rah li sadri wa yassir li amri", mean:"My Lord, expand for me my chest and ease for me my task.", src:"Quran 20:25-26"},
    ]
  },
  {
    id:"masjid", icon:"🕌", name:"Masjid", desc:"Duas for entering and leaving the masjid",
    duas:[
      {title:"Entering the masjid", ar:"اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ", trans:"Allahummaf-tah li abwaba rahmatik", mean:"O Allah, open for me the gates of Your mercy.", src:"Muslim"},
      {title:"Leaving the masjid", ar:"اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ", trans:"Allahumma inni as\'aluka min fadlik", mean:"O Allah, I ask of You from Your bounty.", src:"Muslim"},
    ]
  },
  {
    id:"health", icon:"💊", name:"Illness & Health", desc:"Duas when sick or visiting the ill",
    duas:[
      {title:"Dua for the sick", ar:"أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ", trans:"As\'alullahul-azima rabbal-arshil-azimi an yashfiyak — say 7 times", mean:"I ask Allah the Mighty, Lord of the Mighty Throne, to cure you. Say 7 times when visiting the sick.", src:"Abu Dawud & Tirmidhi"},
      {title:"Placing hand on pain", ar:"بِسْمِ اللَّهِ — أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ", trans:"Bismillah x3 — A\'udhu billahi wa qudratihi min sharri ma ajidu wa uhadhir x7", mean:"In the name of Allah x3 — I seek refuge in Allah and His power from the evil of what I find and what I fear x7. Place your hand on the area of pain.", src:"Muslim"},
    ]
  },
  {
    id:"quran_dua", icon:"📖", name:"Quranic Duas", desc:"Beautiful duas directly from the Quran",
    duas:[
      {title:"Dua for guidance", ar:"رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِن لَّدُنكَ رَحْمَةً", trans:"Rabbana la tuzigh qulubana ba\'da idh hadaytana wa hab lana milladunka rahmah", mean:"Our Lord, let not our hearts deviate after You have guided us and grant us from Yourself mercy.", src:"Quran 3:8"},
      {title:"Dua for good in both worlds", ar:"رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ", trans:"Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar", mean:"Our Lord, give us good in this world and good in the Hereafter and protect us from the punishment of the Fire.", src:"Quran 2:201"},
      {title:"Dua of Musa", ar:"رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ", trans:"Rabbi inni lima anzalta ilayya min khayrin faqir", mean:"My Lord, indeed I am, for whatever good You would send down to me, in need.", src:"Quran 28:24"},
      {title:"Dua of Yunus", ar:"لَّا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ", trans:"La ilaha illa anta subhanaka inni kuntu minaz-zalimin", mean:"There is no deity except You; exalted are You. Indeed, I have been of the wrongdoers.", src:"Quran 21:87"},
      {title:"Dua for a righteous family", ar:"رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ", trans:"Rabbana hab lana min azwajina wa dhurriyyatina qurrata a\'yunin waj\'alna lil-muttaqina imama", mean:"Our Lord, grant us from among our wives and offspring comfort to our eyes and make us an example for the righteous.", src:"Quran 25:74"},
    ]
  },
  {
    id:"protection", icon:"🛡️", name:"Protection", desc:"Duas for protection from evil and harm",
    duas:[
      {title:"The three Quls", ar:"قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ — قُلْ أَعُوذُ بِرَبِّ النَّاسِ — قُلْ هُوَ اللَّهُ أَحَدٌ", trans:"Qul a\'udhu birabbil-falaq — Qul a\'udhu birabbin-nas — Qul huwallahu ahad", mean:"Recite Surah Al-Ikhlas, Al-Falaq, and An-Nas three times morning and evening — sufficient for you against all things.", src:"Abu Dawud & Tirmidhi"},
      {title:"Against the evil eye", ar:"أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّةِ مِنْ كُلِّ شَيْطَانٍ وَهَامَّةٍ", trans:"A\'udhu bikalimatillahit-tammati min kulli shaytanin wa hammah", mean:"I seek refuge in the perfect words of Allah from every devil and poisonous creature.", src:"Bukhari"},
      {title:"Morning and evening protection", ar:"بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ", trans:"Bismillahil-ladhi la yadurru ma\'asmihi shay\'un fil-ardi wa la fis-sama\'i — say 3 times", mean:"In the name of Allah with whose name nothing can cause harm on earth or in the heavens. Say 3 times morning and evening.", src:"Abu Dawud & Tirmidhi"},
    ]
  },
]

let activeDuaCategory = null

function renderDuasPage() {
  document.getElementById('duas-cat-grid').innerHTML = duaCategories.map(c => `
    <div class="dua-cat-card" onclick="openDuaCategory('${c.id}')">
      <div class="dua-cat-icon">${c.icon}</div>
      <div class="dua-cat-name">${c.name}</div>
      <div class="dua-cat-count">${c.duas.length} duas</div>
    </div>`).join('')
}

function openDuaCategory(id) {
  const cat = duaCategories.find(c => c.id === id)
  activeDuaCategory = cat
  document.getElementById('duas-cats-view').style.display = 'none'
  document.getElementById('duas-list-view').style.display = 'block'
  document.getElementById('duas-list-title').textContent = cat.icon + ' ' + cat.name
  document.getElementById('duas-list-sub').textContent = cat.desc
  document.getElementById('duas-list-items').innerHTML = cat.duas.map(d => `
    <div class="dua-item">
      <div class="dua-item-title">${d.title}</div>
      <div class="dua-item-ar">${d.ar}</div>
      <div class="dua-item-trans">${d.trans}</div>
      <div class="dua-item-mean">${d.mean}</div>
      <div class="dua-item-src">Source: ${d.src}</div>
    </div>`).join('')
}

function backToDuasCats() {
  document.getElementById('duas-cats-view').style.display = 'block'
  document.getElementById('duas-list-view').style.display = 'none'
  document.getElementById('duas-search').value = ''
  document.getElementById('duas-search-results').style.display = 'none'
  activeDuaCategory = null
}

function searchDuas() {
  const q = document.getElementById('duas-search').value.toLowerCase().trim()
  const resultsEl = document.getElementById('duas-search-results')
  if (!q) { resultsEl.style.display = 'none'; return }
  const results = []
  duaCategories.forEach(cat => {
    cat.duas.forEach(d => {
      if (d.title.toLowerCase().includes(q) || d.mean.toLowerCase().includes(q) || d.trans.toLowerCase().includes(q)) {
        results.push({...d, catName: cat.name, catIcon: cat.icon})
      }
    })
  })
  resultsEl.style.display = 'block'
  resultsEl.innerHTML = results.length
    ? results.map(d => `
        <div class="dua-item">
          <div class="dua-item-title">${d.catIcon} ${d.catName} — ${d.title}</div>
          <div class="dua-item-ar">${d.ar}</div>
          <div class="dua-item-trans">${d.trans}</div>
          <div class="dua-item-mean">${d.mean}</div>
          <div class="dua-item-src">Source: ${d.src}</div>
        </div>`).join('')
    : '<div style="padding:20px;text-align:center;color:var(--gm);font-size:13px;">No duas found for that search.</div>'
}


// ─── PROGRESS MONITOR ────────────────────────────────────────────────────────

function renderProgressPage() {
  // ── Totals ──
  const hadithCount = learned.size
  const sunnahCount = sunnahDone.filter(Boolean).length
  const shukrCount = shukrLog.length
  const goalsCount = goals.filter(g => g.done).length
  const total = hadithCount + sunnahCount + shukrCount + goalsCount
  const totalEl = document.getElementById('total-score')
  if (totalEl) totalEl.textContent = total

  const breakdown = document.getElementById('total-breakdown')
  if (breakdown) {
    const items = [
      { num: hadithCount, lbl: 'Hadith' },
      { num: shukrCount, lbl: 'Shukr days' },
      { num: sunnahCount, lbl: 'Sunnahs' },
      { num: goalsCount, lbl: 'Goals done' },
    ]
    breakdown.innerHTML = items.map(i => `
      <div class="total-item">
        <div class="total-item-num">${i.num}</div>
        <div class="total-item-lbl">${i.lbl}</div>
      </div>`).join('')
  }

  // ── Rings ──
  const rings = [
    { label: '40 Hadith', sub: `${hadithCount} / 40`, pct: Math.round(hadithCount / 40 * 100), num: hadithCount },
    { label: 'Sunnah', sub: `${sunnahCount} / 12 today`, pct: Math.round(sunnahCount / 12 * 100), num: sunnahCount },
    { label: 'Shukr', sub: `${shukrCount} days`, pct: Math.min(100, Math.round(shukrCount / 30 * 100)), num: shukrCount },
    { label: 'Goals', sub: `${goalsCount} done`, pct: goals.length ? Math.round(goalsCount / goals.length * 100) : 0, num: goalsCount },
    { label: 'Quran', sub: quranProgress ? `Surah ${quranProgress.surah_number}` : 'Not started', pct: quranProgress ? Math.round(quranProgress.surah_number / 114 * 100) : 0, num: quranProgress?.surah_number || 0 },
    { label: 'Nawawi', sub: `${hadithCount} memorised`, pct: Math.round(hadithCount / 40 * 100), num: hadithCount },
    { label: 'Bookmarks', sub: `${hadithBookmarks.length} saved`, pct: Math.min(100, hadithBookmarks.length * 10), num: hadithBookmarks.length },
    { label: 'Streaks', sub: `${shukrCount} day streak`, pct: Math.min(100, Math.round(shukrCount / 7 * 100)), num: shukrCount },
  ]

  const ringsEl = document.getElementById('prog-rings')
  if (ringsEl) {
    const r = 28, circ = 2 * Math.PI * r
    ringsEl.innerHTML = rings.map(item => {
      const stroke = circ - (item.pct / 100) * circ
      const col = item.pct >= 80 ? 'var(--g)' : item.pct >= 40 ? '#7aaa8a' : 'var(--bd)'
      return `
        <div class="prog-ring-card">
          <div class="prog-ring-wrap">
            <svg class="prog-ring-svg" width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="${r}" fill="none" stroke="var(--gb)" stroke-width="6"/>
              <circle cx="36" cy="36" r="${r}" fill="none" stroke="${col}" stroke-width="6"
                stroke-dasharray="${circ}" stroke-dashoffset="${stroke}"
                stroke-linecap="round"
                style="transition:stroke-dashoffset .8s ease;"/>
            </svg>
            <div class="prog-ring-num">${item.pct}%</div>
          </div>
          <div class="prog-ring-label">${item.label}</div>
          <div class="prog-ring-sub">${item.sub}</div>
        </div>`
    }).join('')
  }

  // ── Activity grid — last 30 days ──
  const today = new Date()
  const days30 = Array.from({length: 30}, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  // Build activity map: date -> count
  const activityMap = {}
  shukrLog.forEach(e => { activityMap[e.date] = (activityMap[e.date] || 0) + 3 })
  sunnahHistory.forEach(e => {
    const done = Array.isArray(e.completions) ? e.completions.filter(Boolean).length : 0
    activityMap[e.date] = (activityMap[e.date] || 0) + done
  })

  const gridEl = document.getElementById('activity-grid')
  const labelsEl = document.getElementById('activity-labels')
  if (gridEl) {
    const maxAct = Math.max(...days30.map(d => activityMap[d] || 0), 1)
    gridEl.style.gridTemplateColumns = `repeat(${days30.length}, 1fr)`
    gridEl.innerHTML = days30.map(d => {
      const val = activityMap[d] || 0
      const intensity = val === 0 ? 0 : val < 3 ? 1 : val < 8 ? 2 : 3
      const bg = ['var(--gb)', '#a8d4b0', '#4a9e6a', 'var(--g)'][intensity]
      const border = intensity === 0 ? 'var(--bd)' : 'transparent'
      const isToday = d === today.toISOString().split('T')[0]
      return `<div class="activity-cell" title="${d}: ${val} deeds"
        style="background:${bg};border:${isToday ? '1.5px solid var(--g)' : `1px solid ${border}`};"></div>`
    }).join('')
  }
  if (labelsEl) {
    const first = days30[0].slice(5), last = days30[29].slice(5)
    labelsEl.innerHTML = `<span>${first}</span><span>Today</span>`
  }

  // ── Bar chart — last 10 days ──
  const days10 = days30.slice(-10)
  const barsEl = document.getElementById('chart-bars')
  if (barsEl) {
    const vals = days10.map(d => activityMap[d] || 0)
    const maxV = Math.max(...vals, 1)
    barsEl.innerHTML = days10.map((d, i) => {
      const v = vals[i]
      const pct = Math.round(v / maxV * 100)
      const col = v === 0 ? 'var(--bd)' : v < 3 ? '#a8d4b0' : v < 8 ? '#4a9e6a' : 'var(--g)'
      const dayLabel = new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)
      const isToday = d === today.toISOString().split('T')[0]
      return `
        <div class="chart-bar-col" title="${d}: ${v} deeds">
          <div class="chart-bar" style="height:${Math.max(pct, 4)}%;background:${col};${isToday ? 'box-shadow:0 0 0 1.5px var(--g);' : ''}"></div>
          <div class="chart-bar-label" style="color:${isToday ? 'var(--g)' : 'var(--gm)'};">${dayLabel}</div>
        </div>`
    }).join('')
  }

  // ── What to improve ──
  const improveEl = document.getElementById('improve-list')
  if (improveEl) {
    const checks = [
      {
        icon: '📖', title: '40 Nawawi Hadith', 
        good: hadithCount >= 40,
        warn: hadithCount > 0 && hadithCount < 40,
        desc: hadithCount >= 40
          ? 'MashaAllah — you have memorised all 40 hadith.'
          : hadithCount > 0
          ? `You have memorised ${hadithCount} of 40. ${40 - hadithCount} remaining — keep going with the flip cards.`
          : 'You have not started the 40 Hadith yet. Open the flip card mode and learn one today.',
        badge: hadithCount >= 40 ? 'Complete' : hadithCount > 0 ? `${hadithCount}/40` : 'Not started'
      },
      {
        icon: '✨', title: 'Daily Shukr',
        good: shukrCount >= 7,
        warn: shukrCount > 0 && shukrCount < 7,
        desc: shukrCount >= 30
          ? `MashaAllah — ${shukrCount} days of shukr. You have built a powerful habit of gratitude.`
          : shukrCount >= 7
          ? `${shukrCount} days logged. Keep it up — consistency is what matters.`
          : shukrCount > 0
          ? `${shukrCount} days logged. Try to write 3 blessings every single day.`
          : 'You have not logged any shukr yet. Open the Shukr Log and write your first 3 blessings.',
        badge: shukrCount >= 30 ? '30 day habit' : shukrCount >= 7 ? '7 day streak' : shukrCount > 0 ? `${shukrCount} days` : 'Not started'
      },
      {
        icon: '☀️', title: 'Sunnah Habits',
        good: sunnahCount >= 10,
        warn: sunnahCount > 0 && sunnahCount < 10,
        desc: sunnahCount >= 12
          ? 'All 12 sunnahs completed today. This is the way of the Prophet ﷺ.'
          : sunnahCount > 0
          ? `${sunnahCount} of 12 sunnahs done today. ${12 - sunnahCount} more to complete your day.`
          : 'No sunnahs checked off today. Start with Bismillah before eating — the easiest one.',
        badge: sunnahCount >= 12 ? 'All 12 done' : sunnahCount > 0 ? `${sunnahCount}/12` : 'Today: 0'
      },
      {
        icon: '📗', title: 'Quran Reading',
        good: Boolean(quranProgress),
        warn: false,
        desc: quranProgress
          ? `You are at Surah ${quranProgress.surah_number} (${quranProgress.surah_name}), Ayah ${quranProgress.ayah_number}. Keep reading — even one page a day completes the Quran in a year.`
          : 'You have not opened the Quran reader yet. Start from Al-Fatihah — it takes less than a minute.',
        badge: quranProgress ? `Surah ${quranProgress.surah_number}/114` : 'Not started'
      },
      {
        icon: '🎯', title: 'Personal Goals',
        good: goals.some(g => g.done),
        warn: goals.length > 0 && !goals.some(g => g.done),
        desc: goals.filter(g => g.done).length > 0
          ? `${goals.filter(g => g.done).length} goal${goals.filter(g => g.done).length > 1 ? 's' : ''} completed. MashaAllah — intention followed by action is the mark of taqwa.`
          : goals.length > 0
          ? `You have ${goals.length} goal${goals.length > 1 ? 's' : ''} set but none completed yet. Take one small step today.`
          : 'No goals set yet. Go to My Goals and pick one thing to work on this week.',
        badge: goals.filter(g => g.done).length > 0 ? `${goals.filter(g => g.done).length} done` : goals.length > 0 ? 'In progress' : 'Not started'
      },
      {
        icon: '🤲', title: 'Hadith Bookmarks',
        good: hadithBookmarks.length >= 5,
        warn: hadithBookmarks.length > 0 && hadithBookmarks.length < 5,
        desc: hadithBookmarks.length >= 5
          ? `${hadithBookmarks.length} hadith saved. Great habit — revisit them regularly.`
          : hadithBookmarks.length > 0
          ? `${hadithBookmarks.length} hadith bookmarked. Browse more collections and save ones that move you.`
          : 'No hadith bookmarked yet. Open a collection and save ones that speak to you.',
        badge: hadithBookmarks.length > 0 ? `${hadithBookmarks.length} saved` : 'None saved'
      },
    ]

    improveEl.innerHTML = checks.map(c => `
      <div class="improve-item ${c.good ? 'good' : ''}">
        <div class="improve-icon">${c.icon}</div>
        <div style="flex:1;">
          <div class="improve-title">${c.title}</div>
          <div class="improve-desc">${c.desc}</div>
        </div>
        <div class="improve-badge ${c.good ? 'good' : c.warn ? 'warn' : 'todo'}">${c.badge}</div>
      </div>`
    ).join('')
  }
}


// ─── EXPOSE TO HTML onclick handlers ─────────────────────────────────────────
window.showLogin = showLogin; window.showSignup = showSignup
window.doLogin = doLogin; window.doSignup = doSignup
window.doGoogle = doGoogle; window.doLogout = doLogout
window.goTo = goTo; window.toggleDark = toggleDark
window.changeQuranFont = changeQuranFont
window.filterSurahs = filterSurahs; window.openSurah = openSurah
window.backToSurahList = backToSurahList; window.navigateSurah = navigateSurah
window.bookmarkAyah = bookmarkAyah
window.saveCheckpoint = saveCheckpoint
window.openCollection = openCollection; window.openBook = openBook
window.backToCollections = backToCollections; window.filterHadiths = filterHadiths
window.toggleHadithBookmark = toggleHadithBookmark
window.switchHadithMode = switchHadithMode
window.toggleHadithExpand = toggleHadithExpand
window.markLearnedFromList = markLearnedFromList; window.startQuiz = startQuiz
window.answerQuiz = answerQuiz; window.flipCard = flipCard; window.markHadith = markHadith
window.loadWord = loadWord; window.loadWordGo = loadWordGo
window.nextWord = nextWord; window.prevWord = prevWord
window.toggleSunnah = toggleSunnah; window.activateGuide = activateGuide
window.saveShukr = saveShukr
window.addGoalFromInput = addGoalFromInput; window.addSuggestion = addSuggestion
window.doneGoal = doneGoal; window.removeGoal = removeGoal; window.setSugCat = setSugCat
window.completeChallenge = completeChallenge
window.renderNamesPage = renderNamesPage
window.renderDuasPage = renderDuasPage
window.renderProgressPage = renderProgressPage
window.openDuaCategory = openDuaCategory
window.backToDuasCats = backToDuasCats
window.searchDuas = searchDuas
window.setNameCat = setNameCat
window.filterNames = filterNames
window.showNameDetail = showNameDetail

// ─── BOOT ─────────────────────────────────────────────────────────────────────
onAuthChange(async (user) => {
  document.getElementById('loading').style.display = 'none'
  if (user) {
    document.getElementById('auth-wrap').style.display = 'none'
    document.getElementById('app-wrap').style.display = 'block'
    await initApp(user)
    renderGoalSuggestions()
  } else {
    document.getElementById('auth-wrap').style.display = 'flex'
    document.getElementById('app-wrap').style.display = 'none'
    showLogin()
  }
})