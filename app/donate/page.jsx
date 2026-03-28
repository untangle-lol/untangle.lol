export const metadata = {
  title: "Support Untangle.lol — Help keep it free for everyone",
  description: "Untangle.lol is a free, private AI goal planner. Your donation keeps it free, ad-free, and independent for everyone.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://untangle.lol/donate" },
};

const LANGS = ["nl","en","de","fr","es","pt","ar","bn","hi","id","ja","ru","sw","tr","zh"];

const CONTENT = {
  nl: {
    label: "Nederlands",
    back: "← Terug naar untangle.lol",
    tagline: "Gratis. Privé. Voor iedereen.",
    title: "Help untangle.lol gratis te houden",
    hero: "untangle.lol helpt mensen verder op weg — met welk doel dan ook. Van beter slapen tot een eigen bedrijf starten. Gratis. Zonder advertenties. Zonder account.",
    missionTitle: "Onze missie",
    mission: "Wij geloven dat iedereen recht heeft op een heldere volgende stap. Niet alleen mensen die een coach kunnen betalen, of die de juiste mensen kennen. Iedereen. Dat is waarom untangle.lol volledig gratis is en dat ook wil blijven.",
    whyTitle: "Waarom donaties zo belangrijk zijn",
    why: [
      "untangle.lol heeft geen investeerders en geen advertenties. Wat je ziet is wat je krijgt — een eerlijk, onafhankelijk product.",
      "Elke AI-gestuurde stap kost geld: serverkosten, API-kosten, ontwikkeling. Die rekening wordt betaald door mensen zoals jij.",
      "Dankzij donaties kunnen we de app gratis houden voor iedereen — ook voor mensen die geen API-sleutel hebben of willen betalen.",
    ],
    howTitle: "Waar gaat jouw donatie naartoe?",
    how: [
      { icon: "server", label: "Serverkosten", desc: "Hosting en infrastructuur om de app snel en betrouwbaar te houden." },
      { icon: "ai", label: "AI-kosten", desc: "De AI-modellen die gratis vragen mogelijk maken voor gebruikers zonder API-sleutel." },
      { icon: "dev", label: "Doorontwikkeling", desc: "Nieuwe functies, meer talen, en een betere ervaring voor alle gebruikers." },
    ],
    quote: "Elke donatie — groot of klein — helpt iemand die vastloopt een stap verder te komen.",
    ctaTitle: "Doneer via bunq",
    ctaDesc: "Elke bijdrage telt. Eenmalig, geen account nodig.",
    ctaBtn: "Doneer nu →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol is een onafhankelijk product van Bach Software. Geen aandeelhouders, geen adverteerders — alleen gebruikers die ons vertrouwen.",
  },
  en: {
    label: "English",
    back: "← Back to untangle.lol",
    tagline: "Free. Private. For everyone.",
    title: "Help keep untangle.lol free",
    hero: "untangle.lol helps people move forward — whatever their goal. From sleeping better to starting a business. Free. No ads. No account required.",
    missionTitle: "Our mission",
    mission: "We believe everyone deserves a clear next step. Not just people who can afford a coach, or who know the right people. Everyone. That's why untangle.lol is completely free and wants to stay that way.",
    whyTitle: "Why donations matter",
    why: [
      "untangle.lol has no investors and no ads. What you see is what you get — an honest, independent product.",
      "Every AI-powered step costs money: server costs, API costs, development. That bill is paid by people like you.",
      "Thanks to donations, we can keep the app free for everyone — including people who don't have an API key or don't want to pay.",
    ],
    howTitle: "Where does your donation go?",
    how: [
      { icon: "server", label: "Server costs", desc: "Hosting and infrastructure to keep the app fast and reliable." },
      { icon: "ai", label: "AI costs", desc: "The AI models that power free questions for users without an API key." },
      { icon: "dev", label: "Development", desc: "New features, more languages, and a better experience for all users." },
    ],
    quote: "Every donation — big or small — helps someone who is stuck take their next step.",
    ctaTitle: "Donate via bunq",
    ctaDesc: "Every contribution counts. One-time, no account needed.",
    ctaBtn: "Donate now →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol is an independent product by Bach Software. No shareholders, no advertisers — just users who trust us.",
  },
  de: {
    label: "Deutsch",
    back: "← Zurück zu untangle.lol",
    tagline: "Kostenlos. Privat. Für alle.",
    title: "Hilf dabei, untangle.lol kostenlos zu halten",
    hero: "untangle.lol hilft Menschen weiterzukommen — egal welches Ziel. Von besser schlafen bis zum eigenen Unternehmen. Kostenlos. Ohne Werbung. Ohne Account.",
    missionTitle: "Unsere Mission",
    mission: "Wir glauben, dass jeder Mensch einen klaren nächsten Schritt verdient. Nicht nur Menschen, die sich einen Coach leisten können oder die richtigen Leute kennen. Jeder. Deshalb ist untangle.lol komplett kostenlos und soll es auch bleiben.",
    whyTitle: "Warum Spenden so wichtig sind",
    why: [
      "untangle.lol hat keine Investoren und keine Werbung. Was du siehst, bekommst du — ein ehrliches, unabhängiges Produkt.",
      "Jeder KI-gestützte Schritt kostet Geld: Server-, API- und Entwicklungskosten. Diese Rechnung wird von Menschen wie dir bezahlt.",
      "Dank Spenden können wir die App für alle kostenlos halten — auch für Menschen ohne eigenen API-Schlüssel.",
    ],
    howTitle: "Wohin geht deine Spende?",
    how: [
      { icon: "server", label: "Serverkosten", desc: "Hosting und Infrastruktur, um die App schnell und zuverlässig zu halten." },
      { icon: "ai", label: "KI-Kosten", desc: "Die KI-Modelle, die kostenlose Fragen für Nutzer ohne API-Schlüssel ermöglichen." },
      { icon: "dev", label: "Weiterentwicklung", desc: "Neue Funktionen, mehr Sprachen und eine bessere Erfahrung für alle Nutzer." },
    ],
    quote: "Jede Spende — groß oder klein — hilft jemandem, der feststeckt, seinen nächsten Schritt zu gehen.",
    ctaTitle: "Spenden via bunq",
    ctaDesc: "Jeder Beitrag zählt. Einmalig, kein Account erforderlich.",
    ctaBtn: "Jetzt spenden →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol ist ein unabhängiges Produkt von Bach Software. Keine Aktionäre, keine Werbetreibenden — nur Nutzer, die uns vertrauen.",
  },
  fr: {
    label: "Français",
    back: "← Retour à untangle.lol",
    tagline: "Gratuit. Privé. Pour tous.",
    title: "Aidez à garder untangle.lol gratuit",
    hero: "untangle.lol aide les gens à avancer — quel que soit leur objectif. De mieux dormir à créer une entreprise. Gratuit. Sans publicité. Sans compte.",
    missionTitle: "Notre mission",
    mission: "Nous croyons que tout le monde mérite une prochaine étape claire. Pas seulement ceux qui peuvent se payer un coach ou qui ont les bons contacts. Tout le monde. C'est pourquoi untangle.lol est entièrement gratuit et veut le rester.",
    whyTitle: "Pourquoi les dons sont si importants",
    why: [
      "untangle.lol n'a pas d'investisseurs et pas de publicité. Ce que vous voyez est ce que vous obtenez — un produit honnête et indépendant.",
      "Chaque étape propulsée par l'IA coûte de l'argent : frais de serveur, coûts API, développement. Cette facture est payée par des personnes comme vous.",
      "Grâce aux dons, nous pouvons garder l'application gratuite pour tous — y compris ceux qui n'ont pas de clé API.",
    ],
    howTitle: "Où va votre don ?",
    how: [
      { icon: "server", label: "Frais de serveur", desc: "Hébergement et infrastructure pour garder l'application rapide et fiable." },
      { icon: "ai", label: "Coûts IA", desc: "Les modèles IA qui permettent les questions gratuites pour les utilisateurs sans clé API." },
      { icon: "dev", label: "Développement", desc: "Nouvelles fonctionnalités, plus de langues et une meilleure expérience pour tous." },
    ],
    quote: "Chaque don — grand ou petit — aide quelqu'un de bloqué à franchir sa prochaine étape.",
    ctaTitle: "Faire un don via bunq",
    ctaDesc: "Chaque contribution compte. Ponctuel, sans compte nécessaire.",
    ctaBtn: "Faire un don →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol est un produit indépendant de Bach Software. Pas d'actionnaires, pas d'annonceurs — seulement des utilisateurs qui nous font confiance.",
  },
  es: {
    label: "Español",
    back: "← Volver a untangle.lol",
    tagline: "Gratuito. Privado. Para todos.",
    title: "Ayuda a mantener untangle.lol gratuito",
    hero: "untangle.lol ayuda a las personas a avanzar — cualquiera que sea su objetivo. Desde dormir mejor hasta crear una empresa. Gratis. Sin anuncios. Sin cuenta.",
    missionTitle: "Nuestra misión",
    mission: "Creemos que todo el mundo merece un siguiente paso claro. No solo quienes pueden permitirse un coach o conocen a las personas adecuadas. Todo el mundo. Por eso untangle.lol es completamente gratuito y quiere seguir siéndolo.",
    whyTitle: "Por qué las donaciones son tan importantes",
    why: [
      "untangle.lol no tiene inversores ni publicidad. Lo que ves es lo que obtienes: un producto honesto e independiente.",
      "Cada paso impulsado por IA cuesta dinero: costes de servidor, API y desarrollo. Esa factura la pagan personas como tú.",
      "Gracias a las donaciones, podemos mantener la aplicación gratuita para todos, incluidas las personas sin clave API.",
    ],
    howTitle: "¿A dónde va tu donación?",
    how: [
      { icon: "server", label: "Costes de servidor", desc: "Alojamiento e infraestructura para mantener la aplicación rápida y confiable." },
      { icon: "ai", label: "Costes de IA", desc: "Los modelos de IA que permiten preguntas gratuitas para usuarios sin clave API." },
      { icon: "dev", label: "Desarrollo", desc: "Nuevas funciones, más idiomas y una mejor experiencia para todos los usuarios." },
    ],
    quote: "Cada donación — grande o pequeña — ayuda a alguien atascado a dar su siguiente paso.",
    ctaTitle: "Donar vía bunq",
    ctaDesc: "Cada contribución cuenta. Pago único, sin cuenta necesaria.",
    ctaBtn: "Donar ahora →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol es un producto independiente de Bach Software. Sin accionistas, sin anunciantes — solo usuarios que confían en nosotros.",
  },
  pt: {
    label: "Português",
    back: "← Voltar ao untangle.lol",
    tagline: "Gratuito. Privado. Para todos.",
    title: "Ajude a manter o untangle.lol gratuito",
    hero: "O untangle.lol ajuda as pessoas a avançar — qualquer que seja o objetivo. De dormir melhor a criar uma empresa. Gratuito. Sem anúncios. Sem conta.",
    missionTitle: "Nossa missão",
    mission: "Acreditamos que todos merecem um próximo passo claro. Não apenas quem pode pagar um coach ou conhece as pessoas certas. Todos. É por isso que o untangle.lol é completamente gratuito e quer continuar assim.",
    whyTitle: "Por que as doações são tão importantes",
    why: [
      "O untangle.lol não tem investidores nem publicidade. O que você vê é o que você obtém — um produto honesto e independente.",
      "Cada passo impulsionado por IA custa dinheiro: custos de servidor, API e desenvolvimento. Essa conta é paga por pessoas como você.",
      "Graças às doações, podemos manter o aplicativo gratuito para todos — incluindo pessoas sem chave de API.",
    ],
    howTitle: "Para onde vai sua doação?",
    how: [
      { icon: "server", label: "Custos de servidor", desc: "Hospedagem e infraestrutura para manter o aplicativo rápido e confiável." },
      { icon: "ai", label: "Custos de IA", desc: "Os modelos de IA que permitem perguntas gratuitas para usuários sem chave de API." },
      { icon: "dev", label: "Desenvolvimento", desc: "Novos recursos, mais idiomas e uma melhor experiência para todos os usuários." },
    ],
    quote: "Cada doação — grande ou pequena — ajuda alguém que está preso a dar seu próximo passo.",
    ctaTitle: "Doe via bunq",
    ctaDesc: "Cada contribuição conta. Único, sem necessidade de conta.",
    ctaBtn: "Doe agora →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol é um produto independente da Bach Software. Sem acionistas, sem anunciantes — apenas usuários que confiam em nós.",
  },
  ar: {
    label: "العربية",
    dir: "rtl",
    back: "← العودة إلى untangle.lol",
    tagline: "مجاني. خاص. للجميع.",
    title: "ساعد في إبقاء untangle.lol مجانيًا",
    hero: "يساعد untangle.lol الناس على التقدم — مهما كان هدفهم. من النوم بشكل أفضل إلى بدء مشروع تجاري. مجاني. بدون إعلانات. بدون حساب.",
    missionTitle: "مهمتنا",
    mission: "نحن نؤمن بأن كل شخص يستحق خطوة تالية واضحة. ليس فقط أولئك الذين يستطيعون تحمّل تكاليف مدرب، أو الذين يعرفون الأشخاص المناسبين. الجميع. لهذا السبب untangle.lol مجاني تمامًا ويريد الاستمرار على هذا النحو.",
    whyTitle: "لماذا التبرعات مهمة جدًا",
    why: [
      "لا يمتلك untangle.lol مستثمرين ولا إعلانات. ما تراه هو ما تحصل عليه — منتج صادق ومستقل.",
      "كل خطوة مدعومة بالذكاء الاصطناعي تكلّف مالًا: تكاليف الخوادم، تكاليف API، والتطوير. هذه الفاتورة يدفعها أناس مثلك.",
      "بفضل التبرعات، يمكننا إبقاء التطبيق مجانيًا للجميع — بما في ذلك الأشخاص الذين ليس لديهم مفتاح API.",
    ],
    howTitle: "أين يذهب تبرعك؟",
    how: [
      { icon: "server", label: "تكاليف الخادم", desc: "الاستضافة والبنية التحتية للحفاظ على التطبيق سريعًا وموثوقًا." },
      { icon: "ai", label: "تكاليف الذكاء الاصطناعي", desc: "نماذج الذكاء الاصطناعي التي تتيح الأسئلة المجانية للمستخدمين بدون مفتاح API." },
      { icon: "dev", label: "التطوير", desc: "ميزات جديدة، لغات أكثر، وتجربة أفضل لجميع المستخدمين." },
    ],
    quote: "كل تبرع — كبيرًا كان أم صغيرًا — يساعد شخصًا عالقًا على اتخاذ خطوته التالية.",
    ctaTitle: "تبرع عبر bunq",
    ctaDesc: "كل مساهمة تُحدث فرقًا. مرة واحدة، لا حاجة لحساب.",
    ctaBtn: "تبرع الآن ←",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol منتج مستقل من Bach Software. لا مساهمون، لا معلنون — فقط مستخدمون يثقون بنا.",
  },
  bn: {
    label: "বাংলা",
    back: "← untangle.lol-এ ফিরে যান",
    tagline: "বিনামূল্যে। ব্যক্তিগত। সবার জন্য।",
    title: "untangle.lol বিনামূল্যে রাখতে সাহায্য করুন",
    hero: "untangle.lol মানুষকে এগিয়ে যেতে সাহায্য করে — যেকোনো লক্ষ্যেই হোক। ভালো ঘুমানো থেকে ব্যবসা শুরু করা পর্যন্ত। বিনামূল্যে। বিজ্ঞাপন ছাড়া। অ্যাকাউন্ট ছাড়া।",
    missionTitle: "আমাদের লক্ষ্য",
    mission: "আমরা বিশ্বাস করি সবাই একটি স্পষ্ট পরবর্তী পদক্ষেপের যোগ্য। শুধু যারা কোচ নিতে পারেন বা সঠিক লোক চেনেন তারাই নন। সবাই। সেজন্যই untangle.lol সম্পূর্ণ বিনামূল্যে এবং এভাবেই থাকতে চায়।",
    whyTitle: "দান কেন এত গুরুত্বপূর্ণ",
    why: [
      "untangle.lol-এর কোনো বিনিয়োগকারী বা বিজ্ঞাপন নেই। আপনি যা দেখেন তাই পান — একটি সৎ, স্বাধীন পণ্য।",
      "প্রতিটি AI-চালিত পদক্ষেপে খরচ আছে: সার্ভার, API এবং ডেভেলপমেন্ট খরচ। সেই বিল আপনার মতো মানুষই দেন।",
      "দানের মাধ্যমে আমরা সবার জন্য অ্যাপটি বিনামূল্যে রাখতে পারি।",
    ],
    howTitle: "আপনার দান কোথায় যায়?",
    how: [
      { icon: "server", label: "সার্ভার খরচ", desc: "অ্যাপটি দ্রুত ও নির্ভরযোগ্য রাখতে হোস্টিং এবং অবকাঠামো।" },
      { icon: "ai", label: "AI খরচ", desc: "AI মডেল যা API কী ছাড়া ব্যবহারকারীদের জন্য বিনামূল্যে প্রশ্নের সুযোগ দেয়।" },
      { icon: "dev", label: "উন্নয়ন", desc: "নতুন ফিচার, আরও ভাষা এবং সবার জন্য আরও ভালো অভিজ্ঞতা।" },
    ],
    quote: "প্রতিটি দান — বড় বা ছোট — কাউকে আটকে থাকা অবস্থা থেকে পরবর্তী পদক্ষেপ নিতে সাহায্য করে।",
    ctaTitle: "bunq-এর মাধ্যমে দান করুন",
    ctaDesc: "প্রতিটি অবদান গুরুত্বপূর্ণ। এককালীন, কোনো অ্যাকাউন্টের প্রয়োজন নেই।",
    ctaBtn: "এখনই দান করুন →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol হলো Bach Software-এর একটি স্বাধীন পণ্য। কোনো শেয়ারহোল্ডার নেই, কোনো বিজ্ঞাপনদাতা নেই — শুধু আমাদের বিশ্বাস করা ব্যবহারকারীরা।",
  },
  hi: {
    label: "हिन्दी",
    back: "← untangle.lol पर वापस जाएं",
    tagline: "मुफ़्त। निजी। सभी के लिए।",
    title: "untangle.lol को मुफ़्त रखने में मदद करें",
    hero: "untangle.lol लोगों को आगे बढ़ने में मदद करता है — चाहे लक्ष्य कोई भी हो। बेहतर नींद से लेकर खुद का व्यवसाय शुरू करने तक। मुफ़्त। बिना विज्ञापन। बिना अकाउंट।",
    missionTitle: "हमारा मिशन",
    mission: "हम मानते हैं कि हर इंसान एक स्पष्ट अगले कदम का हकदार है। सिर्फ वे नहीं जो कोच का खर्च उठा सकते हैं या सही लोगों को जानते हैं। सभी। इसीलिए untangle.lol पूरी तरह मुफ़्त है और ऐसा ही रहना चाहता है।",
    whyTitle: "दान इतना ज़रूरी क्यों है",
    why: [
      "untangle.lol के पास कोई निवेशक नहीं है और न ही विज्ञापन। जो आप देखते हैं वही पाते हैं — एक ईमानदार, स्वतंत्र उत्पाद।",
      "हर AI-संचालित कदम में पैसा लगता है: सर्वर, API और विकास की लागत। वह बिल आप जैसे लोग ही चुकाते हैं।",
      "दान की बदौलत हम ऐप को सभी के लिए मुफ़्त रख सकते हैं।",
    ],
    howTitle: "आपका दान कहाँ जाता है?",
    how: [
      { icon: "server", label: "सर्वर लागत", desc: "ऐप को तेज़ और विश्वसनीय बनाए रखने के लिए होस्टिंग और बुनियादी ढांचा।" },
      { icon: "ai", label: "AI लागत", desc: "AI मॉडल जो API key के बिना उपयोगकर्ताओं को मुफ़्त सवाल पूछने की सुविधा देते हैं।" },
      { icon: "dev", label: "विकास", desc: "नई सुविधाएं, अधिक भाषाएं और सभी उपयोगकर्ताओं के लिए बेहतर अनुभव।" },
    ],
    quote: "हर दान — बड़ा हो या छोटा — किसी फंसे हुए इंसान को अगला कदम उठाने में मदद करता है।",
    ctaTitle: "bunq के ज़रिए दान करें",
    ctaDesc: "हर योगदान मायने रखता है। एकबारगी, कोई अकाउंट ज़रूरी नहीं।",
    ctaBtn: "अभी दान करें →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol, Bach Software का एक स्वतंत्र उत्पाद है। कोई शेयरधारक नहीं, कोई विज्ञापनदाता नहीं — सिर्फ वे उपयोगकर्ता जो हम पर भरोसा करते हैं।",
  },
  id: {
    label: "Bahasa Indonesia",
    back: "← Kembali ke untangle.lol",
    tagline: "Gratis. Pribadi. Untuk semua.",
    title: "Bantu jaga untangle.lol tetap gratis",
    hero: "untangle.lol membantu orang maju — apapun tujuannya. Dari tidur lebih baik hingga memulai bisnis. Gratis. Tanpa iklan. Tanpa akun.",
    missionTitle: "Misi kami",
    mission: "Kami percaya bahwa setiap orang berhak mendapatkan langkah berikutnya yang jelas. Bukan hanya mereka yang bisa membayar pelatih atau mengenal orang yang tepat. Semua orang. Itulah mengapa untangle.lol sepenuhnya gratis dan ingin tetap begitu.",
    whyTitle: "Mengapa donasi sangat penting",
    why: [
      "untangle.lol tidak memiliki investor dan tidak ada iklan. Apa yang kamu lihat itulah yang kamu dapatkan — produk yang jujur dan independen.",
      "Setiap langkah bertenaga AI membutuhkan biaya: biaya server, API, dan pengembangan. Tagihan itu dibayar oleh orang-orang sepertimu.",
      "Berkat donasi, kami bisa menjaga aplikasi tetap gratis untuk semua orang.",
    ],
    howTitle: "Ke mana donasimu pergi?",
    how: [
      { icon: "server", label: "Biaya server", desc: "Hosting dan infrastruktur untuk menjaga aplikasi tetap cepat dan andal." },
      { icon: "ai", label: "Biaya AI", desc: "Model AI yang memungkinkan pertanyaan gratis untuk pengguna tanpa kunci API." },
      { icon: "dev", label: "Pengembangan", desc: "Fitur baru, lebih banyak bahasa, dan pengalaman yang lebih baik untuk semua pengguna." },
    ],
    quote: "Setiap donasi — besar atau kecil — membantu seseorang yang terjebak untuk mengambil langkah berikutnya.",
    ctaTitle: "Donasi via bunq",
    ctaDesc: "Setiap kontribusi berarti. Sekali bayar, tanpa perlu akun.",
    ctaBtn: "Donasi sekarang →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol adalah produk independen dari Bach Software. Tidak ada pemegang saham, tidak ada pengiklan — hanya pengguna yang mempercayai kami.",
  },
  ja: {
    label: "日本語",
    back: "← untangle.lolに戻る",
    tagline: "無料。プライベート。すべての人のために。",
    title: "untangle.lolを無料に保つためにご協力ください",
    hero: "untangle.lolは、人々が前進するのを助けます — どんな目標でも。より良い睡眠からビジネスの立ち上げまで。無料。広告なし。アカウント不要。",
    missionTitle: "私たちの使命",
    mission: "私たちは、誰もが明確な次のステップを持つ権利があると信じています。コーチを雇える人や適切な人脈を持つ人だけでなく、すべての人が。だからこそ、untangle.lolは完全無料であり、そのまま続けたいと思っています。",
    whyTitle: "寄付がとても重要な理由",
    why: [
      "untangle.lolには投資家も広告もありません。見えているものがすべてです — 正直で独立したプロダクト。",
      "AIによる各ステップにはコストがかかります：サーバー費用、API費用、開発費。その請求書はあなたのような方々が支払っています。",
      "寄付のおかげで、APIキーを持たないユーザーを含む、すべての人に無料でアプリを提供し続けることができます。",
    ],
    howTitle: "あなたの寄付はどこへ行きますか？",
    how: [
      { icon: "server", label: "サーバー費用", desc: "アプリを高速かつ信頼性の高い状態に保つためのホスティングとインフラ。" },
      { icon: "ai", label: "AI費用", desc: "APIキーなしのユーザーに無料質問を提供するAIモデル。" },
      { icon: "dev", label: "開発", desc: "新機能、より多くの言語、すべてのユーザーのためのより良い体験。" },
    ],
    quote: "大きな寄付でも小さな寄付でも、行き詰まっている誰かが次のステップを踏み出すのに役立ちます。",
    ctaTitle: "bunqで寄付する",
    ctaDesc: "あなたの貢献は必ず届きます。一回払い、アカウント不要。",
    ctaBtn: "今すぐ寄付する →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lolはBach Softwareの独立したプロダクトです。株主なし、広告主なし — 私たちを信頼するユーザーだけです。",
  },
  ru: {
    label: "Русский",
    back: "← Вернуться на untangle.lol",
    tagline: "Бесплатно. Приватно. Для всех.",
    title: "Помогите сохранить untangle.lol бесплатным",
    hero: "untangle.lol помогает людям двигаться вперёд — с любой целью. От улучшения сна до открытия бизнеса. Бесплатно. Без рекламы. Без аккаунта.",
    missionTitle: "Наша миссия",
    mission: "Мы верим, что каждый человек заслуживает чёткого следующего шага. Не только те, кто может позволить себе коуча или знает нужных людей. Все. Именно поэтому untangle.lol полностью бесплатен и хочет таким оставаться.",
    whyTitle: "Почему пожертвования так важны",
    why: [
      "У untangle.lol нет инвесторов и нет рекламы. Что видите — то и получаете: честный, независимый продукт.",
      "Каждый шаг на основе ИИ требует затрат: расходы на серверы, API и разработку. Эти расходы покрывают такие же люди, как вы.",
      "Благодаря пожертвованиям мы можем держать приложение бесплатным для всех.",
    ],
    howTitle: "Куда идёт ваше пожертвование?",
    how: [
      { icon: "server", label: "Серверные расходы", desc: "Хостинг и инфраструктура для поддержания скорости и надёжности приложения." },
      { icon: "ai", label: "Расходы на ИИ", desc: "Модели ИИ, которые обеспечивают бесплатные вопросы для пользователей без API-ключа." },
      { icon: "dev", label: "Разработка", desc: "Новые функции, больше языков и лучший опыт для всех пользователей." },
    ],
    quote: "Каждое пожертвование — большое или маленькое — помогает кому-то застрявшему сделать следующий шаг.",
    ctaTitle: "Пожертвовать через bunq",
    ctaDesc: "Каждый вклад важен. Разово, без регистрации.",
    ctaBtn: "Пожертвовать →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol — независимый продукт Bach Software. Без акционеров, без рекламодателей — только пользователи, которые нам доверяют.",
  },
  sw: {
    label: "Kiswahili",
    back: "← Rudi kwa untangle.lol",
    tagline: "Bure. Faragha. Kwa kila mtu.",
    title: "Saidia kuendelea kwa untangle.lol bure",
    hero: "untangle.lol husaidia watu kuendelea mbele — iwe lengo lolote. Kulala vizuri hadi kuanzisha biashara. Bure. Bila matangazo. Bila akaunti.",
    missionTitle: "Dhamira yetu",
    mission: "Tunaamini kila mtu anastahili hatua inayofuata iliyo wazi. Si wale tu wanaoweza kumudu kocha au wanaojua watu wanaofaa. Kila mtu. Ndiyo maana untangle.lol ni bure kabisa na inataka kuendelea hivyo.",
    whyTitle: "Kwa nini michango ni muhimu sana",
    why: [
      "untangle.lol haina wawekezaji wala matangazo. Unachokiona ndicho unachopata — bidhaa ya kweli na huru.",
      "Kila hatua inayoendeshwa na AI inahitaji pesa: gharama za seva, API na maendeleo. Bili hiyo inalipwa na watu kama wewe.",
      "Kwa sababu ya michango, tunaweza kuweka programu bure kwa kila mtu.",
    ],
    howTitle: "Mchango wako unaenda wapi?",
    how: [
      { icon: "server", label: "Gharama za seva", desc: "Mwenyeji na miundombinu ili kuweka programu haraka na ya kuaminika." },
      { icon: "ai", label: "Gharama za AI", desc: "Mifano ya AI inayoruhusu maswali ya bure kwa watumiaji bila ufunguo wa API." },
      { icon: "dev", label: "Maendeleo", desc: "Vipengele vipya, lugha zaidi na uzoefu bora kwa watumiaji wote." },
    ],
    quote: "Kila mchango — mkubwa au mdogo — husaidia mtu aliyekwama kuchukua hatua yake inayofuata.",
    ctaTitle: "Changia kupitia bunq",
    ctaDesc: "Kila mchango unachangia. Mara moja, hakuna akaunti inayohitajika.",
    ctaBtn: "Changia sasa →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol ni bidhaa huru ya Bach Software. Hakuna wanahisa, hakuna watangazaji — watumiaji tu wanaotumini.",
  },
  tr: {
    label: "Türkçe",
    back: "← untangle.lol'a geri dön",
    tagline: "Ücretsiz. Gizli. Herkes için.",
    title: "untangle.lol'u ücretsiz tutmaya yardım edin",
    hero: "untangle.lol insanların ilerlemeye devam etmesine yardımcı olur — hedef ne olursa olsun. Daha iyi uyumaktan iş kurmaya kadar. Ücretsiz. Reklamsız. Hesap gerektirmez.",
    missionTitle: "Misyonumuz",
    mission: "Her insanın açık bir sonraki adıma hakkı olduğuna inanıyoruz. Sadece koç tutabilenler veya doğru insanları tanıyanlar için değil. Herkes için. Bu yüzden untangle.lol tamamen ücretsizdir ve böyle kalmak ister.",
    whyTitle: "Bağışlar neden bu kadar önemli",
    why: [
      "untangle.lol'un yatırımcısı ve reklamı yoktur. Gördüğünüz aldığınızdır — dürüst, bağımsız bir ürün.",
      "Her yapay zeka destekli adımın maliyeti vardır: sunucu, API ve geliştirme masrafları. Bu fatura sizin gibi insanlar tarafından ödenir.",
      "Bağışlar sayesinde uygulamayı API anahtarı olmayanlar dahil herkes için ücretsiz tutabiliyoruz.",
    ],
    howTitle: "Bağışınız nereye gidiyor?",
    how: [
      { icon: "server", label: "Sunucu maliyetleri", desc: "Uygulamayı hızlı ve güvenilir tutmak için barındırma ve altyapı." },
      { icon: "ai", label: "Yapay zeka maliyetleri", desc: "API anahtarı olmayan kullanıcılara ücretsiz sorular sağlayan yapay zeka modelleri." },
      { icon: "dev", label: "Geliştirme", desc: "Yeni özellikler, daha fazla dil ve tüm kullanıcılar için daha iyi bir deneyim." },
    ],
    quote: "Her bağış — büyük ya da küçük — sıkışıp kalmış birine bir sonraki adımı atmasında yardımcı olur.",
    ctaTitle: "bunq aracılığıyla bağış yapın",
    ctaDesc: "Her katkı önemlidir. Tek seferlik, hesap gerekmez.",
    ctaBtn: "Şimdi bağış yapın →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol, Bach Software'in bağımsız bir ürünüdür. Hissedar yok, reklamveren yok — sadece bize güvenen kullanıcılar.",
  },
  zh: {
    label: "中文",
    back: "← 返回 untangle.lol",
    tagline: "免费。私密。为所有人。",
    title: "帮助保持 untangle.lol 免费",
    hero: "untangle.lol 帮助人们向前迈进——无论目标是什么。从睡得更好到创业。免费。无广告。无需账号。",
    missionTitle: "我们的使命",
    mission: "我们相信每个人都值得拥有清晰的下一步。不仅仅是那些能负担得起教练的人，或认识合适的人的人。每个人都值得。这就是为什么 untangle.lol 完全免费，并希望继续保持这样。",
    whyTitle: "为什么捐款如此重要",
    why: [
      "untangle.lol 没有投资者，也没有广告。所见即所得——一个诚实、独立的产品。",
      "每一个由 AI 驱动的步骤都有成本：服务器费用、API 费用、开发费用。这些账单由像您这样的人支付。",
      "多亏了捐款，我们才能让所有人免费使用这个应用，包括没有 API 密钥的用户。",
    ],
    howTitle: "您的捐款用于何处？",
    how: [
      { icon: "server", label: "服务器费用", desc: "托管和基础设施，保持应用程序快速可靠。" },
      { icon: "ai", label: "AI 费用", desc: "为没有 API 密钥的用户提供免费提问的 AI 模型。" },
      { icon: "dev", label: "开发", desc: "新功能、更多语言，以及为所有用户提供更好的体验。" },
    ],
    quote: "每一笔捐款——无论大小——都能帮助一个陷入困境的人迈出下一步。",
    ctaTitle: "通过 bunq 捐款",
    ctaDesc: "每一份贡献都有意义。一次性，无需账号。",
    ctaBtn: "立即捐款 →",
    ctaUrl: "https://bunq.me/BachSoftware",
    footer: "untangle.lol 是 Bach Software 的独立产品。没有股东，没有广告商——只有信任我们的用户。",
  },
};

const HOW_ICONS = {
  server: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  ),
  ai: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4z"/>
      <line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="8" x2="12" y2="16"/>
    </svg>
  ),
  dev: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
    </svg>
  ),
};

export default function DonatePage({ searchParams }) {
  const lang = LANGS.includes(searchParams?.lang) ? searchParams.lang : "nl";
  const d = CONTENT[lang];
  const isRtl = d.dir === "rtl";

  return (
    <html lang={lang} dir={isRtl ? "rtl" : "ltr"}>
      <body style={{ margin: 0, background: "#0f172a", color: "#f1f5f9", fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", WebkitFontSmoothing: "antialiased" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px 100px" }}>

          {/* Back link */}
          <div style={{ marginBottom: 36 }}>
            <a href={`/?lang=${lang}`} style={{ fontSize: 13, color: "#64748b", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
              </svg>
              untangle.lol
            </a>
          </div>

          {/* Language switcher */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 40 }}>
            {LANGS.map(code => (
              <a key={code} href={`/donate?lang=${code}`} style={{
                padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                textDecoration: "none",
                background: code === lang ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.05)",
                color: code === lang ? "#facc15" : "#64748b",
                border: `1px solid ${code === lang ? "rgba(250,204,21,0.35)" : "rgba(255,255,255,0.08)"}`,
              }}>
                {code.toUpperCase()}
              </a>
            ))}
          </div>

          {/* Hero */}
          <div style={{ marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#facc15", marginBottom: 12 }}>
              {d.tagline}
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.02em" }}>
              {d.title}
            </h1>
            <p style={{ fontSize: 16, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>
              {d.hero}
            </p>
          </div>

          {/* Mission */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 12 }}>
              {d.missionTitle}
            </h2>
            <p style={{ fontSize: 15, color: "#cbd5e1", lineHeight: 1.75, margin: 0, padding: "20px 24px", background: "rgba(250,204,21,0.05)", borderLeft: "3px solid rgba(250,204,21,0.5)", borderRadius: "0 12px 12px 0" }}>
              {d.mission}
            </p>
          </section>

          {/* Why */}
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 16 }}>
              {d.whyTitle}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {d.why.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(250,204,21,0.15)", border: "1px solid rgba(250,204,21,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1, color: "#facc15", fontSize: 11, fontWeight: 800 }}>
                    {i + 1}
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>{item}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#64748b", marginBottom: 16 }}>
              {d.howTitle}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {d.how.map((item, i) => (
                <div key={i} style={{ padding: "18px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ color: "#facc15" }}>{HOW_ICONS[item.icon]}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quote */}
          <div style={{ marginBottom: 48, textAlign: "center", padding: "24px 32px", background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.15)", borderRadius: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(250,204,21,0.4)" style={{ marginBottom: 12, display: "block", margin: "0 auto 12px" }}>
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <p style={{ fontSize: 16, color: "#e2e8f0", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
              &ldquo;{d.quote}&rdquo;
            </p>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center", padding: "40px 32px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", margin: "0 0 8px", letterSpacing: "-0.02em" }}>{d.ctaTitle}</h2>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>{d.ctaDesc}</p>
            <a
              href={d.ctaUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "14px 32px", borderRadius: 12,
                background: "linear-gradient(135deg,#facc15,#eab308)",
                color: "#0f172a", fontWeight: 800, fontSize: 16,
                textDecoration: "none", letterSpacing: "-0.01em",
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {d.ctaBtn}
            </a>
          </div>

          {/* Footer */}
          <p style={{ fontSize: 12, color: "#334155", textAlign: "center", marginTop: 40, lineHeight: 1.6 }}>
            {d.footer}
          </p>

        </div>
      </body>
    </html>
  );
}
