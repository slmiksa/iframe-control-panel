
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface IframeContextProps {
  iframeUrl: string;
  setIframeUrl: (url: string) => Promise<void>; // Changed to async function
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  login: (username: string, password: string) => boolean;
  isLoading: boolean;
}

const IframeContext = createContext<IframeContextProps | undefined>(undefined);

export const IframeProvider = ({ children }: { children: React.ReactNode }) => {
  const [iframeUrl, setIframeUrlState] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the URL from the database on initial load
  useEffect(() => {
    const fetchIframeUrl = async () => {
      try {
        const { data, error } = await supabase
          .from('iframe_urls')
          .select('url')
          .limit(1)
          .single();
          
        if (error) {
          console.error("Error fetching iframe URL:", error);
        } else if (data) {
          setIframeUrlState(data.url);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIframeUrl();
  }, []);

  // Function to update the URL in the database
  const setIframeUrl = async (url: string) => {
    setIsLoading(true);
    try {
      // Get the first record's ID
      const { data: idData, error: idError } = await supabase
        .from('iframe_urls')
        .select('id')
        .limit(1)
        .single();

      if (idError) {
        console.error("Error fetching iframe URL ID:", idError);
        return;
      }

      // Update the URL
      const { error } = await supabase
        .from('iframe_urls')
        .update({ url })
        .eq('id', idData.id);

      if (error) {
        console.error("Error updating iframe URL:", error);
      } else {
        setIframeUrlState(url);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (username: string, password: string): boolean => {
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  return (
    <IframeContext.Provider value={{ 
      iframeUrl, 
      setIframeUrl, 
      isLoggedIn, 
      setIsLoggedIn, 
      login,
      isLoading
    }}>
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
