
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleTimePicker } from "@/components/SimpleTimePicker";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createNotificationsBucket } from "@/integrations/supabase/createStorageBucket";

type NotificationCardProps = {
  createNotification: (notification: {
    title: string;
    content: string;
    image_url: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
  }) => Promise<boolean>;
};

export const NotificationCard: React.FC<NotificationCardProps> = ({ createNotification }) => {
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationContent, setNotificationContent] = useState("");
  const [notificationImage, setNotificationImage] = useState<File | null>(null);
  const [notificationStart, setNotificationStart] = useState<Date>(new Date());
  const [notificationEnd, setNotificationEnd] = useState<Date>(() => {
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 1);
    return endTime;
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isPreparingBucket, setIsPreparingBucket] = useState(false);

  useEffect(() => {
    const prepareBucket = async () => {
      setIsPreparingBucket(true);
      try {
        const result = await createNotificationsBucket();
        console.log("Bucket preparation result:", result);
        if (!result) {
          toast({
            title: "تنبيه",
            description: "قد لا تظهر صور الإشعارات بشكل صحيح، يرجى التواصل مع المسؤول",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error preparing notifications bucket:", error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء تجهيز مخزن الصور",
          variant: "destructive"
        });
      } finally {
        setIsPreparingBucket(false);
      }
    };
    
    prepareBucket();
  }, []);

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      if (!notificationTitle) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال عنوان للإشعار",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }
      
      if (notificationEnd.getTime() <= notificationStart.getTime()) {
        toast({
          title: "خطأ",
          description: "يجب أن يكون وقت الإنتهاء بعد وقت البدء",
          variant: "destructive"
        });
        setIsUploading(false);
        return;
      }
      
      let imageUrl = "";
      
      if (notificationImage) {
        try {
          const fileExt = notificationImage.name.split('.').pop();
          const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          
          console.log("Uploading image:", safeFileName);
          
          // تأكد من أن المعرف الخاص بقاعدة البيانات صحيح
          const { data, error } = await supabase.storage
            .from('notifications')
            .upload(safeFileName, notificationImage, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (error) {
            console.error("Storage upload error:", error);
            toast({
              title: "خطأ",
              description: `حدث خطأ أثناء رفع الصورة: ${error.message}`,
              variant: "destructive"
            });
          } else {
            imageUrl = safeFileName;
            console.log("Image uploaded successfully:", imageUrl);
          }
        } catch (uploadError) {
          console.error("Exception during upload:", uploadError);
          toast({
            title: "خطأ",
            description: "حدث خطأ غير متوقع أثناء رفع الصورة",
            variant: "destructive"
          });
        }
      }

      // تأكد من أن البيانات تنتقل بشكل صحيح إلى قاعدة البيانات
      console.log("Sending notification data:", {
        title: notificationTitle,
        content: notificationContent,
        image_url: imageUrl,
        start_time: notificationStart.toISOString(),
        end_time: notificationEnd.toISOString(),
        is_active: true
      });

      const success = await createNotification({
        title: notificationTitle,
        content: notificationContent,
        image_url: imageUrl,
        start_time: notificationStart.toISOString(),
        end_time: notificationEnd.toISOString(),
        is_active: true
      });

      if (success) {
        toast({
          title: "نجاح",
          description: "تم إنشاء الإشعار بنجاح وسيظهر لجميع الزوار"
        });
        setNotificationTitle("");
        setNotificationContent("");
        setNotificationImage(null);
      } else {
        toast({
          title: "خطأ",
          description: "فشل في إنشاء الإشعار، يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error in handleCreateNotification:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء إنشاء الإشعار",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء إشعار</CardTitle>
        <CardDescription>أنشئ إشعارا جديدا ليظهر لجميع المستخدمين والزوار</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateNotification} className="space-y-4">
          <Input
            placeholder="عنوان الإشعار"
            value={notificationTitle}
            onChange={(e) => setNotificationTitle(e.target.value)}
            required
            className="mb-4"
          />
          <Textarea
            placeholder="محتوى الإشعار"
            value={notificationContent}
            onChange={(e) => setNotificationContent(e.target.value)}
            className="mb-4"
          />
          <div className="mb-4">
            <label htmlFor="notification-image" className="block text-sm font-medium mb-1">
              صورة الإشعار (اختياري)
            </label>
            <Input
              id="notification-image"
              type="file"
              accept="image/*"
              onChange={(e) => setNotificationImage(e.target.files?.[0] || null)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <SimpleTimePicker 
              label="وقت البدء"
              value={notificationStart}
              onChange={setNotificationStart}
            />
            <SimpleTimePicker 
              label="وقت الانتهاء"
              value={notificationEnd}
              onChange={setNotificationEnd}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isUploading || isPreparingBucket}
          >
            {isPreparingBucket ? 'جاري تجهيز المخزن...' : 
             isUploading ? 'جاري الإنشاء...' : 'إنشاء الإشعار'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
