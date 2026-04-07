"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── SUPABASE CONFIG ──────────────────────────────────────────
const SUPABASE_URL = "https://bzwdddypgdgaypfvkmgu.supabase.co";
const SUPABASE_KEY = "sb_publishable_BVSA-0OzYg1xhDD3mrUrDQ_EBPCBuUI";

async function sbInsert(data) {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(data),
    });
    return r.ok;
  } catch (e) {
    console.warn("Supabase insert error", e);
    return false;
  }
}

async function sbGetStats(questionId) {
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/responses?question_id=eq.${questionId}&select=sentiment`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    const counts = { positive: 0, negative: 0, neutral: 0 };
    rows.forEach((row) => {
      if (counts[row.sentiment] !== undefined) counts[row.sentiment]++;
    });
    return counts;
  } catch (e) {
    console.warn("Supabase fetch error", e);
    return null;
  }
}

// ── DEVICE ID UTILITIES ──────────────────────────────────────
const STORAGE_KEYS = {
  DEVICE_ID: "weboreel_device_id",
  VISIT_COUNT: "weboreel_visit_count",
  ANSWERED_QUESTIONS: "weboreel_answered_questions",
  LAST_VISIT: "weboreel_last_visit",
  FIRST_VISIT: "weboreel_first_visit",
};

function generateDeviceId() {
  // Crypto-grade UUID v4
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateDeviceId() {
  if (typeof window === "undefined") return null;
  let deviceId = localStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
    localStorage.setItem(STORAGE_KEYS.FIRST_VISIT, new Date().toISOString());
  }
  return deviceId;
}

function getVisitCount() {
  if (typeof window === "undefined") return 1;
  const count = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || "0", 10);
  return count;
}

function incrementVisitCount() {
  if (typeof window === "undefined") return 1;
  const count = getVisitCount() + 1;
  localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, String(count));
  localStorage.setItem(STORAGE_KEYS.LAST_VISIT, new Date().toISOString());
  return count;
}

function getAnsweredQuestions() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANSWERED_QUESTIONS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markQuestionAnswered(questionId) {
  if (typeof window === "undefined") return;
  const answered = getAnsweredQuestions();
  answered.add(questionId);
  localStorage.setItem(STORAGE_KEYS.ANSWERED_QUESTIONS, JSON.stringify([...answered]));
}

/** Pick a smart starting index: prioritize unanswered questions */
function pickStartingIndex(answeredSet) {
  const unanswered = questions.map((q, i) => ({ q, i })).filter(({ q }) => !answeredSet.has(q.id));
  if (unanswered.length > 0) {
    // Random unanswered question
    return unanswered[Math.floor(Math.random() * unanswered.length)].i;
  }
  // All answered — loop back randomly
  return Math.floor(Math.random() * questions.length);
}

// ── QUESTIONS DATA ───────────────────────────────────────────
const questions = [
  { id: "q1", category: "CRICKET", headline: "Virat Kohli scores a golden duck in a crucial match", question: "HAS VIRAT KOHLI BETRAYED THE NATION BY GETTING OUT FOR A DUCK?!" },
  { id: "q2", category: "BOLLYWOOD", headline: "New Bollywood film breaks box office records on Day 1", question: "IS THIS THE GREATEST FILM EVER MADE OR THE BIGGEST SCAM IN BOLLYWOOD HISTORY?!" },
  { id: "q3", category: "FOOD", headline: "Delhi street food vendors refuse to add less chilli", question: "HAS THE GOVERNMENT FAILED TO PROTECT SENSITIVE STOMACHS ACROSS THIS NATION?!" },
  { id: "q4", category: "CRICKET", headline: "India wins the T20 series against Australia 3-2", question: "IS THIS THE GREATEST COMEBACK IN THE HISTORY OF INDIAN CRICKET OR NOT?!" },
  { id: "q5", category: "DAILY LIFE", headline: "Monday declared most dreaded day of the week by survey", question: "IS MONDAY THE SINGLE BIGGEST ENEMY OF THE INDIAN MIDDLE CLASS?!" },
  { id: "q6", category: "FOOD", headline: "Maggi noodles releases a new spicy variant", question: "IS MAGGI TRULY BACK OR IS THIS THE GREATEST DECEPTION OF OUR TIMES?!" },
  { id: "q7", category: "TECH", headline: "Instagram rolls out yet another new update nobody asked for", question: "HAS INSTAGRAM DESTROYED THE ATTENTION SPAN OF AN ENTIRE GENERATION?!" },
  { id: "q8", category: "DAILY LIFE", headline: "Work from home declared the new normal for IT sector", question: "IS WORKING FROM HOME A FUNDAMENTAL RIGHT OR A PRIVILEGE — THE NATION WANTS TO KNOW?!" },
  { id: "q9", category: "CRICKET", headline: "Rohit Sharma to lead India in upcoming World Cup", question: "CAN ROHIT SHARMA BRING HOME THE WORLD CUP TROPHY OR HAS HE BEEN GIVEN AN IMPOSSIBLE TASK?!" },
  { id: "q10", category: "FOOD", headline: "Biryani declared the most ordered food on Swiggy for 5th year running", question: "SHOULD BIRYANI BE DECLARED THE NATIONAL DISH OF INDIA — YES OR NO?!" },
  { id: "q11", category: "BOLLYWOOD", headline: "A-list actor spotted without bodyguards at local market", question: "HAS BOLLYWOOD FINALLY RECONNECTED WITH THE COMMON MAN OR IS THIS JUST A PR STUNT?!" },
  { id: "q12", category: "TECH", headline: "New iPhone launched at price of ₹1,20,000", question: "IS APPLE LOOTING THE INDIAN MIDDLE CLASS AND GETTING AWAY WITH IT?!" },
  { id: "q13", category: "DAILY LIFE", headline: "Mumbai rains cause city-wide traffic jam for 6 hours", question: "HAS MUMBAI'S MONSOON ONCE AGAIN HUMILIATED THE BMC AND THE ENTIRE SYSTEM?!" },
  { id: "q14", category: "CRICKET", headline: "IPL auction breaks all records with ₹200 crore bid", question: "IS THIS THE BIGGEST WASTE OF MONEY IN THE HISTORY OF SPORTS OR JUSTIFIED INVESTMENT?!" },
  { id: "q15", category: "FOOD", headline: "Chai price rises to ₹30 at roadside stalls", question: "SHOULD CHAI BE FREE FOR EVERY CITIZEN — THE NATION DEMANDS AN ANSWER?!" },
  { id: "q16", category: "BOLLYWOOD", headline: "Nepotism debate reignited after star kid bags lead role", question: "HAS NEPOTISM DESTROYED BOLLYWOOD FROM WITHIN — WILL ANYONE ANSWER?!" },
  { id: "q17", category: "TECH", headline: "WhatsApp down for 30 minutes triggers national panic", question: "HAS INDIA BECOME SO DEPENDENT ON FOREIGN APPS THAT 30 MINUTES OF DOWNTIME BREAKS THE NATION?!" },
  { id: "q18", category: "DAILY LIFE", headline: "Auto drivers refuse to go by meter in Bengaluru", question: "IS THE AUTO DRIVER MAFIA THE BIGGEST UNSOLVED CRISIS IN URBAN INDIA?!" },
  { id: "q19", category: "CRICKET", headline: "MS Dhoni announces return to domestic cricket", question: "IS DHONI'S COMEBACK THE GREATEST MOMENT IN CRICKET OR SHOULD HE STAY RETIRED?!" },
  { id: "q20", category: "FOOD", headline: "Paneer price hits ₹500 per kg in metro cities", question: "HAS INFLATION MADE PANEER A LUXURY ITEM ONLY THE RICH CAN AFFORD?!" },
  { id: "q21", category: "TECH", headline: "AI threatens to replace software engineers", question: "IS AI THE BIGGEST THREAT TO INDIA'S IT ECONOMY OR THE NATION'S GREATEST OPPORTUNITY?!" },
  { id: "q22", category: "BOLLYWOOD", headline: "OTT platform releases controversial web series", question: "HAS OTT CULTURE FINALLY CROSSED THE LINE OR IS CENSORSHIP THE REAL ENEMY OF ART?!" },
  { id: "q23", category: "DAILY LIFE", headline: "Delhi air quality index hits 'hazardous' level again", question: "HAS THE GOVERNMENT FAILED DELHIITES YEAR AFTER YEAR WITH ZERO ACTION?!" },
  { id: "q24", category: "CRICKET", headline: "Indian women's cricket team wins Asia Cup", question: "ARE WE DOING ENOUGH TO CELEBRATE WOMEN'S CRICKET — THE NATION WANTS TO KNOW?!" },
  { id: "q25", category: "FOOD", headline: "South Indian restaurant opens in Srinagar", question: "IS IDLI-SAMBAR FINALLY CONQUERING EVERY CORNER OF THIS GREAT NATION?!" },
];

// ── SENTIMENT CLASSIFIER ─────────────────────────────────────
const posWords = ["love", "great", "amazing", "yes", "agree", "good", "awesome", "excellent", "brilliant", "happy", "support", "perfect", "nice", "best", "wonderful", "fantastic", "absolutely", "totally", "definitely"];
const negWords = ["hate", "bad", "never", "disagree", "no", "terrible", "awful", "worst", "horrible", "disgusting", "pathetic", "useless", "disappointed", "wrong", "stupid", "ridiculous", "waste"];

function classifySentiment(text) {
  const lower = text.toLowerCase();
  let pos = 0, neg = 0;
  posWords.forEach((w) => { if (lower.includes(w)) pos++; });
  negWords.forEach((w) => { if (lower.includes(w)) neg++; });
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "neutral";
}

// ── ARNAB REACTIONS ──────────────────────────────────────────
const reactions = {
  positive: [
    '"THE NATION HAS SPOKEN! And the nation AGREES! This is the kind of clarity this great republic deserves!"',
    '"FINALLY! Someone who understands what India truly needs! The nation salutes you!"',
    '"You see?! THIS is what the people think! And nobody can deny it!"',
  ],
  negative: [
    '"The nation is OUTRAGED! And rightly so! Will ANYONE take responsibility?!"',
    '"This is exactly what I have been saying for YEARS! The people are FED UP!"',
    '"The opposition CANNOT answer this! The silence is DEAFENING!"',
  ],
  neutral: [
    '"The nation is watching... and waiting... for a CLEAR answer! Is that too much to ask?!"',
    '"Neither here nor there! But India DEMANDS a definitive verdict tonight!"',
    '"This is the kind of fence-sitting that has brought this country to its KNEES!"',
  ],
};

// ── RETURNING VISITOR REACTIONS ──────────────────────────────
const returningReactions = [
  "AH HA! You're BACK! The nation REMEMBERS you! And this time, I need an even STRONGER verdict!",
  "WELCOME BACK! I knew you couldn't stay away! India's debates are IRRESISTIBLE!",
  "The returning panelist is HERE! The nation has been WAITING for your voice again!",
  "YOU AGAIN! Excellent! A true patriot who REFUSES to stay silent! The nation SALUTES you!",
  "BACK for more?! THIS is the dedication India needs! Now give me your VERDICT!",
];

// ── MAIN COMPONENT ───────────────────────────────────────────
export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userText, setUserText] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [reaction, setReaction] = useState("");
  const [stats, setStats] = useState({ positive: 0, negative: 0, neutral: 0 });
  const [barWidths, setBarWidths] = useState({ pos: 0, neg: 0, neu: 0 });
  const [arnabState, setArnabState] = useState("hidden"); // hidden | visible | exit
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // ── DEVICE ID STATE ──────────────────────────────────────────
  const [deviceId, setDeviceId] = useState(null);
  const [visitCount, setVisitCount] = useState(1);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [isReturning, setIsReturning] = useState(false);
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");

  const musicStartedRef = useRef(false);
  const bgMusicRef = useRef(null);
  const textareaRef = useRef(null);
  const answeredSetRef = useRef(new Set());

  const q = questions[currentIndex];

  // ── DEVICE ID INITIALIZATION ─────────────────────────────────
  useEffect(() => {
    const id = getOrCreateDeviceId();
    setDeviceId(id);

    const count = incrementVisitCount();
    setVisitCount(count);

    const answered = getAnsweredQuestions();
    answeredSetRef.current = answered;
    setAnsweredCount(answered.size);

    const returning = count > 1;
    setIsReturning(returning);

    // Pick a smart starting question (prioritize unanswered)
    const startIdx = pickStartingIndex(answered);
    setCurrentIndex(startIdx);

    // Show welcome banner for returning visitors
    if (returning) {
      const msg = returningReactions[Math.floor(Math.random() * returningReactions.length)];
      setWelcomeMessage(msg);
      setShowWelcomeBanner(true);

      // Auto-dismiss after 5 seconds
      const dismissTimer = setTimeout(() => {
        setShowWelcomeBanner(false);
      }, 5000);

      return () => clearTimeout(dismissTimer);
    }
  }, []);

  // Set current time on question change
  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
  }, [currentIndex]);

  // Arnab entrance
  useEffect(() => {
    const timer = setTimeout(() => setArnabState("visible"), 600);
    return () => clearTimeout(timer);
  }, []);

  // Start music on first click
  const startMusic = useCallback(() => {
    if (musicStartedRef.current || !bgMusicRef.current) return;
    musicStartedRef.current = true;
    bgMusicRef.current.volume = 0.25;
    bgMusicRef.current.play().catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => startMusic();
    document.body.addEventListener("click", handler, { once: true });
    return () => document.body.removeEventListener("click", handler);
  }, [startMusic]);

  // Toggle mute
  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      if (bgMusicRef.current) bgMusicRef.current.muted = next;
      return next;
    });
  };

  // Submit response
  const handleSubmit = async () => {
    const text = userText.trim();
    if (!text) {
      textareaRef.current?.focus();
      return;
    }
    if (submitted || submitting) return;
    setSubmitting(true);
    startMusic();

    const s = classifySentiment(text);

    // Include deviceId in Supabase submission
    await sbInsert({
      question_id: q.id,
      answer: text,
      sentiment: s,
      device_id: deviceId,
      created_at: new Date().toISOString(),
    });

    // Mark this question as answered in localStorage
    markQuestionAnswered(q.id);
    answeredSetRef.current.add(q.id);
    setAnsweredCount(answeredSetRef.current.size);

    let fetchedStats = await sbGetStats(q.id);
    if (!fetchedStats) {
      fetchedStats = { positive: 1, negative: 0, neutral: 0 };
      if (s === "negative") { fetchedStats.negative = 1; fetchedStats.positive = 0; }
      if (s === "neutral") { fetchedStats.neutral = 1; fetchedStats.positive = 0; }
    }

    setSentiment(s);
    const reactionArr = reactions[s];
    setReaction(reactionArr[Math.floor(Math.random() * reactionArr.length)]);
    setStats(fetchedStats);
    setSubmitted(true);
    setSubmitting(false);
    setShowResults(true);

    const total = fetchedStats.positive + fetchedStats.negative + fetchedStats.neutral || 1;
    const pPos = Math.round((fetchedStats.positive / total) * 100);
    const pNeg = Math.round((fetchedStats.negative / total) * 100);
    const pNeu = 100 - pPos - pNeg;

    setTimeout(() => {
      setBarWidths({ pos: pPos, neg: pNeg, neu: pNeu });
    }, 200);
  };

  // Next question — prioritize unanswered
  const handleNext = () => {
    setArnabState("exit");
    setTimeout(() => {
      // Smart next: try to find an unanswered question
      const answered = answeredSetRef.current;
      let nextIdx;

      // Look for the next unanswered question after current
      const candidates = [];
      for (let i = 1; i < questions.length; i++) {
        const idx = (currentIndex + i) % questions.length;
        if (!answered.has(questions[idx].id)) {
          candidates.push(idx);
        }
      }

      if (candidates.length > 0) {
        nextIdx = candidates[0]; // Next unanswered in sequence
      } else {
        // All answered — just go to next in order
        nextIdx = (currentIndex + 1) % questions.length;
      }

      setCurrentIndex(nextIdx);
      setUserText("");
      setSubmitted(false);
      setSubmitting(false);
      setShowResults(false);
      setSentiment(null);
      setReaction("");
      setStats({ positive: 0, negative: 0, neutral: 0 });
      setBarWidths({ pos: 0, neg: 0, neu: 0 });
      setArnabState("hidden");
      setTimeout(() => setArnabState("visible"), 100);
    }, 500);
  };

  const sentimentIcons = { positive: "✅ POSITIVE", negative: "❌ NEGATIVE", neutral: "⚖️ NEUTRAL" };
  const total = stats.positive + stats.negative + stats.neutral || 1;
  const pPos = Math.round((stats.positive / total) * 100);
  const pNeg = Math.round((stats.negative / total) * 100);
  const pNeu = 100 - pPos - pNeg;

  const arnabClass = `arnab-wrap${arnabState === "visible" ? " visible" : ""}${arnabState === "exit" ? " exit" : ""}`;

  const isCurrentAnswered = answeredSetRef.current.has(q?.id);
  const remainingQuestions = questions.length - answeredCount;

  return (
    <>
      {/* WELCOME BACK BANNER — only for returning visitors */}
      {showWelcomeBanner && (
        <div className="welcome-banner" onClick={() => setShowWelcomeBanner(false)}>
          <div className="welcome-banner-inner">
            <div className="welcome-badge">
              <span className="welcome-icon">🔥</span>
              VISIT #{visitCount}
            </div>
            <div className="welcome-message">&ldquo;{welcomeMessage}&rdquo;</div>
            <div className="welcome-stats">
              {answeredCount > 0 && (
                <span>🗳️ {answeredCount} verdict{answeredCount !== 1 ? "s" : ""} given</span>
              )}
              {remainingQuestions > 0 && (
                <span>📢 {remainingQuestions} question{remainingQuestions !== 1 ? "s" : ""} remaining</span>
              )}
            </div>
            <div className="welcome-dismiss">TAP TO DISMISS</div>
          </div>
        </div>
      )}

      {/* TICKER */}
      <div className="ticker-wrap">
        <span className="ticker-content">
          🔴 BREAKING: INDIA WANTS TO KNOW &nbsp;●&nbsp; THE NATION IS WATCHING &nbsp;●&nbsp; WHO WILL ANSWER? &nbsp;●&nbsp; THE DEBATE RAGES ON &nbsp;●&nbsp; RAJAT GOSWAMI DEMANDS ANSWERS &nbsp;●&nbsp; WEBOREEL TV EXCLUSIVE &nbsp;●&nbsp; INDIA WANTS TO KNOW &nbsp;●&nbsp; THE NATION IS WATCHING &nbsp;●&nbsp;
        </span>
      </div>

      {/* HEADER */}
      <div className="header">
        <div className="header-logo">
          INDIA <span>WANTS</span> TO KNOW
        </div>
        <div className="header-sub">Weboreel TV · Nation First · Truth Loud</div>
        <div>
          <div className="live-badge">
            <span className="live-dot"></span> LIVE DEBATE
          </div>
        </div>
        {/* Returning visitor indicator */}
        {isReturning && (
          <div className="visitor-badge" title={`Device: ${deviceId?.slice(0, 8)}…`}>
            🔁 Visit #{visitCount}
            {answeredCount > 0 && <span className="visitor-answered"> · {answeredCount} answered</span>}
          </div>
        )}
      </div>

      {/* ARNAB */}
      <div className={arnabClass}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="arnab-img"
          src="/arnab.png"
          alt="Rajat Goswami"
        />
      </div>

      {/* MUTE BUTTON */}
      <button className="mute-btn" onClick={toggleMute} title="Toggle music">
        {muted ? "🔇" : "🔊"}
      </button>

      {/* AUDIO */}
      <audio ref={bgMusicRef} loop />

      {/* MAIN */}
      <div className="main-content">
        <div className="card">
          <span className="question-counter">
            {currentIndex + 1} / {questions.length}
            {isCurrentAnswered && <span className="answered-tag"> ✓</span>}
          </span>

          {/* NEWS */}
          <div className="news-section">
            <div className="category-badge">{q.category}</div>
            {isCurrentAnswered && (
              <div className="previously-answered-badge">YOU&apos;VE ANSWERED THIS BEFORE</div>
            )}
            <div className="news-headline">{q.headline}</div>
            <div className="news-source">Weboreel TV · Breaking · {currentTime}</div>
          </div>

          {/* QUESTION */}
          <div className="question-wrap">
            <div className="question-label">🎙️ Rajat Goswami Demands:</div>
            <div className="question-text" key={currentIndex}>
              {q.question}
            </div>
          </div>

          <div className="divider"></div>

          {/* INPUT */}
          {!showResults && (
            <div className="input-section">
              <label className="input-label" htmlFor="userResponse">
                {isCurrentAnswered ? "Change your mind? Submit again!" : "What do you think?"}
              </label>
              <textarea
                ref={textareaRef}
                className="response-input"
                id="userResponse"
                placeholder={isCurrentAnswered ? "You've spoken before... changed your mind?" : "Speak up! The nation is listening..."}
                rows="3"
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
              />
              <br />
              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={submitted || submitting}
              >
                {submitting ? "SUBMITTING..." : submitted ? "SUBMITTED!" : isCurrentAnswered ? "UPDATE YOUR VERDICT" : "SUBMIT YOUR VERDICT"}
              </button>
            </div>
          )}

          {/* RESULTS */}
          {showResults && (
            <div className="results-section visible">
              <div className={`sentiment-badge ${sentiment}`}>
                {sentimentIcons[sentiment]}
              </div>
              <div className="arnab-reaction">{reaction}</div>

              <div className="stats-title">🗳️ What India thinks — live from the nation</div>
              <div className="stat-row">
                <span className="stat-label">Positive</span>
                <div className="stat-bar-wrap">
                  <div className="stat-bar positive" style={{ width: `${barWidths.pos}%` }} />
                </div>
                <span className="stat-pct">{pPos}%</span>
                <span className="stat-count">({stats.positive})</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Negative</span>
                <div className="stat-bar-wrap">
                  <div className="stat-bar negative" style={{ width: `${barWidths.neg}%` }} />
                </div>
                <span className="stat-pct">{pNeg}%</span>
                <span className="stat-count">({stats.negative})</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Neutral</span>
                <div className="stat-bar-wrap">
                  <div className="stat-bar neutral" style={{ width: `${barWidths.neu}%` }} />
                </div>
                <span className="stat-pct">{pNeu}%</span>
                <span className="stat-count">({stats.neutral})</span>
              </div>

              {/* Progress indicator for returning users */}
              {answeredCount > 0 && (
                <div className="progress-section">
                  <div className="progress-label">
                    YOUR JOURNEY: {answeredCount}/{questions.length} QUESTIONS ANSWERED
                  </div>
                  <div className="progress-bar-wrap">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.round((answeredCount / questions.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <button className="btn-next" onClick={handleNext}>
                {remainingQuestions > 0
                  ? `NEXT QUESTION → (${remainingQuestions} left)`
                  : "NEXT QUESTION →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
