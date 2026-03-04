const payosPackage = require("@payos/node");

const PayOS = payosPackage.PayOS || payosPackage.default || payosPackage;

let payosClient;

const getPayOSClient = () => {
  const { PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY } = process.env;

  if (!PAYOS_CLIENT_ID || !PAYOS_API_KEY || !PAYOS_CHECKSUM_KEY) {
    const error = new Error("PayOS configuration is missing");
    error.statusCode = 500;
    throw error;
  }

  if (!payosClient) {
    payosClient = new PayOS({
      clientId: PAYOS_CLIENT_ID,
      apiKey: PAYOS_API_KEY,
      checksumKey: PAYOS_CHECKSUM_KEY,
    });
  }

  return payosClient;
};

const getFrontendUrl = () =>
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");

module.exports = {
  getPayOSClient,
  getFrontendUrl,
};
