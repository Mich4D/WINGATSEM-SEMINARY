const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

exports.verifyPayment = functions.https.onCall(async (data, context) => {
  const txRef = data.tx_ref;

  try {
    const secretKey = functions.config().flutterwave?.secret_key || process.env.FLUTTERWAVE_SECRET_KEY || "FLWSECK_TEST-xxxx";
    
    const response = await axios.get(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${txRef}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const payment = response.data.data;

    if (payment.status === "successful") {
      return { success: true, data: payment };
    } else {
      return { success: false };
    }
  } catch (error) {
    console.error("Verification error:", error.response ? error.response.data : error.message);
    throw new functions.https.HttpsError("internal", "Verification failed");
  }
});

/**
 * Cloud Function to generate a unique student registration number upon approval.
 *
 * Triggered when a document in the 'users' collection is updated.
 * Conditions:
 * - 'isApproved' field changes from false to true.
 * - 'registrationNumber' field is empty or not present.
 * - 'level' and 'departmentCode' fields are present.
 *
 * Format: WGTS/[LEVEL]/[DEPT]/[YEAR]/[SEQUENCE]
 * Example: WGTS/BD/TH/2026/0001
 */
exports.generateStudentRegistrationNumber = functions.firestore
    .document('users/{userId}')
    .onUpdate(async (change, context) => {
        const studentBefore = change.before.data();
        const studentAfter = change.after.data();
        const userId = context.params.userId;

        functions.logger.log(`Checking student ${userId} for registration number generation.`);

        // 1. Check if 'isApproved' changed to true and 'registrationNumber' is not yet set
        if (!studentAfter.isApproved || studentBefore.isApproved === studentAfter.isApproved) {
            functions.logger.log('Student not approved or approval status did not change to true.');
            return null; // Exit if not approved or no change in approval status
        }

        if (studentAfter.registrationNumber && studentAfter.registrationNumber !== '') {
            functions.logger.log(`Student ${userId} already has a registration number: ${studentAfter.registrationNumber}`);
            return null; // Exit if registration number already exists
        }

        // 2. Extract necessary data for registration number generation
        const studentLevel = studentAfter.level;
        const departmentCode = studentAfter.departmentCode; // e.g., 'TH', 'BIB'
        const currentYear = new Date().getFullYear();

        if (!studentLevel || !departmentCode) {
            functions.logger.warn(`Missing 'level' or 'departmentCode' for student ${userId}. Cannot generate registration number.`);
            return null; // Exit if essential data is missing
        }

        functions.logger.log(`Generating registration number for student ${userId} (Level: ${studentLevel}, Dept: ${departmentCode}, Year: ${currentYear})`);

        try {
            let newRegistrationNumber;

            // 3. Use a Firestore transaction to safely increment the sequence counter
            await db.runTransaction(async (transaction) => {
                const counterRef = db.collection('regCounters').doc(`${departmentCode}_${currentYear}`);
                const counterDoc = await transaction.get(counterRef);

                let nextSequence;
                if (!counterDoc.exists) {
                    // Initialize counter if it doesn't exist
                    nextSequence = 1;
                    transaction.set(counterRef, { currentSequence: nextSequence });
                    functions.logger.log(`Initialized counter for ${departmentCode}_${currentYear} to 1.`);
                } else {
                    // Increment existing counter
                    nextSequence = counterDoc.data().currentSequence + 1;
                    transaction.update(counterRef, { currentSequence: nextSequence });
                    functions.logger.log(`Incremented counter for ${departmentCode}_${currentYear} to ${nextSequence}.`);
                }

                // Format sequence to be 4 digits, padded with leading zeros
                const formattedSequence = String(nextSequence).padStart(4, '0');

                // Construct the full registration number
                newRegistrationNumber = `WGTS/${studentLevel}/${departmentCode}/${currentYear}/${formattedSequence}`;

                // 4. Update the student document with the new registration number
                const studentRef = db.collection('users').doc(userId);
                transaction.update(studentRef, { registrationNumber: newRegistrationNumber });

                functions.logger.log(`Successfully generated and saved registration number ${newRegistrationNumber} for student ${userId}.`);
            });

            return { success: true, registrationNumber: newRegistrationNumber };

        } catch (error) {
            functions.logger.error(`Error generating registration number for student ${userId}:`, error);
            return { success: false, error: error.message };
        }
    });
