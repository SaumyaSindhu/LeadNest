import { useCallback, useEffect, useState } from "react";
import api from "./api";
import "./App.css";

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M13 5.5V2.8l-2 2A5 5 0 1 0 13 9" />
    </svg>
  );
}

export default function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("leadnest_token") || "",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [statsResponse, leadsResponse] = await Promise.all([
        api.get("/leads/stats"),
        api.get("/leads?limit=20"),
      ]);

      setStats(statsResponse.data.stats);
      setLeads(leadsResponse.data.leads);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dashboard");

      if (err.response?.status === 401) {
        localStorage.removeItem("leadnest_token");
        setToken("");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) return undefined;

    const timer = setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => clearTimeout(timer);
  }, [token, loadDashboard]);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const newToken = response.data.token;
      localStorage.setItem("leadnest_token", newToken);
      setToken(newToken);
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("leadnest_token");
    setToken("");
    setStats(null);
    setLeads([]);
    setError("");
  }

  if (!token) {
    return (
      <main className="login-page">
        <div className="login-shell">
          <div className="login-intro">
            <div className="brand">
              <BrandMark />
              <span>LeadNest</span>
            </div>
            <div className="intro-copy">
              <p className="eyebrow">Lead capture, simplified</p>
              <h1>Turn every conversation into an opportunity.</h1>
              <p className="intro-description">
                A focused workspace for keeping your leads organized and your
                follow-up moving.
              </p>
            </div>
            <p className="login-footnote">Simple tools. Better follow-up.</p>
          </div>
          <form className="panel login-form" onSubmit={handleLogin}>
            <div className="form-heading">
              <p className="eyebrow">Welcome back</p>
              <h2>Sign in to LeadNest</h2>
              <p>Access your lead-capture dashboard.</p>
            </div>

            <div className="field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button className="primary-button" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <ArrowIcon />}
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <span>LeadNest</span>
        </div>
        <div className="topbar-actions">
          <span className="status"><span />Workspace active</span>
          <button className="secondary" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      {error && <p className="error">{error}</p>}

      {loading && !stats ? (
        <section className="loading-state panel">
          <span className="spinner" />
          <p>Loading your dashboard...</p>
        </section>
      ) : (
        <>
          <section className="page-heading">
            <div>
              <p className="eyebrow">Overview</p>
              <h1>Good to see you.</h1>
              <p>Here&apos;s what&apos;s happening with your lead capture.</p>
            </div>
            <span className="date-label">{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
          </section>

          <section className="stats-grid">
            <article className="panel stat-card">
              <div className="stat-label"><span className="stat-icon">↗</span> Total submissions</div>
              <h2>{stats?.totalSubmissions ?? 0}</h2>
              <p className="stat-caption">All-time captured leads</p>
            </article>

            <article className="panel stat-card">
              <div className="stat-label"><span className="stat-icon purple">◈</span> Active widgets</div>
              <h2>{stats?.widgetsWithSubmissions ?? 0}</h2>
              <p className="stat-caption">Widgets bringing in leads</p>
            </article>
          </section>

          <section className="panel leads-panel">
            <div className="section-heading">
              <div>
                <h2>Recent leads</h2>
                <p>The latest submissions from your widgets.</p>
              </div>
              <button
                className="secondary"
                onClick={loadDashboard}
                disabled={loading}
              >
                <RefreshIcon /> Refresh
              </button>
            </div>

            {leads.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✦</span>
                <h3>No leads yet</h3>
                <p>Submit your embedded form to see new leads here.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Lead details</th>
                      <th>Widget</th>
                      <th>Country</th>
                      <th>Captured</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead._id}>
                        <td>
                          {Object.entries(lead.data || {}).map(
                            ([key, value]) => (
                              <div className="lead-detail" key={key}>
                                <strong>{key}</strong><span>{String(value)}</span>
                              </div>
                            ),
                          )}
                        </td>
                        <td><code>{lead.widgetId}</code></td>
                        <td><span className="country-pill">{lead.country || "Unknown"}</span></td>
                        <td className="date-cell">{new Date(lead.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel widget-panel">
            <div className="section-heading">
              <div>
                <h2>Submissions by widget</h2>
                <p>See which widgets are doing the work.</p>
              </div>
            </div>
            {stats?.submissionsByWidget?.length ? (
              <ul className="widget-list">
                {stats.submissionsByWidget.map((item) => (
                  <li key={item.widgetId}>
                    <span className="widget-name"><span className="widget-dot" />{item.title}</span>
                    <span className="widget-count">{item.count} <small>submissions</small></span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state compact">
                <p>No widget submissions yet.</p>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
