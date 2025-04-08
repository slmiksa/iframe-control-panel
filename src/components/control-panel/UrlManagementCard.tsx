
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

type UrlManagementCardProps = {
  iframeUrl: string;
  setIframeUrl: (url: string) => Promise<void>;
  isLoading: boolean;
};

export const UrlManagementCard: React.FC<UrlManagementCardProps> = ({
  iframeUrl,
  setIframeUrl,
  isLoading,
}) => {
  const [urlInput, setUrlInput] = useState(iframeUrl);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

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

  return (
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
  );
};
