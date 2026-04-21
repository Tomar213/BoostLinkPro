const axios = require("axios");

const sendDM = async (pageId, accessToken, recipientId, messageText) => {
  const url = `https://graph.facebook.com/v21.0/${pageId}/messages`;
  const res = await axios.post(url, {
    recipient: { id: recipientId },
    message: { text: messageText },
    messaging_type: "RESPONSE",
    access_token: accessToken,
  });
  return res.data;
};

const validateToken = async (accessToken) => {
  try {
    const res = await axios.get("https://graph.facebook.com/v21.0/me", {
      params: { fields: "id,name", access_token: accessToken },
    });
    return { valid: true, account: res.data };
  } catch (err) {
    return { valid: false, error: err.response?.data || err.message };
  }
};

module.exports = { sendDM, validateToken };
