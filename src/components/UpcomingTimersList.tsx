
import React, { useEffect, useState } from 'react';
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { format } from 'date-fns';
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export const UpcomingTimersList: React.FC = () => {
  const { upcomingBreakTimers, fetchUpcomingBreakTimers } = useSystemAlerts();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [stableTimersList, setStableTimersList] = useState([]);
  
  // Update list of upcoming timers when component loads
  useEffect(() => {
    console.log("UpcomingTimersList component mounted");
    
    const fetchTimers = async () => {
      try {
        if (!isRefreshing && !hasInitiallyLoaded) {
          setIsLoading(true);
        }
        setError(null);
        await fetchUpcomingBreakTimers();
        console.log("Successfully fetched upcoming timers:", upcomingBreakTimers.length);
        
        // Only update the stable list if we have data or if it's the initial load
        if (upcomingBreakTimers.length > 0 || !hasInitiallyLoaded) {
          setStableTimersList(upcomingBreakTimers);
        }
        
        // Mark as initially loaded after first successful fetch
        if (!hasInitiallyLoaded) {
          setHasInitiallyLoaded(true);
        }
      } catch (error) {
        console.error("Failed to fetch upcoming timers:", error);
        setError("فشل في تحميل المؤقتات القادمة");
        // Only show toast for initial errors to avoid spam
        if (!hasInitiallyLoaded && !isRefreshing) {
          toast({
            title: "خطأ في تحميل المؤقتات",
            description: "فشل في تحميل قائمة المؤقتات القادمة، سيتم إعادة المحاولة تلقائيًا",
            variant: "destructive"
          });
        }
        // Even if there's an error, don't reset stable list if we've already loaded successfully before
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };
    
    // Fetch upcoming timers initially
    fetchTimers();
    
    // Refresh upcoming timers list every 2 minutes (increased from 60s to reduce UI flicker further)
    const interval = setInterval(() => {
      console.log("Refreshing upcoming timers list");
      setIsRefreshing(true);
      fetchTimers();
    }, 120000); // 2 minutes
    
    return () => clearInterval(interval);
  }, [fetchUpcomingBreakTimers, upcomingBreakTimers]);
  
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
  
  // Show a stable UI that doesn't flicker during refreshes
  return (
    <Card>
      <CardHeader>
        <CardTitle>المؤقتات القادمة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && !hasInitiallyLoaded ? (
          // Only show loading skeletons on initial load, not on refreshes
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
        ) : error && !hasInitiallyLoaded ? (
          // Only show error message on initial load failures
          <div className="flex flex-col items-center justify-center py-4 text-red-500">
            <AlertCircle className="mb-2" />
            <div>{error}</div>
          </div>
        ) : stableTimersList.length === 0 ? (
          // Show stable "no timers" message
          <div className="text-center py-4 text-gray-500">
            لا توجد مؤقتات مجدولة للمستقبل
          </div>
        ) : (
          // Display stable timer list - this doesn't change during refreshes
          stableTimersList.map(timer => (
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
        {/* Hidden refresh indicator to avoid UI jumps */}
        {isRefreshing && hasInitiallyLoaded && (
          <div className="hidden">Refreshing...</div>
        )}
      </CardContent>
    </Card>
  );
};
