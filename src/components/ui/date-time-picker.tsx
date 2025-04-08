
import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format } from "date-fns"
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "./input"
 
interface DateTimePickerProps {
  date: Date
  setDate: (date: Date) => void
}
 
export function DateTimePicker({ date, setDate }: DateTimePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP HH:mm:ss") : <span>Select date and time</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => newDate && setDate(new Date(newDate))}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              type="time"
              step="1"
              value={format(date, "HH:mm:ss")}
              onChange={(e) => {
                const [hours, minutes, seconds] = e.target.value.split(':').map(Number);
                const newDate = new Date(date);
                newDate.setHours(hours || 0);
                newDate.setMinutes(minutes || 0);
                newDate.setSeconds(seconds || 0);
                setDate(newDate);
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
