
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleTimePicker } from "@/components/SimpleTimePicker";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!notificationTitle) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان للإشعار",
        variant: "destructive"
      });
      return;
    }
    
    if (notificationEnd.getTime() <= notificationStart.getTime()) {
      toast({
        title: "خطأ",
        description: "يجب أن يكون وقت الإنتهاء بعد وقت البدء",
        variant: "destructive"
      });
      return;
    }
    
    let imageUrl = "";
    if (notificationImage) {
      const { data, error } = await supabase.storage
        .from('notifications')
        .upload(`${Date.now()}_${notificationImage.name}`, notificationImage);
      
      if (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء رفع الصورة",
          variant: "destructive"
        });
        return;
      }

      imageUrl = data?.path || "";
    }

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
        description: "تم إنشاء الإشعار بنجاح"
      });
      setNotificationTitle("");
      setNotificationContent("");
      setNotificationImage(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء إشعار</CardTitle>
        <CardDescription>أنشئ إشعارا جديدا ليظهر للمستخدمين</CardDescription>
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
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setNotificationImage(e.target.files?.[0] || null)}
            className="mb-4"
          />
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
          <Button type="submit" className="w-full">إنشاء الإشعار</Button>
        </form>
      </CardContent>
    </Card>
  );
};
