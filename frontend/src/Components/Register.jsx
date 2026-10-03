import { useState } from "react";

function Register({ onSwitchToLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = async (event) => {
    event.preventDefault();

    // Check password confirmation
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fullName,
            email,
            userId,
            role,
            password
          })
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful!");

        // Clear the form
        setFullName("");
        setEmail("");
        setUserId("");
        setRole("");
        setPassword("");
        setConfirmPassword("");

        // Go to Login
        onSwitchToLogin();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to the server.");
    }
  };

  return (
    <div className="auth-container">

      <div className="logo">Space IQ</div>

      <div className="tagline">
        Intelligent Resource Booking & Availability Platform
      </div>

      <h2>Create Account</h2>

      <form onSubmit={handleRegister}>

        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          type="text"
          placeholder="Student/Faculty ID"
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
        />

        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="">Select Role</option>
          <option value="Student">Student</option>
          <option value="Faculty">Faculty</option>
        </select>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <button type="submit" className="auth-button">
          Register
        </button>

      </form>

      <p className="switch-text">
        Already have an account?{" "}
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

export default Register;