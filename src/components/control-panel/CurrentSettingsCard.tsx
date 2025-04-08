
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type CurrentSettingsCardProps = {
  iframeUrl: string;
  isLoading: boolean;
};

export const CurrentSettingsCard: React.FC<CurrentSettingsCardProps> = ({
  iframeUrl,
  isLoading,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>الإعدادات الحالية</CardTitle>
        <CardDescription>عرض التكوين الحالي</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="font-medium">الرابط النشط: </span>
            {isLoading ? (
              <span className="flex items-center text-gray-400">
                <Loader2 className="animate-spin mr-2" size={16} />
                جاري التحميل...
              </span>
            ) : (
              <span className="text-gray-600">{iframeUrl || "لا يوجد رابط محدد"}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
