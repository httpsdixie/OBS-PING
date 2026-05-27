/**
 * DeadlinePickerModal — pick a deadline on the task calendar (see existing tasks by day).
 */
import { useState, useMemo } from "react";
import {
  format, parseISO, setHours, setMinutes, addDays, isBefore,
} from "date-fns";
import { useTasks } from "../../hooks/useTasks";
import Modal from "../ui/Modal";
import CalendarView from "./CalendarView";
import Spinner from "../ui/Spinner";

function toDatetimeLocalValue(date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

function parseDeadlineValue(value) {
  if (!value) return { day: null, time: "17:00" };
  try {
    const d = parseISO(value);
    return { day: d, time: format(d, "HH:mm") };
  } catch {
    return { day: null, time: "17:00" };
  }
}

export default function DeadlinePickerModal({ value, onSelect, onClose }) {
  const { tasks, loading } = useTasks({ archived: false });
  const minDate = addDays(new Date(), 2);
  const initial = parseDeadlineValue(value);

  const [selectedDay, setSelectedDay] = useState(initial.day);
  const [time, setTime] = useState(initial.time);

  const combined = useMemo(() => {
    if (!selectedDay) return null;
    const [h, m] = time.split(":").map(Number);
    return setMinutes(setHours(selectedDay, h || 17), m || 0);
  }, [selectedDay, time]);

  const tooSoon = combined && isBefore(combined, minDate);

  const handleConfirm = () => {
    if (!combined || tooSoon) return;
    onSelect(toDatetimeLocalValue(combined));
    onClose();
  };

  return (
    <Modal title="Pick deadline" onClose={onClose} size="xl" zIndex={60}>
      <p className="text-xs text-gray-500 mb-3">
        See what is already due on each day, then choose a date and time. Deadlines must be at least 2 days from now.
      </p>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          <CalendarView
            tasks={tasks}
            selectMode
            compact
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
            minDate={minDate}
          />

          <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label className="label">Time</label>
              <input
                type="time"
                className="input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!selectedDay}
              />
            </div>
            <div className="flex-1 sm:flex-[2] min-w-0">
              <label className="label">Selected</label>
              <p className="text-sm text-gray-700 py-2">
                {selectedDay && combined
                  ? format(combined, "EEEE, MMM d, yyyy 'at' h:mm a")
                  : "Click a date on the calendar"}
              </p>
              {tooSoon && (
                <p className="text-xs text-red-600">Must be at least 2 days from now.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-gray-100">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleConfirm}
              disabled={!combined || tooSoon}
            >
              Set deadline
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}