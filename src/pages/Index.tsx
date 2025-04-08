
import React from "react";
import { useIframe } from "@/contexts/IframeContext";

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
      ) : null}
    </div>
  );
};

export default Index;
