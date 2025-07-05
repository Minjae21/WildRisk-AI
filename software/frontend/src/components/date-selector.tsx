"use client";

import React, { Dispatch, SetStateAction } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateSelectorProps {
  selectedDate: Date | undefined;
  onDateChange: Dispatch<SetStateAction<Date | undefined>>;
}

const DateSelector = ({
  selectedDate,
  onDateChange,
}: DateSelectorProps): React.ReactElement => {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    console.log("Date Selected:", date);
    onDateChange(date);
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="w-full">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start bg-white text-left font-normal",
              !selectedDate && "text-muted-foreground"
            )}
            type="button"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "PPP")
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {selectedDate && (
        <div className="mt-2 text-xs text-green-600 hidden">
          Selected: {format(selectedDate, "PPP")}
        </div>
      )}
    </div>
  );
};

export default DateSelector;
