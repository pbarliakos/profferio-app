import { useState } from "react";
import { TextField, Button, Typography } from "@mui/material";
import axios from "axios";

export default function EmailForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    try {
      await axios.post("/api/send-welcome-email", { email });
      setSent(true);
    } catch (err) {
      alert("Σφάλμα κατά την αποστολή email");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", paddingTop: "2rem" }}>
      <Typography variant="h5" gutterBottom>
        Project Nova: Εγγραφή Email
      </Typography>
      <TextField
        fullWidth
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleSubmit}
        disabled={sent}
      >
        {sent ? "✅ Εστάλη!" : "Αποστολή Email"}
      </Button>
    </div>
  );
}
