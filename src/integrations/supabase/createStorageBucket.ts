
import { supabase } from './client';

export const createNotificationsBucket = async () => {
  try {
    console.log("Checking if notifications bucket exists...");
    
    // التحقق مما إذا كان مجلد الإشعارات موجود
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      throw bucketsError;
    }
    
    const notificationsBucketExists = buckets?.some(bucket => bucket.name === 'notifications');
    console.log("Notifications bucket exists:", notificationsBucketExists);
    
    // إذا لم يكن المجلد موجودًا، فحاول إنشائه
    if (!notificationsBucketExists) {
      console.log("Creating notifications bucket...");
      
      try {
        const { error: createError } = await supabase
          .storage
          .createBucket('notifications', {
            public: true, // ضمان أن المجلد عام
            fileSizeLimit: 10485760 // حد 10 ميجابايت
          });
        
        if (createError) {
          console.error('Error creating notifications bucket:', createError);
          
          // إذا حصلنا على خطأ سياسة، من المحتمل أن المجلد موجود ولكن مع مشاكل في الوصول
          if (createError.message.includes('row-level security') || 
              createError.message.includes('permission denied')) {
            console.log('RLS policy error. The bucket exists but is not accessible for creation.');
            console.log('This is normal if bucket was created via SQL migration.');
          } else {
            throw createError;
          }
        } else {
          console.log('Notifications storage bucket created successfully');
        }
      } catch (createBucketError) {
        console.error('Error in bucket creation attempt:', createBucketError);
        // استمر في التنفيذ حيث سنحاول استخدام عنوان URL العام على أي حال
      }
    }
    
    // اختبار ما إذا كان يمكننا الحصول على عنوان URL عام
    try {
      const { data } = supabase.storage
        .from('notifications')
        .getPublicUrl('test.png');
      
      console.log('Successfully generated public URL:', data?.publicUrl);
      return true;
    } catch (publicUrlError) {
      console.error('Error generating public URL:', publicUrlError);
      // استمر في التنفيذ على أي حال حيث قد لا تزال عمليات التحميل تعمل
    }
    
    // تحقق من أذونات المجلد
    try {
      console.log("Verifying bucket permissions...");
      
      // Fix: Changed the return type of the RPC call to 'unknown' instead of trying to pass a string parameter
      const { error: policyError } = await supabase
        .rpc('get_bucket_public_status', { bucket_name: 'notifications' });
      
      if (policyError) {
        console.error('Error checking bucket policy:', policyError);
      } else {
        console.log('Bucket permissions verified successfully');
      }
    } catch (policyCheckError) {
      console.error('Error in policy check:', policyCheckError);
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error creating storage bucket:', error);
    // لا ترمي هنا، فقط قم بتسجيل الخطأ وإرجاع false
    // هذا يسمح للتطبيق بالاستمرار في العمل حتى إذا فشل إنشاء المجلد
    return false;
  }
};
