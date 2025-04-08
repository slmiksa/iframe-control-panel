
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

export const NotificationModal: React.FC = () => {
  const { activeNotification, dismissNotification } = useSystemAlerts();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchImage = async () => {
      if (activeNotification?.image_path) {
        try {
          const { data, error } = await supabase
            .storage
            .from('notification_images')
            .download(activeNotification.image_path);
          
          if (error) {
            console.error("Error downloading notification image:", error);
            return;
          }
          
          if (data) {
            const url = URL.createObjectURL(data);
            setImageUrl(url);
          }
        } catch (error) {
          console.error("Error processing notification image:", error);
        }
      }
    };
    
    if (activeNotification) {
      fetchImage();
    } else {
      // Clean up any created object URLs when notification is dismissed
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        setImageUrl(null);
      }
    }
    
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [activeNotification]);
  
  if (!activeNotification) {
    return null;
  }
  
  return (
    <Dialog open={!!activeNotification} onOpenChange={() => dismissNotification()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{activeNotification.title}</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={() => dismissNotification()}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        
        {imageUrl && (
          <div className="mb-4 flex justify-center">
            <img 
              src={imageUrl} 
              alt={activeNotification.title} 
              className="max-h-48 rounded-md object-contain" 
            />
          </div>
        )}
        
        <DialogDescription className="text-base">
          {activeNotification.content}
        </DialogDescription>
        
        <div className="mt-4 flex justify-end">
          <Button onClick={() => dismissNotification()}>تم</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
