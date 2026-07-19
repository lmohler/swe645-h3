// Author: Lucas Mohler
// Top-level component: tab switcher between submitting a new survey and
// viewing/editing/deleting existing ones. A successful submission opens a
// results modal recapping the saved survey, matching the HW2 static form's
// confirmation flow.
import { useState } from "react";

import { createSurvey } from "./api.js";
import SurveyForm from "./components/SurveyForm.jsx";
import SurveyList from "./components/SurveyList.jsx";
import SurveyResultsModal from "./components/SurveyResultsModal.jsx";

export default function App() {
  const [tab, setTab] = useState("new");
  const [submitted, setSubmitted] = useState(null);

  async function handleCreate(survey) {
    const created = await createSurvey(survey);
    setSubmitted(created);
  }

  return (
    <div className="app">
      <header className="app-header">
        <i className="fa-solid fa-clipboard-list icon-gap" aria-hidden="true"></i>
        <span>Student Survey</span>
      </header>

      <nav className="tabs">
        <button className={tab === "new" ? "active" : ""} onClick={() => setTab("new")}>
          New Survey
        </button>
        <button className={tab === "view" ? "active" : ""} onClick={() => setTab("view")}>
          View Surveys
        </button>
      </nav>

      <main>
        {tab === "new" ? (
          <SurveyForm submitLabel="Submit" onSubmit={handleCreate} />
        ) : (
          <SurveyList />
        )}
      </main>

      {submitted && (
        <SurveyResultsModal
          survey={submitted}
          onClose={() => setSubmitted(null)}
          onViewSurveys={() => setTab("view")}
        />
      )}
    </div>
  );
}
