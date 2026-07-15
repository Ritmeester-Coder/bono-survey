import { supabase } from "./supabase";
import React, { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Mail,
  PartyPopper,
  RotateCcw,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import Dashboard from "./Dashboard";
import { questions } from "./question";
import logo from "./assets/bonosteel-logo-1.png";

const ratings = [
  { value: 1, label: "Excellent", tone: "excellent" },
  { value: 2, label: "Good", tone: "good" },
  { value: 3, label: "Satisfactory", tone: "satisfactory" },
  { value: 4, label: "Poor", tone: "poor" },
  { value: 5, label: "Very Poor", tone: "very-poor" },
];

const initialAnswers = questions.map((question) => ({
  question,
  rating: "",
  comment: "",
}));

function App() {
  const [view, setView] = useState("survey"); // survey | dashboard
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [details, setDetails] = useState({
    company: "",
    name: "",
    bonoContact: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [answers, setAnswers] = useState(initialAnswers);

  const totalSteps = questions.length + 2;
  const answeredCount = answers.filter((answer) => answer.rating).length;
  const progress = Math.round(
    (Math.min(step, totalSteps - 1) / (totalSteps - 1)) * 100,
  );
  const currentQuestion =
    step > 0 && step <= questions.length ? answers[step - 1] : null;
  const averageScore = useMemo(() => {
    const rated = answers.filter((answer) => answer.rating);
    if (!rated.length) return null;
    const sum = rated.reduce(
      (total, answer) => total + Number(answer.rating),
      0,
    );
    return (sum / rated.length).toFixed(1);
  }, [answers]);

  const canContinue =
    step === 0
      ? details.company.trim() && details.name.trim()
      : step <= questions.length
        ? currentQuestion?.rating
        : answeredCount === questions.length;

  const payload = useMemo(
    () => ({
      company: details.company,
      name: details.name,
      bonoContact: details.bonoContact,
      date: details.date,
      submittedAt: submitted ? new Date().toISOString() : null,
      ratingScale:
        "1 = Excellent, 2 = Good, 3 = Satisfactory, 4 = Poor, 5 = Very Poor",
      answers,
    }),
    [answers, details, submitted],
  );

  function updateDetails(event) {
    const { name, value } = event.target;
    setDetails((current) => ({ ...current, [name]: value }));
  }

  function updateAnswer(index, patch) {
    setAnswers((current) =>
      current.map((answer, answerIndex) =>
        answerIndex === index ? { ...answer, ...patch } : answer,
      ),
    );
  }

  function downloadResponse() {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fileCompany = (details.company || "response")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-");
    link.download = `bono-steel-survey-${fileCompany}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function saveSurvey() {
    const rated = answers.filter((a) => a.rating);

    const average =
      rated.reduce((sum, a) => sum + Number(a.rating), 0) / rated.length;

    const result = await supabase.rpc("submit_survey", {
      p_company: details.company,
      p_name: details.name,
      p_bono_contact: details.bonoContact,
      p_survey_date: details.date,
      p_average_score: average,
      p_answers: answers.map((answer, index) => ({
        question_number: index + 1,
        rating: Number(answer.rating),
        comment: answer.comment,
      })),
    });

    const { error } = result;

    if (error) {
      console.error("RPC Error:", error);
      throw error;
    }

    if (error) {
      console.error(error);
      throw error;
    }
  }

  function resetSurvey() {
    setStep(0);
    setSubmitted(false);
    setDetails({
      company: "",
      name: "",
      bonoContact: "",
      date: new Date().toISOString().slice(0, 10),
    });
    setAnswers(initialAnswers);
  }

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      setView("dashboard");
    }
  }

  async function login() {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);

      return;
    }

    setShowLogin(false);
    setView("dashboard"); // <-- THIS is what you want
  }

  if (view === "dashboard") {
    return <Dashboard setView={setView} />;
  }

  return (
    <>
      <button
        className="login-floating-button"
        onClick={() => setShowLogin(true)}
      >
        Login
      </button>
      {showLogin && (
        <div className="login-overlay" onClick={() => setShowLogin(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Administrator Login</h2>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="login-actions">
              <button
                className="secondary-button"
                onClick={() => setShowLogin(false)}
              >
                Cancel
              </button>

              <button className="primary-button" onClick={login}>
                Login
              </button>
            </div>
          </div>
        </div>
      )}
      <main className="survey-shell">
        <section
          className="survey-panel"
          aria-label="Bono Steel customer satisfaction survey"
        >
          <div className="image-container">
            <img
              src={logo}
              alt="Bono Steel Logo"
              height={150}
              className="brand-logo p-20"
            />
          </div>
          <header className="brand-header">
            <div>
              <h1>Customer Satisfaction Survey</h1>
            </div>
            <div
              className="score-chip"
              aria-label={`${answeredCount} of ${questions.length} questions answered`}
            >
              <ClipboardCheck size={18} />
              <span>
                {answeredCount}/{questions.length}
              </span>
            </div>
          </header>

          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>

          {!submitted && (
            <>
              {step === 0 && (
                <section className="step-content details-step">
                  <div className="step-title">
                    <Sparkles size={28} />
                    <div>
                      <h2>Let us know who is sharing feedback</h2>
                      <p>
                        A few quick details help the Bono Steel team follow up
                        with the right context.
                      </p>
                    </div>
                  </div>

                  <div className="field-grid">
                    <label>
                      <span>Company</span>
                      <input
                        name="company"
                        value={details.company}
                        onChange={updateDetails}
                        autoComplete="organization"
                        required
                      />
                    </label>
                    <label>
                      <span>Name</span>
                      <input
                        name="name"
                        value={details.name}
                        onChange={updateDetails}
                        autoComplete="name"
                        required
                      />
                    </label>
                    <label>
                      <span>Bono Contact</span>
                      <input
                        name="bonoContact"
                        value={details.bonoContact}
                        onChange={updateDetails}
                      />
                    </label>
                    <label>
                      <span>Date</span>
                      <input
                        type="date"
                        name="date"
                        value={details.date}
                        onChange={updateDetails}
                      />
                    </label>
                  </div>
                </section>
              )}

              {currentQuestion && (
                <section className="step-content question-step">
                  <div className="question-counter">
                    Question {step} of {questions.length}
                  </div>
                  <h2>{currentQuestion.question}</h2>
                  <div
                    className="rating-grid"
                    role="radiogroup"
                    aria-label={currentQuestion.question}
                  >
                    {ratings.map((rating) => (
                      <button
                        className={`rating-button ${rating.tone} ${
                          currentQuestion.rating === rating.value
                            ? "selected"
                            : ""
                        }`}
                        type="button"
                        key={rating.value}
                        role="radio"
                        aria-checked={currentQuestion.rating === rating.value}
                        onClick={() =>
                          updateAnswer(step - 1, { rating: rating.value })
                        }
                      >
                        <span className="rating-number">{rating.value}</span>
                        <span className="rating-label">{rating.label}</span>
                        {rating.value <= 2 && (
                          <Star className="rating-icon" size={16} />
                        )}
                      </button>
                    ))}
                  </div>
                  <label className="comment-field">
                    <span>Comments or suggestions</span>
                    <textarea
                      value={currentQuestion.comment}
                      onChange={(event) =>
                        updateAnswer(step - 1, {
                          comment: event.target.value,
                        })
                      }
                      rows="4"
                      placeholder="Share anything that would help us improve."
                    />
                  </label>
                </section>
              )}

              {step === questions.length + 1 && (
                <section className="step-content review-step">
                  <div className="step-title">
                    <CheckCircle2 size={28} />
                    <div>
                      <h2>Review your feedback</h2>
                      <p>
                        Thank you for your time. We appreciate the feedback and
                        hope you have a wonderful day.
                      </p>
                    </div>
                  </div>

                  <div className="summary-strip">
                    <div>
                      <span>Company</span>
                      <strong>{details.company}</strong>
                    </div>
                    <div>
                      <span>Average</span>
                      <strong>{averageScore ?? "N/A"}</strong>
                    </div>
                    <div>
                      <span>Completed</span>
                      <strong>
                        {answeredCount}/{questions.length}
                      </strong>
                    </div>
                  </div>

                  <div className="answer-list">
                    {answers.map((answer) => {
                      const rating = ratings.find(
                        (item) => item.value === answer.rating,
                      );
                      return (
                        <article key={answer.question} className="answer-row">
                          <div>
                            <h3>{answer.question}</h3>
                            {answer.comment && <p>{answer.comment}</p>}
                          </div>
                          <span
                            className={`answer-rating ${rating?.tone || ""}`}
                          >
                            {answer.rating}. {rating?.label}
                          </span>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              <footer className="nav-row">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  disabled={step === 0}
                  aria-label="Previous step"
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                {step < questions.length + 1 ? (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() =>
                      setStep((current) =>
                        Math.min(totalSteps - 1, current + 1),
                      )
                    }
                    disabled={!canContinue}
                    aria-label="Next step"
                  >
                    <span>Next</span>
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={async () => {
                      try {
                        await saveSurvey();
                        setSubmitted(true);
                      } catch (err) {
                        console.error(err);
                        alert("Unable to save survey.");
                      }
                    }}
                    disabled={!canContinue}
                  >
                    <Send size={18} />
                    <span>Submit</span>
                  </button>
                )}
              </footer>
            </>
          )}

          {submitted && (
            <section className="step-content submitted-step">
              <PartyPopper size={44} />
              <h2>Feedback received</h2>
              <p>
                Thank you for helping Bono Steel keep customer care above
                expectations.
              </p>
              <div className="submitted-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={resetSurvey}
                >
                  <RotateCcw size={18} />
                  <span>New Survey</span>
                </button>
              </div>
            </section>
          )}
        </section>
      </main>
    </>
  );
}

export default App;
