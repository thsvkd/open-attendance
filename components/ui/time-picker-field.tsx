"use client";

import { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface TimePickerFieldProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
}

export function TimePickerField({
  label,
  value,
  onChange,
  placeholder,
}: TimePickerFieldProps) {
  const t = useTranslations("common");
  const [open, setOpen] = useState(false);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const [selectedHour, selectedMinute] = value.split(":").map(Number);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const hourEl = hourRef.current?.querySelector(
          `[data-value="${selectedHour}"]`,
        );
        const minEl = minuteRef.current?.querySelector(
          `[data-value="${selectedMinute}"]`,
        );

        hourEl?.scrollIntoView({ block: "center", behavior: "auto" });
        minEl?.scrollIntoView({ block: "center", behavior: "auto" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, selectedHour, selectedMinute]);

  const handleHourSelect = (hour: number) => {
    const timeStr = `${String(hour).padStart(2, "0")}:${String(selectedMinute ?? 0).padStart(2, "0")}`;
    onChange(timeStr);
  };

  const handleMinuteSelect = (minute: number) => {
    const timeStr = `${String(selectedHour ?? 9).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    onChange(timeStr);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full h-11 justify-start text-left font-normal bg-background hover:bg-accent/50 transition-colors border-muted-foreground/20",
              !value && "text-muted-foreground",
            )}
          >
            <Clock className="mr-2 h-4 w-4 opacity-50" />
            <span className="text-base font-medium">
              {value || placeholder || t("selectTime")}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-64 p-0 bg-background border rounded-md shadow-lg"
          align="start"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
              <div className="text-sm font-medium text-foreground">
                {t("selectTime")}
              </div>
            </div>
            <div className="flex h-56 overflow-hidden relative">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-9 bg-accent/30 pointer-events-none rounded-sm mx-2 z-0" />

              {/* Hours Column */}
              <div
                ref={hourRef}
                className="flex-1 overflow-y-auto scrollbar-hide snap-y snap-mandatory z-10 py-[94px]"
              >
                {hours.map((hour) => (
                  <button
                    key={hour}
                    data-value={hour}
                    onClick={() => handleHourSelect(hour)}
                    className={cn(
                      "w-full h-9 flex items-center justify-center text-sm transition-all snap-center select-none cursor-pointer",
                      hour === selectedHour
                        ? "text-primary font-semibold text-base"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/10",
                    )}
                  >
                    {String(hour).padStart(2, "0")}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center text-muted-foreground pb-1 z-10">
                :
              </div>

              {/* Minutes Column */}
              <div
                ref={minuteRef}
                className="flex-1 overflow-y-auto scrollbar-hide snap-y snap-mandatory z-10 py-[94px]"
              >
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    data-value={minute}
                    onClick={() => handleMinuteSelect(minute)}
                    className={cn(
                      "w-full h-9 flex items-center justify-center text-sm transition-all snap-center select-none cursor-pointer",
                      minute === selectedMinute
                        ? "text-primary font-semibold text-base"
                        : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/10",
                    )}
                  >
                    {String(minute).padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-2 border-t bg-muted/20">
            <Button size="sm" className="w-full" onClick={() => setOpen(false)}>
              {t("confirm")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
