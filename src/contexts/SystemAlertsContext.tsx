
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Types for Break Timer and Notifications
type BreakTimer = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

type Notification = {
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
  fetchBreakTimer: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  createBreakTimer: (timer: Omit<BreakTimer, 'id'>) => Promise<boolean>;
  createNotification: (notification: Omit<Notification, 'id'>) => Promise<boolean>;
  closeBreakTimer: () => Promise<void>;
  closeNotification: (id: string) => Promise<void>;
}

const SystemAlertsContext = createContext<SystemAlertsContextProps | undefined>(undefined);

export const SystemAlertsProvider = ({ children }: { children: React.ReactNode }) => {
  const [breakTimer, setBreakTimer] = useState<BreakTimer | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchBreakTimer = async () => {
    try {
      const { data, error } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.error("Error fetching break timer:", error);
        return;
      }

      // Check if the break timer should be active based on current time
      if (data) {
        const now = new Date();
        const startTime = new Date(data.start_time);
        const endTime = new Date(data.end_time);
        
        if (now < startTime || now > endTime) {
          // If current time is outside the timer range, don't set it as active
          await deactivateBreakTimer(data.id);
          setBreakTimer(null);
          return;
        }
        
        setBreakTimer(data as BreakTimer);
      } else {
        setBreakTimer(null);
      }
    } catch (error) {
      console.error("Unexpected error fetching break timer:", error);
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
    } catch (error) {
      console.error("Error deactivating break timer:", error);
    }
  };

  const closeBreakTimer = async () => {
    if (!breakTimer) return;
    
    try {
      await deactivateBreakTimer(breakTimer.id);
      setBreakTimer(null);
      
      toast({
        title: "تم الإغلاق",
        description: "تم إغلاق مؤقت الراحة بنجاح",
      });
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

  const createBreakTimer = async (timer: Omit<BreakTimer, 'id'>) => {
    try {
      // First, deactivate any existing active break timers
      await supabase
        .from('break_timer')
        .update({ is_active: false })
        .eq('is_active', true);

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
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء مؤقت البريك وسيظهر في الوقت المحدد",
      });
      return true;
    } catch (error) {
      console.error("Error creating break timer:", error);
      return false;
    }
  };

  const createNotification = async (notification: Omit<Notification, 'id'>) => {
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

  // Fetch initial data
  useEffect(() => {
    fetchBreakTimer();
    fetchNotifications();
    
    // Set up an interval to check for new alerts every minute
    const interval = setInterval(() => {
      fetchBreakTimer();
      fetchNotifications();
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <SystemAlertsContext.Provider value={{
      breakTimer,
      notifications,
      fetchBreakTimer,
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
