import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  const handleUnload = () => {
    const data = JSON.stringify({ userId: user._id });
    const blob = new Blob([data], { type: "application/json" });

    navigator.sendBeacon("/api/auth/logout-beacon", blob);
  };

  window.addEventListener("beforeunload", handleUnload);

  return () => {
    window.removeEventListener("beforeunload", handleUnload);
  };
}, []);
