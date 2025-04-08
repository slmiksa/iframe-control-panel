import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { supabase } from '@/integrations/supabase/client';

type Notification = {
  id: string;
  title: string;
  content: string | null;
  image_path: string | null;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

type SystemAlertsContextType = {
  activeBreakTimer: any | null;
  activeNotification: Notification | null;
  dismissBreakTimer: () => void;
  dismissNotification: () => void;
  fetchActiveBreakTimers: () => Promise<void>;
};

const SystemAlertsContext = createContext<SystemAlertsContextType | undefined>(
  undefined
);

export const SystemAlertsProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeBreakTimer, setActiveBreakTimer] = useState<any | null>(null);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [lastFetchedTime, setLastFetchedTime] = useState<Date>(new Date());

  // Fetch active break timers
  const fetchActiveBreakTimers = useCallback(async () => {
    try {
      const now = new Date();
      
      // Fetch active break timers
      const { data: breakTimers, error: breakTimersError } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', now.toISOString())
        .gte('end_time', now.toISOString());
      
      if (breakTimersError) {
        console.error("Error fetching break timers:", breakTimersError);
        return;
      }
      
      // Handle non-recurring timers
      const nonRecurringTimers = breakTimers?.filter(timer => !timer.is_recurring) || [];
      if (nonRecurringTimers.length > 0) {
        setActiveBreakTimer(nonRecurringTimers[0]);
      } else {
        // Handle recurring timers
        const recurringTimers = breakTimers?.filter(timer => timer.is_recurring) || [];
        if (recurringTimers.length > 0) {
          setActiveBreakTimer(recurringTimers[0]);
        } else {
          setActiveBreakTimer(null);
        }
      }
      
      // Fetch active notifications
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .lte('start_time', now.toISOString())
        .gte('end_time', now.toISOString());
        
      if (notificationsError) {
        console.error("Error fetching notifications:", notificationsError);
        return;
      }
      
      if (notifications && notifications.length > 0) {
        setActiveNotification(notifications[0]);
      } else {
        setActiveNotification(null);
      }
      
      setLastFetchedTime(now);
    } catch (error) {
      console.error("Error in fetchActiveBreakTimers:", error);
    }
  }, []);

  useEffect(() => {
    // Fetch active alerts initially
    fetchActiveBreakTimers();
    
    // Set up interval to check periodically
    const intervalId = setInterval(() => {
      fetchActiveBreakTimers();
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [fetchActiveBreakTimers]);

  const dismissBreakTimer = useCallback(() => {
    setActiveBreakTimer(null);
  }, []);
  
  const dismissNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

  const value = useMemo(() => ({
    activeBreakTimer,
    activeNotification,
    dismissBreakTimer,
    dismissNotification,
    fetchActiveBreakTimers,
  }), [activeBreakTimer, activeNotification, dismissBreakTimer, dismissNotification, fetchActiveBreakTimers]);

  return (
    <SystemAlertsContext.Provider value={value}>
      {children}
    </SystemAlertsContext.Provider>
  );
};

export const useSystemAlerts = () => {
  const context = useContext(SystemAlertsContext);
  if (!context) {
    throw new Error("useSystemAlerts must be used within a SystemAlertsProvider");
  }
  return context;
};
