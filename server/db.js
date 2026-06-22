const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    coupleName: {
      type: String,
      required: [true, "Couple name is required"],
      trim: true,
      minlength: [2, "Couple name must be at least 2 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    eventDateFrom: {
      type: Date,
      required: [true, "Event start date is required"],
    },
    eventDateTo: {
      type: Date,
      default: null,
    },
    eventLocation: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
      minlength: [2, "Location must be at least 2 characters"],
    },
    eventDetails: {
      type: String,
      trim: true,
      default: null,
    },
    guestCount: {
      type: String,
      trim: true,
      default: null,
    },
    referral: {
      type: String,
      trim: true,
      default: null,
    },
    moodboard: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "booked", "archived"],
      default: "new",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: {
      transform(_doc, ret) {
        function formatDate(date) {
          if (!date) return null;
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        }
        function formatDateTime(date) {
          if (!date) return null;
          const d = new Date(date);
          const day = String(d.getDate()).padStart(2, "0");
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, "0");
          const minutes = String(d.getMinutes()).padStart(2, "0");
          const seconds = String(d.getSeconds()).padStart(2, "0");
          return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        }

        ret.eventDateFrom = formatDate(ret.eventDateFrom);
        ret.eventDateTo = formatDate(ret.eventDateTo);
        ret.created_at = formatDateTime(ret.created_at);
        ret.updated_at = formatDateTime(ret.updated_at);

        return ret;
      },
    },
  }
);

const Inquiry = mongoose.model("Inquiry", inquirySchema);

async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb+srv://rudhramenterprises_db_user:VOjzhqCkLoEXfIpF@panigrahna.ysnrppx.mongodb.net/panigrahna?retryWrites=true&w=majority&appName=panigrahna";
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = { connectDB, Inquiry };
