// src/api/functions.js
console.warn("⚠️ Base44 functions have been stripped. Using stubs.");

// Replace each function with a no-op or mock return
export const fetchMLSData = async () => {
  console.log("Stub: fetchMLSData called");
  return [];
};

export const getMapboxToken = async () => {
  console.log("Stub: getMapboxToken called");
  return "stub-mapbox-token";
};

export const geocodeAddress = async (address) => {
  console.log("Stub: geocodeAddress called with", address);
  return { lat: 0, lng: 0 };
};

export const sendCommunication = async (msg) => {
  console.log("Stub: sendCommunication called with", msg);
  return { success: true };
};

export const handleGoogleOAuthCallback = async () => {
  console.log("Stub: handleGoogleOAuthCallback called");
  return {};
};

export const getGoogleAuthUrl = async () => {
  console.log("Stub: getGoogleAuthUrl called");
  return "https://example.com/oauth";
};

export const refreshGoogleToken = async () => {
  console.log("Stub: refreshGoogleToken called");
  return {};
};

export const sendGmailEmail = async () => {
  console.log("Stub: sendGmailEmail called");
  return { success: true };
};

export const handleGmailWebhook = async () => {
  console.log("Stub: handleGmailWebhook called");
  return {};
};

export const startGmailSync = async () => {
  console.log("Stub: startGmailSync called");
  return {};
};

export const stopGmailSync = async () => {
  console.log("Stub: stopGmailSync called");
  return {};
};

export const getGoogleCallbackUrl = async () => {
  console.log("Stub: getGoogleCallbackUrl called");
  return "https://example.com/callback";
};