"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import confetti from "canvas-confetti";

const ALTRUISM_BONUS_CREDITS = 10;

// Umami custom event helper — safe no-op if script hasn't loaded yet
const utrack=(event,data)=>{try{window.umami?.track(event,data);}catch{}};

// ─── Config ──────────────────────────────────────────────────────────────────
const ANTHROPIC_URL  = "https://api.anthropic.com/v1/messages";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ANTHROPIC   = "claude-sonnet-4-6";
const MODEL_OPENROUTER  = "anthropic/claude-sonnet-4-6";
const PRICE = { input: 3.00, output: 15.00 };
function calcCost(inp,out){ return (inp/1e6)*PRICE.input + (out/1e6)*PRICE.output; }
function fmtCost(usd){ return usd<0.001?"<$0.001":"$"+usd.toFixed(4); }

const ls = {
  get: (k)    => { try { return localStorage.getItem(k); }    catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); }        catch {} },
  del: (k)    => { try { localStorage.removeItem(k); }        catch {} },
};

const KEYS = {
  theme:    "untangle_theme",
  session:  "untangle_session",
  apiKey:   "untangle_apikey",
  recents:  "untangle_recents",
  guestHist:"untangle_guest_hist",
  usage:    "untangle_usage",
   credits:  "untangle_credits",
   creditsTs: "untangle_credits_ts",
   altruismBonusTs: "untangle_altruism_bonus_ts",
   clientRef:"untangle_client_ref",
};

const FREE_CREDITS = 10;

function eKey(email) { return "untangle_hist_" + email.toLowerCase().replace(/[^a-z0-9]/g,"_"); }

function keyProvider(key){ return key?.startsWith("sk-or-")?"openrouter":"anthropic"; }
function getCredential() {
  const key = ls.get(KEYS.apiKey);
  return { key, valid: !!key, provider: key?keyProvider(key):null };
}
function buildHeaders(key) {
  const provider = keyProvider(key);
  if(provider==="openrouter"){
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": "https://untangle.lol",
      "X-Title": "untangle.lol",
    };
  }
  return {
    "Content-Type": "application/json",
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
    "x-api-key": key,
  };
}

// Generate a random client reference ID for Stripe fulfillment
function genClientRef() {
  return Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,"0")).join("");
}

const LANGS = [
  {code:"nl",label:"Nederlands",flag:"🇳🇱",ph:"Bijv. 'Ik wil beter slapen' of 'Ik wil leren gitaarspelen' 🎸",hero:"Wat wil je bereiken?",heroS:["Typ het maar in.","Geen vraag is te gek.","Klein of groot — alles mag.","Wat houdt je bezig?","Schrijf het op, wij helpen verder."],go:"Laten we beginnen →",back:"← Terug",out:"Uitloggen",clr:"🗑️ Alles wissen",nG:"➕ Nieuw doel",noG:"Nog geen doelen. Tijd om te beginnen!",prog:"voortgang",allD:"🎉 Alles afgerond!",sOf:"van",eth:"🌍 Advies met respect voor mens, planeet en welzijn",err:"Oeps, probeer het nog eens!",resB:"← Terug naar overzicht",dW:"Welkom terug",dS:"Hier zijn je doelen.",byok:"Voer je API-sleutel in",byokH1:"Breng je eigen API-sleutel mee",chAuth:"Authenticatie wijzigen",rmKey:"Sleutel verwijderen",lSel:"Taal",byokL:"API-sleutel (Anthropic of OpenRouter)",byokPh:"sk-ant-... of sk-or-...",byokSave:"Opslaan & beginnen",byokNote:"Opgeslagen in je browser. Nooit gedeeld.",apiKeyBadge:"🔑 API-sleutel",apiKeyUnset:"instellen",checking:"Controleren...",chooseLang:"Kies je taal",byokAnthTitle:"Anthropic",byokAnthDesc:"Directe toegang tot Claude. Sleutels beginnen met",byokAnthS1:"Ga naar console.anthropic.com",byokAnthS2:"Aanmelden / inloggen",byokAnthS3:"Instellingen → API-sleutels → Sleutel aanmaken",byokAnthLink:"Haal Anthropic-sleutel op →",byokOrTitle:"OpenRouter",byokOrDesc:"Betaal per gebruik. Vaak goedkoper. Sleutels beginnen met",byokOrS1:"Ga naar openrouter.ai",byokOrS2:"Aanmelden / inloggen",byokOrS3:"Sleutels → Sleutel aanmaken",byokOrLink:"Haal OpenRouter-sleutel op →",keyErrFmt:"Sleutel moet beginnen met sk-ant- of sk-or-",keyErrInv:"Ongeldige sleutel: ",keyErrNet:"API niet bereikbaar — sleutel toch opgeslagen.",usageStat:"Gebruiksstatistieken",apiCalls:"API-aanroepen",estCost:"Geschatte kosten",inputTok:"Invoertokens",outputTok:"Uitvoertokens",resetStats:"Statistieken wissen",rmTip:"Verwijderen",start:"Start",cred:"credits",credFree:"gratis credits",credOut:"Geen credits meer",credOutMsg:"Je gratis credits zijn op. Voeg je eigen API-sleutel toe om door te gaan — gratis bij Anthropic en OpenRouter.",credByok:"Eigen sleutel toevoegen →",lp:["🧠 Nadenken...","☕ Ideeën brouwen...","🔮 Kristallen bol opwarmen...","🧙 Spreuken uitspreken...","🤔 Diep nadenken...","🎯 Scherp stellen..."],
  topUp:"Credits bijkopen",topUpDesc:"10 credits voor €1,00",topUpBtn:"Betalen met Stripe →",topUpSuccess:"Betaling geslaagd! Credits worden bijgeschreven.",topUpPending:"Credits worden verwerkt...",topUpPopupTitle:"Credits bijgeschreven! 🎉",topUpPopupMsg:"untangle.lol is gratis en privé — zonder advertenties of dataverzameling. Met credits houd je de AI aan het draaien en steun je een eerlijk, onafhankelijk product. Dank je wel!",topUpPopupBtn:"Top, laten we beginnen!",
  altruismPopupTitle:"Wat lief van je! 💛",altruismPopupMsg:"Je doel gaat over het helpen van anderen — zoals vrijwilligerswerk, mantelzorg of een goed doel. Dat verdient een beloning: rond álle stappen af en ontvang automatisch 10 gratis credits!",altruismPopupBtn:"Top, ik ga aan de slag!",altruismBonusTitle:"🎁 +10 credits verdiend!",altruismBonusMsg:"Gefeliciteerd! Je hebt je altruïstische doel afgerond. Als dank voor je inzet voor anderen hebben we 10 gratis credits aan je account toegevoegd.",altruismBonusBtn:"Super, bedankt!",altruismTeaser:"💛 Gaat je doel over anderen helpen? Dan verdien je 10 gratis credits als je alle stappen afrondt.",altruismPopupMsgRepeat:"Je doel gaat over het helpen van anderen — wat ontzettend mooi is. Rond álle stappen af en maak echt het verschil!",analyticsNote:"We verzamelen anonieme gebruiksstatistieken (geen cookies, geen persoonsgegevens).",
  signIn:"Inloggen met Google",signInSub:"Sla je doelen op via al je apparaten",signOut:"Uitloggen",profile:"Profiel",terms:"Voorwaarden",privacy:"Privacy",stats:"Statistieken",donate:"❤️ Doneer",
  share:"Delen",shareCopy:"Kopiëren",shareCopied:"Gekopieerd!",shareMsg:"Bekijk mijn stappenplan op untangle.lol:",
  altruismLoadingMsg:"💛 Je bent iets moois aan het doen voor anderen.",
  altruisticSugg:["Ik wil vrijwilligerswerk doen bij een voedselbank","Ik wil mantelzorger worden voor een familielid","Ik wil een buurtmoestuin starten","Ik wil bloed doneren","Ik wil een mentorrol op me nemen voor een jongere"],
  phSugg:["Ik wil beter slapen","Ik wil leren gitaarspelen","Ik wil elke dag sporten","Ik wil een boek schrijven","Ik wil gezonder eten"],
  woop:"🎯 Probeer WOOP",woopOr:"of",woopTitle:"WOOP-methode",woopSub:"Een bewezen techniek om doelen om te zetten in actie — stap voor stap.",woopLabels:["Wens","Uitkomst","Obstakel","Plan"],woopHints:["Wat wil je echt bereiken? Kies iets wat je raakt — uitdagend maar haalbaar.","Stel je het beste resultaat voor. Hoe voel je je als je wens uitkomt?","Wat is het grootste interne obstakel — een gewoonte, gevoel of gedachte — dat je kan tegenhouden?","Als [obstakel], dan zal ik [actie]. Maak een concreet als-dan-plan."],woopPh:["Bijv. 'Ik wil elke ochtend sporten'","Bijv. 'Ik voel me energiek en trots op mezelf'","Bijv. 'Ik sla de wekker af omdat ik moe ben'","Bijv. 'Als ik de wekker afzet, leg ik mijn sportkleren klaar de avond ervoor'"],woopGo:"Maak mijn plan →",woopLink:"Meer over de wetenschap",woopSummaryTitle:"Jouw WOOP",suggLabel:"💡 Kies een suggestie",taClrConfirm:"wis?",celebTitle:"Gefeliciteerd! 🎉",celebMsg:"Je hebt alle stappen afgerond. Goed gedaan — dit verdient een feestje!",celebBtn:"Bedankt!"},

  {code:"en",label:"English",flag:"🇬🇧",ph:"E.g. 'I want to sleep better' or 'I want to learn guitar' 🎸",hero:"What do you want to achieve?",heroS:["Just type it in.","No question is too weird.","Big or small — anything goes.","What's on your mind?","Write it down, we'll help you figure it out."],go:"Let's begin →",back:"← Back",out:"Log out",clr:"🗑️ Clear all",nG:"➕ New goal",noG:"No goals yet. Time to begin!",prog:"progress",allD:"🎉 All done!",sOf:"of",eth:"🌍 Advice with respect for people, planet & wellbeing",err:"Oops, try again!",resB:"← Back to overview",dW:"Welcome back",dS:"Here are your goals.",byok:"Enter your API key",byokH1:"Bring your own API key",chAuth:"Change auth",rmKey:"Remove key",lSel:"Language",byokL:"API Key (Anthropic or OpenRouter)",byokPh:"sk-ant-... or sk-or-...",byokSave:"Save & continue",byokNote:"Stored in your browser only. Never shared.",apiKeyBadge:"🔑 API Key",apiKeyUnset:"set",checking:"Checking...",chooseLang:"Choose your language",byokAnthTitle:"Anthropic",byokAnthDesc:"Direct access to Claude. Keys start with",byokAnthS1:"Go to console.anthropic.com",byokAnthS2:"Sign up / log in",byokAnthS3:"Settings → API Keys → Create key",byokAnthLink:"Get Anthropic key →",byokOrTitle:"OpenRouter",byokOrDesc:"Pay-as-you-go. Often cheaper. Keys start with",byokOrS1:"Go to openrouter.ai",byokOrS2:"Sign up / log in",byokOrS3:"Keys → Create key",byokOrLink:"Get OpenRouter key →",keyErrFmt:"Key should start with sk-ant- or sk-or-",keyErrInv:"Invalid key: ",keyErrNet:"Could not reach API to verify — key saved anyway.",usageStat:"Usage stats",apiCalls:"API calls",estCost:"Est. cost",inputTok:"Input tokens",outputTok:"Output tokens",resetStats:"Reset stats",rmTip:"Remove",start:"Start",cred:"credits",credFree:"free credits",credOut:"Out of credits",credOutMsg:"Your free credits are used up. Add your own API key to keep going — free to get from Anthropic or OpenRouter.",credByok:"Add your own key →",lp:["🧠 Thinking...","☕ Brewing ideas...","🔮 Crystal ball warming up...","🧙 Casting spells...","🤔 Deep thought...","🎯 Locking in..."],
  topUp:"Top up credits",topUpDesc:"10 credits for €1.00",topUpBtn:"Pay with Stripe →",topUpSuccess:"Payment successful! Credits will be added shortly.",topUpPending:"Processing credits...",topUpPopupTitle:"Credits added! 🎉",topUpPopupMsg:"untangle.lol is free and private — no ads, no data harvesting. Credits keep the AI running and support a fair, independent product. Thank you for your support!",topUpPopupBtn:"Great, let's go!",
  altruismPopupTitle:"How kind of you! 💛",altruismPopupMsg:"Your goal is about helping others — like volunteering, caregiving, or supporting a good cause. That deserves a reward: complete all steps and automatically earn 10 free credits!",altruismPopupBtn:"Great, let's go!",altruismBonusTitle:"🎁 +10 credits earned!",altruismBonusMsg:"Congratulations! You completed your altruistic goal. As a thank-you for your efforts to help others, we've added 10 free credits to your account.",altruismBonusBtn:"Awesome, thank you!",altruismTeaser:"💛 Is your goal about helping others? Then earn 10 free credits when you complete all steps.",altruismPopupMsgRepeat:"Your goal is about helping others — which is truly wonderful. Complete all the steps and make a real difference!",analyticsNote:"We collect anonymous usage statistics (no cookies, no personal data).",
  signIn:"Sign in with Google",signInSub:"Save your goals across all devices",signOut:"Sign out",profile:"Profile",terms:"Terms",privacy:"Privacy",stats:"Stats",donate:"❤️ Donate",
  share:"Share",shareCopy:"Copy",shareCopied:"Copied!",shareMsg:"Check out my action plan on untangle.lol:",
  altruismLoadingMsg:"💛 You're doing something wonderful for others.",
  altruisticSugg:["I want to volunteer at a food bank","I want to become a caregiver for a family member","I want to mentor a young person","I want to donate blood regularly","I want to start a community garden"],
  phSugg:["I want to sleep better","I want to learn guitar","I want to exercise every day","I want to write a book","I want to eat healthier"],
  woop:"🎯 Try WOOP",woopOr:"or",woopTitle:"WOOP Method",woopSub:"A proven technique to turn wishes into action — step by step.",woopLabels:["Wish","Outcome","Obstacle","Plan"],woopHints:["What do you really want? Pick something that touches your heart — challenging but achievable.","Imagine the best possible result. How do you feel when your wish comes true?","What is the main inner obstacle — a habit, feeling, or thought — that could hold you back?","If [obstacle], then I will [action]. Make a specific if-then plan."],woopPh:["E.g. 'I want to exercise every morning'","E.g. 'I feel energised and proud of myself'","E.g. 'I snooze my alarm because I'm tired'","E.g. 'If I snooze my alarm, I will lay out my gym clothes the night before'"],woopGo:"Create my plan →",woopLink:"Learn about the science",woopSummaryTitle:"Your WOOP",suggLabel:"💡 Pick a suggestion",taClrConfirm:"clear?",celebTitle:"Congratulations! 🎉",celebMsg:"You've completed every step. Well done — this calls for a celebration!",celebBtn:"Thank you!"},

  {code:"de",label:"Deutsch",flag:"🇩🇪",ph:"Z.B. 'Besser schlafen' 🎸",hero:"Was willst du erreichen?",heroS:["Einfach tippen.","Keine Frage ist zu seltsam.","Groß oder klein — alles ist erlaubt.","Was beschäftigt dich?","Schreib es auf, wir helfen dir weiter."],go:"Los geht's →",back:"← Zurück",out:"Abmelden",clr:"🗑️ Löschen",nG:"➕ Neues Ziel",noG:"Keine Ziele. Zeit anzufangen!",prog:"Fortschritt",allD:"🎉 Geschafft!",sOf:"von",eth:"🌍 Respekt für Mensch & Planet",err:"Ups!",resB:"← Zurück",dW:"Willkommen zurück",dS:"Deine Ziele.",byok:"API-Schlüssel eingeben",byokH1:"Eigenen API-Schlüssel nutzen",chAuth:"Auth ändern",rmKey:"Schlüssel entfernen",lSel:"Sprache",byokL:"API-Schlüssel (Anthropic oder OpenRouter)",byokPh:"sk-ant-... oder sk-or-...",byokSave:"Speichern & loslegen",byokNote:"Im Browser gespeichert. Nie weitergegeben.",apiKeyBadge:"🔑 API-Schlüssel",apiKeyUnset:"setzen",checking:"Prüfen...",chooseLang:"Sprache wählen",byokAnthTitle:"Anthropic",byokAnthDesc:"Direktzugang zu Claude. Schlüssel beginnen mit",byokAnthS1:"console.anthropic.com aufrufen",byokAnthS2:"Registrieren / anmelden",byokAnthS3:"Einstellungen → API-Schlüssel → Schlüssel erstellen",byokAnthLink:"Anthropic-Schlüssel holen →",byokOrTitle:"OpenRouter",byokOrDesc:"Pay-as-you-go. Oft günstiger. Schlüssel beginnen mit",byokOrS1:"openrouter.ai aufrufen",byokOrS2:"Registrieren / anmelden",byokOrS3:"Schlüssel → Schlüssel erstellen",byokOrLink:"OpenRouter-Schlüssel holen →",keyErrFmt:"Schlüssel muss mit sk-ant- oder sk-or- beginnen",keyErrInv:"Ungültiger Schlüssel: ",keyErrNet:"API nicht erreichbar — Schlüssel trotzdem gespeichert.",usageStat:"Nutzungsstatistiken",apiCalls:"API-Anfragen",estCost:"Geschätzte Kosten",inputTok:"Eingabe-Token",outputTok:"Ausgabe-Token",resetStats:"Statistiken zurücksetzen",rmTip:"Entfernen",start:"Start",cred:"Credits",credFree:"Gratis-Credits",credOut:"Keine Credits mehr",credOutMsg:"Deine Gratis-Credits sind aufgebraucht. Füge deinen eigenen API-Schlüssel hinzu — kostenlos bei Anthropic oder OpenRouter.",credByok:"Eigenen Schlüssel hinzufügen →",lp:["🧠 Nachdenken...","☕ Ideen brauen...","🔮 Kristallkugel aufwärmen...","🧙 Zauber wirken...","🤔 Tief denken...","🎯 Fokussieren..."],
  topUp:"Credits aufladen",topUpDesc:"10 Credits für €1,00",topUpBtn:"Mit Stripe bezahlen →",topUpSuccess:"Zahlung erfolgreich! Credits werden gutgeschrieben.",topUpPending:"Credits werden verarbeitet...",topUpPopupTitle:"Credits gutgeschrieben! 🎉",topUpPopupMsg:"untangle.lol ist kostenlos und privat — keine Werbung, keine Datenweitergabe. Credits halten die KI am Laufen und unterstützen ein faires, unabhängiges Produkt. Danke!",topUpPopupBtn:"Super, los geht's!",
  altruismPopupTitle:"Wie nett von dir! 💛",altruismPopupMsg:"Dein Ziel geht darum, anderen zu helfen — z. B. Ehrenamt, Pflege oder Unterstützung eines guten Zwecks. Das verdient eine Belohnung: Schließe alle Schritte ab und erhalte automatisch 10 Gratis-Credits!",altruismPopupBtn:"Super, los geht's!",altruismBonusTitle:"🎁 +10 Credits verdient!",altruismBonusMsg:"Glückwunsch! Du hast dein altruistisches Ziel abgeschlossen. Als Dankeschön für deinen Einsatz für andere haben wir 10 Gratis-Credits zu deinem Konto hinzugefügt.",altruismBonusBtn:"Super, danke!",altruismTeaser:"💛 Geht dein Ziel darum, anderen zu helfen? Dann verdienst du 10 Gratis-Credits, wenn du alle Schritte abschließt.",altruismPopupMsgRepeat:"Dein Ziel geht darum, anderen zu helfen — das ist wirklich wunderbar. Schließe alle Schritte ab und bewirke echten Unterschied!",analyticsNote:"Wir erheben anonyme Nutzungsstatistiken (keine Cookies, keine personenbezogenen Daten).",
  signIn:"Mit Google anmelden",signInSub:"Ziele auf allen Geräten speichern",signOut:"Abmelden",profile:"Profil",terms:"AGB",privacy:"Datenschutz",stats:"Statistiken",donate:"❤️ Spenden",
  share:"Teilen",shareCopy:"Kopieren",shareCopied:"Kopiert!",shareMsg:"Sieh dir meinen Aktionsplan auf untangle.lol an:",
  altruismLoadingMsg:"💛 Du tust gerade etwas Wundervolles für andere.",
  altruisticSugg:["Ich möchte bei einer Tafel ehrenamtlich helfen","Ich möchte einen Angehörigen pflegen","Ich möchte einen Jugendlichen mentoren","Ich möchte regelmäßig Blut spenden","Ich möchte einen Gemeinschaftsgarten starten"],
  phSugg:["Ich möchte besser schlafen","Ich möchte Gitarre lernen","Ich möchte täglich Sport treiben","Ich möchte ein Buch schreiben","Ich möchte gesünder essen"],
  woop:"🎯 WOOP ausprobieren",woopOr:"oder",woopTitle:"WOOP-Methode",woopSub:"Eine bewährte Technik, um Wünsche in Handlungen umzuwandeln — Schritt für Schritt.",woopLabels:["Wunsch","Ergebnis","Hindernis","Plan"],woopHints:["Was willst du wirklich? Wähle etwas Bedeutungsvolles — herausfordernd, aber erreichbar.","Stell dir das beste Ergebnis vor. Wie fühlst du dich, wenn dein Wunsch in Erfüllung geht?","Was ist das größte innere Hindernis — eine Gewohnheit, ein Gefühl oder ein Gedanke — das dich aufhalten könnte?","Wenn [Hindernis], dann werde ich [Aktion]. Mach einen konkreten Wenn-dann-Plan."],woopPh:["Z.B. 'Ich möchte jeden Morgen Sport machen'","Z.B. 'Ich fühle mich energiegeladen und stolz auf mich'","Z.B. 'Ich drücke auf Snooze, weil ich müde bin'","Z.B. 'Wenn ich auf Snooze drücke, lege ich meine Sportsachen am Abend vorher bereit'"],woopGo:"Meinen Plan erstellen →",woopLink:"Mehr zur Wissenschaft",woopSummaryTitle:"Dein WOOP",suggLabel:"💡 Vorschlag wählen",taClrConfirm:"löschen?",celebTitle:"Glückwunsch! 🎉",celebMsg:"Du hast alle Schritte abgeschlossen. Gut gemacht — das muss gefeiert werden!",celebBtn:"Danke!"},

  {code:"fr",label:"Français",flag:"🇫🇷",ph:"Ex. 'Mieux dormir' 🎸",hero:"Que veux-tu accomplir ?",heroS:["Tape-le.","Aucune question n'est trop bizarre.","Grand ou petit — tout est permis.","Qu'est-ce qui t'occupe l'esprit ?","Écris-le, on t'aide à avancer."],go:"Commençons →",back:"← Retour",out:"Déco",clr:"🗑️ Effacer",nG:"➕ Nouveau",noG:"Pas d'objectifs. On commence !",prog:"progrès",allD:"🎉 Fini !",sOf:"de",eth:"🌍 Conseils respectueux",err:"Oups !",resB:"← Retour",dW:"Re-bonjour",dS:"Tes objectifs.",byok:"Entrer la clé API",byokH1:"Utilise ta propre clé API",chAuth:"Changer auth",rmKey:"Supprimer clé",lSel:"Langue",byokL:"Clé API (Anthropic ou OpenRouter)",byokPh:"sk-ant-... ou sk-or-...",byokSave:"Enregistrer",byokNote:"Stockée dans ton navigateur. Jamais partagée.",apiKeyBadge:"🔑 Clé API",apiKeyUnset:"définir",checking:"Vérification...",chooseLang:"Choisis ta langue",byokAnthTitle:"Anthropic",byokAnthDesc:"Accès direct à Claude. Les clés commencent par",byokAnthS1:"Aller sur console.anthropic.com",byokAnthS2:"S'inscrire / se connecter",byokAnthS3:"Paramètres → Clés API → Créer une clé",byokAnthLink:"Obtenir une clé Anthropic →",byokOrTitle:"OpenRouter",byokOrDesc:"Pay-as-you-go. Souvent moins cher. Les clés commencent par",byokOrS1:"Aller sur openrouter.ai",byokOrS2:"S'inscrire / se connecter",byokOrS3:"Clés → Créer une clé",byokOrLink:"Obtenir une clé OpenRouter →",keyErrFmt:"La clé doit commencer par sk-ant- ou sk-or-",keyErrInv:"Clé invalide : ",keyErrNet:"API inaccessible — clé sauvegardée quand même.",usageStat:"Statistiques d'utilisation",apiCalls:"Appels API",estCost:"Coût estimé",inputTok:"Tokens en entrée",outputTok:"Tokens en sortie",resetStats:"Réinitialiser",rmTip:"Supprimer",start:"Démarrer",cred:"crédits",credFree:"crédits gratuits",credOut:"Plus de crédits",credOutMsg:"Tes crédits gratuits sont épuisés. Ajoute ta propre clé API pour continuer — gratuite chez Anthropic ou OpenRouter.",credByok:"Ajouter ma clé →",lp:["🧠 Réflexion...","☕ Brassage d'idées...","🔮 Boule de cristal en chauffe...","🧙 Sorts en cours...","🤔 Pensée profonde...","🎯 Concentration..."],
  topUp:"Recharger les crédits",topUpDesc:"10 crédits pour €1,00",topUpBtn:"Payer avec Stripe →",topUpSuccess:"Paiement réussi ! Les crédits seront ajoutés sous peu.",topUpPending:"Traitement des crédits...",topUpPopupTitle:"Crédits ajoutés ! 🎉",topUpPopupMsg:"untangle.lol est gratuit et privé — sans pub ni collecte de données. Les crédits font tourner l'IA et soutiennent un produit équitable et indépendant. Merci !",topUpPopupBtn:"Super, c'est parti !",
  altruismPopupTitle:"Comme c'est gentil ! 💛",altruismPopupMsg:"Ton objectif consiste à aider les autres — bénévolat, aidant·e ou soutien à une bonne cause. Cela mérite une récompense : complète toutes les étapes et gagne automatiquement 10 crédits gratuits !",altruismPopupBtn:"Super, c'est parti !",altruismBonusTitle:"🎁 +10 crédits gagnés !",altruismBonusMsg:"Félicitations ! Tu as accompli ton objectif altruiste. En remerciement de ton engagement envers les autres, nous avons ajouté 10 crédits gratuits à ton compte.",altruismBonusBtn:"Super, merci !",altruismTeaser:"💛 Ton objectif consiste à aider les autres ? Alors gagne 10 crédits gratuits en complétant toutes les étapes.",altruismPopupMsgRepeat:"Ton objectif consiste à aider les autres — c'est vraiment magnifique. Complète toutes les étapes et fais une vraie différence !",analyticsNote:"Nous collectons des statistiques d'utilisation anonymes (sans cookies ni données personnelles).",
  signIn:"Se connecter avec Google",signInSub:"Sauvegarde tes objectifs sur tous tes appareils",signOut:"Déconnexion",profile:"Profil",terms:"CGU",privacy:"Confidentialité",stats:"Statistiques",donate:"❤️ Faire un don",
  share:"Partager",shareCopy:"Copier",shareCopied:"Copié !",shareMsg:"Découvre mon plan d'action sur untangle.lol :",
  altruismLoadingMsg:"💛 Tu fais quelque chose de merveilleux pour les autres.",
  altruisticSugg:["Je veux faire du bénévolat dans une banque alimentaire","Je veux devenir aidant·e pour un proche","Je veux créer un jardin partagé","Je veux donner mon sang régulièrement","Je veux encadrer un jeune en difficulté"],
  phSugg:["Je veux mieux dormir","Je veux apprendre la guitare","Je veux faire du sport chaque jour","Je veux écrire un livre","Je veux manger plus sainement"],
  woop:"🎯 Essayer WOOP",woopOr:"ou",woopTitle:"Méthode WOOP",woopSub:"Une technique éprouvée pour transformer les souhaits en actions — étape par étape.",woopLabels:["Souhait","Résultat","Obstacle","Plan"],woopHints:["Que désires-tu vraiment ? Choisis quelque chose qui te tient à cœur — ambitieux mais réalisable.","Imagine le meilleur résultat possible. Que ressens-tu quand ton souhait se réalise ?","Quel est le principal obstacle intérieur — une habitude, un sentiment ou une pensée — qui pourrait te bloquer ?","Si [obstacle], alors je vais [action]. Fais un plan si-alors concret."],woopPh:["Ex. 'Je veux faire du sport chaque matin'","Ex. 'Je me sens plein d'énergie et fier de moi'","Ex. 'Je remets mon réveil à plus tard parce que je suis fatigué·e'","Ex. 'Si je remets mon réveil, je prépare mes affaires de sport la veille au soir'"],woopGo:"Créer mon plan →",woopLink:"En savoir plus sur la science",woopSummaryTitle:"Ton WOOP",suggLabel:"💡 Choisir une suggestion",taClrConfirm:"effacer?",celebTitle:"Félicitations ! 🎉",celebMsg:"Tu as complété toutes les étapes. Bravo — ça se fête !",celebBtn:"Merci !"},

  {code:"es",label:"Español",flag:"🇪🇸",ph:"Ej. 'Quiero dormir mejor' 🎸",hero:"¿Qué quieres lograr?",heroS:["Solo escríbelo.","Ninguna pregunta es demasiado rara.","Grande o pequeño — todo vale.","¿Qué tienes en mente?","Escríbelo, te ayudamos a seguir adelante."],go:"Comencemos →",back:"← Volver",out:"Salir",clr:"🗑️ Borrar",nG:"➕ Nueva meta",noG:"Sin metas. ¡Hora de comenzar!",prog:"progreso",allD:"🎉 ¡Listo!",sOf:"de",eth:"🌍 Consejos con respeto",err:"¡Ups!",resB:"← Volver",dW:"Hola de nuevo",dS:"Tus metas.",byok:"Ingresar clave API",byokH1:"Usa tu propia clave API",chAuth:"Cambiar auth",rmKey:"Eliminar clave",lSel:"Idioma",byokL:"Clave API (Anthropic u OpenRouter)",byokPh:"sk-ant-... o sk-or-...",byokSave:"Guardar",byokNote:"Guardada en tu navegador. Nunca compartida.",apiKeyBadge:"🔑 Clave API",apiKeyUnset:"configurar",checking:"Comprobando...",chooseLang:"Elige tu idioma",byokAnthTitle:"Anthropic",byokAnthDesc:"Acceso directo a Claude. Las claves empiezan con",byokAnthS1:"Ir a console.anthropic.com",byokAnthS2:"Registrarse / iniciar sesión",byokAnthS3:"Ajustes → Claves API → Crear clave",byokAnthLink:"Obtener clave de Anthropic →",byokOrTitle:"OpenRouter",byokOrDesc:"Pago por uso. A menudo más barato. Las claves empiezan con",byokOrS1:"Ir a openrouter.ai",byokOrS2:"Registrarse / iniciar sesión",byokOrS3:"Claves → Crear clave",byokOrLink:"Obtener clave de OpenRouter →",keyErrFmt:"La clave debe empezar con sk-ant- o sk-or-",keyErrInv:"Clave inválida: ",keyErrNet:"No se pudo verificar con la API — clave guardada de todas formas.",usageStat:"Estadísticas de uso",apiCalls:"Llamadas API",estCost:"Coste estimado",inputTok:"Tokens de entrada",outputTok:"Tokens de salida",resetStats:"Resetear stats",rmTip:"Eliminar",start:"Empezar",cred:"créditos",credFree:"créditos gratis",credOut:"Sin créditos",credOutMsg:"Tus créditos gratuitos se agotaron. Agrega tu propia clave API para continuar — gratis en Anthropic u OpenRouter.",credByok:"Agregar mi clave →",lp:["🧠 Pensando...","☕ Destilando ideas...","🔮 Calentando la bola de cristal...","🧙 Lanzando hechizos...","🤔 Reflexionando...","🎯 Enfocando..."],
  topUp:"Recargar créditos",topUpDesc:"10 créditos por €1,00",topUpBtn:"Pagar con Stripe →",topUpSuccess:"¡Pago exitoso! Los créditos se añadirán pronto.",topUpPending:"Procesando créditos...",topUpPopupTitle:"¡Créditos añadidos! 🎉",topUpPopupMsg:"untangle.lol es gratuito y privado — sin anuncios ni recopilación de datos. Los créditos mantienen la IA en marcha y apoyan un producto justo e independiente. ¡Gracias!",topUpPopupBtn:"¡Genial, a por ello!",
  altruismPopupTitle:"¡Qué amable eres! 💛",altruismPopupMsg:"Tu meta consiste en ayudar a otros — como voluntariado, cuidado de personas o apoyo a una buena causa. Eso merece una recompensa: completa todos los pasos y gana automáticamente 10 créditos gratis.",altruismPopupBtn:"¡Genial, a por ello!",altruismBonusTitle:"🎁 ¡+10 créditos ganados!",altruismBonusMsg:"¡Felicitaciones! Completaste tu meta altruista. Como agradecimiento por tu esfuerzo para ayudar a otros, hemos añadido 10 créditos gratuitos a tu cuenta.",altruismBonusBtn:"¡Increíble, gracias!",altruismTeaser:"💛 ¿Tu meta consiste en ayudar a otros? Entonces gana 10 créditos gratis al completar todos los pasos.",altruismPopupMsgRepeat:"Tu meta consiste en ayudar a otros — eso es realmente maravilloso. ¡Completa todos los pasos y marca la diferencia!",analyticsNote:"Recopilamos estadísticas de uso anónimas (sin cookies ni datos personales).",
  signIn:"Iniciar sesión con Google",signInSub:"Guarda tus metas en todos tus dispositivos",signOut:"Cerrar sesión",profile:"Perfil",terms:"Términos",privacy:"Privacidad",stats:"Estadísticas",donate:"❤️ Donar",
  share:"Compartir",shareCopy:"Copiar",shareCopied:"¡Copiado!",shareMsg:"Mira mi plan de acción en untangle.lol:",
  altruismLoadingMsg:"💛 Estás haciendo algo maravilloso por los demás.",
  altruisticSugg:["Quiero hacer voluntariado en un banco de alimentos","Quiero cuidar a un familiar","Quiero crear un huerto comunitario","Quiero donar sangre regularmente","Quiero ser mentor de un joven"],
  phSugg:["Quiero dormir mejor","Quiero aprender guitarra","Quiero hacer ejercicio cada día","Quiero escribir un libro","Quiero comer más sano"],
  woop:"🎯 Probar WOOP",woopOr:"o",woopTitle:"Método WOOP",woopSub:"Una técnica probada para convertir deseos en acciones — paso a paso.",woopLabels:["Deseo","Resultado","Obstáculo","Plan"],woopHints:["¿Qué deseas realmente? Elige algo significativo — desafiante pero alcanzable.","Imagina el mejor resultado posible. ¿Cómo te sientes cuando tu deseo se hace realidad?","¿Cuál es el principal obstáculo interno — un hábito, sentimiento o pensamiento — que podría frenarte?","Si [obstáculo], entonces haré [acción]. Crea un plan concreto si-entonces."],woopPh:["Ej. 'Quiero hacer ejercicio cada mañana'","Ej. 'Me siento lleno de energía y orgulloso de mí mismo'","Ej. 'Apago la alarma porque estoy cansado'","Ej. 'Si apago la alarma, prepararé mi ropa de deporte la noche anterior'"],woopGo:"Crear mi plan →",woopLink:"Más sobre la ciencia",woopSummaryTitle:"Tu WOOP",suggLabel:"💡 Elige una sugerencia",taClrConfirm:"¿borrar?",celebTitle:"¡Felicitaciones! 🎉",celebMsg:"Has completado todos los pasos. ¡Bien hecho — esto merece una celebración!",celebBtn:"¡Gracias!"},

  {code:"zh",label:"中文",flag:"🇨🇳",ph:"例如：'我想睡得更好' 或 '我想学吉他' 🎸",hero:"你想实现什么？",heroS:["直接输入吧。","没有问题太奇怪。","大目标还是小目标——都可以。","你在想什么？","写下来，我们帮你理清。"],go:"开始 →",back:"← 返回",out:"退出登录",clr:"🗑️ 清除全部",nG:"➕ 新目标",noG:"还没有目标。是时候开始了！",prog:"进度",allD:"🎉 全部完成！",sOf:"共",eth:"🌍 尊重人、地球与健康的建议",err:"出错了，请重试！",resB:"← 返回概览",dW:"欢迎回来",dS:"这是你的目标。",byok:"输入 API 密钥",byokH1:"使用你自己的 API 密钥",chAuth:"更改验证方式",rmKey:"删除密钥",lSel:"语言",byokL:"API 密钥（Anthropic 或 OpenRouter）",byokPh:"sk-ant-... 或 sk-or-...",byokSave:"保存并继续",byokNote:"仅保存在你的浏览器中，从不共享。",apiKeyBadge:"🔑 API 密钥",apiKeyUnset:"设置",checking:"检查中...",chooseLang:"选择语言",byokAnthTitle:"Anthropic",byokAnthDesc:"直接访问 Claude。密钥以",byokAnthS1:"前往 console.anthropic.com",byokAnthS2:"注册 / 登录",byokAnthS3:"设置 → API 密钥 → 创建密钥",byokAnthLink:"获取 Anthropic 密钥 →",byokOrTitle:"OpenRouter",byokOrDesc:"按需付费，通常更便宜。密钥以",byokOrS1:"前往 openrouter.ai",byokOrS2:"注册 / 登录",byokOrS3:"密钥 → 创建密钥",byokOrLink:"获取 OpenRouter 密钥 →",keyErrFmt:"密钥应以 sk-ant- 或 sk-or- 开头",keyErrInv:"无效密钥：",keyErrNet:"无法连接 API 验证——密钥已保存。",usageStat:"使用统计",apiCalls:"API 调用次数",estCost:"预计费用",inputTok:"输入 Token",outputTok:"输出 Token",resetStats:"重置统计",rmTip:"删除",start:"开始",cred:"积分",credFree:"免费积分",credOut:"积分不足",credOutMsg:"你的免费积分已用完。添加自己的 API 密钥继续使用——可从 Anthropic 或 OpenRouter 免费获取。",credByok:"添加我的密钥 →",lp:["🧠 思考中...","☕ 整理想法...","🔮 水晶球预热中...","🧙 施展魔法...","🤔 深度思考...","🎯 锁定目标..."],
  topUp:"充值积分",topUpDesc:"€1.00 兑换 10 积分",topUpBtn:"通过 Stripe 付款 →",topUpSuccess:"支付成功！积分即将到账。",topUpPending:"处理积分中...",topUpPopupTitle:"积分已到账！🎉",topUpPopupMsg:"untangle.lol 免费且私密——没有广告，不收集数据。积分让 AI 持续运转，支持公平独立的产品。谢谢你的支持！",topUpPopupBtn:"太好了，开始吧！",
  altruismPopupTitle:"你真善良！💛",altruismPopupMsg:"你的目标是帮助他人——比如志愿服务、照顾他人或支持公益事业。这值得奖励：完成所有步骤，自动获得 10 个免费积分！",altruismPopupBtn:"太好了，开始吧！",altruismBonusTitle:"🎁 +10 积分已获得！",altruismBonusMsg:"恭喜！你完成了利他目标。为感谢你对他人的付出，我们为你的账户添加了 10 个免费积分。",altruismBonusBtn:"太棒了，谢谢！",altruismTeaser:"💛 你的目标是帮助他人吗？完成所有步骤即可获得 10 个免费积分。",altruismPopupMsgRepeat:"你的目标是帮助他人——这真的很了不起。完成所有步骤，创造真正的改变！",analyticsNote:"我们收集匿名使用统计数据（无 Cookie，无个人数据）。",
  signIn:"使用 Google 登录",signInSub:"在所有设备上保存你的目标",signOut:"退出登录",profile:"个人资料",terms:"条款",privacy:"隐私",stats:"统计",donate:"❤️ 捐赠",
  share:"分享",shareCopy:"复制",shareCopied:"已复制！",shareMsg:"查看我在 untangle.lol 上的行动计划：",
  altruismLoadingMsg:"💛 你正在为他人做一件美好的事。",
  altruisticSugg:["我想在食物银行做志愿者","我想照顾家人","我想成为年轻人的导师","我想定期献血","我想创建一个社区花园"],
  phSugg:["我想睡得更好","我想学吉他","我想每天运动","我想写一本书","我想吃得更健康"],
  woop:"🎯 尝试 WOOP",woopOr:"或",woopTitle:"WOOP 方法",woopSub:"一种将愿望转化为行动的有效技巧——循序渐进。",woopLabels:["愿望","结果","障碍","计划"],woopHints:["你真正想要什么？选择一件触动你内心的事——有挑战性但可实现。","想象最好的结果。当愿望实现时，你有什么感受？","最主要的内在障碍是什么——一种习惯、感受或想法——可能阻碍你？","如果出现[障碍]，我将采取[行动]。制定一个具体的如果-那么计划。"],woopPh:["例如：'我想每天早上运动'","例如：'我感到精力充沛，为自己感到骄傲'","例如：'我因为疲惫而关掉闹钟'","例如：'如果我关掉闹钟，我会在前一晚准备好运动服'"],woopGo:"创建我的计划 →",woopLink:"了解相关科学",woopSummaryTitle:"你的 WOOP",suggLabel:"💡 选择建议",taClrConfirm:"清除？",celebTitle:"恭喜！🎉",celebMsg:"你已完成所有步骤。做得好——值得庆祝！",celebBtn:"谢谢！"},

  {code:"hi",label:"हिन्दी",flag:"🇮🇳",ph:"जैसे: 'मैं बेहतर सोना चाहता हूँ' या 'मैं गिटार सीखना चाहता हूँ' 🎸",hero:"आप क्या हासिल करना चाहते हैं?",heroS:["बस टाइप करें।","कोई सवाल अजीब नहीं होता।","छोटा हो या बड़ा — सब चलता है।","आपके मन में क्या है?","लिख दीजिए, हम आगे बढ़ने में मदद करेंगे।"],go:"शुरू करें →",back:"← वापस",out:"लॉग आउट",clr:"🗑️ सब हटाएं",nG:"➕ नया लक्ष्य",noG:"अभी कोई लक्ष्य नहीं। शुरुआत का समय आ गया!",prog:"प्रगति",allD:"🎉 सब पूरा!",sOf:"में से",eth:"🌍 लोगों, धरती और स्वास्थ्य के सम्मान के साथ सलाह",err:"उफ़, फिर से कोशिश करें!",resB:"← वापस अवलोकन पर",dW:"वापस स्वागत है",dS:"ये रहे आपके लक्ष्य।",byok:"API कुंजी दर्ज करें",byokH1:"अपनी खुद की API कुंजी लाएं",chAuth:"प्रमाणीकरण बदलें",rmKey:"कुंजी हटाएं",lSel:"भाषा",byokL:"API कुंजी (Anthropic या OpenRouter)",byokPh:"sk-ant-... या sk-or-...",byokSave:"सहेजें और जारी रखें",byokNote:"केवल आपके ब्राउज़र में सहेजी गई। कभी साझा नहीं की जाती।",apiKeyBadge:"🔑 API कुंजी",apiKeyUnset:"सेट करें",checking:"जाँच हो रही है...",chooseLang:"अपनी भाषा चुनें",byokAnthTitle:"Anthropic",byokAnthDesc:"Claude तक सीधी पहुँच। कुंजियाँ इससे शुरू होती हैं",byokAnthS1:"console.anthropic.com पर जाएं",byokAnthS2:"साइन अप / लॉग इन करें",byokAnthS3:"सेटिंग्स → API कुंजियाँ → कुंजी बनाएं",byokAnthLink:"Anthropic कुंजी लें →",byokOrTitle:"OpenRouter",byokOrDesc:"उपयोग के अनुसार भुगतान। अक्सर सस्ता। कुंजियाँ इससे शुरू होती हैं",byokOrS1:"openrouter.ai पर जाएं",byokOrS2:"साइन अप / लॉग इन करें",byokOrS3:"कुंजियाँ → कुंजी बनाएं",byokOrLink:"OpenRouter कुंजी लें →",keyErrFmt:"कुंजी sk-ant- या sk-or- से शुरू होनी चाहिए",keyErrInv:"अमान्य कुंजी: ",keyErrNet:"API से जुड़ नहीं सका — कुंजी फिर भी सहेज ली गई।",usageStat:"उपयोग आँकड़े",apiCalls:"API कॉल",estCost:"अनुमानित लागत",inputTok:"इनपुट टोकन",outputTok:"आउटपुट टोकन",resetStats:"आँकड़े रीसेट करें",rmTip:"हटाएं",start:"शुरू करें",cred:"क्रेडिट",credFree:"मुफ़्त क्रेडिट",credOut:"क्रेडिट समाप्त",credOutMsg:"आपके मुफ़्त क्रेडिट समाप्त हो गए। जारी रखने के लिए अपनी API कुंजी जोड़ें — Anthropic या OpenRouter से मुफ़्त मिलती है।",credByok:"अपनी कुंजी जोड़ें →",lp:["🧠 सोच रहे हैं...","☕ विचार बना रहे हैं...","🔮 क्रिस्टल बॉल गर्म हो रही है...","🧙 जादू चल रहा है...","🤔 गहरी सोच...","🎯 लक्ष्य निर्धारित हो रहा है..."],
  topUp:"क्रेडिट खरीदें",topUpDesc:"€1.00 में 10 क्रेडिट",topUpBtn:"Stripe से भुगतान करें →",topUpSuccess:"भुगतान सफल! क्रेडिट जल्द जुड़ेंगे।",topUpPending:"क्रेडिट प्रोसेस हो रहे हैं...",topUpPopupTitle:"क्रेडिट जुड़ गए! 🎉",topUpPopupMsg:"untangle.lol मुफ़्त और निजी है — कोई विज्ञापन नहीं, कोई डेटा संग्रह नहीं। क्रेडिट AI को चलाते रहते हैं और एक उचित, स्वतंत्र उत्पाद का समर्थन करते हैं। धन्यवाद!",topUpPopupBtn:"बढ़िया, चलते हैं!",
  altruismPopupTitle:"आप कितने दयालु हैं! 💛",altruismPopupMsg:"आपका लक्ष्य दूसरों की मदद करना है — जैसे स्वयंसेवा, देखभाल, या किसी अच्छे काम का समर्थन। यह इनाम के लायक है: सभी चरण पूरे करें और स्वचालित रूप से 10 मुफ़्त क्रेडिट पाएं!",altruismPopupBtn:"बढ़िया, चलते हैं!",altruismBonusTitle:"🎁 +10 क्रेडिट मिले!",altruismBonusMsg:"बधाई हो! आपने अपना परोपकारी लक्ष्य पूरा किया। दूसरों की मदद के लिए आपके प्रयासों के लिए धन्यवाद, हमने आपके खाते में 10 मुफ़्त क्रेडिट जोड़ दिए हैं।",altruismBonusBtn:"शानदार, धन्यवाद!",altruismTeaser:"💛 क्या आपका लक्ष्य दूसरों की मदद करना है? तो सभी चरण पूरे करने पर 10 मुफ़्त क्रेडिट पाएं।",altruismPopupMsgRepeat:"आपका लक्ष्य दूसरों की मदद करना है — यह सच में बहुत सुंदर है। सभी चरण पूरे करें और वास्तविक बदलाव लाएं!",analyticsNote:"हम गुमनाम उपयोग आँकड़े एकत्र करते हैं (कोई कुकी नहीं, कोई व्यक्तिगत डेटा नहीं)।",
  signIn:"Google से साइन इन करें",signInSub:"सभी डिवाइस पर अपने लक्ष्य सहेजें",signOut:"साइन आउट",profile:"प्रोफाइल",terms:"शर्तें",privacy:"गोपनीयता",stats:"आँकड़े",donate:"❤️ दान करें",
  share:"साझा करें",shareCopy:"कॉपी करें",shareCopied:"कॉपी हो गया!",shareMsg:"untangle.lol पर मेरी एक्शन प्लान देखें:",
  altruismLoadingMsg:"💛 आप दूसरों के लिए कुछ अद्भुत कर रहे हैं।",
  altruisticSugg:["मैं फ़ूड बैंक में स्वयंसेवा करना चाहता हूँ","मैं किसी परिवार के सदस्य की देखभाल करना चाहता हूँ","मैं एक युवा का मार्गदर्शन करना चाहता हूँ","मैं नियमित रूप से रक्तदान करना चाहता हूँ","मैं एक सामुदायिक बगीचा शुरू करना चाहता हूँ"],
  phSugg:["मैं बेहतर सोना चाहता हूँ","मैं गिटार सीखना चाहता हूँ","मैं हर दिन व्यायाम करना चाहता हूँ","मैं एक किताब लिखना चाहता हूँ","मैं स्वस्थ खाना चाहता हूँ"],
  woop:"🎯 WOOP आज़माएं",woopOr:"या",woopTitle:"WOOP विधि",woopSub:"इच्छाओं को कार्यों में बदलने की एक सिद्ध तकनीक — चरण दर चरण।",woopLabels:["इच्छा","परिणाम","बाधा","योजना"],woopHints:["आप वास्तव में क्या चाहते हैं? कुछ ऐसा चुनें जो आपके दिल को छुए — चुनौतीपूर्ण लेकिन प्राप्य।","सबसे अच्छे परिणाम की कल्पना करें। जब आपकी इच्छा पूरी होती है तो आप कैसा महसूस करते हैं?","मुख्य आंतरिक बाधा क्या है — एक आदत, भावना या विचार — जो आपको रोक सकती है?","अगर [बाधा], तो मैं [कार्य] करूँगा। एक ठोस अगर-तो योजना बनाएं।"],woopPh:["जैसे: 'मैं हर सुबह व्यायाम करना चाहता हूँ'","जैसे: 'मैं ऊर्जावान और खुद पर गर्वित महसूस करता हूँ'","जैसे: 'मैं थका होने के कारण अलार्म बंद कर देता हूँ'","जैसे: 'अगर मैं अलार्म बंद कर दूं, तो रात पहले अपने स्पोर्ट्स कपड़े तैयार कर लूंगा'"],woopGo:"मेरी योजना बनाएं →",woopLink:"विज्ञान के बारे में जानें",woopSummaryTitle:"आपका WOOP",suggLabel:"💡 सुझाव चुनें",taClrConfirm:"हटाएं?",celebTitle:"बधाई हो! 🎉",celebMsg:"आपने सभी चरण पूरे कर लिए। शाबाश — यह उत्सव के योग्य है!",celebBtn:"धन्यवाद!"},

  {code:"pt",label:"Português",flag:"🇧🇷",ph:"Ex.: 'Quero dormir melhor' ou 'Quero aprender guitarra' 🎸",hero:"O que você quer alcançar?",heroS:["É só digitar.","Nenhuma pergunta é estranha demais.","Grande ou pequeno — tudo vale.","O que está na sua cabeça?","Escreva, nós ajudamos você a avançar."],go:"Vamos começar →",back:"← Voltar",out:"Sair",clr:"🗑️ Limpar tudo",nG:"➕ Nova meta",noG:"Nenhuma meta ainda. Hora de começar!",prog:"progresso",allD:"🎉 Tudo concluído!",sOf:"de",eth:"🌍 Conselhos com respeito pelas pessoas, planeta e bem-estar",err:"Ops, tente novamente!",resB:"← Voltar à visão geral",dW:"Bem-vindo de volta",dS:"Aqui estão suas metas.",byok:"Inserir chave de API",byokH1:"Use sua própria chave de API",chAuth:"Alterar autenticação",rmKey:"Remover chave",lSel:"Idioma",byokL:"Chave de API (Anthropic ou OpenRouter)",byokPh:"sk-ant-... ou sk-or-...",byokSave:"Salvar e continuar",byokNote:"Armazenada apenas no seu navegador. Nunca compartilhada.",apiKeyBadge:"🔑 Chave de API",apiKeyUnset:"definir",checking:"Verificando...",chooseLang:"Escolha seu idioma",byokAnthTitle:"Anthropic",byokAnthDesc:"Acesso direto ao Claude. As chaves começam com",byokAnthS1:"Acesse console.anthropic.com",byokAnthS2:"Cadastre-se / faça login",byokAnthS3:"Configurações → Chaves de API → Criar chave",byokAnthLink:"Obter chave Anthropic →",byokOrTitle:"OpenRouter",byokOrDesc:"Pague conforme o uso. Geralmente mais barato. As chaves começam com",byokOrS1:"Acesse openrouter.ai",byokOrS2:"Cadastre-se / faça login",byokOrS3:"Chaves → Criar chave",byokOrLink:"Obter chave OpenRouter →",keyErrFmt:"A chave deve começar com sk-ant- ou sk-or-",keyErrInv:"Chave inválida: ",keyErrNet:"Não foi possível verificar com a API — chave salva mesmo assim.",usageStat:"Estatísticas de uso",apiCalls:"Chamadas de API",estCost:"Custo estimado",inputTok:"Tokens de entrada",outputTok:"Tokens de saída",resetStats:"Resetar estatísticas",rmTip:"Remover",start:"Iniciar",cred:"créditos",credFree:"créditos grátis",credOut:"Sem créditos",credOutMsg:"Seus créditos gratuitos acabaram. Adicione sua própria chave de API para continuar — gratuita na Anthropic ou OpenRouter.",credByok:"Adicionar minha chave →",lp:["🧠 Pensando...","☕ Preparando ideias...","🔮 Bola de cristal aquecendo...","🧙 Lançando feitiços...","🤔 Pensamento profundo...","🎯 Focando..."],
  topUp:"Comprar créditos",topUpDesc:"10 créditos por €1,00",topUpBtn:"Pagar com Stripe →",topUpSuccess:"Pagamento realizado! Os créditos serão adicionados em breve.",topUpPending:"Processando créditos...",topUpPopupTitle:"Créditos adicionados! 🎉",topUpPopupMsg:"untangle.lol é gratuito e privado — sem anúncios, sem coleta de dados. Os créditos mantêm a IA funcionando e apoiam um produto justo e independente. Obrigado pelo seu apoio!",topUpPopupBtn:"Ótimo, vamos lá!",
  altruismPopupTitle:"Que gentileza! 💛",altruismPopupMsg:"Sua meta é ajudar outras pessoas — como voluntariado, cuidado ou apoio a uma boa causa. Isso merece recompensa: conclua todas as etapas e ganhe automaticamente 10 créditos grátis!",altruismPopupBtn:"Ótimo, vamos lá!",altruismBonusTitle:"🎁 +10 créditos ganhos!",altruismBonusMsg:"Parabéns! Você concluiu sua meta altruísta. Como agradecimento pelo seu esforço em ajudar os outros, adicionamos 10 créditos grátis à sua conta.",altruismBonusBtn:"Incrível, obrigado!",altruismTeaser:"💛 Sua meta é ajudar outras pessoas? Então ganhe 10 créditos grátis ao concluir todas as etapas.",altruismPopupMsgRepeat:"Sua meta é ajudar outras pessoas — o que é verdadeiramente maravilhoso. Conclua todas as etapas e faça uma diferença real!",analyticsNote:"Coletamos estatísticas de uso anônimas (sem cookies, sem dados pessoais).",
  signIn:"Entrar com Google",signInSub:"Salve suas metas em todos os dispositivos",signOut:"Sair",profile:"Perfil",terms:"Termos",privacy:"Privacidade",stats:"Estatísticas",donate:"❤️ Doar",
  share:"Compartilhar",shareCopy:"Copiar",shareCopied:"Copiado!",shareMsg:"Veja meu plano de ação no untangle.lol:",
  altruismLoadingMsg:"💛 Você está fazendo algo maravilhoso pelos outros.",
  altruisticSugg:["Quero fazer voluntariado em um banco de alimentos","Quero cuidar de um familiar","Quero ser mentor de um jovem","Quero doar sangue regularmente","Quero criar uma horta comunitária"],
  phSugg:["Quero dormir melhor","Quero aprender guitarra","Quero me exercitar todos os dias","Quero escrever um livro","Quero me alimentar de forma mais saudável"],
  woop:"🎯 Experimentar WOOP",woopOr:"ou",woopTitle:"Método WOOP",woopSub:"Uma técnica comprovada para transformar desejos em ações — passo a passo.",woopLabels:["Desejo","Resultado","Obstáculo","Plano"],woopHints:["O que você realmente quer? Escolha algo que toque seu coração — desafiador, mas alcançável.","Imagine o melhor resultado possível. Como você se sente quando seu desejo se realiza?","Qual é o principal obstáculo interno — um hábito, sentimento ou pensamento — que poderia te impedir?","Se [obstáculo], então farei [ação]. Crie um plano concreto se-então."],woopPh:["Ex.: 'Quero me exercitar toda manhã'","Ex.: 'Me sinto cheio de energia e orgulhoso de mim mesmo'","Ex.: 'Desligo o alarme porque estou cansado'","Ex.: 'Se eu desligar o alarme, separo a roupa de treino na noite anterior'"],woopGo:"Criar meu plano →",woopLink:"Saiba mais sobre a ciência",woopSummaryTitle:"Seu WOOP",suggLabel:"💡 Escolha uma sugestão",taClrConfirm:"limpar?",celebTitle:"Parabéns! 🎉",celebMsg:"Você concluiu todas as etapas. Muito bem — isso merece comemoração!",celebBtn:"Obrigado!"},

  {code:"ar",label:"العربية",flag:"🇸🇦",rtl:true,ph:"مثلاً: 'أريد النوم بشكل أفضل' أو 'أريد تعلم العزف على الجيتار' 🎸",hero:"ماذا تريد أن تحقق؟",heroS:["فقط اكتبه.","لا يوجد سؤال غريب.","صغيراً كان أم كبيراً — كل شيء مقبول.","ما الذي يشغل تفكيرك؟","اكتبه، وسنساعدك على المضي قدماً."],go:"لنبدأ ←",back:"→ رجوع",out:"تسجيل الخروج",clr:"🗑️ مسح الكل",nG:"➕ هدف جديد",noG:"لا أهداف بعد. حان وقت البداية!",prog:"التقدم",allD:"🎉 تم الإنجاز!",sOf:"من",eth:"🌍 نصائح باحترام للإنسان والكوكب والرفاهية",err:"عذراً، حاول مرة أخرى!",resB:"→ العودة إلى النظرة العامة",dW:"مرحباً بعودتك",dS:"هذه أهدافك.",byok:"أدخل مفتاح API",byokH1:"استخدم مفتاح API الخاص بك",chAuth:"تغيير المصادقة",rmKey:"إزالة المفتاح",lSel:"اللغة",byokL:"مفتاح API (Anthropic أو OpenRouter)",byokPh:"sk-ant-... أو sk-or-...",byokSave:"حفظ والبدء",byokNote:"محفوظ في متصفحك فقط. لن يُشارَك أبداً.",apiKeyBadge:"🔑 مفتاح API",apiKeyUnset:"تعيين",checking:"جارٍ التحقق...",chooseLang:"اختر لغتك",byokAnthTitle:"Anthropic",byokAnthDesc:"وصول مباشر إلى Claude. تبدأ المفاتيح بـ",byokAnthS1:"اذهب إلى console.anthropic.com",byokAnthS2:"سجّل / سجّل الدخول",byokAnthS3:"الإعدادات ← مفاتيح API ← إنشاء مفتاح",byokAnthLink:"احصل على مفتاح Anthropic ←",byokOrTitle:"OpenRouter",byokOrDesc:"ادفع حسب الاستخدام. غالباً أرخص. تبدأ المفاتيح بـ",byokOrS1:"اذهب إلى openrouter.ai",byokOrS2:"سجّل / سجّل الدخول",byokOrS3:"المفاتيح ← إنشاء مفتاح",byokOrLink:"احصل على مفتاح OpenRouter ←",keyErrFmt:"يجب أن يبدأ المفتاح بـ sk-ant- أو sk-or-",keyErrInv:"مفتاح غير صالح: ",keyErrNet:"تعذّر الوصول إلى API — تم حفظ المفتاح على أي حال.",usageStat:"إحصائيات الاستخدام",apiCalls:"استدعاءات API",estCost:"التكلفة التقديرية",inputTok:"رموز الإدخال",outputTok:"رموز الإخراج",resetStats:"إعادة تعيين الإحصائيات",rmTip:"إزالة",start:"ابدأ",cred:"رصيد",credFree:"رصيد مجاني",credOut:"نفد الرصيد",credOutMsg:"لقد نفد رصيدك المجاني. أضف مفتاح API الخاص بك للمتابعة — مجاني من Anthropic أو OpenRouter.",credByok:"أضف مفتاحك ←",lp:["🧠 جارٍ التفكير...","☕ تحضير الأفكار...","🔮 الكرة السحرية تعمل...","🧙 نسج السحر...","🤔 تأمل عميق...","🎯 ضبط الهدف..."],
  topUp:"شحن الرصيد",topUpDesc:"10 رصيد مقابل €1.00",topUpBtn:"ادفع عبر Stripe ←",topUpSuccess:"تمت عملية الدفع! سيتم إضافة الرصيد قريباً.",topUpPending:"جارٍ معالجة الرصيد...",topUpPopupTitle:"تمت إضافة الرصيد! 🎉",topUpPopupMsg:"untangle.lol مجاني وخاص — بدون إعلانات أو جمع بيانات. يُبقي الرصيدُ الذكاءَ الاصطناعي يعمل ويدعم منتجاً عادلاً ومستقلاً. شكراً لك!",topUpPopupBtn:"رائع، هيا نبدأ!",
  altruismPopupTitle:"يا له من تصرف رائع! 💛",altruismPopupMsg:"هدفك يتعلق بمساعدة الآخرين — كالتطوع أو رعاية الآخرين أو دعم قضية خيرية. هذا يستحق مكافأة: أكمل جميع الخطوات واحصل تلقائياً على 10 رصيد مجاني!",altruismPopupBtn:"رائع، لنبدأ!",altruismBonusTitle:"🎁 +10 رصيد مكتسب!",altruismBonusMsg:"تهانينا! لقد أكملت هدفك الإيثاري. شكراً على جهودك لمساعدة الآخرين، أضفنا 10 رصيد مجاني إلى حسابك.",altruismBonusBtn:"رائع، شكراً!",altruismTeaser:"💛 هل هدفك يتعلق بمساعدة الآخرين؟ اكسب 10 رصيد مجاني عند إكمال جميع الخطوات.",altruismPopupMsgRepeat:"هدفك يتعلق بمساعدة الآخرين — وهذا شيء رائع حقاً. أكمل جميع الخطوات واصنع فارقاً حقيقياً!",analyticsNote:"نجمع إحصائيات استخدام مجهولة (بدون كوكيز أو بيانات شخصية).",
  signIn:"تسجيل الدخول بـ Google",signInSub:"احفظ أهدافك على جميع أجهزتك",signOut:"تسجيل الخروج",profile:"الملف الشخصي",terms:"الشروط",privacy:"الخصوصية",stats:"الإحصائيات",donate:"❤️ تبرع",
  share:"مشاركة",shareCopy:"نسخ",shareCopied:"تم النسخ!",shareMsg:"اطلع على خطة العمل الخاصة بي على untangle.lol:",
  altruismLoadingMsg:"💛 أنت تفعل شيئاً رائعاً للآخرين.",
  altruisticSugg:["أريد التطوع في بنك الطعام","أريد رعاية أحد أفراد العائلة","أريد إنشاء حديقة مجتمعية","أريد التبرع بالدم بانتظام","أريد أن أكون مرشداً لشاب"],
  phSugg:["أريد النوم بشكل أفضل","أريد تعلم العزف على الجيتار","أريد ممارسة الرياضة يومياً","أريد كتابة كتاب","أريد تناول طعام أكثر صحة"],
  woop:"🎯 جرّب WOOP",woopOr:"أو",woopTitle:"طريقة WOOP",woopSub:"تقنية مجربة لتحويل الأمنيات إلى أفعال — خطوة بخطوة.",woopLabels:["الأمنية","النتيجة","العقبة","الخطة"],woopHints:["ماذا تريد حقاً؟ اختر شيئاً يلامس قلبك — تحدٍّ ممكن التحقيق.","تخيّل أفضل نتيجة ممكنة. كيف ستشعر عندما تتحقق أمنيتك؟","ما هي العقبة الداخلية الرئيسية — عادة أو شعور أو فكرة — التي قد تعيقك؟","إذا [العقبة]، سأقوم بـ [الإجراء]. ضع خطة محددة إذا-ثم."],woopPh:["مثلاً: 'أريد ممارسة الرياضة كل صباح'","مثلاً: 'أشعر بالحيوية والفخر بنفسي'","مثلاً: 'أغلق المنبه لأنني متعب'","مثلاً: 'إذا أغلقت المنبه، سأضع ملابس الرياضة الليلة السابقة'"],woopGo:"أنشئ خطتي ←",woopLink:"اقرأ عن العلم",woopSummaryTitle:"WOOP الخاص بك",suggLabel:"💡 اختر اقتراحاً",taClrConfirm:"حذف؟",celebTitle:"تهانينا! 🎉",celebMsg:"لقد أكملت جميع الخطوات. أحسنت — هذا يستحق احتفالاً!",celebBtn:"شكراً!"},

  {code:"bn",label:"বাংলা",flag:"🇧🇩",ph:"যেমন 'আমি ভালো ঘুমাতে চাই' বা 'আমি গিটার শিখতে চাই' 🎸",hero:"তুমি কী অর্জন করতে চাও?",heroS:["শুধু লিখে ফেলো।","কোনো প্রশ্নই অদ্ভুত নয়।","ছোট বা বড় — সব চলবে।","কী মাথায় ঘুরছে?","লিখে ফেলো, আমরা সাহায্য করব।"],go:"শুরু করি →",back:"← পেছনে",out:"লগ আউট",clr:"🗑️ সব মুছে ফেলো",nG:"➕ নতুন লক্ষ্য",noG:"এখনো কোনো লক্ষ্য নেই। শুরু করার সময়!",prog:"অগ্রগতি",allD:"🎉 সব হয়ে গেছে!",sOf:"এর মধ্যে",eth:"🌍 মানুষ, গ্রহ ও কল্যাণের প্রতি সম্মান",err:"উফ, আবার চেষ্টা করো!",resB:"← সারসংক্ষেপে ফিরে যাও",dW:"আবার স্বাগতম",dS:"এই তোমার লক্ষ্যগুলো।",byok:"তোমার API কী দাও",byokH1:"নিজের API কী ব্যবহার করো",chAuth:"অথেনটিকেশন পরিবর্তন",rmKey:"কী মুছে ফেলো",lSel:"ভাষা",byokL:"API কী (Anthropic বা OpenRouter)",byokPh:"sk-ant-... বা sk-or-...",byokSave:"সংরক্ষণ করো ও শুরু করো",byokNote:"তোমার ব্রাউজারে সংরক্ষিত। কখনো শেয়ার হবে না।",apiKeyBadge:"🔑 API কী",apiKeyUnset:"সেট করো",checking:"পরীক্ষা হচ্ছে...",chooseLang:"তোমার ভাষা বেছে নাও",byokAnthTitle:"Anthropic",byokAnthDesc:"Claude-এ সরাসরি প্রবেশ। কী শুরু হয়",byokAnthS1:"console.anthropic.com-এ যাও",byokAnthS2:"সাইন আপ / লগ ইন করো",byokAnthS3:"সেটিংস → API কী → কী তৈরি করো",byokAnthLink:"Anthropic কী নাও →",byokOrTitle:"OpenRouter",byokOrDesc:"ব্যবহার অনুযায়ী পেমেন্ট। প্রায়ই সস্তা। কী শুরু হয়",byokOrS1:"openrouter.ai-তে যাও",byokOrS2:"সাইন আপ / লগ ইন করো",byokOrS3:"কী → কী তৈরি করো",byokOrLink:"OpenRouter কী নাও →",keyErrFmt:"কী sk-ant- বা sk-or- দিয়ে শুরু হতে হবে",keyErrInv:"অবৈধ কী: ",keyErrNet:"API-তে পৌঁছানো যায়নি — কী তবুও সংরক্ষিত হয়েছে।",usageStat:"ব্যবহারের পরিসংখ্যান",apiCalls:"API কল",estCost:"আনুমানিক খরচ",inputTok:"ইনপুট টোকেন",outputTok:"আউটপুট টোকেন",resetStats:"পরিসংখ্যান রিসেট",rmTip:"সরাও",start:"শুরু",cred:"ক্রেডিট",credFree:"বিনামূল্যে ক্রেডিট",credOut:"ক্রেডিট শেষ",credOutMsg:"তোমার বিনামূল্যে ক্রেডিট শেষ হয়ে গেছে। চালিয়ে যেতে নিজের API কী যোগ করো — Anthropic বা OpenRouter থেকে বিনামূল্যে পাওয়া যায়।",credByok:"নিজের কী যোগ করো →",lp:["🧠 ভাবছি...","☕ আইডিয়া তৈরি হচ্ছে...","🔮 ক্রিস্টাল বল গরম হচ্ছে...","🧙 জাদু চলছে...","🤔 গভীর চিন্তা...","🎯 ফোকাস করছি..."],
  topUp:"ক্রেডিট কিনো",topUpDesc:"€১.০০-তে ১০ ক্রেডিট",topUpBtn:"Stripe দিয়ে পেমেন্ট →",topUpSuccess:"পেমেন্ট সফল! ক্রেডিট শীঘ্রই যোগ হবে।",topUpPending:"ক্রেডিট প্রক্রিয়া হচ্ছে...",topUpPopupTitle:"ক্রেডিট যোগ হয়েছে! 🎉",topUpPopupMsg:"untangle.lol বিনামূল্যে এবং প্রাইভেট — কোনো বিজ্ঞাপন বা ডেটা সংগ্রহ নেই। ক্রেডিট AI চালু রাখে এবং একটি ন্যায্য, স্বাধীন পণ্যকে সমর্থন করে। ধন্যবাদ!",topUpPopupBtn:"দারুণ, শুরু করি!",
  altruismPopupTitle:"কী সুন্দর! 💛",altruismPopupMsg:"তোমার লক্ষ্য অন্যদের সাহায্য করা নিয়ে — যেমন স্বেচ্ছাসেবা, পরিচর্যা বা কোনো ভালো কাজ। এটি পুরস্কারের যোগ্য: সব ধাপ শেষ করো এবং স্বয়ংক্রিয়ভাবে ১০টি বিনামূল্যে ক্রেডিট পাও!",altruismPopupBtn:"দারুণ, শুরু করি!",altruismBonusTitle:"🎁 +১০ ক্রেডিট অর্জিত!",altruismBonusMsg:"অভিনন্দন! তুমি তোমার পরোপকারী লক্ষ্য পূরণ করেছো। অন্যদের জন্য তোমার প্রচেষ্টার কৃতজ্ঞতায়, আমরা তোমার অ্যাকাউন্টে ১০টি বিনামূল্যে ক্রেডিট যোগ করেছি।",altruismBonusBtn:"দারুণ, ধন্যবাদ!",altruismTeaser:"💛 তোমার লক্ষ্য কি অন্যদের সাহায্য করা নিয়ে? তাহলে সব ধাপ শেষ করে ১০টি বিনামূল্যে ক্রেডিট পাও।",altruismPopupMsgRepeat:"তোমার লক্ষ্য অন্যদের সাহায্য করা নিয়ে — এটা সত্যিই চমৎকার। সব ধাপ শেষ করো এবং সত্যিকারের পরিবর্তন আনো!",analyticsNote:"আমরা বেনামী ব্যবহারের পরিসংখ্যান সংগ্রহ করি (কোনো কুকি বা ব্যক্তিগত তথ্য নেই)।",
  signIn:"Google দিয়ে সাইন ইন",signInSub:"তোমার সব ডিভাইসে লক্ষ্য সংরক্ষণ করো",signOut:"সাইন আউট",profile:"প্রোফাইল",terms:"শর্তাবলী",privacy:"গোপনীয়তা",stats:"পরিসংখ্যান",donate:"❤️ দান করো",
  share:"শেয়ার",shareCopy:"কপি",shareCopied:"কপি হয়েছে!",shareMsg:"untangle.lol-এ আমার অ্যাকশন প্ল্যান দেখো:",
  altruismLoadingMsg:"💛 তুমি অন্যদের জন্য দারুণ কিছু করছো।",
  altruisticSugg:["আমি একটি খাদ্য ব্যাংকে স্বেচ্ছাসেবা করতে চাই","আমি একজন পরিবারের সদস্যের দেখভাল করতে চাই","আমি একটি কমিউনিটি বাগান শুরু করতে চাই","আমি নিয়মিত রক্তদান করতে চাই","আমি একজন তরুণের মেন্টর হতে চাই"],
  phSugg:["আমি ভালো ঘুমাতে চাই","আমি গিটার শিখতে চাই","আমি প্রতিদিন ব্যায়াম করতে চাই","আমি একটি বই লিখতে চাই","আমি স্বাস্থ্যকর খেতে চাই"],
  woop:"🎯 WOOP চেষ্টা করো",woopOr:"অথবা",woopTitle:"WOOP পদ্ধতি",woopSub:"ইচ্ছাকে কাজে রূপান্তরিত করার একটি প্রমাণিত কৌশল — ধাপে ধাপে।",woopLabels:["ইচ্ছা","ফলাফল","বাধা","পরিকল্পনা"],woopHints:["তুমি সত্যিই কী চাও? এমন কিছু বেছে নাও যা তোমার হৃদয় স্পর্শ করে — চ্যালেঞ্জিং কিন্তু অর্জনযোগ্য।","সেরা সম্ভাব্য ফলাফল কল্পনা করো। তোমার ইচ্ছা পূরণ হলে তুমি কেমন অনুভব করবে?","প্রধান অভ্যন্তরীণ বাধাটি কী — একটি অভ্যাস, অনুভূতি বা চিন্তা — যা তোমাকে আটকে দিতে পারে?","যদি [বাধা], তাহলে আমি [কাজ] করব। একটি নির্দিষ্ট যদি-তাহলে পরিকল্পনা তৈরি করো।"],woopPh:["যেমন 'আমি প্রতিদিন সকালে ব্যায়াম করতে চাই'","যেমন 'আমি শক্তিমান এবং নিজের উপর গর্বিত বোধ করি'","যেমন 'আমি ক্লান্ত থাকায় অ্যালার্ম বন্ধ করে দিই'","যেমন 'যদি আমি অ্যালার্ম বন্ধ করি, তাহলে আগের রাতে ব্যায়ামের কাপড় রেডি রাখব'"],woopGo:"আমার পরিকল্পনা তৈরি করো →",woopLink:"বিজ্ঞান সম্পর্কে জানো",woopSummaryTitle:"তোমার WOOP",suggLabel:"💡 একটি সাজেশন বেছে নাও",taClrConfirm:"মুছবে?",celebTitle:"অভিনন্দন! 🎉",celebMsg:"তুমি সব ধাপ শেষ করেছো। শাবাশ — এটি উদযাপনের যোগ্য!",celebBtn:"ধন্যবাদ!"},

  {code:"ru",label:"Русский",flag:"🇷🇺",ph:"Напр. 'Хочу лучше спать' или 'Хочу научиться играть на гитаре' 🎸",hero:"Чего ты хочешь достичь?",heroS:["Просто напиши.","Нет глупых вопросов.","Большое или маленькое — всё подходит.","Что тебя волнует?","Запиши, мы поможем разобраться."],go:"Начнём →",back:"← Назад",out:"Выйти",clr:"🗑️ Очистить всё",nG:"➕ Новая цель",noG:"Целей пока нет. Время начинать!",prog:"прогресс",allD:"🎉 Всё сделано!",sOf:"из",eth:"🌍 Советы с уважением к людям, планете и благополучию",err:"Упс, попробуй ещё раз!",resB:"← Назад к обзору",dW:"С возвращением",dS:"Вот твои цели.",byok:"Введи API-ключ",byokH1:"Используй свой API-ключ",chAuth:"Сменить авторизацию",rmKey:"Удалить ключ",lSel:"Язык",byokL:"API-ключ (Anthropic или OpenRouter)",byokPh:"sk-ant-... или sk-or-...",byokSave:"Сохранить и начать",byokNote:"Хранится в твоём браузере. Никогда не передаётся.",apiKeyBadge:"🔑 API-ключ",apiKeyUnset:"задать",checking:"Проверяем...",chooseLang:"Выбери свой язык",byokAnthTitle:"Anthropic",byokAnthDesc:"Прямой доступ к Claude. Ключи начинаются с",byokAnthS1:"Перейди на console.anthropic.com",byokAnthS2:"Зарегистрируйся / войди",byokAnthS3:"Настройки → API-ключи → Создать ключ",byokAnthLink:"Получить ключ Anthropic →",byokOrTitle:"OpenRouter",byokOrDesc:"Оплата по использованию. Часто дешевле. Ключи начинаются с",byokOrS1:"Перейди на openrouter.ai",byokOrS2:"Зарегистрируйся / войди",byokOrS3:"Ключи → Создать ключ",byokOrLink:"Получить ключ OpenRouter →",keyErrFmt:"Ключ должен начинаться с sk-ant- или sk-or-",keyErrInv:"Неверный ключ: ",keyErrNet:"Не удалось связаться с API — ключ всё равно сохранён.",usageStat:"Статистика использования",apiCalls:"Вызовы API",estCost:"Ориент. стоимость",inputTok:"Токены ввода",outputTok:"Токены вывода",resetStats:"Сбросить статистику",rmTip:"Удалить",start:"Начать",cred:"кредиты",credFree:"бесплатные кредиты",credOut:"Кредиты закончились",credOutMsg:"Бесплатные кредиты закончились. Добавь свой API-ключ, чтобы продолжить — бесплатно на Anthropic или OpenRouter.",credByok:"Добавить свой ключ →",lp:["🧠 Думаю...","☕ Варю идеи...","🔮 Хрустальный шар нагревается...","🧙 Колдую...","🤔 Глубокие размышления...","🎯 Настраиваюсь..."],
  topUp:"Пополнить кредиты",topUpDesc:"10 кредитов за €1,00",topUpBtn:"Оплатить через Stripe →",topUpSuccess:"Оплата прошла! Кредиты скоро появятся.",topUpPending:"Обработка кредитов...",topUpPopupTitle:"Кредиты зачислены! 🎉",topUpPopupMsg:"untangle.lol бесплатный и приватный — без рекламы и сбора данных. Кредиты поддерживают работу ИИ и независимый продукт. Спасибо!",topUpPopupBtn:"Отлично, поехали!",
  altruismPopupTitle:"Как мило с твоей стороны! 💛",altruismPopupMsg:"Твоя цель — помогать другим: волонтёрство, забота или доброе дело. Это заслуживает награды: выполни все шаги и получи 10 бесплатных кредитов!",altruismPopupBtn:"Отлично, начнём!",altruismBonusTitle:"🎁 +10 кредитов!",altruismBonusMsg:"Поздравляем! Ты выполнил свою альтруистическую цель. В благодарность за помощь другим мы добавили 10 бесплатных кредитов.",altruismBonusBtn:"Супер, спасибо!",altruismTeaser:"💛 Твоя цель — помогать другим? Заверши все шаги и получи 10 бесплатных кредитов.",altruismPopupMsgRepeat:"Твоя цель — помогать другим, и это прекрасно. Выполни все шаги и сделай настоящий вклад!",analyticsNote:"Мы собираем анонимную статистику использования (без куки, без личных данных).",
  signIn:"Войти через Google",signInSub:"Сохраняй цели на всех устройствах",signOut:"Выйти",profile:"Профиль",terms:"Условия",privacy:"Конфиденциальность",stats:"Статистика",donate:"❤️ Пожертвовать",
  share:"Поделиться",shareCopy:"Копировать",shareCopied:"Скопировано!",shareMsg:"Смотри мой план действий на untangle.lol:",
  altruismLoadingMsg:"💛 Ты делаешь что-то замечательное для других.",
  altruisticSugg:["Хочу стать волонтёром в продуктовом банке","Хочу ухаживать за членом семьи","Хочу создать общественный сад","Хочу регулярно сдавать кровь","Хочу стать наставником для молодого человека"],
  phSugg:["Хочу лучше спать","Хочу научиться играть на гитаре","Хочу заниматься спортом каждый день","Хочу написать книгу","Хочу питаться здоровее"],
  woop:"🎯 Попробуй WOOP",woopOr:"или",woopTitle:"Метод WOOP",woopSub:"Проверенная техника превращения желаний в действия — шаг за шагом.",woopLabels:["Желание","Результат","Препятствие","План"],woopHints:["Чего ты действительно хочешь? Выбери то, что тебе важно — сложное, но достижимое.","Представь лучший результат. Что ты почувствуешь, когда желание исполнится?","Какое главное внутреннее препятствие — привычка, чувство или мысль — может тебя остановить?","Если [препятствие], то я [действие]. Составь конкретный план «если — то»."],woopPh:["Напр. 'Хочу заниматься спортом каждое утро'","Напр. 'Чувствую прилив энергии и гордость за себя'","Напр. 'Выключаю будильник, потому что устал'","Напр. 'Если я выключу будильник, подготовлю спортивную одежду с вечера'"],woopGo:"Создать мой план →",woopLink:"Узнать о научной основе",woopSummaryTitle:"Твой WOOP",suggLabel:"💡 Выбери подсказку",taClrConfirm:"очистить?",celebTitle:"Поздравляем! 🎉",celebMsg:"Ты выполнил все шаги. Отлично — это повод для праздника!",celebBtn:"Спасибо!"},

  {code:"id",label:"Bahasa Indonesia",flag:"🇮🇩",ph:"Mis. 'Saya ingin tidur lebih nyenyak' atau 'Saya ingin belajar gitar' 🎸",hero:"Apa yang ingin kamu capai?",heroS:["Tulis saja.","Tidak ada pertanyaan yang aneh.","Besar atau kecil — semua boleh.","Apa yang ada di pikiranmu?","Tulis, kami bantu kamu."],go:"Mulai →",back:"← Kembali",out:"Keluar",clr:"🗑️ Hapus semua",nG:"➕ Tujuan baru",noG:"Belum ada tujuan. Saatnya mulai!",prog:"progres",allD:"🎉 Semua selesai!",sOf:"dari",eth:"🌍 Saran dengan rasa hormat untuk manusia, bumi & kesejahteraan",err:"Ups, coba lagi!",resB:"← Kembali ke ringkasan",dW:"Selamat datang kembali",dS:"Ini tujuan-tujuanmu.",byok:"Masukkan API key",byokH1:"Gunakan API key milikmu",chAuth:"Ubah autentikasi",rmKey:"Hapus key",lSel:"Bahasa",byokL:"API key (Anthropic atau OpenRouter)",byokPh:"sk-ant-... atau sk-or-...",byokSave:"Simpan & mulai",byokNote:"Disimpan di browsermu. Tidak pernah dibagikan.",apiKeyBadge:"🔑 API key",apiKeyUnset:"atur",checking:"Memeriksa...",chooseLang:"Pilih bahasamu",byokAnthTitle:"Anthropic",byokAnthDesc:"Akses langsung ke Claude. Key dimulai dengan",byokAnthS1:"Buka console.anthropic.com",byokAnthS2:"Daftar / masuk",byokAnthS3:"Pengaturan → API Key → Buat key",byokAnthLink:"Dapatkan key Anthropic →",byokOrTitle:"OpenRouter",byokOrDesc:"Bayar sesuai pemakaian. Sering lebih murah. Key dimulai dengan",byokOrS1:"Buka openrouter.ai",byokOrS2:"Daftar / masuk",byokOrS3:"Key → Buat key",byokOrLink:"Dapatkan key OpenRouter →",keyErrFmt:"Key harus dimulai dengan sk-ant- atau sk-or-",keyErrInv:"Key tidak valid: ",keyErrNet:"Tidak bisa menghubungi API — key tetap disimpan.",usageStat:"Statistik penggunaan",apiCalls:"Panggilan API",estCost:"Perkiraan biaya",inputTok:"Token input",outputTok:"Token output",resetStats:"Reset statistik",rmTip:"Hapus",start:"Mulai",cred:"kredit",credFree:"kredit gratis",credOut:"Kredit habis",credOutMsg:"Kredit gratismu sudah habis. Tambahkan API key milikmu untuk melanjutkan — gratis dari Anthropic atau OpenRouter.",credByok:"Tambahkan key sendiri →",lp:["🧠 Berpikir...","☕ Meracik ide...","🔮 Bola kristal menghangat...","🧙 Merapal mantra...","🤔 Berpikir dalam...","🎯 Mengunci target..."],
  topUp:"Isi ulang kredit",topUpDesc:"10 kredit seharga €1,00",topUpBtn:"Bayar dengan Stripe →",topUpSuccess:"Pembayaran berhasil! Kredit akan segera ditambahkan.",topUpPending:"Memproses kredit...",topUpPopupTitle:"Kredit ditambahkan! 🎉",topUpPopupMsg:"untangle.lol gratis dan privat — tanpa iklan atau pengumpulan data. Kredit menjaga AI tetap berjalan dan mendukung produk yang adil dan independen. Terima kasih!",topUpPopupBtn:"Hebat, ayo mulai!",
  altruismPopupTitle:"Betapa baiknya kamu! 💛",altruismPopupMsg:"Tujuanmu adalah membantu orang lain — seperti kerja sukarela, merawat orang, atau mendukung hal baik. Ini layak mendapat hadiah: selesaikan semua langkah dan otomatis dapatkan 10 kredit gratis!",altruismPopupBtn:"Hebat, ayo mulai!",altruismBonusTitle:"🎁 +10 kredit didapat!",altruismBonusMsg:"Selamat! Kamu menyelesaikan tujuan altruistikmu. Sebagai terima kasih atas usahamu membantu orang lain, kami menambahkan 10 kredit gratis ke akunmu.",altruismBonusBtn:"Keren, terima kasih!",altruismTeaser:"💛 Apakah tujuanmu tentang membantu orang lain? Dapatkan 10 kredit gratis saat menyelesaikan semua langkah.",altruismPopupMsgRepeat:"Tujuanmu tentang membantu orang lain — itu sungguh luar biasa. Selesaikan semua langkah dan buat perbedaan nyata!",analyticsNote:"Kami mengumpulkan statistik penggunaan anonim (tanpa cookie, tanpa data pribadi).",
  signIn:"Masuk dengan Google",signInSub:"Simpan tujuanmu di semua perangkat",signOut:"Keluar",profile:"Profil",terms:"Ketentuan",privacy:"Privasi",stats:"Statistik",donate:"❤️ Donasi",
  share:"Bagikan",shareCopy:"Salin",shareCopied:"Tersalin!",shareMsg:"Lihat rencana aksiku di untangle.lol:",
  altruismLoadingMsg:"💛 Kamu sedang melakukan sesuatu yang luar biasa untuk orang lain.",
  altruisticSugg:["Saya ingin menjadi sukarelawan di bank makanan","Saya ingin merawat anggota keluarga","Saya ingin memulai kebun komunitas","Saya ingin mendonorkan darah secara rutin","Saya ingin menjadi mentor bagi anak muda"],
  phSugg:["Saya ingin tidur lebih nyenyak","Saya ingin belajar gitar","Saya ingin berolahraga setiap hari","Saya ingin menulis buku","Saya ingin makan lebih sehat"],
  woop:"🎯 Coba WOOP",woopOr:"atau",woopTitle:"Metode WOOP",woopSub:"Teknik terbukti untuk mengubah keinginan menjadi tindakan — langkah demi langkah.",woopLabels:["Keinginan","Hasil","Hambatan","Rencana"],woopHints:["Apa yang benar-benar kamu inginkan? Pilih sesuatu yang menyentuh hatimu — menantang tapi bisa dicapai.","Bayangkan hasil terbaik yang mungkin. Bagaimana perasaanmu saat keinginanmu terwujud?","Apa hambatan internal utama — kebiasaan, perasaan, atau pikiran — yang bisa menghalangimu?","Jika [hambatan], maka saya akan [tindakan]. Buat rencana jika-maka yang spesifik."],woopPh:["Mis. 'Saya ingin berolahraga setiap pagi'","Mis. 'Saya merasa berenergi dan bangga pada diri sendiri'","Mis. 'Saya mematikan alarm karena lelah'","Mis. 'Jika saya mematikan alarm, saya akan menyiapkan baju olahraga malam sebelumnya'"],woopGo:"Buat rencanaku →",woopLink:"Pelajari tentang ilmiahnya",woopSummaryTitle:"WOOP-mu",suggLabel:"💡 Pilih saran",taClrConfirm:"hapus?",celebTitle:"Selamat! 🎉",celebMsg:"Kamu telah menyelesaikan semua langkah. Kerja bagus — ini layak dirayakan!",celebBtn:"Terima kasih!"},

  {code:"ja",label:"日本語",flag:"🇯🇵",ph:"例：「もっとよく眠りたい」「ギターを弾けるようになりたい」🎸",hero:"何を達成したいですか？",heroS:["思いつくまま書いてみて。","変な質問なんてないよ。","大きくても小さくても何でもOK。","何が気になってる？","書き出してみて、一緒に考えよう。"],go:"始めよう →",back:"← 戻る",out:"ログアウト",clr:"🗑️ すべて消去",nG:"➕ 新しい目標",noG:"まだ目標がありません。始めましょう！",prog:"進捗",allD:"🎉 全部完了！",sOf:"/",eth:"🌍 人・地球・幸福を大切にしたアドバイス",err:"おっと、もう一度試してね！",resB:"← 概要に戻る",dW:"おかえりなさい",dS:"あなたの目標です。",byok:"APIキーを入力",byokH1:"自分のAPIキーを使う",chAuth:"認証を変更",rmKey:"キーを削除",lSel:"言語",byokL:"APIキー（AnthropicまたはOpenRouter）",byokPh:"sk-ant-... または sk-or-...",byokSave:"保存して始める",byokNote:"ブラウザに保存されます。共有されることはありません。",apiKeyBadge:"🔑 APIキー",apiKeyUnset:"設定",checking:"確認中...",chooseLang:"言語を選んでください",byokAnthTitle:"Anthropic",byokAnthDesc:"Claudeへの直接アクセス。キーの先頭は",byokAnthS1:"console.anthropic.comへアクセス",byokAnthS2:"登録 / ログイン",byokAnthS3:"設定 → APIキー → キーを作成",byokAnthLink:"Anthropicキーを取得 →",byokOrTitle:"OpenRouter",byokOrDesc:"従量課金制。多くの場合お得。キーの先頭は",byokOrS1:"openrouter.aiへアクセス",byokOrS2:"登録 / ログイン",byokOrS3:"キー → キーを作成",byokOrLink:"OpenRouterキーを取得 →",keyErrFmt:"キーはsk-ant-またはsk-or-で始まる必要があります",keyErrInv:"無効なキー: ",keyErrNet:"APIに接続できませんでした — キーは保存されました。",usageStat:"利用統計",apiCalls:"API呼び出し",estCost:"推定コスト",inputTok:"入力トークン",outputTok:"出力トークン",resetStats:"統計をリセット",rmTip:"削除",start:"スタート",cred:"クレジット",credFree:"無料クレジット",credOut:"クレジット不足",credOutMsg:"無料クレジットがなくなりました。続けるにはAPIキーを追加してください — AnthropicまたはOpenRouterで無料で取得できます。",credByok:"自分のキーを追加 →",lp:["🧠 考え中...","☕ アイデアを淹れてます...","🔮 水晶玉を温めてます...","🧙 魔法をかけてます...","🤔 深く考え中...","🎯 照準を合わせてます..."],
  topUp:"クレジットを追加",topUpDesc:"€1.00で10クレジット",topUpBtn:"Stripeで支払う →",topUpSuccess:"支払い完了！クレジットがまもなく追加されます。",topUpPending:"クレジット処理中...",topUpPopupTitle:"クレジット追加完了！ 🎉",topUpPopupMsg:"untangle.lolは無料でプライベートです — 広告やデータ収集はありません。クレジットはAIの稼働を支え、公正で独立したプロダクトを応援します。ありがとう！",topUpPopupBtn:"よし、始めよう！",
  altruismPopupTitle:"なんて優しいの！ 💛",altruismPopupMsg:"あなたの目標は他の人を助けること — ボランティア、介護、社会貢献など。それは報われるべきです：すべてのステップを完了すると、自動的に10無料クレジットがもらえます！",altruismPopupBtn:"よし、始めよう！",altruismBonusTitle:"🎁 +10クレジット獲得！",altruismBonusMsg:"おめでとう！利他的な目標を達成しました。他の人を助ける努力への感謝として、10無料クレジットを追加しました。",altruismBonusBtn:"すごい、ありがとう！",altruismTeaser:"💛 あなたの目標は他の人を助けること？すべてのステップを完了して10無料クレジットをゲットしよう。",altruismPopupMsgRepeat:"あなたの目標は他の人を助けること — 本当に素晴らしいです。すべてのステップを完了して、本当の変化を生み出そう！",analyticsNote:"匿名の利用統計を収集しています（クッキーや個人データはありません）。",
  signIn:"Googleでサインイン",signInSub:"すべてのデバイスで目標を保存",signOut:"サインアウト",profile:"プロフィール",terms:"利用規約",privacy:"プライバシー",stats:"統計",donate:"❤️ 寄付",
  share:"シェア",shareCopy:"コピー",shareCopied:"コピーしました！",shareMsg:"untangle.lolでの私のアクションプランを見てね：",
  altruismLoadingMsg:"💛 あなたは他の人のために素晴らしいことをしています。",
  altruisticSugg:["フードバンクでボランティアしたい","家族の介護をしたい","コミュニティガーデンを始めたい","定期的に献血したい","若い人のメンターになりたい"],
  phSugg:["もっとよく眠りたい","ギターを弾けるようになりたい","毎日運動したい","本を書きたい","もっと健康的に食べたい"],
  woop:"🎯 WOOPを試す",woopOr:"または",woopTitle:"WOOPメソッド",woopSub:"願いを行動に変える実証済みのテクニック — ステップバイステップ。",woopLabels:["願い","結果","障害","計画"],woopHints:["本当に何がしたい？心に響くものを選んで — 挑戦的だけど達成可能なもの。","最高の結果を想像して。願いが叶ったらどんな気持ち？","あなたを止めるかもしれない主な内面的な障害 — 習慣、感情、考え — は何？","もし[障害]なら、[行動]する。具体的な「もし〜なら」計画を立てよう。"],woopPh:["例：「毎朝運動したい」","例：「エネルギッシュで自分に誇りを感じる」","例：「疲れているのでアラームを止めてしまう」","例：「アラームを止めたら、前の晩に運動着を準備しておく」"],woopGo:"プランを作成 →",woopLink:"科学的根拠を知る",woopSummaryTitle:"あなたのWOOP",suggLabel:"💡 提案を選ぶ",taClrConfirm:"クリア？",celebTitle:"おめでとう！🎉",celebMsg:"すべてのステップを完了しました。よくできました — これはお祝いに値します！",celebBtn:"ありがとう！"},

  {code:"sw",label:"Kiswahili",flag:"🇰🇪",ph:"Mf. 'Nataka kulala vizuri zaidi' au 'Nataka kujifunza gitaa' 🎸",hero:"Unataka kufikia nini?",heroS:["Andika tu.","Hakuna swali la ajabu.","Kubwa au ndogo — yote yanafaa.","Nini kinakusumbua?","Andika, tutakusaidia."],go:"Tuanze →",back:"← Rudi",out:"Toka",clr:"🗑️ Futa yote",nG:"➕ Lengo jipya",noG:"Hakuna malengo bado. Ni wakati wa kuanza!",prog:"maendeleo",allD:"🎉 Yote yamekamilika!",sOf:"kati ya",eth:"🌍 Ushauri wenye heshima kwa watu, sayari na ustawi",err:"Lo, jaribu tena!",resB:"← Rudi kwenye muhtasari",dW:"Karibu tena",dS:"Haya ndiyo malengo yako.",byok:"Weka API key yako",byokH1:"Tumia API key yako mwenyewe",chAuth:"Badilisha uthibitishaji",rmKey:"Ondoa key",lSel:"Lugha",byokL:"API key (Anthropic au OpenRouter)",byokPh:"sk-ant-... au sk-or-...",byokSave:"Hifadhi na uanze",byokNote:"Imehifadhiwa kwenye kivinjari chako. Haishirikiwa kamwe.",apiKeyBadge:"🔑 API key",apiKeyUnset:"weka",checking:"Inakagua...",chooseLang:"Chagua lugha yako",byokAnthTitle:"Anthropic",byokAnthDesc:"Ufikiaji wa moja kwa moja kwa Claude. Key zinaanza na",byokAnthS1:"Nenda console.anthropic.com",byokAnthS2:"Jisajili / ingia",byokAnthS3:"Mipangilio → API Key → Unda key",byokAnthLink:"Pata key ya Anthropic →",byokOrTitle:"OpenRouter",byokOrDesc:"Lipa unavyotumia. Mara nyingi ni nafuu zaidi. Key zinaanza na",byokOrS1:"Nenda openrouter.ai",byokOrS2:"Jisajili / ingia",byokOrS3:"Key → Unda key",byokOrLink:"Pata key ya OpenRouter →",keyErrFmt:"Key lazima ianze na sk-ant- au sk-or-",keyErrInv:"Key si sahihi: ",keyErrNet:"Haikuweza kufikia API — key imehifadhiwa hata hivyo.",usageStat:"Takwimu za matumizi",apiCalls:"Simu za API",estCost:"Gharama inayokadiriwa",inputTok:"Tokeni za pembejeo",outputTok:"Tokeni za matokeo",resetStats:"Weka upya takwimu",rmTip:"Ondoa",start:"Anza",cred:"mikopo",credFree:"mikopo ya bure",credOut:"Mikopo imeisha",credOutMsg:"Mikopo yako ya bure imeisha. Ongeza API key yako ili kuendelea — bure kutoka Anthropic au OpenRouter.",credByok:"Ongeza key yako →",lp:["🧠 Inafikiria...","☕ Inapika mawazo...","🔮 Tufe la kioo linaamka...","🧙 Inapiga hirizi...","🤔 Fikira za kina...","🎯 Inalenga..."],
  topUp:"Jaza mikopo",topUpDesc:"Mikopo 10 kwa €1.00",topUpBtn:"Lipa kwa Stripe →",topUpSuccess:"Malipo yamefanikiwa! Mikopo itaongezwa hivi karibuni.",topUpPending:"Inashughulikia mikopo...",topUpPopupTitle:"Mikopo imeongezwa! 🎉",topUpPopupMsg:"untangle.lol ni bure na faragha — hakuna matangazo au ukusanyaji wa data. Mikopo inafanya AI ifanye kazi na kusaidia bidhaa huru na ya haki. Asante!",topUpPopupBtn:"Sawa, twende!",
  altruismPopupTitle:"Jinsi unavyojali! 💛",altruismPopupMsg:"Lengo lako ni kuhusu kusaidia wengine — kama kujitolea, kutunza, au kusaidia jambo jema. Hilo linastahili tuzo: kamilisha hatua zote na upate mikopo 10 ya bure moja kwa moja!",altruismPopupBtn:"Sawa, twende!",altruismBonusTitle:"🎁 +10 mikopo imepatikana!",altruismBonusMsg:"Hongera! Umekamilisha lengo lako la huruma. Kama shukrani kwa jitihada zako za kusaidia wengine, tumeongeza mikopo 10 ya bure kwenye akaunti yako.",altruismBonusBtn:"Nzuri, asante!",altruismTeaser:"💛 Lengo lako ni kuhusu kusaidia wengine? Basi pata mikopo 10 ya bure unapokamilisha hatua zote.",altruismPopupMsgRepeat:"Lengo lako ni kuhusu kusaidia wengine — hiyo ni nzuri sana. Kamilisha hatua zote na ulete mabadiliko ya kweli!",analyticsNote:"Tunakusanya takwimu za matumizi zisizo na jina (hakuna kuki, hakuna data binafsi).",
  signIn:"Ingia na Google",signInSub:"Hifadhi malengo yako kwenye vifaa vyote",signOut:"Toka",profile:"Wasifu",terms:"Masharti",privacy:"Faragha",stats:"Takwimu",donate:"❤️ Changia",
  share:"Shiriki",shareCopy:"Nakili",shareCopied:"Imenakiliwa!",shareMsg:"Angalia mpango wangu wa hatua kwenye untangle.lol:",
  altruismLoadingMsg:"💛 Unafanya jambo zuri kwa wengine.",
  altruisticSugg:["Nataka kujitolea katika benki ya chakula","Nataka kutunza mwanafamilia","Nataka kuanzisha bustani ya jamii","Nataka kutoa damu mara kwa mara","Nataka kuwa mshauri kwa kijana"],
  phSugg:["Nataka kulala vizuri zaidi","Nataka kujifunza gitaa","Nataka kufanya mazoezi kila siku","Nataka kuandika kitabu","Nataka kula kwa afya zaidi"],
  woop:"🎯 Jaribu WOOP",woopOr:"au",woopTitle:"Mbinu ya WOOP",woopSub:"Mbinu iliyothibitishwa ya kubadilisha matamanio kuwa vitendo — hatua kwa hatua.",woopLabels:["Tamaa","Matokeo","Kikwazo","Mpango"],woopHints:["Unataka nini kweli kweli? Chagua kitu kinachogusa moyo wako — changamoto lakini inawezekana.","Fikiria matokeo bora zaidi yanayowezekana. Utajisikiaje tamaa yako itakapotimia?","Kikwazo kikuu cha ndani — tabia, hisia, au wazo — ambacho kinaweza kukuzuia ni nini?","Ikiwa [kikwazo], basi nitafanya [hatua]. Tengeneza mpango maalum wa ikiwa-basi."],woopPh:["Mf. 'Nataka kufanya mazoezi kila asubuhi'","Mf. 'Ninajisikia na nguvu na kujivunia'","Mf. 'Ninazima kengele kwa sababu nimechoka'","Mf. 'Ikiwa ninazima kengele, nitaandaa nguo za mazoezi usiku wa jana'"],woopGo:"Tengeneza mpango wangu →",woopLink:"Jifunze kuhusu sayansi",woopSummaryTitle:"WOOP yako",suggLabel:"💡 Chagua pendekezo",taClrConfirm:"futa?",celebTitle:"Hongera! 🎉",celebMsg:"Umekamilisha hatua zote. Vizuri sana — hii inastahili kusherehekewa!",celebBtn:"Asante!"},

  {code:"tr",label:"Türkçe",flag:"🇹🇷",ph:"Örn. 'Daha iyi uyumak istiyorum' veya 'Gitar çalmayı öğrenmek istiyorum' 🎸",hero:"Ne başarmak istiyorsun?",heroS:["Sadece yaz.","Hiçbir soru garip değil.","Büyük ya da küçük — hepsi olur.","Aklından ne geçiyor?","Yaz, biz yardım ederiz."],go:"Başlayalım →",back:"← Geri",out:"Çıkış",clr:"🗑️ Hepsini sil",nG:"➕ Yeni hedef",noG:"Henüz hedef yok. Başlama zamanı!",prog:"ilerleme",allD:"🎉 Hepsi tamam!",sOf:"/",eth:"🌍 İnsan, gezegen ve refaha saygılı tavsiyeler",err:"Hay aksi, tekrar dene!",resB:"← Genel bakışa dön",dW:"Tekrar hoş geldin",dS:"İşte hedeflerin.",byok:"API anahtarını gir",byokH1:"Kendi API anahtarını kullan",chAuth:"Kimlik doğrulamayı değiştir",rmKey:"Anahtarı kaldır",lSel:"Dil",byokL:"API anahtarı (Anthropic veya OpenRouter)",byokPh:"sk-ant-... veya sk-or-...",byokSave:"Kaydet ve başla",byokNote:"Tarayıcında saklanır. Asla paylaşılmaz.",apiKeyBadge:"🔑 API anahtarı",apiKeyUnset:"ayarla",checking:"Kontrol ediliyor...",chooseLang:"Dilini seç",byokAnthTitle:"Anthropic",byokAnthDesc:"Claude'a doğrudan erişim. Anahtarlar şununla başlar",byokAnthS1:"console.anthropic.com'a git",byokAnthS2:"Kaydol / giriş yap",byokAnthS3:"Ayarlar → API Anahtarları → Anahtar oluştur",byokAnthLink:"Anthropic anahtarı al →",byokOrTitle:"OpenRouter",byokOrDesc:"Kullandıkça öde. Genellikle daha ucuz. Anahtarlar şununla başlar",byokOrS1:"openrouter.ai'ye git",byokOrS2:"Kaydol / giriş yap",byokOrS3:"Anahtarlar → Anahtar oluştur",byokOrLink:"OpenRouter anahtarı al →",keyErrFmt:"Anahtar sk-ant- veya sk-or- ile başlamalı",keyErrInv:"Geçersiz anahtar: ",keyErrNet:"API'ye ulaşılamadı — anahtar yine de kaydedildi.",usageStat:"Kullanım istatistikleri",apiCalls:"API çağrıları",estCost:"Tahmini maliyet",inputTok:"Giriş tokenleri",outputTok:"Çıkış tokenleri",resetStats:"İstatistikleri sıfırla",rmTip:"Kaldır",start:"Başla",cred:"kredi",credFree:"ücretsiz kredi",credOut:"Kredi bitti",credOutMsg:"Ücretsiz kredilerin tükendi. Devam etmek için kendi API anahtarını ekle — Anthropic veya OpenRouter'dan ücretsiz.",credByok:"Kendi anahtarını ekle →",lp:["🧠 Düşünüyorum...","☕ Fikirler demleniyor...","🔮 Kristal küre ısınıyor...","🧙 Büyü yapılıyor...","🤔 Derin düşünce...","🎯 Odaklanıyorum..."],
  topUp:"Kredi yükle",topUpDesc:"€1,00'a 10 kredi",topUpBtn:"Stripe ile öde →",topUpSuccess:"Ödeme başarılı! Krediler yakında eklenecek.",topUpPending:"Krediler işleniyor...",topUpPopupTitle:"Krediler eklendi! 🎉",topUpPopupMsg:"untangle.lol ücretsiz ve özeldir — reklam veya veri toplama yok. Krediler yapay zekayı çalıştırır ve adil, bağımsız bir ürünü destekler. Teşekkürler!",topUpPopupBtn:"Harika, başlayalım!",
  altruismPopupTitle:"Ne kadar naziksin! 💛",altruismPopupMsg:"Hedefin başkalarına yardım etmek — gönüllülük, bakım veya iyi bir amaca destek gibi. Bu ödülü hak ediyor: tüm adımları tamamla ve otomatik olarak 10 ücretsiz kredi kazan!",altruismPopupBtn:"Harika, başlayalım!",altruismBonusTitle:"🎁 +10 kredi kazanıldı!",altruismBonusMsg:"Tebrikler! Özgecil hedefini tamamladın. Başkalarına yardım etme çaban için teşekkür olarak hesabına 10 ücretsiz kredi ekledik.",altruismBonusBtn:"Süper, teşekkürler!",altruismTeaser:"💛 Hedefin başkalarına yardım etmek mi? Tüm adımları tamamlayarak 10 ücretsiz kredi kazan.",altruismPopupMsgRepeat:"Hedefin başkalarına yardım etmek — bu gerçekten harika. Tüm adımları tamamla ve gerçek bir fark yarat!",analyticsNote:"Anonim kullanım istatistikleri topluyoruz (çerez veya kişisel veri yok).",
  signIn:"Google ile giriş yap",signInSub:"Hedeflerini tüm cihazlarda kaydet",signOut:"Çıkış yap",profile:"Profil",terms:"Koşullar",privacy:"Gizlilik",stats:"İstatistikler",donate:"❤️ Bağış yap",
  share:"Paylaş",shareCopy:"Kopyala",shareCopied:"Kopyalandı!",shareMsg:"untangle.lol'daki eylem planıma bak:",
  altruismLoadingMsg:"💛 Başkaları için harika bir şey yapıyorsun.",
  altruisticSugg:["Gıda bankasında gönüllü olmak istiyorum","Bir aile üyesine bakmak istiyorum","Topluluk bahçesi kurmak istiyorum","Düzenli kan bağışlamak istiyorum","Bir gence mentor olmak istiyorum"],
  phSugg:["Daha iyi uyumak istiyorum","Gitar çalmayı öğrenmek istiyorum","Her gün spor yapmak istiyorum","Bir kitap yazmak istiyorum","Daha sağlıklı beslenmek istiyorum"],
  woop:"🎯 WOOP'u dene",woopOr:"veya",woopTitle:"WOOP Yöntemi",woopSub:"İstekleri eyleme dönüştürmek için kanıtlanmış bir teknik — adım adım.",woopLabels:["İstek","Sonuç","Engel","Plan"],woopHints:["Gerçekten ne istiyorsun? Kalbine dokunan bir şey seç — zorlu ama ulaşılabilir.","Mümkün olan en iyi sonucu hayal et. İsteğin gerçekleştiğinde nasıl hissedersin?","Seni durdurabilen ana içsel engel — bir alışkanlık, duygu veya düşünce — nedir?","Eğer [engel], o zaman [eylem] yapacağım. Somut bir eğer-o zaman planı yap."],woopPh:["Örn. 'Her sabah spor yapmak istiyorum'","Örn. 'Enerjik ve kendimle gurur duyuyorum'","Örn. 'Yorgun olduğum için alarmı kapatıyorum'","Örn. 'Alarmı kapatırsam, spor kıyafetlerimi bir gece önce hazırlarım'"],woopGo:"Planımı oluştur →",woopLink:"Bilimsel temeli öğren",woopSummaryTitle:"Senin WOOP'un",suggLabel:"💡 Bir öneri seç",taClrConfirm:"temizle?",celebTitle:"Tebrikler! 🎉",celebMsg:"Tüm adımları tamamladın. Aferin — bu kutlamayı hak ediyor!",celebBtn:"Teşekkürler!"},
];

const TH = {
  dark:{bg:"linear-gradient(135deg,#0f172a,#1e293b,#0f172a)",card:"rgba(255,255,255,0.05)",cb:"rgba(255,255,255,0.08)",ib:"rgba(255,255,255,0.06)",ibr:"rgba(255,255,255,0.12)",tx:"#f1f5f9",tm:"#94a3b8",tf:"#64748b",ac:"#facc15",ag:"linear-gradient(135deg,#facc15,#eab308)",ab:"rgba(250,204,21,0.15)",abr:"rgba(250,204,21,0.4)",am:"rgba(250,204,21,0.2)",bt:"#0f172a",gr:"#22c55e",gb:"rgba(34,197,94,0.06)",gbr:"rgba(34,197,94,0.12)",gt:"#6ee7a0",eb:"rgba(239,68,68,0.12)",et:"#fca5a5",ghb:"rgba(255,255,255,0.06)",ghr:"rgba(255,255,255,0.1)",ckb:"rgba(255,255,255,0.06)",ckr:"rgba(255,255,255,0.15)",cm:"#0f172a",dt:"#4a6350",sb:"rgba(255,255,255,0.02)",sr:"rgba(255,255,255,0.06)",dm:"#475569",sh:"none",hp:"rgba(250,204,21,0.08)",hpr:"rgba(250,204,21,0.25)"},
  light:{bg:"linear-gradient(135deg,#f8fafc,#e2e8f0,#f8fafc)",card:"rgba(255,255,255,0.9)",cb:"rgba(0,0,0,0.08)",ib:"#fff",ibr:"rgba(0,0,0,0.15)",tx:"#1e293b",tm:"#64748b",tf:"#94a3b8",ac:"#b45309",ag:"linear-gradient(135deg,#f59e0b,#d97706)",ab:"rgba(245,158,11,0.12)",abr:"rgba(245,158,11,0.4)",am:"rgba(245,158,11,0.15)",bt:"#fff",gr:"#16a34a",gb:"rgba(22,163,74,0.06)",gbr:"rgba(22,163,74,0.15)",gt:"#16a34a",eb:"rgba(239,68,68,0.08)",et:"#dc2626",ghb:"rgba(0,0,0,0.03)",ghr:"rgba(0,0,0,0.1)",ckb:"#fff",ckr:"rgba(0,0,0,0.2)",cm:"#fff",dt:"#4d7c56",sb:"rgba(0,0,0,0.015)",sr:"rgba(0,0,0,0.06)",dm:"#94a3b8",sh:"0 1px 3px rgba(0,0,0,0.06)",hp:"rgba(245,158,11,0.06)",hpr:"rgba(245,158,11,0.2)"},
};

const GS=`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes heroFade{0%{opacity:0;transform:translateY(6px)}15%{opacity:1;transform:translateY(0)}85%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-6px)}}@keyframes pulse{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.4);opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes pop{0%{transform:scale(1)}50%{transform:scale(1.3)}100%{transform:scale(1)}}@keyframes modalIn{from{opacity:0;transform:translateY(24px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes spinBorder{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.ta-glow{display:block;position:relative;border-radius:12px;padding:1px;overflow:hidden;isolation:isolate}.ta-glow::before{content:"";position:absolute;inset:-100%;width:300%;height:300%;background:conic-gradient(from 0deg,transparent 60%,rgba(250,204,21,0.9) 75%,rgba(254,240,138,1) 80%,rgba(250,204,21,0.9) 85%,transparent 100%);animation:spinBorder 2.4s linear infinite;z-index:0;opacity:1;transition:opacity 0.4s ease}.ta-glow::after{content:"";position:absolute;inset:0;border-radius:12px;background:rgba(250,204,21,0.9);z-index:0;opacity:0;transition:opacity 0.4s ease}.ta-glow-focused::before{opacity:0}.ta-glow-focused::after{opacity:1;animation:glowPulse 2s ease-in-out infinite}@keyframes glowPulse{0%,100%{opacity:1}50%{opacity:0.55}}.ta-glow textarea{position:relative;z-index:1;border:none!important;border-radius:10px;display:block;width:100%;box-sizing:border-box;margin:0}`;

function tz(){try{return Intl.DateTimeFormat().resolvedOptions().timeZone}catch{return"UTC"}}
function fmtDate(iso,z,lc){try{return new Date(iso).toLocaleString(lc||undefined,{timeZone:z,day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return new Date(iso).toLocaleString()}}
function tAgo(iso,lc){const d=Date.now()-new Date(iso).getTime(),m=Math.floor(d/60000),h=Math.floor(d/3600000),dy=Math.floor(d/86400000);if(lc==="nl"){if(m<60)return m+" min geleden";if(h<24)return h+" uur geleden";return dy===1?"gisteren":dy+" dagen geleden";}if(lc==="ar"){if(m<60)return "منذ "+m+" دقيقة";if(h<24)return "منذ "+h+" ساعة";return dy===1?"أمس":"منذ "+dy+" أيام";}if(m<60)return m+"m ago";if(h<24)return h+"h ago";return dy===1?"yesterday":dy+"d ago";}

const LP=[["🧠","Thinking..."],["☕","Brewing ideas..."],["🔮","Crystal ball warming up..."],["🧙","Casting spells..."],["🤔","Deep thought..."],["🎯","Locking in..."]];

function Loader({c,lp}){
  const phrases=lp||LP.map(p=>p.join(" "));
  const [i,setI]=useState(0);const [d,setD]=useState("");const [b,setB]=useState(false);
  useEffect(()=>{let x=0;const a=setInterval(()=>{x=(x+1)%phrases.length;setI(x);setB(true);setTimeout(()=>setB(false),400);},2400);const dd=setInterval(()=>setD(p=>p.length>=3?"":p+"."),500);return()=>{clearInterval(a);clearInterval(dd);};},[]);
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"48px 24px"}}><div style={{fontSize:56,transition:"transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",transform:b?"scale(1.3) rotate(10deg)":"scale(1)",marginBottom:20}}>{(phrases[i]||"").split(" ")[0]}</div><div style={{fontSize:16,color:c.tx,fontWeight:500}}>{(phrases[i]||"").split(" ").slice(1).join(" ")}{d}</div><div style={{marginTop:24,display:"flex",gap:8}}>{[0,1,2].map(j=>(<div key={j} style={{width:10,height:10,borderRadius:"50%",background:c.ac,animation:`pulse 1.2s ease-in-out ${j*0.2}s infinite`}}/>))}</div></div>);
}

function PBar({done,total,c}){
  const p=total>0?(done/total)*100:0;
  return(<div style={{width:"100%",height:6,borderRadius:3,background:c.ghr,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,background:p>=100?c.gr:c.ac,width:p+"%",transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)"}}/></div>);
}
function TTog({mode,set,c}){
  const ic={light:"☀️",dark:"🌙",system:"💻"};const nx={light:"dark",dark:"system",system:"light"};
  return(<button onClick={()=>set(nx[mode])} style={{background:c.ghb,border:"1px solid "+c.ghr,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:14,color:c.tm}}>{ic[mode]} {mode}</button>);
}
function BrandMark({c,size}){
  const s=size==="large";
  return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:s?6:2,marginBottom:s?8:4}}>
    <div style={{fontSize:s?44:32,filter:"drop-shadow(0 0 12px "+c.am+")"}}>🪢</div>
    <div style={{fontSize:s?28:20,fontWeight:800,letterSpacing:"-0.03em",color:c.tx,lineHeight:1}}>untangle</div>
    <div style={{fontSize:s?11:9,fontWeight:500,letterSpacing:"0.15em",color:c.tf,textTransform:"uppercase"}}>.lol</div>
  </div>);
}
function CheckItem({done,label,desc,onToggle,c}){
  return(<div onClick={onToggle} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 14px",borderRadius:12,cursor:onToggle?"pointer":"default",background:done?c.gb:c.sb,border:"1px solid "+(done?c.gbr:c.sr),transition:"all 0.2s",opacity:done?0.75:1,userSelect:"none"}}>
    <div style={{width:28,height:28,minWidth:28,borderRadius:8,background:done?c.gr:c.ckb,border:"2px solid "+(done?c.gr:c.ckr),display:"flex",alignItems:"center",justifyContent:"center",marginTop:2,flexShrink:0,fontSize:16,color:c.cm}}>{done?"✓":""}</div>
    <div style={{flex:1}}><div style={{fontSize:15,fontWeight:600,color:done?c.gr:c.tx,marginBottom:3,textDecoration:done?"line-through":"none"}}>{label}</div><div style={{fontSize:13,color:done?c.dt:c.tm,lineHeight:1.5}}>{desc}</div></div>
  </div>);
}

// ─── Modal overlay ────────────────────────────────────────────────────────────
function Modal({c,children}){
  return(
    <div style={{position:"fixed",inset:0,zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:20,background:"rgba(0,0,0,0.55)",backdropFilter:"blur(4px)"}}>
      <div style={{background:c.card,borderRadius:20,padding:28,width:"100%",maxWidth:400,border:"1px solid "+c.cb,boxShadow:"0 24px 64px rgba(0,0,0,0.35)",animation:"modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)"}}>
        {children}
      </div>
    </div>
  );
}

function AuthBadge({c,onManage,t}){
  const {key}=getCredential();
  const unset=t?.apiKeyUnset||"set";
  return(
    <button onClick={onManage} style={{display:"flex",alignItems:"center",gap:6,background:c.ab,border:"1px solid "+c.abr,borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:12,color:c.ac,whiteSpace:"nowrap"}}>
      <span>{t?.apiKeyBadge||"🔑 API Key"}</span>
      <span style={{opacity:0.5}}>·</span>
      <span style={{color:c.tf}}>{key?key.slice(0,10)+"…":unset}</span>
    </button>
  );
}

export default function App(){
  const [sys,setSys]=useState(()=>{try{return window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light"}catch{return"dark"}});
  useEffect(()=>{try{const q=window.matchMedia("(prefers-color-scheme:dark)");const h=e=>setSys(e.matches?"dark":"light");q.addEventListener("change",h);return()=>q.removeEventListener("change",h);}catch{}},[]);

  const [tm,setTm]=useState("system");
  const [lang,setLang]=useState(null);
  const [auth,setAuth]=useState("out");
  const [user,setUser]=useState(null);
  const [inp,setInp]=useState("");

  const [steps,setSteps]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState(null);
  const [hist,setHist]=useState([]);
  const [vw,setVw]=useState("splash");
  const [activeId,setActiveId]=useState(null);
  const [localComp,setLocalComp]=useState([]);
  const [apiKeyInput,setApiKeyInput]=useState("");
  const [apiKeyErr,setApiKeyErr]=useState("");
  const [ready,setReady]=useState(false);
  const [recents,setRecents]=useState([]);
  const [globalSugg,setGlobalSugg]=useState([]);
  const [usage,setUsage]=useState({calls:0,inputTokens:0,outputTokens:0,costUsd:0});
  const [credits,setCredits]=useState(FREE_CREDITS);
  // Honeypot
  const [honeypot,setHoneypot]=useState("");
  // Altruism
  const [altruismPopup,setAltruismPopup]=useState(false);   // show "you're helping others!" popup
  const [altruismBonusPopup,setAltruismBonusPopup]=useState(false); // show "+10 credits earned!" popup
  const [pendingAltruismId,setPendingAltruismId]=useState(null); // entry id that has pending bonus
  const [loadingAltruistic,setLoadingAltruistic]=useState(false); // show amber pill on loading screen
  // true when the user hasn't received an altruism bonus in the last 24 hours
  const canEarnAltruismBonus=(()=>{const ts=parseInt(ls.get(KEYS.altruismBonusTs)||"0",10);return(Date.now()-ts)>=24*60*60*1000;})();
  // Hero subtitle cycling
  const [heroSIdx,setHeroSIdx]=useState(0);
  // Stripe
  const [topUpBusy,setTopUpBusy]=useState(false);
  const [topUpMsg,setTopUpMsg]=useState(null);
  const [topUpPopup,setTopUpPopup]=useState(null); // { credits: N }
  const [clientRef,setClientRef]=useState(null);
  // Share sheet
  const [shareOpen,setShareOpen]=useState(false);
  const [shareCopied,setShareCopied]=useState(false);
  // WOOP
  const [woopStep,setWoopStep]=useState(0); // 0=W,1=O,2=O,3=P
  const [woopData,setWoopData]=useState({wish:"",outcome:"",obstacle:"",plan:""});
  const woopKeys=["wish","outcome","obstacle","plan"];
  const [suggOpen,setSuggOpen]=useState(false);
  const [altOffset,setAltOffset]=useState(0);
  const [dismissedAlts,setDismissedAlts]=useState([]);
  const [taFocused,setTaFocused]=useState(false);
  const [taClearConfirm,setTaClearConfirm]=useState(false);
  const taClearTimer=useRef(null);
  const [celebOpen,setCelebOpen]=useState(false);
  const handleTaClear=()=>{
    if(!taClearConfirm){setTaClearConfirm(true);clearTimeout(taClearTimer.current);taClearTimer.current=setTimeout(()=>setTaClearConfirm(false),2000);}
    else{clearTimeout(taClearTimer.current);setTaClearConfirm(false);setInp("");}
  };
  const userRef=useRef(null);
  const zone=useMemo(()=>tz(),[]);

  const t=lang?LANGS.find(l=>l.code===lang)||LANGS[1]:LANGS[1];
  const rt=tm==="system"?sys:tm;
  const c=TH[rt];
  const dir=t.rtl?"rtl":"ltr";

  const chTm=(m)=>{setTm(m);ls.set(KEYS.theme,m);};

  useEffect(()=>{
    const color=rt==="dark"?"#0f172a":"#f8fafc";
    let tag=document.querySelector("meta[name='theme-color']");
    if(!tag){tag=document.createElement("meta");tag.name="theme-color";document.head.appendChild(tag);}
    tag.content=color;
    document.documentElement.style.background=color;
    document.body.style.background=color;
  },[rt]);



  // Boot
  useEffect(()=>{(async()=>{
    const sv=ls.get(KEYS.theme);if(sv)setTm(sv);
    const langSv=ls.get("untangle_lang");if(langSv)setLang(langSv);
    const rv=ls.get(KEYS.recents);if(rv){try{setRecents(JSON.parse(rv));}catch{}}
    const uv=ls.get(KEYS.usage);if(uv){try{setUsage(JSON.parse(uv));}catch{}}
    const cv=ls.get(KEYS.credits);
    const now=Date.now();
    const TOPUP_MS=24*60*60*1000;
    if(cv===null){ls.set(KEYS.credits,String(FREE_CREDITS));ls.set(KEYS.creditsTs,String(now));setCredits(FREE_CREDITS);}
    else{
      const n=parseInt(cv,10);
      const ts=parseInt(ls.get(KEYS.creditsTs)||"0",10);
      if((isNaN(n)||n<=0)&&(now-ts)>=TOPUP_MS){ls.set(KEYS.credits,String(FREE_CREDITS));ls.set(KEYS.creditsTs,String(now));setCredits(FREE_CREDITS);}
      else{setCredits(isNaN(n)?FREE_CREDITS:Math.max(0,n));}
    }
    // Ensure clientRef exists
    let ref=ls.get(KEYS.clientRef);
    if(!ref){ref=genClientRef();ls.set(KEYS.clientRef,ref);}
    setClientRef(ref);
    const {valid}=getCredential();
    // Check for URL flags from Google OAuth redirect
    const params=new URLSearchParams(window.location.search);
    const signedIn=params.get("signed_in")==="1";
    const authErr=params.get("auth_error")==="1";
    const topupSuccess=params.get("topup")==="success";
    if(signedIn||authErr||topupSuccess){window.history.replaceState({},"",window.location.pathname);}
    // Try Google session cookie first
    try{
      const sr=await fetch("/api/auth/session");
      const sd=await sr.json();
      if(sd.user?.email){
        const {email,name,picture}=sd.user;
        setUser({email,name,picture});
        userRef.current=email;
        const savedLang=ls.get("untangle_lang");
        if(savedLang)setLang(savedLang);
        setAuth("in");
        const hv=ls.get(eKey(email));if(hv){try{setHist(JSON.parse(hv));}catch{}}
        if(signedIn)utrack("sign_in");
        if(topupSuccess){setTopUpMsg("pending");pollCredits(ref);}
        setVw("dash");setReady(true);return;
      }
    }catch{}
    const gh=ls.get(KEYS.guestHist);if(gh){try{setHist(JSON.parse(gh));}catch{}}
    if(topupSuccess){setTopUpMsg("pending");pollCredits(ref);}
    setVw(langSv?"home":"lang");
    setReady(true);
  })();},[]);

  // Poll /api/credits/claim until credits land (after Stripe redirect)
  const pollCredits=async(ref,attempts=0)=>{
    if(attempts>10)return;
    try{
      const r=await fetch("/api/credits/verify?ref="+encodeURIComponent(ref));
      const d=await r.json();
      if(d.credits>0){
        addCredits(d.credits);
        utrack("credits_topped_up",{credits:d.credits});
        setTopUpMsg(null);
        setTopUpPopup({credits:d.credits});
        return;
      }
    }catch{}
    setTimeout(()=>pollCredits(ref,attempts+1),3000);
  };

  const addCredits=(n)=>{
    setCredits(prev=>{const next=prev+n;ls.set(KEYS.credits,String(next));return next;});
  };

  const saveApiKey=async()=>{
    const k=apiKeyInput.trim();
    const provider=keyProvider(k);
    if(!k.startsWith("sk-ant-")&&!k.startsWith("sk-or-")){setApiKeyErr(t.keyErrFmt);return;}
    ls.set(KEYS.apiKey,k);
    setApiKeyErr("");setApiKeyInput("");
    setBusy(true);
    try{
      if(provider==="openrouter"){
        const r=await fetch(OPENROUTER_URL,{method:"POST",headers:buildHeaders(k),body:JSON.stringify({model:MODEL_OPENROUTER,max_tokens:10,messages:[{role:"user",content:"hi"}]})});
        const d=await r.json();
        if(d.error){ls.del(KEYS.apiKey);setApiKeyErr(t.keyErrInv+d.error.message);setBusy(false);return;}
      }else{
        const r=await fetch(ANTHROPIC_URL,{method:"POST",headers:buildHeaders(k),body:JSON.stringify({model:MODEL_ANTHROPIC,max_tokens:10,messages:[{role:"user",content:"hi"}]})});
        const d=await r.json();
        if(d.error){ls.del(KEYS.apiKey);setApiKeyErr(t.keyErrInv+d.error.message);setBusy(false);return;}
      }
    }catch(e){
      setApiKeyErr(t.keyErrNet);
    }
    setBusy(false);
    utrack("byok_key_saved",{provider});
    setVw(auth==="in"?"dash":lang?"home":"lang");
  };

  const removeAuth=()=>{ls.del(KEYS.apiKey);setVw(auth==="in"?"dash":"home");};
  const logout=async()=>{
    try{await fetch("/api/auth/logout",{method:"POST"});}catch{}
    utrack("sign_out");
    setAuth("out");setUser(null);userRef.current=null;setHist([]);setSteps(null);setInp("");setVw("home");setActiveId(null);setLocalComp([]);
  };
  const pickLang=(code)=>{setLang(code);ls.set("untangle_lang",code);utrack("language_selected",{lang:code});setVw("home");};

  useEffect(()=>{
    if(!lang)return;
    fetch("/api/suggestions?lang="+lang)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d?.suggestions)setGlobalSugg(d.suggestions);})
      .catch(()=>{});
  },[lang]);

  // Pre-fill textarea with last used goal when navigating to home/new_goal
  useEffect(()=>{
    if((vw==="home"||vw==="new_goal")&&!inp&&recents[0]){
      setInp(recents[0]);
    }
  },[vw]);

  // Cycle heroS phrases when textarea is empty
  useEffect(()=>{
    if(inp)return;
    const phrases=t.heroS;
    if(!phrases||phrases.length<=1)return;
    const id=setInterval(()=>setHeroSIdx(i=>(i+1)%phrases.length),3000);
    return()=>clearInterval(id);
  },[inp,t]);

  const callAPI=async(messages,maxTokens=1000)=>{
    const {key,provider}=getCredential();
    if(provider==="openrouter"){
      const r=await fetch(OPENROUTER_URL,{method:"POST",headers:buildHeaders(key),body:JSON.stringify({model:MODEL_OPENROUTER,max_tokens:maxTokens,messages})});
      if(!r.ok)throw new Error("fail");
      const d=await r.json();if(d.error)throw new Error(d.error.message);
      const text=(d.choices||[]).map(ch=>ch.message?.content||"").join("");
      const u=d.usage||{};
      return{text,inputTokens:u.prompt_tokens||0,outputTokens:u.completion_tokens||0};
    }else{
      const r=await fetch(ANTHROPIC_URL,{method:"POST",headers:buildHeaders(key),body:JSON.stringify({model:MODEL_ANTHROPIC,max_tokens:maxTokens,messages})});
      if(!r.ok)throw new Error("fail");
      const d=await r.json();if(d.error)throw new Error(d.error.message);
      const text=(d.content||[]).map(b=>b.text||"").join("");
      const u=d.usage||{};
      return{text,inputTokens:u.input_tokens||0,outputTokens:u.output_tokens||0};
    }
  };

  const prompt=(ui)=>`You are a friendly, humorous coach. You are the AI behind Untangle.lol.\nRespond ENTIRELY in ${t.label}.\nGoal: "${ui}"\nPRINCIPLES: Wellbeing, honesty, sustainability.\nSTYLE: doable today/this week, casual, emoji in title, specific, 3-5 steps.\nAlso set "altruistic":true if the goal is primarily about helping or benefiting OTHER people OR building community — this includes volunteering, caregiving, charity, supporting others in need, starting a club or group, organizing community events, neighborhood initiatives, or any goal whose main beneficiary is a group of people beyond just yourself — otherwise false.\nJSON only, no markdown:\n{"titel":"Summary","altruistic":false,"stappen":[{"nummer":1,"actie":"Emoji + title","toelichting":"1-2 sentences"}]}`;

  const promptWoop=(w)=>`You are a friendly, humorous coach. You are the AI behind Untangle.lol.\nRespond ENTIRELY in ${t.label}.\nThe user has completed a WOOP exercise:\n- Wish: "${w.wish}"\n- Outcome: "${w.outcome}"\n- Obstacle: "${w.obstacle}"\n- Plan (if-then): "${w.plan}"\nPRINCIPLES: Wellbeing, honesty, sustainability.\nSTYLE: doable today/this week, casual, emoji in title, specific, 3-5 action steps. The last step MUST be the user's if-then plan turned into a concrete action.\nAlso set "altruistic":true if the wish is primarily about helping or benefiting OTHER people — otherwise false.\nJSON only, no markdown:\n{"titel":"Summary emoji","altruistic":false,"stappen":[{"nummer":1,"actie":"Emoji + title","toelichting":"1-2 sentences"}]}`;

  const deductCredit=()=>{
    setCredits(prev=>{const next=Math.max(0,prev-1);ls.set(KEYS.credits,String(next));return next;});
  };

  const submit=async()=>{
    if(!inp.trim()||busy)return;
    // Honeypot — bots fill hidden fields
    if(honeypot)return;
    const {valid}=getCredential();
    if(!valid){
      if(credits<=0){setVw("no_credits");return;}
    }
    setBusy(true);setErr(null);setSteps(null);setVw("loading");setLoadingAltruistic(false);
    utrack("goal_submitted",{lang,mode:valid?"byok":"free"});
    try{
      let tx,inputTokens,outputTokens;
      if(valid){
        const r=await callAPI([{role:"user",content:prompt(inp.trim())}],1000);
        tx=r.text;inputTokens=r.inputTokens;outputTokens=r.outputTokens;
      }else{
        const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:prompt(inp.trim())}],lang})});
        if(!r.ok)throw new Error("proxy fail");
        const d=await r.json();if(d.error)throw new Error(d.error);
        tx=d.text;inputTokens=d.inputTokens||0;outputTokens=d.outputTokens||0;
      }
      const ps=JSON.parse(tx.replace(/```json\s?|```/g,"").trim());
      if(!ps.titel||!ps.stappen)throw new Error("bad");
      const isAltruistic=ps.altruistic===true;
      if(isAltruistic)setLoadingAltruistic(true);
      setSteps(ps);
      if(!valid)deductCredit();
      setUsage(prev=>{const next={calls:prev.calls+1,inputTokens:prev.inputTokens+inputTokens,outputTokens:prev.outputTokens+outputTokens,costUsd:prev.costUsd+calcCost(inputTokens,outputTokens)};ls.set(KEYS.usage,JSON.stringify(next));return next;});
      const trimmed=inp.trim();
      setRecents(prev=>{const next=[trimmed,...prev.filter(r=>r!==trimmed)].slice(0,5);ls.set(KEYS.recents,JSON.stringify(next));return next;});
      fetch("/api/suggestions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,text:trimmed})})
        .then(r=>r.ok?r.json():null)
        .then(()=>fetch("/api/suggestions?lang="+lang).then(r=>r.ok?r.json():null).then(d=>{if(d?.suggestions)setGlobalSugg(d.suggestions);}))
        .catch(()=>{});
      const comp=ps.stappen.map(()=>false);
      const entry={id:Date.now(),timestamp:new Date().toISOString(),timezone:zone,behoefte:inp.trim(),resultaat:ps,lang,completed:comp,isAltruistic,altruismBonusClaimed:false};
      const navigate=()=>{
        if(auth==="in"){const nh=[entry,...hist];setHist(nh);ls.set(eKey(userRef.current),JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        else{const nh=[entry,...hist].slice(0,10);setHist(nh);ls.set(KEYS.guestHist,JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        // Show altruism popup after a short delay so result view renders first
        if(isAltruistic){setTimeout(()=>setAltruismPopup(true),600);}
        utrack("goal_result",{lang,isAltruistic,steps:ps.stappen?.length||0});
      };
      if(isAltruistic){setTimeout(navigate,1800);}else{navigate();}
    }catch(e){setErr(t.err);setVw(auth==="in"?"new_goal":"home");}finally{setBusy(false);}
  };

  const submitWoop=async()=>{
    if(!woopData.wish.trim()||!woopData.outcome.trim()||!woopData.obstacle.trim()||!woopData.plan.trim()||busy)return;
    if(honeypot)return;
    const {valid}=getCredential();
    if(!valid){
      if(credits<=0){setVw("no_credits");return;}
    }
    setBusy(true);setErr(null);setSteps(null);setVw("loading");setLoadingAltruistic(false);
    utrack("woop_submitted",{lang,mode:valid?"byok":"free"});
    try{
      let tx,inputTokens,outputTokens;
      const msgContent=promptWoop(woopData);
      if(valid){
        const r=await callAPI([{role:"user",content:msgContent}],1200);
        tx=r.text;inputTokens=r.inputTokens;outputTokens=r.outputTokens;
      }else{
        const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages:[{role:"user",content:msgContent}],lang})});
        if(!r.ok)throw new Error("proxy fail");
        const d=await r.json();if(d.error)throw new Error(d.error);
        tx=d.text;inputTokens=d.inputTokens||0;outputTokens=d.outputTokens||0;
      }
      const ps=JSON.parse(tx.replace(/```json\s?|```/g,"").trim());
      if(!ps.titel||!ps.stappen)throw new Error("bad");
      const isAltruistic=ps.altruistic===true;
      if(isAltruistic)setLoadingAltruistic(true);
      setSteps(ps);
      if(!valid)deductCredit();
      setUsage(prev=>{const next={calls:prev.calls+1,inputTokens:prev.inputTokens+inputTokens,outputTokens:prev.outputTokens+outputTokens,costUsd:prev.costUsd+calcCost(inputTokens,outputTokens)};ls.set(KEYS.usage,JSON.stringify(next));return next;});
      const comp=ps.stappen.map(()=>false);
      const woop={wish:woopData.wish.trim(),outcome:woopData.outcome.trim(),obstacle:woopData.obstacle.trim(),plan:woopData.plan.trim()};
      const entry={id:Date.now(),timestamp:new Date().toISOString(),timezone:zone,behoefte:woop.wish,resultaat:ps,lang,completed:comp,isAltruistic,altruismBonusClaimed:false,woop};
      const navigate=()=>{
        if(auth==="in"){const nh=[entry,...hist];setHist(nh);ls.set(eKey(userRef.current),JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        else{const nh=[entry,...hist].slice(0,10);setHist(nh);ls.set(KEYS.guestHist,JSON.stringify(nh));setActiveId(entry.id);setLocalComp(comp);setVw("result");}
        if(isAltruistic){setTimeout(()=>setAltruismPopup(true),600);}
        utrack("woop_result",{lang,isAltruistic,steps:ps.stappen?.length||0});
      };
      // Reset woop state for next use
      setWoopData({wish:"",outcome:"",obstacle:"",plan:""});setWoopStep(0);
      if(isAltruistic){setTimeout(navigate,1800);}else{navigate();}
    }catch(e){setErr(t.err);setVw("woop_input");}finally{setBusy(false);}
  };

  const toggleStep=(idx)=>{
    setLocalComp(prev=>{
      const next=[...prev];next[idx]=!next[idx];
      const allDone=next.every(Boolean)&&next.length>0;
      if(allDone){
        utrack("goal_completed",{lang});
        setCelebOpen(true);
        const fire=(opts)=>confetti({particleCount:80,spread:70,origin:{y:0.6},...opts});
        setTimeout(()=>fire({colors:["#facc15","#a3e635","#38bdf8","#f472b6","#fb923c"]}),0);
        setTimeout(()=>fire({colors:["#facc15","#a3e635","#38bdf8"],angle:60,origin:{x:0,y:0.65}}),200);
        setTimeout(()=>fire({colors:["#f472b6","#fb923c","#c084fc"],angle:120,origin:{x:1,y:0.65}}),400);
      }
      // Save updated completion state only (bonus awarded on goHome)
      const updateHist=(ph)=>ph.map(h=>h.id!==activeId?h:{...h,completed:next});
      if(activeId&&auth==="in"){setHist(ph=>{const nh=updateHist(ph);ls.set(eKey(userRef.current),JSON.stringify(nh));return nh;});}
      else if(activeId){setHist(ph=>{const nh=updateHist(ph);ls.set(KEYS.guestHist,JSON.stringify(nh));return nh;});}
      return next;
    });
  };

  // Stripe top-up
  const startTopUp=async()=>{
    if(topUpBusy)return;
    setTopUpBusy(true);
    utrack("topup_started");
    try{
      const ref=clientRef||ls.get(KEYS.clientRef);
      const r=await fetch("/api/stripe/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clientRef:ref})});
      const d=await r.json();
      if(d.url){window.location.href=d.url;}
      else{setTopUpMsg("error");}
    }catch{setTopUpMsg("error");}
    setTopUpBusy(false);
  };

  const openEntry=(entry)=>{setSteps(entry.resultaat);setActiveId(entry.id);setLocalComp(entry.completed||entry.resultaat.stappen.map(()=>false));setShareOpen(false);setVw("result");};
  const del=(id)=>{const nh=hist.filter(h=>h.id!==id);setHist(nh);if(auth==="in")ls.set(eKey(userRef.current),JSON.stringify(nh));else ls.set(KEYS.guestHist,JSON.stringify(nh));};
  const clrAll=()=>{setHist([]);if(auth==="in")ls.set(eKey(userRef.current),"[]");else ls.set(KEYS.guestHist,"[]");};
  const goHome=()=>{
    // Check if returning from a completed altruistic goal that hasn't been rewarded yet
    if(activeId){
      const entry=hist.find(h=>h.id===activeId);
      const allDone=localComp.length>0&&localComp.every(Boolean);
      if(entry&&entry.isAltruistic&&!entry.altruismBonusClaimed&&allDone){
        const lastBonus=parseInt(ls.get(KEYS.altruismBonusTs)||"0",10);
        const canClaim=(Date.now()-lastBonus)>=24*60*60*1000;
        if(canClaim){
          addCredits(ALTRUISM_BONUS_CREDITS);
          ls.set(KEYS.altruismBonusTs,String(Date.now()));
          utrack("altruism_bonus_earned",{credits:ALTRUISM_BONUS_CREDITS});
          setTimeout(()=>setAltruismBonusPopup(true),300);
        }
        const markClaimed=(ph)=>ph.map(h=>h.id===activeId?{...h,altruismBonusClaimed:true}:h);
        if(auth==="in"){setHist(ph=>{const nh=markClaimed(ph);ls.set(eKey(userRef.current),JSON.stringify(nh));return nh;});}
        else{setHist(ph=>{const nh=markClaimed(ph);ls.set(KEYS.guestHist,JSON.stringify(nh));return nh;});}
      }
    }
    setInp("");setSteps(null);setErr(null);setActiveId(null);setLocalComp([]);setShareOpen(false);setVw(auth==="in"?"dash":"home");
  };
  const prog=(e)=>{const tt=e.resultaat?.stappen?.length||0;const dn=(e.completed||[]).filter(Boolean).length;return{dn,tt,pct:tt>0?Math.round(dn/tt*100):0};};

  const delRecent=(text)=>{
    setRecents(prev=>{const next=prev.filter(r=>r!==text);ls.set(KEYS.recents,JSON.stringify(next));return next;});
  };
  const delGlobal=(text)=>{
    setGlobalSugg(prev=>prev.filter(s=>s!==text));
    fetch("/api/suggestions",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({lang,text})}).catch(()=>{});
  };

  const SuggChips=()=>{
    const localSet=new Set(recents.map(r=>r.toLowerCase()));
    const globals=globalSugg.filter(s=>!localSet.has(s.toLowerCase())).slice(0,4);
    const altPool=(t.altruisticSugg||[]).filter(s=>!localSet.has(s.toLowerCase())&&!dismissedAlts.includes(s));
    // Cycle 2 altruistic picks using altOffset so each open shows different ones
    const altPick=altPool.length===0?[]:altPool.length<=2?altPool:[altPool[altOffset%altPool.length],altPool[(altOffset+1)%altPool.length]];
    const interleaved=[];
    let gi=0,ai=0;
    while((gi<globals.length||ai<altPick.length)&&interleaved.length<4){
      if(gi<globals.length)interleaved.push({text:globals[gi++],kind:"global"});
      if(ai<altPick.length&&interleaved.length<4)interleaved.push({text:altPick[ai++],kind:"alt"});
    }
    if(recents.length===0&&interleaved.length===0)return null;
    const pick=(text)=>{setInp(text);setSuggOpen(false);};
    const toggle=()=>{setSuggOpen(o=>{if(!o)setAltOffset(n=>n+2);return!o;});};
    const chipRow={display:"flex",alignItems:"center",width:"100%",overflow:"hidden"};
    const delBtn=(onClick)=><button onClick={(e)=>{e.stopPropagation();onClick();}} style={{flexShrink:0,background:"none",border:"none",padding:"10px 14px",color:c.tm,cursor:"pointer",fontSize:16,opacity:0.5,lineHeight:1}} title="Remove">×</button>;
    return(
      <div style={{marginTop:10,border:"1px solid "+c.cb,borderRadius:10,overflow:"hidden"}}>
        <button onClick={toggle} style={{width:"100%",background:c.sb,border:"none",borderBottom:suggOpen?"1px solid "+c.cb:"none",padding:"8px 12px",textAlign:"left",fontSize:12,fontWeight:600,color:c.tf,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span>{t.suggLabel||"💡 Pick a suggestion"}</span>
          <span style={{fontSize:10,opacity:0.6}}>{suggOpen?"▲":"▼"}</span>
        </button>
        {suggOpen&&<div style={{display:"flex",flexDirection:"column",gap:0}}>
          {recents.map((r,i)=>(
            <div key={"l"+i} style={{...chipRow,borderTop:i>0?"1px solid "+c.cb:"none",background:c.ab}}>
              <button onClick={()=>pick(r)} style={{flex:1,background:"none",border:"none",padding:"9px 12px",color:c.ac,cursor:"pointer",fontSize:13,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r}</button>
              {delBtn(()=>delRecent(r))}
            </div>
          ))}
          {interleaved.map((s,i)=>(
            <div key={"m"+i} style={{...chipRow,borderTop:(recents.length>0||i>0)?"1px solid "+c.cb:"none",background:s.kind==="alt"?"rgba(251,191,36,0.06)":"transparent"}}>
              <button onClick={()=>pick(s.text)} style={{flex:1,background:"none",border:"none",padding:"9px 12px",color:s.kind==="alt"?c.ac:c.tm,cursor:"pointer",fontSize:13,textAlign:"left",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.kind==="alt"?"💛 ":"💡 "}{s.text}</button>
              {s.kind==="global"&&delBtn(()=>delGlobal(s.text))}
              {s.kind==="alt"&&delBtn(()=>setDismissedAlts(d=>[...d,s.text]))}
            </div>
          ))}
        </div>}
      </div>
    );
  };

  // Build plain-text share message from current steps
  const buildShareText=(ps)=>{
    if(!ps)return'';
    const lines=[t.shareMsg||'Check out my action plan on untangle.lol:','',ps.titel,''];
    (ps.stappen||[]).forEach((s,i)=>{lines.push((i+1)+'. '+s.actie);lines.push('   '+s.toelichting);lines.push('');});
    lines.push('https://untangle.lol');
    return lines.join('\n').trim();
  };

  const doShare=async(ps)=>{
    const text=buildShareText(ps);
    if(navigator.share){
      try{await navigator.share({title:ps.titel,text});utrack('share_native');return;}catch(e){if(e.name==='AbortError')return;}
    }
    setShareOpen(o=>!o);
    setShareCopied(false);
    utrack('share_open');
  };

  const copyShareText=(text)=>{
    const doIt=()=>{
      if(navigator.clipboard){
        navigator.clipboard.writeText(text).catch(()=>{});
      }else{
        const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.appendChild(ta);ta.focus();ta.select();try{document.execCommand('copy');}catch{}document.body.removeChild(ta);
      }
      setShareCopied(true);
      setTimeout(()=>setShareCopied(false),2000);
      utrack('share_copy');
    };
    doIt();
  };

  // Honeypot field — visually hidden, bots fill it
  const HoneypotField=()=>(
    <div style={{position:"absolute",left:"-9999px",top:"-9999px",width:1,height:1,overflow:"hidden"}} aria-hidden="true">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e=>setHoneypot(e.target.value)}/>
    </div>
  );

  const sx={
    pg:{minHeight:"100dvh",height:"100dvh",background:c.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"12px 20px",paddingTop:"calc(48px + env(safe-area-inset-top))",paddingBottom:"calc(68px + env(safe-area-inset-bottom))",fontFamily:"'Inter',-apple-system,sans-serif",transition:"background 0.4s",overflowY:"auto"},
    w:{width:"100%",maxWidth:540,flex:1,display:"flex",flexDirection:"column",justifyContent:"center"},
    cd:{background:c.card,borderRadius:16,padding:24,border:"1px solid "+c.cb,boxShadow:c.sh,transition:"all 0.3s"},
    ip:{width:"100%",background:c.ib,border:"2px solid "+c.ibr,borderRadius:10,padding:"13px 16px",color:c.tx,fontSize:16,outline:"none",boxSizing:"border-box"},
    bo:{width:"100%",marginTop:14,padding:"13px 20px",background:c.ag,color:c.bt,border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer"},
    bd:{width:"100%",marginTop:14,padding:"13px 20px",background:c.am,color:c.tm,border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"not-allowed"},
    bg:{width:"100%",marginTop:12,padding:"12px 20px",background:c.ghb,color:c.tm,border:"1px solid "+c.ghr,borderRadius:10,fontSize:14,fontWeight:500,cursor:"pointer"},
    note:{fontSize:12,color:c.tf,marginTop:8,textAlign:"center"},
    err:{marginTop:10,padding:"10px 14px",background:c.eb,borderRadius:8,color:c.et,fontSize:13},
    stripe:{width:"100%",marginTop:10,padding:"13px 20px",background:"linear-gradient(135deg,#6772e5,#4f46e5)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8},
  };

  const Bar=()=>(
    <div dir={dir} style={{position:"fixed",top:0,left:0,right:0,zIndex:100,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 20px",paddingTop:"calc(8px + env(safe-area-inset-top))",background:rt==="dark"?"rgba(15,23,42,0.92)":"rgba(248,250,252,0.92)",backdropFilter:"blur(12px)",borderBottom:"1px solid "+c.cb}}>
      <button onClick={()=>setVw("lang")} style={{background:"none",border:"none",color:c.tf,fontSize:12,cursor:"pointer",padding:0,flexShrink:0}}>🌍 {t.lSel}</button>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        {user&&(
          <button onClick={()=>setVw("manage_auth")} style={{background:"none",border:"none",padding:0,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
            {user.picture
              ?<img src={user.picture} alt={user.name||""} referrerPolicy="no-referrer" style={{width:26,height:26,borderRadius:"50%",border:"1px solid "+c.cb,flexShrink:0}}/>
              :<div style={{width:26,height:26,borderRadius:"50%",background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13}}>👤</div>
            }
          </button>
        )}
        <TTog mode={tm} set={chTm} c={c}/>
      </div>
    </div>
  );

  const BottomBar=()=>{
    const {key}=getCredential();
    const showCredits=!key&&credits!==undefined;
    const low=showCredits&&credits<=3;
    return(
    <div dir={dir} style={{position:"fixed",bottom:0,left:0,right:0,paddingBottom:"env(safe-area-inset-bottom)",background:rt==="dark"?"rgba(15,23,42,0.92)":"rgba(248,250,252,0.92)",backdropFilter:"blur(12px)",borderTop:"1px solid "+c.cb,display:"flex",flexDirection:"column",alignItems:"center",zIndex:100}}>
      <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center",padding:"8px 20px",width:"100%",boxSizing:"border-box",flexWrap:"wrap"}}>
        <AuthBadge c={c} onManage={()=>setVw("manage_auth")} t={t}/>
        {showCredits&&(
          <button onClick={()=>setVw("manage_auth")} style={{display:"flex",alignItems:"center",gap:5,background:low?"rgba(239,68,68,0.1)":c.ab,border:"1px solid "+(low?"rgba(239,68,68,0.35)":c.abr),borderRadius:20,padding:"4px 10px",cursor:"pointer",fontSize:12,color:low?"#ef4444":c.ac,fontWeight:low?700:400,whiteSpace:"nowrap"}}>
            🪙 <span>{credits}</span><span style={{opacity:0.7}}>{" "}{t.cred}</span>
          </button>
        )}
        {topUpMsg==="pending"&&<span style={{fontSize:11,color:c.tm,animation:"pulse 1s infinite"}}>{t.topUpPending}</span>}
      </div>
      <div style={{display:"flex",gap:16,justifyContent:"center",paddingBottom:6}}>
        <a href={"/terms?lang="+(lang||"en")} target="_blank" rel="noreferrer" style={{fontSize:10,color:c.tf,textDecoration:"none"}}>{t.terms||"Terms"}</a>
        <a href={"/privacy?lang="+(lang||"en")} target="_blank" rel="noreferrer" style={{fontSize:10,color:c.tf,textDecoration:"none"}}>{t.privacy||"Privacy"}</a>
        <a href="https://stats.fabrikage.nl/share/AE078t90MeCuVl4I" target="_blank" rel="noreferrer" style={{fontSize:10,color:c.tf,textDecoration:"none"}}>{t.stats||"Stats"}</a>
        <a href="https://bunq.me/BachSoftware" target="_blank" rel="noreferrer" style={{fontSize:10,color:c.ac,textDecoration:"none",fontWeight:500}}>{t.donate||"❤️ Donate"}</a>
      </div>
    </div>
  );};

  const Err=()=>err?(<div style={sx.err}>{err}</div>):null;

  const cyclePh=(()=>{const ps_=t.phSugg||[];const as_=t.altruisticSugg||[];const pool=[];for(let i=0;i<Math.max(ps_.length,as_.length);i++){if(i<ps_.length)pool.push(ps_[i]);if(i<as_.length)pool.push(as_[i]);}return pool.length>0?pool[heroSIdx%pool.length]:t.ph;})();

  if(!ready)return (<div style={{minHeight:"100dvh",background:c.bg}}><style>{GS}</style></div>);

  return(<>
    {/* ── Persistent top bar ── */}
    {ready&&<Bar/>}

    {/* ── Altruism Announcement Popup ── */}
    {altruismPopup&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12}}>💛</div>
          <h2 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"0 0 10px"}}>{t.altruismPopupTitle}</h2>
          <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:"0 0 20px"}}>{canEarnAltruismBonus?t.altruismPopupMsg:t.altruismPopupMsgRepeat}</p>
          <button onClick={()=>setAltruismPopup(false)} style={{...sx.bo,marginTop:0,background:"linear-gradient(135deg,#f59e0b,#d97706)"}}>{t.altruismPopupBtn}</button>
        </div>
      </Modal>
    )}

    {/* ── Altruism Bonus Earned Popup ── */}
    {altruismBonusPopup&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12,animation:"pop 0.5s ease"}}>🎁</div>
          <h2 style={{fontSize:20,fontWeight:700,color:c.gr,margin:"0 0 10px"}}>{t.altruismBonusTitle}</h2>
          <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:"0 0 20px"}}>{t.altruismBonusMsg}</p>
          <div style={{fontSize:32,fontWeight:800,color:c.gr,margin:"0 0 16px"}}>+{ALTRUISM_BONUS_CREDITS}</div>
          <button onClick={()=>setAltruismBonusPopup(false)} style={{...sx.bo,marginTop:0,background:c.ag}}>{t.altruismBonusBtn}</button>
        </div>
      </Modal>
    )}

    {/* ── Top-up Success Popup ── */}
    {topUpPopup&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:52,marginBottom:12,animation:"pop 0.5s ease"}}>✅</div>
          <h2 style={{fontSize:20,fontWeight:700,color:c.gr,margin:"0 0 10px"}}>{t.topUpPopupTitle}</h2>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,margin:"0 0 16px"}}>
            <span style={{fontSize:36,fontWeight:800,color:c.gr}}>+{topUpPopup.credits}</span>
            <span style={{fontSize:16,color:c.tm,fontWeight:500}}>{t.cred}</span>
          </div>
          <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:"0 0 20px"}}>{t.topUpPopupMsg}</p>
          <button onClick={()=>setTopUpPopup(null)} style={{...sx.bo,marginTop:0,background:c.ag}}>{t.topUpPopupBtn}</button>
        </div>
      </Modal>
    )}

    {/* ── Celebration Popup ── */}
    {celebOpen&&(
      <Modal c={c}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:64,marginBottom:12,animation:"pop 0.5s ease",lineHeight:1}}>🏆</div>
          <h2 style={{fontSize:22,fontWeight:800,color:c.gr,margin:"0 0 10px"}}>{t.celebTitle}</h2>
          <p style={{fontSize:15,color:c.tm,lineHeight:1.6,margin:"0 0 24px"}}>{t.celebMsg}</p>
          <button onClick={()=>setCelebOpen(false)} style={{...sx.bo,marginTop:0,background:c.ag}}>{t.celebBtn}</button>
        </div>
      </Modal>
    )}

    {vw==="lang"&&(
      <div style={{...sx.pg,direction:"ltr"}}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:28}}><BrandMark c={c} size="large"/><p style={{color:c.tm,fontSize:14,marginTop:10}}>{t.chooseLang}</p></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {LANGS.map(l=>(
            <button key={l.code} onClick={()=>pickLang(l.code)} style={{...sx.cd,padding:"16px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c.abr;e.currentTarget.style.transform="scale(1.02)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=c.cb;e.currentTarget.style.transform="scale(1)";}}>
              <span style={{fontSize:28}}>{l.flag}</span><span style={{color:c.tx,fontSize:15,fontWeight:500}}>{l.label}</span>
            </button>))}
        </div>
        {auth!=="in"&&(
          <div style={{marginTop:20,textAlign:"center"}}>
            <p style={{fontSize:12,color:c.tf,marginBottom:10}}>{t.signInSub}</p>
            <a href="/api/auth/google" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"10px 20px",background:c.card,border:"1px solid "+c.cb,borderRadius:10,fontSize:14,fontWeight:600,color:c.tx,textDecoration:"none",boxShadow:c.sh}}>
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              {t.signIn}
            </a>
          </div>
        )}
        <p style={{fontSize:11,color:c.tf,textAlign:"center",marginTop:24,lineHeight:1.5}}>
          {t.analyticsNote}{" "}
          <a href={"/privacy?lang="+(lang||"en")} target="_blank" rel="noreferrer" style={{color:c.tf,textDecoration:"underline"}}>{t.privacy}</a>
        </p>
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="byok"&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c}/><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"8px 0 0"}}>{t.byokH1}</h1></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div style={{...sx.cd,padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:c.tx,marginBottom:6}}>{t.byokAnthTitle}</div>
            <div style={{fontSize:12,color:c.tm,lineHeight:1.5,marginBottom:8}}>{t.byokAnthDesc} <code style={{background:c.cb,borderRadius:4,padding:"1px 5px",color:c.ac,fontSize:11}}>sk-ant-</code></div>
            <ol style={{margin:0,padding:"0 0 0 16px",fontSize:12,color:c.tm,lineHeight:1.8}}>
              <li>{t.byokAnthS1}</li><li>{t.byokAnthS2}</li><li>{t.byokAnthS3}</li>
            </ol>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{display:"block",marginTop:10,fontSize:12,color:c.ac,fontWeight:600}}>{t.byokAnthLink}</a>
          </div>
          <div style={{...sx.cd,padding:"14px 16px"}}>
            <div style={{fontSize:13,fontWeight:700,color:c.tx,marginBottom:6}}>{t.byokOrTitle}</div>
            <div style={{fontSize:12,color:c.tm,lineHeight:1.5,marginBottom:8}}>{t.byokOrDesc} <code style={{background:c.cb,borderRadius:4,padding:"1px 5px",color:c.ac,fontSize:11}}>sk-or-</code></div>
            <ol style={{margin:0,padding:"0 0 0 16px",fontSize:12,color:c.tm,lineHeight:1.8}}>
              <li>{t.byokOrS1}</li><li>{t.byokOrS2}</li><li>{t.byokOrS3}</li>
            </ol>
            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{display:"block",marginTop:10,fontSize:12,color:c.ac,fontWeight:600}}>{t.byokOrLink}</a>
          </div>
        </div>
        <div style={sx.cd}>
          <input type="password" value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveApiKey()} placeholder={t.byokPh} style={sx.ip} autoFocus/>
          {apiKeyErr&&<div style={sx.err}>{apiKeyErr}</div>}
          <p style={sx.note}>{t.byokNote}</p>
          <button onClick={saveApiKey} disabled={busy||!apiKeyInput.trim()} style={!apiKeyInput.trim()||busy?sx.bd:sx.bo}>{busy?t.checking:t.byokSave}</button>
          <button onClick={()=>setVw(lang?"home":"lang")} style={sx.bg}>{t.back}</button>
        </div>
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="no_credits"&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c}/></div>
        <div style={{...sx.cd,textAlign:"center",padding:"32px 24px"}}>
          <div style={{fontSize:48,marginBottom:12}}>🪙</div>
          <h2 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"0 0 8px"}}>{t.credOut}</h2>
          <p style={{fontSize:14,color:c.tm,lineHeight:1.6,margin:"0 0 20px"}}>{t.credOutMsg}</p>
          <button onClick={startTopUp} disabled={topUpBusy} style={sx.stripe}>
            💳 {topUpBusy?"...":t.topUpBtn} <span style={{opacity:0.7,fontSize:12}}>({t.topUpDesc})</span>
          </button>
          <button onClick={()=>setVw("byok")} style={sx.bo}>{t.credByok}</button>
          <button onClick={()=>setVw(auth==="in"?"dash":"home")} style={sx.bg}>{t.back}</button>
        </div>
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="manage_auth"&&(()=>{
      const {key,provider}=getCredential();
      const providerLabel=provider==="openrouter"?"OpenRouter":"Anthropic";
      const resetUsage=()=>{const z={calls:0,inputTokens:0,outputTokens:0,costUsd:0};setUsage(z);ls.del(KEYS.usage);};
      return(
        <div dir={dir} style={sx.pg}><div style={sx.w}>
          <div style={{textAlign:"center",marginBottom:24}}><BrandMark c={c}/><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"8px 0 0"}}>{t.chAuth}</h1></div>
          <div style={sx.cd}>
            {/* Google profile card or sign-in */}
            {auth==="in"&&user?(
              <div style={{padding:"16px",background:c.sb,border:"1px solid "+c.sr,borderRadius:12,marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
                {user.picture&&<img src={user.picture} alt={user.name||""} referrerPolicy="no-referrer" style={{width:44,height:44,borderRadius:"50%",border:"1px solid "+c.cb,flexShrink:0}}/>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:c.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
                  <div style={{fontSize:12,color:c.tm,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
                </div>
                <button onClick={logout} style={{background:"none",border:"1px solid rgba(239,68,68,0.3)",borderRadius:8,padding:"6px 10px",color:"#ef4444",fontSize:12,cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>{t.signOut||t.out}</button>
              </div>
            ):(
              <div style={{padding:"14px 16px",background:c.sb,border:"1px solid "+c.sr,borderRadius:12,marginBottom:12,textAlign:"center"}}>
                <p style={{fontSize:12,color:c.tf,margin:"0 0 10px"}}>{t.signInSub}</p>
                <a href="/api/auth/google" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"10px 18px",background:c.card,border:"1px solid "+c.cb,borderRadius:10,fontSize:13,fontWeight:600,color:c.tx,textDecoration:"none"}}>
                  <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
                  {t.signIn}
                </a>
              </div>
            )}
            {/* Credits balance */}
            {!key&&<div style={{padding:"16px",background:c.hp,border:"1px solid "+c.hpr,borderRadius:12,marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{fontSize:12,color:c.tm,fontWeight:500,marginBottom:4}}>🪙 {t.credFree}</div>
                  <div style={{fontSize:28,fontWeight:800,color:credits<=3?"#ef4444":c.tx,lineHeight:1}}>{credits}</div>
                  <div style={{fontSize:11,color:c.tf,marginTop:2}}>{t.cred}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:11,color:c.tm,marginBottom:8}}>{t.topUpDesc}</div>
                  <button onClick={startTopUp} disabled={topUpBusy} style={{...sx.stripe,width:"auto",marginTop:0,padding:"9px 14px",fontSize:13}}>
                    💳 {topUpBusy?"...":t.topUpBtn}
                  </button>
                </div>
              </div>
            </div>}
            {key&&<div style={{padding:"14px 16px",background:c.ab,borderRadius:10,marginBottom:12}}>
              <div style={{fontSize:13,color:c.tm,marginBottom:4}}>{t.apiKeyBadge} · <span style={{fontWeight:600,color:c.ac}}>{providerLabel}</span></div>
              <div style={{fontSize:14,fontWeight:500,color:c.ac,fontFamily:"monospace"}}>{key.slice(0,14)}…</div>
            </div>}
            {/* Usage stats */}
            <div style={{padding:"14px 16px",background:c.sb,border:"1px solid "+c.sr,borderRadius:10,marginBottom:12}}>
              <div style={{fontSize:13,fontWeight:600,color:c.tm,marginBottom:10}}>{t.usageStat}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div style={{background:c.card,borderRadius:8,padding:"10px 12px",border:"1px solid "+c.cb}}>
                  <div style={{fontSize:11,color:c.tf,marginBottom:2}}>{t.apiCalls}</div>
                  <div style={{fontSize:20,fontWeight:700,color:c.tx}}>{usage.calls}</div>
                </div>
                <div style={{background:c.card,borderRadius:8,padding:"10px 12px",border:"1px solid "+c.cb}}>
                  <div style={{fontSize:11,color:c.tf,marginBottom:2}}>{t.estCost}</div>
                  <div style={{fontSize:20,fontWeight:700,color:c.ac}}>{fmtCost(usage.costUsd)}</div>
                </div>
                <div style={{background:c.card,borderRadius:8,padding:"10px 12px",border:"1px solid "+c.cb}}>
                  <div style={{fontSize:11,color:c.tf,marginBottom:2}}>{t.inputTok}</div>
                  <div style={{fontSize:16,fontWeight:600,color:c.tx}}>{usage.inputTokens.toLocaleString()}</div>
                </div>
                <div style={{background:c.card,borderRadius:8,padding:"10px 12px",border:"1px solid "+c.cb}}>
                  <div style={{fontSize:11,color:c.tf,marginBottom:2}}>{t.outputTok}</div>
                  <div style={{fontSize:16,fontWeight:600,color:c.tx}}>{usage.outputTokens.toLocaleString()}</div>
                </div>
              </div>
              <button onClick={resetUsage} style={{...sx.bg,marginTop:10,fontSize:12,padding:"8px 14px"}}>{t.resetStats}</button>
            </div>
            <button onClick={()=>setVw("byok")} style={sx.bo}>{t.apiKeyBadge}</button>
            <button onClick={removeAuth} style={{...sx.bg,color:"#ef4444",borderColor:"rgba(239,68,68,0.3)",marginTop:12}}>{t.rmKey}</button>
            <button onClick={()=>setVw(auth==="in"?"dash":"home")} style={sx.bg}>{t.back}</button>
          </div>
        <BottomBar/><style>{GS}</style></div></div>
      );
    })()}

    {vw==="loading"&&(<div dir={dir} style={sx.pg}><div style={sx.w}><div style={{textAlign:"center",marginBottom:24}}><BrandMark c={c}/></div><div style={sx.cd}><Loader c={c} lp={t.lp}/>{loadingAltruistic&&<div style={{marginTop:16,padding:"10px 16px",borderRadius:12,background:c.am,border:`1px solid ${c.abr}`,color:c.ac,fontSize:14,fontWeight:600,textAlign:"center",animation:"fadeIn 0.5s ease forwards"}}>{t.altruismLoadingMsg}</div>}</div><BottomBar/><style>{GS}</style></div></div>)}

    {(vw==="home"||vw==="new_goal")&&auth!=="in"&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c} size="large"/><h1 style={{fontSize:26,fontWeight:700,color:c.tx,margin:"10px 0 0"}}>{t.hero}</h1><p key={heroSIdx} style={{color:c.tm,fontSize:14,marginTop:4,animation:"heroFade 3s ease forwards",minHeight:"1.4em"}}>{(t.heroS||[])[heroSIdx%((t.heroS||[]).length||1)]||""}</p></div>
        <div style={{...sx.cd,position:"relative"}}>
          <HoneypotField/>
          <div style={{marginBottom:12,padding:"8px 12px",borderRadius:10,background:c.ab,border:"1px solid "+c.abr}}><span style={{fontSize:12,color:c.ac}}>{canEarnAltruismBonus?t.altruismTeaser:t.altruismPopupMsgRepeat}</span></div>
          <label style={{display:"block",fontSize:13,fontWeight:600,color:c.tm,marginBottom:8,letterSpacing:"0.02em"}}>{t.hero}</label>
          <div className={"ta-glow"+(taFocused?" ta-glow-focused":"")} style={{"--ta-tc":rt==="dark"?"rgba(255,255,255,0.12)":"rgba(180,120,0,0.25)","position":"relative"}}>            <textarea value={inp} onChange={e=>setInp(e.target.value)} onFocus={()=>setTaFocused(true)} onBlur={()=>{setTaFocused(false);setTaClearConfirm(false);}} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} placeholder={cyclePh} rows={4} style={{...sx.ip,resize:"none",lineHeight:1.6,background:rt==="dark"?"#162032":"#ffffff",border:"none",paddingRight:inp.trim()?"36px":undefined}}/>
            {inp.trim()&&<button onMouseDown={e=>{e.preventDefault();handleTaClear();}} title={t.rmTip} style={{position:"absolute",top:"50%",right:8,transform:"translateY(-50%)",zIndex:2,background:taClearConfirm?"rgba(239,68,68,0.12)":"transparent",border:"1px solid "+(taClearConfirm?"rgba(239,68,68,0.35)":"transparent"),borderRadius:6,color:taClearConfirm?"#ef4444":c.tf,fontSize:taClearConfirm?11:16,fontWeight:600,width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.18s",lineHeight:1,opacity:taFocused||taClearConfirm?1:0.4}}>{taClearConfirm?(t.taClrConfirm||"clear?"):"×"}</button>}
          </div>
          <SuggChips/>
          <button onClick={submit} disabled={busy||!inp.trim()} style={busy||!inp.trim()?sx.bd:sx.bo}>{t.go}</button>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,marginBottom:10}}>
            <div style={{flex:1,height:1,background:c.cb}}/>
            <span style={{fontSize:12,color:c.tf,fontWeight:500}}>{t.woopOr||"or"}</span>
            <div style={{flex:1,height:1,background:c.cb}}/>
          </div>
          <button onClick={()=>{setErr(null);setWoopData({wish:"",outcome:"",obstacle:"",plan:""});setWoopStep(0);setVw("woop_input");}} style={{...sx.bg,marginTop:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{t.woop||"🎯 Try WOOP"}</button>
          <Err/>
        </div>
        <div style={{textAlign:"center",marginTop:14,padding:"10px 16px",borderRadius:10,background:c.gb,border:"1px solid "+c.gbr}}><span style={{fontSize:12,color:c.gt}}>{t.eth}</span></div>
        {auth!=="in"&&(
          <div style={{marginTop:20,textAlign:"center"}}>
            <p style={{fontSize:12,color:c.tf,marginBottom:12}}>{t.signInSub}</p>
            <a href="/api/auth/google" style={{display:"inline-flex",alignItems:"center",gap:10,padding:"13px 28px",background:c.card,border:"1px solid "+c.cb,borderRadius:10,fontSize:13,fontWeight:600,color:c.tx,textDecoration:"none",boxShadow:c.sh}}>
              <svg width="16" height="16" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/><path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>
              {t.signIn}
            </a>
          </div>
        )}
        {hist.length>0&&<div style={{display:"flex",flexDirection:"column",gap:10,marginTop:16}}>
          {hist.map((h,i)=>{const p=prog(h);return(
            <div key={h.id} onClick={()=>openEntry(h)} style={{...sx.cd,padding:"14px 18px",cursor:"pointer",animation:"slideUp 0.3s ease "+Math.min(i*0.05,0.5)+"s both",borderColor:p.pct>=100?c.gbr:c.cb}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gr:c.abr}
              onMouseLeave={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gbr:c.cb}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:p.pct>=100?c.gr:c.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.pct>=100?"✅ ":""}{h.resultaat?.titel||h.behoefte}</div>
                  <div style={{fontSize:12,color:c.tf}}>{tAgo(h.timestamp,lang)} · {p.dn} {t.sOf} {p.tt}{h.isAltruistic&&" 💛"}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();del(h.id);}} style={{background:"none",border:"none",color:c.dm,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1}} onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=c.dm}>×</button>
              </div>
              <PBar done={p.dn} total={p.tt} c={c}/>
            </div>);})}
          {hist.length>3&&<button onClick={clrAll} style={{...sx.bg,marginTop:4,color:"#ef4444",borderColor:"rgba(239,68,68,0.2)"}}>{t.clr}</button>}
        </div>}
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="dash"&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c}/><h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"6px 0 0"}}>{t.dW} 👋</h1><p style={{color:c.tm,fontSize:13,marginTop:2}}>{t.dS}</p></div>
        <button onClick={()=>setVw("new_goal")} style={{...sx.bo,marginTop:0,marginBottom:16}}>{t.nG}</button>
        {hist.length===0?(<div style={{...sx.cd,textAlign:"center",padding:40}}><div style={{fontSize:40,marginBottom:10}}>🪢</div><p style={{color:c.tf,margin:0}}>{t.noG}</p></div>):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>{hist.map((h,i)=>{const p=prog(h);return(
            <div key={h.id} onClick={()=>openEntry(h)} style={{...sx.cd,padding:"14px 18px",cursor:"pointer",animation:"slideUp 0.3s ease "+Math.min(i*0.05,0.5)+"s both",borderColor:p.pct>=100?c.gbr:c.cb}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gr:c.abr}
              onMouseLeave={e=>e.currentTarget.style.borderColor=p.pct>=100?c.gbr:c.cb}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:10}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:600,color:p.pct>=100?c.gr:c.tx,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.pct>=100?"✅ ":""}{h.resultaat?.titel||h.behoefte}</div>
                  <div style={{fontSize:12,color:c.tf}}>{tAgo(h.timestamp,lang)} · {p.dn} {t.sOf} {p.tt}{h.isAltruistic&&" 💛"}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();del(h.id);}} style={{background:"none",border:"none",color:c.dm,cursor:"pointer",fontSize:18,padding:"2px 6px",lineHeight:1}} onMouseEnter={e=>e.target.style.color="#ef4444"} onMouseLeave={e=>e.target.style.color=c.dm}>×</button>
              </div>
              <PBar done={p.dn} total={p.tt} c={c}/>
            </div>);})}
            {hist.length>3&&<button onClick={clrAll} style={{...sx.bg,marginTop:4,color:"#ef4444",borderColor:"rgba(239,68,68,0.2)"}}>{t.clr}</button>}
          </div>
        )}<BottomBar/><style>{GS}</style></div></div>
    )}

    {vw==="new_goal"&&auth==="in"&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}>
        <div style={{textAlign:"center",marginBottom:20}}><BrandMark c={c}/><h1 style={{fontSize:22,fontWeight:700,color:c.tx,margin:"8px 0 0"}}>{t.hero}</h1><p key={heroSIdx} style={{color:c.tm,fontSize:13,marginTop:2,animation:"heroFade 3s ease forwards",minHeight:"1.3em"}}>{(t.heroS||[])[heroSIdx%((t.heroS||[]).length||1)]||""}</p></div>
        <div style={{...sx.cd,position:"relative"}}>
          <HoneypotField/>
          <label style={{display:"block",fontSize:13,fontWeight:600,color:c.tm,marginBottom:8,letterSpacing:"0.02em"}}>{t.hero}</label>
          <textarea value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}} placeholder={cyclePh} rows={4} style={{...sx.ip,resize:"none",lineHeight:1.6}}/>
          <SuggChips/>
          <button onClick={submit} disabled={busy||!inp.trim()} style={busy||!inp.trim()?sx.bd:sx.bo}>{t.go}</button>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10,marginBottom:10}}>
            <div style={{flex:1,height:1,background:c.cb}}/>
            <span style={{fontSize:12,color:c.tf,fontWeight:500}}>{t.woopOr||"or"}</span>
            <div style={{flex:1,height:1,background:c.cb}}/>
          </div>
          <button onClick={()=>{setErr(null);setWoopData({wish:"",outcome:"",obstacle:"",plan:""});setWoopStep(0);setVw("woop_input");}} style={{...sx.bg,marginTop:0,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>{t.woop||"🎯 Try WOOP"}</button>
          <Err/>
        </div>
        <button onClick={()=>setVw("dash")} style={sx.bg}>{t.back}</button>
      <BottomBar/><style>{GS}</style></div></div>
    )}

    {(vw==="result"||vw==="save_prompt")&&steps&&(()=>{
      const dn=localComp.filter(Boolean).length;const tt=steps.stappen.length;const all=tt>0&&dn===tt;
      const ae=hist.find(h=>h.id===activeId);
      const isAlt=ae?.isAltruistic&&!ae?.altruismBonusClaimed;
      return(
        <div dir={dir} style={sx.pg}><div style={sx.w}>
          <div style={{animation:"fadeIn 0.4s ease"}}>
            {/* Altruistic goal progress indicator */}
            {ae?.isAltruistic&&!ae?.altruismBonusClaimed&&(
              <div style={{marginBottom:10,padding:"10px 14px",borderRadius:10,background:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.3)",display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>💛</span>
                <span style={{fontSize:12,color:c.ac,fontWeight:500}}>{t.altruismPopupMsg}</span>
              </div>
            )}
            {ae?.isAltruistic&&ae?.altruismBonusClaimed&&(
              <div style={{marginBottom:10,padding:"10px 14px",borderRadius:10,background:c.gb,border:"1px solid "+c.gbr,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>🎁</span>
                <span style={{fontSize:12,color:c.gr,fontWeight:600}}>{t.altruismBonusTitle}</span>
              </div>
            )}
            <div style={sx.cd}>
              <h2 style={{fontSize:17,fontWeight:600,color:all?c.gr:c.ac,margin:"0 0 6px"}}>{all?"✅ ":""}{steps.titel}</h2>
              {ae?.timestamp&&<div style={{fontSize:12,color:c.tf,marginBottom:10}}>{fmtDate(ae.timestamp,ae.timezone||zone,ae.lang||lang)}</div>}
              <div style={{marginBottom:18}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:13,color:c.tm}}>{t.prog}</span><span style={{fontSize:13,color:all?c.gr:c.ac,fontWeight:600}}>{dn} {t.sOf} {tt}</span></div>
                <PBar done={dn} total={tt} c={c}/>
              </div>
              {all&&<div style={{textAlign:"center",padding:"10px 0 16px",fontSize:14,color:c.gr,fontWeight:600,animation:"pop 0.4s ease"}}>{t.allD}</div>}
              {/* WOOP summary card — collapsible, shown when entry was created via WOOP */}
              {ae?.woop&&(()=>{
                const wLabels=t.woopLabels||["Wish","Outcome","Obstacle","Plan"];
                const wKeys=["wish","outcome","obstacle","plan"];
                const wIcons=["🌟","✨","🧱","⚡"];
                return(
                  <details style={{marginBottom:14,borderRadius:10,border:"1px solid "+c.abr,overflow:"hidden"}}>
                    <summary style={{padding:"10px 14px",cursor:"pointer",background:c.ab,color:c.ac,fontSize:13,fontWeight:600,listStyle:"none",display:"flex",alignItems:"center",gap:6,userSelect:"none"}}>
                      🎯 {t.woopSummaryTitle||"Your WOOP"}
                    </summary>
                    <div style={{padding:"10px 14px",display:"flex",flexDirection:"column",gap:8,background:c.sb}}>
                      {wKeys.map((k,i)=>ae.woop[k]&&(
                        <div key={k} style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                          <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{wIcons[i]}</span>
                          <div>
                            <div style={{fontSize:11,fontWeight:700,color:c.tm,marginBottom:1,textTransform:"uppercase",letterSpacing:"0.05em"}}>{wLabels[i]}</div>
                            <div style={{fontSize:13,color:c.tx,lineHeight:1.5}}>{ae.woop[k]}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                );
              })()}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {steps.stappen.map((s,i)=>(
                  <CheckItem key={i} done={localComp[i]||false} label={s.actie} desc={s.toelichting} onToggle={activeId?()=>toggleStep(i):undefined} c={c}/>
                ))}
              </div>
            </div>
            <button onClick={goHome} style={sx.bg}>{t.resB}</button>
            <button onClick={()=>doShare(steps)} style={{...sx.bg,marginTop:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              {t.share||'Share'}
            </button>
            {shareOpen&&(()=>{
              const _text=buildShareText(steps);
              const _enc=encodeURIComponent(_text);
              const _url=encodeURIComponent('https://untangle.lol');
              return(
                <div style={{marginTop:8,padding:'14px 16px',background:c.sb,border:'1px solid '+c.sr,borderRadius:12}}>
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center',marginBottom:8}}>
                    {[
                      {id:'whatsapp',label:'WhatsApp',bg:'#25D366',href:'https://wa.me/?text='+_enc},
                      {id:'telegram',label:'Telegram',bg:'#229ED9',href:'https://t.me/share/url?url='+_url+'&text='+_enc},
                      {id:'x',label:'X',bg:'#000',href:'https://x.com/intent/tweet?text='+_enc},
                      {id:'facebook',label:'Facebook',bg:'#1877F2',href:'https://www.facebook.com/sharer/sharer.php?u='+_url+'&quote='+_enc},
                      {id:'viber',label:'Viber',bg:'#7360F2',href:'viber://forward?text='+_enc},
                      {id:'signal',label:'Signal',bg:'#3A76F0',href:'https://signal.me/#p/?message='+_enc},
                    ].map(p=>(
                      <a key={p.id} href={p.href} target="_blank" rel="noreferrer"
                        onClick={()=>utrack('share_platform',{platform:p.id})}
                        style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,textDecoration:'none',minWidth:48}}>
                        <div style={{width:42,height:42,borderRadius:10,background:p.bg,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18}}>
                          {p.id==='whatsapp'&&'💬'}
                          {p.id==='telegram'&&'✈️'}
                          {p.id==='x'&&'𝕏'}
                          {p.id==='facebook'&&'f'}
                          {p.id==='viber'&&'📳'}
                          {p.id==='signal'&&'🔒'}
                        </div>
                        <span style={{fontSize:9,color:c.tm,textAlign:'center'}}>{p.label}</span>
                      </a>
                    ))}
                    <button onClick={()=>copyShareText(_text)}
                      style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,background:'none',border:'none',cursor:'pointer',minWidth:48,padding:0}}>
                      <div style={{width:42,height:42,borderRadius:10,background:shareCopied?c.gr:c.ghb,border:'1px solid '+(shareCopied?c.gr:c.ghr),display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,transition:'background 0.2s'}}>
                        {shareCopied?'✓':'📋'}
                      </div>
                      <span style={{fontSize:9,color:shareCopied?c.gr:c.tm,textAlign:'center'}}>{shareCopied?(t.shareCopied||'Copied!'):(t.shareCopy||'Copy')}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        <BottomBar/><style>{GS}</style></div></div>
      );
    })()}

    {vw==="woop_input"&&(()=>{
      const labels=t.woopLabels||["Wish","Outcome","Obstacle","Plan"];
      const hints=t.woopHints||["","","",""];
      const phs=t.woopPh||["","","",""];
      const curKey=woopKeys[woopStep];
      const curVal=woopData[curKey]||"";
      const isLast=woopStep===3;
      const allFilled=woopData.wish.trim()&&woopData.outcome.trim()&&woopData.obstacle.trim()&&woopData.plan.trim();
      const WOOP_ICONS=["🌟","✨","🧱","⚡"];
      return(
        <div dir={dir} style={sx.pg}><div style={sx.w}>
          <div style={{textAlign:"center",marginBottom:20}}>
            <BrandMark c={c}/>
            <h1 style={{fontSize:20,fontWeight:700,color:c.tx,margin:"8px 0 2px"}}>{t.woopTitle||"WOOP Method"}</h1>
            <p style={{color:c.tm,fontSize:13,margin:0,lineHeight:1.5,maxWidth:380,marginInline:"auto"}}>{t.woopSub||""}</p>
            <a href="https://woopmylife.org/en/science" target="_blank" rel="noopener noreferrer" style={{color:c.ac,fontSize:12,marginTop:4,display:"inline-block",textDecoration:"none",opacity:0.8}}>{t.woopLink||"Learn about the science"} ↗</a>
          </div>
          {/* Step progress dots */}
          <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:20}}>
            {[0,1,2,3].map(i=>(
              <button key={i} onClick={()=>setWoopStep(i)} style={{width:i===woopStep?48:10,height:10,borderRadius:5,background:i<woopStep?c.gr:i===woopStep?c.ac:c.ghr,border:"none",cursor:"pointer",transition:"all 0.3s",padding:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
                {i===woopStep&&<span style={{fontSize:9,fontWeight:700,color:c.bt,whiteSpace:"nowrap",paddingInline:6}}>{(labels[i]||"").toUpperCase()}</span>}
              </button>
            ))}
          </div>
          <div style={{...sx.cd,animation:"fadeIn 0.3s ease"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:10,background:c.ab,border:"1px solid "+c.abr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{WOOP_ICONS[woopStep]}</div>
              <div>
                <div style={{fontSize:16,fontWeight:700,color:c.tx}}>{labels[woopStep]}</div>
                <div style={{fontSize:12,color:c.tm,lineHeight:1.4}}>{hints[woopStep]}</div>
              </div>
            </div>
            <HoneypotField/>
            <textarea
              key={woopStep}
              value={curVal}
              onChange={e=>setWoopData(d=>({...d,[curKey]:e.target.value}))}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(curVal.trim()){if(isLast){if(allFilled)submitWoop();}else{setWoopStep(s=>s+1);}}}}}
              placeholder={phs[woopStep]}
              rows={4}
              style={{...sx.ip,resize:"none",lineHeight:1.6}}
              autoFocus
            />
            {err&&<div style={sx.err}>{err}</div>}
            <div style={{display:"flex",gap:10,marginTop:14,width:"100%"}}>
              {woopStep>0&&(
                <button onClick={()=>{setErr(null);setWoopStep(s=>s-1);}} style={{...sx.bg,marginTop:0,width:"auto",flex:"0 0 auto",padding:"13px 16px"}}>
                  {t.back||"← Back"}
                </button>
              )}
              {!isLast?(
                <button onClick={()=>{if(curVal.trim())setWoopStep(s=>s+1);}} disabled={!curVal.trim()} style={curVal.trim()?{...sx.bo,marginTop:0,flex:1}:{...sx.bd,marginTop:0,flex:1}}>
                  {labels[woopStep+1]||"Next"} →
                </button>
              ):(
                <button onClick={submitWoop} disabled={busy||!allFilled} style={busy||!allFilled?{...sx.bd,marginTop:0,flex:1}:{...sx.bo,marginTop:0,flex:1}}>
                  {t.woopGo||"Create my plan →"}
                </button>
              )}
            </div>
          </div>
          {/* Summary of completed steps */}
          {woopStep>0&&(
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
              {woopKeys.slice(0,woopStep).map((k,i)=>woopData[k]&&(
                <div key={k} style={{padding:"8px 12px",borderRadius:8,background:c.gb,border:"1px solid "+c.gbr,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:14,flexShrink:0}}>{WOOP_ICONS[i]}</span>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:c.gr,marginBottom:2}}>{labels[i]}</div>
                    <div style={{fontSize:12,color:c.tm,lineHeight:1.4}}>{woopData[k]}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={()=>{setErr(null);setVw(auth==="in"?"new_goal":"home");}} style={{...sx.bg,marginTop:12}}>{t.back||"← Back"}</button>
        <BottomBar/><style>{GS}</style></div></div>
      );
    })()}

    {!["lang","byok","no_credits","manage_auth","loading","home","new_goal","dash","result","save_prompt","woop_input"].includes(vw)&&(
      <div dir={dir} style={sx.pg}><div style={sx.w}><div style={{textAlign:"center",padding:40}}><BrandMark c={c} size="large"/><button onClick={()=>setVw("lang")} style={sx.bo}>Start</button></div><BottomBar/><style>{GS}</style></div></div>
    )}
  </>);
}
