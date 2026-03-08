/* =========================
   你需要填的設定
========================= */
const CONFIG = {
	CLIENT_ID:
		"848991487124-so803dloq4c6mdbtlbd3oujek82p3pom.apps.googleusercontent.com",
	SCOPES:
		"https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
};

/* =========================
   全域狀態
========================= */
let accessToken = "";
let tokenClient = null;
let gisReady = false;

/* =========================
   DOM
========================= */
const btnSignIn = document.querySelector("#btnSignIn");
const btnSignOut = document.querySelector("#btnSignOut");
const statusEl = document.querySelector("#status");
const loginCard = document.querySelector("#loginCard");
const profileCard = document.querySelector("#profileCard");
const userNameEl = document.querySelector("#userName");
const userEmailEl = document.querySelector("#userEmail");
const userAvatarEl = document.querySelector("#userAvatar");

/* =========================
   給 index.html 的 GSI onload 呼叫
========================= */
window.onGisLoaded = function () {
	gisReady = true;

	if (!window.google || !google.accounts || !google.accounts.oauth2) {
		setStatus("Google 登入元件載入異常", true);
		return;
	}

	tokenClient = google.accounts.oauth2.initTokenClient({
		client_id: CONFIG.CLIENT_ID,
		scope: CONFIG.SCOPES,
		callback: async (resp) => {
			if (!resp || !resp.access_token) {
				setStatus("登入失敗，沒有取得 access token", true);
				return;
			}

			accessToken = resp.access_token;
			setStatus("登入成功，讀取使用者資料中...", false);

			try {
				const res = await fetch(
					"https://www.googleapis.com/oauth2/v2/userinfo",
					{
						headers: { Authorization: `Bearer ${accessToken}` },
					},
				);
				const userData = await res.json();
				showProfile(userData);
			} catch (err) {
				console.error("取得使用者資料失敗:", err);
				setStatus("無法讀取使用者資料", true);
			}
		},
	});

	btnSignIn.disabled = false;
	setStatus("已就緒，可以登入 Google", false);
};

/* =========================
   事件綁定
========================= */
btnSignIn.addEventListener("click", () => {
	if (!gisReady || !tokenClient) {
		setStatus("Google 登入元件尚未就緒，請稍後再試", true);
		return;
	}
	if (!CONFIG.CLIENT_ID || CONFIG.CLIENT_ID.includes("在這裡")) {
		setStatus("請先在 app.js 填入 CLIENT_ID", true);
		return;
	}
	tokenClient.requestAccessToken({ prompt: "consent" });
});

btnSignOut.addEventListener("click", () => {
	if (window.google && google.accounts && google.accounts.oauth2) {
		google.accounts.oauth2.revoke(accessToken, () => {
			resetToLogin();
		});
	} else {
		resetToLogin();
	}
});

/* =========================
   UI 切換
========================= */
function showProfile(userData) {
	const name = userData.name || "使用者";
	const email = userData.email || "";
	const picture = userData.picture || "";

	userNameEl.textContent = name;
	userEmailEl.textContent = email;

	if (picture) {
		userAvatarEl.innerHTML = `<img src="${picture}" alt="${name}" />`;
	} else {
		userAvatarEl.textContent = name.charAt(0).toUpperCase();
	}

	loginCard.classList.add("hidden");
	profileCard.classList.remove("hidden");
}

function resetToLogin() {
	accessToken = "";
	loginCard.classList.remove("hidden");
	profileCard.classList.add("hidden");
	setStatus("已登出", false);
}

function setStatus(msg, isError) {
	statusEl.textContent = msg;
	statusEl.style.color = isError ? "#ff5d5d" : "#a9b6d3";
}

/* =========================
  若 GIS 在 app.js 執行前就已從快取載入完畢
========================= */
if (window.google && google.accounts && google.accounts.oauth2) {
	window.onGisLoaded();
}
