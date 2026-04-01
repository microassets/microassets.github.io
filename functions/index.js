const functions = require("firebase-functions");
const axios = require("axios");

exports.createSafepaySession = functions.https.onCall(async (data) => {

  const { amount, track_id } = data;

  try {

    const response = await axios.post(
      "https://sandbox.api.getsafepay.com/checkout/session",
      {
        amount: amount,
        currency: "PKR",
        track_id: track_id,
        success_url: "https://yourdomain.com/success",
        cancel_url: "https://yourdomain.com/cancel"
      },
      {
        headers: {
          Authorization: "934f4f4e6d5d510c2e1f651a5324811550af72b15b574a531c3849ca206af6d1",
          "Content-Type": "application/json"
        }
      }
    );

    return {
      url: response.data.url
    };

  } catch (error) {
    console.error(error.response?.data || error.message);
    throw new functions.https.HttpsError(
      "internal",
      "Payment session creation failed"
    );
  }

});