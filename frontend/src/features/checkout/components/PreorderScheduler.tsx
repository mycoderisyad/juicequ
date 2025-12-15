"use client";

import { Calendar, Clock } from "lucide-react";

interface PreorderSchedulerProps {
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  pickupDate: string;
  onDateChange: (date: string) => void;
  pickupTime: string;
  onTimeChange: (time: string) => void;
}

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00",
];

function getMinDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

function getMaxDate(): string {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7);
  return maxDate.toISOString().split("T")[0];
}

export function PreorderScheduler({
  isEnabled,
  onToggle,
  pickupDate,
  onDateChange,
  pickupTime,
  onTimeChange,
}: PreorderSchedulerProps) {
  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(e.target.checked);
    if (!e.target.checked) {
      onDateChange("");
      onTimeChange("");
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          Pickup Schedule
        </h2>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleToggle}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-green-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-green-300" />
          <span className="ml-2 text-sm text-gray-600">Pre-order</span>
        </label>
      </div>

      {isEnabled ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Order now, pick up at your scheduled time. Pre-order available for 1-7 days ahead.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Pickup Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Pickup Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <select
                  value={pickupTime}
                  onChange={(e) => onTimeChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-gray-900 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20"
                >
                  <option value="">Select time</option>
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {pickupDate && pickupTime && (
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm text-green-700">
                <span className="font-semibold">Scheduled Pickup:</span>{" "}
                {new Date(pickupDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {pickupTime}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Order will be processed immediately after payment is confirmed. Enable pre-order to schedule pickup.
        </p>
      )}
    </div>
  );
}
