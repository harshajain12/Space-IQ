
import { useState } from "react";

function Login({ onSwitchToRegister, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Login successful!");

        // Clear any old login data first
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        // Store the new JWT token and user
        if (rememberMe) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
        } else {
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("user", JSON.stringify(data.user));
        }

        console.log("Logged in user:", data.user);

        onLoginSuccess(data.user);

      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="auth-container">

      <div className="logo">Space IQ</div>

      <div className="tagline">
        Intelligent Resource Booking & Availability Platform
      </div>

      <h2>Welcome Back!</h2>

      <form onSubmit={handleLogin}>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />

        <button type="submit" className="auth-button">
          Login
        </button>

        <div className="login-options">

          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            Remember Me
          </label>

          <button
  type="button"
  className="forgot-button"
  onClick={async () => {
    const email = window.prompt(
      "Enter your registered email address:"
    );

    if (!email) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert(
        `Password reset request created.\n\nDevelopment reset token:\n${data.resetToken}`
      );

    } catch (error) {
      console.error("Forgot password error:", error);
      alert("Unable to connect to the server.");
    }
  }}
>
  Forgot Password?
</button>

        </div>

      </form>

      <p className="switch-text">
        Don't have an account?{" "}
        <button
          className="switch-button"
          onClick={onSwitchToRegister}
        >
          Register
        </button>
      </p>

    </div>
  );
}

export default Login;

