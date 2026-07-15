import React, { useMemo, useState, useEffect } from "react";
import { supabase } from "./supabase";
import { questions } from "./question";

export default function Dashboard({ setView }) {
  const [surveys, setSurveys] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [answers, setAnswers] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    today: 0,
    month: 0,
  });

  async function logout() {
    await supabase.auth.signOut();

    setView("survey");
  }

  useEffect(() => {
    loadSurveys();
  }, []);

  async function loadSurveys() {
    const { data, error } = await supabase
      .from("surveys")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setSurveys(data);

    const today = new Date().toISOString().slice(0, 10);

    const month = today.slice(0, 7);

    const average =
      data.reduce((sum, survey) => sum + Number(survey.average_score || 0), 0) /
      (data.length || 1);

    setStats({
      total: data.length,
      average: average.toFixed(1),
      today: data.filter((s) => s.survey_date === today).length,
      month: data.filter((s) => s.survey_date.startsWith(month)).length,
    });
  }

  async function viewSurvey(survey) {
    setSelectedSurvey(survey);

    const { data, error } = await supabase
      .from("survey_answers")
      .select("*")
      .eq("survey_id", survey.id)
      .order("question_number");

    if (error) {
      console.error(error);
      return;
    }

    setAnswers(data);
  }

  return (
    <div style={{ padding: 40 }}>
      <button className="login-floating-button" onClick={logout}>
        Logout
      </button>
      <h1>Bono Steel Dashboard</h1>

      <button className="secondary-button" onClick={() => setView("survey")}>
        Back to Survey
      </button>

      <hr />

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Total Surveys</h3>
          <span>{stats.total}</span>
        </div>

        <div className="dashboard-card">
          <h3>Average Rating</h3>
          <span>{stats.average} ★</span>
        </div>

        <div className="dashboard-card">
          <h3>Today's Responses</h3>
          <span>{stats.today}</span>
        </div>

        <div className="dashboard-card">
          <h3>This Month</h3>
          <span>{stats.month}</span>
        </div>
      </div>

      <input
        className="dashboard-search"
        placeholder="Search company..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table style={{ width: "100%", marginTop: 20 }}>
        <thead>
          <tr>
            <th align="left">Company</th>
            <th align="left">Customer</th>
            <th align="left">Average</th>
            <th align="left">Date</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {surveys
            .filter((survey) =>
              survey.company.toLowerCase().includes(search.toLowerCase()),
            )
            .map((survey) => (
              <tr key={survey.id}>
                <td>{survey.company}</td>
                <td>{survey.name}</td>
                <td>{survey.average_score}</td>
                <td>{survey.survey_date}</td>
                <td>
                  <button
                    className="primary-button"
                    onClick={() => viewSurvey(survey)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
      {selectedSurvey && (
        <div className="login-overlay">
          <div
            className="login-modal"
            style={{ width: "900px", maxHeight: "80vh", overflowY: "auto" }}
          >
            <h2>{selectedSurvey.company}</h2>

            <p>
              <strong>Customer:</strong> {selectedSurvey.name}
            </p>

            <p>
              <strong>Date:</strong> {selectedSurvey.survey_date}
            </p>

            <hr />

            {answers.map((answer) => (
              <div
                key={answer.id}
                style={{
                  marginBottom: 25,
                  paddingBottom: 20,
                  borderBottom: "1px solid #eee",
                }}
              >
                <h3>{questions[answer.question_number - 1]}</h3>

                <p>Rating: {answer.rating}</p>

                {answer.comment && (
                  <p>
                    <strong>Comment:</strong> {answer.comment}
                  </p>
                )}
              </div>
            ))}

            <button
              className="secondary-button"
              onClick={() => {
                setSelectedSurvey(null);
                setAnswers([]);
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
