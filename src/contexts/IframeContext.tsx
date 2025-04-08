
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

interface IframeContextProps {
  iframeUrl: string;
  setIframeUrl: (url: string) => Promise<void>; 
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  login: (username: string, password: string) => boolean;
  isLoading: boolean;
}

// Create a more specific type for the iframe_urls table rows
type IframeUrl = {
  id: string;
  url: string;
  created_at: string | null;
  updated_at: string | null;
};

const IframeContext = createContext<IframeContextProps | undefined>(undefined);

export const IframeProvider = ({ children }: { children: React.ReactNode }) => {
  const [iframeUrl, setIframeUrlState] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the URL from the database on initial load
  useEffect(() => {
    const fetchIframeUrl = async () => {
      try {
        // Use type casting to fix the TypeScript error
        const { data, error } = await supabase
          .from('iframe_urls')
          .select('*')
          .limit(1)
          .single();
          
        if (error) {
          console.error("Error fetching iframe URL:", error);
        } else if (data) {
          // Use type assertion to access the url property
          const urlData = data as IframeUrl;
          setIframeUrlState(urlData.url);
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

      // Add null check for idData before proceeding
      if (idData) {
        // Type assertion for idData
        const typedIdData = idData as { id: string };
        
        // Update the URL
        const { error } = await supabase
          .from('iframe_urls')
          .update({ url })
          .eq('id', typedIdData.id);

        if (error) {
          console.error("Error updating iframe URL:", error);
        } else {
          setIframeUrlState(url);
        }
      } else {
        console.error("No iframe URL record found to update");
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
