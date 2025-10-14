async function checkUserSession() {
  const hostname = window.location.hostname;
  let baseApiUrl;
  let ebgSignature;
  let ebgParam;

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

  const URL = `${baseApiUrl}/service/panel/users/v1.0/session`;
  const headers = {
    accept: "application/json, text/plain, */*",
    "x-ebg-param": ebgParam,
    "x-ebg-signature": ebgSignature,
  };

  // Get DOM elements
  const loginBtn = document.querySelector("#login-btn");
  const signupBtn = document.querySelector("#signup-btn");
  const userProfile = document.querySelector("#user_profile");
  const loader = document.querySelector("#session-check-loader");

  // Verify elements exist
  if (!loginBtn || !signupBtn || !userProfile || !loader) {
    console.error(":x: Required elements not found:", {
      loginBtn: !!loginBtn,
      signupBtn: !!signupBtn,
      userProfile: !!userProfile,
      loader: !!loader,
    });
    return;
  }

  function setLoadingState() {
    // Hide everything
    loginBtn.style.display = "none";
    signupBtn.style.display = "none";
    userProfile.style.display = "none";

    // Show only the loader
    loader.style.display = "block";
  }

  function setCompletedState(isLoggedIn) {
    // Hide the loader
    loader.style.display = "none";

    if (isLoggedIn) {
      // User IS logged in - show only profile
      loginBtn.style.display = "none";
      signupBtn.style.display = "none";
      userProfile.style.display = "flex";
    } else {
      // User is NOT logged in - show login and signup buttons
      loginBtn.style.display = "flex";
      signupBtn.style.display = "flex";
      userProfile.style.display = "none";
    }
  }

  // Set loading state immediately
  setLoadingState();

  try {
    // Make API call to check session
    const APIresponse = await fetch(URL, {
      headers,
      method: "GET",
      credentials: "include",
    });

    if (!APIresponse.ok) {
      throw new Error(`HTTP ${APIresponse.status}`);
    }

    const data = await APIresponse.json();
    const user = data?.session?.passport?.user;

    if (user?.firstName) {
      // User found - update profile
      const profileInitial = userProfile.querySelector("#profile-initial");

      if (profileInitial) {
        profileInitial.textContent = user.firstName.charAt(0).toUpperCase();
        profileInitial.style.display = "flex";
      }

      // Hide loader, show profile
      setCompletedState(true);
    } else {
      // No user data found
      throw new Error("User not found");
    }
  } catch (err) {
    // API error or no user - show logged-out state
    console.error("Session check failed:", err.message);
    setCompletedState(false);
  }
}
// Execute when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", checkUserSession);
} else {
  checkUserSession();
}
