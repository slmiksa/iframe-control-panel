
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const NotificationCard: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>تم إلغاء نظام الإشعارات</CardTitle>
        <CardDescription>تم إزالة نظام الإشعارات من التطبيق</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">تم إلغاء نظام الإشعارات بناءً على طلبك لأنه كان يواجه مشاكل في العمل.</p>
      </CardContent>
    </Card>
  );
};
