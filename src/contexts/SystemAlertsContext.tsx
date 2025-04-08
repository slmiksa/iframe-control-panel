
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { supabase } from '@/integrations/supabase/client';

type BreakTimer = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  is_recurring: boolean | null;
};

type Notification = {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;  // Primary field for image URL
  image_path?: string | null; // For backward compatibility
  start_time: string;
  end_time: string;
  is_active: boolean;
};

type SystemAlertsContextType = {
  activeBreakTimer: BreakTimer | null;
  activeNotification: Notification | null;
  dismissBreakTimer: () => void;
  dismissNotification: () => void;
  fetchActiveBreakTimers: () => Promise<void>;
  fetchUpcomingBreakTimers: () => Promise<BreakTimer[]>;
  closeBreakTimer: (timerId?: string) => Promise<void>;
  breakTimer: BreakTimer | null;
};

const SystemAlertsContext = createContext<SystemAlertsContextType | undefined>(
  undefined
);

export const SystemAlertsProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeBreakTimer, setActiveBreakTimer] = useState<BreakTimer | null>(null);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);
  const [lastFetchedTime, setLastFetchedTime] = useState<Date>(new Date());
  const [notificationsDismissed, setNotificationsDismissed] = useState<Set<string>>(new Set());
  const [permanentlyDismissedNotifications, setPermanentlyDismissedNotifications] = useState<Set<string>>(new Set());

  // For legacy compatibility
  const breakTimer = activeBreakTimer;

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
      
      // Fetch active notifications that haven't been dismissed
      // With our new simplified system, we fetch the most recent notification
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (notificationsError) {
        console.error("Error fetching notifications:", notificationsError);
        return;
      }
      
      if (notifications && notifications.length > 0) {
        // Check if notification is in our permanently dismissed list
        const notification = notifications[0];
        
        // If this notification has already been permanently dismissed, don't show it
        if (!permanentlyDismissedNotifications.has(notification.id)) {
          // Check if this notification has already been dismissed in this session
          if (!notificationsDismissed.has(notification.id)) {
            // Map database notification to our type
            setActiveNotification({
              id: notification.id,
              title: notification.title,
              content: notification.content,
              image_url: notification.image_url,
              image_path: notification.image_url, // For compatibility with components expecting image_path
              start_time: notification.start_time,
              end_time: notification.end_time,
              is_active: notification.is_active
            });
          } else {
            // If the notification was dismissed in this session, keep it null
            setActiveNotification(null);
          }
        } else {
          // Don't show permanently dismissed notifications
          setActiveNotification(null);
        }
      } else {
        setActiveNotification(null);
      }
      
      setLastFetchedTime(now);
    } catch (error) {
      console.error("Error in fetchActiveBreakTimers:", error);
    }
  }, [notificationsDismissed, permanentlyDismissedNotifications]);

  // New method to fetch upcoming break timers
  const fetchUpcomingBreakTimers = useCallback(async () => {
    try {
      const now = new Date();
      const { data, error } = await supabase
        .from('break_timer')
        .select('*')
        .eq('is_active', true)
        .gt('start_time', now.toISOString())
        .order('start_time');
      
      if (error) {
        console.error("Error fetching upcoming break timers:", error);
        return [];
      }
      
      console.log("Processed upcoming timers:", data?.length);
      return data || [];
    } catch (error) {
      console.error("Error in fetchUpcomingBreakTimers:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    // Fetch active alerts initially
    fetchActiveBreakTimers();
    
    // Set up interval to check periodically
    const intervalId = setInterval(() => {
      fetchActiveBreakTimers();
    }, 60000); // Check every minute
    
    // Setup realtime subscription for notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', 
        { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'notifications' 
        }, 
        (payload) => {
          console.log('Notification deleted:', payload);
          
          // If the currently displayed notification was deleted, dismiss it
          if (activeNotification && activeNotification.id === payload.old.id) {
            console.log('Dismissing active notification because it was deleted');
            setActiveNotification(null);
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('Notification updated:', payload);
          
          // If the active notification was updated (e.g., deactivated), check and dismiss if needed
          if (activeNotification && activeNotification.id === payload.new.id) {
            if (!payload.new.is_active) {
              console.log('Dismissing active notification because it was deactivated');
              setActiveNotification(null);
            }
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('New notification created:', payload);
          
          // If there's no active notification, show the new one
          if (!activeNotification && !notificationsDismissed.has(payload.new.id)) {
            fetchActiveBreakTimers(); // Refetch to update the UI with the new notification
          }
        }
      )
      .subscribe();
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [fetchActiveBreakTimers, activeNotification, notificationsDismissed]);

  const dismissBreakTimer = useCallback(() => {
    setActiveBreakTimer(null);
  }, []);
  
  const dismissNotification = useCallback(() => {
    if (activeNotification) {
      // Add dismissed notification to both session and permanent storage
      setNotificationsDismissed(prev => new Set(prev).add(activeNotification.id));
      
      // Also add to permanently dismissed notifications to prevent 
      // it from showing up again even after the end time
      setPermanentlyDismissedNotifications(prev => new Set(prev).add(activeNotification.id));
    }
    setActiveNotification(null);
  }, [activeNotification]);

  // Method to close/deactivate a break timer
  const closeBreakTimer = useCallback(async (timerId?: string) => {
    try {
      if (timerId) {
        // Deactivate specific timer
        const { error } = await supabase
          .from('break_timer')
          .update({ is_active: false })
          .eq('id', timerId);
          
        if (error) {
          throw error;
        }
        
        // If this timer was the active one, dismiss it
        if (activeBreakTimer && activeBreakTimer.id === timerId) {
          dismissBreakTimer();
        }
      } else {
        // Dismiss active timer without deactivating in DB
        dismissBreakTimer();
      }
      
      // Refresh timers
      await fetchActiveBreakTimers();
    } catch (error) {
      console.error("Error closing break timer:", error);
      throw error;
    }
  }, [activeBreakTimer, dismissBreakTimer, fetchActiveBreakTimers]);

  const value: SystemAlertsContextType = {
    activeBreakTimer,
    activeNotification,
    dismissBreakTimer,
    dismissNotification,
    fetchActiveBreakTimers,
    fetchUpcomingBreakTimers,
    closeBreakTimer,
    breakTimer, // Added for backwards compatibility
  };

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
