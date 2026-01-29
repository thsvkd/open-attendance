"use client";

import { useState, useRef, useCallback } from "react";
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
import { useTranslations } from "next-intl";

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
  placeholder,
}: DatePickerFieldProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [popoverSide, setPopoverSide] = useState<"top" | "bottom">("bottom");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const calculateOptimalSide = useCallback(() => {
    if (!triggerRef.current) return "bottom";

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Estimate calendar height (6 weeks max + header + padding)
    const estimatedCalendarHeight = 320;

    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Prefer bottom if there's enough space, otherwise use top
    if (spaceBelow >= estimatedCalendarHeight) {
      return "bottom";
    } else if (spaceAbove >= estimatedCalendarHeight) {
      return "top";
    } else {
      // If neither has enough space, use the side with more space
      return spaceBelow >= spaceAbove ? "bottom" : "top";
    }
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        // Calculate and fix position when opening
        setPopoverSide(calculateOptimalSide());
      }
      setOpen(isOpen);
    },
    [calculateOptimalSide],
  );

  const handleSelect = (date: Date | undefined) => {
    onSelect(date);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
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
              <span>{placeholder || t("pickDate")}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" side={popoverSide}>
          <Calendar mode="single" selected={selected} onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
    </div>
  );
}
