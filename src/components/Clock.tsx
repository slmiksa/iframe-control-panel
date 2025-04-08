
import React, { useState, useEffect } from "react";

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mecca time is UTC+3
  const meccaTime = new Date(time.getTime() + 3 * 60 * 60 * 1000);
  
  // Format date for Mecca time
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: "Asia/Riyadh"
    };
    
    return new Intl.DateTimeFormat("en-US", options).format(date);
  };

  return (
    <div className="text-center p-4">
      <div className="text-2xl font-bold text-blue-600">{formatDate(meccaTime)}</div>
      <div className="text-sm text-gray-500">Mecca Time</div>
    </div>
  );
};

export default Clock;
