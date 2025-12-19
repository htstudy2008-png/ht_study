// ==========================
//  HỆ THỐNG ĐĂNG NHẬP H&T STUDY
// ==========================
let currentUser = null;

import { auth, db } from "/firebase/firebase.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// TÍNH BASE PATH CHO GITHUB PAGES (project site)
function getBasePath() {
  // Nếu host là *.github.io → đang chạy trên GitHub Pages
  if (window.location.hostname.endsWith("github.io")) {
    // Ví dụ: /HT-STUDY/trang_chu/html/index.html
    const parts = window.location.pathname.split("/");
    // parts[0] = "", parts[1] = "TEN_REPO"
    if (parts.length > 2 && parts[1]) {
      return "/" + parts[1]; // "/TEN_REPO"
    }
  }
  // Nếu chạy local (localhost, file://, hoặc deploy ở root) thì không cần base
  return "";
}

const BASE_PATH  = getBasePath();

// KHÔNG dùng "/" trần nữa, luôn gắn BASE_PATH
const LOGIN_PAGE = BASE_PATH + "/dang-nhap/html/login.html";
const HOME_PAGE  = BASE_PATH + "/trang_chu/html/index.html";

// ==========================
//  HÀM XỬ LÝ USER
// ==========================
function getCurrentUser() {
  return currentUser;
}
async function logout() {
  try {
    await signOut(auth); // logout Firebase thật
    localStorage.removeItem("htstudy_redirect");
    window.location.href = LOGIN_PAGE;
  } catch (e) {
    console.error("Logout error:", e);
  }
}
function refreshUserUI() {
  const nameEl = document.getElementById("user-name-display");
  const codeEl = document.getElementById("user-code-display");
  const authAction = document.getElementById("user-auth-btn");

  const u = getCurrentUser();

  if (!nameEl || !codeEl || !authAction) return;

  if (u) {
    nameEl.textContent = u.email || "Học sinh";
    codeEl.textContent = "Đã đăng nhập";
    authAction.textContent = "Đăng xuất";
  } else {
    nameEl.textContent = "Chưa đăng nhập";
    codeEl.textContent = "Mã học sinh: ---";
    authAction.textContent = "Đăng nhập";
  }
}

// Lưu đường dẫn để quay lại sau login
function saveRedirect(url) {
  let path;
  if (url && typeof url === "string" && url.startsWith("http")) {
    const u = new URL(url);
    path = u.pathname;
  } else if (url) {
    path = url;
  } else {
    path = window.location.pathname;
  }
} 

function loadRedirect() {
  const u = localStorage.getItem("htstudy_redirect");
  return u || HOME_PAGE;
}

// ==========================
//  YÊU CẦU ĐĂNG NHẬP (DÙNG Ở TRANG MÔN HỌC)
// ==========================
function requireAuth() {
  if (!currentUser) {
    saveRedirect(window.location.pathname);
    window.location.href = LOGIN_PAGE;
  }
}

// ==========================
//  KHỞI TẠO SAU KHI DOM SẴN SÀNG
// ==========================
document.addEventListener("DOMContentLoaded", () => {

  // ===== THÔNG BÁO AVATAR (CHỮ MÀU ĐỎ / XANH LÁ) =====
  function showAvatarAlert(msg) {
    const alertBox = document.getElementById("avatar-alert");
    if (!alertBox) return;

    alertBox.textContent = msg;

    // Mặc định: màu đỏ (lỗi)
    let bg = "rgba(255,0,0,0.15)";
    let color = "#ff4d4d";
    let border = "1px solid #ff4d4d";

    // Nếu message có dấu ✔ -> đổi sang màu xanh lá (thành công)
    if (msg.includes("✔")) {
      bg = "rgba(34,197,94,0.15)";
      color = "#22c55e";
      border = "1px solid #22c55e";
    }

    alertBox.style.background = bg;
    alertBox.style.color = color;
    alertBox.style.border = border;

    alertBox.style.display = "block";
    alertBox.style.opacity = "1";
    alertBox.style.transition = "opacity 0.6s ease";

    // 5 giây sau sẽ mờ dần rồi ẩn
    setTimeout(() => {
      alertBox.style.opacity = "0";

      setTimeout(() => {
        alertBox.style.display = "none";
        alertBox.style.opacity = "1"; // reset
      }, 600);
    }, 5000);
  }

  // ---- CHẶN LINK CẦN ĐĂNG NHẬP ----
  document.querySelectorAll("[data-need-login]").forEach(link => {
    link.addEventListener("click", (e) => {
      if (!getCurrentUser()) {
        e.preventDefault();
        // Lưu luôn đường dẫn tuyệt đối (pathname) của link
        saveRedirect(link.href);
        window.location.href = LOGIN_PAGE;
      }
    });
  });

  // ---- XỬ LÝ FORM LOGIN (trang login.html) ----
  const form = document.getElementById("login-form");
  if (form) {
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const code  = document.getElementById("student-code").value.trim();
  const pass  = document.getElementById("password").value.trim();
  const error = document.getElementById("login-error");

  const email = code.toLowerCase() + "@htstudy.local";

  try {
    const res = await signInWithEmailAndPassword(auth, email, pass);

    const snap = await getDoc(doc(db, "users", res.user.uid));
    if (!snap.exists()) throw new Error();

    window.location.href = loadRedirect();
  } catch {
    error.style.display = "block";
    error.textContent = "Sai mã học sinh hoặc mật khẩu.";
  }
});
  }

  // ---- AVATAR + DROPDOWN Ở HEADER ----
  const avatarBtn        = document.getElementById("avatar-btn");
  const dropdown         = document.getElementById("user-dropdown");
  const nameEl           = document.getElementById("user-name-display");
  const codeEl           = document.getElementById("user-code-display");
  const authAction       = document.getElementById("user-auth-btn");
  const changeAvatarBtn  = document.getElementById("btn-change-avatar");
  const avatarFileInput  = document.getElementById("avatar-file");

  // key lưu avatar cho từng học sinh
  function getAvatarKey(code) {
    return "htstudy_avatar_" + code;
  }

  function applyAvatar(user) {
    if (!avatarBtn) return;

    if (!user) {
      // chưa đăng nhập
      avatarBtn.style.backgroundImage = "none";
      avatarBtn.classList.remove("has-image");
      avatarBtn.textContent = "HS";
      return;
    }

    // Lấy avatar từ localStorage
    const stored = localStorage.getItem(getAvatarKey(user.code));

    if (stored) {
      avatarBtn.style.backgroundImage = `url(${stored})`;
      avatarBtn.classList.add("has-image");
      avatarBtn.textContent = "";
    } else {
      avatarBtn.style.backgroundImage = "none";
      avatarBtn.classList.remove("has-image");
      // Lấy 2 chữ cái cuối trong tên làm chữ cái avatar
      const initials = (user.name || "")
        .split(" ")
        .filter(Boolean)
        .slice(-2)
        .map(w => w[0].toUpperCase())
        .join("");
      avatarBtn.textContent = initials || "HS";
    }
  }

  if (avatarBtn && dropdown && nameEl && codeEl && authAction) {

    function refreshUserUI() {
      const u = getCurrentUser();
      if (u) {
        nameEl.textContent = u.name;
        codeEl.textContent = "Mã học sinh: " + u.code;
        authAction.textContent = "Đăng xuất";
      } else {
        nameEl.textContent = "Chưa đăng nhập";
        codeEl.textContent = "Mã học sinh: ---";
        authAction.textContent = "Đăng nhập";
      }
      applyAvatar(u);
    }

    refreshUserUI();

    // Mở / đóng dropdown khi click avatar
    avatarBtn.addEventListener("click", () => {
      dropdown.classList.toggle("open");
    });

    // Click ngoài thì đóng dropdown
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && !avatarBtn.contains(e.target)) {
        dropdown.classList.remove("open");
      }
    });

    // Nút Đăng nhập / Đăng xuất trong dropdown
    authAction.addEventListener("click", () => {
      if (getCurrentUser()) {
        logout();
      } else {
        saveRedirect(window.location.pathname);
        window.location.href = LOGIN_PAGE;
      }
    });

    // Nút "Đổi avatar"
    if (changeAvatarBtn && avatarFileInput) {
      changeAvatarBtn.addEventListener("click", () => {
        const u = getCurrentUser();
        if (!u) {
          showAvatarAlert("⚠ Bạn cần đăng nhập trước khi đổi avatar.");
          saveRedirect(window.location.pathname);
          window.location.href = LOGIN_PAGE;
          return;
        }
        avatarFileInput.value = ""; // reset chọn file
        avatarFileInput.click();
      });

      avatarFileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const MAX_SIZE = 2 * 1024 * 1024; // 2MB

        if (!file.type.startsWith("image/")) {
          showAvatarAlert("⚠ Vui lòng chọn file hình ảnh hợp lệ!");
          return;
        }

        if (file.size > MAX_SIZE) {
          showAvatarAlert("⚠ Ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          const u = getCurrentUser();
          if (!u) return;

          localStorage.setItem(getAvatarKey(u.code), reader.result);
          applyAvatar(u);
          showAvatarAlert("✔ Avatar đã được cập nhật!");
        };

        reader.readAsDataURL(file);
      });
    }
  }

  // ---- GIỮ LẠI NÚT ĐĂNG NHẬP CŨ NẾU CÓ (sidebar) ----
  function setupAuthButton(el) {
    if (!el) return;
    el.textContent = getCurrentUser() ? "Đăng xuất" : "Đăng nhập";
    el.onclick = (e) => {
      e.preventDefault();
      if (getCurrentUser()) logout();
      else {
        saveRedirect(window.location.pathname);
        window.location.href = LOGIN_PAGE;
      }
    };
  }

  // Nút ở sidebar (nếu có)
  setupAuthButton(document.getElementById("auth-button-sidebar"));
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
  } else {
    const snap = await getDoc(doc(db, "users", user.uid));
    if (snap.exists()) {
      currentUser = {
        uid: user.uid,
        email: user.email,
        role: snap.data().role,
        courses: snap.data().courses || []
      };
    }
  }

  // refresh UI nếu có
  if (typeof refreshUserUI === "function") {
    refreshUserUI();
  }
});

});
// ==========================
//  KẾT THÚC FILE auth.js
// ==========================


