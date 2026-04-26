console.log("--- ENV VAR NAMES ---");
for (const key in process.env) {
  console.log(key);
}
console.log("--- END ---");

const rawPass = process.env.SMTP_PASS || "";
const cleanPass = rawPass.replace(/\s/g, "");
console.log("PASS_RAW_LENGTH:", rawPass.length);
console.log("PASS_CLEAN_LENGTH:", cleanPass.length);
console.log("PASS_START (CLEAN):", cleanPass.substring(0, 4));
if (rawPass.includes(' ')) {
  console.log("WARNING: Your SMTP_PASS contains spaces. The system will auto-remove them, but ensure you copied the 16-char code correctly.");
}
if (cleanPass.length === 16) {
  console.log("SUCCESS: Password length matches 16-char Gmail App Password standard.");
} else {
  console.log("ERROR: Password length is NOT 16. Gmail SMTP will likely fail with 535 error.");
}