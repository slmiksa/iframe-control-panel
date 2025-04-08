
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Clock, Timer } from "lucide-react";

export const BreakTimerModal: React.FC = () => {
  const { breakTimer, closeBreakTimer } = useSystemAlerts();
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [open, setOpen] = useState(false);
  
  // When breakTimer changes, update the open state immediately
  useEffect(() => {
    if (breakTimer) {
      setOpen(true);
      
      // Calculate the initial time remaining
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
      
      // Set initial time
      const initialTime = calculateRemaining();
      setTimeRemaining(initialTime);
    } else {
      setOpen(false);
      setTimeRemaining(null);
    }
  }, [breakTimer, closeBreakTimer]);

  // Update the time every second
  useEffect(() => {
    if (!breakTimer || !open) return;
    
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
    
    const interval = setInterval(() => {
      const time = calculateRemaining();
      if (time) {
        setTimeRemaining(time);
      } else {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [breakTimer, open, closeBreakTimer]);

  // If no break timer or no remaining time, render nothing
  if (!breakTimer || !timeRemaining) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) closeBreakTimer();
      setOpen(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">{breakTimer.title}</DialogTitle>
          <DialogDescription className="text-center">
            {breakTimer.is_recurring ? "مؤقت راحة يومي" : "مؤقت راحة لمرة واحدة"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="flex items-center justify-center mb-6">
            <Timer className="w-16 h-16 text-blue-500 animate-pulse" />
          </div>
          
          <div className="text-7xl font-bold text-center countdown-timer mb-4">
            {String(timeRemaining.hours).padStart(2, '0')}:
            {String(timeRemaining.minutes).padStart(2, '0')}:
            {String(timeRemaining.seconds).padStart(2, '0')}
          </div>
          
          <div className="text-sm text-gray-500">
            من {new Date(breakTimer.start_time).toLocaleTimeString()} إلى {new Date(breakTimer.end_time).toLocaleTimeString()}
          </div>
        </div>
        
        <DialogFooter className="flex justify-center">
          <Button 
            onClick={closeBreakTimer} 
            variant="outline" 
            className="px-8 py-2 text-lg"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
