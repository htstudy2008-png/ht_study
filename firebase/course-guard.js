import { auth, db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export function requireCourse(courseId) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      location.href = "/dang-nhap/login.html";
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    if (!snap.exists()) {
      alert("Không tìm thấy user");
      location.href = "/";
      return;
    }

    const courses = snap.data().courses || [];
    if (!courses.includes(courseId)) {
      alert("Bạn chưa có quyền học khóa này");
      location.href = "/";
    }
  });
}
