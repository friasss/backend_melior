import { Resend } from "resend";
import { env } from "../config/env";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(to: string, firstName: string, token: string) {
  if (!resend) return;

  const url = `${env.API_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: env.FROM_EMAIL,
    to,
    subject: "Verifica tu correo en Melior",
    html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:36px 40px;text-align:center">
            <div style="display:inline-flex;align-items:center;gap:10px">
              <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:8px;display:inline-block">
                <span style="font-size:24px">🏠</span>
              </div>
              <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px">Melior</span>
            </div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px">
            <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#0f172a">
              Hola, ${firstName} 👋
            </h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569">
              Gracias por registrarte en Melior. Para activar tu cuenta y comenzar a explorar propiedades, verifica tu correo electrónico.
            </p>

            <!-- CTA Button -->
            <div style="text-align:center;margin:32px 0">
              <a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700;letter-spacing:0.2px">
                ✅ Verificar mi correo
              </a>
            </div>

            <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center">
              O copia y pega este enlace en tu navegador:
            </p>
            <p style="margin:0;font-size:12px;color:#2563eb;text-align:center;word-break:break-all">
              ${url}
            </p>
          </td>
        </tr>

        <!-- Note -->
        <tr>
          <td style="padding:0 40px 32px">
            <div style="background:#f1f5f9;border-radius:10px;padding:16px">
              <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5">
                ⏰ Este enlace expira en <strong>24 horas</strong>. Si no creaste esta cuenta, puedes ignorar este correo.
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">
              © 2026 Melior · República Dominicana
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPasswordResetCode(to: string, firstName: string, code: string) {
  if (!resend) return;

  await resend.emails.send({
    from: env.FROM_EMAIL,
    to,
    subject: `Tu código de recuperación: ${code} — Melior`,
    html: `
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
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a">Hola, ${firstName} 👋</h1>
            <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#475569">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el siguiente código de verificación:
            </p>

            <!-- OTP Code -->
            <div style="text-align:center;margin:0 0 32px">
              <div style="display:inline-block;background:#f1f5f9;border:2px dashed #cbd5e1;border-radius:16px;padding:24px 48px">
                <p style="margin:0 0 4px;font-size:11px;font-weight:600;letter-spacing:2px;color:#94a3b8;text-transform:uppercase">Código de verificación</p>
                <p style="margin:0;font-size:48px;font-weight:900;letter-spacing:12px;color:#1e293b;font-family:monospace">${code}</p>
              </div>
            </div>

            <div style="background:#fef3c7;border-radius:10px;padding:16px;border-left:3px solid #f59e0b">
              <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5">
                ⏰ Este código expira en <strong>15 minutos</strong>.<br>
                Si no solicitaste esto, ignora este correo — tu cuenta está segura.
              </p>
            </div>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">© 2026 Melior · República Dominicana</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

export async function sendPasswordResetEmail(to: string, firstName: string, token: string) {
  if (!resend) return;

  const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: env.FROM_EMAIL,
    to,
    subject: "Restablecer contraseña — Melior",
    html: `
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
              Hola ${firstName}, recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva.
            </p>
            <div style="text-align:center;margin:32px 0">
              <a href="${url}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-size:15px;font-weight:700">
                🔑 Crear nueva contraseña
              </a>
            </div>
            <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center">Expira en 1 hora. Si no solicitaste esto, ignora este correo.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
            <p style="margin:0;font-size:12px;color:#94a3b8">© 2026 Melior · República Dominicana</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}
