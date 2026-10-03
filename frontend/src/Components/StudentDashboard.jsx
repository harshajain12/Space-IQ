import UserDashboard from "./userDashboard";

function StudentDashboard({ user, onLogout }) {
  return (
    <UserDashboard
      user={user}
      onLogout={onLogout}
      role="Student"
    />
  );
}

export default StudentDashboard;