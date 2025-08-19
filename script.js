// فتح و إغلاق المودالات
const openModal = (m)=> m.classList.add("active");
const closeModal = (m)=> m.classList.remove("active");

// مراجع للمودالات
const roomModal = document.getElementById("roomModal");

// زر MR.K يفتح نافذة معلومات الغرفة
document.getElementById("devInfoBtn").addEventListener("click", ()=> openModal(roomModal));

// زر التحديث يعيد تحميل الصفحة
document.getElementById("refreshBtn").addEventListener("click", ()=> location.reload());
