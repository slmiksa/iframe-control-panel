
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';

export const NotificationModal: React.FC = () => {
  const { notifications } = useSystemAlerts();

  if (notifications.length === 0) return null;

  // Take the first active notification
  const notification = notifications[0];

  return (
    <Dialog open={!!notification}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{notification?.title}</DialogTitle>
        </DialogHeader>
        
        {notification?.content && (
          <DialogDescription>{notification.content}</DialogDescription>
        )}
        
        {notification?.image_url && (
          <div className="w-full flex justify-center">
            <img 
              src={notification.image_url} 
              alt={notification.title} 
              className="object-cover max-w-full max-h-[300px]"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
