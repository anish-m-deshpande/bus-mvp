import nodemailer from "nodemailer";

export async function sendFacilityNotification(params: {
  to: string;
  incidentId: string;
  issueCategory: string;
  city: string;
  state: string;
  distance: number;
  locationText: string;
  driveable: string;
  passengers: string;
  safetyFlags: string[];
  callbackNumber: string | null;
  busId: string | null;
  transcript: string;
  appUrl: string;
}) {
  // 1. Setup Transporter (Ethereal for Demo)
  let transporter;
  
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || "587"),
          secure: false,
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });
  } else {
      // Automatic Ethereal account
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
              user: testAccount.user,
              pass: testAccount.pass,
          },
      });
  }

  // 2. Build Subject and Body
  const subject = `[BUS DOWN] ${params.issueCategory} - ${params.city}, ${params.state} (${params.distance.toFixed(1)} mi)`;
  
  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
      <h2 style="color: #e11d48; margin-top: 0;">Bus Incident Alert</h2>
      <p style="font-size: 16px; color: #1e293b; font-weight: bold;">
        ${params.issueCategory} reported in ${params.city}, ${params.state}
      </p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 4px; margin: 20px 0;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b; margin-top: 0;">Details</h3>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; color: #64748b;">Bus ID</td><td style="font-weight: bold;">${params.busId || "N/A"}</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Location</td><td style="font-weight: bold;">${params.locationText}</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Driveable</td><td style="font-weight: bold;">${params.driveable}</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Passengers</td><td style="font-weight: bold;">${params.passengers}</td></tr>
          <tr><td style="padding: 4px 0; color: #64748b;">Callback</td><td style="font-weight: bold;">${params.callbackNumber || "N/A"}</td></tr>
        </table>
      </div>

      ${params.safetyFlags.length > 0 ? `
        <div style="margin-bottom: 20px;">
          <p style="color: #e11d48; font-weight: bold; font-size: 14px;">SAFETY FLAGS: ${params.safetyFlags.join(", ").toUpperCase()}</p>
        </div>
      ` : ''}

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; text-transform: uppercase; color: #64748b;">Transcript Excerpt</h3>
        <p style="font-style: italic; color: #475569; border-left: 4px solid #cbd5e1; padding-left: 10px;">"${params.transcript}"</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${params.appUrl}/incidents/${params.incidentId}" style="background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">View Full Incident Detail</a>
      </div>
    </div>
  `;

  // 3. Send
  const info = await transporter.sendMail({
    from: '"AI Fleet Dispatch" <no-reply@fleet-ai.triage>',
    to: params.to,
    subject,
    html: htmlBody,
  });

  console.log(`[Email] Notification sent for incident ${params.incidentId}. Message ID: ${info.messageId}`);
  
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[Email] PREVIEW URL: ${previewUrl}`);
  }
  
  return { messageId: info.messageId, previewUrl };
}
