
import React, { createContext, useState, useContext } from "react";

interface IframeContextProps {
  iframeUrl: string;
  setIframeUrl: React.Dispatch<React.SetStateAction<string>>;
}

const IframeContext = createContext<IframeContextProps | undefined>(undefined);

export const IframeProvider = ({ children }: { children: React.ReactNode }) => {
  const [iframeUrl, setIframeUrl] = useState("");

  return (
    <IframeContext.Provider value={{ iframeUrl, setIframeUrl }}>
      {children}
    </IframeContext.Provider>
  );
};

export const useIframe = () => {
  const context = useContext(IframeContext);
  if (context === undefined) {
    throw new Error("useIframe must be used within an IframeProvider");
  }
  return context;
};
