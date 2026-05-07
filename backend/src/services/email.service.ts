import { env } from "../config/env";

const BREVO_API = "https://api.brevo.com/v3/smtp/email";

async function sendEmail(to: string, toName: string, subject: string, html: string) {
  if (!env.BREVO_API_KEY) return;

  await fetch(BREVO_API, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: env.FROM_NAME, email: env.FROM_EMAIL },
      to: [{ email: to, name: toName }],
      subject,
      htmlContent: html,
    }),
  }).then((r) => {
    if (!r.ok) r.text().then((t) => console.error("Brevo error:", t));
  });
}

export async function sendVerificationEmail(to: string, firstName: string, token: string) {
  const url = `${env.API_URL}/api/auth/verify-email?token=${token}`;

  await sendEmail(to, firstName, "Verifica tu correo en Melior", `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:36px 40px;text-align:center">
            <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px">🏠 Melior</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 40px 32px">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a">Hola, ${firstName} 👋</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">
              Gracias por registrarte en Melior. Para activar tu cuenta, verifica tu correo electrónico.
            </p>
            <div style="text-align:center;margin:32px 0">
              <a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700">
                ✅ Verificar mi correo
              </a>
            </div>
            <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;word-break:break-all">${url}</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">⏰ Este enlace expira en 24 horas · © 2026 Melior</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`);
}

export async function sendPasswordResetCode(to: string, firstName: string, code: string) {
  if (!env.BREVO_API_KEY) throw new Error("Servicio de correo no configurado. Contacta al administrador.");

  await sendEmail(to, firstName, `Tu código de recuperación: ${code} — Melior`, `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:36px 40px;text-align:center">
            <span style="color:#ffffff;font-size:22px;font-weight:800">🏠 Melior</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">Hola, ${firstName} 👋</h1>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#475569">
              Recibimos una solicitud para restablecer tu contraseña. Usa este código:
            </p>
            <div style="text-align:center;margin:0 0 32px">
              <div style="display:inline-block;background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:16px;padding:24px 48px">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:2px;color:#94a3b8;text-transform:uppercase">Código de verificación</p>
                <p style="margin:0;font-size:48px;font-weight:900;letter-spacing:12px;color:#1e293b;font-family:monospace">${code}</p>
              </div>
            </div>
            <div style="background:#fef3c7;border-radius:10px;padding:16px;border-left:3px solid #f59e0b">
              <p style="margin:0;font-size:13px;color:#92400e">⏰ Este código expira en <strong>15 minutos</strong>.</p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">© 2026 Melior · República Dominicana</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`);
}

export async function sendPasswordResetEmail(to: string, firstName: string, token: string) {
  const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail(to, firstName, "Restablecer contraseña — Melior", `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:36px 40px;text-align:center">
            <span style="color:#ffffff;font-size:22px;font-weight:800">🏠 Melior</span>
          </td>
        </tr>
        <tr>
          <td style="padding:40px">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a">Restablecer contraseña</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">
              Hola ${firstName}, haz clic en el botón para crear una nueva contraseña.
            </p>
            <div style="text-align:center;margin:32px 0">
              <a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700">
                🔑 Crear nueva contraseña
              </a>
            </div>
            <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center">Expira en 1 hora.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:16px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">© 2026 Melior · República Dominicana</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`);
}
