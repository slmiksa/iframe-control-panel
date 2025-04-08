
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
  const [isOpen, setIsOpen] = useState(false);
  
  // تعيين حالة الفتح عند تغيير الإشعار النشط
  useEffect(() => {
    if (activeNotification) {
      setIsOpen(true);
    }
  }, [activeNotification]);
  
  useEffect(() => {
    const fetchImage = async () => {
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

  // آلية مراقبة انتهاء وقت الإشعار والإغلاق التلقائي
  useEffect(() => {
    if (!activeNotification) return;
    
    const endTime = new Date(activeNotification.end_time).getTime();
    const now = new Date().getTime();
    const timeRemaining = endTime - now;
    
    console.log("Notification auto-close setup:", {
      id: activeNotification.id,
      title: activeNotification.title,
      endTime: new Date(endTime).toLocaleString(),
      now: new Date(now).toLocaleString(),
      timeRemaining: Math.round(timeRemaining / 1000) + " seconds"
    });

    // إذا كان الوقت قد انتهى بالفعل
    if (timeRemaining <= 0) {
      console.log("Notification already expired, closing immediately");
      handleClose();
      return;
    }

    // إعداد مؤقت لإغلاق الإشعار عند انتهاء وقته
    const timerId = setTimeout(() => {
      console.log("Notification time expired, auto-closing", activeNotification.id);
      handleClose();
    }, timeRemaining);

    // تنظيف المؤقت عند إزالة المكون
    return () => {
      console.log("Cleaning up notification timer");
      clearTimeout(timerId);
    };
  }, [activeNotification]);
  
  const handleClose = () => {
    setIsOpen(false);
    
    // تأخير إغلاق الإشعار بشكل كامل للسماح بانتهاء الانتقالات
    setTimeout(() => {
      handleDismiss();
    }, 300);
  };
  
  const handleDismiss = () => {
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[1200px] md:max-w-[1400px] w-[98vw] max-h-[90vh] overflow-y-auto flex flex-col items-center">
        <DialogHeader className="text-center w-full">
          <DialogTitle className="text-5xl font-bold mb-6 text-center">{activeNotification.title}</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={handleClose}
          >
            <X className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>
        
        {imageUrl && (
          <div className="my-8 w-full max-w-[1000px] mx-auto">
            <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg overflow-hidden shadow-lg">
              <img 
                src={imageUrl} 
                alt={activeNotification.title} 
                className="w-full h-full object-cover" 
              />
            </AspectRatio>
          </div>
        )}
        
        <DialogDescription className="text-3xl leading-relaxed my-8 text-center px-4 max-w-[800px]">
          {activeNotification.content}
        </DialogDescription>
        
        <div className="mt-6 flex justify-center">
          <Button onClick={handleClose} size="lg" className="px-12 py-6 text-xl">تم</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
