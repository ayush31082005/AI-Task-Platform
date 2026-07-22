import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { api } from "./api";

const operations = [
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "reverse", label: "Reverse String" },
  { value: "word_count", label: "Word Count" },
];

const showcaseMessages = [
  {
    eyebrow: "SMARTER WORKFLOWS",
    title: "Turn simple ideas into completed tasks.",
    description:
      "Create, process, and track your text operations from one clean workspace.",
  },
  {
    eyebrow: "REAL-TIME PROGRESS",
    title: "Watch every task move from queued to done.",
    description:
      "Stay informed with live status updates, clear results, and execution logs.",
  },
  {
    eyebrow: "BUILT FOR FOCUS",
    title: "Spend less time waiting and more time creating.",
    description:
      "Let reliable background processing handle the repetitive work for you.",
  },
];

function AuthForm({ mode, onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(
    mode === "login" ? location.state?.message || "" : ""
  );
  const [loading, setLoading] = useState(false);
  const [showcaseIndex, setShowcaseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setShowcaseIndex((current) => (current + 1) % showcaseMessages.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const showcase = showcaseMessages[showcaseIndex];

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const path = mode === "register" ? "/auth/register" : "/auth/login";
      const payload =
        mode === "register"
          ? form
          : { email: form.email, password: form.password };

      const data = await api(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (mode === "register") {
        navigate("/login", {
          replace: true,
          state: { message: "Registration successful. Please login." },
        });
        return;
      }

      localStorage.setItem("token", data.token);
      onLogin(data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <section className="auth-showcase">
          <div className="showcase-shapes" aria-hidden="true">
            <span className="shape shape-one" />
            <span className="shape shape-two" />
            <span className="shape shape-three" />
          </div>
          <div className="auth-logo">
            <span>AI</span>
            <strong>Task Platform</strong>
          </div>
          <div className="showcase-copy" key={showcaseIndex}>
            <p className="eyebrow">{showcase.eyebrow}</p>
            <h2>{showcase.title}</h2>
            <p>{showcase.description}</p>
            <div className="feature-list">
              <span>Fast processing</span>
              <span>Live task status</span>
              <span>Secure workspace</span>
            </div>
          </div>
          <div className="showcase-bottom">
            <div className="slide-dots" aria-label="Showcase slide">
              {showcaseMessages.map((item, index) => (
                <button
                  key={item.eyebrow}
                  type="button"
                  className={index === showcaseIndex ? "active" : ""}
                  aria-label={`Show slide ${index + 1}`}
                  onClick={() => setShowcaseIndex(index)}
                />
              ))}
            </div>
            <p className="showcase-foot">Simple. Reliable. Built for focus.</p>
          </div>
        </section>

        <form className="auth-card" onSubmit={submit}>
          <div className="form-heading">
            <span className="form-icon">{mode === "register" ? "✦" : "→"}</span>
            <p className="eyebrow">
              {mode === "register" ? "GET STARTED" : "WELCOME BACK"}
            </p>
            <h1>{mode === "register" ? "Create your account" : "Sign in to continue"}</h1>
            <p className="muted">
              {mode === "register"
                ? "Set up your workspace in just a few seconds."
                : "Enter your details to access your dashboard."}
            </p>
          </div>

          {mode === "register" && (
            <label>
              Full name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter your full name"
                autoComplete="name"
                required
              />
            </label>
          )}

          <label>
            Email address
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              placeholder="Minimum 8 characters"
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
            />
          </label>

          {success && <div className="success">{success}</div>}
          {error && <div className="error">{error}</div>}

          <button className="auth-submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "register"
                ? "Create account"
                : "Sign in"}
          </button>

          <div className="auth-switch">
            <span>
              {mode === "register" ? "Already have an account?" : "New to AI Task Platform?"}
            </span>
            <button
              type="button"
              className="text-button"
              onClick={() => navigate(mode === "register" ? "/login" : "/register")}
            >
              {mode === "register" ? "Sign in" : "Create an account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`status status-${status.toLowerCase()}`}>{status}</span>;
}

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form, setForm] = useState({
    title: "",
    inputText: "",
    operation: "uppercase",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => tasks.filter((task) => ["Pending", "Running"].includes(task.status)).length,
    [tasks]
  );

  async function loadTasks() {
    try {
      const data = await api("/tasks");
      setTasks(data.tasks);
      setSelectedTask((currentTask) => {
        if (!currentTask) return currentTask;

        const refreshed = data.tasks.find(
          (item) => item._id === currentTask._id
        );
        return refreshed || currentTask;
      });
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadTasks();
    const timer = setInterval(loadTasks, 2000);
    return () => clearInterval(timer);
  }, []);

  async function createTask(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      const data = await api("/tasks", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm({
        title: "",
        inputText: "",
        operation: "uppercase",
      });
      setSelectedTask(data.task);
      setMessage("Task created. Click Run Task.");
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runTask(taskId) {
    setError("");
    setMessage("");

    try {
      await api(`/tasks/${taskId}/run`, { method: "POST" });
      setMessage("Task queued successfully.");
      await loadTasks();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app-shell">
      <header>
        <div>
          <div className="brand">AI Task Platform</div>
          <p className="muted">
            Logged in as {user.name} ({user.email})
          </p>
        </div>
        <button className="secondary" onClick={onLogout}>
          Logout
        </button>
      </header>

      <main>
        <section className="stats-grid">
          <div className="card stat-card">
            <span>Total Tasks</span>
            <strong>{tasks.length}</strong>
          </div>
          <div className="card stat-card">
            <span>Active</span>
            <strong>{activeCount}</strong>
          </div>
          <div className="card stat-card">
            <span>Successful</span>
            <strong>
              {tasks.filter((task) => task.status === "Success").length}
            </strong>
          </div>
        </section>

        <section className="layout-grid">
          <form className="card" onSubmit={createTask}>
            <h2>Create task</h2>

            <label>
              Task title
              <input
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="Process customer message"
                required
              />
            </label>

            <label>
              Input text
              <textarea
                value={form.inputText}
                onChange={(e) =>
                  setForm({ ...form, inputText: e.target.value })
                }
                placeholder="Enter text to process..."
                rows={8}
                required
              />
            </label>

            <label>
              Operation
              <select
                value={form.operation}
                onChange={(e) =>
                  setForm({ ...form, operation: e.target.value })
                }
              >
                {operations.map((operation) => (
                  <option key={operation.value} value={operation.value}>
                    {operation.label}
                  </option>
                ))}
              </select>
            </label>

            <button>Create Task</button>
            {message && <div className="success">{message}</div>}
            {error && <div className="error">{error}</div>}
          </form>

          <div className="card">
            <div className="section-title">
              <h2>Your tasks</h2>
              <button className="secondary" onClick={loadTasks}>
                Refresh
              </button>
            </div>

            <div className="task-list">
              {tasks.length === 0 && (
                <p className="muted">No tasks created yet.</p>
              )}

              {tasks.map((task) => (
                <button
                  key={task._id}
                  className="task-row"
                  onClick={() => setSelectedTask(task)}
                >
                  <div>
                    <strong>{task.title}</strong>
                    <span>{task.operation}</span>
                  </div>
                  <StatusBadge status={task.status} />
                </button>
              ))}
            </div>
          </div>
        </section>

        {selectedTask && (
          <section className="card details-card">
            <div className="section-title">
              <div>
                <h2>{selectedTask.title}</h2>
                <StatusBadge status={selectedTask.status} />
              </div>
              <button
                onClick={() => runTask(selectedTask._id)}
                disabled={selectedTask.status === "Running"}
              >
                Run Task
              </button>
            </div>

            <div className="details-grid">
              <div>
                <h3>Input</h3>
                <pre>{selectedTask.inputText}</pre>
              </div>
              <div>
                <h3>Result</h3>
                <pre>
                  {selectedTask.result !== null
                    ? JSON.stringify(selectedTask.result, null, 2)
                    : selectedTask.error || "No result yet"}
                </pre>
              </div>
            </div>

            <h3>Execution logs</h3>
            <div className="logs">
              {selectedTask.logs?.map((log, index) => (
                <div key={`${log.at}-${index}`}>
                  <span>{new Date(log.at).toLocaleString()}</span>
                  <strong>{log.message}</strong>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function ProtectedRoute({ user, checking, children }) {
  if (checking) return <div className="center">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setChecking(false);
      return;
    }

    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setChecking(false));
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
      />
      <Route
        path="/login"
        element={
          checking ? (
            <div className="center">Loading...</div>
          ) : user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthForm mode="login" onLogin={setUser} />
          )
        }
      />
      <Route
        path="/register"
        element={
          checking ? (
            <div className="center">Loading...</div>
          ) : user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthForm mode="register" onLogin={setUser} />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute user={user} checking={checking}>
            <Dashboard
              user={user}
              onLogout={() => {
                localStorage.removeItem("token");
                setUser(null);
              }}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
