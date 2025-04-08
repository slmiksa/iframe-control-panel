
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIframe } from "@/contexts/IframeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSystemAlerts } from "@/contexts/SystemAlertsContext";
import { Calendar } from "@/components/ui/calendar";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const ControlPanel = () => {
  const { iframeUrl, setIframeUrl, setIsLoggedIn, isLoading, admins, addAdmin, removeAdmin } = useIframe();
  const [urlInput, setUrlInput] = useState(iframeUrl);
  const [submitting, setSubmitting] = useState(false);
  
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [isRemovingAdmin, setIsRemovingAdmin] = useState(false);
  
  const navigate = useNavigate();
  const { createBreakTimer, createNotification } = useSystemAlerts();

  const [breakTimerTitle, setBreakTimerTitle] = useState("");
  const [breakTimerStart, setBreakTimerStart] = useState<Date>(new Date());
  const [breakTimerEnd, setBreakTimerEnd] = useState<Date>(new Date());

  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationContent, setNotificationContent] = useState("");
  const [notificationImage, setNotificationImage] = useState<File | null>(null);
  const [notificationStart, setNotificationStart] = useState<Date>(new Date());
  const [notificationEnd, setNotificationEnd] = useState<Date>(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let formattedUrl = urlInput.trim();
    
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    if (!formattedUrl) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط صالح",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      await setIframeUrl(formattedUrl);
      
      toast({
        title: "تم بنجاح",
        description: "تم تحديث رابط الموقع",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error updating URL:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث الرابط",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    navigate("/login");
    toast({
      title: "تم تسجيل الخروج",
      description: "تم تسجيل خروجك بنجاح",
    });
  };
  
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminUsername || !newAdminPassword) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }
    
    setIsAddingAdmin(true);
    
    try {
      const added = await addAdmin(newAdminUsername, newAdminPassword);
      
      if (added) {
        toast({
          title: "تم بنجاح",
          description: "تمت إضافة المسؤول بنجاح",
        });
        setNewAdminUsername("");
        setNewAdminPassword("");
      } else {
        toast({
          title: "خطأ",
          description: "اسم المستخدم موجود بالفعل",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المسؤول",
        variant: "destructive",
      });
    } finally {
      setIsAddingAdmin(false);
    }
  };
  
  const handleRemoveAdmin = async (username: string) => {
    if (username === "admin") {
      toast({
        title: "خطأ",
        description: "لا يمكن حذف المسؤول الافتراضي",
        variant: "destructive",
      });
      return;
    }
    
    setIsRemovingAdmin(true);
    
    try {
      const removed = await removeAdmin(username);
      if (removed) {
        toast({
          title: "تم بنجاح",
          description: "تم حذف المسؤول بنجاح",
        });
      } else {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء حذف المسؤول",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error removing admin:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف المسؤول",
        variant: "destructive",
      });
    } finally {
      setIsRemovingAdmin(false);
    }
  };

  const handleCreateBreakTimer = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await createBreakTimer({
      title: breakTimerTitle,
      start_time: breakTimerStart.toISOString(),
      end_time: breakTimerEnd.toISOString(),
      is_active: true
    });

    if (success) {
      toast({
        title: "نجاح",
        description: "تم إنشاء مؤقت البريك بنجاح"
      });
      setBreakTimerTitle("");
      setBreakTimerStart(new Date());
      setBreakTimerEnd(new Date());
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let imageUrl = "";
    if (notificationImage) {
      const { data, error } = await supabase.storage
        .from('notifications')
        .upload(`${Date.now()}_${notificationImage.name}`, notificationImage);
      
      if (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء رفع الصورة",
          variant: "destructive"
        });
        return;
      }

      imageUrl = data?.path || "";
    }

    const success = await createNotification({
      title: notificationTitle,
      content: notificationContent,
      image_url: imageUrl,
      start_time: notificationStart.toISOString(),
      end_time: notificationEnd.toISOString(),
      is_active: true
    });

    if (success) {
      toast({
        title: "نجاح",
        description: "تم إنشاء الإشعار بنجاح"
      });
      setNotificationTitle("");
      setNotificationContent("");
      setNotificationImage(null);
      setNotificationStart(new Date());
      setNotificationEnd(new Date());
    }
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
          <Card>
            <CardHeader>
              <CardTitle>إدراج الموقع</CardTitle>
              <CardDescription>أدخل رابط الموقع الذي تريد عرضه في الإطار</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="iframe-url" className="font-medium">رابط الموقع</label>
                  <div className="flex gap-2">
                    <Input
                      id="iframe-url"
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-grow"
                      disabled={isLoading || submitting}
                    />
                    <Button type="submit" disabled={isLoading || submitting}>
                      {(isLoading || submitting) ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                      تطبيق
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    أدخل الرابط كاملاً بما في ذلك http:// أو https://
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
              <CardDescription>إضافة وإدارة مستخدمي لوحة التحكم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="admin-username" className="font-medium">اسم المستخدم</label>
                      <Input
                        id="admin-username"
                        type="text"
                        value={newAdminUsername}
                        onChange={(e) => setNewAdminUsername(e.target.value)}
                        placeholder="اسم المستخدم الجديد"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="admin-password" className="font-medium">كلمة المرور</label>
                      <Input
                        id="admin-password"
                        type="password"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="كلمة المرور"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button type="submit" className="w-full md:w-auto" disabled={isAddingAdmin}>
                        {isAddingAdmin ? <Loader2 className="animate-spin h-4 w-4" /> : null}
                        إضافة مسؤول جديد
                      </Button>
                    </div>
                  </div>
                </form>
                
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم المستخدم</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4">
                            <Loader2 className="animate-spin mx-auto" size={24} />
                          </TableCell>
                        </TableRow>
                      ) : admins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-4">
                            لا يوجد مسؤولين
                          </TableCell>
                        </TableRow>
                      ) : (
                        admins.map((admin) => (
                          <TableRow key={admin.id || admin.username}>
                            <TableCell>{admin.username}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAdmin(admin.username)}
                                disabled={admin.username === "admin" || isRemovingAdmin}
                              >
                                {isRemovingAdmin ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          
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
        </div>
      </main>

      <footer className="bg-white p-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Trindsky - All rights reserved
      </footer>

      <Card>
        <CardHeader>
          <CardTitle>إنشاء مؤقت البريك</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBreakTimer} className="space-y-4">
            <Input
              placeholder="عنوان مؤقت البريك"
              value={breakTimerTitle}
              onChange={(e) => setBreakTimerTitle(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>وقت البدء</label>
                <DateTimePicker 
                  date={breakTimerStart}
                  setDate={setBreakTimerStart}
                />
              </div>
              <div>
                <label>وقت الانتهاء</label>
                <DateTimePicker 
                  date={breakTimerEnd}
                  setDate={setBreakTimerEnd}
                />
              </div>
            </div>
            <Button type="submit">إنشاء مؤقت البريك</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>إنشاء إشعار</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateNotification} className="space-y-4">
            <Input
              placeholder="عنوان الإشعار"
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="محتوى الإشعار"
              value={notificationContent}
              onChange={(e) => setNotificationContent(e.target.value)}
            />
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setNotificationImage(e.target.files?.[0] || null)}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>وقت البدء</label>
                <DateTimePicker 
                  date={notificationStart}
                  setDate={setNotificationStart}
                />
              </div>
              <div>
                <label>وقت الانتهاء</label>
                <DateTimePicker 
                  date={notificationEnd}
                  setDate={setNotificationEnd}
                />
              </div>
            </div>
            <Button type="submit">إنشاء الإشعار</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ControlPanel;
