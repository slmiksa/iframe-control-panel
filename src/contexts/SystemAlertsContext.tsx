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
          } else if (endTime < now) {
            console.log("Recurring timer ended, rescheduling for next day:", timerData.id);
            await rescheduleRecurringTimer(timerData);
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

  const rescheduleRecurringTimer = async (timer: BreakTimer) => {
    try {
      console.log("Rescheduling recurring timer for next day:", timer.id);
      
      const startTime = new Date(timer.start_time);
      const endTime = new Date(timer.end_time);
      
      const nextStartTime = new Date(startTime);
      nextStartTime.setDate(nextStartTime.getDate() + 1);
      
      const nextEndTime = new Date(endTime);
      nextEndTime.setDate(nextEndTime.getDate() + 1);
      
      const originalDurationMs = endTime.getTime() - startTime.getTime();
      const nextEndTimeCheck = new Date(nextStartTime.getTime() + originalDurationMs);
      
      console.log(`Updating timer from ${startTime.toISOString()} to ${nextStartTime.toISOString()}`);
      console.log(`Duration check: original=${originalDurationMs}ms, calculated=${nextEndTimeCheck.getTime() - nextStartTime.getTime()}ms`);
      
      const { error } = await supabase
        .from('break_timer')
        .update({ 
          start_time: nextStartTime.toISOString(),
          end_time: nextEndTime.toISOString()
        })
        .eq('id', timer.id);
      
      if (error) {
        console.error("Error rescheduling recurring timer:", error);
        return;
      }
      
      console.log("Successfully rescheduled recurring timer:", timer.id);
    } catch (error) {
      console.error("Error in rescheduleRecurringTimer:", error);
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

      const now = new Date();
      const currentlyActiveTimers = data
        ? data
            .map(item => ({
              id: item.id,
              title: item.title,
              start_time: item.start_time,
              end_time: item.end_time,
              is_active: !!item.is_active,
              is_recurring: !!item.is_recurring
            } as BreakTimer))
            .filter(timer => {
              const isActive = checkTimerIsCurrentlyActive(timer, now);
              
              if (!timer.is_recurring && !isActive && new Date(timer.end_time) < now) {
                console.log("Deactivating expired non-recurring timer:", timer.id);
                deactivateBreakTimer(timer.id);
                return false;
              } else if (timer.is_recurring && !isActive && new Date(timer.end_time) < now) {
                console.log("Recurring timer ended, rescheduling for next day:", timer.id);
                rescheduleRecurringTimer(timer);
                return false;
              }
              
              return isActive;
            })
        : [];

      console.log("Received active timers:", currentlyActiveTimers.length);
      setActiveBreakTimers(currentlyActiveTimers);
      
      if (!breakTimer && currentlyActiveTimers.length > 0) {
        console.log("Found currently active timer, setting to state:", currentlyActiveTimers[0]);
        setBreakTimer(currentlyActiveTimers[0]);
      }
    } catch (error) {
      console.error("Unexpected error fetching active break timers:", error);
    }
  };

  const fetchUpcomingBreakTimers = async () => {
    try {
      console.log("Fetching upcoming break timers...");
      
      const { data: allActiveTimers, error: activeError } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true);
        
      if (activeError) {
        console.error("Error fetching all active break timers:", activeError);
        throw activeError;
      }
      
      if (!allActiveTimers) {
        console.log("No active timers found");
        setUpcomingBreakTimers([]);
        return;
      }
      
      const now = new Date();
      const timers = allActiveTimers.map(item => ({
        id: item.id,
        title: item.title,
        start_time: item.start_time,
        end_time: item.end_time,
        is_active: !!item.is_active,
        is_recurring: !!item.is_recurring
      } as BreakTimer));
      
      const processedTimers = timers.map(timer => {
        const startTime = new Date(timer.start_time);
        const endTime = new Date(timer.end_time);
        
        if (timer.is_recurring) {
          if (endTime < now) {
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
        
        if (!timer.is_recurring && endTime < now) {
          console.log("Deactivating expired non-recurring timer during upcoming check:", timer.id);
          deactivateBreakTimer(timer.id);
        }
        
        return timer;
      });
      
      const upcomingTimers = processedTimers.filter(timer => {
        const startTime = new Date(timer.start_time);
        const endTime = new Date(timer.end_time);
        const now = new Date();
        
        if (timer.is_recurring) {
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          const currentTimeMinutes = currentHour * 60 + currentMinute;
          
          const startHour = startTime.getHours();
          const startMinute = startTime.getMinutes();
          const startTimeMinutes = startHour * 60 + startMinute;
          
          return currentTimeMinutes < startTimeMinutes;
        }
        
        return startTime > now && endTime > now;
      });

      console.log("Processed upcoming timers:", upcomingTimers.length);
      setUpcomingBreakTimers(upcomingTimers);
    } catch (error) {
      console.error("Unexpected error fetching upcoming break timers:", error);
      throw error;
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
      
      const { data: timerData, error: fetchError } = await supabase
        .from('break_timer')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error("Error fetching timer info:", fetchError);
        return;
      }
      
      if (timerData && timerData.is_recurring) {
        const timer = {
          id: timerData.id,
          title: timerData.title,
          start_time: timerData.start_time,
          end_time: timerData.end_time,
          is_active: !!timerData.is_active,
          is_recurring: !!timerData.is_recurring
        } as BreakTimer;
        
        console.log("Not deactivating recurring timer, rescheduling instead:", id);
        await rescheduleRecurringTimer(timer);
        
        setActiveBreakTimers(prev => prev.filter(timer => timer.id !== id));
        
        if (breakTimer && breakTimer.id === id) {
          setBreakTimer(null);
        }
        
        return;
      }
      
      const { error } = await supabase
        .from('break_timer')
        .update({ is_active: false })
        .eq('id', id);
        
      if (error) {
        console.error("Error deactivating timer:", error);
        return;
      }
      
      console.log("Successfully deactivated timer:", id);
      
      setActiveBreakTimers(prev => prev.filter(timer => timer.id !== id));
      
      if (breakTimer && breakTimer.id === id) {
        setBreakTimer(null);
      }
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
          if (data.is_recurring) {
            const timer = {
              id: data.id,
              title: data.title,
              start_time: data.start_time,
              end_time: data.end_time,
              is_active: true,
              is_recurring: true
            } as BreakTimer;
            
            await rescheduleRecurringTimer(timer);
            
            setActiveBreakTimers(prev => prev.filter(timer => timer.id !== id));
            
            toast({
              title: "تم الإغلاق",
              description: "تم إغلاق المؤقت المتكرر وسيظهر غدا في نفس الوقت",
            });
            
            setTimeout(() => {
              fetchUpcomingBreakTimers();
            }, 1000);
          } else {
            const { error } = await supabase
              .from('break_timer')
              .update({ is_active: false })
              .eq('id', id);
              
            if (error) {
              console.error("Error updating timer status:", error);
              throw error;
            }
            
            setActiveBreakTimers(prev => prev.filter(timer => timer.id !== id));
            setUpcomingBreakTimers(prev => prev.filter(timer => timer.id !== id));
            
            toast({
              title: "تم الإغلاق",
              description: "تم إغلاق مؤقت الراحة بنجاح",
            });
          }
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
      
      if (breakTimer.is_recurring) {
        await rescheduleRecurringTimer(breakTimer);
        
        setBreakTimer(null);
        
        toast({
          title: "تم الإغلاق",
          description: "تم إغلاق المؤقت المتكرر وسيظهر غدا في نفس الوقت",
        });
        
        setActiveBreakTimers(prev => prev.filter(timer => timer.id !== breakTimer.id));
        
        setTimeout(() => {
          fetchUpcomingBreakTimers();
        }, 1000);
      } else {
        const { error } = await supabase
          .from('break_timer')
          .update({ is_active: false })
          .eq('id', breakTimer.id);
          
        if (error) {
          console.error("Error updating current timer status:", error);
          throw error;
        }
        
        setBreakTimer(null);
        
        toast({
          title: "تم الإغلاق",
          description: "تم إغلاق مؤقت الراحة بنجاح",
        });
        
        setActiveBreakTimers(prev => prev.filter(timer => timer.id !== breakTimer.id));
        setUpcomingBreakTimers(prev => prev.filter(timer => timer.id !== breakTimer.id));
      }
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

      const { error, data } = await supabase
        .from('break_timer')
        .insert({ ...timer, is_active: true })
        .select();

      if (error) {
        console.error("Error creating break timer:", error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إنشاء مؤقت البريك",
          variant: "destructive"
        });
        return false;
      }

      console.log("Successfully created break timer:", data);
      
      await Promise.all([
        fetchBreakTimer(),
        fetchActiveBreakTimers(),
        fetchUpcomingBreakTimers()
      ]);
      
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
        description: "تم إن��اء الإشعار وسيظهر في الوقت المحدد",
      });
      return true;
    } catch (error) {
      console.error("Error creating notification:", error);
      return false;
    }
  };

  const checkAndActivateTimers = async () => {
    try {
      const now = new Date();
      
      const { data, error } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true);
        
      if (error) {
        console.error("Error checking for timers to activate:", error);
        return;
      }
      
      if (!data || data.length === 0) return;
      
      for (const dbTimer of data) {
        const timer = {
          id: dbTimer.id,
          title: dbTimer.title,
          start_time: dbTimer.start_time,
          end_time: dbTimer.end_time,
          is_active: !!dbTimer.is_active,
          is_recurring: !!dbTimer.is_recurring
        } as BreakTimer;
        
        const startTime = new Date(timer.start_time);
        const endTime = new Date(timer.end_time);
        
        let shouldBeActive = false;
        
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
          
          shouldBeActive = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes <= endTimeMinutes;
          
          if (!shouldBeActive && endTime < now) {
            console.log("Recurring timer has expired for today, rescheduling for tomorrow:", timer.id);
            await rescheduleRecurringTimer(timer);
            continue;
          }
        } else {
          shouldBeActive = now >= startTime && now <= endTime;
        }
        
        if (shouldBeActive) {
          const isInActiveState = activeBreakTimers.some(t => t.id === timer.id);
          
          if (!isInActiveState) {
            console.log(`Timer ${timer.title} should be active but isn't in active state. Updating...`);
            setActiveBreakTimers(prev => [...prev, timer]);
            
            if (!breakTimer) {
              console.log("Setting active break timer:", timer);
              setBreakTimer(timer);
            }
          }
        } else {
          if (!timer.is_recurring && endTime < now) {
            console.log(`Timer ${timer.title} has expired. Deactivating...`);
            await deactivateBreakTimer(timer.id);
          }
        }
      }
    } catch (error) {
      console.error("Error in checkAndActivateTimers:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      console.log("Initial data load");
      try {
        await fetchBreakTimer();
        await fetchActiveBreakTimers();
        await fetchUpcomingBreakTimers();
        await fetchNotifications();
        await checkAndActivateTimers();
      } catch (error) {
        console.error("Error during initial data load:", error);
      }
    };
    
    loadData();
    
    const frequentInterval = setInterval(async () => {
      try {
        await checkAndActivateTimers();
      } catch (error) {
        console.error("Error during frequent timer check:", error);
      }
    }, 10000);
    
    const interval = setInterval(async () => {
      console.log("Checking for updates...");
      try {
        await fetchBreakTimer();
        await fetchActiveBreakTimers();
        await fetchUpcomingBreakTimers();
        await fetchNotifications();
      } catch (error) {
        console.error("Error during scheduled update:", error);
      }
    }, 30000);
    
    return () => {
      clearInterval(frequentInterval);
      clearInterval(interval);
    }
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
