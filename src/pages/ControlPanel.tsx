import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIframe } from "@/contexts/IframeContext";
import { Button } from "@/components/ui/button";
import { useSystemAlerts } from "@/contexts/SystemAlertsContext";
import { UrlManagementCard } from "@/components/control-panel/UrlManagementCard";
import { AdminManagementCard } from "@/components/control-panel/AdminManagementCard";
import { CurrentSettingsCard } from "@/components/control-panel/CurrentSettingsCard";
import { BreakTimerCard } from "@/components/control-panel/BreakTimerCard";
import { NotificationCard } from "@/components/control-panel/NotificationCard";
import { TimerListSection } from "@/components/control-panel/TimerListSection";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ControlPanel = () => {
  const { iframeUrl, setIframeUrl, setIsLoggedIn, isLoading, admins, addAdmin, removeAdmin } = useIframe();
  const navigate = useNavigate();
  const { fetchActiveBreakTimers } = useSystemAlerts();

  useEffect(() => {
    fetchActiveBreakTimers();
  }, [fetchActiveBreakTimers]);

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/admin/login");
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">Control Panel | Trindsky</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate("/")} 
            variant="outline"
          >
            العودة إلى الموقع
          </Button>
          <Button 
            onClick={handleLogout} 
            variant="destructive"
          >
            تسجيل الخروج
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-6">
        <div className="grid grid-cols-1 gap-6">
          <UrlManagementCard 
            iframeUrl={iframeUrl}
            setIframeUrl={setIframeUrl}
            isLoading={isLoading}
          />
          
          <AdminManagementCard
            admins={admins}
            addAdmin={addAdmin}
            removeAdmin={removeAdmin}
            isLoading={isLoading}
          />
          
          <CurrentSettingsCard 
            iframeUrl={iframeUrl} 
            isLoading={isLoading} 
          />
        </div>

        <Tabs defaultValue="timers" className="mt-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timers">أوقات البريك</TabsTrigger>
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timers" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BreakTimerCard fetchActiveBreakTimers={fetchActiveBreakTimers} />
              <TimerListSection />
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="mt-6">
            <NotificationCard />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-white p-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Trindsky - All rights reserved
      </footer>
    </div>
  );
};

export default ControlPanel;
