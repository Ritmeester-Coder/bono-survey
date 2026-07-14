import React, { useMemo, useState } from "react";
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

const questions = [
  "Responsiveness to Calls, E-mails, Quotes",
  "Product Knowledge",
  "Professionalism",
  "Accuracy when orders are processed",
  "Ability at problem solving",
  "Delivery time",
  "Material availability",
  "Receiving of the correct documentation",
  "Quality of the product supplied to you",
  "Drivers Behaviour",
];

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
  const progress = Math.round((Math.min(step, totalSteps - 1) / (totalSteps - 1)) * 100);
  const currentQuestion = step > 0 && step <= questions.length ? answers[step - 1] : null;
  const averageScore = useMemo(() => {
    const rated = answers.filter((answer) => answer.rating);
    if (!rated.length) return null;
    const sum = rated.reduce((total, answer) => total + Number(answer.rating), 0);
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
      ratingScale: "1 = Excellent, 2 = Good, 3 = Satisfactory, 4 = Poor, 5 = Very Poor",
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

  return (
    <main className="survey-shell">
      <section className="survey-panel" aria-label="Bono Steel customer satisfaction survey">
        <header className="brand-header">
          <div>
            <p className="eyebrow">Bono Steel</p>
            <h1>Customer Satisfaction Survey</h1>
          </div>
          <div className="score-chip" aria-label={`${answeredCount} of ${questions.length} questions answered`}>
            <ClipboardCheck size={18} />
            <span>{answeredCount}/{questions.length}</span>
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
                      A few quick details help the Bono Steel team follow up with the right context.
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
                <div className="question-counter">Question {step} of {questions.length}</div>
                <h2>{currentQuestion.question}</h2>
                <div className="rating-grid" role="radiogroup" aria-label={currentQuestion.question}>
                  {ratings.map((rating) => (
                    <button
                      className={`rating-button ${rating.tone} ${
                        currentQuestion.rating === rating.value ? "selected" : ""
                      }`}
                      type="button"
                      key={rating.value}
                      role="radio"
                      aria-checked={currentQuestion.rating === rating.value}
                      onClick={() => updateAnswer(step - 1, { rating: rating.value })}
                    >
                      <span className="rating-number">{rating.value}</span>
                      <span className="rating-label">{rating.label}</span>
                      {rating.value <= 2 && <Star className="rating-icon" size={16} />}
                    </button>
                  ))}
                </div>
                <label className="comment-field">
                  <span>Comments or suggestions</span>
                  <textarea
                    value={currentQuestion.comment}
                    onChange={(event) => updateAnswer(step - 1, { comment: event.target.value })}
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
                    <p>Thank you for your time. We appreciate the feedback and hope you have a wonderful day.</p>
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
                    <strong>{answeredCount}/{questions.length}</strong>
                  </div>
                </div>

                <div className="answer-list">
                  {answers.map((answer) => {
                    const rating = ratings.find((item) => item.value === answer.rating);
                    return (
                      <article key={answer.question} className="answer-row">
                        <div>
                          <h3>{answer.question}</h3>
                          {answer.comment && <p>{answer.comment}</p>}
                        </div>
                        <span className={`answer-rating ${rating?.tone || ""}`}>
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
                  onClick={() => setStep((current) => Math.min(totalSteps - 1, current + 1))}
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
                  onClick={() => setSubmitted(true)}
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
              Thank you for helping Bono Steel keep customer care above expectations.
            </p>
            <div className="submitted-actions">
              <button className="primary-button" type="button" onClick={downloadResponse}>
                <Download size={18} />
                <span>Download Response</span>
              </button>
              <a
                className="secondary-button link-button"
                href={`mailto:?subject=Bono Steel Customer Survey - ${encodeURIComponent(details.company)}&body=${encodeURIComponent(
                  JSON.stringify(payload, null, 2),
                )}`}
              >
                <Mail size={18} />
                <span>Email Response</span>
              </a>
              <button className="ghost-button" type="button" onClick={resetSurvey}>
                <RotateCcw size={18} />
                <span>New Survey</span>
              </button>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
