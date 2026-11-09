import React, { useEffect, useState } from "react";

function App() {
  const [mood, setMood] = useState(1);
  const [note, setNote] = useState("");
  const [checkins, setCheckins] = useState([]);
  const [error, setError] = useState("");

  const fetchCheckins = async () => {
    try {
      const res = await fetch("/api/checkins");
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      setCheckins(data);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: Number(mood), note: note.slice(0, 500) })
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Failed to save: ${res.status}`);
      }
      setMood(1);
      setNote("");
      await fetchCheckins();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/checkins/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Failed to delete: ${res.status}`);
      }
      await fetchCheckins();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "auto" }}>
      <h1>Daily Check‑in</h1>
      {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Mood (1‑5):
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            style={{ marginLeft: "0.5rem" }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Note (max 500 chars):
          <br />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 500))}
            rows={4}
            cols={50}
          />
        </label>
      </div>
      <button onClick={handleSave}>Save</button>
      <hr style={{ margin: "2rem 0" }} />
      <h2>Past Check‑ins</h2>
      {checkins.length === 0 ? (
        <p>No check‑ins yet.</p>
      ) : (
        <ul>
          {checkins.map((c) => (
            <li key={c.id} style={{ marginBottom: "0.5rem" }}>
              <strong>Mood:</strong> {c.mood} – <strong>Note:</strong> {c.note}
              <button
                onClick={() => handleDelete(c.id)}
                style={{ marginLeft: "1rem" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
