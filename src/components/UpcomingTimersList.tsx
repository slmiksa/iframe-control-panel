
import React, { useEffect, useState } from 'react';
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const UpcomingTimersList: React.FC = () => {
  const { fetchUpcomingBreakTimers } = useSystemAlerts();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timers, setTimers] = useState<any[]>([]);
  
  // Directly fetch timers from database to ensure UI stability
  const fetchTimersDirectly = async () => {
    try {
      setError(null);
      
      // Get all active timers from database
      const { data, error: fetchError } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: true });
      
      if (fetchError) {
        console.error("Error fetching timers:", fetchError);
        setError("فشل في تحميل المؤقتات القادمة");
        return;
      }
      
      if (!data || data.length === 0) {
        setTimers([]);
        setIsLoading(false);
        return;
      }
      
      const now = new Date();
      const processedTimers = data.map(timer => {
        let startTime = new Date(timer.start_time);
        let endTime = new Date(timer.end_time);
        
        // For recurring timers that are in the past, adjust to next occurrence
        if (timer.is_recurring && endTime < now) {
          const nextStartTime = new Date(startTime);
          nextStartTime.setDate(nextStartTime.getDate() + 1);
          
          const nextEndTime = new Date(endTime);
          nextEndTime.setDate(nextEndTime.getDate() + 1);
          
          return {
            ...timer,
            start_time: nextStartTime.toISOString(),
            end_time: nextEndTime.toISOString()
          };
        }
        
        return timer;
      });
      
      // Filter to only show upcoming and current timers
      const relevantTimers = processedTimers.filter(timer => {
        const endTime = new Date(timer.end_time);
        return timer.is_recurring || endTime >= now;
      });
      
      setTimers(relevantTimers);
      
      // Also update the context data
      fetchUpcomingBreakTimers();
    } catch (err) {
      console.error("Unexpected error fetching timers:", err);
      setError("حدث خطأ أثناء تحميل المؤقتات");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch timers when component mounts
  useEffect(() => {
    fetchTimersDirectly();
    
    // Create a longer interval for refreshes to avoid UI flickering
    const interval = setInterval(() => {
      fetchTimersDirectly();
    }, 300000); // Refresh every 5 minutes instead of 2 minutes
    
    return () => clearInterval(interval);
  }, []);
  
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>المؤقتات القادمة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          // Only show loading skeletons on initial load
          <>
            <div className="flex items-center justify-between border-b pb-2">
              <div className="w-full">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div className="w-full">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
          </>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-4 text-red-500">
            <AlertCircle className="mb-2" />
            <div>{error}</div>
          </div>
        ) : timers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            لا توجد مؤقتات مجدولة للمستقبل
          </div>
        ) : (
          timers.map(timer => (
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
          ))
        )}
      </CardContent>
    </Card>
  );
};
