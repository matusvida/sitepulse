export const ACTIVITY_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  UNKNOWN: "unknown",
} as const;

export const ACTIVITY_CONFIDENCE = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export const WEATHER_STATUS = {
  CLEAR_OR_NORMAL: "clear_or_normal",
  RAIN: "rain",
  SNOW: "snow",
  UNCLEAR: "unclear",
} as const;

export type ActivityStatus = (typeof ACTIVITY_STATUS)[keyof typeof ACTIVITY_STATUS];
export type ActivityConfidence = (typeof ACTIVITY_CONFIDENCE)[keyof typeof ACTIVITY_CONFIDENCE];
export type WeatherStatus = (typeof WEATHER_STATUS)[keyof typeof WEATHER_STATUS];
