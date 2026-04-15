import { supabase, signUp, signIn, signInWithGoogle, signOut, onAuthChange,
  saveHadithProgress, loadHadithProgress, saveSunnahLog, loadTodaySunnah,
  saveShukrEntry, loadShukrLog, saveGoal, loadGoals, toggleGoalDone, deleteGoal } from './supabase.js'

// ─── HADITH DATA (All 40) ────────────────────────────────────────────────────
const hadithData = [
  {ar:"إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",en:"Actions are judged by intentions, and every person will get what they intended.",src:"Umar ibn Al-Khattab · Bukhari & Muslim"},
  {ar:"الإِسْلَامُ أَنْ تَشْهَدَ أَنْ لَا إِلَهَ إِلَّا اللَّهُ",en:"Islam is to testify that there is no god but Allah and Muhammad is His messenger, to establish prayer, give zakat, fast Ramadan, and perform Hajj if able.",src:"Umar ibn Al-Khattab · Muslim"},
  {ar:"بُنِيَ الإِسْلَامُ عَلَى خَمْسٍ",en:"Islam is built on five pillars: the testimony of faith, establishing prayer, giving zakat, fasting Ramadan, and performing Hajj.",src:"Ibn Umar · Bukhari & Muslim"},
  {ar:"إِنَّ أَحَدَكُمْ يُجْمَعُ خَلْقُهُ فِي بَطْنِ أُمِّهِ أَرْبَعِينَ يَوْمًا",en:"Each of you is formed in your mother's womb for forty days as a drop, then a clot, then a lump — then an angel is sent to breathe the soul into it.",src:"Abdullah ibn Masud · Bukhari & Muslim"},
  {ar:"مَنْ أَحْدَثَ فِي أَمْرِنَا هَذَا مَا لَيْسَ مِنْهُ فَهُوَ رَدٌّ",en:"Whoever introduces into this matter of ours something that is not from it, it is rejected.",src:"Aisha · Bukhari & Muslim"},
  {ar:"الْحَلَالُ بَيِّنٌ وَالْحَرَامُ بَيِّنٌ",en:"The halal is clear and the haram is clear. Between them are doubtful matters. Whoever guards against the doubtful matters has protected his religion and honour.",src:"Nu'man ibn Bashir · Bukhari & Muslim"},
  {ar:"الدِّينُ النَّصِيحَةُ",en:"The religion is sincere advice — to Allah, His Book, His Messenger, the leaders of the Muslims, and their common people.",src:"Tamim Al-Dari · Muslim"},
  {ar:"أُمِرْتُ أَنْ أُقَاتِلَ النَّاسَ حَتَّى يَشْهَدُوا",en:"I have been commanded to fight people until they testify there is no god but Allah and that Muhammad is the Messenger of Allah, establish prayer, and give zakat.",src:"Ibn Umar · Bukhari & Muslim"},
  {ar:"مَا نَهَيْتُكُمْ عَنْهُ فَاجْتَنِبُوهُ",en:"Whatever I have forbidden you, avoid it. Whatever I have commanded you, do as much of it as you are able.",src:"Abu Hurairah · Bukhari & Muslim"},
  {ar:"إِنَّ اللَّهَ طَيِّبٌ لَا يَقْبَلُ إِلَّا طَيِّبًا",en:"Allah is pure and accepts only what is pure. He commanded the believers as He commanded the messengers: eat from the good things and do righteous deeds.",src:"Abu Hurairah · Muslim"},
  {ar:"دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ",en:"Leave what makes you doubt for what does not make you doubt. Truthfulness brings tranquility and lying brings doubt.",src:"Al-Hasan ibn Ali · Tirmidhi & Nasa'i"},
  {ar:"مِنْ حُسْنِ إِسْلَامِ الْمَرْءِ تَرْكُهُ مَا لَا يَعْنِيهِ",en:"Part of the perfection of someone's Islam is his leaving alone that which does not concern him.",src:"Abu Hurairah · Tirmidhi"},
  {ar:"لَا يُؤْمِنُ أَحَدُكُمْ حَتَّى يُحِبَّ لِأَخِيهِ مَا يُحِبُّ لِنَفْسِهِ",en:"None of you truly believes until he loves for his brother what he loves for himself.",src:"Anas ibn Malik · Bukhari & Muslim"},
  {ar:"لَا يَحِلُّ دَمُ امْرِئٍ مُسْلِمٍ",en:"It is not permissible to shed the blood of a Muslim except in three cases: the divorced married fornicator, a life for a life, and one who leaves his religion.",src:"Ibn Masud · Bukhari & Muslim"},
  {ar:"مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ",en:"Whoever believes in Allah and the Last Day, let him say something good or keep silent. Let him honour his neighbour. Let him honour his guest.",src:"Abu Hurairah · Bukhari & Muslim"},
  {ar:"لَا تَغْضَبْ",en:"Do not get angry. The man asked repeatedly and the Prophet kept saying: do not get angry.",src:"Abu Hurairah · Bukhari"},
  {ar:"إِذَا حَكَمْتَ فَاعْدِلْ",en:"If you judge between people, judge with justice. If you speak, speak truthfully. If you promise, fulfil it.",src:"Ibn Abbas · Bayhaqi"},
  {ar:"اتَّقِ اللَّهَ حَيْثُمَا كُنْتَ",en:"Fear Allah wherever you are, follow up a bad deed with a good deed to wipe it out, and treat people with good character.",src:"Abu Dharr & Muadh · Tirmidhi"},
  {ar:"احْفَظِ اللَّهَ يَحْفَظْكَ",en:"Guard Allah and He will guard you. Guard Allah and you will find Him before you. Know Allah in ease and He will know you in difficulty.",src:"Ibn Abbas · Tirmidhi"},
  {ar:"اسْتَعِنْ بِاللَّهِ وَلَا تَعْجِزْ",en:"Seek help from Allah and do not be incapable. If something afflicts you, do not say: if only I had done such and such. Rather say: Allah decreed it and He does what He wills.",src:"Abu Hurairah · Muslim"},
  {ar:"الزُّهْدُ فِي الدُّنْيَا يُرِيحُ الْقَلْبَ وَالْبَدَنَ",en:"Detachment from the dunya brings rest to the heart and body. Desiring the dunya brings sadness and grief.",src:"Ibn Masud · Bayhaqi"},
  {ar:"إِنَّكَ لَنْ تَدَعَ شَيْئًا لِلَّهِ عَزَّ وَجَلَّ إِلَّا بَدَّلَكَ اللَّهُ بِهِ مَا هُوَ خَيْرٌ لَكَ مِنْهُ",en:"You will never leave something for the sake of Allah except that Allah will replace it for you with something better.",src:"Ahmad"},
  {ar:"الطَّهُورُ شَطْرُ الْإِيمَانِ",en:"Purification is half of faith. Alhamdulillah fills the scale. SubhanAllah and Alhamdulillah fill what is between the heavens and the earth.",src:"Abu Malik Al-Ash'ari · Muslim"},
  {ar:"مَا مِنْ أَيَّامٍ الْعَمَلُ الصَّالِحُ فِيهَا أَحَبُّ إِلَى اللَّهِ مِنْ هَذِهِ الْعَشْرِ",en:"There are no days in which righteous deeds are more beloved to Allah than the first ten days of Dhul Hijjah.",src:"Ibn Abbas · Bukhari"},
  {ar:"كُلُّ مَعْرُوفٍ صَدَقَةٌ",en:"Every act of goodness is sadaqah.",src:"Jabir · Muslim"},
  {ar:"لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ",en:"The strong man is not the one who overpowers others. The strong man is the one who controls himself when angry.",src:"Abu Hurairah · Bukhari & Muslim"},
  {ar:"الْبِرُّ حُسْنُ الْخُلُقِ",en:"Righteousness is good character. Sin is what wavers in your chest and you dislike people knowing about it.",src:"An-Nawwas ibn Sam'an · Muslim"},
  {ar:"مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ",en:"Whoever treads a path seeking knowledge, Allah will make easy for him a path to Jannah.",src:"Abu Hurairah · Muslim"},
  {ar:"إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ",en:"Allah loves that when one of you does a deed, he does it with excellence.",src:"Aisha · Bayhaqi"},
  {ar:"خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ",en:"The best of you are those who learn the Quran and teach it.",src:"Uthman ibn Affan · Bukhari"},
  {ar:"لَا ضَرَرَ وَلَا ضِرَارَ",en:"There should be no harm and no reciprocating harm.",src:"Ibn Abbas · Ibn Majah & Malik"},
  {ar:"اجْعَلِ الدُّنْيَا فِي يَدِكَ لَا فِي قَلْبِكَ",en:"Make the dunya in your hand, not in your heart.",src:"Ali ibn Abi Talib"},
  {ar:"مَنْ رَأَى مِنْكُمْ مُنْكَرًا فَلْيُغَيِّرْهُ بِيَدِهِ",en:"Whoever among you sees an evil, let him change it with his hand. If he cannot, then with his tongue. If he cannot, then with his heart — and that is the weakest of faith.",src:"Abu Said Al-Khudri · Muslim"},
  {ar:"مَنْ دَلَّ عَلَى خَيْرٍ فَلَهُ مِثْلُ أَجْرِ فَاعِلِهِ",en:"Whoever guides someone to goodness will have a reward equal to the one who did it.",src:"Abu Masud · Muslim"},
  {ar:"إِنَّمَا الصَّبْرُ عِنْدَ الصَّدْمَةِ الْأُولَى",en:"True patience is at the first strike of calamity.",src:"Anas ibn Malik · Bukhari & Muslim"},
  {ar:"إِنَّ اللَّهَ لَا يَنْظُرُ إِلَى صُوَرِكُمْ وَأَمْوَالِكُمْ",en:"Allah does not look at your forms or your wealth, but He looks at your hearts and your deeds.",src:"Abu Hurairah · Muslim"},
  {ar:"الْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُونَ مِنْ لِسَانِهِ وَيَدِهِ",en:"A Muslim is the one from whose tongue and hand the Muslims are safe.",src:"Abdullah ibn Amr · Bukhari & Muslim"},
  {ar:"لَا يَشْكُرُ اللَّهَ مَنْ لَا يَشْكُرُ النَّاسَ",en:"He who does not thank people has not thanked Allah.",src:"Abu Hurairah · Abu Dawud & Tirmidhi"},
  {ar:"خَيْرُ الناسِ أَنفَعُهُمْ لِلنَّاسِ",en:"The best of people are those most beneficial to people.",src:"Jabir · Tabarani"},
  {ar:"كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ",en:"Be in this world as if you were a stranger or a traveller passing through.",src:"Ibn Umar · Bukhari"},
]

// ─── ARABIC WORDS (30 words) ─────────────────────────────────────────────────
const arabicWords = [
  {ar:"صَبْر",trans:"Sabr",mean:"Patience",cat:"Character",exAr:"وَاللَّهُ يُحِبُّ الصَّابِرِينَ",exEn:"And Allah loves the patient. — Surah Ali Imran 3:146"},
  {ar:"شُكْر",trans:"Shukr",mean:"Gratitude",cat:"Character",exAr:"لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",exEn:"If you are grateful, I will surely increase you. — Surah Ibrahim 14:7"},
  {ar:"تَوَكُّل",trans:"Tawakkul",mean:"Trust in Allah",cat:"Faith",exAr:"وَعَلَى اللَّهِ فَتَوَكَّلُوا",exEn:"And upon Allah rely. — Surah Al-Ma'idah 5:23"},
  {ar:"إِخْلَاص",trans:"Ikhlas",mean:"Sincerity",cat:"Character",exAr:"إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",exEn:"Actions are judged by intentions. — Bukhari & Muslim"},
  {ar:"رَحْمَة",trans:"Rahmah",mean:"Mercy",cat:"Divine Attribute",exAr:"وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ",exEn:"My mercy encompasses all things. — Surah Al-A'raf 7:156"},
  {ar:"تَقْوَى",trans:"Taqwa",mean:"God-consciousness",cat:"Faith",exAr:"إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ",exEn:"The most noble of you is the most righteous. — Surah Al-Hujurat 49:13"},
  {ar:"نِيَّة",trans:"Niyyah",mean:"Intention",cat:"Practice",exAr:"إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",exEn:"Actions are judged by intentions. — Bukhari"},
  {ar:"دُعَاء",trans:"Du'a",mean:"Supplication",cat:"Worship",exAr:"ادْعُونِي أَسْتَجِبْ لَكُمْ",exEn:"Call upon Me; I will respond. — Surah Ghafir 40:60"},
  {ar:"ذِكْر",trans:"Dhikr",mean:"Remembrance of Allah",cat:"Worship",exAr:"أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",exEn:"Verily, in the remembrance of Allah do hearts find rest. — Surah Ar-Ra'd 13:28"},
  {ar:"عِلْم",trans:"Ilm",mean:"Knowledge",cat:"Virtue",exAr:"اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",exEn:"Read in the name of your Lord who created. — Surah Al-Alaq 96:1"},
  {ar:"تَوْبَة",trans:"Tawbah",mean:"Repentance",cat:"Faith",exAr:"إِنَّ اللَّهَ يُحِبُّ التَّوَّابِينَ",exEn:"Indeed Allah loves those who repent. — Surah Al-Baqarah 2:222"},
  {ar:"صِدْق",trans:"Sidq",mean:"Truthfulness",cat:"Character",exAr:"يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَكُونُوا مَعَ الصَّادِقِينَ",exEn:"O believers! Fear Allah and be with the truthful. — Surah At-Tawbah 9:119"},
  {ar:"عَدْل",trans:"Adl",mean:"Justice",cat:"Virtue",exAr:"إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ",exEn:"Indeed Allah commands justice and excellence. — Surah An-Nahl 16:90"},
  {ar:"إِحْسَان",trans:"Ihsan",mean:"Excellence / Doing good",cat:"Virtue",exAr:"إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ",exEn:"Indeed Allah loves the doers of good. — Surah Al-Baqarah 2:195"},
  {ar:"حَيَاء",trans:"Haya",mean:"Modesty / Shyness",cat:"Character",exAr:"الْحَيَاءُ مِنَ الْإِيمَانِ",exEn:"Modesty is a branch of faith. — Bukhari & Muslim"},
  {ar:"أَمَانَة",trans:"Amanah",mean:"Trustworthiness",cat:"Character",exAr:"إِنَّ اللَّهَ يَأْمُرُكُمْ أَن تُؤَدُّوا الْأَمَانَاتِ إِلَىٰ أَهْلِهَا",exEn:"Allah commands you to fulfil your trusts. — Surah An-Nisa 4:58"},
  {ar:"رِضَا",trans:"Rida",mean:"Contentment / Divine pleasure",cat:"Faith",exAr:"رَضِيَ اللَّهُ عَنْهُمْ وَرَضُوا عَنْهُ",exEn:"Allah is pleased with them and they are pleased with Him. — Surah Al-Ma'idah 5:119"},
  {ar:"يَقِين",trans:"Yaqeen",mean:"Certainty of faith",cat:"Faith",exAr:"وَبِالْآخِرَةِ هُمْ يُوقِنُونَ",exEn:"And of the Hereafter they are certain. — Surah Al-Baqarah 2:4"},
  {ar:"زُهْد",trans:"Zuhd",mean:"Detachment from the dunya",cat:"Spirituality",exAr:"اعْلَمُوا أَنَّمَا الْحَيَاةُ الدُّنْيَا لَعِبٌ وَلَهْوٌ",exEn:"Know that the life of this world is only play and amusement. — Surah Al-Hadid 57:20"},
  {ar:"حِكْمَة",trans:"Hikmah",mean:"Wisdom",cat:"Virtue",exAr:"يُؤْتِي الْحِكْمَةَ مَن يَشَاءُ",exEn:"He grants wisdom to whom He wills. — Surah Al-Baqarah 2:269"},
  {ar:"صَدَقَة",trans:"Sadaqah",mean:"Voluntary charity",cat:"Practice",exAr:"كُلُّ مَعْرُوفٍ صَدَقَةٌ",exEn:"Every act of goodness is sadaqah. — Muslim"},
  {ar:"خُشُوع",trans:"Khushu",mean:"Humility in worship",cat:"Worship",exAr:"قَدْ أَفْلَحَ الْمُؤْمِنُونَ الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ",exEn:"Successful are the believers who have khushu in their prayers. — Surah Al-Mu'minun 23:1-2"},
  {ar:"إِسْتِغْفَار",trans:"Istighfar",mean:"Seeking forgiveness",cat:"Practice",exAr:"وَاسْتَغْفِرِ اللَّهَ إِنَّ اللَّهَ كَانَ غَفُورًا رَّحِيمًا",exEn:"And seek Allah's forgiveness — Allah is Ever-Forgiving, Most Merciful. — Surah An-Nisa 4:106"},
  {ar:"بَرَكَة",trans:"Barakah",mean:"Divine blessing",cat:"Spirituality",exAr:"وَلَوْ أَنَّ أَهْلَ الْقُرَىٰ آمَنُوا وَاتَّقَوْا لَفَتَحْنَا عَلَيْهِم بَرَكَاتٍ",exEn:"If the people of the towns believed and had taqwa, We would have opened blessings for them. — Surah Al-A'raf 7:96"},
  {ar:"تَفَكُّر",trans:"Tafakkur",mean:"Deep reflection",cat:"Spirituality",exAr:"إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ",exEn:"In the creation of the heavens and earth are signs for people of understanding. — Surah Ali Imran 3:190"},
  {ar:"جِهَاد",trans:"Jihad",mean:"Striving / Struggle",cat:"Practice",exAr:"وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا",exEn:"Those who strive for Us — We will guide them to Our ways. — Surah Al-Ankabut 29:69"},
  {ar:"أَدَب",trans:"Adab",mean:"Etiquette / Good manners",cat:"Character",exAr:"وَإِنَّكَ لَعَلَىٰ خُلُقٍ عَظِيمٍ",exEn:"And you are of the most exalted character. — Surah Al-Qalam 68:4"},
  {ar:"وَرَع",trans:"Wara",mean:"Piety / Scrupulousness",cat:"Spirituality",exAr:"دَعْ مَا يَرِيبُكَ إِلَى مَا لَا يَرِيبُكَ",exEn:"Leave what makes you doubt for what does not make you doubt. — Tirmidhi"},
  {ar:"مُحَاسَبَة",trans:"Muhasabah",mean:"Self-accountability",cat:"Spirituality",exAr:"يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ وَلْتَنظُرْ نَفْسٌ مَّا قَدَّمَتْ لِغَدٍ",exEn:"O believers, fear Allah — let every soul consider what it has sent ahead for tomorrow. — Surah Al-Hashr 59:18"},
  {ar:"قَنَاعَة",trans:"Qana'ah",mean:"Contentment with what you have",cat:"Character",exAr:"لَيْسَ الْغِنَى عَنْ كَثْرَةِ الْعَرَضِ وَلَكِنَّ الْغِنَى غِنَى النَّفْسِ",exEn:"Richness is not having many possessions, but richness is contentment of the soul. — Bukhari"},
]

// ─── SUNNAH ACTS (12) ────────────────────────────────────────────────────────
const sunnahActs = [
  {name:"Miswak before salah",sahabi:"Practiced by Abdullah ibn Masud RA",reward:"Multiplies the reward of salah 70 times"},
  {name:"Drink water in 3 sips",sahabi:"Narrated by Anas ibn Malik RA",reward:"Following the way of the Prophet ﷺ in eating and drinking"},
  {name:"Sleep on your right side",sahabi:"Practiced by Al-Bara ibn Azib RA",reward:"Dying in a state of fitrah if sleep takes you"},
  {name:"Say Bismillah before eating",sahabi:"Narrated by Umar ibn Abi Salamah RA",reward:"Barakah in your food and protection from shaytan"},
  {name:"Eat with your right hand",sahabi:"Narrated by Ibn Umar RA",reward:"Following the sunnah in every meal"},
  {name:"Enter home with right foot",sahabi:"Practiced by Aisha RA",reward:"Barakah entering the home"},
  {name:"Say Salah on the Prophet after adhan",sahabi:"Narrated by Abdullah ibn Amr RA",reward:"Ten blessings from Allah upon you"},
  {name:"Pray 2 sunnah before Fajr",sahabi:"Narrated by Aisha RA",reward:"Better than the dunya and everything in it"},
  {name:"Read Ayatul Kursi after salah",sahabi:"Narrated by Abu Umamah RA",reward:"Nothing stands between you and Jannah except death"},
  {name:"Say SubhanAllah 33x after salah",sahabi:"Narrated by Abu Hurairah RA",reward:"Sins forgiven even if like the foam of the sea"},
  {name:"Fast Mondays and Thursdays",sahabi:"Narrated by Abu Hurairah RA",reward:"Deeds are presented to Allah on those days"},
  {name:"Give sadaqah even a little",sahabi:"Narrated by Adiy ibn Hatim RA",reward:"A shield from the hellfire, even with half a date"},
]

// ─── DAILY CHALLENGES (40) ───────────────────────────────────────────────────
const dailyChallenges = [
  {text:"Say Bismillah before every single action today — eating, drinking, leaving the house, starting work.",reward:"Barakah in every action"},
  {text:"Smile at every Muslim you see or speak to today — in person or virtually.",reward:"Smiling is sadaqah"},
  {text:"Read Ayatul Kursi after every obligatory salah today.",reward:"Nothing stands between you and Jannah except death"},
  {text:"Say SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34 after every salah.",reward:"Sins forgiven even if like the foam of the sea"},
  {text:"Make dua for 3 Muslims by name today — a parent, a friend, and a stranger.",reward:"The angels say Ameen and say the same for you"},
  {text:"Recite Surah Al-Kahf today.",reward:"Light from this Friday to the next"},
  {text:"Give something in charity today — even a smile, a helpful word, or removing harm from a path.",reward:"Sadaqah extinguishes sins like water extinguishes fire"},
  {text:"Fast today with the intention of following the sunnah.",reward:"Deeds are presented to Allah on Mondays and Thursdays"},
  {text:"Call or message a parent, relative, or friend you haven't spoken to in a while.",reward:"Strengthening the ties of kinship extends your lifespan"},
  {text:"Say Istighfar 100 times today — ask Allah for forgiveness.",reward:"Allah loves those who return to Him in repentance"},
  {text:"Read one page of the Quran with reflection on its meaning.",reward:"Each letter is worth 10 hasanat"},
  {text:"Perform 2 rakaat nafl salah at any time today with full focus.",reward:"Voluntary prayer is a path to nearness to Allah"},
  {text:"Feed someone today — a family member, friend, or anyone in need.",reward:"Feeding others is one of the best deeds in Islam"},
  {text:"Learn one new Islamic word or concept and share it with someone.",reward:"Whoever guides to goodness gets the same reward"},
  {text:"Sit in your place after Fajr until sunrise, then pray 2 rakaat.",reward:"Reward equivalent to a complete Hajj and Umrah"},
  {text:"Lower your gaze consistently today — from screens, from people, from anything haram.",reward:"Allah replaces it with sweetness of faith in your heart"},
  {text:"Make dhikr between your prayers — SubhanAllah, Alhamdulillah, La ilaha illallah.",reward:"The most beloved deeds to Allah are the consistent ones"},
  {text:"Visit or check in on a sick person or someone going through difficulty.",reward:"Walking in the shade of Jannah"},
  {text:"Perform all your prayers in their earliest time today.",reward:"The most beloved deed to Allah is prayer at its time"},
  {text:"Say La hawla wala quwwata illa billah 100 times.",reward:"A treasure from the treasures of Jannah"},
  {text:"Make wudu and sit for 10 minutes of silent reflection on your life and your akhirah.",reward:"Purity in body brings purity in heart"},
  {text:"Avoid all backbiting today — do not speak ill of anyone absent.",reward:"Guarding the tongue is half of deen"},
  {text:"Before sleeping tonight, say SubhanAllah 33, Alhamdulillah 33, Allahu Akbar 34.",reward:"Better than a servant — fatigue will not exhaust you"},
  {text:"Send salah on the Prophet ﷺ 100 times today.",reward:"Allah sends 10 blessings upon you for each one"},
  {text:"Perform ghusl today with full attention, following the sunnah method.",reward:"Purity is half of faith"},
  {text:"Make a list of your blessings and thank Allah for each one by name.",reward:"If you are grateful, I will surely increase you — Allah"},
  {text:"Complete all five prayers in jama'ah today, or pray as if you are.",reward:"Prayer in congregation is 27 degrees better"},
  {text:"Say Alhamdulillah every time something good happens to you today.",reward:"Gratitude preserves blessings and invites more"},
  {text:"Avoid wasting food today — eat what you take and take what you need.",reward:"Extravagance is displeasing to Allah"},
  {text:"Make intention to seek knowledge for Allah's sake — read one hadith, one tafsir, one benefit.",reward:"Seeking knowledge is an obligation on every Muslim"},
  {text:"Reconcile with someone you have had a disagreement with.",reward:"Reconciliation between people is better than fasting and prayer"},
  {text:"Spend 15 minutes in solitude remembering death and preparing for the akhirah.",reward:"Frequent remembrance of death softens the heart"},
  {text:"Help someone with a task today — carry something, explain something, do something useful.",reward:"Allah helps the servant as long as the servant helps his brother"},
  {text:"Read the duas for morning and evening adhkar completely.",reward:"Whoever says them will not be harmed by anything"},
  {text:"Perform tahajjud — even just 2 rakaat in the last third of the night.",reward:"The closest you are to Allah is in the last third of the night"},
  {text:"Say SubhanAllahi wa bihamdihi 100 times.",reward:"Sins forgiven even if they are like the foam of the sea"},
  {text:"Give a sincere compliment to someone today — make them feel valued.",reward:"A kind word is sadaqah"},
  {text:"Make dua for the Muslim ummah globally — those suffering, those struggling.",reward:"The dua of a Muslim for his brother in his absence is answered"},
  {text:"Recite Surah Al-Mulk before sleeping.",reward:"Protection from the punishment of the grave"},
  {text:"Spend your commute or walk making dhikr instead of scrolling.",reward:"Moist tongue with the remembrance of Allah is a great reward"},
]

// ─── GOAL SUGGESTIONS ────────────────────────────────────────────────────────
const goalSuggestions = [
  {cat:"🙏 Prayer",suggestions:[
    "Pray all 5 prayers on time every day",
    "Start praying Fajr consistently",
    "Pray Tahajjud at least once a week",
    "Learn the meaning of what I recite in salah",
    "Pray all sunnah prayers alongside fard",
    "Pray in congregation at the masjid on Fridays",
    "Stop delaying Asr and Isha",
    "Memorise and apply Khushu in my salah",
  ]},
  {cat:"📖 Quran",suggestions:[
    "Read one page of Quran every day",
    "Memorise Surah Al-Mulk",
    "Memorise Surah Al-Kahf",
    "Read the Quran with translation to understand",
    "Complete one full khatm this year",
    "Memorise the last 10 surahs of the Quran",
    "Study the tafsir of Surah Al-Baqarah",
    "Improve my Tajweed by taking a class",
  ]},
  {cat:"🌿 Habits",suggestions:[
    "Wake up before Fajr every day",
    "Read morning and evening adhkar daily",
    "Stop looking at my phone first thing in the morning",
    "Fast every Monday and Thursday",
    "Give sadaqah every week, even small",
    "Reduce time on social media",
    "Sleep before midnight consistently",
    "Start a daily exercise routine with intention of health for ibadah",
  ]},
  {cat:"💬 Character",suggestions:[
    "Stop backbiting completely",
    "Control my anger when provoked",
    "Be more patient with my family",
    "Lower my gaze consistently",
    "Be more honest even when it's hard",
    "Speak less and listen more",
    "Stop complaining and start being grateful",
    "Be kinder to my parents daily",
  ]},
  {cat:"📚 Knowledge",suggestions:[
    "Learn the 99 names of Allah and their meanings",
    "Study the seerah of the Prophet ﷺ",
    "Memorise Nawawi's 40 Hadith",
    "Learn basic Arabic vocabulary",
    "Take an Islamic course online",
    "Read one Islamic book per month",
    "Study the pillars of iman in depth",
    "Learn the fiqh of prayer properly",
  ]},
  {cat:"❤️ Community",suggestions:[
    "Visit the masjid at least once a week",
    "Reconnect with family members I've drifted from",
    "Volunteer for a local Islamic cause",
    "Check on my neighbours regularly",
    "Bring a non-Muslim friend to learn about Islam",
    "Help organise events at my local masjid",
    "Mentor a younger Muslim in my community",
    "Make dua for the ummah every day",
  ]},
]

// ─── ANGER STEPS ─────────────────────────────────────────────────────────────
const angerSteps = [
  {n:"1",title:"Seek refuge in Allah",ar:"أَعُوذُ بِاللّٰهِ مِنَ الشَّيْطَانِ الرَّجِيمِ",sub:"Say it aloud — repeat until you feel it"},
  {n:"2",title:"Change your position",ar:"",sub:"If standing, sit. If sitting, lie down. The Prophet ﷺ commanded this."},
  {n:"3",title:"Make wudu",ar:"",sub:"Anger is from fire — water extinguishes fire. Go make wudu now."},
  {n:"4",title:"Stay silent",ar:"",sub:'"When one of you is angry, let him be silent." — Bukhari'},
]

const ayahs = [
  {text:'"If you are grateful, I will surely increase you in favour..."',ref:"Surah Ibrahim · 14:7"},
  {text:'"And He gave you of all that you asked of Him. If you count the blessings of Allah, you could never enumerate them..."',ref:"Surah Ibrahim · 14:34"},
  {text:'"So remember Me; I will remember you. And be grateful to Me and do not deny Me."',ref:"Surah Al-Baqarah · 2:152"},
  {text:'"And whoever relies upon Allah — then He is sufficient for him."',ref:"Surah At-Talaq · 65:3"},
  {text:'"Indeed, with hardship will be ease."',ref:"Surah Ash-Sharh · 94:6"},
]

const badgesData = [
  {id:'first_login',icon:'🌱',name:'First Step',desc:'Signed in for the first time'},
  {id:'hadith_5',icon:'📖',name:'Seeker',desc:'Memorised 5 hadith'},
  {id:'hadith_10',icon:'📚',name:'Student',desc:'Memorised 10 hadith'},
  {id:'hadith_20',icon:'🌿',name:'Learner',desc:'Memorised 20 hadith'},
  {id:'hadith_40',icon:'🏆',name:'Hafidh',desc:'Memorised all 40 hadith'},
  {id:'shukr_7',icon:'✨',name:'Grateful',desc:'7 days of shukr'},
  {id:'shukr_30',icon:'💎',name:'Thankful Heart',desc:'30 days of shukr'},
  {id:'sunnah_streak',icon:'☀️',name:'Sunnah Keeper',desc:'All 3 sunnahs in a day'},
  {id:'quiz_perfect',icon:'🧠',name:'Scholar',desc:'Perfect quiz score'},
  {id:'goal_set',icon:'🎯',name:'Purposeful',desc:'Set your first goal'},
  {id:'goal_done',icon:'✅',name:'Committed',desc:'Completed your first goal'},
  {id:'words_10',icon:'🔤',name:'Word Collector',desc:'Browsed 10 Arabic words'},
]

// ─── STATE ───────────────────────────────────────────────────────────────────
let currentUser = null
let learned = new Set()
let sunnahDone = [false, false, false]
let shukrLog = []
let goals = []
let reviewIdx = 0
let flipped = false
let wordIdx = 0
let quizIdx = 0
let quizScore = 0
let quizQuestions = []
let quizAnswered = false
let earnedBadges = new Set()
let wordsViewed = new Set()
let activeSuggestionCat = 0

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function showLogin(){ document.getElementById('login-card').style.display=''; document.getElementById('signup-card').style.display='none'; clearErrors() }
function showSignup(){ document.getElementById('signup-card').style.display=''; document.getElementById('login-card').style.display='none'; clearErrors() }
function clearErrors(){ document.getElementById('login-err').style.display='none'; document.getElementById('signup-err').style.display='none' }
function showErr(id,msg){ const el=document.getElementById(id); el.textContent=msg; el.style.display='block' }

async function doLogin(){
  const email=document.getElementById('login-email').value.trim()
  const pw=document.getElementById('login-pw').value
  if(!email||!pw) return showErr('login-err','Please fill in all fields.')
  try{ await signIn(email,pw) } catch(e){ showErr('login-err',e.message) }
}
async function doSignup(){
  const name=document.getElementById('signup-name').value.trim()
  const email=document.getElementById('signup-email').value.trim()
  const pw=document.getElementById('signup-pw').value
  if(!name||!email||!pw) return showErr('signup-err','Please fill in all fields.')
  if(pw.length<8) return showErr('signup-err','Password must be at least 8 characters.')
  try{ await signUp(name,email,pw); showToast('Account created! Check your email to confirm.') } catch(e){ showErr('signup-err',e.message) }
}
async function doGoogle(){ try{ await signInWithGoogle() } catch(e){ showErr('login-err',e.message) } }
async function doLogout(){ await signOut() }

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function initApp(user){
  currentUser=user
  const [learnedArr,sunnahArr,shukrArr,goalsArr]=await Promise.all([
    loadHadithProgress(user.id), loadTodaySunnah(user.id),
    loadShukrLog(user.id), loadGoals(user.id)
  ])
  learned=new Set(learnedArr)
  sunnahDone=sunnahArr
  shukrLog=shukrArr
  goals=goalsArr

  const name=user.user_metadata?.full_name||user.email.split('@')[0]
  document.getElementById('sidebar-name').textContent=name
  document.getElementById('sidebar-email').textContent=user.email
  document.getElementById('home-greeting').textContent=`Assalamu Alaykum, ${name.split(' ')[0]}`
  document.getElementById('home-date').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})

  const dayIdx=new Date().getDay()
  const ch=dailyChallenges[dayIdx % dailyChallenges.length]
  document.getElementById('challenge-text').textContent=ch.text
  document.getElementById('challenge-reward').textContent='✦ Reward: '+ch.reward

  renderAll()
  checkBadges()
  showToast(`Welcome back, ${name.split(' ')[0]} 🌿`)
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function goTo(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'))
  document.querySelectorAll('.s-item').forEach(i=>i.classList.remove('active'))
  document.getElementById('page-'+page).classList.add('active')
  const map={home:0,hadith:1,arabic:2,sunnah:3,anger:4,shukr:5,goals:6,badges:7}
  document.querySelectorAll('.s-item')[map[page]]?.classList.add('active')
}

function toggleDark(){
  const html=document.documentElement
  const isDark=html.getAttribute('data-theme')==='dark'
  html.setAttribute('data-theme',isDark?'light':'dark')
  document.getElementById('dark-toggle').textContent=isDark?'🌙 Dark mode':'☀️ Light mode'
}

// ─── RENDER ALL ───────────────────────────────────────────────────────────────
function renderAll(){ renderHadith(); renderSunnah(); renderAnger(); renderShukrLog(); renderWords(); renderGoals(); renderBadges(); updateStats() }

// ─── HADITH ───────────────────────────────────────────────────────────────────
function renderHadith(){
  document.getElementById('hadith-list').innerHTML=hadithData.map((h,i)=>`
    <div class="h-row ${learned.has(i)?'learned':''}">
      <div class="h-num">${i+1}</div>
      <div style="flex:1;">
        <div class="h-ar">${h.ar}</div>
        <div style="font-size:11px;color:var(--gm);">${h.src.split('·')[0].trim()}</div>
      </div>
      <div style="font-size:11px;color:var(--gm);">${learned.has(i)?'✓':''}</div>
    </div>`).join('')
}

function switchHadithMode(mode){
  document.querySelectorAll('.mode-tab').forEach((t,i)=>{ t.classList.toggle('active',['list','review','quiz'][i]===mode) })
  document.getElementById('hmode-list').style.display=mode==='list'?'':'none'
  document.getElementById('hmode-review').style.display=mode==='review'?'':'none'
  document.getElementById('hmode-quiz').style.display=mode==='quiz'?'':'none'
  if(mode==='quiz') startQuiz()
  if(mode==='review'){ reviewIdx=0; loadFlipCard(0) }
}

function loadFlipCard(idx){
  if(idx>=hadithData.length) idx=0
  const h=hadithData[idx]
  document.getElementById('rev-ar').textContent=h.ar
  document.getElementById('rev-num').textContent=`Hadith ${idx+1} of ${hadithData.length}`
  document.getElementById('rev-en').textContent=h.en
  document.getElementById('rev-src').textContent=h.src
  document.getElementById('flip-inner').classList.remove('flipped')
  document.getElementById('rev-btns').style.display='none'
  flipped=false
}

function flipCard(){
  if(!flipped){ document.getElementById('flip-inner').classList.add('flipped'); document.getElementById('rev-btns').style.display='flex'; flipped=true }
}

async function markHadith(knew){
  if(knew) learned.add(reviewIdx)
  reviewIdx=(reviewIdx+1)%hadithData.length
  loadFlipCard(reviewIdx)
  updateStats(); checkBadges()
  await saveHadithProgress(currentUser.id,[...learned])
}

// ─── QUIZ ─────────────────────────────────────────────────────────────────────
function startQuiz(){
  quizIdx=0; quizScore=0; quizAnswered=false
  const shuffled=[...hadithData].sort(()=>Math.random()-.5).slice(0,5)
  quizQuestions=shuffled.map(h=>{
    const wrong=hadithData.filter(x=>x.en!==h.en).sort(()=>Math.random()-.5).slice(0,3)
    const options=[...wrong,h].sort(()=>Math.random()-.5)
    return{question:h.ar,answer:h.en,options:options.map(o=>o.en)}
  })
  document.getElementById('quiz-active').style.display=''
  document.getElementById('quiz-done').style.display='none'
  loadQuizQuestion()
}

function loadQuizQuestion(){
  if(quizIdx>=quizQuestions.length) return showQuizResult()
  const q=quizQuestions[quizIdx]
  document.getElementById('quiz-progress').textContent=`Question ${quizIdx+1} of ${quizQuestions.length}`
  document.getElementById('quiz-score-live').textContent=`Score: ${quizScore}`
  document.getElementById('quiz-q').textContent=q.question
  document.getElementById('quiz-opts').innerHTML=q.options.map((o,i)=>
    `<div class="quiz-option" onclick="answerQuiz(this,${i},'${o.replace(/'/g,"\\'")}','${q.answer.replace(/'/g,"\\'")}')"> ${o}</div>`
  ).join('')
  quizAnswered=false
}

function answerQuiz(el,idx,chosen,correct){
  if(quizAnswered) return
  quizAnswered=true
  const isCorrect=chosen===correct
  el.classList.add(isCorrect?'correct':'wrong')
  if(!isCorrect) document.querySelectorAll('.quiz-option').forEach(o=>{ if(o.textContent.trim()===correct) o.classList.add('correct') })
  if(isCorrect) quizScore++
  setTimeout(()=>{ quizIdx++; loadQuizQuestion() },1400)
}

function showQuizResult(){
  document.getElementById('quiz-active').style.display='none'
  document.getElementById('quiz-done').style.display=''
  document.getElementById('final-score').textContent=`${quizScore} / ${quizQuestions.length}`
  document.getElementById('quiz-score-display').textContent=`${quizScore}/${quizQuestions.length}`
  const msgs=['Keep reviewing — you can do this!','Getting there — try again!','Good effort!','Well done! MashaAllah!','Perfect! SubhanAllah! 🏆']
  document.getElementById('final-msg').textContent=msgs[quizScore]||msgs[4]
  if(quizScore===quizQuestions.length){ earnedBadges.add('quiz_perfect'); renderBadges() }
}

// ─── ARABIC WORDS ─────────────────────────────────────────────────────────────
function renderWords(){
  loadWord(wordIdx)
  document.getElementById('word-list').innerHTML=arabicWords.map((w,i)=>`
    <div class="h-row" onclick="loadWordAndGo(${i})" style="cursor:pointer;">
      <div style="font-family:'Playfair Display',serif;font-size:18px;color:var(--g);direction:rtl;min-width:60px;text-align:right;">${w.ar}</div>
      <div style="flex:1;padding-left:12px;">
        <div style="font-size:13px;color:var(--text);font-weight:500;">${w.mean}</div>
        <div style="font-size:11px;color:var(--gm);">${w.trans} · ${w.cat}</div>
      </div>
    </div>`).join('')
}

function loadWord(idx){
  wordIdx=idx; wordsViewed.add(idx)
  const w=arabicWords[idx]
  document.getElementById('w-ar').textContent=w.ar
  document.getElementById('w-trans').textContent=w.trans
  document.getElementById('w-mean').textContent=w.mean
  document.getElementById('w-cat').textContent=w.cat
  document.getElementById('w-ex-ar').textContent=w.exAr
  document.getElementById('w-ex-en').textContent=w.exEn
  document.getElementById('w-counter').textContent=`${idx+1} / ${arabicWords.length}`
  if(wordsViewed.size>=10){ earnedBadges.add('words_10'); renderBadges() }
}

function loadWordAndGo(idx){ loadWord(idx); goTo('arabic') }
function nextWord(){ loadWord((wordIdx+1)%arabicWords.length) }
function prevWord(){ loadWord((wordIdx-1+arabicWords.length)%arabicWords.length) }

// ─── SUNNAH ───────────────────────────────────────────────────────────────────
function renderSunnah(){
  document.getElementById('sunnah-list').innerHTML=sunnahActs.map((s,i)=>`
    <div class="sunnah-item ${sunnahDone[i]?'done':''}" onclick="toggleSunnah(${i})">
      <div class="chk"><div class="chk-mark"></div></div>
      <div>
        <div class="sunnah-name">${s.name}</div>
        <div class="sunnah-sahabi">${s.sahabi}</div>
        <div class="sunnah-reward">${s.reward}</div>
      </div>
    </div>`).join('')
}

async function toggleSunnah(i){
  sunnahDone[i]=!sunnahDone[i]
  renderSunnah(); updateStats(); checkBadges()
  await saveSunnahLog(currentUser.id,sunnahDone)
  showToast(sunnahDone[i]?'Sunnah recorded ✓':'Unmarked')
}

// ─── ANGER ────────────────────────────────────────────────────────────────────
function renderAnger(){
  document.getElementById('anger-steps').innerHTML=angerSteps.map((s,i)=>`
    <div class="step-item" id="astep-${i}">
      <div class="step-num">${s.n}</div>
      <div>
        <div class="step-title">${s.title}</div>
        ${s.ar?`<div class="step-ar">${s.ar}</div>`:''}
        <div class="step-sub">${s.sub}</div>
      </div>
    </div>`).join('')
}

function activateGuide(){
  let step=0
  const go=()=>{
    angerSteps.forEach((_,i)=>document.getElementById('astep-'+i)?.classList.toggle('active-step',i===step))
    if(step<angerSteps.length-1){ step++; setTimeout(go,2000) }
  }
  go()
}

// ─── SHUKR ────────────────────────────────────────────────────────────────────
function renderShukrLog(){
  document.getElementById('shukr-log').innerHTML=shukrLog.map(e=>`
    <div class="shukr-entry">
      <div class="shukr-date">${e.date}</div>
      ${e.blessings.map(b=>`<div class="shukr-b"><div class="shukr-b-dot"></div><span>${b}</span></div>`).join('')}
    </div>`).join('')
}

async function saveShukr(){
  const b1=document.getElementById('b1').value.trim()
  const b2=document.getElementById('b2').value.trim()
  const b3=document.getElementById('b3').value.trim()
  const blessings=[b1,b2,b3].filter(Boolean)
  if(!blessings.length){ showToast('Enter at least one blessing'); return }
  await saveShukrEntry(currentUser.id,blessings)
  shukrLog=await loadShukrLog(currentUser.id)
  document.getElementById('b1').value=''; document.getElementById('b2').value=''; document.getElementById('b3').value=''
  renderShukrLog(); updateStats(); checkBadges()
  const a=ayahs[Math.floor(Math.random()*ayahs.length)]
  document.getElementById('ayah-text').textContent=a.text
  document.getElementById('ayah-ref').textContent=a.ref
  showToast('Shukr saved — may Allah increase your blessings 🌿')
}

// ─── GOALS ────────────────────────────────────────────────────────────────────
function renderGoals(){
  const active=goals.filter(g=>!g.done)
  const done=goals.filter(g=>g.done)
  const el=document.getElementById('goals-list')
  if(!goals.length){
    el.innerHTML=`<div style="text-align:center;padding:32px;color:var(--text2);font-size:13px;">No goals yet — add one above or pick a suggestion below</div>`
    return
  }
  el.innerHTML=[...active,...done].map(g=>`
    <div class="goal-item ${g.done?'done':''}">
      <div class="goal-chk" onclick="doneGoal('${g.id}',${!g.done})">
        ${g.done?'✓':''}
      </div>
      <div class="goal-body">
        <div class="goal-text">${g.text}</div>
        <div class="goal-cat">${g.category}</div>
      </div>
      <button class="goal-del" onclick="removeGoal('${g.id}')">×</button>
    </div>`).join('')
}

function renderGoalSuggestions(){
  const cat=goalSuggestions[activeSuggestionCat]
  document.getElementById('suggestion-tabs').innerHTML=goalSuggestions.map((c,i)=>`
    <div class="sug-tab ${i===activeSuggestionCat?'active':''}" onclick="setSugCat(${i})">${c.cat}</div>`
  ).join('')
  document.getElementById('suggestion-list').innerHTML=cat.suggestions.map(s=>`
    <div class="sug-item" onclick="addSuggestion('${s.replace(/'/g,"\\'")}','${cat.cat}')">
      <span>${s}</span><span class="sug-add">+ Add</span>
    </div>`).join('')
}

function setSugCat(i){ activeSuggestionCat=i; renderGoalSuggestions() }

async function addGoalFromInput(){
  const input=document.getElementById('goal-input')
  const text=input.value.trim()
  if(!text){ showToast('Write your goal first'); return }
  const catEl=document.getElementById('goal-cat-select')
  const cat=catEl.value
  const newGoal=await saveGoal(currentUser.id,text,cat)
  goals=[newGoal,...goals]
  input.value=''
  renderGoals(); checkBadges()
  showToast('Goal added — may Allah make it easy for you 🌿')
}

async function addSuggestion(text,cat){
  const newGoal=await saveGoal(currentUser.id,text,cat)
  goals=[newGoal,...goals]
  renderGoals(); checkBadges()
  showToast('Goal added 🌿')
}

async function doneGoal(id,done){
  await toggleGoalDone(id,done)
  goals=goals.map(g=>g.id===id?{...g,done}:g)
  renderGoals(); checkBadges()
  if(done) showToast('MashaAllah — goal completed! ✓')
}

async function removeGoal(id){
  await deleteGoal(id)
  goals=goals.filter(g=>g.id!==id)
  renderGoals()
}

// ─── DAILY CHALLENGE ─────────────────────────────────────────────────────────
function completeChallenge(){
  showToast('JazakAllahu khairan — challenge complete! 🌿')
  const btn=document.querySelector('.challenge-done')
  btn.textContent='Done ✓'; btn.style.opacity='.5'; btn.disabled=true
}

// ─── BADGES ───────────────────────────────────────────────────────────────────
function checkBadges(){
  earnedBadges.add('first_login')
  if(learned.size>=5) earnedBadges.add('hadith_5')
  if(learned.size>=10) earnedBadges.add('hadith_10')
  if(learned.size>=20) earnedBadges.add('hadith_20')
  if(learned.size>=40) earnedBadges.add('hadith_40')
  if(shukrLog.length>=7) earnedBadges.add('shukr_7')
  if(shukrLog.length>=30) earnedBadges.add('shukr_30')
  if(sunnahDone.every(Boolean)) earnedBadges.add('sunnah_streak')
  if(goals.length>=1) earnedBadges.add('goal_set')
  if(goals.some(g=>g.done)) earnedBadges.add('goal_done')
  if(wordsViewed.size>=10) earnedBadges.add('words_10')
  renderBadges()
}

function renderBadges(){
  const earned=earnedBadges.size
  document.getElementById('badges-count').textContent=`${earned} / ${badgesData.length} earned`
  document.getElementById('badges-grid').innerHTML=badgesData.map(b=>`
    <div class="badge-item ${earnedBadges.has(b.id)?'earned':''}">
      <div class="badge-icon">${b.icon}</div>
      <div class="badge-name">${b.name}</div>
      <div class="badge-desc">${b.desc}</div>
    </div>`).join('')
}

// ─── STATS ────────────────────────────────────────────────────────────────────
function updateStats(){
  const lc=learned.size, sc=sunnahDone.filter(Boolean).length, shc=shukrLog.length
  document.getElementById('h-count').textContent=lc
  document.getElementById('hm').textContent=lc
  document.getElementById('hl').textContent=40-lc
  document.getElementById('h-prog').style.width=Math.round(lc/40*100)+'%'
  document.getElementById('h-badge').textContent=lc+' / 40 memorised'
  document.getElementById('s-count').textContent=sc
  document.getElementById('s-prog').style.width=Math.round(sc/sunnahActs.length*100)+'%'
  document.getElementById('s-badge').textContent=sc+' / '+sunnahActs.length+' done'
  document.getElementById('shukr-count').textContent=shc
  document.getElementById('shukr-badge').textContent='Day '+shc
  document.getElementById('streak-val').textContent=shc
  document.getElementById('goals-count').textContent=goals.filter(g=>!g.done).length+' active'
}

function showToast(msg){
  const t=document.getElementById('toast')
  t.textContent=msg; t.classList.add('show')
  setTimeout(()=>t.classList.remove('show'),2800)
}

// ─── EXPOSE ───────────────────────────────────────────────────────────────────
window.showLogin=showLogin; window.showSignup=showSignup
window.doLogin=doLogin; window.doSignup=doSignup; window.doGoogle=doGoogle; window.doLogout=doLogout
window.goTo=goTo; window.toggleDark=toggleDark
window.flipCard=flipCard; window.markHadith=markHadith; window.switchHadithMode=switchHadithMode
window.startQuiz=startQuiz; window.answerQuiz=answerQuiz
window.loadWord=loadWord; window.loadWordAndGo=loadWordAndGo; window.nextWord=nextWord; window.prevWord=prevWord
window.toggleSunnah=toggleSunnah; window.activateGuide=activateGuide; window.saveShukr=saveShukr
window.addGoalFromInput=addGoalFromInput; window.addSuggestion=addSuggestion
window.doneGoal=doneGoal; window.removeGoal=removeGoal; window.setSugCat=setSugCat
window.completeChallenge=completeChallenge

// ─── BOOT ─────────────────────────────────────────────────────────────────────
onAuthChange(async(user)=>{
  document.getElementById('loading').style.display='none'
  if(user){
    document.getElementById('auth-wrap').style.display='none'
    document.getElementById('app-wrap').style.display='block'
    await initApp(user)
    renderGoalSuggestions()
  } else {
    document.getElementById('auth-wrap').style.display='flex'
    document.getElementById('app-wrap').style.display='none'
    showLogin()
  }
})