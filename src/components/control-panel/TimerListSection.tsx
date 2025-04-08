
import React from "react";
import { ActiveTimersList } from "@/components/ActiveTimersList";
import { UpcomingTimersList } from "@/components/UpcomingTimersList";

export const TimerListSection: React.FC = () => {
  return (
    <div className="space-y-6" data-timer-list>
      <ActiveTimersList />
      <UpcomingTimersList />
    </div>
  );
};
