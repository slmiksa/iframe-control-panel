
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { supabase } from '@/integrations/supabase/client';
import { createNotificationsBucket } from '@/integrations/supabase/createStorageBucket';

export const NotificationModal: React.FC = () => {
  const { notifications, closeNotification } = useSystemAlerts();
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<typeof notifications[0] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  // إنشاء المجلد عند تحميل المكون
  useEffect(() => {
    async function setupBucket() {
      try {
        console.log("Setting up notifications bucket in NotificationModal");
        await createNotificationsBucket();
      } catch (err) {
        console.error("Failed to prepare notifications bucket:", err);
      }
    }
    setupBucket();
  }, []);

  useEffect(() => {
    if (notifications.length > 0) {
      // الحصول على أول إشعار نشط وصالح بناءً على الوقت
      const now = new Date();
      const validNotifications = notifications.filter(notification => {
        const startTime = new Date(notification.start_time);
        const endTime = new Date(notification.end_time);
        return now >= startTime && now <= endTime && notification.is_active;
      });
      
      console.log("Valid notifications count:", validNotifications.length);
      
      if (validNotifications.length > 0) {
        const notification = validNotifications[0];
        console.log("Selected notification:", notification);
        setCurrentNotification(notification);
        setOpen(true);
        setImageError(false);
        
        // الحصول على الرابط العام للصورة إذا كانت موجودة
        if (notification.image_url) {
          getPublicImageUrl(notification.image_url);
        } else {
          setImageUrl(null);
        }
      } else {
        setCurrentNotification(null);
        setOpen(false);
        setImageUrl(null);
      }
    } else {
      setCurrentNotification(null);
      setOpen(false);
      setImageUrl(null);
    }
  }, [notifications]);

  const getPublicImageUrl = async (path: string) => {
    try {
      console.log("Getting image URL for path:", path);
      
      if (!path) {
        console.log("No image path provided");
        setImageUrl(null);
        setImageError(true);
        return;
      }
      
      // الحصول على الرابط العام
      const { data } = supabase.storage
        .from('notifications')
        .getPublicUrl(path);
      
      console.log("Public URL response:", data);
      
      if (data && data.publicUrl) {
        console.log("Image public URL:", data.publicUrl);  
        setImageUrl(data.publicUrl);
        setImageError(false);
      } else {
        console.error('Failed to get public URL');
        setImageError(true);
        setImageUrl(null);
      }
    } catch (error) {
      console.error('Error getting image URL:', error);
      setImageError(true);
      setImageUrl(null);
    }
  };

  const handleImageError = () => {
    console.log("Image failed to load");
    setImageError(true);
  };

  const handleClose = async () => {
    if (currentNotification) {
      await closeNotification(currentNotification.id);
      setOpen(false);
    }
  };

  if (!currentNotification) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && currentNotification) handleClose();
      setOpen(isOpen);
    }}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>{currentNotification.title}</DialogTitle>
          {currentNotification.content && (
            <DialogDescription>{currentNotification.content}</DialogDescription>
          )}
        </DialogHeader>
        
        {imageUrl && !imageError && (
          <div className="w-full flex justify-center py-4">
            <img 
              src={imageUrl}
              alt={currentNotification.title} 
              className="object-cover max-w-full max-h-[300px] rounded-md"
              onError={handleImageError}
            />
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={handleClose} variant="outline" className="w-full">
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
