import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Update the BreakTimer type to include is_recurring as a possible property
export type BreakTimer = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_recurring?: boolean; // Make is_recurring optional
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
  fetchBreakTimer: () => Promise<void>;
  fetchActiveBreakTimers: () => Promise<void>;
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

  const fetchBreakTimer = async () => {
    try {
      const { data, error } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching break timer:", error);
        return;
      }

      // Fix 1: Type assertion with proper handling of is_recurring
      const timerData = data ? {
        id: data.id,
        title: data.title,
        start_time: data.start_time,
        end_time: data.end_time,
        is_active: !!data.is_active,
        is_recurring: !!data.is_recurring
      } as BreakTimer : null;
      
      // Check if the break timer should be active based on current time
      if (timerData) {
        const now = new Date();
        const startTime = new Date(timerData.start_time);
        const endTime = new Date(timerData.end_time);
        
        if (now < startTime || now > endTime) {
          // If current time is outside the timer range, don't set it as active
          // unless it's recurring and should be active today
          if (timerData.is_recurring) {
            // For recurring timers, check if it should be active today based on time (not date)
            const currentTime = now.getHours() * 60 + now.getMinutes();
            const startDayTime = startTime.getHours() * 60 + startTime.getMinutes();
            const endDayTime = endTime.getHours() * 60 + endTime.getMinutes();
            
            if (currentTime >= startDayTime && currentTime <= endDayTime) {
              // It's within the time range today, adjust the dates to today
              const adjustedStartTime = new Date(now);
              adjustedStartTime.setHours(startTime.getHours(), startTime.getMinutes(), 0);
              
              const adjustedEndTime = new Date(now);
              adjustedEndTime.setHours(endTime.getHours(), endTime.getMinutes(), 0);
              
              const adjustedData: BreakTimer = {
                ...timerData,
                start_time: adjustedStartTime.toISOString(),
                end_time: adjustedEndTime.toISOString()
              };
              
              setBreakTimer(adjustedData);
              return;
            }
          }
          
          // Not recurring or not active today
          await deactivateBreakTimer(timerData.id);
          setBreakTimer(null);
          return;
        }
        
        setBreakTimer(timerData);
      } else {
        setBreakTimer(null);
      }
    } catch (error) {
      console.error("Unexpected error fetching break timer:", error);
    }
  };

  const fetchActiveBreakTimers = async () => {
    try {
      const { data, error } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.error("Error fetching active break timers:", error);
        return;
      }

      // Fix 2: Properly map the data to ensure correct typing
      const timers = data ? data.map(item => ({
        id: item.id,
        title: item.title,
        start_time: item.start_time,
        end_time: item.end_time,
        is_active: !!item.is_active,
        is_recurring: !!item.is_recurring
      } as BreakTimer)) : [];

      setActiveBreakTimers(timers);
    } catch (error) {
      console.error("Unexpected error fetching active break timers:", error);
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
      await supabase
        .from('break_timer')
        .update({ is_active: false })
        .eq('id', id);
        
      // Refresh the active timers list after deactivation
      await fetchActiveBreakTimers();
    } catch (error) {
      console.error("Error deactivating break timer:", error);
    }
  };

  const closeBreakTimer = async (id?: string) => {
    // If an ID is provided, close that specific timer
    if (id) {
      try {
        // Check if this timer is also the current break timer
        if (breakTimer && breakTimer.id === id) {
          setBreakTimer(null);
        }
        
        // Get the timer details to check if it's recurring
        const { data } = await supabase
          .from('break_timer')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data && data.is_recurring) {
          // For recurring timers, we just hide it until tomorrow
          // but keep it active in the database
          toast({
            title: "تم الإغلاق",
            description: "تم إغلاق مؤقت الراحة وسيظهر مرة أخرى في نفس الوقت غدا",
          });
          
          // Filter the timer from the active timers list in UI only
          setActiveBreakTimers(prev => prev.filter(timer => timer.id !== id));
          return;
        }
        
        // For non-recurring timers, deactivate in the database
        await deactivateBreakTimer(id);
        
        toast({
          title: "تم الإغلاق",
          description: "تم إغلاق مؤقت الراحة بنجاح",
        });
      } catch (error) {
        console.error("Error closing break timer:", error);
      }
      return;
    }
    
    // Handle the case when no ID is provided (closing the current break timer)
    if (!breakTimer) return;
    
    try {
      // For recurring timers, we just hide it until tomorrow
      // but keep it active in the database
      if (breakTimer.is_recurring) {
        setBreakTimer(null);
        toast({
          title: "تم الإغلاق",
          description: "تم إغلاق مؤقت الراحة وسيظهر مرة أخرى في نفس الوقت غدا",
        });
        return;
      }
      
      // For non-recurring timers, deactivate in the database
      await deactivateBreakTimer(breakTimer.id);
      setBreakTimer(null);
      
      toast({
        title: "تم الإغلاق",
        description: "تم إغلاق مؤقت الراحة بنجاح",
      });
      
      // Refresh the active timers list
      await fetchActiveBreakTimers();
    } catch (error) {
      console.error("Error closing break timer:", error);
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
      // We don't deactivate existing timers if it's recurring
      if (!timer.is_recurring) {
        // First, deactivate any existing active break timers that are not recurring
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

      // Immediately fetch the break timer to show it
      await fetchBreakTimer();
      await fetchActiveBreakTimers();
      
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
      await fetchBreakTimer();
      await fetchActiveBreakTimers();
      await fetchNotifications();
    };
    
    loadData();
    
    // Set up an interval to check for new alerts every 30 seconds
    const interval = setInterval(loadData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <SystemAlertsContext.Provider value={{
      breakTimer,
      notifications,
      activeBreakTimers,
      fetchBreakTimer,
      fetchActiveBreakTimers,
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
