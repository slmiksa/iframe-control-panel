import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export type BreakTimer = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_recurring?: boolean;
};

export type Notification = {
  id: string;
  title: string;
  content?: string;
  image_url?: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

interface SystemAlertsContextProps {
  breakTimer: BreakTimer | null;
  notifications: Notification[];
  activeBreakTimers: BreakTimer[];
  upcomingBreakTimers: BreakTimer[];
  fetchBreakTimer: () => Promise<void>;
  fetchActiveBreakTimers: () => Promise<void>;
  fetchUpcomingBreakTimers: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  createBreakTimer: (timer: Omit<BreakTimer, 'id'>) => Promise<boolean>;
  createNotification: (notification: Omit<Notification, 'id'>) => Promise<boolean>;
  closeBreakTimer: (id?: string) => Promise<void>;
  closeNotification: (id: string) => Promise<void>;
}

const SystemAlertsContext = createContext<SystemAlertsContextProps | undefined>(undefined);

export const SystemAlertsProvider = ({ children }: { children: React.ReactNode }) => {
  const [breakTimer, setBreakTimer] = useState<BreakTimer | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeBreakTimers, setActiveBreakTimers] = useState<BreakTimer[]>([]);
  const [upcomingBreakTimers, setUpcomingBreakTimers] = useState<BreakTimer[]>([]);

  const fetchBreakTimer = async () => {
    try {
      console.log("Fetching break timer...");
      const { data, error } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching break timer:", error);
        return;
      }

      const timerData = data ? {
        id: data.id,
        title: data.title,
        start_time: data.start_time,
        end_time: data.end_time,
        is_active: !!data.is_active,
        is_recurring: !!data.is_recurring
      } as BreakTimer : null;
      
      if (timerData) {
        const now = new Date();
        const startTime = new Date(timerData.start_time);
        const endTime = new Date(timerData.end_time);
        
        const isCurrentlyActive = checkTimerIsCurrentlyActive(timerData, now);
        
        if (isCurrentlyActive) {
          console.log("Timer is currently active, setting to state:", timerData);
          setBreakTimer(timerData);
        } else {
          console.log("Timer is not currently active, not showing in UI");
          if (!timerData.is_recurring) {
            console.log("Non-recurring timer outside active window, deactivating:", timerData.id);
            await deactivateBreakTimer(timerData.id);
          }
          setBreakTimer(null);
        }
      } else {
        setBreakTimer(null);
      }
    } catch (error) {
      console.error("Unexpected error fetching break timer:", error);
    }
  };

  const checkTimerIsCurrentlyActive = (timer: BreakTimer, now: Date) => {
    const startTime = new Date(timer.start_time);
    const endTime = new Date(timer.end_time);

    if (timer.is_recurring) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;
      
      const startHour = startTime.getHours();
      const startMinute = startTime.getMinutes();
      const startTimeMinutes = startHour * 60 + startMinute;
      
      const endHour = endTime.getHours();
      const endMinute = endTime.getMinutes();
      const endTimeMinutes = endHour * 60 + endMinute;
      
      return currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
    }
    
    return now >= startTime && now <= endTime;
  };

  const fetchActiveBreakTimers = async () => {
    try {
      console.log("Fetching active break timers...");
      const { data, error } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error("Error fetching active break timers:", error);
        return;
      }

      const timers = data ? data.map(item => ({
        id: item.id,
        title: item.title,
        start_time: item.start_time,
        end_time: item.end_time,
        is_active: !!item.is_active,
        is_recurring: !!item.is_recurring
      } as BreakTimer)) : [];

      console.log("Received active timers:", timers.length);
      setActiveBreakTimers(timers);
      
      if (!breakTimer) {
        const now = new Date();
        const currentlyActiveTimer = timers.find(timer => checkTimerIsCurrentlyActive(timer, now));
        
        if (currentlyActiveTimer) {
          console.log("Found currently active timer, setting to state:", currentlyActiveTimer);
          setBreakTimer(currentlyActiveTimer);
        }
      }
    } catch (error) {
      console.error("Unexpected error fetching active break timers:", error);
    }
  };

  const fetchUpcomingBreakTimers = async () => {
    try {
      console.log("Fetching upcoming break timers...");
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true)
        .or(`start_time.gt.${now},is_recurring.eq.true`);

      if (error) {
        console.error("Error fetching upcoming break timers:", error);
        return;
      }

      const timers = data ? data.map(item => ({
        id: item.id,
        title: item.title,
        start_time: item.start_time,
        end_time: item.end_time,
        is_active: !!item.is_active,
        is_recurring: !!item.is_recurring
      } as BreakTimer)) : [];
      
      const processedTimers = timers.map(timer => {
        if (timer.is_recurring) {
          const startTime = new Date(timer.start_time);
          const endTime = new Date(timer.end_time);
          const now = new Date();
          
          if (startTime < now && endTime < now) {
            const nextStartTime = new Date(startTime);
            nextStartTime.setDate(nextStartTime.getDate() + 1);
            
            const nextEndTime = new Date(endTime);
            nextEndTime.setDate(nextEndTime.getDate() + 1);
            
            return {
              ...timer,
              start_time: nextStartTime.toISOString(),
              end_time: nextEndTime.toISOString()
            };
          }
        }
        return timer;
      });

      console.log("Received upcoming timers:", processedTimers.length);
      setUpcomingBreakTimers(processedTimers);
    } catch (error) {
      console.error("Unexpected error fetching upcoming break timers:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .gte('end_time', new Date().toISOString());

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(data as Notification[] || []);
    } catch (error) {
      console.error("Unexpected error fetching notifications:", error);
    }
  };

  const deactivateBreakTimer = async (id: string) => {
    try {
      console.log("Deactivating break timer:", id);
      await supabase
        .from('break_timer')
        .update({ is_active: false })
        .eq('id', id);
        
      await fetchActiveBreakTimers();
    } catch (error) {
      console.error("Error deactivating break timer:", error);
    }
  };

  const closeBreakTimer = async (id?: string) => {
    if (id) {
      try {
        console.log("Closing specific break timer:", id);
        
        if (breakTimer && breakTimer.id === id) {
          setBreakTimer(null);
        }
        
        const { data } = await supabase
          .from('break_timer')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) {
          await supabase
            .from('break_timer')
            .update({ is_active: false })
            .eq('id', id);
          
          toast({
            title: "تم الإغلاق",
            description: data.is_recurring 
              ? "تم إلغاء المؤقت المتكرر بنجاح" 
              : "تم إغلاق مؤقت الراحة بنجاح",
          });
          
          setActiveBreakTimers(prev => prev.filter(timer => timer.id !== id));
        }
      } catch (error) {
        console.error("Error closing break timer:", error);
        throw error;
      }
      return;
    }
    
    if (!breakTimer) return;
    
    try {
      console.log("Closing current break timer:", breakTimer.id);
      
      await supabase
        .from('break_timer')
        .update({ is_active: false })
        .eq('id', breakTimer.id);
      
      setBreakTimer(null);
      
      toast({
        title: "تم الإغلاق",
        description: breakTimer.is_recurring 
          ? "تم إلغاء المؤقت المتكرر بنجاح" 
          : "تم إغلاق مؤقت الراحة بنجاح",
      });
      
      await fetchActiveBreakTimers();
    } catch (error) {
      console.error("Error closing break timer:", error);
      throw error;
    }
  };

  const closeNotification = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ is_active: false })
        .eq('id', id);
      
      await fetchNotifications();
    } catch (error) {
      console.error("Error closing notification:", error);
    }
  };

  const createBreakTimer = async (timer: {
    title: string;
    start_time: string;
    end_time: string;
    is_active?: boolean;
    is_recurring?: boolean;
  }) => {
    try {
      if (!timer.is_recurring) {
        await supabase
          .from('break_timer')
          .update({ is_active: false })
          .eq('is_active', true)
          .eq('is_recurring', false);
      }

      const { error } = await supabase
        .from('break_timer')
        .insert({ ...timer, is_active: true });

      if (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إنشاء مؤقت البريك",
          variant: "destructive"
        });
        return false;
      }

      await fetchBreakTimer();
      await fetchActiveBreakTimers();
      await fetchUpcomingBreakTimers();
      
      toast({
        title: "تم بنجاح",
        description: timer.is_recurring 
          ? "تم إنشاء مؤقت البريك المتكرر وسيظهر في الوقت المحدد يوميا" 
          : "تم إنشاء مؤقت البريك وسيظهر في الوقت المحدد",
      });
      return true;
    } catch (error) {
      console.error("Error creating break timer:", error);
      return false;
    }
  };

  const createNotification = async (notification: {
    title: string;
    content?: string;
    image_url?: string;
    start_time: string;
    end_time: string;
    is_active?: boolean;
  }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({ ...notification, is_active: true });

      if (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إنشاء الإشعار",
          variant: "destructive"
        });
        return false;
      }

      await fetchNotifications();
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الإشعار وسيظهر في الوقت المحدد",
      });
      return true;
    } catch (error) {
      console.error("Error creating notification:", error);
      return false;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      console.log("Initial data load");
      await fetchBreakTimer();
      await fetchActiveBreakTimers();
      await fetchUpcomingBreakTimers();
      await fetchNotifications();
    };
    
    loadData();
    
    const interval = setInterval(async () => {
      console.log("Checking for updates...");
      await fetchBreakTimer();
      await fetchActiveBreakTimers();
      await fetchUpcomingBreakTimers();
      await fetchNotifications();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <SystemAlertsContext.Provider value={{
      breakTimer,
      notifications,
      activeBreakTimers,
      upcomingBreakTimers,
      fetchBreakTimer,
      fetchActiveBreakTimers,
      fetchUpcomingBreakTimers,
      fetchNotifications,
      createBreakTimer,
      createNotification,
      closeBreakTimer,
      closeNotification
    }}>
      {children}
    </SystemAlertsContext.Provider>
  );
};

export const useSystemAlerts = () => {
  const context = useContext(SystemAlertsContext);
  if (context === undefined) {
    throw new Error("useSystemAlerts must be used within a SystemAlertsProvider");
  }
  return context;
};
