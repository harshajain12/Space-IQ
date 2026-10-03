import UserDashboard from "./userDashboard";

function FacultyDashboard({ user, onLogout }) {
  return (
    <UserDashboard
      user={user}
      onLogout={onLogout}
      role="Faculty"
    />
  );
}

export default FacultyDashboard;