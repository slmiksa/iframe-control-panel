
// تحديد الصفحة المراد عرضها
function navigateTo(pageName) {
  const pages = document.querySelectorAll('.page');
  
  // إخفاء جميع الصفحات
  pages.forEach(page => {
    page.classList.add('hidden');
  });
  
  // عرض الصفحة المطلوبة
  const targetPage = document.getElementById(`${pageName}-page`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
  }
  
  // إذا كانت صفحة لوحة التحكم، تأكد من أن المستخدم مسجل الدخول
  if (pageName === 'control-panel' && !isLoggedIn) {
    navigateTo('login');
    return;
  }
}

// عرض إشعار
function showToast(message, type = 'info') {
  let backgroundColor;
  
  // تحديد لون خلفية الإشعار بناءً على النوع
  switch (type) {
    case 'success':
      backgroundColor = '#10b981'; // أخضر
      break;
    case 'error':
      backgroundColor = '#ef4444'; // أحمر
      break;
    case 'warning':
      backgroundColor = '#f59e0b'; // برتقالي
      break;
    default:
      backgroundColor = '#3b82f6'; // أزرق
  }
  
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "left",
    style: {
      background: backgroundColor,
      borderRadius: "5px",
      direction: "rtl",
      textAlign: "right"
    }
  }).showToast();
}

// ضبط السنة الحالية في تذييل الصفحة
function setCurrentYear() {
  const currentYearElement = document.getElementById('current-year');
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
  }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  // التحقق من حالة تسجيل الدخول
  const loggedIn = checkLoginStatus();
  
  // تحميل URL المحفوظ
  loadSavedUrl();
  
  // تحديث عرض iframe
  updateIframeDisplay();
  
  // تحديث معلومات URL في لوحة التحكم
  updateUrlInfo();
  
  // إعداد نموذج تسجيل الدخول
  setupLoginForm();
  
  // إعداد نموذج URL
  setupUrlForm();
  
  // إعداد زر تسجيل الخروج
  setupLogoutButton();
  
  // إعداد زر العودة إلى الموقع
  setupBackButton();
  
  // ضبط السنة الحالية
  setCurrentYear();
  
  // تحديد الصفحة الأولية
  if (loggedIn) {
    // إذا كان المستخدم مسجل الدخول، يمكنه الوصول إلى لوحة التحكم
    navigateTo('home');
  } else {
    // إذا لم يكن مسجل الدخول، عرض الصفحة الرئيسية
    navigateTo('home');
  }
});

// معالجة الانتقال إلى صفحة تسجيل الدخول
document.addEventListener('click', function(e) {
  // البحث عن جميع الروابط المؤدية إلى صفحة تسجيل الدخول
  if (e.target.matches('[href*="login"], [data-link="login"]')) {
    e.preventDefault();
    navigateTo('login');
  }
});

// إنشاء مجلد الأصول إذا لم يكن موجودًا
function createAssetsFolder() {
  // ملاحظة: هذه الوظيفة رمزية، لأن JavaScript في المتصفح لا يمكنه إنشاء مجلدات
  // ستحتاج إلى إنشاء مجلد assets يدويًا ووضع الصور فيه
  console.log("تذكر أن تقوم بإنشاء مجلد 'assets' ووضع ملف الشعار فيه");
}

// استدعاء دالة إنشاء مجلد الأصول (مجرد تذكير)
createAssetsFolder();
