
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { supabase } from '@/integrations/supabase/client';

export const NotificationModal: React.FC = () => {
  const { notifications, closeNotification } = useSystemAlerts();
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<typeof notifications[0] | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      // Get the first active notification that is currently valid based on time
      const now = new Date();
      const validNotifications = notifications.filter(notification => {
        const startTime = new Date(notification.start_time);
        const endTime = new Date(notification.end_time);
        return now >= startTime && now <= endTime;
      });
      
      if (validNotifications.length > 0) {
        const notification = validNotifications[0];
        setCurrentNotification(notification);
        setOpen(true);
        
        // Get public URL for image if there is one
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
      const { data } = supabase.storage
        .from('notifications')
        .getPublicUrl(path);
        
      setImageUrl(data.publicUrl);
    } catch (error) {
      console.error('Error getting image URL:', error);
      setImageUrl(null);
    }
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentNotification.title}</DialogTitle>
          {currentNotification.content && (
            <DialogDescription>{currentNotification.content}</DialogDescription>
          )}
        </DialogHeader>
        
        {imageUrl && (
          <div className="w-full flex justify-center py-4">
            <img 
              src={imageUrl}
              alt={currentNotification.title} 
              className="object-cover max-w-full max-h-[300px]"
            />
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={handleClose} variant="outline">
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
