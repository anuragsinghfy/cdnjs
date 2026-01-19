function appendRedirectPath() {
  const buttons = [
    document.querySelector("#login-btn"),
    document.querySelector("#signup-btn"),
  ].filter(Boolean);

  if (!buttons.length) {
    return;
  }

  const redirectPath = window.location.pathname || "/";

  buttons.forEach((btn) => {
    const hrefAttr = btn.getAttribute("href") || "";
    try {
      const url = new URL(hrefAttr, window.location.origin);
      url.searchParams.set("redirectPath", redirectPath);
      url.searchParams.set("redirectToFreePropertyFlow", "true");
      btn.href = url.toString();
    } catch (error) {
      console.error("Failed to update redirect path:", error);
    }
  });
}

function initLoginFlow() {
  appendRedirectPath();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLoginFlow);
} else {
  initLoginFlow();
}

const EBG_SECRET = "1234567"; // from src/services/interceptors/signature.js
let __baseApiUrl__;
try {
  const hostname = window.location.hostname;
  if (hostname.includes("webflow.io") || hostname.includes("shrinkz0.de")) {
    __baseApiUrl__ = "https://api.shrinkz0.de"; // staging
  } else if (hostname.endsWith("shrink.media")) {
    __baseApiUrl__ = "https://api.shrink.media"; // production
  } else {
    __baseApiUrl__ = "https://api.shrink.media"; // fallback to prod
  }
} catch (_) {
  __baseApiUrl__ = "https://api.shrink.media";
}
const AUTH_ENDPOINT = `${__baseApiUrl__}/service/panel/users/v1.0/authentication/token`;

function toUtf8Bytes(str) {
  return new TextEncoder().encode(str);
}
function toHex(buf) {
  const b = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}
async function sha256Hex(text) {
  const d = await crypto.subtle.digest("SHA-256", toUtf8Bytes(text));
  return toHex(d);
}
async function hmacSha256Hex(keyStr, text) {
  const key = await crypto.subtle.importKey(
    "raw",
    toUtf8Bytes(keyStr),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, toUtf8Bytes(text));
  return toHex(sig);
}

// Matches getDateTime(): YYYYMMDDTHHMMSSZ (no punctuation)
function ebgTimestamp() {
  return new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "");
}
function base64Ascii(str) {
  return btoa(str);
}

// Minimal encodeRfc3986Full from repo returns str; do not re-encode
function encodeRfc3986Full(str) {
  return str;
}

// Build canonical parts per repo’s RequestSigner
function canonicalize({ url, method, datetime, body = "" }) {
  const u = new URL(url);
  const methodUpper = (method || "GET").toUpperCase();

  // path normalization
  let pathStr = u.pathname || "/";
  if (pathStr !== "/") pathStr = pathStr.replace(/\/{2,}/g, "/");
  if (!pathStr.startsWith("/")) pathStr = "/" + pathStr;

  // query: parse, sort keys, keep values as-is (encodeRfc3986Full is identity)
  const queryObj = {};
  // URLSearchParams returns decoded values; repo’s code effectively treats them as-is
  u.searchParams.forEach((v, k) => {
    if (!(k in queryObj)) queryObj[k] = v;
  });
  const keys = Object.keys(queryObj).sort();
  const queryStr = keys
    .map((k) => `${k}=${encodeRfc3986Full(queryObj[k])}`)
    .join("&");

  // headers for signing: host + x-ebg-param
  const hostHeader = u.host;
  const headersLower = {
    host: hostHeader,
    "x-ebg-param": datetime,
  };
  const headerNames = Object.keys(headersLower).sort();
  const canonicalHeaders =
    headerNames
      .map((k) => `${k}:${String(headersLower[k]).trim().replace(/\s+/g, " ")}`)
      .join("\n") + "\n";
  const signedHeaders = headerNames.join(";");

  return {
    methodUpper,
    pathStr,
    queryStr,
    canonicalHeaders,
    signedHeaders,
    body,
  };
}

async function buildEbgHeaders({ url, method, body = "" }) {
  const datetime = ebgTimestamp();
  const { methodUpper, pathStr, queryStr, canonicalHeaders, signedHeaders } =
    canonicalize({ url, method, datetime, body });

  const bodyHash = await sha256Hex(body);
  const canonicalRequest = [
    methodUpper,
    pathStr,
    queryStr,
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n");

  const stringToSign = `${datetime}\n${await sha256Hex(canonicalRequest)}`;
  const signatureHex = await hmacSha256Hex(EBG_SECRET, stringToSign);
  return {
    "x-ebg-param": base64Ascii(datetime),
    "x-ebg-signature": `v1:${signatureHex}`,
  };
}

async function redeemToken(tokenID) {
  const url = `${AUTH_ENDPOINT}?tokenID=${encodeURIComponent(tokenID)}`;
  const ebg = await buildEbgHeaders({ url, method: "POST" });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "x-ebg-param": ebg["x-ebg-param"],
      "x-ebg-signature": ebg["x-ebg-signature"],
    },
    credentials: "include", // lets cookies set if CORS allows
  });

  const raw = await resp.text();
  const ct = resp.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? JSON.parse(raw) : { raw };
  if (!resp.ok) throw new Error(JSON.stringify(data));
  return data;
}

// Auto-run if ?token=... is present
document.addEventListener("DOMContentLoaded", async () => {
  const currentUrl = new URL(window.location.href);
  const searchParams = currentUrl.searchParams;
  const orgId = searchParams.get("orgId");
  const token = searchParams.get("token");

  if (orgId) {
    try {
      localStorage.setItem("orgId", orgId);
    } catch (e) {}
  }

  if (token) {
    try {
      await redeemToken(token);
    } catch (e) {
      console.error("Redeem failed:", e);
    }
    // Remove both token and orgId (if present) and refresh
    searchParams.delete("token");
    searchParams.delete("orgId");
    const nextSearch = searchParams.toString();
    const nextUrl = `${currentUrl.pathname}${
      nextSearch ? `?${nextSearch}` : ""
    }${currentUrl.hash}`;
    window.location.replace(nextUrl);
    return;
  }

  if (orgId) {
    // No token but orgId present: clean it from URL and refresh
    searchParams.delete("orgId");
    const nextSearch = searchParams.toString();
    const nextUrl = `${currentUrl.pathname}${
      nextSearch ? `?${nextSearch}` : ""
    }${currentUrl.hash}`;
    window.location.replace(nextUrl);
  }
});
