// Author: Lucas Mohler
// Shared option lists/labels for the survey's fixed-choice fields, mirroring
// the exact values the backend's Literal-typed schema fields accept.
export const LIKED_MOST_OPTIONS = [
  { value: "students", label: "Students" },
  { value: "location", label: "Location" },
  { value: "campus", label: "Campus" },
  { value: "atmosphere", label: "Atmosphere" },
  { value: "dorm_rooms", label: "Dorm Rooms" },
  { value: "sports", label: "Sports" },
];

export const REFERRAL_OPTIONS = [
  { value: "friends", label: "Friends" },
  { value: "television", label: "Television" },
  { value: "internet", label: "Internet" },
  { value: "other", label: "Other" },
];

export const LIKELIHOOD_OPTIONS = [
  { value: "very_likely", label: "Very Likely" },
  { value: "likely", label: "Likely" },
  { value: "unlikely", label: "Unlikely" },
];

export function labelFor(options, value) {
  return options.find((o) => o.value === value)?.label ?? value;
}
