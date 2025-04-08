import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';
import { Clock, Timer } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";

export const BreakTimerModal: React.FC = () => {
  const { activeBreakTimer, closeBreakTimer } = useSystemAlerts();
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [finishTimeoutId, setFinishTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
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

  useEffect(() => {
    if (activeBreakTimer) {
      setOpen(true);
      setIsFinished(false);
      
      if (finishTimeoutId) {
        clearTimeout(finishTimeoutId);
        setFinishTimeoutId(null);
      }
      
      const calculateRemaining = () => {
        const now = new Date();
        const endTime = new Date(activeBreakTimer.end_time);
        
        if (now > endTime) {
          setIsFinished(true);
          const timeout = setTimeout(() => {
            closeBreakTimer();
          }, 20 * 60 * 1000);
          setFinishTimeoutId(timeout);
          return null;
        }
        
        const diff = endTime.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return { hours, minutes, seconds };
      };
      
      const initialTime = calculateRemaining();
      setTimeRemaining(initialTime);

      const tipsInterval = setInterval(() => {
        setTipIndex(prevIndex => (prevIndex + 1) % breakTips.length);
      }, 8000);

      return () => {
        clearInterval(tipsInterval);
        if (finishTimeoutId) {
          clearTimeout(finishTimeoutId);
        }
      };
    } else {
      setOpen(false);
      setTimeRemaining(null);
      setIsFinished(false);
      if (finishTimeoutId) {
        clearTimeout(finishTimeoutId);
        setFinishTimeoutId(null);
      }
    }
  }, [activeBreakTimer, closeBreakTimer, finishTimeoutId]);

  useEffect(() => {
    if (!activeBreakTimer || !open || isFinished) return;
    
    const calculateRemaining = () => {
      const now = new Date();
      const endTime = new Date(activeBreakTimer.end_time);
      
      if (now > endTime) {
        setIsFinished(true);
        const timeout = setTimeout(() => {
          closeBreakTimer();
        }, 20 * 60 * 1000);
        setFinishTimeoutId(timeout);
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
  }, [activeBreakTimer, open, closeBreakTimer, isFinished]);

  if (!activeBreakTimer) return null;

  const handleCloseTimer = () => {
    closeBreakTimer();
  };

  const isLastTwoMinutes = timeRemaining && 
    timeRemaining.hours === 0 && 
    timeRemaining.minutes < 2;

  const timerColorClass = isLastTwoMinutes 
    ? "text-red-500" 
    : "text-amber-400";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) closeBreakTimer();
      setOpen(isOpen);
    }}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-3xl text-center">{activeBreakTimer.title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-8">
          {isFinished ? (
            <div className="text-center">
              <div className="text-4xl font-bold text-red-500 mb-4">انتهى وقت البريك</div>
              <div className="text-2xl text-gray-600">يمكنك العودة للعمل الآن</div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center mb-8">
                <Timer className={`w-24 h-24 ${timerColorClass} animate-pulse`} />
              </div>
              
              <div className={`text-9xl font-bold text-center countdown-timer mb-6 ${timerColorClass} animate-fade-in`} style={{
                textShadow: isLastTwoMinutes 
                  ? "0 0 15px rgba(239, 68, 68, 0.7)" 
                  : "0 0 15px rgba(251, 191, 36, 0.5)",
                fontFamily: "'Digital-7', monospace"
              }}>
                {String(timeRemaining?.hours || 0).padStart(2, '0')}:
                {String(timeRemaining?.minutes || 0).padStart(2, '0')}:
                {String(timeRemaining?.seconds || 0).padStart(2, '0')}
              </div>
              
              <div className="text-sm text-gray-500 mb-4">
                من {new Date(activeBreakTimer.start_time).toLocaleTimeString()} إلى {new Date(activeBreakTimer.end_time).toLocaleTimeString()}
              </div>

              <div className="mt-6 p-5 bg-amber-50 border border-amber-200 rounded-lg w-full max-w-md">
                <h3 className="text-md font-medium text-amber-800 mb-3">نصيحة استراحة:</h3>
                <p className="text-lg text-amber-700 transition-all duration-500 animate-fade-in">
                  {breakTips[tipIndex]}
                </p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="flex justify-center">
          <Button 
            onClick={() => closeBreakTimer()} 
            variant="outline" 
            className="px-8 py-3 text-lg border-amber-400 text-amber-700 hover:bg-amber-50"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
