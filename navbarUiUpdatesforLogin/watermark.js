async function checkUserSession() {
  const hostname = window.location.hostname;
  let baseApiUrl;
  let ebgSignature;
  let ebgParam;
  if (
    hostname.includes("webflow.io") ||
    hostname.includes("watermarkremoverz0.de")
  ) {
    baseApiUrl = "https://api.watermarkremoverz0.de"; // staging
    ebgSignature =
      "v1:484bd35d910104abda1830f4d8b8f99f547f4a995b213cd5e977201727a4caef";
    ebgParam = "MjAyNTEwMTNUMDczMDMxWg==";
  } else if (hostname.endsWith("watermarkremover.io")) {
    baseApiUrl = "https://api.watermarkremover.io"; // production
    ebgSignature =
      "v1:361c654f394638e8744650056689e9ba1d3047a6a3aa994168ad1733b85aee1a";
    ebgParam = "MjAyNTEwMTNUMDcyMDE1Wg==";
  } else {
    baseApiUrl = "https://api.watermarkremover.io"; // fallback to prod
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
    // setDisplay(loginBtn, "none");
    setDisplayForAll(userProfile, "none");
    setDisplayForAll(signUp, "flex");
    setDisplayForAll(signUpDivs, "none");
    setDisplayForAll(signUpImgs, "inline");
  }
  function setDataFetchingDoneState(isLoggedIn) {
    if (isLoggedIn) {
      // setDisplay(loginBtn, "none");
      loginBtn.innerHTML = "Logged In";
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
