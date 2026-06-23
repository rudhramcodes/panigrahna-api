const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const FROM_EMAIL = "hello@panigrahna.com";
const FROM_NAME = "Panigrahna";
const LOGO_URL =
  "https://res.cloudinary.com/dvsrgdyi7/image/upload/v1782190130/panigrahna-logo.svg";

function getApiKey() {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.error("BREVO_API_KEY environment variable is not set");
  }
  return key;
}

async function sendBrevoEmail({ to, toName, subject, htmlContent, replyTo }) {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const payload = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: [{ email: to, name: toName || "" }],
    subject,
    htmlContent,
  };

  if (replyTo) {
    payload.replyTo = { email: replyTo, name: FROM_NAME };
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Brevo API error ${res.status}: ${errBody}`);
  }

  return res.json();
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatDateRange(from, to) {
  const fmt = (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const fromStr = fmt(new Date(from));
  if (!to) return fromStr;
  return `${fromStr} – ${fmt(new Date(to))}`;
}

function userAcknowledgement({ coupleName, eventDateFrom, eventDateTo, location }) {
  const dateRange = formatDateRange(eventDateFrom, eventDateTo);

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f5f0e8;font-family:Georgia,'Times New Roman',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0e8;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="background-color:#3d2b1a;padding:36px 40px 30px;text-align:center;">
              <img src="${LOGO_URL}" alt="Panigrahna" style="display:block;margin:0 auto 8px;max-width:80px;height:auto;border:none;" />
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:400;letter-spacing:2px;color:#f5f0e8;text-transform:uppercase;">Panigrahna</h1>
              <p style="margin:6px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:#c97c2e;">Wedding &amp; Editorial Photography</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;font-size:18px;color:#3d2b1a;line-height:1.6;">Dear ${coupleName},</p>
              <p style="margin:0 0 20px;font-size:16px;color:#5a4a3a;line-height:1.7;">
                Thank you for reaching out to us. Your inquiry has been received with warmth and we are truly honoured that you are considering us to document your story.
              </p>
              <p style="margin:0 0 10px;font-size:15px;color:#5a4a3a;line-height:1.6;"><strong style="color:#3d2b1a;">Event Dates:</strong> ${dateRange}</p>
              <p style="margin:0 0 24px;font-size:15px;color:#5a4a3a;line-height:1.6;"><strong style="color:#3d2b1a;">Location:</strong> ${location}</p>
              <p style="margin:0 0 20px;font-size:16px;color:#5a4a3a;line-height:1.7;">
                A member of our team will connect with you within <strong>24–48 hours</strong> to discuss your vision, answer any questions, and take the next steps together.
              </p>
              <p style="margin:0 0 20px;font-size:16px;color:#5a4a3a;line-height:1.7;">
                In the meantime, feel free to reach out to us directly:
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td style="padding:0 20px 8px 0;font-size:14px;color:#5a4a3a;font-family:Arial,sans-serif;">📞</td>
                  <td style="font-size:15px;color:#3d2b1a;font-family:Arial,sans-serif;">+91 72849 80137</td>
                </tr>
                <tr>
                  <td style="padding:0 20px 8px 0;font-size:14px;color:#5a4a3a;font-family:Arial,sans-serif;">📞</td>
                  <td style="font-size:15px;color:#3d2b1a;font-family:Arial,sans-serif;">+91 72858 10137</td>
                </tr>
                <tr>
                  <td style="padding:0 20px 0 0;font-size:14px;color:#5a4a3a;font-family:Arial,sans-serif;">✉️</td>
                  <td style="font-size:15px;color:#c97c2e;font-family:Arial,sans-serif;">
                    <a href="mailto:hello@panigrahna.com" style="color:#c97c2e;text-decoration:none;">hello@panigrahna.com</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-size:16px;color:#5a4a3a;line-height:1.7;">
                With gratitude,
              </p>
              <p style="margin:0;font-size:18px;color:#3d2b1a;font-style:italic;">The Panigrahna Team</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5f0e8;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#7a6a58;font-family:Arial,sans-serif;">
                Panigrahna · Wedding &amp; Editorial Photography<br>
                Mumbai &amp; Surat, India
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function adminNotification(formData) {
  const {
    coupleName,
    email,
    phone,
    eventDateFrom,
    eventDateTo,
    eventLocation,
    location,
    eventDetails,
    guestCount,
    referral,
    moodboard,
  } = formData;

  const dateRange = formatDateRange(eventDateFrom, eventDateTo);
  const created = new Date().toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const field = (label, value) => `
<tr>
  <td style="padding:10px 16px;border-bottom:1px solid #e8e0d4;font-size:13px;color:#7a6a58;font-family:Arial,sans-serif;vertical-align:top;white-space:nowrap;width:140px;">${label}</td>
  <td style="padding:10px 16px;border-bottom:1px solid #e8e0d4;font-size:14px;color:#3d2b1a;font-family:Arial,sans-serif;vertical-align:top;">${value || ""}</td>
</tr>`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f0ebe3;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ebe3;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:4px;overflow:hidden;">
          <tr>
            <td style="background-color:#3d2b1a;padding:28px 32px 24px;text-align:center;">
              <img src="${LOGO_URL}" alt="Panigrahna" style="display:block;margin:0 auto 8px;max-width:64px;height:auto;border:none;" />
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:400;color:#f5f0e8;letter-spacing:1px;">New Inquiry Received</h1>
              <p style="margin:4px 0 0;font-size:13px;color:#c97c2e;">${coupleName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${field("Couple Name", coupleName)}
                ${field("Email", `<a href="mailto:${email}" style="color:#c97c2e;text-decoration:none;">${email}</a>`)}
                ${field("Phone", phone)}
                ${field("Event Dates", dateRange)}
                ${field("Venue", eventLocation)}
                ${field("Location", location)}
                ${field("Guest Count", guestCount)}
                ${field("Referral", referral)}
                ${field("Moodboard", moodboard)}
                ${field("Event Details", eventDetails)}
                ${field("Submitted", created)}
                ${field("Status", "new")}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:2px solid #f0ebe3;">
              <a href="mailto:${email}" style="display:inline-block;padding:10px 24px;background-color:#c97c2e;color:#ffffff;text-decoration:none;border-radius:3px;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;">Reply to ${coupleName}</a>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f5f0e8;padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#7a6a58;">Panigrahna · Inquiry Notification</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendUserAcknowledgment(inquiry) {
  const { coupleName, email, eventDateFrom, eventDateTo, location } = inquiry;
  const htmlContent = userAcknowledgement({ coupleName, eventDateFrom, eventDateTo, location });

  return sendBrevoEmail({
    to: email,
    toName: coupleName,
    subject: "Thank You \u2014 Panigrahna Has Received Your Inquiry",
    htmlContent,
    replyTo: process.env.ADMIN_EMAIL || FROM_EMAIL,
  });
}

async function sendAdminNotification(inquiry) {
  const adminEmail = process.env.ADMIN_EMAIL || FROM_EMAIL;
  const htmlContent = adminNotification(inquiry);

  return sendBrevoEmail({
    to: adminEmail,
    toName: "Admin",
    subject: `New Inquiry Received \u2014 ${inquiry.coupleName}`,
    htmlContent,
  });
}

module.exports = { sendUserAcknowledgment, sendAdminNotification, userAcknowledgement, adminNotification };
