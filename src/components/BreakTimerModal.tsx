
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
  const [tipIndex, setTipIndex] = useState(0);
  
  // List of break time tips for employees
  const breakTips = [
    "قم بتمارين التمدد البسيطة لتخفيف التوتر",
    "اشرب كوب من الماء للحفاظ على الترطيب",
    "خذ بضع دقائق للتأمل وتصفية ذهنك",
    "تناول وجبة خفيفة صحية لتجديد طاقتك",
    "قم بالمشي لبضع دقائق لتنشيط الدورة الدموية",
    "اتصل بصديق أو أحد أفراد العائلة",
    "استمع إلى أغنية تحبها لتحسين مزاجك",
    "تجنب النظر إلى الشاشات خلال الاستراحة",
    "قم بتمارين العين للتخفيف من إجهادها",
    "دون بعض الأفكار الإيجابية في دفتر ملاحظات",
    "افتح نافذة واستنشق بعض الهواء النقي",
    "صحح وضعية جلوسك قبل العودة للعمل",
    "خطط لبقية يومك لزيادة الإنتاجية",
    "تجنب التفكير بمهام العمل خلال الاستراحة",
    "ابتسم وفكر بإنجازاتك اليومية",
    "تذكر أهدافك وطموحاتك المستقبلية",
    "مارس التنفس العميق لتقليل التوتر",
    "احتسِ كوبًا من الشاي الأخضر",
    "اقرأ صفحات قليلة من كتاب ملهم",
    "حضّر قائمة بأمور ممتعة ستفعلها بعد العمل"
  ];

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

      // Rotate through tips every 8 seconds
      const tipsInterval = setInterval(() => {
        setTipIndex(prevIndex => (prevIndex + 1) % breakTips.length);
      }, 8000);

      return () => clearInterval(tipsInterval);
    } else {
      setOpen(false);
      setTimeRemaining(null);
    }
  }, [breakTimer, closeBreakTimer, breakTips.length]);

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
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-6">
          <div className="flex items-center justify-center mb-6">
            <Timer className="w-16 h-16 text-amber-400 animate-pulse" />
          </div>
          
          <div className="text-8xl font-bold text-center countdown-timer mb-4 text-amber-400 animate-fade-in" style={{
            textShadow: "0 0 10px rgba(251, 191, 36, 0.5)",
            fontFamily: "'Digital-7', monospace"
          }}>
            {String(timeRemaining.hours).padStart(2, '0')}:
            {String(timeRemaining.minutes).padStart(2, '0')}:
            {String(timeRemaining.seconds).padStart(2, '0')}
          </div>
          
          <div className="text-sm text-gray-500">
            من {new Date(breakTimer.start_time).toLocaleTimeString()} إلى {new Date(breakTimer.end_time).toLocaleTimeString()}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-medium text-amber-800 mb-2">نصيحة استراحة:</h3>
            <p className="text-sm text-amber-700 transition-all duration-500 animate-fade-in">
              {breakTips[tipIndex]}
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex justify-center">
          <Button 
            onClick={closeBreakTimer} 
            variant="outline" 
            className="px-8 py-2 text-lg border-amber-400 text-amber-700 hover:bg-amber-50"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
