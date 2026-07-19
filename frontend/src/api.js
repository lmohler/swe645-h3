// Author: Lucas Mohler
// Thin fetch wrapper for the survey REST API. Always calls the relative
// /api/surveys path; the dev server proxy and the production nginx config
// both forward that path to the FastAPI backend, so this file needs no
// environment-specific base URL.
const BASE_URL = "/api/surveys";

async function request(path, options) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export const listSurveys = () => request("");

export const createSurvey = (survey) =>
  request("", { method: "POST", body: JSON.stringify(survey) });

export const updateSurvey = (id, survey) =>
  request(`/${id}`, { method: "PUT", body: JSON.stringify(survey) });

export const deleteSurvey = (id) => request(`/${id}`, { method: "DELETE" });
