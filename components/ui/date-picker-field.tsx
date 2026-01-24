"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DatePickerFieldProps {
  label: string;
  selected: Date | undefined;
  onSelect: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DatePickerField({
  label,
  selected,
  onSelect,
  placeholder = "Pick a date",
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    onSelect(date);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-12 justify-start text-left font-normal",
              !selected && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected ? (
              format(selected, "yyyy-MM-dd")
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar mode="single" selected={selected} onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
