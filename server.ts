import express from "express";
import cors from "cors";
import Stripe from "stripe";
import dotenv from "dotenv";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import nodemailer from "nodemailer";
import { createClient } from '@supabase/supabase-js';

dotenv.config({ override: true });

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Helper for SMTP Transport
function getTransporter() {
  const user = process.env.SMTP_USER;
  const rawPass = (process.env.SMTP_PASS || "").trim();
  
  // Deep clean for Gmail App Passwords
  const pass = rawPass.replace(/\s/g, '');

  if (!user || !pass) {
    console.warn("SMTP Diagnostic: Missing user or pass", { user: !!user, passLen: rawPass.length });
    return null;
  }

  // Diagnostic log (SAFE: only shows length and boundaries)
  console.log(`SMTP Diagnostic: Initializing with user: ${user}`);
  console.log(`SMTP Diagnostic: Raw Pass Length: ${rawPass.length}, Cleaned Pass Length: ${pass.length}`);
  if (pass.length > 5) {
    console.log(`SMTP Diagnostic: Pass Preview: ${pass.substring(0, 2)}...${pass.substring(pass.length-2)}`);
  }

  const isGmail = user.toLowerCase().includes("gmail.com");
  const host = process.env.SMTP_HOST || (isGmail ? "smtp.gmail.com" : "smtp-relay.brevo.com");

  const config: any = {
    auth: { user, pass },
    debug: true,
    logger: true
  };

  // FORCE Gmail service if domain matches gmail.com
  // This is much more reliable than host/port config for Google
  if (isGmail) {
    config.service = 'gmail';
    // Remove individual host/port/secure settings as 'service' handles them
    delete config.host;
    delete config.port;
    delete config.secure;
  } else {
    config.host = host;
    config.port = parseInt(process.env.SMTP_PORT || '587');
    config.secure = process.env.SMTP_PORT === '465';
  }

  return nodemailer.createTransport(config);
}

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key, { apiVersion: "2025-02-24.acacia" as any });
  }
  return stripeClient;
}

// Helper to check if a URL is valid
const isValidUrl = (url: string | undefined) => {
  try {
    if (!url || url === 'undefined') return false;
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Initialize Supabase client for backend operations
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL;
const rawSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabaseUrl = rawSupabaseUrl;
const supabaseKey = (rawSupabaseKey && rawSupabaseKey !== 'YOUR_SUPABASE_ANON_KEY') ? rawSupabaseKey : 'placeholder-key';

if (!isValidUrl(supabaseUrl) && supabaseKey.startsWith('eyJ')) {
  try {
    // Try to extract project ref from JWT
    const payload = JSON.parse(Buffer.from(supabaseKey.split('.')[1], 'base64').toString());
    if (payload.ref) {
      supabaseUrl = `https://${payload.ref}.supabase.co`;
      console.log('Backend Supabase: Reconstructed URL from Token:', supabaseUrl);
    }
  } catch (e) {
    console.error('Backend Supabase: Failed to parse key:', e);
  }
}

if (!isValidUrl(supabaseUrl)) {
  supabaseUrl = 'https://placeholder.supabase.co';
}

const supabase = createClient(supabaseUrl as string, supabaseKey);

// API Routes Logging Middleware
app.use("/api", (req, res, next) => {
  console.log(`[API REQUEST] ${req.method} ${req.url}`);
  next();
});

// API Routes
console.log("Setting up API routes...");
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), supabaseUrl: supabaseUrl?.includes('placeholder') ? 'UNCONFIGURED' : 'CONFIGURED' });
});

app.post("/api/send-admission-email", async (req, res) => {
  try {
    const { email, studentName, programName, academicSession, registrationNumber } = req.body;

    if (!email || !studentName || !programName || !academicSession || !registrationNumber) {
      return res.status(400).json({ error: "Missing required fields for email" });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #b45309; text-align: center; font-family: 'Times New Roman', serif; font-size: 28px; letter-spacing: 1px;">Winning Gate Christian Theological Seminary</h2>
        <p style="text-align: center; font-style: italic; color: #666; margin-top: -10px;">"Ability to Build the Builders"</p>
        
        <p>Dear <strong>${studentName}</strong>,</p>
        
        <p>Calvary greetings to you in the name of our Lord Jesus Christ.</p>
        
        <p>On behalf of the management and faculty of <strong>Winning Gate Christian Theological Seminary</strong>, we are pleased to inform you that your application for admission has been <strong>carefully reviewed and officially approved</strong>.</p>
        
        <p>After a thorough evaluation of your submitted documents and your expressed passion for theological studies, we are confident that you have been found worthy to be enrolled into our academic program. We believe that this opportunity marks the beginning of a deeper journey into the knowledge of God and His Word.</p>
        
        <div style="background-color: #fef3c7; padding: 20px; border-left: 5px solid #b45309; margin: 25px 0; border-radius: 4px;">
          <p style="margin: 0 0 12px 0; font-size: 1.1em;"><strong>Programme:</strong> ${programName}</p>
          <p style="margin: 0 0 12px 0; font-size: 1.1em;"><strong>Academic Session:</strong> ${academicSession}</p>
          <p style="margin: 0; font-size: 1.25em; color: #b45309;"><strong>Registration Number:</strong> ${registrationNumber}</p>
        </div>
        
        <h3 style="color: #b45309;">📌 Next Steps:</h3>
        <p>Kindly proceed with the following:</p>
        <ul>
          <li>Payment of your acceptance and tuition fees</li>
          <li>Completion of registration formalities</li>
          <li>Submission of any outstanding documents (if applicable)</li>
        </ul>
        
        <p>Further details regarding lectures (online or physical), academic calendar, and course materials will be communicated to you upon confirmation of your registration.</p>
        
        <p style="font-style: italic; background-color: #f9fafb; padding: 15px; border-radius: 5px;">
          As it is written:<br/>
          "Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth." (2 Timothy 2:15)
        </p>
        
        <p>We warmly welcome you into a community committed to raising sound theologians and effective ministers of the Gospel.</p>
        
        <p>Congratulations once again.</p>
        
        <p>Yours in His service,<br/>
        <strong>Pastor Dr. Adewole Adetoro</strong><br/>
        Rector<br/>
        Winning Gate Christian Theological Seminary</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.9em; color: #666;">
          📞 08063885201<br/>
          📱 WhatsApp: 09067505783
        </p>
      </div>
    `;

    // Check if SMTP is configured
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const senderName = process.env.SMTP_SENDER_NAME || "Winning Gate Seminary";

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"${senderName}" <${from}>`,
          to: email,
          subject: "Admission Approved - Winning Gate Christian Theological Seminary",
          html: htmlContent,
        });
        console.log(`Admission email sent to ${email}`);
      } catch (err: any) {
        console.error("Error sending admission email:", err);
        if (err.message.includes("535")) {
          console.error("CRITICAL SMTP ERROR: Authentication failed. This usually means the SMTP_PASS (App Password) is incorrect or has been revoked.");
        }
        throw err; // Re-throw to be caught by the outer catch block
      }
    } else {
      console.log("SMTP credentials not provided. Email content logged instead:");
      console.log(`To: ${email}`);
      console.log(`Subject: Admission Approved - Winning Gate Christian Theological Seminary`);
      console.log(`Content: ${htmlContent.substring(0, 200)}...`);
    }

    res.json({ success: true, message: "Email processed" });
  } catch (error: any) {
    console.error("Error sending email:", error);
    let message = error.message || "Failed to send email";
    if (message.includes("535-5.7.8") || message.includes("Invalid login")) {
      const pass = (process.env.SMTP_PASS || "").replace(/\s/g, "");
      const isGmail = (process.env.SMTP_USER || "").toLowerCase().includes("gmail.com");
      const lengthHint = isGmail && pass.length !== 16 ? ` (CRITICAL: Your password is ${pass.length} chars, but Gmail requires 16)` : "";
      
      message = `SMTP Authentication Failed${lengthHint}. TO FIX THIS for Gmail:\n` + 
                "1. Enable 2-Step Verification in your Google Account (myaccount.google.com).\n" +
                "2. Search for 'App Passwords' in your Google Account settings.\n" +
                "3. Generate a new App Password for 'Mail' on 'Other (Seminary System)'.\n" +
                "4. Copy the 16-character code (no spaces) and save it in the AI Studio SECRETS menu as SMTP_PASS.";
    }
    res.status(500).json({ error: message });
  }
});

app.post("/api/send-payment-receipt", async (req, res) => {
  try {
    const { email, studentName, amount, paymentType, transactionId } = req.body;

    if (!email || !studentName || !amount || !paymentType) {
      return res.status(400).json({ error: "Missing required fields for receipt" });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #b45309; text-align: center;">Winning Gate Christian Theological Seminary</h2>
        <p style="text-align: center; font-style: italic; color: #666; margin-top: -10px;">"Ability to Build the Builders"</p>
        
        <p>Dear <strong>${studentName}</strong>,</p>
        
        <p>Your payment was successful. Thank you!</p>
        
        <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #b45309; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Payment Details:</strong></p>
          <p style="margin: 0 0 5px 0;">Type: <strong>${paymentType}</strong></p>
          <p style="margin: 0 0 5px 0;">Amount: <strong>NGN ${amount.toLocaleString()}</strong></p>
          <p style="margin: 0;">Transaction ID: <strong>${transactionId || 'N/A'}</strong></p>
        </div>
        
        <p>If you have any questions, please contact the administration.</p>
        
        <p>Yours in His service,<br/>
        <strong>Winning Gate Christian Theological Seminary</strong></p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.9em; color: #666;">
          📞 08063885201<br/>
          📱 WhatsApp: 09067505783
        </p>
      </div>
    `;

    // Check if SMTP is configured
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const senderName = process.env.SMTP_SENDER_NAME || "Winning Gate Seminary";

    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"${senderName}" <${from}>`,
          to: email,
          subject: "Payment Receipt - Winning Gate Christian Theological Seminary",
          html: htmlContent,
        });
        console.log(`Payment receipt sent to ${email}`);
      } catch (err: any) {
        console.error("Error sending receipt email:", err);
        if (err.message.includes("535")) {
          console.error("CRITICAL SMTP ERROR: Authentication failed. This usually means the SMTP_PASS (App Password) is incorrect or has been revoked.");
        }
        throw err;
      }
    } else {
      console.log("SMTP credentials not provided. Receipt email content logged instead:");
      console.log(`To: ${email}`);
      console.log(`Subject: Payment Receipt - Winning Gate Christian Theological Seminary`);
    }

    res.json({ success: true, message: "Receipt processed" });
  } catch (error: any) {
    console.error("Error sending receipt:", error);
    let message = error.message || "Failed to send receipt";
    if (message.includes("535-5.7.8") || message.includes("Invalid login")) {
      const pass = (process.env.SMTP_PASS || "").replace(/\s/g, "");
      const isGmail = (process.env.SMTP_USER || "").toLowerCase().includes("gmail.com");
      const lengthHint = isGmail && pass.length !== 16 ? ` (CRITICAL: Your password is ${pass.length} chars, but Gmail requires 16)` : "";
      
      message = `SMTP Authentication Failed${lengthHint}. TO FIX THIS for Gmail:\n` + 
                "1. Enable 2-Step Verification in your Google Account (myaccount.google.com).\n" +
                "2. Search for 'App Passwords' in your Google Account settings.\n" +
                "3. Generate a new App Password for 'Mail' on 'Other (Seminary System)'.\n" +
                "4. Copy the 16-character code (no spaces) and save it in the AI Studio SECRETS menu as SMTP_PASS.";
    }
    res.status(500).json({ error: message });
  }
});

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const stripe = getStripe();
    const { certificateId, userId, courseName } = req.body;

    if (!certificateId || !userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // In a real app, you would validate the certificate and user in Firestore here
    // For this prototype, we'll create the session directly
    
    // Use the referer or origin to construct the success/cancel URLs
    const origin = req.headers.origin || req.headers.referer || `http://localhost:${PORT}`;
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Certificate: ${courseName || 'Graduation'}`,
              description: "Official Seminary Certificate Download",
            },
            unit_amount: 5000, // $50.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?payment=success&certId=${certificateId}`,
      cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
      metadata: {
        certificateId,
        userId,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.post("/api/create-registration-checkout", async (req, res) => {
  try {
    const stripe = getStripe();
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const origin = req.headers.origin || req.headers.referer || `http://localhost:${PORT}`;
    const baseUrl = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Seminary Registration Fee",
              description: "Non-refundable application and registration fee",
            },
            unit_amount: 2000, // $20.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/dashboard?payment=registration_success`,
      cancel_url: `${baseUrl}/dashboard?payment=registration_cancelled`,
      metadata: {
        userId,
        type: "registration_fee"
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

app.post("/mark-attendance", (req, res) => {
  const { regNumber, level, department } = req.body;

  // save to database
  console.log("Attendance:", regNumber, level, department, new Date());

  res.json({ success: true });
});

// Temporary OTP storage (In production, use Redis or a DB table)
const downloadOtps = new Map<string, { code: string; expires: number }>();

app.post("/api/send-download-otp", async (req, res) => {
  try {
    const { email, studentName, certificateName } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    downloadOtps.set(email, { code: otp, expires });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #b45309; text-align: center;">Security Verification</h2>
        <p>Hello <strong>${studentName || 'Student'}</strong>,</p>
        <p>You requested to download your certificate: <strong>${certificateName}</strong>.</p>
        <p>Please use the following single-use verification code to complete your download:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #b45309;">${otp}</span>
        </div>
        <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8em; color: #666; text-align: center;">Winning Gate Christian Theological Seminary</p>
      </div>
    `;

    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const senderName = process.env.SMTP_SENDER_NAME || "Winning Gate Seminary";

    if (transporter) {
      await transporter.sendMail({
        from: `"${senderName}" <${from}>`,
        to: email,
        subject: "Download Verification Code",
        html: htmlContent
      });
      console.log(`OTP sent to ${email}`);
    } else {
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
    }

    res.json({ success: true, message: "OTP sent" });
  } catch (err: any) {
    console.error("OTP Send Error:", err);
    if (err.message.includes("535")) {
      console.error("CRITICAL SMTP ERROR: Authentication failed. SMTP_PASS is likely incorrect.");
    }
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/verify-download-otp", async (req, res) => {
  const { email, code } = req.body;
  const record = downloadOtps.get(email);

  if (!record) {
    return res.status(400).json({ error: "No OTP found for this email. Please request a new one." });
  }

  if (Date.now() > record.expires) {
    downloadOtps.delete(email);
    return res.status(400).json({ error: "Verification code has expired." });
  }

  if (record.code !== code) {
    return res.status(400).json({ error: "Invalid verification code." });
  }

  // Success - consume OTP
  downloadOtps.delete(email);
  res.json({ success: true });
});

const classOtps = new Map<string, { code: string; expires: number }>();

app.post("/api/send-class-otp", async (req, res) => {
  try {
    const { email, phone, studentName, regNumber } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    classOtps.set(email, { code: otp, expires });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #b45309; text-align: center;">Live Class Verification</h2>
        <p>Hello <strong>${studentName || 'Student'}</strong>,</p>
        <p>A request was made to enter a virtual classroom with Registration Number: <strong>${regNumber}</strong>.</p>
        <p>Please use the following single-use verification code to securely access the class:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #b45309;">${otp}</span>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8em; color: #666; text-align: center;">Winning Gate Christian Theological Seminary</p>
      </div>
    `;

    const transporter = getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;
    const senderName = process.env.SMTP_SENDER_NAME || "Winning Gate Seminary";

    if (transporter) {
      await transporter.sendMail({
        from: `"${senderName}" <${from}>`,
        to: email,
        subject: "Your Class Access Verification Code",
        html: htmlContent
      });
      console.log(`Class OTP sent to ${email}`);
    } else {
      console.log(`[DEV MODE] Class OTP for ${email}: ${otp}`);
    }

    if (phone) {
      console.log(`[MOCK SMS] Sent to ${phone}: Your WGTS class code is ${otp}. Expires in 10 mins.`);
    }

    res.json({ success: true, message: "OTP sent to email and phone" });
  } catch (err: any) {
    console.error("Class OTP Send Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/verify-class-otp", async (req, res) => {
  const { email, code } = req.body;
  const record = classOtps.get(email);

  if (!record) {
    return res.status(400).json({ error: "No OTP found for this session. Please request a new one." });
  }

  if (Date.now() > record.expires) {
    classOtps.delete(email);
    return res.status(400).json({ error: "Verification code has expired." });
  }

  if (record.code !== code) {
    return res.status(400).json({ error: "Invalid verification code." });
  }

  // Success - consume OTP
  classOtps.delete(email);
  res.json({ success: true });
});

app.post("/api/set-admin-claim", async (req, res) => {
  try {
    const { uid, secret } = req.body;

    // Allow bootstrap with secret
    if (secret && process.env.ADMIN_BOOTSTRAP_SECRET && secret === process.env.ADMIN_BOOTSTRAP_SECRET) {
      // Update Supabase users table
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin', is_approved: true })
        .eq('id', uid);
        
      if (error) throw error;
      
      return res.json({ success: true, message: "Admin claim set via bootstrap secret" });
    }

    return res.status(401).json({ error: "Unauthorized or invalid secret" });
  } catch (error: any) {
    console.error("Error setting admin role:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Vite middleware for development
app.get("/api/check-smtp", (req, res) => {
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const defaultHost = user.toLowerCase().includes("gmail.com") ? "smtp.gmail.com" : "smtp-relay.brevo.com";
  const host = process.env.SMTP_HOST || (user ? defaultHost : "");
  
  const status = {
    configured: !!(user && pass),
    host,
    user,
    from: process.env.SMTP_FROM || user,
    passLength: pass.length,
    passPreview: pass.length > 6 ? `${pass.substring(0, 3)}...${pass.substring(pass.length - 3)}` : "***",
    isGmail: host.includes("gmail.com"),
    warnings: [] as string[]
  };

  if (!status.configured) {
    status.warnings.push("SMTP credentials (SMTP_USER/SMTP_PASS) are not set in Secrets.");
  } else if (status.isGmail && pass.length !== 16) {
    status.warnings.push(`SMTP_PASS is ${pass.length} characters long, but Google App Passwords must be exactly 16 characters. Your current password will fail.`);
  }

  res.json(status);
});

app.get("/api/test-smtp-verify", async (req, res) => {
  const user = process.env.SMTP_USER || "";
  const rawPass = process.env.SMTP_PASS || "";
  const pass = rawPass.trim().replace(/\s/g, '');
  const isGmail = user.toLowerCase().includes("gmail.com");

  try {
    const transporter = getTransporter();

    if (!transporter) {
      console.warn("SMTP Diagnostic: Missing credentials", { hasUser: !!user, hasPass: !!pass });
      return res.status(400).json({ error: "SMTP_USER or SMTP_PASS missing in Secrets." });
    }

    // Diagnostic log (masked)
    console.log(`Diagnostic: Testing SMTP to ${user}. Pass length: ${pass.length}. Starts with: ${pass.substring(0, 2)}...`);
    
    // Attempt to verify
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) reject(error);
        else resolve(success);
      });
    });

    res.json({ success: true, message: "Connection verified successfully!" });
  } catch (error: any) {
    console.error("SMTP Verify Error:", error);
    let hint = "Check host/port/firewall.";
    if (error.message.includes("535")) {
      hint = "AUTHENTICATION FAILED (535 ERROR).\n\n" +
             "CRITICAL: Gmail no longer accepts your regular account password for apps.\n" +
             "YOU MUST DO THIS:\n" +
             "1. Go to: https://myaccount.google.com/security\n" +
             "2. Enable '2-Step Verification'\n" +
             "3. Find 'App Passwords' (search at the top)\n" +
             "4. Generate a code for 'Mail' with a custom name like 'Winning Gate'\n" +
             "5. Copy the 16-character code (e.g., abcd efgh ijkl mnop)\n" +
             "6. Paste THAT code into AI Studio Secrets as SMTP_PASS.";
      
      if (isGmail && pass.length !== 16) {
        hint += `\n\nERROR: Your current SMTP_PASS is ${pass.length} characters. A Google App Password MUST be exactly 16 characters.`;
      }
    }
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code,
      hint
    });
  }
});

async function startServer() {
  console.log("Starting server function execution...");
  if (process.env.NODE_ENV !== "production") {
    console.log("Loading Vite for development...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware initialized.");
  } else {
    console.log("Initializing production static file server...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  console.log(`Binding to PORT ${PORT}...`);
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });

  // WebRTC Signaling Server
  const wss = new WebSocketServer({ server });

  interface Client {
    ws: WebSocket;
    roomId: string;
    userId: string;
  }

  const clients = new Map<WebSocket, Client>();

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        const { type, roomId, userId, targetId, payload } = data;

        if (type === "join") {
          clients.set(ws, { ws, roomId, userId });
          
          // Notify others in the room
          clients.forEach((client, clientWs) => {
            if (clientWs !== ws && client.roomId === roomId) {
              clientWs.send(JSON.stringify({
                type: "user-joined",
                userId,
              }));
              // Tell the new user about existing users
              ws.send(JSON.stringify({
                type: "user-joined",
                userId: client.userId,
              }));
            }
          });
        } else if (type === "offer" || type === "answer" || type === "ice-candidate") {
          // Relay message to target user
          clients.forEach((client, clientWs) => {
            if (client.roomId === roomId && client.userId === targetId) {
              clientWs.send(JSON.stringify({
                type,
                userId, // Sender's ID
                payload,
              }));
            }
          });
        } else if (type === "leave") {
          clients.delete(ws);
          clients.forEach((client, clientWs) => {
            if (client.roomId === roomId) {
              clientWs.send(JSON.stringify({
                type: "user-left",
                userId,
              }));
            }
          });
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    ws.on("close", () => {
      const client = clients.get(ws);
      if (client) {
        clients.delete(ws);
        clients.forEach((c, clientWs) => {
          if (c.roomId === client.roomId) {
            clientWs.send(JSON.stringify({
              type: "user-left",
              userId: client.userId,
            }));
          }
        });
      }
    });
  });
}

process.on("uncaughtException", (err) => {
  console.error("FATAL: Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("FATAL: Unhandled Rejection at:", promise, "reason:", reason);
});

console.log("Initial server script execution...");
startServer().catch(err => {
  console.error("FATAL: Server startup failed:", err);
});
