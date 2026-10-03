  import { useEffect, useState } from "react";
  import { QRCodeCanvas } from "qrcode.react";

  function AdminDashboard({ user, onLogout }) {

    const [profilePicture, setProfilePicture] = useState(
  user?.profilePicture || ""
);

const [uploadingProfilePicture, setUploadingProfilePicture] =
  useState(false);

    const [activePage, setActivePage] = useState("Dashboard");
    const [showAddRoom, setShowAddRoom] = useState(false);



    const [rooms, setRooms] = useState([]);
    const [editingRoomId, setEditingRoomId] = useState(null);

const [printingQrRoomId, setPrintingQrRoomId] = useState(null); 

    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);
    const [updatingBookingId, setUpdatingBookingId] = useState(null);

    const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [buildings, setBuildings] = useState([]);
  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [editingBuildingId, setEditingBuildingId] = useState(null);
  const [loadingBuildings, setLoadingBuildings] = useState(false);

  const [reportPeriod, setReportPeriod] = useState("today");

  const [reportFromDate, setReportFromDate] = useState("");
  const [reportToDate, setReportToDate] = useState("");

  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");

  const [buildingForm, setBuildingForm] = useState({
    campus: "",
    name: "",
    location: ""
  });

    const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    building: "",
    capacity: "",
    facilities: [],
    status: "Available",
    maintenanceNote: "",
  });

    // JWT TOKEN
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");


    // =====================================================
    // FETCH ROOMS
    // =====================================================

    useEffect(() => {
      const fetchRooms = async () => {
        try {
          const response = await fetch(
            "http://localhost:5000/api/rooms",
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          const data = await response.json();

          if (response.ok) {
            const loadedRooms = data.map((room) => ({
              ...room,
              id: room._id
            }));

            setRooms(loadedRooms);
          } else {
            alert(data.message);
          }
        } catch (error) {
          console.error("Fetch rooms error:", error);
          alert("Unable to load rooms from the server.");
        }
      };

      fetchRooms();
    }, [token]);


    // =====================================================
    // FETCH ALL BOOKINGS
    // =====================================================

    const fetchBookings = async () => {
      setLoadingBookings(true);

      try {
        const response = await fetch(
          "http://localhost:5000/api/bookings",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (response.ok) {
          setBookings(data);
        } else {
          alert(data.message);
        }

      } catch (error) {
        console.error("Fetch bookings error:", error);
        alert("Unable to load bookings from the server.");
      } finally {
        setLoadingBookings(false);
      }
    };

    const fetchUsers = async (role) => {
    setLoadingUsers(true);

    try {
      const endpoint =
        role === "Student"
          ? "students"
          : "faculty";

      const response = await fetch(
        `http://localhost:5000/api/users/${endpoint}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (role === "Student") {
          setStudents(data);
        } else {
          setFaculty(data);
        }
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(`Fetch ${role} error:`, error);
      alert(`Unable to load ${role.toLowerCase()} members.`);
    } finally {
      setLoadingUsers(false);
    }
  };

  // =====================================================
  // FETCH BUILDINGS
  // =====================================================

  const fetchBuildings = async () => {
    setLoadingBuildings(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/buildings",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (response.ok) {
        setBuildings(data);
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error("Fetch buildings error:", error);
      alert("Unable to load campuses and buildings.");
    } finally {
      setLoadingBuildings(false);
    }
  };

  const maintenanceRooms = rooms.filter(
    (room) => room.status === "Maintenance"
  );

  const availableRooms = rooms.filter(
    (room) => room.status === "Available"
  );

  const occupiedRooms = rooms.filter(
    (room) => room.status === "Occupied"
  );

  const totalBookings = bookings.length;

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "Pending"
  ).length;

  const approvedBookings = bookings.filter(
    (booking) => booking.status === "Approved"
  ).length;

  const rejectedBookings = bookings.filter(
    (booking) => booking.status === "Rejected"
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "Cancelled"
  ).length;

  const completedBookings = bookings.filter(
    (booking) => booking.status === "Completed"
  ).length;

  const studentBookings = bookings.filter(
    (booking) => booking.user?.role === "Student"
  ).length;

  const facultyBookings = bookings.filter(
    (booking) => booking.user?.role === "Faculty"
  ).length;

  const getPercentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
  };

  const getIndiaDate = () =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const getDateAfterDays = (dateString, days) => {
    const [year, month, day] = dateString
      .split("-")
      .map(Number);

    const date = new Date(
      Date.UTC(year, month - 1, day + days)
    );

    return date.toISOString().split("T")[0];
  };

  const getMonthStart = () => {
    const [year, month] = getIndiaDate()
      .split("-")
      .map(Number);

    return `${year}-${String(month).padStart(2, "0")}-01`;
  };

  const getMonthEnd = () => {
    const [year, month] = getIndiaDate()
      .split("-")
      .map(Number);

    const lastDay = new Date(
      Date.UTC(year, month, 0)
    ).getUTCDate();

    return `${year}-${String(month).padStart(2, "0")}-${String(
      lastDay
    ).padStart(2, "0")}`;
  };

  const generateReport = () => {
    const today = getIndiaDate();

    let startDate = "";
    let endDate = "";

    if (reportPeriod === "today") {
      startDate = today;
      endDate = today;
    }

    if (reportPeriod === "yesterday") {
      startDate = getDateAfterDays(today, -1);
      endDate = startDate;
    }

    if (reportPeriod === "last7") {
      startDate = getDateAfterDays(today, -6);
      endDate = today;
    }

    if (reportPeriod === "thisMonth") {
      startDate = getMonthStart();
      endDate = getMonthEnd();
    }

    if (reportPeriod === "custom") {
      if (!reportFromDate || !reportToDate) {
        alert("Please select both From and To dates.");
        return;
      }

      if (reportFromDate > reportToDate) {
        alert("From date cannot be after To date.");
        return;
      }

      startDate = reportFromDate;
      endDate = reportToDate;
    }

    setReportStartDate(startDate);
    setReportEndDate(endDate);
  };
    // =====================================================
    // NAVIGATION
    // =====================================================

    const handleNavigation = (page) => {
    setActivePage(page);
    setShowAddRoom(false);
    setEditingRoomId(null);
    setShowAddBuilding(false);
    setEditingBuildingId(null);

    if (page === "Booking Management") {
      fetchBookings();
    }

    if (page === "Students") {
      fetchUsers("Student");
    }

    if (page === "Faculty") {
      fetchUsers("Faculty");
    }

    if (page === "Campus & Buildings") {
      fetchBuildings();
    }

    if (page === "Reports") {
    fetchBookings();
    fetchBuildings();
  };
  }

  const handlePrintQr = (roomId) => {
  setPrintingQrRoomId(roomId);

  setTimeout(() => {
    window.print();
  }, 100);
};

useEffect(() => {
  const handleAfterPrint = () => {
    setPrintingQrRoomId(null);
  };

  window.addEventListener("afterprint", handleAfterPrint);

  return () => {
    window.removeEventListener("afterprint", handleAfterPrint);
  };
}, []);

  const handleProfilePictureChange = async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file.");
    event.target.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Please choose an image smaller than 2 MB.");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = async () => {
    try {
      setUploadingProfilePicture(true);

      const response = await fetch(
        "http://localhost:5000/api/users/profile-picture",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            profilePicture: reader.result
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Unable to update profile picture.");
        return;
      }

      setProfilePicture(data.profilePicture || "");

      alert("Profile picture updated successfully.");

    } catch (error) {
      console.error("Profile picture upload error:", error);
      alert("Unable to update profile picture.");
    } finally {
      setUploadingProfilePicture(false);
      event.target.value = "";
    }
  };

  reader.onerror = () => {
    alert("Unable to read the selected image.");
    event.target.value = "";
  };

  reader.readAsDataURL(file);
};


const handleRemoveProfilePicture = async () => {
  const confirmRemove = window.confirm(
    "Are you sure you want to remove your profile picture?"
  );

  if (!confirmRemove) {
    return;
  }

  try {
    setUploadingProfilePicture(true);

    const response = await fetch(
      "http://localhost:5000/api/users/profile-picture",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          profilePicture: ""
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Unable to remove profile picture.");
      return;
    }

    setProfilePicture("");

    alert("Profile picture removed successfully.");

  } catch (error) {
    console.error("Remove profile picture error:", error);
    alert("Unable to remove profile picture.");
  } finally {
    setUploadingProfilePicture(false);
  }
};

    // =====================================================
    // ROOM FACILITIES
    // =====================================================

    const handleFacilityChange = (facility) => {
      setRoomForm((previous) => ({
        ...previous,
        facilities: previous.facilities.includes(facility)
          ? previous.facilities.filter((item) => item !== facility)
          : [...previous.facilities, facility],
      }));
    };


    // =====================================================
    // ROOM FORM
    // =====================================================

    const handleFormChange = (event) => {
      const { name, value } = event.target;

      setRoomForm((previous) => ({
        ...previous,
        [name]: value,
      }));
    };


    // =====================================================
    // ADD / EDIT ROOM
    // =====================================================

    const handleAddRoom = async (event) => {
      event.preventDefault();

      if (
        !roomForm.roomNumber ||
        !roomForm.building ||
        !roomForm.capacity
      ) {
        alert("Please fill in Room Number, Building and Capacity.");
        return;
      }

      try {
        const isEditing = editingRoomId !== null;

        const url = isEditing
          ? `http://localhost:5000/api/rooms/${editingRoomId}`
          : "http://localhost:5000/api/rooms";

        const response = await fetch(url, {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
    roomNumber: roomForm.roomNumber,
    building: roomForm.building,
    capacity: roomForm.capacity,
    facilities: roomForm.facilities,
    status: roomForm.status,
    maintenanceNote: roomForm.maintenanceNote,
  })
        });

        const data = await response.json();

        if (response.ok) {
          const savedRoom = {
            ...data.room,
            id: data.room._id
          };

          if (isEditing) {
            setRooms((previous) =>
              previous.map((room) =>
                room.id === editingRoomId
                  ? savedRoom
                  : room
              )
            );
          } else {
            setRooms((previous) => [
              ...previous,
              savedRoom
            ]);
          }

          setRoomForm({
            roomNumber: "",
            building: "",
            capacity: "",
            facilities: [],
            status: "Available",
            maintenanceNote: ""
          });

          setEditingRoomId(null);
          setShowAddRoom(false);

          alert(data.message);
        } else {
          alert(data.message);
        }

      } catch (error) {
        console.error("Save room error:", error);
        alert("Unable to connect to the server.");
      }
    };


    // =====================================================
    // DELETE ROOM
    // =====================================================

    const handleDeleteRoom = async (roomId) => {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this room?"
      );

      if (!confirmDelete) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/rooms/${roomId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await response.json();

        if (response.ok) {
          setRooms((previous) =>
            previous.filter((room) => room.id !== roomId)
          );

          alert(data.message);
        } else {
          alert(data.message);
        }

      } catch (error) {
        console.error("Delete room error:", error);
        alert("Unable to connect to the server.");
      }
    };


    // =====================================================
    // EDIT ROOM
    // =====================================================

    const handleEditRoom = (room) => {
      setEditingRoomId(room.id);

      setRoomForm({
    roomNumber: room.roomNumber,
    building: room.building,
    capacity: room.capacity,
    facilities: room.facilities,
    status: room.status,
    maintenanceNote: room.maintenanceNote || "",
  });

      setShowAddRoom(true);
    };


    // =====================================================
    // CANCEL ROOM FORM
    // =====================================================

    const handleCancelRoomForm = () => {
      setRoomForm({
        roomNumber: "",
        building: "",
        capacity: "",
        facilities: [],
        status: "Available",
        maintenanceNote: ""
      });

      setEditingRoomId(null);
      setShowAddRoom(false);
    };


    // =====================================================
    // UPDATE BOOKING STATUS
    // =====================================================

    const handleBookingStatusUpdate = async (bookingId, status) => {
     const actionText =
  status === "Approved"
    ? "approve"
    : status === "Rejected"
    ? "reject"
    : status === "Cancelled"
    ? "cancel"
    : status === "Completed"
    ? "complete"
    : status.toLowerCase();

      const confirmAction = window.confirm(
        `Are you sure you want to ${actionText} this booking?`
      );

      if (!confirmAction) {
        return;
      }

      setUpdatingBookingId(bookingId);

      try {
        const response = await fetch(
          `http://localhost:5000/api/bookings/${bookingId}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              status
            })
          }
        );

        const data = await response.json();

        if (response.ok) {
          setBookings((previous) =>
            previous.map((booking) =>
              booking._id === bookingId
                ? data.booking
                : booking
            )
          );

          alert(data.message);
        } else {
          alert(data.message);
        }

      } catch (error) {
        console.error("Update booking status error:", error);
        alert("Unable to update booking status.");
      } finally {
        setUpdatingBookingId(null);
      }
    };


    // =====================================================
    // RETURN
    // =====================================================

    return (
      <div className="dashboard">

        {/* SIDEBAR */}
        <aside className="sidebar">

          <div className="sidebar-brand">
            <div className="brand-logo">SI</div>

            <div>
              <h2>Space IQ</h2>
              <p>
                Intelligent Resource Booking & Availability Platform
              </p>
            </div>
          </div>


          <nav className="sidebar-nav">

            <button
              className={`nav-item ${
                activePage === "Dashboard" ? "active" : ""
              }`}
              onClick={() => handleNavigation("Dashboard")}
            >
              <span>⌂</span>
              Dashboard
            </button>


            <button
              className={`nav-item ${
                activePage === "Campus & Buildings" ? "active" : ""
              }`}
              onClick={() => handleNavigation("Campus & Buildings")}
            >
              <span>▦</span>
              Campus & Buildings
            </button>


            <button
              className={`nav-item ${
                activePage === "Room Management" ? "active" : ""
              }`}
              onClick={() => handleNavigation("Room Management")}
            >
              <span>▣</span>
              Room Management
            </button>


            <button
              className={`nav-item ${
                activePage === "Booking Management" ? "active" : ""
              }`}
              onClick={() => handleNavigation("Booking Management")}
            >
              <span>◷</span>
              Booking Management
            </button>


            <button
    className={`nav-item ${
      activePage === "Students" ? "active" : ""
    }`}
    onClick={() => handleNavigation("Students")}
  >
    <span>♙</span>
    Students
  </button>


            <button
    className={`nav-item ${
      activePage === "Faculty" ? "active" : ""
    }`}
    onClick={() => handleNavigation("Faculty")}
  >
    <span>♙</span>
    Faculty
  </button>


            <button
    className={`nav-item ${
      activePage === "QR Codes" ? "active" : ""
    }`}
    onClick={() => handleNavigation("QR Codes")}
  >
    <span>▧</span>
    QR Codes
  </button>


            <button
    className={`nav-item ${
      activePage === "Maintenance" ? "active" : ""
    }`}
    onClick={() => handleNavigation("Maintenance")}
  >
    <span>⚙</span>
    Maintenance
  </button>


            <button
    className={`nav-item ${activePage === "Reports" ? "active" : ""}`}
    onClick={() => handleNavigation("Reports")}
  >
    <span>▤</span>
    Reports
  </button>

  <button
    className={`nav-item ${activePage === "Settings" ? "active" : ""}`}
    onClick={() => handleNavigation("Settings")}
  >
    <span>⚙</span>
    Settings
  </button>

          </nav>


          <div className="sidebar-bottom">

            <div className="support-card">
              <div className="support-icon">?</div>

              <div>
                <strong>Need Help?</strong>
                <p>Contact Space IQ support</p>
              </div>
            </div>


            <button className="logout-button" onClick={onLogout}>
              <span>↪</span>
              Logout
            </button>

          </div>

        </aside>


        {/* MAIN CONTENT */}
        <main className="main-content">

          {/* TOP BAR */}
          <header className="topbar">

            <div>
              <p className="page-label">SPACE IQ</p>

              <h1>
                {activePage === "Dashboard"
                  ? "Admin Dashboard"
                  : activePage}
              </h1>
            </div>


           <button
  type="button"
  className="admin-profile-button"
  onClick={() => handleNavigation("My Profile")}
  title="View My Profile"
>
  <div className="admin-profile-avatar">
    {profilePicture ? (
      <img
        src={profilePicture}
        alt="Profile"
      />
    ) : (
      user?.fullName?.charAt(0)?.toUpperCase() || "A"
    )}
  </div>

  <div className="admin-profile-copy">
    <strong>
      {user?.fullName || "Administrator"}
    </strong>

    <span>
      <span className="admin-profile-status-dot"></span>
      Administrator
    </span>
  </div>

  <span className="admin-profile-chevron">⌄</span>
</button>
          </header>


          {/* =====================================================
              DASHBOARD
          ===================================================== */}

          {activePage === "Dashboard" && (
            <>
              <section className="welcome-section">

                <div>
                  <h2>
                    Welcome,{" "}
                    {user?.fullName?.split(" ")[0] || "Admin"}! 👋
                  </h2>

                  <p>
                    Manage spaces, users, bookings and resources from one place.
                  </p>
                </div>

              </section>


              <section className="stats-grid">

                <div className="stat-card">
                  <div className="stat-icon booking-icon">▣</div>

                  <div>
                    <span>Total Rooms</span>
                    <strong>{rooms.length}</strong>
                  </div>
                </div>


                <div className="stat-card">
                  <div className="stat-icon available-icon">✓</div>

                  <div>
                    <span>Available Rooms</span>

                    <strong>
                      {
                        rooms.filter(
                          (room) => room.status === "Available"
                        ).length
                      }
                    </strong>
                  </div>
                </div>


                <div className="stat-card">
                  <div className="stat-icon occupied-icon">●</div>

                  <div>
                    <span>Occupied Rooms</span>

                    <strong>
                      {
                        rooms.filter(
                          (room) => room.status === "Occupied"
                        ).length
                      }
                    </strong>
                  </div>
                </div>


                <div className="stat-card">
                  <div className="stat-icon maintenance-icon">!</div>

                  <div>
                    <span>Maintenance</span>

                    <strong>
                      {
                        rooms.filter(
                          (room) => room.status === "Maintenance"
                        ).length
                      }
                    </strong>
                  </div>
                </div>

              </section>


              <section className="search-section">

                <div className="section-heading">
                  <h2>Management Overview</h2>

                  <p>
                    Manage the different areas of the Space IQ platform.
                  </p>
                </div>


                <div className="room-grid">

                  <div className="room-card">

                    <div className="room-card-top">
                      <div className="room-number">
                        Campus & Buildings
                      </div>

                      <span className="status-badge available">
                        Manage
                      </span>
                    </div>

                    <p className="building-name">
                      Manage campuses, buildings and floors.
                    </p>

                    <div className="room-facilities">
                      <span>Campus</span>
                      <span>Buildings</span>
                      <span>Floors</span>
                    </div>

                    <button
                      className="view-room-button"
                      onClick={() =>
                        handleNavigation("Campus & Buildings")
                      }
                    >
                      Manage
                    </button>

                  </div>


                  <div className="room-card">

                    <div className="room-card-top">
                      <div className="room-number">
                        Room Management
                      </div>

                      <span className="status-badge available">
                        Manage
                      </span>
                    </div>

                    <p className="building-name">
                      Add and manage classrooms and facilities.
                    </p>

                    <div className="room-facilities">
                      <span>Rooms</span>
                      <span>Capacity</span>
                      <span>Facilities</span>
                    </div>

                    <button
                      className="view-room-button"
                      onClick={() =>
                        handleNavigation("Room Management")
                      }
                    >
                      Manage Rooms
                    </button>

                  </div>


                  <div className="room-card">

                    <div className="room-card-top">
                      <div className="room-number">
                        Booking Management
                      </div>

                      <span className="status-badge available">
                        Manage
                      </span>
                    </div>

                    <p className="building-name">
                      Review and manage room booking requests.
                    </p>

                    <div className="room-facilities">
                      <span>Requests</span>
                      <span>Bookings</span>
                      <span>Approvals</span>
                    </div>

                    <button
                      className="view-room-button"
                      onClick={() =>
                        handleNavigation("Booking Management")
                      }
                    >
                      View Bookings
                    </button>

                  </div>


                  <div className="room-card">
    <div className="room-card-top">
      <div>
        <div className="room-number">User Management</div>
        <div className="building-name">
          Manage students and faculty
        </div>
      </div>
    </div>

    <div className="room-details">
      <div className="room-detail">
        <span>Students & Faculty</span>
      </div>
    </div>

    <div style={{ display: "flex", gap: "10px" }}>
      <button
        className="view-room-button"
        style={{ width: "auto", flex: 1 }}
        onClick={() => handleNavigation("Students")}
      >
        Students
      </button>

      <button
        className="view-room-button"
        style={{ width: "auto", flex: 1 }}
        onClick={() => handleNavigation("Faculty")}
      >
        Faculty
      </button>
    </div>
  </div>

                  <div className="room-card">

                    <div className="room-card-top">
                      <div className="room-number">
                        QR Code Management
                      </div>

                      <span className="status-badge available">
                        Manage
                      </span>
                    </div>

                    <p className="building-name">
                      Generate and manage room verification QR codes.
                    </p>

                    <div className="room-facilities">
                      <span>Generate</span>
                      <span>View</span>
                      <span>Print</span>
                    </div>

                  <button
    className="view-room-button"
    onClick={() => handleNavigation("QR Codes")}
  >
    Manage QR Codes
  </button>

                  </div>  


                  <div className="room-card">

                    <div className="room-card-top">
                      <div className="room-number">
                        Maintenance
                      </div>

                      <span className="status-badge maintenance">
                        Caution
                      </span>
                    </div>

                    <p className="building-name">
                      Monitor rooms that require maintenance.
                    </p>

                    <div className="room-facilities">
                      <span>Issues</span>
                      <span>Rooms</span>
                      <span>Status</span>
                    </div>

                    <button
    type="button"
    className="view-room-button"
    onClick={() => handleNavigation("Maintenance")}
  >
    View Maintenance
  </button>

                  </div>

                </div>

              </section>
            </>
          )}


          {/* =====================================================
      CAMPUS & BUILDINGS
  ===================================================== */}

  {activePage === "Campus & Buildings" && (
    <section className="search-section">

      {!showAddBuilding ? (

        <>

          {/* PAGE HEADER */}

          <div className="section-heading">

            <div>
              <p
                style={{
                  margin: "0 0 6px",
                  color: "#6366f1",
                  fontSize: "10px",
                  fontWeight: "700",
                  letterSpacing: "1.2px"
                }}
              >
                CAMPUS MANAGEMENT
              </p>

              <h2>Campus & Buildings</h2>

              <p>
                Manage campus locations and buildings used by Space IQ.
              </p>
            </div>

            <button
              className="view-room-button"
              onClick={() => {
                setEditingBuildingId(null);

                setBuildingForm({
                  campus: "",
                  name: "",
                  location: ""
                });

                setShowAddBuilding(true);
              }}
            >
              + Add Building
            </button>

          </div>


          {/* SUMMARY */}

          <div className="maintenance-summary-grid">

            <div className="maintenance-summary-card">

              <div className="maintenance-summary-icon">
                ▦
              </div>

              <div>
                <span>Total Buildings</span>
                <strong>{buildings.length}</strong>
              </div>

            </div>


            <div className="maintenance-summary-card">

              <div className="maintenance-summary-icon available">
                ◉
              </div>

              <div>
                <span>Campuses</span>

                <strong>
                  {
                    [...new Set(
                      buildings.map(
                        (building) => building.campus
                      )
                    )].length
                  }
                </strong>
              </div>

            </div>


            <div className="maintenance-summary-card">

              <div className="maintenance-summary-icon occupied">
                ▣
              </div>

              <div>
                <span>Total Rooms</span>

                <strong>
                  {
                    buildings.reduce(
                      (total, building) =>
                        total + building.roomCount,
                      0
                    )
                  }
                </strong>
              </div>

            </div>

          </div>


          {/* BUILDINGS */}

          {loadingBuildings ? (

            <div className="no-results">

              <div className="no-results-icon">
                ▦
              </div>

              <h3>Loading Buildings</h3>

              <p>
                Please wait while campus and building information is loaded.
              </p>

            </div>

          ) : buildings.length === 0 ? (

            <div className="no-results">

              <div className="no-results-icon">
                ▦
              </div>

              <h3>No Buildings Added Yet</h3>

              <p>
                Add your first building to start organizing Space IQ rooms.
              </p>

              <button
                className="view-room-button"
                onClick={() => {
                  setEditingBuildingId(null);

                  setBuildingForm({
                    campus: "",
                    name: "",
                    location: ""
                  });

                  setShowAddBuilding(true);
                }}
              >
                + Add First Building
              </button>

            </div>

          ) : (

            <div className="room-grid">

              {buildings.map((building) => (

                <div
                  className="room-card"
                  key={building._id}
                >

                  {/* HEADER */}

                  <div className="room-card-top">

                    <div>

                      <div className="room-number">
                        {building.name}
                      </div>

                      <p
                        className="building-name"
                        style={{ marginBottom: "0" }}
                      >
                        {building.campus}
                      </p>

                    </div>

                    <span className="status-badge available">
                      Building
                    </span>

                  </div>


                  {/* LOCATION */}

                  <div
                    style={{
                      marginTop: "18px"
                    }}
                  >

                    <small
                      style={{
                        display: "block",
                        color: "#9ca3af",
                        fontSize: "10px",
                        marginBottom: "5px"
                      }}
                    >
                      Location
                    </small>

                    <strong
                      style={{
                        color: "#374151",
                        fontSize: "12px"
                      }}
                    >
                      {building.location || "Location not specified"}
                    </strong>

                  </div>


                  {/* ROOM COUNT */}

                  <div
                    style={{
                      marginTop: "18px",
                      padding: "12px",
                      background: "#f8fafc",
                      borderRadius: "10px"
                    }}
                  >

                    <small
                      style={{
                        display: "block",
                        color: "#9ca3af",
                        fontSize: "10px",
                        marginBottom: "4px"
                      }}
                    >
                      Rooms Assigned
                    </small>

                    <strong
                      style={{
                        color: "#111827",
                        fontSize: "18px"
                      }}
                    >
                      {building.roomCount}
                    </strong>

                  </div>


                  {/* ACTIONS */}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "18px"
                    }}
                  >

                    <button
                      className="edit-button"
                      style={{
                        flex: 1
                      }}
                      onClick={() => {
                        setEditingBuildingId(building._id);

                        setBuildingForm({
                          campus: building.campus,
                          name: building.name,
                          location: building.location || ""
                        });

                        setShowAddBuilding(true);
                      }}
                    >
                      Edit
                    </button>


                    <button
                      className="view-room-button"
                      style={{
                        flex: 1
                      }}
                      onClick={async () => {

                        const confirmDelete = window.confirm(
                          building.roomCount > 0
                            ? `This building has ${building.roomCount} room(s) assigned to it. Remove those room assignments before deleting the building.`
                            : `Are you sure you want to delete ${building.name}?`
                        );

                        if (!confirmDelete) {
                          return;
                        }

                        try {

                          const response = await fetch(
                            `http://localhost:5000/api/buildings/${building._id}`,
                            {
                              method: "DELETE",
                              headers: {
                                Authorization: `Bearer ${token}`
                              }
                            }
                          );

                          const data = await response.json();

                          if (!response.ok) {
                            alert(data.message);
                            return;
                          }

                          setBuildings((previous) =>
                            previous.filter(
                              (item) =>
                                item._id !== building._id
                            )
                          );

                          alert(data.message);

                        } catch (error) {

                          console.error(
                            "Delete building error:",
                            error
                          );

                          alert(
                            "Unable to delete building."
                          );
                        }

                      }}
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </>

      ) : (

        /* =================================================
          ADD / EDIT BUILDING
        ================================================= */

        <div>

          <div className="section-heading">

            <div>

              <h2>
                {editingBuildingId
                  ? "Edit Building"
                  : "Add New Building"}
              </h2>

              <p>
                {editingBuildingId
                  ? "Update the campus and building information below."
                  : "Enter the campus and building information below."}
              </p>

            </div>

          </div>


          <form
            onSubmit={async (event) => {

              event.preventDefault();

              if (
                !buildingForm.campus ||
                !buildingForm.name
              ) {
                alert(
                  "Please enter Campus and Building Name."
                );

                return;
              }

              try {

                const isEditing =
                  editingBuildingId !== null;

                const url = isEditing
                  ? `http://localhost:5000/api/buildings/${editingBuildingId}`
                  : "http://localhost:5000/api/buildings";

                const response = await fetch(url, {

                  method: isEditing
                    ? "PUT"
                    : "POST",

                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                  },

                  body: JSON.stringify({
                    campus: buildingForm.campus,
                    name: buildingForm.name,
                    location: buildingForm.location
                  })

                });

                const data = await response.json();

                if (!response.ok) {
                  alert(data.message);
                  return;
                }


                if (isEditing) {

                  setBuildings((previous) =>
                    previous.map((building) =>
                      building._id === editingBuildingId
                        ? {
                            ...data.building,
                            roomCount:
                              building.roomCount
                          }
                        : building
                    )
                  );

                } else {

                  setBuildings((previous) => [
                    ...previous,
                    {
                      ...data.building,
                      roomCount: 0
                    }
                  ]);

                }


                setBuildingForm({
                  campus: "",
                  name: "",
                  location: ""
                });

                setEditingBuildingId(null);
                setShowAddBuilding(false);

                alert(data.message);

              } catch (error) {

                console.error(
                  "Save building error:",
                  error
                );

                alert(
                  "Unable to connect to the server."
                );

              }

            }}
          >

            <div className="filters-grid">

              {/* CAMPUS */}

              <div className="filter-field">

                <label>Campus Name *</label>

                <input
                  type="text"
                  placeholder="e.g. Main Campus"
                  value={buildingForm.campus}
                  onChange={(event) =>
                    setBuildingForm({
                      ...buildingForm,
                      campus: event.target.value
                    })
                  }
                />

              </div>


              {/* BUILDING */}

              <div className="filter-field">

                <label>Building Name *</label>

                <input
                  type="text"
                  placeholder="e.g. Main Building"
                  value={buildingForm.name}
                  onChange={(event) =>
                    setBuildingForm({
                      ...buildingForm,
                      name: event.target.value
                    })
                  }
                />

              </div>


              {/* LOCATION */}

              <div className="filter-field">

                <label>Location</label>

                <input
                  type="text"
                  placeholder="e.g. East Wing / Andheri"
                  value={buildingForm.location}
                  onChange={(event) =>
                    setBuildingForm({
                      ...buildingForm,
                      location: event.target.value
                    })
                  }
                />

              </div>

            </div>


            {/* ACTIONS */}

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "25px"
              }}
            >

              <button
                type="submit"
                className="view-room-button"
              >
                {editingBuildingId
                  ? "Update Building"
                  : "Save Building"}
              </button>


              <button
                type="button"
                className="view-room-button"
                onClick={() => {

                  setBuildingForm({
                    campus: "",
                    name: "",
                    location: ""
                  });

                  setEditingBuildingId(null);
                  setShowAddBuilding(false);

                }}
              >
                Cancel
              </button>

            </div>

          </form>

        </div>

      )}

    </section>
  )}
          {activePage === "Students" && (
    <section className="search-section user-management-section">

      <div className="user-page-header">
        <div>
          <p className="user-page-label">USER MANAGEMENT</p>
          <h2>Students</h2>
          <p className="user-page-description">
            Manage and view all registered student accounts in Space IQ.
          </p>
        </div>

        <div className="user-total-card">
          <div className="user-total-icon">♙</div>
          <div>
            <span>Total Students</span>
            <strong>{students.length}</strong>
          </div>
        </div>
      </div>

      {loadingUsers ? (
        <div className="user-empty-state">
          <div className="user-empty-icon">♙</div>
          <h3>Loading Students</h3>
          <p>Please wait while student records are being loaded.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="user-empty-state">
          <div className="user-empty-icon">♙</div>
          <h3>No Students Found</h3>
          <p>Registered student accounts will appear here.</p>
        </div>
      ) : (
        <div className="user-grid">
          {students.map((student) => (
            <div className="user-card" key={student._id}>

              <div className="user-card-top">
                <div className="user-avatar">
                  {student.fullName?.charAt(0).toUpperCase()}
                </div>

                <div className="user-name-section">
                  <h3>{student.fullName}</h3>
                  <span className="user-role-badge student">
                    Student
                  </span>
                </div>
              </div>

              <div className="user-info-list">

                <div className="user-info-row">
                  <div className="user-info-icon">ID</div>
                  <div>
                    <small>Student ID</small>
                    <strong>{student.userId}</strong>
                  </div>
                </div>

                <div className="user-info-row">
                  <div className="user-info-icon">@</div>
                  <div>
                    <small>Email Address</small>
                    <strong>{student.email}</strong>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </section>
  )}

  {activePage === "Faculty" && (
    <section className="search-section user-management-section">

      <div className="user-page-header">
        <div>
          <p className="user-page-label">USER MANAGEMENT</p>
          <h2>Faculty</h2>
          <p className="user-page-description">
            Manage and view all registered faculty accounts in Space IQ.
          </p>
        </div>

        <div className="user-total-card">
          <div className="user-total-icon">♟</div>
          <div>
            <span>Total Faculty</span>
            <strong>{faculty.length}</strong>
          </div>
        </div>
      </div>

      {loadingUsers ? (
        <div className="user-empty-state">
          <div className="user-empty-icon">♟</div>
          <h3>Loading Faculty</h3>
          <p>Please wait while faculty records are being loaded.</p>
        </div>
      ) : faculty.length === 0 ? (
        <div className="user-empty-state">
          <div className="user-empty-icon">♟</div>
          <h3>No Faculty Found</h3>
          <p>Registered faculty accounts will appear here.</p>
        </div>
      ) : (
        <div className="user-grid">
          {faculty.map((member) => (
            <div className="user-card" key={member._id}>

              <div className="user-card-top">
                <div className="user-avatar">
                  {member.fullName?.charAt(0).toUpperCase()}
                </div>

                <div className="user-name-section">
                  <h3>{member.fullName}</h3>
                  <span className="user-role-badge faculty">
                    Faculty
                  </span>
                </div>
              </div>

              <div className="user-info-list">

                <div className="user-info-row">
                  <div className="user-info-icon">ID</div>
                  <div>
                    <small>Faculty ID</small>
                    <strong>{member.userId}</strong>
                  </div>
                </div>

                <div className="user-info-row">
                  <div className="user-info-icon">@</div>
                  <div>
                    <small>Email Address</small>
                    <strong>{member.email}</strong>
                  </div>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}

    </section>
  )}


          {/* =====================================================
              ROOM MANAGEMENT
          ===================================================== */}

          {activePage === "Room Management" && (
            <section className="search-section">

              {!showAddRoom ? (
                <>
                  <div className="section-heading">

                    <div>
                      <h2>Room Management</h2>

                      <p>
                        Add, view and manage classrooms and their facilities.
                      </p>
                    </div>

                    <button
                      className="view-room-button"
                      onClick={() => {
                        setEditingRoomId(null);
                        setRoomForm({
                          roomNumber: "",
                          building: "",
                          capacity: "",
                          facilities: [],
                          status: "Available"
                        });
                        setShowAddRoom(true);
                      }}
                    >
                      + Add New Room
                    </button>

                  </div>


                  {rooms.length === 0 ? (

                    <div className="no-results">

                      <div className="no-results-icon">
                        ▣
                      </div>

                      <h3>No rooms added yet</h3>

                      <p>
                        Add your first room to start managing spaces in Space IQ.
                      </p>

                      <button
                        className="view-room-button"
                        onClick={() => {
                          setEditingRoomId(null);
                          setRoomForm({
                            roomNumber: "",
                            building: "",
                            capacity: "",
                            facilities: [],
                            status: "Available"
                          });
                          setShowAddRoom(true);
                        }}
                      >
                        + Add First Room
                      </button>

                    </div>

                  ) : (

                    <div className="room-grid">

                      {rooms.map((room) => (

                        <div
                          className="room-card"
                          key={room.id}
                        >

                          <div className="room-card-top">

                            <div className="room-number">
                              Room {room.roomNumber}
                            </div>

                            <span
                              className={`status-badge ${room.status.toLowerCase()}`}
                            >
                              {room.status}
                            </span>

                          </div>

                          <p className="building-name">
                            {room.building}
                          </p>

                          <div className="room-details">

                            <div className="room-detail">

                              <span>👥</span>

                              <div>
                                <small>Capacity</small>

                                <strong>
                                  {room.capacity} people
                                </strong>
                              </div>

                            </div>

                          </div>


                          <div className="room-facilities">

                            {room.facilities.map((facility) => (
                              <span key={facility}>
                                {facility}
                              </span>
                            ))}

                          </div>


                          <div
                            style={{
                              display: "flex",
                              gap: "10px",
                              marginTop: "15px",
                            }}
                          >

                            <button
                              className="edit-button"
                              onClick={() => handleEditRoom(room)}
                            >
                              Edit
                            </button>

                            <button
                              className="view-room-button"
                              onClick={() =>
                                handleDeleteRoom(room.id)
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </div>

                      ))}

                    </div>

                  )}

                </>

              ) : (

                <div>

                  <div className="section-heading">

                    <div>
                      <h2>
                        {editingRoomId
                          ? "Edit Room"
                          : "Add New Room"}
                      </h2>

                      <p>
                        {editingRoomId
                          ? "Update the room information below."
                          : "Enter the room information below."}
                      </p>
                    </div>

                  </div>


                  <form onSubmit={handleAddRoom}>

                    <div className="filters-grid">

                      <div className="filter-field">

                        <label>Room Number / Name</label>

                        <input
                          type="text"
                          name="roomNumber"
                          placeholder="e.g. 101"
                          value={roomForm.roomNumber}
                          onChange={handleFormChange}
                        />

                      </div>


                      <div className="filter-field">

                        <label>Building</label>

                        <input
                          type="text"
                          name="building"
                          placeholder="e.g. Main Building"
                          value={roomForm.building}
                          onChange={handleFormChange}
                        />

                      </div>


                      <div className="filter-field">

                        <label>Capacity</label>

                        <input
                          type="number"
                          name="capacity"
                          min="1"
                          placeholder="e.g. 40"
                          value={roomForm.capacity}
                          onChange={handleFormChange}
                        />

                      </div>


                      <div className="filter-field">

                        <label>Status</label>

                        <select
                          name="status"
                          value={roomForm.status}
                          onChange={handleFormChange}
                        >
                          <option value="Available">
                            Available
                          </option>

                          <option value="Occupied">
                            Occupied
                          </option>

                          <option value="Maintenance">
                            Maintenance
                          </option>
                        </select>

                      </div>

                      {roomForm.status === "Maintenance" && (
    <div className="filter-field maintenance-note-field">
      <label>Reason for Maintenance *</label>

      <textarea
        value={roomForm.maintenanceNote}
        onChange={(e) =>
          setRoomForm({
            ...roomForm,
            maintenanceNote: e.target.value
          })
        }
        placeholder="Enter the reason for maintenance..."
        rows="3"
        required
      />
    </div>
  )}
  </div>

                    <div className="facilities-section">

                      <span className="facility-title">
                        Room Facilities
                      </span>


                      <label className="facility-option">

                        <input
                          type="checkbox"
                          checked={roomForm.facilities.includes("AC")}
                          onChange={() =>
                            handleFacilityChange("AC")
                          }
                        />

                        <span>AC</span>

                      </label>


                      <label className="facility-option">

                        <input
                          type="checkbox"
                          checked={roomForm.facilities.includes("Projector")}
                          onChange={() =>
                            handleFacilityChange("Projector")
                          }
                        />

                        <span>Projector</span>

                      </label>


                      <label className="facility-option">

                        <input
                          type="checkbox"
                          checked={roomForm.facilities.includes("Computers")}
                          onChange={() =>
                            handleFacilityChange("Computers")
                          }
                        />

                        <span>Computers</span>

                      </label>

                    </div>


                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        marginTop: "25px",
                      }}
                    >

                      <button
                        type="submit"
                        className="view-room-button"
                      >
                        {editingRoomId
                          ? "Update Room"
                          : "Save Room"}
                      </button>


                      <button
                        type="button"
                        className="view-room-button"
                        onClick={handleCancelRoomForm}
                      >
                        Cancel
                      </button>

                    </div>

                  </form>

                </div>

              )}

            </section>
          )}


          {/* =====================================================
              BOOKING MANAGEMENT
          ===================================================== */}

          {activePage === "Booking Management" && (
            <section className="search-section">

              <div className="section-heading">

                <div>
                  <h2>Booking Management</h2>

                  <p>
                    Review student and faculty room bookings and manage approval requests.
                  </p>
                </div>

                <button
  type="button"
  className="view-room-button no-print"
  onClick={() => {
    fetchBookings();
    fetchBuildings();
  }}
>
  ↻ Refresh
</button>

              </div>


              {loadingBookings ? (

                <div className="no-results">

                  <div className="no-results-icon">
                    ◷
                  </div>

                  <h3>Loading bookings...</h3>

                  <p>
                    Please wait while we load booking information.
                  </p>

                </div>

              ) : bookings.length === 0 ? (

                <div className="no-results">

                  <div className="no-results-icon">
                    ◷
                  </div>

                  <h3>No bookings found</h3>

                  <p>
                    Booking requests will appear here when users make reservations.
                  </p>

                </div>

              ) : (

                <div
                  style={{
                    display: "grid",
                    gap: "18px"
                  }}
                >

                  {bookings.map((booking) => (

                    <div
                      className="room-card"
                      key={booking._id}
                      style={{
                        width: "100%",
                        boxSizing: "border-box"
                      }}
                    >

                      {/* BOOKING HEADER */}

                      <div className="room-card-top">

                        <div>
                          <div className="room-number">
                            Room {booking.room?.roomNumber || "Unknown"}
                          </div>

                          <p
                            className="building-name"
                            style={{ marginBottom: "0" }}
                          >
                            {booking.room?.building || "Unknown Building"}
                          </p>
                        </div>


                        <span
                          className={`status-badge ${
                            booking.status === "Approved"
                              ? "available"
                              : booking.status === "Rejected"
                              ? "occupied"
                              : booking.status === "Cancelled"
                              ? "occupied"
                              : booking.status === "Completed"
                              ? "available"
                              : "maintenance"
                          }`}
                        >
                          {booking.status}
                        </span>

                      </div>


                      {/* BOOKING INFORMATION */}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "18px",
                          marginTop: "20px"
                        }}
                      >

                        <div>
                          <small
                            style={{
                              display: "block",
                              marginBottom: "5px",
                              color: "#6b7280"
                            }}
                          >
                            Requested By
                          </small>

                          <strong>
                            {booking.user?.fullName || "Unknown User"}
                          </strong>

                          <div
                            style={{
                              fontSize: "13px",
                              color: "#6b7280",
                              marginTop: "3px"
                            }}
                          >
                            {booking.user?.role || "User"} ·{" "}
                            {booking.user?.userId || "No ID"}
                          </div>
                        </div>


                        <div>
                          <small
                            style={{
                              display: "block",
                              marginBottom: "5px",
                              color: "#6b7280"
                            }}
                          >
                            Date
                          </small>

                          <strong>
                            {booking.date}
                          </strong>
                        </div>


                        <div>
                          <small
                            style={{
                              display: "block",
                              marginBottom: "5px",
                              color: "#6b7280"
                            }}
                          >
                            Time
                          </small>

                          <strong>
                            {booking.startTime} - {booking.endTime}
                          </strong>
                        </div>


                        <div>
                          <small
                            style={{
                              display: "block",
                              marginBottom: "5px",
                              color: "#6b7280"
                            }}
                          >
                            Purpose
                          </small>

                          <strong>
                            {booking.purpose}
                          </strong>
                        </div>

                      </div>


                      {/* EMAIL */}

                      {booking.user?.email && (
                        <div
                          style={{
                            marginTop: "18px",
                            fontSize: "14px",
                            color: "#6b7280"
                          }}
                        >
                          Email: {booking.user.email}
                        </div>
                      )}


                      {/* ACTIONS */}

                      {booking.status === "Pending" && (
                        <div
                          style={{
                            display: "flex",
                            gap: "10px",
                            marginTop: "20px",
                            paddingTop: "18px",
                            borderTop: "1px solid #e5e7eb"
                          }}
                        >

                          <button
                            className="view-room-button"
                            disabled={updatingBookingId === booking._id}
                            onClick={() =>
                              handleBookingStatusUpdate(
                                booking._id,
                                "Approved"
                              )
                            }
                            style={{
                              opacity:
                                updatingBookingId === booking._id
                                  ? 0.6
                                  : 1,
                              cursor:
                                updatingBookingId === booking._id
                                  ? "not-allowed"
                                  : "pointer"
                            }}
                          >
                            {updatingBookingId === booking._id
                              ? "Updating..."
                              : "✓ Approve"}
                          </button>


                          <button
                            className="view-room-button"
                            disabled={updatingBookingId === booking._id}
                            onClick={() =>
                              handleBookingStatusUpdate(
                                booking._id,
                                "Rejected"
                              )
                            }
                            style={{
                              opacity:
                                updatingBookingId === booking._id
                                  ? 0.6
                                  : 1,
                              cursor:
                                updatingBookingId === booking._id
                                  ? "not-allowed"
                                  : "pointer"
                            }}
                          >
                            {updatingBookingId === booking._id
                              ? "Updating..."
                              : "✕ Reject"}
                          </button>

                        </div>
                      )}

                      {booking.status === "Approved" && (
  <div
    style={{
      display: "flex",
      gap: "10px",
      marginTop: "20px",
      paddingTop: "18px",
      borderTop: "1px solid #e5e7eb"
    }}
  >

    <button
      className="view-room-button"
      disabled={updatingBookingId === booking._id}
      onClick={() =>
        handleBookingStatusUpdate(
          booking._id,
          "Cancelled"
        )
      }
      style={{
        opacity:
          updatingBookingId === booking._id
            ? 0.6
            : 1,
        cursor:
          updatingBookingId === booking._id
            ? "not-allowed"
            : "pointer"
      }}
    >
      {updatingBookingId === booking._id
        ? "Updating..."
        : "✕ Cancel"}
    </button>


    {booking.checkedIn && (
      <button
        className="view-room-button"
        disabled={updatingBookingId === booking._id}
        onClick={() =>
          handleBookingStatusUpdate(
            booking._id,
            "Completed"
          )
        }
        style={{
          opacity:
            updatingBookingId === booking._id
              ? 0.6
              : 1,
          cursor:
            updatingBookingId === booking._id
              ? "not-allowed"
              : "pointer"
        }}
      >
        {updatingBookingId === booking._id
          ? "Updating..."
          : "✓ Complete"}
      </button>
    )}

  </div>
)}

                    </div>

                  ))}

                </div>

              )}


            </section>
          )}

          {activePage === "Maintenance" && (
    <section className="search-section maintenance-management-section">

      {/* Page Header */}
      <div className="maintenance-page-header">
        <div>
          <p className="maintenance-page-label">ROOM MANAGEMENT</p>

          <h2>Maintenance Management</h2>

          <p className="maintenance-page-description">
            Monitor rooms that require attention and manage their availability.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="maintenance-summary-grid">

        <div className="maintenance-summary-card">
          <div className="maintenance-summary-icon">▣</div>

          <div>
            <span>Total Rooms</span>
            <strong>{rooms.length}</strong>
          </div>
        </div>

        <div className="maintenance-summary-card">
          <div className="maintenance-summary-icon available">
            ✓
          </div>

          <div>
            <span>Available</span>
            <strong>
              {
                rooms.filter(
                  (room) => room.status === "Available"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="maintenance-summary-card">
          <div className="maintenance-summary-icon occupied">
            ●
          </div>

          <div>
            <span>Occupied</span>
            <strong>
              {
                rooms.filter(
                  (room) => room.status === "Occupied"
                ).length
              }
            </strong>
          </div>
        </div>

        <div className="maintenance-summary-card">
          <div className="maintenance-summary-icon caution">
            !
          </div>

          <div>
            <span>Caution</span>
            <strong>{maintenanceRooms.length}</strong>
          </div>
        </div>

      </div>

      {/* Maintenance Rooms */}
      <div className="maintenance-section-heading">
        <div>
          <h3>Rooms Under Maintenance</h3>

          <p>
            Rooms currently unavailable due to maintenance requirements.
          </p>
        </div>

        <span className="maintenance-count-badge">
          {maintenanceRooms.length} Room
          {maintenanceRooms.length !== 1 ? "s" : ""}
        </span>
      </div>

      {maintenanceRooms.length === 0 ? (

        <div className="maintenance-empty-state">

          <div className="maintenance-empty-icon">
            ✓
          </div>

          <h3>No Rooms Under Maintenance</h3>

          <p>
            All rooms are currently available or occupied.
          </p>

        </div>

      ) : (

        <div className="maintenance-room-grid">

          {maintenanceRooms.map((room) => (

            <div
              className="maintenance-room-card"
              key={room._id}
            >

              {/* Card Header */}
              <div className="maintenance-room-header">

                <div>
                  <span className="maintenance-room-label">
                    ROOM
                  </span>

                  <h3>{room.roomNumber}</h3>

                  <p>{room.building}</p>
                </div>

                <span className="maintenance-caution-badge">
                  Caution
                </span>

              </div>

              {/* Room Details */}
              <div className="maintenance-room-details">

                <div className="maintenance-detail-item">
                  <span>Capacity</span>
                  <strong>
                    {room.capacity} persons
                  </strong>
                </div>

                <div className="maintenance-detail-item">
                  <span>Facilities</span>

                  <strong>
                    {room.facilities &&
                    room.facilities.length > 0
                      ? room.facilities.join(", ")
                      : "No facilities listed"}
                  </strong>
                </div>

              </div>

              {/* Maintenance Reason */}
              <div className="maintenance-reason-box">

                <span>Reason for Maintenance</span>

                <p>
                  {room.maintenanceNote ||
                    "Maintenance required."}
                </p>

              </div>

              {/* Reported Date */}
              <div className="maintenance-reported-row">

                <span>Reported</span>

                <strong>
                  {room.maintenanceReportedAt
    ? new Date(
        room.maintenanceReportedAt
      ).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "—"}
                </strong>

              </div>

              {/* Action */}
            <button
    className="maintenance-available-button"
    onClick={async () => {
      try {
        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");

        const response = await fetch(
          `http://localhost:5000/api/rooms/${room._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
              roomNumber: room.roomNumber,
              building: room.building,
              capacity: room.capacity,
              facilities: room.facilities || [],
              status: "Available",
              maintenanceNote: ""
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          alert(data.message || "Unable to mark room as available.");
          return;
        }

        setRooms((prevRooms) =>
          prevRooms.map((r) =>
            r._id === room._id
              ? {
                  ...r,
                  status: "Available",
                  maintenanceNote: "",
                  maintenanceReportedAt: null
                }
              : r
          )
        );

        alert("Room marked as available successfully!");

      } catch (error) {
        console.error("Mark as available error:", error);
        alert("Unable to update the room.");
      }
    }}
  >
    Mark as Available
  </button>
            </div>

          ))}

        </div>

      )}

    </section>
  )}

 {activePage === "Reports" && (
  <section className="search-section reports-page print-report-section">
      {/* =====================================================
          REPORT HEADER
      ===================================================== */}

      <div className="section-heading">

        <div>
          <p
            style={{
              margin: "0 0 6px",
              fontSize: "12px",
              fontWeight: "700",
              letterSpacing: "1.5px",
              color: "#777"
            }}
          >
            ANALYTICS & REPORTS
          </p>

          <h2>SpaceIQ Reports</h2>

          <p>
            Generate booking and resource usage reports for a selected period.
          </p>
        </div>

        <button
          type="button"
          className="view-room-button no-print"
          onClick={() => {
            fetchBookings();
            fetchBuildings();
          }}
        >
          ↻ Refresh
        </button>

      </div>


      {/* =====================================================
          REPORT PERIOD
      ===================================================== */}

      <div
       className="no-print"
        style={{
          marginTop: "25px",
          padding: "22px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px"
        }}
      >

        <div style={{ marginBottom: "18px" }}>

          <h3 style={{ margin: "0 0 6px" }}>
            Report Period
          </h3>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "13px"
            }}
          >
            Select the period for which you want to generate the report.
          </p>

        </div>


        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "14px",
            alignItems: "end"
          }}
        >

          <div className="filter-field">

            <label>Period</label>

            <select
              value={reportPeriod}
              onChange={(event) =>
                setReportPeriod(event.target.value)
              }
            >

              <option value="today">
                Today
              </option>

              <option value="yesterday">
                Yesterday
              </option>

              <option value="last7">
                Last 7 Days
              </option>

              <option value="thisMonth">
                This Month
              </option>

              <option value="custom">
                Custom Date Range
              </option>

            </select>

          </div>


          {reportPeriod === "custom" && (
            <>

              <div className="filter-field">

                <label>From Date</label>

                <input
                  type="date"
                  value={reportFromDate}
                  onChange={(event) =>
                    setReportFromDate(event.target.value)
                  }
                />

              </div>


              <div className="filter-field">

                <label>To Date</label>

                <input
                  type="date"
                  value={reportToDate}
                  onChange={(event) =>
                    setReportToDate(event.target.value)
                  }
                />

              </div>

            </>
          )}


          <button
            type="button"
            className="view-room-button"
            onClick={generateReport}
            style={{
              height: "42px"
            }}
          >
            Generate Report
          </button>

        </div>

      </div>


      {/* =====================================================
          REPORT RESULTS
      ===================================================== */}

      {reportStartDate && reportEndDate ? (

        (() => {

          const filteredBookings = bookings.filter(
            (booking) =>
              booking.date >= reportStartDate &&
              booking.date <= reportEndDate
          );

          const reportTotalBookings =
            filteredBookings.length;

          const reportPendingBookings =
            filteredBookings.filter(
              (booking) => booking.status === "Pending"
            ).length;

          const reportApprovedBookings =
            filteredBookings.filter(
              (booking) => booking.status === "Approved"
            ).length;

          const reportRejectedBookings =
            filteredBookings.filter(
              (booking) => booking.status === "Rejected"
            ).length;

          const reportCancelledBookings =
            filteredBookings.filter(
              (booking) => booking.status === "Cancelled"
            ).length;

          const reportCompletedBookings =
            filteredBookings.filter(
              (booking) => booking.status === "Completed"
            ).length;

          const reportStudentBookings =
            filteredBookings.filter(
              (booking) =>
                booking.user?.role === "Student"
            ).length;

          const reportFacultyBookings =
            filteredBookings.filter(
              (booking) =>
                booking.user?.role === "Faculty"
            ).length;

          const roomUsage = rooms.map((room) => ({
            ...room,
            bookingCount: filteredBookings.filter(
              (booking) =>
                booking.room?._id === room.id ||
                booking.room?._id === room._id ||
                booking.room === room.id ||
                booking.room === room._id
            ).length
          }));

          const statusData = [
            {
              label: "Approved",
              value: reportApprovedBookings
            },
            {
              label: "Pending",
              value: reportPendingBookings
            },
            {
              label: "Completed",
              value: reportCompletedBookings
            },
            {
              label: "Cancelled",
              value: reportCancelledBookings
            },
            {
              label: "Rejected",
              value: reportRejectedBookings
            }
          ];

          return (
            <>

<div className="report-print-area">

              {/* REPORT PERIOD LABEL */}

              <div
                style={{
                  marginTop: "28px",
                  padding: "16px 20px",
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px"
                }}
              >

                <span
                  style={{
                    fontSize: "12px",
                    color: "#6b7280"
                  }}
                >
                  REPORT PERIOD
                </span>

                <strong
                  style={{
                    display: "block",
                    marginTop: "4px",
                    fontSize: "18px",
                    color: "#111827"
                  }}
                >
                  {reportStartDate === reportEndDate
                    ? reportStartDate
                    : `${reportStartDate} → ${reportEndDate}`}
                </strong>

              </div>


              {/* =================================================
                  BOOKING OVERVIEW
              ================================================= */}

              <div style={{ marginTop: "32px" }}>

                <h3 style={{ marginBottom: "16px" }}>
                  Booking Overview
                </h3>

                <div className="maintenance-summary-grid">

                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon">
                      📅
                    </div>

                    <div>
                      <span>Total Bookings</span>
                      <strong>{reportTotalBookings}</strong>
                    </div>

                  </div>


                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon">
                      ⏳
                    </div>

                    <div>
                      <span>Pending</span>
                      <strong>{reportPendingBookings}</strong>
                    </div>

                  </div>


                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon">
                      ✓
                    </div>

                    <div>
                      <span>Approved</span>
                      <strong>{reportApprovedBookings}</strong>
                    </div>

                  </div>


                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon">
                      ✕
                    </div>

                    <div>
                      <span>Rejected</span>
                      <strong>{reportRejectedBookings}</strong>
                    </div>

                  </div>


                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon">
                      ↩
                    </div>

                    <div>
                      <span>Cancelled</span>
                      <strong>{reportCancelledBookings}</strong>
                    </div>

                  </div>


                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon">
                      ✓
                    </div>

                    <div>
                      <span>Completed</span>
                      <strong>{reportCompletedBookings}</strong>
                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  BOOKING STATUS
              ================================================= */}

              <div style={{ marginTop: "34px" }}>

                <h3 style={{ marginBottom: "16px" }}>
                  Booking Status
                </h3>

                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    padding: "24px"
                  }}
                >

                  {reportTotalBookings === 0 ? (

                    <p
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        textAlign: "center"
                      }}
                    >
                      No bookings were recorded during this period.
                    </p>

                  ) : (

                    statusData.map((item) => (

                      <div
                        key={item.label}
                        style={{
                          marginBottom: "18px"
                        }}
                      >

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "7px",
                            fontSize: "14px"
                          }}
                        >

                          <span>{item.label}</span>

                          <strong>
                            {item.value}
                          </strong>

                        </div>


                        <div
                          style={{
                            height: "9px",
                            background: "#eeeeee",
                            borderRadius: "20px",
                            overflow: "hidden"
                          }}
                        >

                          <div
                            style={{
                              width: `${getPercentage(
                                item.value,
                                reportTotalBookings
                              )}%`,
                              height: "100%",
                              background: "#222",
                              borderRadius: "20px"
                            }}
                          />

                        </div>

                      </div>

                    ))

                  )}

                </div>

              </div>


              {/* =================================================
                  USER BOOKING SUMMARY
              ================================================= */}

              <div style={{ marginTop: "34px" }}>

                <h3 style={{ marginBottom: "16px" }}>
                  User Booking Summary
                </h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px"
                  }}
                >

                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      padding: "22px",
                      background: "#ffffff"
                    }}
                  >

                    <p
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        fontSize: "14px"
                      }}
                    >
                      Student Bookings
                    </p>

                    <h2 style={{ margin: "8px 0" }}>
                      {reportStudentBookings}
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        fontSize: "13px"
                      }}
                    >
                      {getPercentage(
                        reportStudentBookings,
                        reportTotalBookings
                      )}
                      % of bookings
                    </p>

                  </div>


                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: "14px",
                      padding: "22px",
                      background: "#ffffff"
                    }}
                  >

                    <p
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        fontSize: "14px"
                      }}
                    >
                      Faculty Bookings
                    </p>

                    <h2 style={{ margin: "8px 0" }}>
                      {reportFacultyBookings}
                    </h2>

                    <p
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        fontSize: "13px"
                      }}
                    >
                      {getPercentage(
                        reportFacultyBookings,
                        reportTotalBookings
                      )}
                      % of bookings
                    </p>

                  </div>

                </div>

              </div>


              {/* =================================================
                  ROOM USAGE
              ================================================= */}

              <div style={{ marginTop: "34px" }}>

                <h3 style={{ marginBottom: "16px" }}>
                  Room Usage
                </h3>

                {rooms.length === 0 ? (

                  <div className="no-results">

                    <h3>No rooms available</h3>

                    <p>
                      Add rooms to view room usage.
                    </p>

                  </div>

                ) : (

                  <div className="room-grid">

                    {roomUsage.map((room) => (

                      <div
                        className="room-card"
                        key={room.id}
                      >

                        <div className="room-card-top">

                          <div>

                            <div className="room-number">
                              Room {room.roomNumber}
                            </div>

                            <p className="building-name">
                              {room.building}
                            </p>

                          </div>

                          <span className="status-badge available">
                            {room.bookingCount}{" "}
                            {room.bookingCount === 1
                              ? "Booking"
                              : "Bookings"}
                          </span>

                        </div>


                        <div
                          style={{
                            marginTop: "18px",
                            padding: "14px",
                            background: "#f8fafc",
                            borderRadius: "10px"
                          }}
                        >

                          <small
                            style={{
                              display: "block",
                              color: "#6b7280",
                              marginBottom: "5px"
                            }}
                          >
                            Bookings during selected period
                          </small>

                          <strong
                            style={{
                              fontSize: "24px"
                            }}
                          >
                            {room.bookingCount}
                          </strong>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>


              {/* =================================================
                  CURRENT ROOM OVERVIEW
              ================================================= */}

              <div style={{ marginTop: "34px" }}>

                <h3 style={{ marginBottom: "16px" }}>
                  Current Room Overview
                </h3>

                <div className="maintenance-summary-grid">

                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon">
                      ▣
                    </div>

                    <div>
                      <span>Total Rooms</span>
                      <strong>{rooms.length}</strong>
                    </div>

                  </div>


                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon available">
                      ✓
                    </div>

                    <div>
                      <span>Available</span>
                      <strong>
                        {availableRooms.length}
                      </strong>
                    </div>

                  </div>


                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon occupied">
                      ●
                    </div>

                    <div>
                      <span>Occupied</span>
                      <strong>
                        {occupiedRooms.length}
                      </strong>
                    </div>

                  </div>


                  <div className="maintenance-summary-card">

                    <div className="maintenance-summary-icon caution">
                      !
                    </div>

                    <div>
                      <span>Maintenance</span>
                      <strong>
                        {maintenanceRooms.length}
                      </strong>
                    </div>

                  </div>

                </div>

              </div>


              {/* =================================================
                  BUILDING SUMMARY
              ================================================= */}

              <div style={{ marginTop: "34px" }}>

                <h3 style={{ marginBottom: "16px" }}>
                  Building Summary
                </h3>

                {loadingBuildings ? (

                  <p>Loading building data...</p>

                ) : buildings.length === 0 ? (

                  <p style={{ color: "#777" }}>
                    No building data available.
                  </p>

                ) : (

                  <div className="room-grid">

                    {buildings.map((building) => (

                      <div
                        className="room-card"
                        key={building._id}
                      >

                        <div className="room-card-top">

                          <div>

                            <h3 className="room-number">
                              {building.name}
                            </h3>

                            <p className="building-name">
                              {building.campus}
                            </p>

                          </div>

                        </div>


                        <div className="room-facilities">

                          <span>
                            📍{" "}
                            {building.location ||
                              "Location not specified"}
                          </span>

                          <span>
                            🏫{" "}
                            {Number(building.roomCount) || 0} rooms
                          </span>

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>


              {/* =================================================
                  PRINT
              ================================================= */}

              <div
              className="no-print"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "30px"
                }}
              >

                <button
                  type="button"
                  className="view-room-button"
                  onClick={() => window.print()}
                >
                  🖨 Print Report
                </button>
</div>
              </div>

            </>
          );

        })()

      ) : (

        <div
          className="no-results"
          style={{
            marginTop: "28px"
          }}
        >

          <div className="no-results-icon">
            ▤
          </div>

          <h3>Select a Report Period</h3>

          <p>
            Choose Today, Yesterday, Last 7 Days, This Month,
            or a Custom Date Range, then click Generate Report.
          </p>

        </div>

      )}

    </section>
  )}

  {/* =====================================================
    MY PROFILE
===================================================== */}

{activePage === "My Profile" && (
  <section className="search-section">

    <div className="section-heading">

      <div>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#777"
          }}
        >
          ACCOUNT
        </p>

        <h2>My Profile</h2>

        <p>
          View your administrator account information.
        </p>
      </div>

    </div>


    <div
      style={{
        maxWidth: "760px",
        marginTop: "25px",
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "30px"
      }}
    >

      {/* PROFILE HEADER */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          paddingBottom: "25px",
          borderBottom: "1px solid #e5e7eb"
        }}
      >

       <div className="admin-large-avatar">
  {profilePicture ? (
    <img
      src={profilePicture}
      alt="Profile"
    />
  ) : (
    user?.fullName?.charAt(0)?.toUpperCase() || "A"
  )}
</div>

        <div>

          <h3
            style={{
              margin: "0 0 6px",
              fontSize: "22px",
              color: "#111827"
            }}
          >
            {user?.fullName || "Administrator"}
          </h3>

          <span
            style={{
              display: "inline-block",
              padding: "5px 10px",
              borderRadius: "20px",
              background: "#f3f4f6",
              color: "#374151",
              fontSize: "12px",
              fontWeight: "600"
            }}
          >
            Administrator
          </span>
          <div className="admin-photo-actions">

  <label
    htmlFor="admin-profile-picture-upload"
    className="admin-photo-button admin-photo-primary"
  >
    {uploadingProfilePicture
      ? "Uploading..."
      : profilePicture
      ? "Change Photo"
      : "Upload Photo"}
  </label>

  <input
    id="admin-profile-picture-upload"
    type="file"
    accept="image/png,image/jpeg,image/webp"
    onChange={handleProfilePictureChange}
    disabled={uploadingProfilePicture}
    hidden
  />

  {profilePicture && (
    <button
      type="button"
      className="admin-photo-button admin-photo-remove"
      onClick={handleRemoveProfilePicture}
      disabled={uploadingProfilePicture}
    >
      Remove Photo
    </button>
  )}

</div>

        </div>

      </div>


      {/* ACCOUNT DETAILS */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "22px",
          marginTop: "28px"
        }}
      >

        <div>

          <small
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: "11px",
              marginBottom: "6px"
            }}
          >
            FULL NAME
          </small>

          <strong
            style={{
              color: "#111827",
              fontSize: "15px"
            }}
          >
            {user?.fullName || "Not available"}
          </strong>

        </div>


        <div>

          <small
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: "11px",
              marginBottom: "6px"
            }}
          >
            EMAIL ADDRESS
          </small>

          <strong
            style={{
              color: "#111827",
              fontSize: "15px",
              wordBreak: "break-word"
            }}
          >
            {user?.email || "Not available"}
          </strong>

        </div>


        <div>

          <small
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: "11px",
              marginBottom: "6px"
            }}
          >
            USER ID
          </small>

          <strong
            style={{
              color: "#111827",
              fontSize: "15px"
            }}
          >
            {user?.userId || "Not available"}
          </strong>

        </div>


        <div>

          <small
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: "11px",
              marginBottom: "6px"
            }}
          >
            ROLE
          </small>

          <strong
            style={{
              color: "#111827",
              fontSize: "15px"
            }}
          >
            Administrator
          </strong>

        </div>


        <div>

          <small
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: "11px",
              marginBottom: "6px"
            }}
          >
            ACCOUNT STATUS
          </small>

          <strong
            style={{
              color: "#166534",
              fontSize: "15px"
            }}
          >
            ● Active
          </strong>

        </div>

      </div>


      {/* ACCOUNT DESCRIPTION */}

      <div
        style={{
          marginTop: "30px",
          padding: "16px",
          background: "#f8fafc",
          borderRadius: "10px",
          border: "1px solid #eef2f7"
        }}
      >

        <strong
          style={{
            display: "block",
            fontSize: "13px",
            color: "#374151",
            marginBottom: "5px"
          }}
        >
          Administrator Account
        </strong>

        <p
          style={{
            margin: 0,
            fontSize: "13px",
            color: "#6b7280",
            lineHeight: "1.6"
          }}
        >
          This account is used to manage Space IQ campuses,
          rooms, bookings, users, QR codes and maintenance.
        </p>

      </div>

    </div>

  </section>
)}

{/* =====================================================
    SETTINGS
===================================================== */}

{activePage === "Settings" && (
  <section className="search-section">

    <div className="section-heading">

      <div>

        <p
          style={{
            margin: "0 0 6px",
            fontSize: "12px",
            fontWeight: "700",
            letterSpacing: "1.5px",
            color: "#777"
          }}
        >
          SYSTEM CONFIGURATION
        </p>

        <h2>Settings</h2>

        <p>
          View Space IQ system information and booking policies.
        </p>

      </div>

    </div>


    {/* SYSTEM INFORMATION */}

    <div style={{ marginTop: "25px" }}>

      <h3 style={{ marginBottom: "16px" }}>
        System Information
      </h3>


      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px"
        }}
      >

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "22px"
          }}
        >

          <small
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: "11px",
              marginBottom: "7px"
            }}
          >
            APPLICATION
          </small>

          <strong
            style={{
              fontSize: "17px",
              color: "#111827"
            }}
          >
            Space IQ
          </strong>

        </div>


        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "22px"
          }}
        >

          <small
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: "11px",
              marginBottom: "7px"
            }}
          >
            VERSION
          </small>

          <strong
            style={{
              fontSize: "17px",
              color: "#111827"
            }}
          >
            1.0
          </strong>

        </div>


        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "22px"
          }}
        >

          <small
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: "11px",
              marginBottom: "7px"
            }}
          >
            PLATFORM
          </small>

          <strong
            style={{
              fontSize: "17px",
              color: "#111827"
            }}
          >
            Web Application
          </strong>

        </div>


        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "14px",
            padding: "22px"
          }}
        >

          <small
            style={{
              display: "block",
              color: "#9ca3af",
              fontSize: "11px",
              marginBottom: "7px"
            }}
          >
            TECHNOLOGY
          </small>

          <strong
            style={{
              fontSize: "17px",
              color: "#111827"
            }}
          >
            MERN Stack
          </strong>

        </div>

      </div>

    </div>


    {/* BOOKING POLICY */}

    <div style={{ marginTop: "34px" }}>

      <h3 style={{ marginBottom: "16px" }}>
        Booking Policy
      </h3>


      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "24px"
        }}
      >

        <div
          style={{
            display: "grid",
            gap: "18px"
          }}
        >

          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start"
            }}
          >

            <span style={{ fontSize: "18px" }}>
              📅
            </span>

            <div>

              <strong
                style={{
                  display: "block",
                  marginBottom: "4px",
                  color: "#111827"
                }}
              >
                Booking Window
              </strong>

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "13px"
                }}
              >
                Rooms can be booked for today and the next two
                calendar days.
              </p>

            </div>

          </div>


          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start"
            }}
          >

            <span style={{ fontSize: "18px" }}>
              🎓
            </span>

            <div>

              <strong
                style={{
                  display: "block",
                  marginBottom: "4px",
                  color: "#111827"
                }}
              >
                Student Bookings
              </strong>

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "13px"
                }}
              >
                Student booking requests require administrator
                approval before the booking becomes confirmed.
              </p>

            </div>

          </div>


          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start"
            }}
          >

            <span style={{ fontSize: "18px" }}>
              👨‍🏫
            </span>

            <div>

              <strong
                style={{
                  display: "block",
                  marginBottom: "4px",
                  color: "#111827"
                }}
              >
                Faculty Bookings
              </strong>

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "13px"
                }}
              >
                Faculty bookings are automatically approved when
                the selected room and time slot are available.
              </p>

            </div>

          </div>


          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start"
            }}
          >

            <span style={{ fontSize: "18px" }}>
              ▧
            </span>

            <div>

              <strong
                style={{
                  display: "block",
                  marginBottom: "4px",
                  color: "#111827"
                }}
              >
                QR Check-in
              </strong>

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "13px"
                }}
              >
                Approved bookings require the booking user to
                scan the room QR code for check-in.
              </p>

            </div>

          </div>


          <div
            style={{
              display: "flex",
              gap: "14px",
              alignItems: "flex-start"
            }}
          >

            <span style={{ fontSize: "18px" }}>
              ⏱
            </span>

            <div>

              <strong
                style={{
                  display: "block",
                  marginBottom: "4px",
                  color: "#111827"
                }}
              >
                Automatic Cancellation
              </strong>

              <p
                style={{
                  margin: 0,
                  color: "#6b7280",
                  fontSize: "13px"
                }}
              >
                An approved booking is automatically cancelled
                if the user does not check in within 15 minutes
                after the scheduled start time.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>


    {/* ACCOUNT ACTIONS */}

    <div style={{ marginTop: "34px" }}>

      <h3 style={{ marginBottom: "16px" }}>
        Account Actions
      </h3>


      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "14px",
          padding: "22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap"
        }}
      >

        <div>

          <strong
            style={{
              display: "block",
              marginBottom: "5px",
              color: "#111827"
            }}
          >
            Sign out of Space IQ
          </strong>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              fontSize: "13px"
            }}
          >
            End your current administrator session.
          </p>

        </div>


        <button
          type="button"
          className="view-room-button"
          onClick={onLogout}
        >
          ↪ Logout
        </button>

      </div>

    </div>

  </section>
)}
          {/* =====================================================
      QR CODE MANAGEMENT
  ===================================================== */}

  {activePage === "QR Codes" && (
    <section className="search-section">

      <div className="section-heading">

        <div>
          <h2>QR Code Management</h2>

          <p>
            Generate and manage verification QR codes for every room.
          </p>
        </div>

      </div>


      {rooms.length === 0 ? (

        <div className="no-results">

          <div className="no-results-icon">
            ▧
          </div>

          <h3>No rooms available</h3>

          <p>
            Add rooms first to generate their QR codes.
          </p>

          <button
            className="view-room-button"
            onClick={() => handleNavigation("Room Management")}
          >
            Go to Room Management
          </button>

        </div>

      ) : (

        <div className="room-grid">

          {rooms.map((room) => (

            <div
  className={`room-card ${
    printingQrRoomId === room.id ? "is-printing" : ""
  }`}
  key={room.id}
  style={{
    textAlign: "center"
  }}
>
            

              {/* ROOM INFORMATION */}

              <div className="room-card-top">

                <div
                  className="room-number"
                  style={{
                    textAlign: "left"
                  }}
                >
                  Room {room.roomNumber}
                </div>

                <span
                  className={`status-badge ${room.status.toLowerCase()}`}
                >
                  {room.status}
                </span>

              </div>


              <p
                className="building-name"
                style={{
                  textAlign: "left"
                }}
              >
                {room.building}
              </p>


              {/* QR CODE */}

              <div
                style={{
                  margin: "25px auto",
                  padding: "20px",
                  width: "fit-content",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px"
                }}
              >

                <QRCodeCanvas
                  value={`http://localhost:5173/check-in?qrCodeId=${encodeURIComponent( room.qrCodeId )}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />

              </div>


              {/* QR INFORMATION */}

              <div
                style={{
                  marginTop: "10px"
                }}
              >

                <strong
                  style={{
                    display: "block",
                    marginBottom: "6px"
                  }}
                >
                  Room Verification QR
                </strong>

                <p
                  style={{
                    fontSize: "13px",
                    color: "#6b7280",
                    margin: "0 0 12px"
                  }}
                >
                  Scan this QR code to verify a booking
                  and check in to this room.
                </p>

                <div
                  style={{
                    background: "#f3f4f6",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "#4b5563",
                    wordBreak: "break-all"
                  }}
                >
                  {room.qrCodeId}
                </div>

              </div>


              {/* ACTION */}

              <button
                className="view-room-button"
                style={{
                  marginTop: "18px",
                  width: "100%"
                }}
                onClick={() => handlePrintQr(room.id)}
              >
                🖨 Print QR Codes
              </button>

            </div>

          ))}

        </div>

      )}

    </section>
  )}

        </main>

      </div>
    );
  }

  export default AdminDashboard;