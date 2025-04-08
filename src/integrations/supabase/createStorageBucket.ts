
import { supabase } from './client';

export const createNotificationsBucket = async () => {
  try {
    // Check if the notifications bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      return;
    }
    
    const notificationsBucketExists = buckets?.some(bucket => bucket.name === 'notifications');
    
    // If the bucket doesn't exist, create it
    if (!notificationsBucketExists) {
      const { error: createError } = await supabase
        .storage
        .createBucket('notifications', {
          public: true, // Make it publicly accessible
          fileSizeLimit: 10485760 // 10MB limit
        });
      
      if (createError) {
        console.error('Error creating notifications bucket:', createError);
        return;
      }
      
      console.log('Notifications storage bucket created successfully');
    }
    
    // Update bucket policies to make it public
    // The setPublic method doesn't exist on StorageFileApi, so we use updateBucket instead
    const { error: policyError } = await supabase
      .storage
      .updateBucket('notifications', {
        public: true
      });
      
    if (policyError) {
      console.error('Error setting bucket policies:', policyError);
    } else {
      console.log('Notifications bucket policies updated successfully');
    }
  } catch (error) {
    console.error('Unexpected error creating storage bucket:', error);
  }
};
