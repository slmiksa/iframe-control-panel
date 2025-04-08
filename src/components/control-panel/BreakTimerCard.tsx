
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimpleTimePicker } from "@/components/SimpleTimePicker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

type BreakTimerCardProps = {
  fetchActiveBreakTimers: () => void;
};

export const BreakTimerCard: React.FC<BreakTimerCardProps> = ({ fetchActiveBreakTimers }) => {
  const [breakTimerTitle, setBreakTimerTitle] = useState("");
  const [breakTimerStart, setBreakTimerStart] = useState<Date>(new Date());
  const [breakTimerEnd, setBreakTimerEnd] = useState<Date>(() => {
    const endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + 30);
    return endTime;
  });
  const [isRecurring, setIsRecurring] = useState(false);

  const handleCreateBreakTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!breakTimerTitle) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال عنوان للمؤقت",
        variant: "destructive"
      });
      return;
    }
    
    if (breakTimerEnd.getTime() <= breakTimerStart.getTime()) {
      toast({
        title: "خطأ",
        description: "يجب أن يكون وقت الإنتهاء بعد وقت البدء",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newTimer = {
        title: breakTimerTitle,
        start_time: breakTimerStart.toISOString(),
        end_time: breakTimerEnd.toISOString(),
        is_active: true,
        is_recurring: isRecurring
      };
      
      if (!isRecurring) {
        await supabase
          .from('break_timer')
          .update({ is_active: false })
          .eq('is_active', true)
          .eq('is_recurring', false);
      }
      
      const { error, data } = await supabase
        .from('break_timer')
        .insert(newTimer)
        .select();
        
      if (error) {
        console.error("Error creating break timer:", error);
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء إنشاء مؤقت البريك",
          variant: "destructive"
        });
        return;
      }

      console.log("Successfully created break timer:", data);
      
      setBreakTimerTitle("");
      
      toast({
        title: "تم بنجاح",
        description: isRecurring 
          ? "تم إنشاء مؤقت البريك المتكرر وسيظهر في الوقت المحدد يوميا" 
          : "تم إنشاء مؤقت البريك وسيظهر في الوقت المحدد",
      });
      
      fetchActiveBreakTimers();
      
      const timerComponents = document.querySelectorAll('[data-timer-list]');
      if (timerComponents.length > 0) {
        console.log("Forcing timer list components to refresh");
      }
    } catch (error) {
      console.error("Error creating break timer:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ غير متوقع أثناء إنشاء المؤقت",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>إنشاء مؤقت البريك</CardTitle>
        <CardDescription>أنشئ مؤقت جديد للبريك إما لمرة واحدة أو متكرر يوميا</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateBreakTimer} className="space-y-4">
          <Input
            placeholder="عنوان مؤقت البريك"
            value={breakTimerTitle}
            onChange={(e) => setBreakTimerTitle(e.target.value)}
            required
            className="mb-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <SimpleTimePicker 
              label="وقت البدء"
              value={breakTimerStart}
              onChange={setBreakTimerStart}
            />
            <SimpleTimePicker 
              label="وقت الانتهاء"
              value={breakTimerEnd}
              onChange={setBreakTimerEnd}
            />
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-4">
            <Switch 
              id="recurring-mode" 
              checked={isRecurring}
              onCheckedChange={setIsRecurring} 
            />
            <Label htmlFor="recurring-mode">تكرار يومي (سيعمل المؤقت كل يوم في نفس الوقت)</Label>
          </div>
          
          <Button type="submit" className="w-full">إنشاء مؤقت البريك</Button>
        </form>
      </CardContent>
    </Card>
  );
};
