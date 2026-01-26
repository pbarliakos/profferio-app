import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function msToHHMMSS(ms) {
  const totalSec = Math.floor((ms || 0) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function MyTime() {
  const navigate = useNavigate();
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [now, setNow] = useState(Date.now());

  const api = useMemo(() => {
    const instance = axios.create({ baseURL: "" });
    const token = localStorage.getItem("token");
    if (token) instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    return instance;
  }, []);

  const ensureLoggedIn = () => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/");
  };

  const refresh = async () => {
    const res = await api.get("/api/time/day");
    setDaily(res.data.daily);
  };

  // ✅ 1) Local clock tick κάθε 1s (μόνο για UI)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // ✅ 2) Backend sync κάθε 5s (source of truth)
  useEffect(() => {
    ensureLoggedIn();

    (async () => {
      try {
        await refresh();
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load time data");
      } finally {
        setLoading(false);
      }
    })();

    const t = setInterval(() => {
      refresh().catch(() => {});
    }, 5000);

    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  // ✅ Live computation (τρέχει κάθε 1s επειδή αλλάζει το "now")
  const liveTotals = useMemo(() => {
    if (!daily?.firstLoginAt) {
      return {
        breakMs: 0,
        totalPresenceMs: 0,
        workingMs: 0,
      };
    }

    const startMs = new Date(daily.firstLoginAt).getTime();

    // Αν το day είναι closed, σταματάει να τρέχει στο lastLogoutAt
    const endMs =
      daily.status === "closed" && daily.lastLogoutAt
        ? new Date(daily.lastLogoutAt).getTime()
        : now;

    const totalPresenceMs = Math.max(0, endMs - startMs);

    // Break time: saved breakMs + (αν υπάρχει open break, προσθέτουμε live)
    let breakMs = daily.breakMs || 0;
    if (daily.breakOpenAt) {
      const breakOpenMs = new Date(daily.breakOpenAt).getTime();
      breakMs += Math.max(0, now - breakOpenMs);
    }

    const workingMs = Math.max(0, totalPresenceMs - breakMs);

    return { breakMs, totalPresenceMs, workingMs };
  }, [daily, now]);

  const startDay = async () => {
    setErr("");
    try {
      await api.post("/api/time/login");
      await refresh();
    } catch (e) {
      setErr(e?.response?.data?.message || "Start day failed");
    }
  };

  const endDay = async () => {
    setErr("");
    try {
      await api.post("/api/time/logout");
      await refresh();
    } catch (e) {
      setErr(e?.response?.data?.message || "End day failed");
    }
  };

  const startBreak = async () => {
    setErr("");
    try {
      await api.post("/api/time/break/start");
      await refresh();
    } catch (e) {
      setErr(e?.response?.data?.message || "Start break failed");
    }
  };

  const endBreak = async () => {
    setErr("");
    try {
      await api.post("/api/time/break/end");
      await refresh();
    } catch (e) {
      setErr(e?.response?.data?.message || "End break failed");
    }
  };

  const logoutApp = async () => {
    setErr("");
    try {
      await api.post("/api/auth/logout");
    } catch (_) {
      // ignore
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("project");
      navigate("/");
    }
  };

  const hasDay = !!daily?.firstLoginAt;
  const isClosed = daily?.status === "closed";
  const isOnBreak = !!daily?.breakOpenAt;
  const canWork = hasDay && !isClosed;

  const statusLabel = !hasDay ? "Not started" : isClosed ? "Closed" : isOnBreak ? "On Break" : "Working";

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
        My Time
      </Typography>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          {loading ? (
            <Typography>Loading…</Typography>
          ) : (
            <>
              {err && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {err}
                </Typography>
              )}

              <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap", mb: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Typography variant="h6">{statusLabel}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Break Time
                  </Typography>
                  <Typography variant="h6">{msToHHMMSS(liveTotals.breakMs)}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Presence
                  </Typography>
                  <Typography variant="h6">{msToHHMMSS(liveTotals.totalPresenceMs)}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Working Time
                  </Typography>
                  <Typography variant="h6">{msToHHMMSS(liveTotals.workingMs)}</Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                <Button variant="contained" onClick={startDay} disabled={canWork}>
                  {hasDay ? "Reopen Day" : "Start Day"}
                </Button>

                <Button variant="outlined" onClick={isOnBreak ? endBreak : startBreak} disabled={!canWork}>
                  {isOnBreak ? "End Break" : "Start Break"}
                </Button>

                <Button variant="contained" color="warning" onClick={endDay} disabled={!canWork}>
                  End Day
                </Button>

                <Button variant="contained" color="error" onClick={logoutApp}>
                  Logout
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
                Tip: “End Day” κλείνει το timesheet. “Logout” σε βγάζει από το app.
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
