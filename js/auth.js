
// المستخدمين المسموح لهم بالوصول إلى لوحة التحكم
const ADMINS = [
  { username: 'admin', password: 'admin123' },
  // يمكنك إضافة المزيد من المستخدمين هنا
];

// متغير لتتبع حالة تسجيل الدخول
let isLoggedIn = false;

// التحقق من حالة تسجيل الدخول عند بدء التطبيق
function checkLoginStatus() {
  const savedLoginStatus = localStorage.getItem('isLoggedIn');
  isLoggedIn = savedLoginStatus === 'true';
  return isLoggedIn;
}

// تسجيل الدخول
function login(username, password) {
  // التحقق مما إذا كانت بيانات الاعتماد صالحة
  const admin = ADMINS.find(admin => 
    admin.username === username && admin.password === password
  );
  
  if (admin) {
    isLoggedIn = true;
    localStorage.setItem('isLoggedIn', 'true');
    return true;
  }
  
  return false;
}

// تسجيل الخروج
function logout() {
  isLoggedIn = false;
  localStorage.setItem('isLoggedIn', 'false');
}

// إعداد نموذج تسجيل الدخول
function setupLoginForm() {
  const loginForm = document.getElementById('login-form');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const loginSpinner = document.getElementById('login-spinner');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = usernameInput.value;
      const password = passwordInput.value;
      
      // عرض مؤشر التحميل
      loginSpinner.classList.remove('hidden');
      
      // محاكاة تأخير الشبكة
      setTimeout(() => {
        const success = login(username, password);
        
        if (success) {
          showToast('تم تسجيل الدخول بنجاح', 'success');
          navigateTo('control-panel');
        } else {
          showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
        }
        
        // إخفاء مؤشر التحميل
        loginSpinner.classList.add('hidden');
      }, 500);
    });
  }
}

// إعداد زر تسجيل الخروج
function setupLogoutButton() {
  const logoutButton = document.getElementById('logout');
  
  if (logoutButton) {
    logoutButton.addEventListener('click', function() {
      logout();
      showToast('تم تسجيل الخروج بنجاح', 'success');
      navigateTo('home');
    });
  }
}

// إعداد زر العودة إلى الموقع
function setupBackButton() {
  const backButton = document.getElementById('back-to-site');
  
  if (backButton) {
    backButton.addEventListener('click', function() {
      navigateTo('home');
    });
  }
}
