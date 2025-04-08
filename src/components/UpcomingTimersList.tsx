
import React, { useEffect } from 'react';
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CalendarIcon } from "lucide-react";
import { format } from 'date-fns';

export const UpcomingTimersList: React.FC = () => {
  const { upcomingBreakTimers, fetchUpcomingBreakTimers } = useSystemAlerts();
  
  // Update list of upcoming timers when component loads
  useEffect(() => {
    // Fetch upcoming timers initially
    fetchUpcomingBreakTimers();
    
    // Refresh upcoming timers list every 30 seconds
    const interval = setInterval(() => {
      fetchUpcomingBreakTimers();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUpcomingBreakTimers]);
  
  // Format date to show date and time in a readable format
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm');
  };
  
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
            <div className="text-xs text-gray-500">
              {new Date(timer.start_time) > new Date() ? "قادم" : "جاري التنفيذ"}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
