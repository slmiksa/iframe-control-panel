
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import Image from 'next/image';

export const NotificationModal: React.FC = () => {
  const { notifications } = useSystemAlerts();

  if (notifications.length === 0) return null;

  // Take the first active notification
  const notification = notifications[0];

  return (
    <Dialog open={!!notification}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{notification.title}</DialogTitle>
        </DialogHeader>
        
        {notification.content && (
          <DialogDescription>{notification.content}</DialogDescription>
        )}
        
        {notification.image_url && (
          <div className="w-full flex justify-center">
            <Image 
              src={notification.image_url} 
              alt={notification.title} 
              width={300} 
              height={300} 
              className="object-cover"
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
