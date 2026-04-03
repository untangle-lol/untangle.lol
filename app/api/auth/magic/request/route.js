import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getDb } from "../../../../lib/db.js";

const TOKEN_TTL_SECS = 15 * 60; // 15 minutes
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://untangle.lol";

// Rate limit: max 3 magic link requests per email per hour
const requestMap = new Map();
function rateLimitEmail(email) {
  const now = Date.now();
  const key = email.toLowerCase();
  const entry = requestMap.get(key);
  if (!entry || now - entry.windowStart > 60 * 60 * 1000) {
    requestMap.set(key, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= 3) return false;
  entry.count++;
  return true;
}

// Minimal per-language strings for the magic link email
const EMAIL_STRINGS = {
  en: { subject:"Your untangle.lol login link", badge:"Log in to untangle.lol", title:"Your magic link is ready", body:"Click the button below to log in instantly — no password needed. The link expires in <strong style=\"color:#1e293b;\">15 minutes</strong> and can only be used once.", cta:"Log in to untangle.lol →", fallback:"Or copy this link into your browser:", ignore:"If you didn't request this, you can safely ignore this email. Nobody can log in without clicking the link.", privacy:"Privacy", terms:"Terms" },
  nl: { subject:"Je untangle.lol inloglink", badge:"Inloggen op untangle.lol", title:"Je magische link is klaar", body:"Klik op de knop hieronder om direct in te loggen — geen wachtwoord nodig. De link verloopt over <strong style=\"color:#1e293b;\">15 minuten</strong> en kan maar één keer worden gebruikt.", cta:"Inloggen op untangle.lol →", fallback:"Of kopieer deze link in je browser:", ignore:"Als je dit niet hebt aangevraagd, kun je deze e-mail veilig negeren. Niemand kan inloggen zonder op de link te klikken.", privacy:"Privacy", terms:"Voorwaarden" },
  de: { subject:"Dein untangle.lol Anmeldelink", badge:"Bei untangle.lol anmelden", title:"Dein Magic Link ist bereit", body:"Klicke auf den Button unten, um dich sofort anzumelden — kein Passwort nötig. Der Link läuft in <strong style=\"color:#1e293b;\">15 Minuten</strong> ab und kann nur einmal verwendet werden.", cta:"Bei untangle.lol anmelden →", fallback:"Oder kopiere diesen Link in deinen Browser:", ignore:"Falls du das nicht angefordert hast, kannst du diese E-Mail ignorieren. Ohne Klick auf den Link kann sich niemand anmelden.", privacy:"Datenschutz", terms:"AGB" },
  fr: { subject:"Ton lien de connexion untangle.lol", badge:"Se connecter à untangle.lol", title:"Ton lien magique est prêt", body:"Clique sur le bouton ci-dessous pour te connecter instantanément — sans mot de passe. Le lien expire dans <strong style=\"color:#1e293b;\">15 minutes</strong> et ne peut être utilisé qu'une seule fois.", cta:"Se connecter à untangle.lol →", fallback:"Ou copie ce lien dans ton navigateur :", ignore:"Si tu n'as pas fait cette demande, tu peux ignorer cet e-mail en toute sécurité. Personne ne peut se connecter sans cliquer sur le lien.", privacy:"Confidentialité", terms:"CGU" },
  es: { subject:"Tu enlace de acceso a untangle.lol", badge:"Iniciar sesión en untangle.lol", title:"Tu enlace mágico está listo", body:"Haz clic en el botón para iniciar sesión al instante — sin contraseña. El enlace caduca en <strong style=\"color:#1e293b;\">15 minutos</strong> y solo puede usarse una vez.", cta:"Iniciar sesión en untangle.lol →", fallback:"O copia este enlace en tu navegador:", ignore:"Si no solicitaste esto, puedes ignorar este correo. Nadie puede iniciar sesión sin hacer clic en el enlace.", privacy:"Privacidad", terms:"Términos" },
  pt: { subject:"Teu link de acesso ao untangle.lol", badge:"Entrar no untangle.lol", title:"Teu link mágico está pronto", body:"Clica no botão abaixo para entrar imediatamente — sem senha. O link expira em <strong style=\"color:#1e293b;\">15 minutos</strong> e só pode ser usado uma vez.", cta:"Entrar no untangle.lol →", fallback:"Ou copia este link no teu navegador:", ignore:"Se não solicitaste isto, podes ignorar este e-mail. Ninguém consegue entrar sem clicar no link.", privacy:"Privacidade", terms:"Termos" },
  it: { subject:"Il tuo link di accesso a untangle.lol", badge:"Accedi a untangle.lol", title:"Il tuo link magico è pronto", body:"Clicca sul pulsante qui sotto per accedere subito — senza password. Il link scade tra <strong style=\"color:#1e293b;\">15 minuti</strong> e può essere usato una sola volta.", cta:"Accedi a untangle.lol →", fallback:"O copia questo link nel tuo browser:", ignore:"Se non hai richiesto questo accesso, puoi ignorare questa e-mail. Nessuno può accedere senza cliccare il link.", privacy:"Privacy", terms:"Termini" },
  pl: { subject:"Twój link logowania do untangle.lol", badge:"Zaloguj się do untangle.lol", title:"Twój magiczny link jest gotowy", body:"Kliknij przycisk poniżej, aby zalogować się natychmiast — bez hasła. Link wygaśnie za <strong style=\"color:#1e293b;\">15 minut</strong> i może być użyty tylko raz.", cta:"Zaloguj się do untangle.lol →", fallback:"Lub skopiuj ten link do przeglądarki:", ignore:"Jeśli nie prosiłeś o ten link, możesz zignorować tę wiadomość. Nikt nie może się zalogować bez kliknięcia w link.", privacy:"Prywatność", terms:"Regulamin" },
  tr: { subject:"untangle.lol giriş bağlantın", badge:"untangle.lol'a giriş yap", title:"Sihirli bağlantın hazır", body:"Anında giriş yapmak için aşağıdaki düğmeye tıkla — şifre gerekmez. Bağlantı <strong style=\"color:#1e293b;\">15 dakika</strong> içinde sona erer ve yalnızca bir kez kullanılabilir.", cta:"untangle.lol'a giriş yap →", fallback:"Ya da bu bağlantıyı tarayıcına kopyala:", ignore:"Bunu talep etmediysen bu e-postayı görmezden gelebilirsin. Bağlantıya tıklamadan kimse giriş yapamaz.", privacy:"Gizlilik", terms:"Koşullar" },
  ru: { subject:"Ссылка для входа на untangle.lol", badge:"Войти на untangle.lol", title:"Ваша волшебная ссылка готова", body:"Нажмите кнопку ниже для мгновенного входа — пароль не нужен. Ссылка действительна <strong style=\"color:#1e293b;\">15 минут</strong> и может быть использована только один раз.", cta:"Войти на untangle.lol →", fallback:"Или скопируйте ссылку в браузер:", ignore:"Если вы не запрашивали эту ссылку, просто проигнорируйте письмо. Никто не войдёт без клика по ссылке.", privacy:"Конфиденциальность", terms:"Условия" },
  ar: { subject:"رابط تسجيل الدخول إلى untangle.lol", badge:"تسجيل الدخول إلى untangle.lol", title:"رابطك السحري جاهز", body:"انقر على الزر أدناه لتسجيل الدخول فوراً — لا كلمة مرور لازمة. ينتهي صلاحية الرابط خلال <strong style=\"color:#1e293b;\">١٥ دقيقة</strong> ويمكن استخدامه مرة واحدة فقط.", cta:"تسجيل الدخول إلى untangle.lol ←", fallback:"أو انسخ هذا الرابط في متصفحك:", ignore:"إذا لم تطلب هذا، يمكنك تجاهل هذا البريد الإلكتروني بأمان. لا يمكن لأحد تسجيل الدخول دون النقر على الرابط.", privacy:"الخصوصية", terms:"الشروط" },
  ja: { subject:"untangle.lolのログインリンク", badge:"untangle.lolにログイン", title:"マジックリンクの準備ができました", body:"下のボタンをクリックして即座にログイン — パスワード不要。リンクは<strong style=\"color:#1e293b;\">15分</strong>で失効し、一度しか使用できません。", cta:"untangle.lolにログイン →", fallback:"またはこのリンクをブラウザにコピー:", ignore:"このリクエストに心当たりがない場合は、このメールを無視してください。リンクをクリックしなければ誰もログインできません。", privacy:"プライバシー", terms:"利用規約" },
  zh: { subject:"您的 untangle.lol 登录链接", badge:"登录 untangle.lol", title:"您的魔法链接已准备好", body:"点击下方按钮即可立即登录 — 无需密码。链接将在 <strong style=\"color:#1e293b;\">15 分钟</strong>后过期，且只能使用一次。", cta:"登录 untangle.lol →", fallback:"或将此链接复制到浏览器：", ignore:"如果您没有发出此请求，可以安全地忽略此邮件。没有人可以在不点击链接的情况下登录。", privacy:"隐私", terms:"条款" },
  ko: { subject:"untangle.lol 로그인 링크", badge:"untangle.lol에 로그인", title:"매직 링크가 준비되었습니다", body:"아래 버튼을 클릭하면 즉시 로그인할 수 있습니다 — 비밀번호 불필요. 링크는 <strong style=\"color:#1e293b;\">15분</strong> 후에 만료되며 한 번만 사용할 수 있습니다.", cta:"untangle.lol에 로그인 →", fallback:"또는 이 링크를 브라우저에 복사하세요:", ignore:"이 요청을 하지 않으셨다면 이 이메일을 무시하셔도 됩니다. 링크를 클릭하지 않으면 아무도 로그인할 수 없습니다.", privacy:"개인정보", terms:"이용약관" },
  hi: { subject:"आपका untangle.lol लॉगिन लिंक", badge:"untangle.lol में लॉगिन करें", title:"आपका मैजिक लिंक तैयार है", body:"तुरंत लॉगिन करने के लिए नीचे दिए बटन पर क्लिक करें — कोई पासवर्ड नहीं चाहिए। लिंक <strong style=\"color:#1e293b;\">15 मिनट</strong> में समाप्त हो जाएगा और केवल एक बार उपयोग किया जा सकता है।", cta:"untangle.lol में लॉगिन करें →", fallback:"या इस लिंक को अपने ब्राउज़र में कॉपी करें:", ignore:"यदि आपने यह अनुरोध नहीं किया, तो इस ईमेल को अनदेखा करें। लिंक पर क्लिक किए बिना कोई लॉगिन नहीं कर सकता।", privacy:"गोपनीयता", terms:"शर्तें" },
};

function buildEmail(email, magicUrl, lang) {
  const s = EMAIL_STRINGS[lang] || EMAIL_STRINGS.en;
  const dir = lang === "ar" ? ' dir="rtl"' : '';
  return `<!DOCTYPE html>
<html lang="${lang||'en'}"${dir}>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${s.subject}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:28px;">
          <a href="${BASE_URL}" style="text-decoration:none;display:inline-flex;align-items:center;gap:8px;">
            <svg width="36" height="22" viewBox="0 0 52 32" fill="none" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M26 16C24 10 19.5 7 14 7C7.5 7 4 11.5 4 16C4 20.5 7.5 25 14 25C19.5 25 24 22 26 16C28 10 32.5 7 38 7C44.5 7 48 11.5 48 16C48 20.5 44.5 25 38 25C32.5 25 28 22 26 16Z"/>
            </svg>
            <span style="font-size:20px;font-weight:800;letter-spacing:-0.03em;color:#1e293b;">untangle</span><span style="font-size:11px;font-weight:500;letter-spacing:0.1em;color:#94a3b8;text-transform:uppercase;margin-top:2px;">.lol</span>
          </a>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">

            <!-- Top accent bar -->
            <tr><td style="background:#b45309;border-radius:16px 16px 0 0;height:4px;font-size:0;">&nbsp;</td></tr>

            <!-- Body -->
            <tr><td style="padding:36px 40px 32px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#b45309;">${s.badge}</p>
              <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#1e293b;letter-spacing:-0.02em;line-height:1.3;">${s.title}</h1>
              <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">${s.body}</p>

              <!-- CTA button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr><td style="border-radius:12px;background:#b45309;">
                  <a href="${magicUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:-0.01em;border-radius:12px;">
                    ${s.cta}
                  </a>
                </td></tr>
              </table>

              <!-- Fallback URL -->
              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">${s.fallback}</p>
              <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-family:monospace;">${magicUrl}</p>
            </td></tr>

            <!-- Footer inside card -->
            <tr><td style="padding:0 40px 28px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">${s.ignore}</p>
            </td></tr>

          </table>
        </td></tr>

        <!-- Bottom footer -->
        <tr><td align="center" style="padding-top:24px;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">
            <a href="${BASE_URL}" style="color:#b45309;text-decoration:none;">untangle.lol</a> &nbsp;·&nbsp;
            <a href="${BASE_URL}/privacy" style="color:#94a3b8;text-decoration:none;">${s.privacy}</a> &nbsp;·&nbsp;
            <a href="${BASE_URL}/terms" style="color:#94a3b8;text-decoration:none;">${s.terms}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const email = (body?.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }
  const lang = EMAIL_STRINGS[body?.lang] ? body.lang : "en";

  if (!rateLimitEmail(email)) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECS;
  const db = getDb();
  // Prune expired tokens opportunistically
  db.prepare(`DELETE FROM magic_tokens WHERE expires_at < unixepoch()`).run();
  db.prepare(
    `INSERT INTO magic_tokens (token, email, expires_at) VALUES (?, ?, ?)`
  ).run(token, email, expiresAt);

  const magicUrl = `${BASE_URL}/api/auth/magic/verify?token=${token}`;

  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@untangle.lol";
  const senderName = process.env.BREVO_SENDER_NAME || "untangle.lol";

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email }],
        subject: (EMAIL_STRINGS[lang] || EMAIL_STRINGS.en).subject,
        htmlContent: buildEmail(email, magicUrl, lang),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Brevo error:", err);
      return NextResponse.json({ error: "email_failed" }, { status: 502 });
    }
  } catch (e) {
    console.error("Brevo send error:", e.message);
    return NextResponse.json({ error: "email_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
