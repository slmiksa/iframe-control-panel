
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';

export const UpcomingTimersList: React.FC = () => {
  const { fetchActiveBreakTimers, fetchUpcomingBreakTimers } = useSystemAlerts();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timers, setTimers] = useState<any[]>([]);
  const [stableTimersList, setStableTimersList] = useState<any[]>([]);
  
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
        // Only update the stable list if we're not loading anymore
        if (!isLoading) {
          setStableTimersList([]);
        }
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
      
      // Filter to only show upcoming timers (not yet active)
      const relevantTimers = processedTimers.filter(timer => {
        const startTime = new Date(timer.start_time);
        const endTime = new Date(timer.end_time);
        
        // Logic to check if timer is upcoming (not currently active)
        if (timer.is_recurring) {
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTimeMinutes = currentHour * 60 + currentMinute;
          
          const startHour = startTime.getHours();
          const startMinute = startTime.getMinutes();
          const startTimeMinutes = startHour * 60 + startMinute;
          
          return currentTimeMinutes < startTimeMinutes;
        }
        
        // For one-time timers, show if start time is in the future
        return now < startTime;
      });
      
      console.log(`Found ${relevantTimers.length} upcoming timers out of ${processedTimers.length} total timers`);
      
      setTimers(relevantTimers);
      
      // Only update the stable list if there are actual changes or on initial load
      if (
        isLoading || 
        stableTimersList.length !== relevantTimers.length || 
        JSON.stringify(stableTimersList) !== JSON.stringify(relevantTimers)
      ) {
        setStableTimersList(relevantTimers);
      }
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
    
    // Create a shorter interval for checking upcoming timers that will become active soon
    const interval = setInterval(() => {
      fetchTimersDirectly();
    }, 10000); // Refresh every 10 seconds for better reactivity
    
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
    
    const secondsUntilStart = Math.round((startTime.getTime() - now.getTime()) / 1000);
    
    if (secondsUntilStart <= 60) { // Less than a minute
      return "جاري التنشيط..."; // About to activate
    } else if (secondsUntilStart <= 300) { // Less than 5 minutes
      const minutes = Math.ceil(secondsUntilStart / 60);
      return `قريباً (${minutes} دقائق)`; // Activating soon
    } else {
      return "قادم"; // Upcoming
    }
  };
  
  // Calculate time difference from now
  const getTimeFromNow = (dateString: string) => {
    const now = new Date();
    const targetDate = new Date(dateString);
    const diffMs = targetDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 1) return "أقل من دقيقة";
    if (diffMins < 60) return `${diffMins} دقيقة`;
    
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    
    if (mins === 0) return `${hours} ساعة`;
    return `${hours} ساعة و ${mins} دقيقة`;
  };
  
  // Use stableTimersList for rendering to prevent flickering
  const displayTimers = stableTimersList;
  
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
        ) : displayTimers.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            لا توجد مؤقتات مجدولة للمستقبل
          </div>
        ) : (
          displayTimers.map(timer => (
            <div key={timer.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="font-medium">{timer.title}</div>
                <div className="text-sm text-gray-500 flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDateTime(timer.start_time)} - {formatDateTime(timer.end_time)}
                  {timer.is_recurring && <span className="ml-2 text-blue-500">(يتكرر يوميا)</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  يبدأ بعد: {getTimeFromNow(timer.start_time)}
                </div>
              </div>
              <div className={`text-xs ${
                getTimerStatus(timer) === "جاري التنشيط..." 
                  ? "text-orange-500 font-bold animate-pulse" 
                  : getTimerStatus(timer).startsWith("قريباً") 
                    ? "text-blue-500 font-bold"
                    : "text-gray-500"
              }`}>
                {getTimerStatus(timer)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
