
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
    
    // If the bucket doesn't exist, try to create it
    if (!notificationsBucketExists) {
      console.log("Creating notifications bucket...");
      
      try {
        const { error: createError } = await supabase
          .storage
          .createBucket('notifications', {
            public: true,
            fileSizeLimit: 10485760 // 10MB limit
          });
        
        if (createError) {
          // If we get a policy error, the bucket likely exists but with RLS issues
          console.error('Error creating notifications bucket:', createError);
          
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
        // Continue execution as we'll try to use the public URL anyway
      }
    }
    
    // Test if we can get a public URL
    try {
      const { data } = supabase.storage
        .from('notifications')
        .getPublicUrl('test.png');
      
      console.log('Successfully generated public URL:', data?.publicUrl);
      return true;
    } catch (publicUrlError) {
      console.error('Error generating public URL:', publicUrlError);
      // Continue execution anyway as uploads might still work
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error creating storage bucket:', error);
    // Don't throw here, just log the error and return false
    // This allows the app to continue functioning even if bucket creation fails
    return false;
  }
};
