
import { supabase } from "./client";

export const createNotificationsBucket = async () => {
  const { data, error } = await supabase.storage.createBucket('notifications', {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024 // 10MB
  });

  if (error) {
    console.error("Error creating notifications bucket:", error);
    return false;
  }

  return true;
};
