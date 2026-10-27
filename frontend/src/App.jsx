import { useCallback, useEffect, useState } from "react";
import api from "./api";
import "./App.css";

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
    if (token) loadDashboard();
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
      <main className="page login-page">
        <form className="panel login-form" onSubmit={handleLogin}>
          <h1>LeadNest</h1>
          <p>Sign in to manage your leads.</p>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="error">{error}</p>}

          <button disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>LeadNest</h1>
          <p>Your lead-capture dashboard</p>
        </div>
        <button className="secondary" onClick={handleLogout}>
          Log out
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      {loading && !stats ? (
        <p>Loading dashboard...</p>
      ) : (
        <>
          <section className="stats-grid">
            <article className="panel">
              <p>Total submissions</p>
              <h2>{stats?.totalSubmissions ?? 0}</h2>
            </article>

            <article className="panel">
              <p>Widgets with submissions</p>
              <h2>{stats?.widgetsWithSubmissions ?? 0}</h2>
            </article>
          </section>

          <section className="panel">
            <div className="section-heading">
              <h2>Recent leads</h2>
              <button
                className="secondary"
                onClick={loadDashboard}
                disabled={loading}
              >
                Refresh
              </button>
            </div>

            {leads.length === 0 ? (
              <p>No leads yet. Submit your embedded form to get started.</p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Lead details</th>
                      <th>Widget ID</th>
                      <th>Country</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead._id}>
                        <td>
                          {Object.entries(lead.data || {}).map(
                            ([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {String(value)}
                              </div>
                            ),
                          )}
                        </td>
                        <td>{lead.widgetId}</td>
                        <td>{lead.country || "Unknown"}</td>
                        <td>{new Date(lead.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel">
            <h2>Submissions by widget</h2>
            {stats?.submissionsByWidget?.length ? (
              <ul>
                {stats.submissionsByWidget.map((item) => (
                  <li key={item.widgetId}>
                    {item.title}: {item.count} submissions
                  </li>
                ))}
              </ul>
            ) : (
              <p>No widget submissions yet.</p>
            )}
          </section>
        </>
      )}
    </main>
  );
}
