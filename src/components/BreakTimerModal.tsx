
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSystemAlerts } from '@/contexts/SystemAlertsContext';

export const BreakTimerModal: React.FC = () => {
  const { breakTimer } = useSystemAlerts();

  if (!breakTimer) return null;

  const remainingTime = () => {
    const endTime = new Date(breakTimer.end_time);
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Dialog open={!!breakTimer}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{breakTimer.title}</DialogTitle>
        </DialogHeader>
        <div className="text-center text-2xl font-bold">
          الوقت المتبقي: {remainingTime()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
