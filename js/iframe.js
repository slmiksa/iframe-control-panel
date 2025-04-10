
// معالجة URL الخاص بـ iframe
let iframeUrl = '';
let isLoading = false;

// تحميل URL المحفوظ من التخزين المحلي
function loadSavedUrl() {
  const savedUrl = localStorage.getItem('iframeUrl');
  iframeUrl = savedUrl || '';
  return iframeUrl;
}

// حفظ URL في التخزين المحلي
function saveIframeUrl(url) {
  iframeUrl = url;
  localStorage.setItem('iframeUrl', url);
}

// تحديث عرض iframe
function updateIframeDisplay() {
  const iframeContainer = document.getElementById('iframe-container');
  
  // مسح المحتوى الحالي
  iframeContainer.innerHTML = '';
  
  if (iframeUrl) {
    // إنشاء وإضافة iframe
    const iframe = document.createElement('iframe');
    iframe.src = iframeUrl;
    iframe.className = 'full-height';
    iframe.title = 'Embedded Website';
    iframe.setAttribute('sandbox', 'allow-same-origin allow-scripts allow-popups allow-forms');
    
    iframeContainer.appendChild(iframe);
  } else {
    // عرض رسالة الترحيب عندما لا يكون هناك URL
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'welcome-message';
    
    // إضافة شعار
    const logo = document.createElement('div');
    logo.className = 'logo logo-giant';
    welcomeMessage.appendChild(logo);
    
    // إضافة عنوان
    const heading = document.createElement('h2');
    heading.textContent = 'لم يتم تحديد رابط بعد. يرجى تسجيل الدخول لإضافة رابط.';
    welcomeMessage.appendChild(heading);
    
    iframeContainer.appendChild(welcomeMessage);
  }
}

// تحديث معلومات URL في لوحة التحكم
function updateUrlInfo() {
  const currentUrlElement = document.getElementById('current-url');
  const urlStatusElement = document.getElementById('url-status');
  
  if (currentUrlElement && urlStatusElement) {
    if (iframeUrl) {
      currentUrlElement.textContent = iframeUrl;
      urlStatusElement.textContent = 'نشط';
      urlStatusElement.className = 'text-green-500';
    } else {
      currentUrlElement.textContent = 'لا يوجد رابط محدد';
      urlStatusElement.textContent = 'غير محدد';
      urlStatusElement.className = 'text-red-500';
    }
  }
}

// تعيين URL جديد للـ iframe
async function setIframeUrl(url) {
  isLoading = true;
  
  // محاكاة تأخير الشبكة
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        saveIframeUrl(url);
        updateIframeDisplay();
        updateUrlInfo();
        resolve();
      } catch (error) {
        console.error('Error updating URL:', error);
        reject(error);
      } finally {
        isLoading = false;
      }
    }, 500);
  });
}

// إعداد نموذج URL
function setupUrlForm() {
  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('iframe-url');
  const urlSpinner = document.getElementById('url-spinner');
  const clearUrlButton = document.getElementById('clear-url');
  const clearUrlSpinner = document.getElementById('clear-url-spinner');
  
  // ملء حقل الإدخال بالقيمة المحفوظة
  if (urlInput) {
    urlInput.value = iframeUrl;
  }
  
  // تمكين أو تعطيل زر المسح بناءً على وجود URL
  if (clearUrlButton) {
    clearUrlButton.disabled = !iframeUrl;
  }
  
  if (urlForm) {
    urlForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      let formattedUrl = urlInput.value.trim();
      
      if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      if (!formattedUrl) {
        showToast('يرجى إدخال رابط صالح', 'error');
        return;
      }
      
      urlSpinner.classList.remove('hidden');
      
      try {
        await setIframeUrl(formattedUrl);
        showToast('تم تحديث رابط الموقع', 'success');
        navigateTo('home');
      } catch (error) {
        showToast('حدث خطأ أثناء تحديث الرابط', 'error');
      } finally {
        urlSpinner.classList.add('hidden');
      }
    });
  }
  
  if (clearUrlButton) {
    clearUrlButton.addEventListener('click', async function() {
      clearUrlSpinner.classList.remove('hidden');
      
      try {
        await setIframeUrl('');
        urlInput.value = '';
        showToast('تم حذف الرابط وعرض الصفحة البيضاء', 'success');
        navigateTo('home');
      } catch (error) {
        showToast('حدث خطأ أثناء حذف الرابط', 'error');
      } finally {
        clearUrlSpinner.classList.add('hidden');
      }
    });
  }
}
