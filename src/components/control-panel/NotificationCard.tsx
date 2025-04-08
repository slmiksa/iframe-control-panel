
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, Image as ImageIcon, X } from "lucide-react";

export const NotificationCard = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(date.getHours() + 24);
    return date;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [upcomingNotifications, setUpcomingNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingNotifications();
    
    // Set up realtime subscription for notifications changes
    const channel = supabase
      .channel('admin:notifications')
      .on('postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'notifications'
        },
        () => {
          console.log('Notification table changed, refreshing list');
          fetchUpcomingNotifications();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchUpcomingNotifications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      setUpcomingNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "خطأ في جلب الإشعارات",
        description: "حدث خطأ أثناء جلب الإشعارات القادمة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast({
        title: "حقل العنوان مطلوب",
        description: "يرجى إدخال عنوان للإشعار",
        variant: "destructive",
      });
      return;
    }

    if (endTime <= startTime) {
      toast({
        title: "خطأ في التاريخ",
        description: "يجب أن يكون وقت الانتهاء بعد وقت البدء",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imagePath = null;
      
      // Upload image if one is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('notification_images')
          .upload(filePath, imageFile);
          
        if (uploadError) throw uploadError;
        
        imagePath = filePath;
      }
      
      // Create notification record
      const { error } = await supabase
        .from('notifications')
        .insert({
          title,
          content,
          image_url: imagePath, // Changed from image_path to image_url
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          is_active: true
        });
        
      if (error) throw error;
      
      toast({
        title: "تم إنشاء الإشعار",
        description: "تم إنشاء الإشعار بنجاح وسيظهر في الوقت المحدد",
      });
      
      // Reset form
      setTitle("");
      setContent("");
      setStartTime(new Date());
      const newEndTime = new Date();
      newEndTime.setHours(newEndTime.getHours() + 24);
      setEndTime(newEndTime);
      setImageFile(null);
      setImagePreview(null);
      
      // Refresh notification list
      fetchUpcomingNotifications();
      
    } catch (error) {
      console.error("Error creating notification:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إنشاء الإشعار",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      // Get the notification to check if it has an image
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Delete image if exists
      const imagePath = notification?.image_url;
      if (imagePath) {
        const { error: deleteImageError } = await supabase
          .storage
          .from('notification_images')
          .remove([imagePath]);
          
        if (deleteImageError) {
          console.error("Error deleting notification image:", deleteImageError);
        }
      }
      
      // Delete notification record - this will trigger the realtime event
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "تم حذف الإشعار",
        description: "تم حذف الإشعار بنجاح من جميع المستخدمين",
      });
      
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الإشعار",
        variant: "destructive",
      });
    }
  };

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    }).format(date);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة الإشعارات</CardTitle>
        <CardDescription>إنشاء وإدارة إشعارات للمستخدمين</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateNotification} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">عنوان الإشعار</label>
            <Input
              id="title"
              placeholder="أدخل عنوان الإشعار"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">محتوى الإشعار</label>
            <Textarea
              id="content"
              placeholder="أدخل محتوى الإشعار"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="image" className="text-sm font-medium">صورة الإشعار (اختياري)</label>
            {!imagePreview ? (
              <div className="flex items-center">
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex h-24 w-full items-center justify-center rounded-md border border-dashed border-gray-300 hover:border-gray-400">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                    <span className="mr-2 text-sm text-gray-500">اختر صورة</span>
                  </div>
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </label>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="معاينة" 
                  className="h-32 w-auto rounded-md object-contain" 
                />
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="icon" 
                  className="absolute right-2 top-2" 
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="startTime" className="text-sm font-medium">وقت بدء الإشعار</label>
              <DateTimePicker date={startTime} setDate={setStartTime} />
            </div>
            <div className="space-y-2">
              <label htmlFor="endTime" className="text-sm font-medium">وقت انتهاء الإشعار</label>
              <DateTimePicker date={endTime} setDate={setEndTime} />
            </div>
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> جاري الإنشاء...
              </>
            ) : (
              "إنشاء الإشعار"
            )}
          </Button>
        </form>

        <div className="mt-8">
          <h3 className="text-lg font-medium">الإشعارات القادمة</h3>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : upcomingNotifications.length === 0 ? (
            <p className="py-6 text-center text-gray-500">لا توجد إشعارات قادمة</p>
          ) : (
            <div className="mt-4 space-y-4">
              {upcomingNotifications.map((notification) => (
                <div key={notification.id} className="rounded-md border border-gray-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{notification.title}</h4>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                        {notification.content || 'لا يوجد محتوى'}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span>البداية: {formatDate(notification.start_time)}</span>
                        <span>النهاية: {formatDate(notification.end_time)}</span>
                      </div>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
