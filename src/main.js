import {
  supabase, signUp, signIn, signInWithGoogle, signOut, onAuthChange,
  saveHadithProgress, loadHadithProgress, saveSunnahLog, loadTodaySunnah,
  saveShukrEntry, loadShukrLog, saveGoal, loadGoals, toggleGoalDone, deleteGoal,
  saveQuranProgress, loadQuranProgress, saveHadithBookmark, loadHadithBookmarks, deleteHadithBookmark
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
  const [learnedArr, sunnahArr, shukrArr, goalsArr, quranProg, bookmarks] = await Promise.all([
    loadHadithProgress(user.id),
    loadTodaySunnah(user.id),
    loadShukrLog(user.id),
    loadGoals(user.id),
    loadQuranProgress(user.id),
    loadHadithBookmarks(user.id),
  ])
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
  const map = { home:0, quran:1, hadiths:2, nawawi:3, arabic:4, sunnah:5, anger:6, shukr:7, goals:8, badges:9, dedication:10 }
  document.querySelectorAll('.s-item')[map[page]]?.classList.add('active')
}

function toggleDark() {
  const html = document.documentElement
  const isDark = html.getAttribute('data-theme') === 'dark'
  html.setAttribute('data-theme', isDark ? 'light' : 'dark')
  document.getElementById('dark-toggle').textContent = isDark ? '🌙 Dark mode' : '☀️ Light mode'
}

function renderAll() {
  renderHadith()
  renderSunnah()
  renderAnger()
  renderShukrLog()
  renderWords()
  renderGoals()
  renderBadges()
  updateStats()
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
        <div class="ayah-num">Ayah ${v.verse_number} · Surah ${num}</div>
      </div>`).join('')

    if (scrollToAyah) {
      setTimeout(() => {
        const el = document.getElementById('ayah-' + scrollToAyah)
        if (el) el.scrollIntoView({ behavior:'smooth', block:'center' })
      }, 400)
    }

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

// ─── NAWAWI 40 ────────────────────────────────────────────────────────────────
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
  const btn = document.querySelector('.challenge-done')
  btn.textContent = 'Done ✓'; btn.style.opacity = '.5'; btn.disabled = true
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

// ─── EXPOSE TO HTML onclick handlers ─────────────────────────────────────────
window.showLogin = showLogin; window.showSignup = showSignup
window.doLogin = doLogin; window.doSignup = doSignup
window.doGoogle = doGoogle; window.doLogout = doLogout
window.goTo = goTo; window.toggleDark = toggleDark
window.filterSurahs = filterSurahs; window.openSurah = openSurah
window.backToSurahList = backToSurahList; window.navigateSurah = navigateSurah
window.saveCheckpoint = saveCheckpoint
window.openCollection = openCollection; window.openBook = openBook
window.backToCollections = backToCollections; window.filterHadiths = filterHadiths
window.toggleHadithBookmark = toggleHadithBookmark
window.switchHadithMode = switchHadithMode; window.startQuiz = startQuiz
window.answerQuiz = answerQuiz; window.flipCard = flipCard; window.markHadith = markHadith
window.loadWord = loadWord; window.loadWordGo = loadWordGo
window.nextWord = nextWord; window.prevWord = prevWord
window.toggleSunnah = toggleSunnah; window.activateGuide = activateGuide
window.saveShukr = saveShukr
window.addGoalFromInput = addGoalFromInput; window.addSuggestion = addSuggestion
window.doneGoal = doneGoal; window.removeGoal = removeGoal; window.setSugCat = setSugCat
window.completeChallenge = completeChallenge

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