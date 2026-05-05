import nodemailer from "nodemailer";

type SendPasswordResetMailInput = {
  email: string;
  resetUrl: string;
};

function smtpIsConfigured() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_FROM,
  );
}

export function canSendPasswordResetMail() {
  return smtpIsConfigured();
}

export async function sendPasswordResetMail({ email, resetUrl }: SendPasswordResetMailInput) {
  if (!smtpIsConfigured()) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          }
        : undefined,
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Redefinição de senha - Operador Financeiro",
    text: `Recebemos um pedido de redefinição de senha. Use este link por até 30 minutos:\n\n${resetUrl}\n\nSe você não fez esse pedido, ignore esta mensagem.`,
    html: `
      <p>Recebemos um pedido de redefinição de senha.</p>
      <p>Use o link abaixo por até 30 minutos:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Se você não fez esse pedido, ignore esta mensagem.</p>
    `,
  });

  return true;
}
