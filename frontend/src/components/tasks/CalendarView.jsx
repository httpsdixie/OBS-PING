/**
 * CalendarView — Google Calendar-style monthly grid.
 * Tasks appear as colored chips on their deadline date.
 * Navigate months with prev/next arrows.
 */
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, addMonths, subMonths, startOfDay, isBefore,
} from "date-fns";
import { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

const STATUS_CHIP = {
  assigned:       "bg-blue-100 text-blue-700",
  acknowledged:   "bg-blue-200 text-blue-800",
  submitted:      "bg-yellow-100 text-yellow-800",
  checked:        "bg-purple-100 text-purple-800",
  needs_revision: "bg-red-100 text-red-700",
  pending_eic:    "bg-orange-100 text-orange-800",
  published:      "bg-green-100 text-green-700",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({
  tasks,
  onTaskClick,
  selectMode = false,
  selectedDay = null,
  onDaySelect,
  minDate = null,
  compact = false,
}) {
  const [current, setCurrent] = useState(
    () => selectedDay ? startOfMonth(selectedDay) : new Date(),
  );

  const minDay = minDate ? startOfDay(minDate) : null;
  const cellMinH = compact ? "min-h-[72px]" : "min-h-[90px]";

  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(current);
  const gridStart  = startOfWeek(monthStart);
  const gridEnd    = endOfWeek(monthEnd);
  const days       = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // Map deadline date → tasks
  const tasksByDay = tasks.reduce((acc, t) => {
    const key = format(new Date(t.deadline), "yyyy-MM-dd");
    (acc[key] = acc[key] || []).push(t);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <button
          onClick={() => setCurrent((d) => subMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600"
          aria-label="Previous month"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="font-bold text-gray-900 text-lg">
            {format(current, "MMMM yyyy")}
          </p>
          <button
            onClick={() => setCurrent(new Date())}
            className="text-xs text-maroon-700 hover:underline"
          >
            Today
          </button>
        </div>

        <button
          onClick={() => setCurrent((d) => addMonths(d, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600"
          aria-label="Next month"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const key       = format(day, "yyyy-MM-dd");
          const dayTasks  = tasksByDay[key] || [];
          const inMonth   = isSameMonth(day, current);
          const today     = isToday(day);
          const isLast    = i === days.length - 1;
          const isLastRow = i >= days.length - 7;
          const disabled  = minDay && isBefore(startOfDay(day), minDay);
          const picked    = selectedDay && isSameDay(day, selectedDay);

          return (
            <div
              key={key}
              role={selectMode ? "button" : undefined}
              tabIndex={selectMode && !disabled ? 0 : undefined}
              onClick={() => {
                if (selectMode && !disabled && onDaySelect) onDaySelect(day);
              }}
              onKeyDown={(e) => {
                if (selectMode && !disabled && onDaySelect && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onDaySelect(day);
                }
              }}
              className={`${cellMinH} p-1.5 border-r border-b border-gray-100 ${
                !inMonth ? "bg-gray-50" : "bg-white"
              } ${disabled ? "opacity-40 cursor-not-allowed" : selectMode ? "cursor-pointer hover:bg-maroon-50/50" : ""} ${
                picked ? "ring-2 ring-inset ring-maroon-600 bg-maroon-50/30" : ""
              } ${isLast || (i + 1) % 7 === 0 ? "border-r-0" : ""} ${
                isLastRow ? "border-b-0" : ""
              }`}
            >
              <div className="flex justify-end mb-1">
                <span
                  className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    picked
                      ? "bg-maroon-700 text-white ring-2 ring-maroon-300"
                      : today
                      ? "bg-maroon-700 text-white"
                      : inMonth
                      ? "text-gray-700"
                      : "text-gray-300"
                  }`}
                >
                  {format(day, "d")}
                </span>
              </div>

              {/* Task chips — show up to 3, then "+N more" */}
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((t) =>
                  selectMode ? (
                    <span
                      key={t.id}
                      className={`block w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium ${
                        STATUS_CHIP[t.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                      title={t.title}
                    >
                      {t.title}
                    </span>
                  ) : (
                    <button
                      key={t.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick?.(t);
                      }}
                      className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate font-medium transition-opacity hover:opacity-80 ${
                        STATUS_CHIP[t.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                      title={t.title}
                    >
                      {t.title}
                    </button>
                  ),
                )}
                {dayTasks.length > 3 && (
                  <p className="text-xs text-gray-400 pl-1">
                    +{dayTasks.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectMode ? (
        <p className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
          Colored labels are existing tasks on that day. Click a date to set your deadline (must be at least 2 days ahead).
        </p>
      ) : (
        <div className="px-4 py-3 border-t border-gray-100 flex flex-wrap gap-2">
          {Object.entries(STATUS_CHIP).map(([status, cls]) => (
            <span key={status} className={`badge text-xs ${cls}`}>
              {status.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
