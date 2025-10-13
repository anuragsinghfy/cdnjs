async function checkUserSession() {
  const hostname = window.location.hostname;
  let baseApiUrl;
  let ebgSignature;
  let ebgParam;
  if (
    hostname.includes("webflow.io") ||
    hostname.includes("watermarkremoverz0.de")
  ) {
    baseApiUrl = "https://api.pixelbinz0.de"; // staging
    ebgSignature =
      "v1:afdecd809329f3827059d4a7c2e9aaf15a98cd46b2b818a3eecee29b64b06066";
    ebgParam = "MjAyNTA1MjhUMDk0MDA5Wg==";
  } else if (hostname.endsWith("watermarkremover.io")) {
    baseApiUrl = "https://api.pixelbin.io"; // production
    ebgSignature =
      "v1:54c02cba15001bd4ec8059bc1bcd9a2dfe59226eb9ba58b9dd8fa70fe76abc30";
    ebgParam = "MjAyNTA1MjhUMDkyOTMzWg==";
  } else {
    baseApiUrl = "https://api.pixelbin.io"; // fallback to prod
  }
  const URL = `${baseApiUrl}/service/panel/users/v1.0/session`;
  const headers = {
    accept: "application/json, text/plain, */*",
    "x-ebg-param": ebgParam,
    "x-ebg-signature": ebgSignature,
  };
  const loginBtn = document.querySelector(".login");
  const userProfile = [
    document.querySelector("#user_profile"),
    document.querySelector("#nav-dashboard_btn_tablet"),
  ].filter(Boolean);
  const signUp = [
    document.querySelector("#sign-up"),
    document.querySelector("#sign-up-tablet"),
  ].filter(Boolean);
  const signUpDivs = signUp
    .map((element) => element.querySelector("div"))
    .filter(Boolean);
  const signUpImgs = signUp
    .map((element) => element.querySelector("img"))
    .filter(Boolean);

  const setDisplay = (element, value) => {
    if (element) {
      element.style.display = value;
    }
  };
  const setDisplayForAll = (elements, value) =>
    elements.forEach((element) => setDisplay(element, value));

  function setDataFetchingState() {
    setDisplay(loginBtn, "none");
    setDisplayForAll(userProfile, "none");
    setDisplayForAll(signUp, "flex");
    setDisplayForAll(signUpDivs, "none");
    setDisplayForAll(signUpImgs, "inline");
  }
  function setDataFetchingDoneState(isLoggedIn) {
    if (isLoggedIn) {
      setDisplay(loginBtn, "none");
      setDisplayForAll(signUp, "none");
      setDisplayForAll(userProfile, "flex");
    } else {
      setDisplay(loginBtn, "flex");
      setDisplayForAll(userProfile, "none");
      setDisplayForAll(signUpDivs, "block");
      setDisplayForAll(signUpImgs, "none");
    }
  }
  setDataFetchingState();
  try {
    const APIresponse = await fetch(URL, {
      headers,
      method: "GET",
      credentials: "include",
    });
    const data = await APIresponse.json();
    const user = data?.session?.passport?.user;
    if (user) {
      setDataFetchingDoneState(true);
      userProfile.forEach((ele) => {
        const userNameText = ele.querySelector("#user-name-text");
        const profilePic = ele.querySelector("#profile-pic");
        const profileInitial = ele.querySelector("#profile-initial");
        if (userNameText) {
          userNameText.textContent = `Hi, ${user.firstName}`;
        }
        setDisplay(profilePic, "none");
        if (profileInitial) {
          profileInitial.textContent = `${user.firstName.charAt(0)}`;
        }
      });
    } else {
      throw new Error("User not found");
    }
  } catch (err) {
    setDataFetchingDoneState(false);
  }
}
document.addEventListener("DOMContentLoaded", checkUserSession);
