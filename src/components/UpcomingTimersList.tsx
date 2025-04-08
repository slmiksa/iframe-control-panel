
import React, { useEffect, useState } from 'react';
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "@/components/ui/use-toast";

export const UpcomingTimersList: React.FC = () => {
  const { upcomingBreakTimers, fetchUpcomingBreakTimers } = useSystemAlerts();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update list of upcoming timers when component loads
  useEffect(() => {
    console.log("UpcomingTimersList component mounted");
    
    const fetchTimers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await fetchUpcomingBreakTimers();
        console.log("Successfully fetched upcoming timers:", upcomingBreakTimers.length);
      } catch (error) {
        console.error("Failed to fetch upcoming timers:", error);
        setError("فشل في تحميل المؤقتات القادمة");
        toast({
          title: "خطأ في تحميل المؤقتات",
          description: "فشل في تحميل قائمة المؤقتات القادمة، يرجى المحاولة مرة أخرى",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fetch upcoming timers initially
    fetchTimers();
    
    // Refresh upcoming timers list every 30 seconds
    const interval = setInterval(() => {
      console.log("Refreshing upcoming timers list");
      fetchTimers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUpcomingBreakTimers]);
  
  // Format date to show date and time in a readable format
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };
  
  const getTimerStatus = (timer: { start_time: string; end_time: string }) => {
    const now = new Date();
    const startTime = new Date(timer.start_time);
    const endTime = new Date(timer.end_time);
    
    if (now < startTime) {
      return "قادم";
    } else if (now >= startTime && now <= endTime) {
      return "جاري التنفيذ";
    } else {
      return "منتهي";
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المؤقتات القادمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            جاري تحميل المؤقتات...
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المؤقتات القادمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4 text-red-500">
            <AlertCircle className="mb-2" />
            <div>{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (upcomingBreakTimers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>المؤقتات القادمة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            لا توجد مؤقتات مجدولة للمستقبل
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>المؤقتات القادمة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingBreakTimers.map(timer => (
          <div key={timer.id} className="flex items-center justify-between border-b pb-2">
            <div>
              <div className="font-medium">{timer.title}</div>
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDateTime(timer.start_time)} - {formatDateTime(timer.end_time)}
                {timer.is_recurring && <span className="ml-2 text-blue-500">(يتكرر يوميا)</span>}
              </div>
            </div>
            <div className={`text-xs ${getTimerStatus(timer) === "جاري التنفيذ" ? "text-green-500 font-bold" : "text-gray-500"}`}>
              {getTimerStatus(timer)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
