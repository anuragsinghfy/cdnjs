if (hostname.includes("webflow.io") || hostname.includes("upscalez0.de")) {
  baseApiUrl = "https://api.upscalez0.de"; // staging
  ebgSignature =
    "v1:f5ec5cc40dbbe1a1c3f50f073ed11da8ccbbd1a14c7259b6642b92172cb11114";
  ebgParam = "MjAyNTEwMTRUMTAwMzA5Wg==";
} else if (hostname.endsWith("upscale.media")) {
  baseApiUrl = "https://api.upscale.media"; // production
  ebgSignature =
    "v1:08b88913fc68ce058399d95f6284d6a9f0992c6c8a1755faa2d87529d65a8c55";
  ebgParam = "MjAyNTEwMTRUMDk0ODM3Wg==";
} else {
  baseApiUrl = "https://api.upscale.media"; // fallback to prod
}
