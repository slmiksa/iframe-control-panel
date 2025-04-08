
import React, { createContext, useState, useContext } from "react";

interface IframeContextProps {
  iframeUrl: string;
  setIframeUrl: React.Dispatch<React.SetStateAction<string>>;
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  login: (username: string, password: string) => boolean;
}

const IframeContext = createContext<IframeContextProps | undefined>(undefined);

export const IframeProvider = ({ children }: { children: React.ReactNode }) => {
  const [iframeUrl, setIframeUrl] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const login = (username: string, password: string): boolean => {
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  return (
    <IframeContext.Provider value={{ iframeUrl, setIframeUrl, isLoggedIn, setIsLoggedIn, login }}>
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
