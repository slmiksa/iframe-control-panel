
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SimpleTimePickerProps {
  label: string;
  value: Date;
  onChange: (newDate: Date) => void;
}

export const SimpleTimePicker: React.FC<SimpleTimePickerProps> = ({ label, value, onChange }) => {
  const hours = value.getHours();
  const minutes = value.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  
  // Convert hours to 12-hour format
  const displayHours = hours % 12 || 12;
  
  const handleHourChange = (newHour: string) => {
    const newDate = new Date(value);
    let hour = parseInt(newHour);
    
    // Convert to 24-hour format based on AM/PM
    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }
    
    newDate.setHours(hour);
    onChange(newDate);
  };
  
  const handleMinuteChange = (newMinute: string) => {
    const newDate = new Date(value);
    newDate.setMinutes(parseInt(newMinute));
    onChange(newDate);
  };
  
  const handlePeriodChange = (newPeriod: string) => {
    const newDate = new Date(value);
    let hour = newDate.getHours();
    
    if (newPeriod === 'AM' && hour >= 12) {
      // Convert from PM to AM
      hour -= 12;
    } else if (newPeriod === 'PM' && hour < 12) {
      // Convert from AM to PM
      hour += 12;
    }
    
    newDate.setHours(hour);
    onChange(newDate);
  };
  
  // Generate options for hours (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // Generate options for minutes (00-55 in increments of 5)
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);
  
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex space-x-2 rtl:space-x-reverse">
        <div className="w-1/3">
          <Select 
            value={displayHours.toString()} 
            onValueChange={handleHourChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="ساعة" />
            </SelectTrigger>
            <SelectContent>
              {hourOptions.map(hour => (
                <SelectItem key={`hour-${hour}`} value={hour.toString()}>
                  {hour}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-1/3">
          <Select 
            value={minutes.toString()} 
            onValueChange={handleMinuteChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="دقيقة" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map(minute => (
                <SelectItem key={`minute-${minute}`} value={minute.toString()}>
                  {minute.toString().padStart(2, '0')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-1/3">
          <Select 
            value={period} 
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="ص/م" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AM">صباحاً</SelectItem>
              <SelectItem value="PM">مساءً</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
