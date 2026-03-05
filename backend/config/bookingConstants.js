export const SLOTS = ["MORNING", "EVENING"];

export const SLOT_TIMES = {
  MORNING: { startTime: "09:00", endTime: "12:00" },
  EVENING: { startTime: "18:00", endTime: "21:00" },
};

export const DAYS_AHEAD = 30;

export const HOLD_MINUTES = 10;

// ✅ booking request expires after artist doesn't respond
export const BOOKING_PENDING_HOURS = 24;