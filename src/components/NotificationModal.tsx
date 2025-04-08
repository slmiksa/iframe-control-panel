
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { AspectRatio } from "@/components/ui/aspect-ratio";

export const NotificationModal: React.FC = () => {
  const { activeNotification, dismissNotification } = useSystemAlerts();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchImage = async () => {
      // Use image_url from the notification
      const imagePath = activeNotification?.image_url;
      
      if (imagePath) {
        try {
          const { data, error } = await supabase
            .storage
            .from('notification_images')
            .download(imagePath);
          
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
  
  const handleDismiss = () => {
    // Make sure to properly dismiss the notification
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
    dismissNotification();
  };
  
  if (!activeNotification) {
    return null;
  }
  
  return (
    <Dialog open={!!activeNotification} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{activeNotification.title}</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        
        {imageUrl && (
          <div className="mb-6">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
              <img 
                src={imageUrl} 
                alt={activeNotification.title} 
                className="w-full h-full object-contain" 
              />
            </AspectRatio>
          </div>
        )}
        
        <DialogDescription className="text-lg">
          {activeNotification.content}
        </DialogDescription>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={handleDismiss} size="lg" className="px-6">تم</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
