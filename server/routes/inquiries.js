const express = require("express");
const { Inquiry } = require("../db");
const { sendUserAcknowledgment, sendAdminNotification, userAcknowledgement, adminNotification } = require("../mailer");

const router = express.Router();

/* ── Field validation rules ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateInquiry(body) {
  const errors = {};

  if (!body.coupleName || typeof body.coupleName !== "string" || body.coupleName.trim().length < 2) {
    errors.coupleName = "Required (min 2 characters)";
  }

  if (!body.email || typeof body.email !== "string" || !EMAIL_RE.test(body.email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (!body.eventDateFrom) {
    errors.eventDateFrom = "Event start date is required";
  } else {
    const d = new Date(body.eventDateFrom);
    if (isNaN(d.getTime())) {
      errors.eventDateFrom = "Invalid date";
    }
  }

  if (body.eventDateTo) {
    const d = new Date(body.eventDateTo);
    if (isNaN(d.getTime())) {
      errors.eventDateTo = "Invalid date";
    }
  }

  if (!body.location || typeof body.location !== "string" || body.location.trim().length < 2) {
    errors.location = "Required (min 2 characters)";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/* ── POST /api/inquiries ── */
router.post("/", async (req, res) => {
  try {
    const validationErrors = validateInquiry(req.body);
    if (validationErrors) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    const inquiryData = {
      coupleName: req.body.coupleName.trim(),
      email: req.body.email.trim().toLowerCase(),
      phone: req.body.phone ? req.body.phone.trim() : null,
      eventDateFrom: new Date(req.body.eventDateFrom),
      eventDateTo: req.body.eventDateTo ? new Date(req.body.eventDateTo) : null,
      eventLocation: req.body.eventLocation ? req.body.eventLocation.trim() : null,
      location: req.body.location.trim(),
      eventDetails: req.body.eventDetails ? req.body.eventDetails.trim() : null,
      guestCount: req.body.guestCount ? req.body.guestCount.trim() : null,
      referral: req.body.referral ? req.body.referral.trim() : null,
      moodboard: req.body.moodboard || null,
    };

    const inquiry = await Inquiry.create(inquiryData);

    /* Push lead to CRM */
    const pushToCRM = async () => {
      try {
        const crmUrl = process.env.CRM_API_URL || "https://rudhramgroup.com/api/leads/public/inquiry";

        // Map panigrahna inquiry to CRM lead format
        const leadPayload = {
          name: inquiryData.coupleName,
          email: inquiryData.email,
          phone: inquiryData.phone || "",
          brand: "panigrahna",
          source: "website",
          notes: [
            { text: `Event Dates: ${inquiryData.eventDateFrom} to ${inquiryData.eventDateTo}` },
            { text: `Venue/Location: ${inquiryData.eventLocation || ""} ${inquiryData.location || ""}` },
            { text: `Guest Count: ${inquiryData.guestCount || ""}` },
            { text: `Details: ${inquiryData.eventDetails || ""}` }
          ]
        };

        const response = await fetch(crmUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadPayload)
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`CRM API Error (${response.status}):`, errText);
        } else {
          console.log("Lead successfully pushed to CRM.");
        }
      } catch (err) {
        console.error("Failed to push lead to CRM:", err.message);
      }
    };

    /* Fire-and-forget emails and CRM push — don't block the response */
    Promise.all([
      sendUserAcknowledgment(inquiry).catch((err) =>
        console.error("Failed to send user acknowledgment:", err.message)
      ),
      sendAdminNotification(inquiry).catch((err) =>
        console.error("Failed to send admin notification:", err.message)
      ),
      pushToCRM()
    ]);

    return res.status(201).json({
      success: true,
      message: "Inquiry received",
      id: inquiry._id,
    });
  } catch (err) {
    console.error("Error creating inquiry:", err.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

/* ── GET /api/inquiries/email-preview/:type ── */
router.get("/email-preview/:type", (req, res) => {
  const defaults = {
    coupleName: "Priya & Arjun",
    email: "priya.arjun@example.com",
    phone: "+91 98765 43210",
    eventDateFrom: new Date("2026-12-15"),
    eventDateTo: new Date("2026-12-17"),
    eventLocation: "The Taj Mahal Palace, Mumbai",
    location: "Mumbai, India",
    guestCount: "200–250",
    referral: "Instagram",
    moodboard: "https://example.com/moodboard",
    eventDetails: "An intimate weekend celebration blending traditional South Indian ceremonies with a modern reception.",
  };

  const data = { ...defaults, ...req.query };

  try {
    let html;
    if (req.params.type === "user") {
      html = userAcknowledgement(data);
    } else if (req.params.type === "admin") {
      html = adminNotification(data);
    } else {
      return res.status(400).json({ success: false, message: 'Type must be "user" or "admin"' });
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    res.status(500).send(`<pre>Error rendering template: ${err.message}</pre>`);
  }
});

/* ── GET /api/inquiries ── */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const inquiries = await Inquiry.find(filter)
      .sort({ created_at: -1 })
      .limit(limit);

    return res.json({ success: true, data: inquiries });
  } catch (err) {
    console.error("Error fetching inquiries:", err.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

/* ── PATCH /api/inquiries/:id/status ── */
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["new", "contacted", "booked", "archived"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        errors: { status: `Must be one of: ${validStatuses.join(", ")}` },
      });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({ success: false, message: "Inquiry not found" });
    }

    return res.json({ success: true, data: inquiry });
  } catch (err) {
    console.error("Error updating inquiry status:", err.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

module.exports = router;
