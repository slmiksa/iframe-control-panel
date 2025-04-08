
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Clock } from "lucide-react";

export const BreakTimerModal: React.FC = () => {
  const { breakTimer, closeBreakTimer } = useSystemAlerts();
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [open, setOpen] = useState(false);
  
  // When breakTimer changes, update the open state
  useEffect(() => {
    if (breakTimer) {
      // Only open if current time is between start and end
      const now = new Date();
      const startTime = new Date(breakTimer.start_time);
      const endTime = new Date(breakTimer.end_time);
      
      if (now >= startTime && now <= endTime) {
        setOpen(true);
      } else {
        setOpen(false);
      }
    } else {
      setOpen(false);
    }
  }, [breakTimer]);

  // Calculate remaining time
  useEffect(() => {
    if (!breakTimer) return;
    
    const calculateRemaining = () => {
      const now = new Date();
      const endTime = new Date(breakTimer.end_time);
      
      // If we're past the end time, close the timer
      if (now > endTime) {
        closeBreakTimer();
        return null;
      }
      
      const diff = endTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    };
    
    const time = calculateRemaining();
    if (time) setTimeRemaining(time);
    
    const interval = setInterval(() => {
      const time = calculateRemaining();
      if (time) {
        setTimeRemaining(time);
      } else {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [breakTimer, closeBreakTimer]);

  // If no break timer or no remaining time, render nothing
  if (!breakTimer || !timeRemaining) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) closeBreakTimer();
      setOpen(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{breakTimer.title}</DialogTitle>
          <DialogDescription>
            تم بدء مؤقت الراحة من {new Date(breakTimer.start_time).toLocaleTimeString()} إلى {new Date(breakTimer.end_time).toLocaleTimeString()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-12 h-12 text-blue-500 mr-2" />
          </div>
          
          <div className="text-5xl font-bold text-center countdown-timer">
            {String(timeRemaining.hours).padStart(2, '0')}:
            {String(timeRemaining.minutes).padStart(2, '0')}:
            {String(timeRemaining.seconds).padStart(2, '0')}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={closeBreakTimer} variant="outline">
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
