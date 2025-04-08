
import React from "react";
import { Link } from "react-router-dom";
import { useIframe } from "@/contexts/IframeContext";
import Clock from "@/components/Clock";

const Index = () => {
  const { iframeUrl } = useIframe();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">Iframe | Trindsky</h1>
        <Link 
          to="/control-panel" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Control Panel
        </Link>
      </header>
      
      <Clock />
      
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        {iframeUrl ? (
          <div className="w-full max-w-6xl h-[70vh] bg-white shadow-md rounded-lg overflow-hidden">
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

      <footer className="bg-gray-100 p-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Trindsky - All rights reserved
      </footer>
    </div>
  );
};

export default Index;
