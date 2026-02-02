import nodemailer from 'nodemailer';

const MAIL_SERVER = process.env.MAIL_SERVER || 'smtp.gmail.com';
const MAIL_PORT = parseInt(process.env.MAIL_PORT || '587', 10);
const MAIL_USERNAME = process.env.MAIL_USERNAME;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;
const MAIL_FROM = process.env.MAIL_FROM;
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || '75way';
const MAIL_TLS = process.env.MAIL_TLS === 'True';
const USE_CREDENTIALS = process.env.USE_CREDENTIALS === 'True';

let transporter: nodemailer.Transporter | null = null;

function initTransporter() {
  if (transporter) return transporter;

  if (!USE_CREDENTIALS || !MAIL_USERNAME || !MAIL_PASSWORD || !MAIL_FROM) {
    console.warn('⚠️  Email not configured. Reminders will be logged but not sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: MAIL_SERVER,
    port: MAIL_PORT,
    secure: MAIL_TLS && MAIL_PORT === 465, // use SSL for 465, TLS for 587
    auth: {
      user: MAIL_USERNAME,
      pass: MAIL_PASSWORD,
    },
  });

  console.log(`✓ Email transporter configured: ${MAIL_FROM}`);
  return transporter;
}

export async function sendReminderEmail(params: {
  to: string;
  topic: string;
  runId: string;
}) {
  const transporter = initTransporter();

  if (!transporter) {
    console.log(
      `[EMAIL] Would send reminder for "${params.topic}" to ${params.to} (SMTP not configured)`
    );
    return { success: true, messageId: 'logged' };
  }

  try {
    const info = await transporter.sendMail({
      from: `${MAIL_FROM_NAME} <${MAIL_FROM}>`,
      to: params.to,
      subject: `📚 Study Reminder: ${params.topic}`,
      html: `
        <h2>Study Reminder</h2>
        <p>Hi there!</p>
        <p>It's time to check in on your study session:</p>
        <p><strong>${params.topic}</strong></p>
        <p>
          <a href="https://yourapp.com/agent/${params.runId}" style="
            display: inline-block;
            padding: 10px 20px;
            background: #0ea5a4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
          ">
            View Your Session
          </a>
        </p>
        <p>Keep up the great work! 🎓</p>
      `,
      text: `Study Reminder: ${params.topic}\n\nCheck your study session at https://yourapp.com/agent/${params.runId}`,
    });

    console.log(`✓ Reminder sent to ${params.to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`✗ Failed to send reminder to ${params.to}: ${err.message}`);
    return { success: false, error: err.message };
  }
}
