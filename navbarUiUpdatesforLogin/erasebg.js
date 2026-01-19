async function checkUserSession() {
  const hostname = window.location.hostname;
  let baseApiUrl;
  let ebgSignature;
  let ebgParam;

  if (hostname.includes("webflow.io") || hostname.includes("erasez0.de")) {
    baseApiUrl = "https://api.erasez0.de"; // staging
    ebgSignature =
      "v1:896bd7ed83dee57bf32e17c8d701db2cf2f101808da8a95ebaad8a37b9bb8b82";
    ebgParam = "MjAyNTEwMTVUMTA1NTI0Wg==";
  } else if (hostname.endsWith("erase.bg")) {
    baseApiUrl = "https://api.erase.bg"; // production
    ebgSignature =
      "v1:54de71eb54649f596a30fd5e1062c461b09d11ee126bf00a06eddf0fdbfe5ea7";
    ebgParam = "MjAyNTEwMTVUMTA1NjQzWg==";
  } else {
    baseApiUrl = "https://api.erase.bg"; // fallback to prod
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
