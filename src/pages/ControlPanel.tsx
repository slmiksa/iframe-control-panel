
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIframe } from "@/contexts/IframeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const ControlPanel = () => {
  const { iframeUrl, setIframeUrl, setIsLoggedIn, isLoading } = useIframe();
  const [urlInput, setUrlInput] = useState(iframeUrl);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic URL validation
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
      
      // Navigate to the home page to view the iframe
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
    </div>
  );
};

export default ControlPanel;
