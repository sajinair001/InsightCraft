const TO_EMAIL = "info@avignity.com"; // where you want to receive messages
const RECAPTCHA_SECRET = "YOUR_RECAPTCHA_SECRET_KEY"; // secret key (keep private)

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const data = JSON.parse(body);

    // 1) Verify reCAPTCHA server-side (required)
    const token = data["g-recaptcha-response"] || "";
    if (!token) return json_({ ok: false, error: "Missing reCAPTCHA token." });

    const verifyResp = UrlFetchApp.fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "post",
      payload: {
        secret: RECAPTCHA_SECRET,
        response: token
        // remoteip: e?.parameter?.ip  // optional
      }
    });

    const verify = JSON.parse(verifyResp.getContentText());
    if (!verify.success) {
      return json_({ ok: false, error: "reCAPTCHA verification failed.", details: verify["error-codes"] || [] });
    }

    // 2) Build email
    const name = (data.name || "").toString().trim();
    const email = (data.email || "").toString().trim();
    const company = (data.company || "").toString().trim();
    const interest = (data.interest || "").toString().trim();
    const message = (data.message || "").toString().trim();

    const subject = `Website Contact: ${name || "New Message"}${company ? " (" + company + ")" : ""}`;
    const text =
`New website inquiry:

Name: ${name}
Email: ${email}
Company: ${company}
Interest: ${interest}

Message:
${message}
`;

    // 3) Send
    MailApp.sendEmail({
      to: TO_EMAIL,
      replyTo: email || undefined,
      subject,
      body: text
    });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: (err && err.message) ? err.message : "Unknown error" });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
