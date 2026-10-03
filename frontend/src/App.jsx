import { useEffect, useState } from "react";

import Login from "./Components/Login";
import Register from "./Components/Register";
import ResetPassword from "./Components/ResetPassword";
import StudentDashboard from "./Components/StudentDashboard";
import FacultyDashboard from "./Components/FacultyDashboard";
import AdminDashboard from "./Components/AdminDashboard";
import CheckIn from "./Components/CheckIn";

import "./App.css";

function App() {
  const [isRegister, setIsRegister] = useState(false);

  // null = checking session
  // false = no logged-in user
  // object = logged-in user
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const isCheckInPage =
    window.location.pathname === "/check-in";

    const isResetPasswordPage =
  window.location.pathname === "/reset-password";

  // --------------------------------------------------
  // RESTORE LOGIN SESSION AFTER REFRESH
  // --------------------------------------------------
  useEffect(() => {
    if (isCheckInPage) {
      setCheckingSession(false);
      return;
    }

    try {
      const localToken = localStorage.getItem("token");
      const localUser = localStorage.getItem("user");

      const sessionToken = sessionStorage.getItem("token");
      const sessionUser = sessionStorage.getItem("user");

      // Prefer localStorage first
      const token = localToken || sessionToken;
      const user = localUser || sessionUser;

      console.log("Checking saved login...");
      console.log("Token exists:", !!token);
      console.log("User exists:", !!user);

      if (token && user) {
        try {
          const parsedUser = JSON.parse(user);

          console.log(
            "Restored logged-in user:",
            parsedUser
          );

          setLoggedInUser(parsedUser);
        } catch (parseError) {
          console.error(
            "Saved user data is invalid:",
            parseError
          );

          localStorage.removeItem("token");
          localStorage.removeItem("user");

          sessionStorage.removeItem("token");
          sessionStorage.removeItem("user");

          setLoggedInUser(null);
        }
      } else {
        setLoggedInUser(null);
      }
    } catch (error) {
      console.error(
        "Error restoring login session:",
        error
      );

      setLoggedInUser(null);
    } finally {
      setCheckingSession(false);
    }
  }, [isCheckInPage]);

  // --------------------------------------------------
  // LOGIN SUCCESS
  // --------------------------------------------------
  const handleLoginSuccess = (user) => {
    console.log(
      "Login successful. Setting user:",
      user
    );

    setLoggedInUser(user);
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
  const handleLogout = () => {
    console.log("Logging out...");

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");

    setLoggedInUser(null);
  };

  // --------------------------------------------------
  // QR CHECK-IN PAGE
  // --------------------------------------------------
  if (isCheckInPage) {
    return <CheckIn />;
  }

  // --------------------------------------------------
// RESET PASSWORD PAGE
// --------------------------------------------------
if (isResetPasswordPage) {
  return (
    <ResetPassword
      onSwitchToLogin={() =>
        window.location.href = "/"
      }
    />
  );
}

  // --------------------------------------------------
  // WAIT WHILE CHECKING SAVED SESSION
  // --------------------------------------------------
  if (checkingSession) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
        }}
      >
        Loading Space IQ...
      </div>
    );
  }

  // --------------------------------------------------
  // STUDENT
  // --------------------------------------------------
  if (
    loggedInUser &&
    loggedInUser.role === "Student"
  ) {
    return (
      <StudentDashboard
        user={loggedInUser}
        onLogout={handleLogout}
      />
    );
  }

  // --------------------------------------------------
  // FACULTY
  // --------------------------------------------------
  if (
    loggedInUser &&
    loggedInUser.role === "Faculty"
  ) {
    return (
      <FacultyDashboard
        user={loggedInUser}
        onLogout={handleLogout}
      />
    );
  }

  // --------------------------------------------------
  // ADMIN
  // --------------------------------------------------
  if (
    loggedInUser &&
    loggedInUser.role === "Admin"
  ) {
    return (
      <AdminDashboard
        user={loggedInUser}
        onLogout={handleLogout}
      />
    );
  }

  // --------------------------------------------------
  // LOGIN / REGISTER
  // --------------------------------------------------
  return (
    <div className="app">
      {isRegister ? (
        <Register
          onSwitchToLogin={() =>
            setIsRegister(false)
          }
        />
      ) : (
        <Login
          onSwitchToRegister={() =>
            setIsRegister(true)
          }
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
}

export default App;