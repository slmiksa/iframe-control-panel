
import React from 'react';
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Trash } from "lucide-react";

export const ActiveTimersList: React.FC = () => {
  const { activeBreakTimers, closeBreakTimer } = useSystemAlerts();
  
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
            <Button variant="ghost" size="sm" onClick={() => closeBreakTimer()}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
