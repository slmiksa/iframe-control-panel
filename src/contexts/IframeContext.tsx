
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
  admins: Admin[];
  addAdmin: (username: string, password: string) => boolean;
  removeAdmin: (username: string) => void;
}

type IframeUrl = {
  id: string;
  url: string;
  created_at: string | null;
  updated_at: string | null;
};

type Admin = {
  username: string;
  password: string;
};

const IframeContext = createContext<IframeContextProps | undefined>(undefined);

export const IframeProvider = ({ children }: { children: React.ReactNode }) => {
  const [iframeUrl, setIframeUrlState] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([
    { username: "admin", password: "admin" } // Default admin
  ]);

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
    const adminExists = admins.find(
      admin => admin.username === username && admin.password === password
    );
    
    if (adminExists) {
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const addAdmin = (username: string, password: string): boolean => {
    // Check if admin already exists
    if (admins.some(admin => admin.username === username)) {
      return false;
    }

    // Add the new admin
    setAdmins([...admins, { username, password }]);
    return true;
  };

  const removeAdmin = (username: string): void => {
    // Don't allow removing the default admin
    if (username === "admin") {
      return;
    }
    
    setAdmins(admins.filter(admin => admin.username !== username));
  };

  return (
    <IframeContext.Provider value={{ 
      iframeUrl, 
      setIframeUrl, 
      isLoggedIn, 
      setIsLoggedIn, 
      login,
      isLoading,
      admins,
      addAdmin,
      removeAdmin
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
