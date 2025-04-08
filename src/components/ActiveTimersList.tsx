
import React, { useEffect, useState } from 'react';
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ActiveTimersList: React.FC = () => {
  const { closeBreakTimer } = useSystemAlerts();
  const [activeTimers, setActiveTimers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Directly fetch active timers from database
  const fetchActiveTimersDirectly = async () => {
    try {
      const now = new Date();
      
      // Get all active timers from database
      const { data, error } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true);
        
      if (error) {
        console.error("Error fetching active timers:", error);
        return;
      }
      
      // Process timers to identify currently active ones
      const currentlyActiveTimers = data
        ? data
            .map(timer => ({
              id: timer.id,
              title: timer.title,
              start_time: timer.start_time,
              end_time: timer.end_time,
              is_active: timer.is_active,
              is_recurring: timer.is_recurring
            }))
            .filter(timer => {
              const startTime = new Date(timer.start_time);
              const endTime = new Date(timer.end_time);
              
              // For recurring timers
              if (timer.is_recurring) {
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const currentTimeMinutes = currentHour * 60 + currentMinute;
                
                const startHour = startTime.getHours();
                const startMinute = startTime.getMinutes();
                const startTimeMinutes = startHour * 60 + startMinute;
                
                const endHour = endTime.getHours();
                const endMinute = endTime.getMinutes();
                const endTimeMinutes = endHour * 60 + endMinute;
                
                return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
              }
              
              // For one-time timers
              return now >= startTime && now <= endTime;
            })
        : [];
        
      setActiveTimers(currentlyActiveTimers);
    } catch (err) {
      console.error("Unexpected error fetching active timers:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update the list of active timers when component loads
  useEffect(() => {
    fetchActiveTimersDirectly();
    
    // Refresh active timers list every 30 seconds
    const interval = setInterval(() => {
      fetchActiveTimersDirectly();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle closing a specific timer by ID
  const handleCloseTimer = async (timerId: string, isRecurring: boolean | undefined) => {
    try {
      await closeBreakTimer(timerId);
      
      // Update local state immediately for better UX
      setActiveTimers(prevTimers => prevTimers.filter(timer => timer.id !== timerId));
      
      toast({
        title: "تم بنجاح",
        description: isRecurring 
          ? "تم إلغاء المؤقت المتكرر بنجاح" 
          : "تم إغلاق المؤقت بنجاح",
      });
    } catch (error) {
      console.error("Error closing timer:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إغلاق المؤقت",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المؤقتات النشطة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between border-b pb-2">
            <div className="w-full">
              <div className="h-5 w-1/3 mb-2 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (activeTimers.length === 0) {
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
        {activeTimers.map(timer => (
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
