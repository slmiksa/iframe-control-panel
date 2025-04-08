
import React, { useEffect } from 'react';
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export const ActiveTimersList: React.FC = () => {
  const { activeBreakTimers, closeBreakTimer, fetchActiveBreakTimers } = useSystemAlerts();
  
  // تحديث قائمة المؤقتات النشطة عند تحميل المكون
  useEffect(() => {
    fetchActiveBreakTimers();
    
    // إعادة تحميل المؤقتات النشطة كل 10 ثوان
    const interval = setInterval(() => {
      fetchActiveBreakTimers();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchActiveBreakTimers]);
  
  // Handle closing a specific timer by ID
  const handleCloseTimer = async (timerId: string, isRecurring: boolean | undefined) => {
    try {
      // نتعامل مع المؤقتات المتكررة وغير المتكررة بشكل مختلف
      if (isRecurring) {
        // للمؤقتات المتكررة، نقوم بتعطيلها في قاعدة البيانات
        await closeBreakTimer(timerId);
        toast({
          title: "تم بنجاح",
          description: "تم إلغاء المؤقت المتكرر بنجاح",
        });
      } else {
        // للمؤقتات غير المتكررة، نستخدم الطريقة العادية
        await closeBreakTimer(timerId);
      }
      
      // إعادة تحميل القائمة بعد إغلاق المؤقت مباشرة
      fetchActiveBreakTimers();
    } catch (error) {
      console.error("Error closing timer:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إغلاق المؤقت",
        variant: "destructive"
      });
    }
  };
  
  if (activeBreakTimers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المؤقتات النشطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            لا توجد مؤقتات نشطة حاليا
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>المؤقتات النشطة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeBreakTimers.map(timer => (
          <div key={timer.id} className="flex items-center justify-between border-b pb-2">
            <div>
              <div className="font-medium">{timer.title}</div>
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {new Date(timer.start_time).toLocaleTimeString()} - {new Date(timer.end_time).toLocaleTimeString()}
                {timer.is_recurring && <span className="ml-2 text-blue-500">(يتكرر يوميا)</span>}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleCloseTimer(timer.id, timer.is_recurring)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
