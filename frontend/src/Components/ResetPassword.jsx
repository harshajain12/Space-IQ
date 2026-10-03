import { useState } from "react";

function ResetPassword({ onSwitchToLogin }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleResetPassword = async (event) => {
    event.preventDefault();

    let token = new URLSearchParams(
  window.location.search
).get("token");

if (token?.startsWith("http")) {
  token = new URL(token).searchParams.get("token");
}

    if (!token) {
      alert("Invalid or missing password reset token.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            token,
            newPassword: password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert(data.message);

      setPassword("");
      setConfirmPassword("");

      onSwitchToLogin();

    } catch (error) {
      console.error("Reset password error:", error);
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="auth-container">

      <div className="logo">Space IQ</div>

      <div className="tagline">
        Intelligent Resource Booking & Availability Platform
      </div>

      <h2>Reset Password</h2>

      <form onSubmit={handleResetPassword}>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(event) =>
            setPassword(event.target.value)
          }
          required
        />

        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(event.target.value)
          }
          required
        />

        <button
          type="submit"
          className="auth-button"
        >
          Reset Password
        </button>

      </form>

      <p className="switch-text">
        Remember your password?{" "}
        <button
          className="switch-button"
          onClick={onSwitchToLogin}
        >
          Login
        </button>
      </p>

    </div>
  );
}

export default ResetPassword;