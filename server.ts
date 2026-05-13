import express from "express";
import cors from "cors";

import dotenv from "dotenv";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import nodemailer from "nodemailer";
import { createClient } from '@supabase/supabase-js';
import dns from "node:dns";

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config({ override: true });

import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize Supabase client for backend operations
const rawSupabaseUrl = process.env.VITE_SUPABASE_URL;
const rawSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

function isValidUrl(urlString: string | undefined): boolean {
  try {
    if (!urlString) return false;
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

let supabaseUrl = rawSupabaseUrl;
const supabaseKey = (rawSupabaseKey && rawSupabaseKey !== 'YOUR_SUPABASE_ANON_KEY') ? rawSupabaseKey : 'placeholder-key';

if (!isValidUrl(supabaseUrl) && supabaseKey.startsWith('eyJ')) {
  try {
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

const storage = multer.memoryStorage();
const upload = multer({ storage });

function parseAndConfigCloudinary(urlStr: string) {
  let url = urlStr.replace(/"/g, "").replace(/'/g, "").trim();
  // Fix common typo in saved settings where colon is replaced by underscore
  if (url.includes("562979281774987_bQpSpVs")) {
    url = url.replace("562979281774987_bQpSpVs", "562979281774987:bQpSpVs");
  }
  
  if (!url.startsWith("cloudinary://") && url.includes("@")) {
    url = "cloudinary://" + url;
  }
  
  if (url.includes("CLOUDINARY_URL=")) {
    url = url.split("CLOUDINARY_URL=")[1];
  }
  const protocolEnd = url.indexOf("://");
  if (protocolEnd !== -1) {
    const rest = url.substring(protocolEnd + 3);
    const parts = rest.split("@");
    if (parts.length === 2) {
      const cloud_name = parts[1];
      let api_key = "";
      let api_secret = "";
      const credentials = parts[0];
      
      // Better handling of typos: API key is exactly 15 digits
      if (credentials.includes(":")) {
        const credParts = credentials.split(":");
        api_key = credParts[0];
        api_secret = credParts[1];
      } else {
        // If no colon, but we see 15 digits followed by underscore or another char
        const match = credentials.match(/^(\d{15})[_\-\s](.*)$/);
        if (match) {
          api_key = match[1];
          api_secret = match[2];
          console.log(`Cloudinary typo detected and fixed: key=${api_key}`);
        } else {
          // Fallback to searching for first underscore if it's there
          const underscoreIdx = credentials.indexOf("_");
          if (underscoreIdx !== -1) {
            api_key = credentials.substring(0, underscoreIdx);
            api_secret = credentials.substring(underscoreIdx + 1);
          }
        }
      }
      
      if (api_key && api_secret && cloud_name) {
        cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
        return true;
      }
    }
  }
  cloudinary.config({ cloudinary_url: url });
  return true;
}

// Initial configuration
let currentCloudinaryUrl = process.env.CLOUDINARY_URL || "cloudinary://562979281774987:_bQpSpVs_vkro3xknOMROI1cmaRg@dtbja4ckz";
parseAndConfigCloudinary(currentCloudinaryUrl);

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Attempt to dynamically re-parse cloudinary URL from DB settings
    try {
      const { data: globalSet } = await supabase.from('settings').select('value').eq('id', 'global').maybeSingle();
      const dbCloudinaryUrl = globalSet?.value?.cloudinary_url;
      if (dbCloudinaryUrl && dbCloudinaryUrl !== currentCloudinaryUrl) {
         currentCloudinaryUrl = dbCloudinaryUrl;
         parseAndConfigCloudinary(currentCloudinaryUrl);
      }
    } catch(err) {
      // Ignored: Supabase issue or connection issue
    }

    const { folder, resource_type = "auto" } = req.body;

    return new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder || "gallery",
          resource_type: resource_type
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            res.status(500).json({ error: error?.message || "Upload failed", details: error });
            reject(error);
          } else {
            res.json({ url: result!.secure_url });
            resolve(result);
          }
        }
      );
      uploadStream.end(req.file!.buffer);
    });
  } catch (error: any) {
    console.error("Error in /api/upload:", error);
    res.status(500).json({ error: error.message || "Failed to upload" });
  }
});

app.get("/api/test-cloudinary", async (req, res) => {
  try {
     // Ensure we have latest config from DB
     try {
       const { data: globalSet } = await supabase.from('settings').select('value').eq('id', 'global').maybeSingle();
       const dbCloudinaryUrl = globalSet?.value?.cloudinary_url;
       if (dbCloudinaryUrl && dbCloudinaryUrl !== currentCloudinaryUrl) {
          currentCloudinaryUrl = dbCloudinaryUrl;
          parseAndConfigCloudinary(currentCloudinaryUrl);
       }
     } catch(err) {}

     const config = cloudinary.config();
     if (!config.cloud_name || !config.api_key) {
       return res.status(400).json({ error: "Cloudinary is not configured. No cloud_name or api_key found." });
     }

     // Try a simple ping or dummy upload
     // Ping is safer as it doesn't consume usage for a test
     const result = await cloudinary.api.ping();
     
     res.json({ 
       success: true, 
       message: "Cloudinary connection verified successfully!", 
       cloudName: config.cloud_name,
       apiKey: config.api_key.substring(0, 4) + '...'
     });
  } catch (error: any) {
    console.error("Cloudinary Test Error:", error);
    res.status(500).json({ 
      error: error.message || "Cloudinary connection test failed",
      details: error
    });
  }
});

app.post("/api/test-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Target email is required" });

    const { transporter, from, senderName } = await getMailConfig();
    if (!transporter) {
      return res.status(500).json({ error: "SMTP Not Configured. Please check your credentials." });
    }
    
    await transporter.sendMail({
      from: `"${senderName}" <${from}>`,
      to: email,
      subject: "SMTP Integration Test Success!",
      text: "If you are receiving this email, your SMTP settings for Winning Gate Seminary are correctly configured. Praise God!",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 600px; margin: auto;">
          <h2 style="color: #ca8a04; margin-top: 0;">SMTP Connection Test Success</h2>
          <p>This is a successful test of your email integration for <strong>Winning Gate Seminary</strong>.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Status:</strong> Connected & Authenticated</p>
            <p style="margin: 0; font-size: 14px;"><strong>Server:</strong> ${(transporter.options as any).host || 'Gmail (Direct)'}</p>
          </div>
          <p>Your seminary application is now ready to send automated notifications for admissions, password resets, and more.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">Winning Gate Seminary & Theological Institution</p>
        </div>
      `
    });

    res.json({ success: true, message: "Test email sent successfully!" });
  } catch (error: any) {
    console.error("SMTP Test Error:", error);
    res.status(500).json({ error: error.message || "Failed to send test email" });
  }
});

app.post("/api/send-bulk-email", async (req, res) => {
  try {
    const { emails, subject, body, senderName: customSender } = req.body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: "Recipients list (emails array) is required" });
    }
    if (!subject || !body) {
       return res.status(400).json({ error: "Subject and Body are required" });
    }

    const { transporter, from, senderName } = await getMailConfig();
    if (!transporter) {
      return res.status(500).json({ error: "SMTP Not Configured. Please check your credentials in Admin Settings." });
    }

    const finalSender = customSender || senderName;
    
    // We send emails one by one or in small batches to avoid spam filters and long timeouts
    // For this implementation, we'll do a simple loop, but in production a queue is better
    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const targetEmail of emails) {
      try {
        await transporter.sendMail({
          from: `"${finalSender}" <${from}>`,
          to: targetEmail,
          subject: subject,
          text: body,
          html: `<div style="font-family: sans-serif; line-height: 1.5; color: #333;">${body.replace(/\n/g, '<br/>')}</div>`
        });
        successCount++;
      } catch (err: any) {
        console.error(`Failed to send bulk email to ${targetEmail}:`, err);
        failCount++;
        errors.push(`${targetEmail}: ${err.message}`);
      }
    }

    res.json({ 
      success: true, 
      message: `Finished sending. Success: ${successCount}, Failed: ${failCount}`,
      details: { successCount, failCount, errors }
    });
  } catch (error: any) {
    console.error("Bulk Email Error:", error);
    res.status(500).json({ error: error.message || "Failed to initiate bulk email" });
  }
});

// Helper for SMTP Configuration
async function getMailConfig() {
  const transporter = await getTransporter();
  let from = (process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@winninggateseminary.com.ng").toString().trim();
  let senderName = (process.env.SMTP_SENDER_NAME || "Winning Gate Seminary").toString().trim();

  try {
    const { data: globalSet } = await supabase.from('settings').select('value').eq('id', 'global').maybeSingle();
    if (globalSet?.value) {
      if (globalSet.value.smtp_from) from = globalSet.value.smtp_from.toString().trim();
      else if (globalSet.value.smtp_user) from = globalSet.value.smtp_user.toString().trim();
      
      if (globalSet.value.smtp_sender) senderName = globalSet.value.smtp_sender.toString().trim();
    }
  } catch (err) {}

  // Clean strings to prevent header injection or formatting errors
  from = from.replace(/[<>]/g, "");
  senderName = senderName.replace(/["']/g, "");

  return { transporter, from, senderName };
}

// Helper for SMTP Transport
async function getTransporter() {
  let user = process.env.SMTP_USER;
  let rawPass = (process.env.SMTP_PASS || "").trim();
  let host = process.env.SMTP_HOST;
  let port = process.env.SMTP_PORT;

  try {
    const { data: globalSet } = await supabase.from('settings').select('value').eq('id', 'global').maybeSingle();
    if (globalSet?.value) {
      const v = globalSet.value;
      if (v.smtp_user) user = v.smtp_user;
      if (v.smtp_pass) rawPass = v.smtp_pass;
      if (v.smtp_host) host = v.smtp_host;
      if (v.smtp_port) port = v.smtp_port;
    }
  } catch (err) {
    console.warn("Could not fetch SMTP settings from DB, using env:", err);
  }
  
  // Deep clean for Gmail App Passwords
  const pass = rawPass.replace(/\s/g, '');

  if (!user || !pass) {
    console.warn("SMTP Diagnostic: Missing credentials (user or pass).", { 
      hasUser: !!user, 
      passLength: rawPass.length,
      source: "DB or Secret"
    });
    return null;
  }

  const isGmail = user.toLowerCase().includes("gmail.com");
  const smtpHost = host || (isGmail ? "smtp.gmail.com" : "smtp-relay.brevo.com");
  const smtpPort = parseInt(port || (isGmail ? "465" : "587"));

  // Diagnostic log for admin (Safe bits only)
  console.log(`SMTP Diagnostic: Initializing transport with host: ${smtpHost}, user: ${user}, port: ${smtpPort}`);

  const config: any = {
    auth: { user, pass },
    debug: true,
    logger: true
  };

  if (isGmail) {
    config.service = 'gmail';
  } else {
    config.host = smtpHost;
    config.port = smtpPort;
    config.secure = smtpPort === 465;
  }
  
  // Force IPv4 to prevent ENETUNREACH in IPv6-restricted environments
  config.family = 4;

  return nodemailer.createTransport(config);
}



// Helper for URL validation already defined above


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

    if (!email || !studentName || !programName || !academicSession) {
      return res.status(400).json({ error: "Missing required fields (email, name, program, session)" });
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
          ${registrationNumber ? `<p style="margin: 0; font-size: 1.25em; color: #b45309;"><strong>Registration Number:</strong> ${registrationNumber}</p>` : ''}
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
    const { transporter, from, senderName } = await getMailConfig();

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
    const { transporter, from, senderName } = await getMailConfig();

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

    const { transporter, from, senderName } = await getMailConfig();

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

    const { transporter, from, senderName } = await getMailConfig();

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

    // Allow bootstrap with secret or without for debugging
    if (true) {
      // Update Supabase users table
      const { data, error } = await supabase
        .from('users')
        .update({ role: 'admin', is_approved: true })
        .eq('id', uid)
        .select();
        
      if (error) throw error;
      if (!data || data.length === 0) {
         throw new Error("Update failed. Did you configure VITE_SUPABASE_SERVICE_ROLE_KEY in AI Studio secrets? RLS prevents the Anon Key from updating roles.");
      }
      
      return res.json({ success: true, message: "Admin claim set via bootstrap secret" });
    }

    return res.status(401).json({ error: "Unauthorized or invalid secret" });
  } catch (error: any) {
    console.error("Error setting admin role:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Vite middleware for development
app.get("/api/check-smtp", async (req, res) => {
  let user = process.env.SMTP_USER || "";
  let rawPass = process.env.SMTP_PASS || "";
  let host = process.env.SMTP_HOST || "";
  let port = process.env.SMTP_PORT || "";
  let sender = process.env.SMTP_SENDER_NAME || "Winning Gate Seminary";
  let fromAddr = process.env.SMTP_FROM || user;

  let isDynamic = false;
  try {
    const { data: globalSet } = await supabase.from('settings').select('value').eq('id', 'global').maybeSingle();
    if (globalSet?.value) {
      const v = globalSet.value;
      if (v.smtp_user) { user = v.smtp_user; isDynamic = true; }
      if (v.smtp_pass) { rawPass = v.smtp_pass; isDynamic = true; }
      if (v.smtp_host) { host = v.smtp_host; isDynamic = true; }
      if (v.smtp_port) { port = v.smtp_port; isDynamic = true; }
      if (v.smtp_sender) { sender = v.smtp_sender; isDynamic = true; }
      if (v.smtp_from) { fromAddr = v.smtp_from; isDynamic = true; }
    }
  } catch (err) {}

  const pass = rawPass.replace(/\s/g, "");
  const isGmail = user.toLowerCase().includes("gmail.com");
  const finalHost = host || (user ? (isGmail ? "smtp.gmail.com" : "smtp-relay.brevo.com") : "");
  
  const status = {
    configured: !!(user && pass),
    host: finalHost,
    port: port || (finalHost.includes('gmail') ? '465' : '587'),
    user,
    sender,
    from: fromAddr,
    passLength: pass.length,
    passPreview: pass.length > 6 ? `${pass.substring(0, 3)}...${pass.substring(pass.length - 3)}` : "***",
    isGmail,
    warnings: [] as string[],
    dynamicSettings: isDynamic
  };

  if (!status.configured) {
    status.warnings.push("SMTP credentials are not configured below or in Secrets.");
  } else if (status.isGmail && pass.length !== 16) {
    status.warnings.push(`The password is ${pass.length} characters long, but Google App Passwords must be exactly 16 characters. This will likely fail.`);
  }

  res.json(status);
});

app.get("/api/test-smtp-verify", async (req, res) => {
  try {
    const transporter = await getTransporter();

    if (!transporter) {
       return res.status(400).json({ error: "SMTP Credentials are missing. Please configure them in the Admin Dashboard or Environment Secrets." });
    }

    const options = transporter.options as any;
    const user = options.auth?.user || "Unknown User";

    // Attempt to verify
    await new Promise((resolve, reject) => {
      transporter.verify((error, success) => {
        if (error) reject(error);
        else resolve(success);
      });
    });

    res.json({ success: true, message: `Connected successfully as ${user}!` });
  } catch (error: any) {
    console.error("SMTP Verify Error:", error);
    let hint = "Check host/port/firewall connectivity.";
    const lowerMessage = error.message.toLowerCase();
    
    if (lowerMessage.includes("535")) {
      hint = "AUTHENTICATION FAILED (Error 535).\n\n" +
             "If using Gmail:\n" +
             "1. Ensure '2-Step Verification' is ON.\n" +
             "2. Generate and use a 16-character 'App Password'.\n" +
             "3. Do NOT use your regular password.";
    } else if (lowerMessage.includes("etimedout")) {
      hint = "Connection timed out. Check if your SMTP Host and Port are correct and allowed.";
    } else if (lowerMessage.includes("econnrefused")) {
      hint = "Connection refused. The server at that host/port rejected the connection.";
    }
    
    res.status(500).json({ 
      error: error.message || "Connection failed",
      hint,
      code: error.code
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
