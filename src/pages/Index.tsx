
import React from "react";
import { useIframe } from "@/contexts/IframeContext";
import Clock from "@/components/Clock";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { iframeUrl, isLoading } = useIframe();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!iframeUrl && !isLoading && (
        <>
          <header className="bg-white shadow-sm p-4">
            <h1 className="text-2xl font-bold text-blue-700 text-center">Iframe | Trindsky</h1>
          </header>
          
          <Clock />
        </>
      )}
      
      <div className={`flex-grow flex flex-col items-center justify-center ${iframeUrl ? 'p-0 h-screen' : 'p-4'}`}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500">جاري التحميل...</p>
          </div>
        ) : iframeUrl ? (
          <div className="w-full h-full">
            <iframe
              src={iframeUrl}
              className="w-full h-full border-0"
              title="External Website"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="w-full max-w-6xl h-[70vh] bg-white shadow-md rounded-lg flex items-center justify-center text-gray-400">
            <p className="text-xl">Please add a website URL from the control panel</p>
          </div>
        )}
      </div>

      {!iframeUrl && !isLoading && (
        <footer className="bg-gray-100 p-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Trindsky - All rights reserved
        </footer>
      )}
    </div>
  );
};

export default Index;
