
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';

export const NotificationModal: React.FC = () => {
  const { notifications, closeNotification } = useSystemAlerts();
  const [open, setOpen] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<typeof notifications[0] | null>(null);

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
        setCurrentNotification(validNotifications[0]);
        setOpen(true);
      } else {
        setCurrentNotification(null);
        setOpen(false);
      }
    } else {
      setCurrentNotification(null);
      setOpen(false);
    }
  }, [notifications]);

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
        
        {currentNotification.image_url && (
          <div className="w-full flex justify-center py-4">
            <img 
              src={currentNotification.image_url} 
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
