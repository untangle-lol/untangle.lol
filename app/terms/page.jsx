import { redirect } from "next/navigation";

export const metadata = {
  title: "Terms & Conditions — Untangle.lol",
  description: "Terms and conditions for using Untangle.lol — the free AI-powered goal planner.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://untangle.lol/terms" },
};

const TERMS = {
  nl: {
    title: "Algemene Voorwaarden – Untangle™",
    updated: "Laatst bijgewerkt: 2026",
    intro: "Deze algemene voorwaarden zijn van toepassing op het gebruik van de app en website Untangle™ (www.untangle.lol). Door de app of website te gebruiken ga je akkoord met deze voorwaarden.",
    sections: [
      {
        heading: "1. Over Untangle",
        body: "Untangle is een digitale applicatie die gebruikers helpt bij het structureren van doelen, het identificeren van obstakels en het plannen van stappen richting persoonlijke of professionele doelstellingen.",
      },
      {
        heading: "2. Gebruik van de dienst",
        body: "Gebruikers mogen Untangle alleen gebruiken voor legitieme doeleinden. Het is niet toegestaan om:",
        list: [
          "de app te misbruiken of te manipuleren",
          "de werking van de app te verstoren",
          "de app te gebruiken voor illegale activiteiten",
          "systemen van Untangle te proberen te hacken of te omzeilen",
        ],
      },
      {
        heading: "3. Accounts",
        body: "Voor sommige functies kan een account vereist zijn. Gebruikers zijn verantwoordelijk voor het veilig houden van hun accountgegevens en wachtwoorden.",
      },
      {
        heading: "4. Intellectueel eigendom",
        body: "Alle inhoud, technologie, software, logo's, ontwerpen en functionaliteiten van Untangle zijn beschermd door intellectuele eigendomsrechten. Zonder schriftelijke toestemming mogen deze niet worden gekopieerd, verspreid of commercieel gebruikt.",
      },
      {
        heading: "5. Beschikbaarheid van de dienst",
        body: "Wij streven ernaar om de app continu beschikbaar te houden, maar kunnen geen ononderbroken beschikbaarheid garanderen. De dienst kan tijdelijk worden onderbroken voor onderhoud, updates of technische verbeteringen.",
      },
      {
        heading: "6. Aansprakelijkheid",
        body: "Untangle is een hulpmiddel voor persoonlijke organisatie en doelplanning. Wij zijn niet aansprakelijk voor directe of indirecte schade die voortvloeit uit het gebruik van de app of website.",
      },
      {
        heading: "7. Privacy",
        body: "Het gebruik van persoonsgegevens wordt geregeld in onze Privacy Policy. Wij raden gebruikers aan deze zorgvuldig te lezen.",
      },
      {
        heading: "8. Beëindiging",
        body: "Wij behouden ons het recht voor om accounts te beperken of te beëindigen wanneer gebruikers deze voorwaarden schenden of misbruik maken van de dienst.",
      },
      {
        heading: "9. Wijzigingen van de voorwaarden",
        body: "Untangle kan deze voorwaarden van tijd tot tijd aanpassen. De meest actuele versie zal altijd beschikbaar zijn op de website www.untangle.lol.",
      },
      {
        heading: "10. Toepasselijk recht",
        body: "Op deze voorwaarden is het recht van toepassing van het land waar de dienst wordt geëxploiteerd. Eventuele geschillen zullen worden behandeld volgens de toepasselijke wetgeving.",
      },
      {
        heading: "11. Contact",
        body: "Voor vragen over deze voorwaarden kun je contact opnemen via:",
        contact: "www.untangle.lol",
      },
    ],
    back: "← Terug naar Untangle",
  },

  en: {
    title: "Terms & Conditions – Untangle™",
    updated: "Last updated: 2026",
    intro: "These terms and conditions apply to the use of the Untangle™ app and website (www.untangle.lol). By using the app or website you agree to these terms.",
    sections: [
      {
        heading: "1. About Untangle",
        body: "Untangle is a digital application that helps users structure goals, identify obstacles, and plan steps towards personal or professional objectives.",
      },
      {
        heading: "2. Use of the service",
        body: "Users may only use Untangle for legitimate purposes. The following are not permitted:",
        list: [
          "misusing or manipulating the app",
          "disrupting the operation of the app",
          "using the app for illegal activities",
          "attempting to hack or circumvent Untangle's systems",
        ],
      },
      {
        heading: "3. Accounts",
        body: "Some features may require an account. Users are responsible for keeping their account credentials and passwords secure.",
      },
      {
        heading: "4. Intellectual property",
        body: "All content, technology, software, logos, designs and functionalities of Untangle are protected by intellectual property rights. Without written permission they may not be copied, distributed or used commercially.",
      },
      {
        heading: "5. Service availability",
        body: "We strive to keep the app continuously available but cannot guarantee uninterrupted availability. The service may be temporarily suspended for maintenance, updates or technical improvements.",
      },
      {
        heading: "6. Liability",
        body: "Untangle is a tool for personal organisation and goal planning. We are not liable for direct or indirect damages arising from use of the app or website.",
      },
      {
        heading: "7. Privacy",
        body: "The use of personal data is governed by our Privacy Policy. We encourage users to read it carefully.",
      },
      {
        heading: "8. Termination",
        body: "We reserve the right to restrict or terminate accounts when users violate these terms or misuse the service.",
      },
      {
        heading: "9. Changes to the terms",
        body: "Untangle may update these terms from time to time. The most current version will always be available at www.untangle.lol.",
      },
      {
        heading: "10. Applicable law",
        body: "These terms are governed by the law of the country in which the service is operated. Any disputes will be handled in accordance with applicable legislation.",
      },
      {
        heading: "11. Contact",
        body: "For questions about these terms you can reach us at:",
        contact: "www.untangle.lol",
      },
    ],
    back: "← Back to Untangle",
  },

  de: {
    title: "Allgemeine Geschäftsbedingungen – Untangle™",
    updated: "Zuletzt aktualisiert: 2026",
    intro: "Diese allgemeinen Geschäftsbedingungen gelten für die Nutzung der App und Website Untangle™ (www.untangle.lol). Durch die Nutzung der App oder Website stimmst du diesen Bedingungen zu.",
    sections: [
      {
        heading: "1. Über Untangle",
        body: "Untangle ist eine digitale Anwendung, die Nutzern hilft, Ziele zu strukturieren, Hindernisse zu identifizieren und Schritte in Richtung persönlicher oder beruflicher Ziele zu planen.",
      },
      {
        heading: "2. Nutzung des Dienstes",
        body: "Nutzer dürfen Untangle nur für legitime Zwecke verwenden. Folgendes ist nicht gestattet:",
        list: [
          "die App zu missbrauchen oder zu manipulieren",
          "den Betrieb der App zu stören",
          "die App für illegale Aktivitäten zu nutzen",
          "zu versuchen, die Systeme von Untangle zu hacken oder zu umgehen",
        ],
      },
      {
        heading: "3. Konten",
        body: "Für einige Funktionen kann ein Konto erforderlich sein. Nutzer sind verantwortlich für die sichere Aufbewahrung ihrer Kontodaten und Passwörter.",
      },
      {
        heading: "4. Geistiges Eigentum",
        body: "Alle Inhalte, Technologien, Software, Logos, Designs und Funktionalitäten von Untangle sind durch Rechte des geistigen Eigentums geschützt. Ohne schriftliche Genehmigung dürfen diese nicht kopiert, verbreitet oder kommerziell genutzt werden.",
      },
      {
        heading: "5. Verfügbarkeit des Dienstes",
        body: "Wir streben an, die App kontinuierlich verfügbar zu halten, können jedoch keine ununterbrochene Verfügbarkeit garantieren. Der Dienst kann vorübergehend für Wartung, Updates oder technische Verbesserungen unterbrochen werden.",
      },
      {
        heading: "6. Haftung",
        body: "Untangle ist ein Werkzeug zur persönlichen Organisation und Zielplanung. Wir haften nicht für direkte oder indirekte Schäden, die aus der Nutzung der App oder Website entstehen.",
      },
      {
        heading: "7. Datenschutz",
        body: "Die Verwendung personenbezogener Daten wird in unserer Datenschutzrichtlinie geregelt. Wir empfehlen den Nutzern, diese sorgfältig zu lesen.",
      },
      {
        heading: "8. Kündigung",
        body: "Wir behalten uns das Recht vor, Konten einzuschränken oder zu kündigen, wenn Nutzer gegen diese Bedingungen verstoßen oder den Dienst missbrauchen.",
      },
      {
        heading: "9. Änderungen der Bedingungen",
        body: "Untangle kann diese Bedingungen von Zeit zu Zeit anpassen. Die aktuellste Version ist immer auf der Website www.untangle.lol verfügbar.",
      },
      {
        heading: "10. Anwendbares Recht",
        body: "Für diese Bedingungen gilt das Recht des Landes, in dem der Dienst betrieben wird. Etwaige Streitigkeiten werden gemäß den geltenden Rechtsvorschriften behandelt.",
      },
      {
        heading: "11. Kontakt",
        body: "Bei Fragen zu diesen Bedingungen kannst du uns kontaktieren über:",
        contact: "www.untangle.lol",
      },
    ],
    back: "← Zurück zu Untangle",
  },

  fr: {
    title: "Conditions Générales d'Utilisation – Untangle™",
    updated: "Dernière mise à jour : 2026",
    intro: "Les présentes conditions générales s'appliquent à l'utilisation de l'application et du site web Untangle™ (www.untangle.lol). En utilisant l'application ou le site web, tu acceptes ces conditions.",
    sections: [
      {
        heading: "1. À propos d'Untangle",
        body: "Untangle est une application numérique qui aide les utilisateurs à structurer leurs objectifs, à identifier les obstacles et à planifier des étapes vers des objectifs personnels ou professionnels.",
      },
      {
        heading: "2. Utilisation du service",
        body: "Les utilisateurs ne peuvent utiliser Untangle qu'à des fins légitimes. Il est interdit de :",
        list: [
          "abuser ou manipuler l'application",
          "perturber le fonctionnement de l'application",
          "utiliser l'application à des fins illégales",
          "tenter de pirater ou de contourner les systèmes d'Untangle",
        ],
      },
      {
        heading: "3. Comptes",
        body: "Certaines fonctionnalités peuvent nécessiter un compte. Les utilisateurs sont responsables de la sécurité de leurs identifiants et mots de passe.",
      },
      {
        heading: "4. Propriété intellectuelle",
        body: "Tous les contenus, technologies, logiciels, logos, designs et fonctionnalités d'Untangle sont protégés par des droits de propriété intellectuelle. Sans autorisation écrite, ils ne peuvent être copiés, distribués ou utilisés commercialement.",
      },
      {
        heading: "5. Disponibilité du service",
        body: "Nous nous efforçons de maintenir l'application continuellement disponible, mais ne pouvons garantir une disponibilité ininterrompue. Le service peut être temporairement suspendu pour maintenance, mises à jour ou améliorations techniques.",
      },
      {
        heading: "6. Responsabilité",
        body: "Untangle est un outil d'organisation personnelle et de planification d'objectifs. Nous ne sommes pas responsables des dommages directs ou indirects découlant de l'utilisation de l'application ou du site web.",
      },
      {
        heading: "7. Confidentialité",
        body: "L'utilisation des données personnelles est régie par notre Politique de confidentialité. Nous encourageons les utilisateurs à la lire attentivement.",
      },
      {
        heading: "8. Résiliation",
        body: "Nous nous réservons le droit de restreindre ou de résilier des comptes lorsque les utilisateurs enfreignent ces conditions ou abusent du service.",
      },
      {
        heading: "9. Modifications des conditions",
        body: "Untangle peut mettre à jour ces conditions de temps à autre. La version la plus récente sera toujours disponible sur le site www.untangle.lol.",
      },
      {
        heading: "10. Droit applicable",
        body: "Ces conditions sont régies par le droit du pays dans lequel le service est exploité. Tout litige sera traité conformément à la législation applicable.",
      },
      {
        heading: "11. Contact",
        body: "Pour toute question concernant ces conditions, vous pouvez nous contacter via :",
        contact: "www.untangle.lol",
      },
    ],
    back: "← Retour à Untangle",
  },

  es: {
    title: "Términos y Condiciones – Untangle™",
    updated: "Última actualización: 2026",
    intro: "Estos términos y condiciones se aplican al uso de la aplicación y sitio web Untangle™ (www.untangle.lol). Al usar la aplicación o el sitio web aceptas estos términos.",
    sections: [
      {
        heading: "1. Sobre Untangle",
        body: "Untangle es una aplicación digital que ayuda a los usuarios a estructurar objetivos, identificar obstáculos y planificar pasos hacia metas personales o profesionales.",
      },
      {
        heading: "2. Uso del servicio",
        body: "Los usuarios solo pueden usar Untangle para fines legítimos. No está permitido:",
        list: [
          "abusar o manipular la aplicación",
          "interrumpir el funcionamiento de la aplicación",
          "usar la aplicación para actividades ilegales",
          "intentar hackear o eludir los sistemas de Untangle",
        ],
      },
      {
        heading: "3. Cuentas",
        body: "Algunas funciones pueden requerir una cuenta. Los usuarios son responsables de mantener seguros sus credenciales y contraseñas.",
      },
      {
        heading: "4. Propiedad intelectual",
        body: "Todos los contenidos, tecnologías, software, logotipos, diseños y funcionalidades de Untangle están protegidos por derechos de propiedad intelectual. Sin permiso escrito no pueden copiarse, distribuirse ni usarse comercialmente.",
      },
      {
        heading: "5. Disponibilidad del servicio",
        body: "Nos esforzamos por mantener la aplicación continuamente disponible, pero no podemos garantizar disponibilidad ininterrumpida. El servicio puede suspenderse temporalmente por mantenimiento, actualizaciones o mejoras técnicas.",
      },
      {
        heading: "6. Responsabilidad",
        body: "Untangle es una herramienta de organización personal y planificación de objetivos. No somos responsables de daños directos o indirectos derivados del uso de la aplicación o sitio web.",
      },
      {
        heading: "7. Privacidad",
        body: "El uso de datos personales se rige por nuestra Política de Privacidad. Animamos a los usuarios a leerla detenidamente.",
      },
      {
        heading: "8. Terminación",
        body: "Nos reservamos el derecho de restringir o cancelar cuentas cuando los usuarios violen estos términos o hagan un uso indebido del servicio.",
      },
      {
        heading: "9. Cambios en los términos",
        body: "Untangle puede actualizar estos términos de vez en cuando. La versión más actual estará siempre disponible en www.untangle.lol.",
      },
      {
        heading: "10. Ley aplicable",
        body: "Estos términos se rigen por la ley del país en el que opera el servicio. Cualquier disputa se resolverá conforme a la legislación aplicable.",
      },
      {
        heading: "11. Contacto",
        body: "Para preguntas sobre estos términos puedes contactarnos en:",
        contact: "www.untangle.lol",
      },
    ],
    back: "← Volver a Untangle",
  },
};

export default function TermsPage({ searchParams }) {
  const lang = ["nl", "en", "de", "fr", "es"].includes(searchParams?.lang)
    ? searchParams.lang
    : "nl";
  const d = TERMS[lang];

  const langLinks = [
    { code: "nl", label: "NL" },
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
    { code: "fr", label: "FR" },
    { code: "es", label: "ES" },
  ];

  return (
    <html lang={lang}>
      <body style={{ margin: 0, background: "#0f172a", color: "#f1f5f9", fontFamily: "'Inter', -apple-system, sans-serif" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 80px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <a href="/" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>
              🪢 untangle.lol
            </a>
          </div>

          {/* Language switcher */}
          <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
            {langLinks.map(l => (
              <a
                key={l.code}
                href={`/terms?lang=${l.code}`}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  background: l.code === lang ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.06)",
                  color: l.code === lang ? "#facc15" : "#94a3b8",
                  border: `1px solid ${l.code === lang ? "rgba(250,204,21,0.4)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", marginBottom: 6, lineHeight: 1.2 }}>
            {d.title}
          </h1>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 28 }}>{d.updated}</p>

          {/* Intro */}
          <p style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.7, marginBottom: 36 }}>{d.intro}</p>

          {/* Sections */}
          {d.sections.map((s, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>{s.heading}</h2>
              <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, margin: 0 }}>{s.body}</p>
              {s.list && (
                <ul style={{ margin: "10px 0 0", paddingLeft: 20 }}>
                  {s.list.map((item, j) => (
                    <li key={j} style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7, marginBottom: 4 }}>{item}</li>
                  ))}
                </ul>
              )}
              {s.contact && (
                <p style={{ marginTop: 8, fontSize: 14, color: "#94a3b8" }}>
                  <a href="https://www.untangle.lol" style={{ color: "#facc15", textDecoration: "none" }}>
                    {s.contact}
                  </a>
                </p>
              )}
            </div>
          ))}

          {/* Footer links */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
            <a href="/" style={{ fontSize: 14, color: "#facc15", textDecoration: "none", fontWeight: 600 }}>
              {d.back}
            </a>
            <a href={`/privacy?lang=${lang}`} style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>
              Privacy Policy
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
