const nodemailer = require('nodemailer');

function getTransporter() {
  // If user provides custom SMTP config, use it.
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // Otherwise, return a dummy transporter that just logs to console
  return {
    sendMail: async (mailOptions) => {
      console.log('--- 📧 EMAIL SIMULADO (Añade SMTP_HOST en .env para correos reales) ---');
      console.log(`De: ${mailOptions.from}`);
      console.log(`Para: ${mailOptions.to}`);
      console.log(`Asunto: ${mailOptions.subject}`);
      console.log(`HTML: ${mailOptions.html}`);
      console.log('-----------------------------------------------------------------');
      return { messageId: 'dummy-id' };
    }
  };
}

async function sendResetPasswordEmail(to, token) {
  const transporter = getTransporter();
  
  // Asumimos que el backend está corriendo en el host, la URL de reset podría variar en prod
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetLink = `${appUrl}/reset.html?token=${token}`;

  const mailOptions = {
    from: process.env.MAIL_FROM || '"Equipo Cerca" <noreply@cerca.app>',
    to,
    subject: 'Recuperación de Contraseña - Cerca',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2>Recuperación de Contraseña</h2>
        <p>Hola,</p>
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en <b>Cerca</b>.</p>
        <p>Haz clic en el siguiente enlace para crear una nueva contraseña. Este enlace expirará en 1 hora.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Restablecer mi contraseña</a>
        </div>
        <p>Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
        <p>Saludos,<br/>El Equipo de Cerca</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error enviando correo de recuperación:', error);
    throw error;
  }
}

module.exports = { sendResetPasswordEmail };
