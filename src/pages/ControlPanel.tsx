
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useIframe } from "@/contexts/IframeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const ControlPanel = () => {
  const { iframeUrl, setIframeUrl } = useIframe();
  const [urlInput, setUrlInput] = useState(iframeUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic URL validation
    let formattedUrl = urlInput.trim();
    
    if (formattedUrl && !formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    if (!formattedUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid URL",
        variant: "destructive",
      });
      return;
    }

    setIframeUrl(formattedUrl);
    toast({
      title: "Success",
      description: "Website URL has been updated",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-700">Control Panel | Trindsky</h1>
        <Link 
          to="/" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Back to Website
        </Link>
      </header>

      <main className="flex-grow container mx-auto p-6">
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Website Embedding</CardTitle>
              <CardDescription>Enter the URL of the website you want to display in the iframe</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="iframe-url" className="font-medium">Website URL</label>
                  <div className="flex gap-2">
                    <Input
                      id="iframe-url"
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com"
                      className="flex-grow"
                    />
                    <Button type="submit">Apply</Button>
                  </div>
                  <p className="text-sm text-gray-500">
                    Enter the full URL including http:// or https:// prefix
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Current Settings</CardTitle>
              <CardDescription>View your current configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Active URL: </span>
                  <span className="text-gray-600">{iframeUrl || "No URL set"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="bg-white p-4 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Trindsky - All rights reserved
      </footer>
    </div>
  );
};

export default ControlPanel;
