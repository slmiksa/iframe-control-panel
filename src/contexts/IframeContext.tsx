
import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/use-toast";

interface IframeContextProps {
  iframeUrl: string;
  setIframeUrl: (url: string) => Promise<void>; 
  isLoggedIn: boolean;
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>;
  login: (username: string, password: string) => Promise<boolean>;
  isLoading: boolean;
  admins: Admin[];
  addAdmin: (username: string, password: string) => Promise<boolean>;
  removeAdmin: (username: string) => Promise<boolean>;
}

type IframeUrl = {
  id: string;
  url: string;
  created_at: string | null;
  updated_at: string | null;
};

type Admin = {
  id?: string;
  username: string;
  password: string;
};

const IframeContext = createContext<IframeContextProps | undefined>(undefined);

export const IframeProvider = ({ children }: { children: React.ReactNode }) => {
  const [iframeUrl, setIframeUrlState] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [admins, setAdmins] = useState<Admin[]>([]);

  // Fetch the URL and admins from the database on initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch iframe URL
        const { data: urlData, error: urlError } = await supabase
          .from('iframe_urls')
          .select('*')
          .limit(1)
          .single();
          
        if (urlError) {
          console.error("Error fetching iframe URL:", urlError);
        } else if (urlData) {
          // Use type assertion to access the url property
          const urlRecord = urlData as IframeUrl;
          setIframeUrlState(urlRecord.url);
        }

        // Fetch admin users
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('id, username, password');

        if (adminError) {
          console.error("Error fetching admin users:", adminError);
        } else if (adminData) {
          setAdmins(adminData as Admin[]);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
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

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !adminData) {
        return false;
      }

      setIsLoggedIn(true);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const addAdmin = async (username: string, password: string): Promise<boolean> => {
    // Check if admin already exists
    try {
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .single();

      if (!checkError && existingAdmin) {
        // Admin already exists
        return false;
      }

      // Add the new admin
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert([{ username, password }]);

      if (insertError) {
        console.error("Error adding admin:", insertError);
        return false;
      }

      // Refresh the admin list
      const { data: newAdminList, error: fetchError } = await supabase
        .from('admin_users')
        .select('id, username, password');

      if (!fetchError && newAdminList) {
        setAdmins(newAdminList as Admin[]);
      }

      return true;
    } catch (error) {
      console.error("Error adding admin:", error);
      return false;
    }
  };

  const removeAdmin = async (username: string): Promise<boolean> => {
    // Don't allow removing the default admin
    if (username === "admin") {
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('username', username);

      if (error) {
        console.error("Error removing admin:", error);
        return false;
      }

      // Refresh the admin list
      const { data: updatedAdminList, error: fetchError } = await supabase
        .from('admin_users')
        .select('id, username, password');

      if (!fetchError && updatedAdminList) {
        setAdmins(updatedAdminList as Admin[]);
      }

      return true;
    } catch (error) {
      console.error("Error removing admin:", error);
      return false;
    }
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
