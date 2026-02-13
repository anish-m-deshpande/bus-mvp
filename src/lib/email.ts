import nodemailer from "nodemailer";

export async function sendTriageEmail(to: string, summary: string, transcription: string, urgency: string) {
  // Create an Ethereal account for demo purposes if no SMTP provided
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.ethereal.email",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || testAccount.user,
      pass: process.env.EMAIL_PASS || testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"AI Voicemail Triage" <no-reply@aivm.triage>',
    to,
    subject: `[${urgency.toUpperCase()}] New Voicemail Triage Notification`,
    text: `Summary: ${summary}\n\nFull Transcription: ${transcription}\n\nUrgency: ${urgency}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: ${urgency === "high" ? "red" : "blue"};">New Voicemail Triage Notification</h2>
        <p><strong>Urgency:</strong> ${urgency.toUpperCase()}</p>
        <p><strong>Summary:</strong> ${summary}</p>
        <hr />
        <h3>Transcription:</h3>
        <p>${transcription}</p>
      </div>
    `,
  });

  console.log("Email sent: %s", info.messageId);
  // Preview URL only available when sending through Ethereal
  if (!process.env.EMAIL_HOST) {
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  }
}
