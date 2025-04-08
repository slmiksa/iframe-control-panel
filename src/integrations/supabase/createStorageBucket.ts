
import { supabase } from './client';

export const createNotificationsBucket = async () => {
  try {
    // Check if bucket already exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error("Error checking notification buckets:", bucketsError);
      return false;
    }
    
    const notificationBucketExists = buckets?.some(bucket => bucket.name === 'notification_images');
    
    if (!notificationBucketExists) {
      console.log("Notification images bucket doesn't exist. It should be created via SQL.");
    } else {
      console.log("Notification images bucket exists");
    }
    
    return notificationBucketExists;
  } catch (error) {
    console.error("Error creating notifications bucket:", error);
    return false;
  }
};
