
import React from "react";
import { useNavigate } from "react-router-dom";
import { useIframe } from "@/contexts/IframeContext";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { iframeUrl, isLoading, isLoggedIn } = useIframe();
  const navigate = useNavigate();

  const handleAdminClick = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Admin Button */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">Trindsky</h1>
        <Button 
          onClick={handleAdminClick} 
          className="bg-blue-700 hover:bg-blue-800"
        >
          لوحة التحكم
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {isLoading ? (
          <div className="flex h-full justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : iframeUrl ? (
          <iframe
            src={iframeUrl}
            className="w-full h-full min-h-[calc(100vh-64px)]"
            title="Embedded Website"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        ) : (
          <div className="flex h-full justify-center items-center">
            <div className="text-center p-6 max-w-md">
              <h2 className="text-2xl font-bold mb-4">لم يتم تعيين رابط بعد</h2>
              <p className="text-gray-600 mb-4">
                يرجى تسجيل الدخول كمسؤول وتعيين الرابط في لوحة التحكم
              </p>
              <Button onClick={handleAdminClick}>
                الذهاب إلى لوحة التحكم
              </Button>
            </div>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-white p-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Trindsky - All rights reserved
      </footer>
    </div>
  );
};

export default Index;
