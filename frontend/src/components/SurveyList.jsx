// Author: Lucas Mohler
// Fetches all submitted surveys and renders them in a table with Edit and
// Delete actions, satisfying the assignment's "view/update/delete a
// specific survey" requirements. Edit reuses SurveyForm pre-filled with
// the selected row's data, with icons matching the rest of the app.
import { useEffect, useState } from "react";

import { deleteSurvey, listSurveys, updateSurvey } from "../api.js";
import { LIKED_MOST_OPTIONS, LIKELIHOOD_OPTIONS, REFERRAL_OPTIONS, labelFor } from "../options.js";
import SurveyForm from "./SurveyForm.jsx";

export default function SurveyList() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSurvey, setEditingSurvey] = useState(null);

  async function refresh() {
    setLoading(true);
    try {
      setSurveys(await listSurveys());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleUpdate(data) {
    await updateSurvey(editingSurvey.id, data);
    setEditingSurvey(null);
    await refresh();
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this survey response? This cannot be undone.")) return;
    await deleteSurvey(id);
    await refresh();
  }

  if (editingSurvey) {
    return (
      <div>
        <h2>
          <i className="fa-solid fa-pen icon-gap" aria-hidden="true"></i>
          Edit Survey #{editingSurvey.id}
        </h2>
        <SurveyForm
          initialValue={editingSurvey}
          submitLabel="Save Changes"
          submitIcon="fa-floppy-disk"
          onSubmit={handleUpdate}
          onCancel={() => setEditingSurvey(null)}
        />
      </div>
    );
  }

  if (loading) return <p className="muted">Loading surveys...</p>;
  if (error) return <p className="error-box">Failed to load surveys: {error}</p>;
  if (surveys.length === 0) return <p className="muted">No surveys have been submitted yet.</p>;

  return (
    <div className="card">
      <table className="survey-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>City, State</th>
            <th>Email</th>
            <th>Survey Date</th>
            <th>Liked Most</th>
            <th>Heard Via</th>
            <th>Likelihood</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {surveys.map((s) => (
            <tr key={s.id}>
              <td>
                {s.first_name} {s.last_name}
              </td>
              <td>
                {s.city}, {s.state}
              </td>
              <td>{s.email}</td>
              <td>{s.survey_date}</td>
              <td>
                {s.liked_most.map((v) => labelFor(LIKED_MOST_OPTIONS, v)).join(", ")}
              </td>
              <td>{labelFor(REFERRAL_OPTIONS, s.referral_source)}</td>
              <td>{labelFor(LIKELIHOOD_OPTIONS, s.recommend_likelihood)}</td>
              <td className="actions">
                <button className="btn btn-secondary" onClick={() => setEditingSurvey(s)}>
                  <i className="fa-solid fa-pen icon-gap" aria-hidden="true"></i>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(s.id)}>
                  <i className="fa-solid fa-trash icon-gap" aria-hidden="true"></i>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
