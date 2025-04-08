
import React from "react";
import { useIframe } from "@/contexts/IframeContext";
import Logo from "@/components/Logo";

const Index = () => {
  const { iframeUrl, isLoading } = useIframe();

  return (
    <div className="min-h-screen flex flex-col">
      {isLoading ? (
        <div className="flex h-full justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : iframeUrl ? (
        <iframe
          src={iframeUrl}
          className="w-full h-full min-h-screen"
          title="Embedded Website"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 p-4">
          <Logo size="giant" />
          <h2 className="mt-8 text-2xl font-medium text-gray-700 text-center">
            لم يتم تحديد رابط بعد. يرجى تسجيل الدخول لإضافة رابط.
          </h2>
        </div>
      )}
    </div>
  );
};

export default Index;
