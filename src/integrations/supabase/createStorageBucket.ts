
import { supabase } from './client';

export const createNotificationsBucket = async () => {
  try {
    console.log("Checking if notifications bucket exists...");
    
    // Check if the notifications bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      console.error('Error checking storage buckets:', bucketsError);
      throw bucketsError;
    }
    
    const notificationsBucketExists = buckets?.some(bucket => bucket.name === 'notifications');
    console.log("Notifications bucket exists:", notificationsBucketExists);
    
    // If the bucket doesn't exist, create it
    if (!notificationsBucketExists) {
      console.log("Creating notifications bucket...");
      const { error: createError } = await supabase
        .storage
        .createBucket('notifications', {
          public: true,
          fileSizeLimit: 10485760 // 10MB limit
        });
      
      if (createError) {
        console.error('Error creating notifications bucket:', createError);
        throw createError;
      }
      
      console.log('Notifications storage bucket created successfully');
    }
    
    // Update bucket policies to make it public
    console.log("Updating bucket policies...");
    const { error: policyError } = await supabase
      .storage
      .updateBucket('notifications', {
        public: true
      });
      
    if (policyError) {
      console.error('Error setting bucket policies:', policyError);
      throw policyError;
    } else {
      console.log('Notifications bucket policies updated successfully');
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error creating storage bucket:', error);
    throw error;
  }
};
