import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000";

const getIndiaDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

const getIndiaTime = () =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  const getBookingTimeState = (booking) => {
    

  if (!booking?.date || !booking?.startTime) {
    return "upcoming";
  }

  if (booking.status === "Completed") {
    return "completed";
  }

  if (booking.status === "Cancelled") {
    return "cancelled";
  }

  if (booking.status === "Rejected") {
    return "rejected";
  }

  if (booking.status !== "Approved") {
    return "pending";
  }

  const now = new Date();

  const bookingStart = new Date(
    `${booking.date}T${booking.startTime}:00+05:30`
  );

  const checkInDeadline = new Date(
    bookingStart.getTime() + 15 * 60 * 1000
  );

  if (booking.checkedIn) {
    return "checkedIn";
  }

  if (now < bookingStart) {
    return "upcoming";
  }

  if (now <= checkInDeadline) {
    return "checkIn";
  }

  return "expired";
};

const getIndiaDateAfterDays = (days) => {
  const [year, month, day] = getIndiaDate().split("-").map(Number);

  const date = new Date(Date.UTC(year, month - 1, day + days));

  return date.toISOString().split("T")[0];
};

const formatTime = (time) => {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes));

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

function UserDashboard({ user, onLogout, role = "Student" }) {
    const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

const token = getToken();
  const today = getIndiaDate();
  const maximumDate = getIndiaDateAfterDays(2);

  const [activePage, setActivePage] = useState("Dashboard");

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [, setCurrentTimeTick] = useState(Date.now());

  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [minCapacity, setMinCapacity] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedFacilities, setSelectedFacilities] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  const [bookingDate, setBookingDate] = useState(today);
  const [bookingStartTime, setBookingStartTime] = useState("");
  const [bookingEndTime, setBookingEndTime] = useState("");
  const [bookingPurpose, setBookingPurpose] = useState("");
  const [submittingBooking, setSubmittingBooking] = useState(false);
  

  const [roomBookings, setRoomBookings] = useState([]);
  const [loadingRoomBookings, setLoadingRoomBookings] = useState(false);

  const [savedRooms, setSavedRooms] = useState([]);

  const [bookingFilter, setBookingFilter] = useState("All");

  const [showSupport, setShowSupport] = useState(false);

  const [profilePicture, setProfilePicture] = useState(
  user?.profilePicture || ""
);
const [uploadingProfilePicture, setUploadingProfilePicture] = useState(false);

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${getToken()}`,
  });

  const savedStorageKey = `spaceiq_saved_spaces_${user?.id}`;

  // =====================================================
  // LOAD SAVED ROOMS
  // =====================================================

  useEffect(() => {
    if (!user?.id) return;

    try {
      const saved = JSON.parse(
        localStorage.getItem(savedStorageKey) || "[]"
      );

      setSavedRooms(saved);
    } catch {
      setSavedRooms([]);
    }
  }, [user?.id, savedStorageKey]);

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTimeTick(Date.now());
  }, 60 * 1000);

  return () => clearInterval(timer);
}, []);  

// FETCH ROOMS
// =====================================================

const fetchRooms = async () => {
  try {
    const token = getToken();

    if (!token) {
      console.error("No authentication token found.");
      return;
    }

    const response = await fetch(`${API}/api/rooms`, {
      headers: getAuthHeaders(),
    });

    const data = await response.json();

    if (response.ok) {
      setRooms(
        data.map((room) => ({
          ...room,
          id: room._id,
        }))
      );
    } else {
      console.error(
        "Fetch rooms failed:",
        data.message || "Unable to load rooms."
      );
    }
  } catch (error) {
    console.error("Fetch rooms error:", error);
  } finally {
    setLoadingRooms(false);
  }
};

useEffect(() => {
  fetchRooms();
}, []);

  // =====================================================
  // FETCH BOOKINGS
  // =====================================================

  const fetchMyBookings = async () => {
    if (!user?.id) return;

    const token = getToken();

    if (!token) {
      alert("Your login session has expired. Please log in again.");
      return;
    }

    setLoadingBookings(true);

    try {
      const response = await fetch(
        `${API}/api/bookings/user/${user.id}`,
        {
          headers: getAuthHeaders(),
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
      alert("Unable to load your bookings.");
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, [user]);

  // ==========================================
// REFRESH BOOKINGS AUTOMATICALLY
// ==========================================
useEffect(() => {
  if (!user?.id) return;

  const interval = setInterval(() => {
    fetchMyBookings();
    fetchRooms();
  }, 30000);

  return () => {
    clearInterval(interval);
  };
}, [user?.id]);
  // =====================================================
  // ROOM SCHEDULE
  // =====================================================

  const fetchRoomBookings = async (roomId, date) => {
    if (!roomId || !date) {
      setRoomBookings([]);
      return;
    }

    setLoadingRoomBookings(true);

    try {
      const response = await fetch(
        `${API}/api/bookings/room/${roomId}/${date}`,
        {
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setRoomBookings(data);
      } else {
        setRoomBookings([]);
      }
    } catch (error) {
      console.error("Room schedule error:", error);
      setRoomBookings([]);
    } finally {
      setLoadingRoomBookings(false);
    }
  };

  // =====================================================
  // FACILITIES
  // =====================================================

  const toggleFacility = (facility) => {
    setSelectedFacilities((previous) =>
      previous.includes(facility)
        ? previous.filter((item) => item !== facility)
        : [...previous, facility]
    );
  };

  // =====================================================
  // FILTERED ROOMS
  // =====================================================

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const term = searchTerm.toLowerCase();

      const matchesSearch =
        !term ||
        room.roomNumber?.toLowerCase().includes(term) ||
        room.building?.toLowerCase().includes(term);

      const matchesCapacity =
        !minCapacity ||
        Number(room.capacity) >= Number(minCapacity);

      const matchesFacilities = selectedFacilities.every((facility) =>
        room.facilities?.includes(facility)
      );

      return (
        matchesSearch &&
        matchesCapacity &&
        matchesFacilities
      );
    });
  }, [
    rooms,
    searchTerm,
    minCapacity,
    selectedFacilities,
  ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters = () => {
    setSearchTerm("");
    setMinCapacity("");
    setSelectedDate("");
    setStartTime("");
    setEndTime("");
    setSelectedFacilities([]);
  };

  // =====================================================
  // SAVE / UNSAVE ROOM
  // =====================================================

  const toggleSavedRoom = (room) => {
    const exists = savedRooms.some((item) => item.id === room.id);

    const updated = exists
      ? savedRooms.filter((item) => item.id !== room.id)
      : [...savedRooms, room];

    setSavedRooms(updated);
    localStorage.setItem(
      savedStorageKey,
      JSON.stringify(updated)
    );
  };

  const isRoomSaved = (roomId) =>
    savedRooms.some((room) => room.id === roomId);

  // =====================================================
  // OPEN BOOKING
  // =====================================================

  const handleBookRoom = (room) => {
    const date = selectedDate || today;

    setSelectedRoom(room);
    setBookingDate(date);
    setBookingStartTime(startTime || "");
    setBookingEndTime(endTime || "");
    setBookingPurpose("");
    setRoomBookings([]);
    setShowBookingForm(true);

    fetchRoomBookings(room.id, date);
  };

  const handleBookingDateChange = (date) => {
    setBookingDate(date);

    if (selectedRoom) {
      fetchRoomBookings(selectedRoom.id, date);
    }
  };

  const handleCancelBooking = () => {
    setSelectedRoom(null);
    setShowBookingForm(false);
    setRoomBookings([]);
    setBookingDate(today);
    setBookingStartTime("");
    setBookingEndTime("");
    setBookingPurpose("");
  };

  // =====================================================
  // SUBMIT BOOKING
  // =====================================================

  const handleSubmitBooking = async (event) => {
    event.preventDefault();

    if (!selectedRoom) return;

    if (
      !bookingDate ||
      !bookingStartTime ||
      !bookingEndTime ||
      !bookingPurpose.trim()
    ) {
      alert("Please fill in all booking details.");
      return;
    }

    if (bookingDate < today || bookingDate > maximumDate) {
      alert(
        "Bookings are allowed only for today and the next 2 days."
      );
      return;
    }

    if (bookingStartTime >= bookingEndTime) {
      alert("End time must be after start time.");
      return;
    }

    if (
      bookingDate === today &&
      bookingStartTime <= getIndiaTime()
    ) {
      alert("The booking start time must be in the future.");
      return;
    }

    setSubmittingBooking(true);

    try {
      const response = await fetch(`${API}/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
       body: JSON.stringify({
  roomId: selectedRoom.id,
  date: bookingDate,
  startTime: bookingStartTime,
  endTime: bookingEndTime,
  purpose: bookingPurpose.trim(),
}),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert(data.message);

      await fetchMyBookings();

      handleCancelBooking();
    } catch (error) {
      console.error("Booking error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setSubmittingBooking(false);
    }
  };



  const handleProfilePictureChange = async (event) => {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  // Allow common image formats only
  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image file.");
    event.target.value = "";
    return;
  }

  // Maximum 2 MB
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

const handleCancelUserBooking = async (bookingId) => {
  const confirmed = window.confirm(
    "Are you sure you want to cancel this booking?"
  );

  if (!confirmed) return;

  try {
    const token = getToken();

    if (!token) {
      alert("Please login again.");
      return;
    }

    const response = await fetch(
      `${API}/api/bookings/${bookingId}/cancel`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Unable to cancel booking."
      );
    }

    alert(data.message || "Booking cancelled successfully!");

    await fetchMyBookings();
  } catch (error) {
    console.error("Cancel booking error:", error);
    alert(error.message || "Unable to cancel booking.");
  }
};

  // =====================================================
  // STATISTICS
  // =====================================================

  const availableRooms = rooms.filter(
    (room) => room.status === "Available"
  ).length;

  const occupiedRooms = rooms.filter(
    (room) => room.status === "Occupied"
  ).length;

  const maintenanceRooms = rooms.filter(
    (room) => room.status === "Maintenance"
  ).length;

  // =====================================================
  // BOOKING FILTER
  // =====================================================

  const bookingFilters = [
    "All",
    "Pending",
    "Approved",
    "Completed",
    "Cancelled",
    "Rejected",
  ];

  const filteredBookings =
    bookingFilter === "All"
      ? bookings
      : bookings.filter(
          (booking) => booking.status === bookingFilter
        );

  // =====================================================
  // NAVIGATION
  // =====================================================

  const goTo = (page) => {
    setActivePage(page);
  };

  const renderRoomCard = (room) => (
    <article className="sq-room-card" key={room.id}>
      <div className="sq-room-header">
        <div>
          <div className="sq-room-number">
            Room {room.roomNumber}
          </div>

          <div className="sq-building">
            {room.building}
          </div>
        </div>

        <button
          type="button"
          className={`sq-save-button ${
            isRoomSaved(room.id) ? "saved" : ""
          }`}
          onClick={() => toggleSavedRoom(room)}
          title={
            isRoomSaved(room.id)
              ? "Remove from saved spaces"
              : "Save this space"
          }
        >
          {isRoomSaved(room.id) ? "★" : "☆"}
        </button>
      </div>

      <span
        className={`sq-status sq-status-${room.status.toLowerCase()}`}
      >
        <span />
        {room.status}
      </span>

      <div className="sq-room-info">
        <span>👥 {room.capacity} seats</span>
      </div>

      <div className="sq-facilities">
        {room.facilities?.length ? (
          room.facilities.map((facility) => (
            <span key={facility}>{facility}</span>
          ))
        ) : (
          <span>No facilities listed</span>
        )}
      </div>

      <button
        type="button"
        className="sq-primary-button sq-full-button"
        disabled={room.status === "Maintenance"}
        onClick={() => handleBookRoom(room)}
      >
        {room.status === "Maintenance"
          ? "Under Maintenance"
          : "View & Book"}
      </button>
    </article>
  );

  return (
    <div className="dashboard sq-dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar sq-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">Space IQ</div>
          <p>Smart Space Management</p>
        </div>

        <nav className="sidebar-nav">
          {[
            ["Dashboard", "⌂"],
            ["Find a Space", "⌕"],
            ["My Bookings", "▣"],
            ["Saved Spaces", "★"],
            ["Settings", "⚙"],
          ].map(([page, icon]) => (
            <button
              key={page}
              type="button"
              className={`nav-item ${
                activePage === page ? "active" : ""
              }`}
              onClick={() => goTo(page)}
            >
              <span>{icon}</span>
              {page}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">

<div className="sq-support-card">
  <div className="sq-support-icon" aria-hidden="true">
    <span>✦</span>
  </div>

  <div className="sq-support-content">
    <div className="sq-support-label">SPACEIQ SUPPORT</div>

    <h3>Need help?</h3>

    <p>
      Having trouble finding a room or completing a booking?
      Our support team is here to help.
    </p>

    <button
      type="button"
      className="sq-support-button"
      onClick={() => setShowSupport(true)}
    >
      Contact Support
      <span aria-hidden="true">→</span>
    </button>
  </div>
</div>


          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        <header className="topbar">
          <div className="page-label">{activePage}</div>

          <button
  type="button"
  className="sq-profile-button"
  onClick={() => goTo("My Profile")}
  title="View My Profile"
>
  <div className="sq-profile-avatar">
    {profilePicture ? (
      <img
        src={profilePicture}
        alt="Profile"
      />
    ) : (
      user?.fullName?.charAt(0)?.toUpperCase() || "U"
    )}
  </div>

  <div className="sq-profile-copy">
    <strong>{user?.fullName || role}</strong>

    <span>
      <span className="sq-profile-status-dot"></span>
      {user?.role || role}
    </span>
  </div>

  <span className="sq-profile-chevron">›</span>
</button>
        </header>

        {/* =================================================
            DASHBOARD
        ================================================= */}

        {activePage === "Dashboard" && (
          <>
            <section className="sq-hero">
              <div>
                <span className="sq-eyebrow">
                  {role} Workspace
                </span>

                <h1>
                  Welcome back,{" "}
                  {user?.fullName?.split(" ")[0] || role}
                </h1>

                <p>
                  Find the right space, check availability and
                  manage your bookings from one place.
                </p>
              </div>

              <button
                type="button"
                className="sq-hero-button"
                onClick={() => goTo("Find a Space")}
              >
                Find a Space →
              </button>
            </section>

            <section className="stats-grid sq-stats">
              <button
                type="button"
                className="stat-card"
                onClick={() => goTo("Find a Space")}
              >
                <div className="stat-icon available-icon">✓</div>
                <div>
                  <span>Available Spaces</span>
                  <strong>{availableRooms}</strong>
                </div>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() => goTo("Find a Space")}
              >
                <div className="stat-icon occupied-icon">●</div>
                <div>
                  <span>Occupied Spaces</span>
                  <strong>{occupiedRooms}</strong>
                </div>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() => goTo("Find a Space")}
              >
                <div className="stat-icon maintenance-icon">!</div>
                <div>
                  <span>Maintenance</span>
                  <strong>{maintenanceRooms}</strong>
                </div>
              </button>

              <button
                type="button"
                className="stat-card"
                onClick={() => goTo("My Bookings")}
              >
                <div className="stat-icon booking-icon">▣</div>
                <div>
                  <span>My Bookings</span>
                  <strong>{bookings.length}</strong>
                </div>
              </button>
            </section>

            <section className="sq-discovery-panel">
              <div>
                <span className="sq-eyebrow">Quick Search</span>
                <h2>Find your next space</h2>
                <p>
                  Search rooms by number, building, capacity or
                  facilities.
                </p>
              </div>

              <button
                type="button"
                className="sq-primary-button"
                onClick={() => goTo("Find a Space")}
              >
                Explore Spaces
              </button>
            </section>

            <section className="rooms-section">
              <div className="rooms-header">
                <div>
                  <h2>Available Spaces</h2>
                  <p>
                    {filteredRooms.length} space
                    {filteredRooms.length !== 1 ? "s" : ""} available
                    in the system
                  </p>
                </div>
              </div>

              {loadingRooms ? (
                <div className="sq-empty">
                  <div className="sq-loader" />
                  <h3>Loading spaces</h3>
                  <p>Getting the latest room information.</p>
                </div>
              ) : (
                <div className="room-grid">
                  {filteredRooms
                    .filter((room) => room.status !== "Maintenance")
                    .slice(0, 6)
                    .map(renderRoomCard)}
                </div>
              )}
            </section>
          </>
        )}

        {/* =================================================
            FIND A SPACE
        ================================================= */}

        {activePage === "Find a Space" && (
          <>
            <section className="sq-page-heading">
              <span className="sq-eyebrow">Space Discovery</span>
              <h1>Find a Space</h1>
              <p>
                Search and filter rooms according to your
                requirements.
              </p>
            </section>

            <section className="sq-filter-panel">
              <div className="sq-search-large">
                <span>⌕</span>
                <input
                  type="text"
                  placeholder="Search room number or building..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filters-grid">
                <div className="filter-field">
                  <label>Minimum Capacity</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={minCapacity}
                    onChange={(e) =>
                      setMinCapacity(e.target.value)
                    }
                  />
                </div>

                <div className="filter-field">
                  <label>Preferred Date</label>
                  <input
                    type="date"
                    min={today}
                    max={maximumDate}
                    value={selectedDate}
                    onChange={(e) =>
                      setSelectedDate(e.target.value)
                    }
                  />
                </div>

                <div className="filter-field">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>

                <div className="filter-field">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="sq-facility-row">
                <strong>Facilities</strong>

                {["AC", "Projector", "Computers"].map(
                  (facility) => (
                    <label
                      className="sq-check"
                      key={facility}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFacilities.includes(
                          facility
                        )}
                        onChange={() =>
                          toggleFacility(facility)
                        }
                      />
                      <span>{facility}</span>
                    </label>
                  )
                )}

                <button
                  type="button"
                  className="sq-clear-button"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </section>

            <section className="rooms-section">
              <div className="rooms-header">
                <div>
                  <h2>Spaces</h2>
                  <p>
                    {filteredRooms.length} matching result
                    {filteredRooms.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="status-legend">
                  <span>
                    <i className="legend-dot available-dot" />
                    Available
                  </span>
                  <span>
                    <i className="legend-dot occupied-dot" />
                    Occupied
                  </span>
                  <span>
                    <i className="legend-dot maintenance-dot" />
                    Maintenance
                  </span>
                </div>
              </div>

              {loadingRooms ? (
                <div className="sq-empty">
                  <div className="sq-loader" />
                  <h3>Loading spaces</h3>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="sq-empty">
                  <div className="sq-empty-icon">⌕</div>
                  <h3>No spaces found</h3>
                  <p>Try changing your search or filters.</p>
                  <button
                    type="button"
                    className="sq-primary-button"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="room-grid">
                  {filteredRooms.map(renderRoomCard)}
                </div>
              )}
            </section>
          </>
        )}

        {/* =================================================
            MY BOOKINGS
        ================================================= */}

        {activePage === "My Bookings" && (
          <>
            <section className="sq-page-heading">
              <span className="sq-eyebrow">Booking Management</span>
              <h1>My Bookings</h1>
              <p>
                Track your room reservations and their current
                status.
              </p>
            </section>

            <div className="sq-booking-tabs">
              {bookingFilters.map((filter) => (
                <button
                  type="button"
                  key={filter}
                  className={
                    bookingFilter === filter ? "active" : ""
                  }
                  onClick={() => setBookingFilter(filter)}
                >
                  {filter}
                  <span>
                    {filter === "All"
                      ? bookings.length
                      : bookings.filter(
                          (b) => b.status === filter
                        ).length}
                  </span>
                </button>
              ))}
            </div>

            {loadingBookings ? (
              <div className="sq-empty">
                <div className="sq-loader" />
                <h3>Loading your bookings</h3>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="sq-empty">
                <div className="sq-empty-icon">▣</div>
                <h3>No {bookingFilter.toLowerCase()} bookings</h3>
                <p>
                  Your bookings matching this status will appear
                  here.
                </p>

                <button
                  type="button"
                  className="sq-primary-button"
                  onClick={() => goTo("Find a Space")}
                >
                  Find a Space
                </button>
              </div>
            ) : (
              <div className="sq-booking-list">
                {filteredBookings.map((booking) => (
                  <article
                    className="sq-booking-card"
                    key={booking._id}
                  >
                    <div className="sq-booking-main">
                      <div>
                        <span className="sq-booking-label">
                          ROOM
                        </span>

                        <h3>
                          {booking.room?.roomNumber || "N/A"}
                        </h3>

                        <p>
                          {booking.room?.building ||
                            "Building unavailable"}
                        </p>
                      </div>

                      <span
                        className={`sq-booking-status sq-booking-${booking.status.toLowerCase()}`}
                      >
                        {booking.status}
                      </span>
                    </div>

                    <div className="sq-booking-details">
                      <div>
                        <span>Date</span>
                        <strong>{booking.date}</strong>
                      </div>

                      <div>
                        <span>Time</span>
                        <strong>
                          {formatTime(booking.startTime)} –{" "}
                          {formatTime(booking.endTime)}
                        </strong>
                      </div>

                      <div>
                        <span>Purpose</span>
                        <strong>{booking.purpose}</strong>
                      </div>
                    </div>

                    {booking.status === "Approved" && (
  <div className="sq-checkin-notice">
    {getBookingTimeState(booking) === "upcoming" && (
      <>
        ✓ Booking approved. Check-in will be available from{" "}
        {booking.startTime}.
      </>
    )}

    {getBookingTimeState(booking) === "checkIn" && (
      <>
        ✓ Booking approved. Check in by scanning
        the QR code placed in the room.
      </>
    )}

    {getBookingTimeState(booking) === "checkedIn" && (
      <>
        ✓ Checked in. Room is currently active.
      </>
    )}

    {getBookingTimeState(booking) === "expired" && (
      <>
        Check-in window closed. This booking is no longer active.
      </>
    )}
  </div>
)}

{booking.status === "Completed" && (
  <div className="sq-checkin-notice">
    ✓ Booking completed.
  </div>
)}

{booking.status === "Cancelled" && (
  <div className="sq-checkin-notice">
    Booking cancelled. Check-in is no longer available.
  </div>
)}



                    {booking.status === "Pending" &&
                      role === "Student" && (
                        <div className="sq-pending-notice">
                          Your request is waiting for Admin
                          approval.
                        </div>
                      )}

                    {booking.status === "Rejected" && (
                      <div className="sq-rejected-notice">
                        This booking request was not approved.
                      </div>
                    )}

                    {(booking.status === "Pending" ||
  booking.status === "Approved") && (
  <div className="sq-booking-actions">
    <button
      type="button"
      className="sq-secondary-button"
      onClick={() =>
        handleCancelUserBooking(booking._id)
      }
    >
      Cancel Booking
    </button>
  </div>
)}

                   
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {/* =================================================
            SAVED SPACES
        ================================================= */}

        {activePage === "Saved Spaces" && (
          <>
            <section className="sq-page-heading">
              <span className="sq-eyebrow">Your Shortlist</span>
              <h1>Saved Spaces</h1>
              <p>
                Keep frequently used rooms here for quick access.
              </p>
            </section>

            {savedRooms.length === 0 ? (
              <div className="sq-empty">
                <div className="sq-empty-icon">★</div>
                <h3>No saved spaces yet</h3>
                <p>
                  Tap the star on any room to save it here.
                </p>

                <button
                  type="button"
                  className="sq-primary-button"
                  onClick={() => goTo("Find a Space")}
                >
                  Explore Spaces
                </button>
              </div>
            ) : (
              <div className="room-grid">
                {savedRooms
                  .filter((saved) =>
                    rooms.some((room) => room.id === saved.id)
                  )
                  .map((saved) => {
                    const currentRoom =
                      rooms.find((room) => room.id === saved.id) ||
                      saved;

                    return renderRoomCard(currentRoom);
                  })}
              </div>
            )}
          </>
        )}

        {/* =================================================
            SETTINGS
        ================================================= */}

        {activePage === "Settings" && (
          <>
            <section className="sq-page-heading">
              <span className="sq-eyebrow">Preferences</span>
              <h1>Settings</h1>
              <p>
                Review your Space IQ account and booking policies.
              </p>
            </section>

            <div className="sq-settings-grid">
              <section className="sq-settings-card">
                <span className="sq-settings-icon">👤</span>
                <div>
                  <h3>Account</h3>
                  <p>Signed in as</p>
                  <strong>{user?.email || "Account email"}</strong>
                </div>
              </section>

              <section className="sq-settings-card">
                <span className="sq-settings-icon">▣</span>
                <div>
                  <h3>Booking Window</h3>
                  <p>
                    Rooms can be booked for today and the next
                    two days.
                  </p>
                </div>
              </section>

              <section className="sq-settings-card">
                <span className="sq-settings-icon">✓</span>
                <div>
                  <h3>QR Check-in</h3>
                  <p>
                    Approved bookings are verified by scanning
                    the QR code placed in the booked room.
                  </p>
                </div>
              </section>

              <section className="sq-settings-card">
                <span className="sq-settings-icon">15</span>
                <div>
                  <h3>Check-in Policy</h3>
                  <p>
                    Approved bookings without check-in are
                    automatically cancelled after 15 minutes.
                  </p>
                </div>
              </section>
            </div>
          </>
        )}

        {/* =================================================
            MY PROFILE
        ================================================= */}

        {activePage === "My Profile" && (
          <>
            <section className="sq-page-heading">
              <span className="sq-eyebrow">Account</span>
              <h1>My Profile</h1>
              <p>Your Space IQ account information.</p>
            </section>

            <section className="sq-profile-card">
  <div className="sq-profile-header">
    <div className="sq-large-avatar">
      {profilePicture ? (
        <img
          src={profilePicture}
          alt="Profile"
        />
      ) : (
        user?.fullName?.charAt(0)?.toUpperCase() || "U"
      )}
    </div>

    <div className="sq-profile-main-info">
      <h2>{user?.fullName || "User"}</h2>

      <span className="sq-role-badge">
        {user?.role || role}
      </span>

      <p>
        Manage your profile picture and account information.
      </p>
    </div>
  </div>

  <div className="sq-profile-photo-actions">
    <label
      htmlFor="profile-picture-upload"
      className="sq-photo-button sq-photo-primary"
    >
      {uploadingProfilePicture
        ? "Uploading..."
        : profilePicture
        ? "Change Photo"
        : "Upload Photo"}
    </label>

    <input
      id="profile-picture-upload"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      onChange={handleProfilePictureChange}
      disabled={uploadingProfilePicture}
      hidden
    />

    {profilePicture && (
      <button
        type="button"
        className="sq-photo-button sq-photo-remove"
        onClick={handleRemoveProfilePicture}
        disabled={uploadingProfilePicture}
      >
        Remove Photo
      </button>
    )}
  </div>

  <div className="sq-profile-details">
    <div>
      <label>Email</label>
      <strong>{user?.email || "Not available"}</strong>
    </div>

    <div>
      <label>User ID</label>
      <strong>{user?.userId || "Not available"}</strong>
    </div>

    <div>
      <label>Role</label>
      <strong>{user?.role || role}</strong>
    </div>
  </div>
</section>
            <button
              type="button"
              className="sq-secondary-button"
              onClick={() => goTo("Dashboard")}
            >
              ← Back to Dashboard
            </button>
          </>
        )}
      </main>

      {/* =================================================
          SUPPORT MODAL
      ================================================= */}

      {showSupport && (
        <div className="sq-modal-overlay">
          <div className="sq-modal sq-support-modal">
            <button
              type="button"
              className="sq-modal-close"
              onClick={() => setShowSupport(false)}
            >
              ×
            </button>

            <div className="sq-modal-icon">?</div>

            <h2>Space IQ Support</h2>

            <p>
              For help with room availability, booking requests,
              QR check-in or account access, contact your
              institution's Space IQ administrator.
            </p>

            <button
              type="button"
              className="sq-primary-button sq-full-button"
              onClick={() => setShowSupport(false)}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          BOOKING MODAL
      ================================================= */}

      {showBookingForm && selectedRoom && (
        <div className="sq-modal-overlay">
          <div className="sq-modal sq-booking-modal">
            <button
              type="button"
              className="sq-modal-close"
              onClick={handleCancelBooking}
            >
              ×
            </button>

            <span className="sq-eyebrow">Room Reservation</span>

            <h2>
              Book Room {selectedRoom.roomNumber}
            </h2>

            <p className="sq-modal-subtitle">
              {selectedRoom.building} • Capacity{" "}
              {selectedRoom.capacity}
            </p>

            <div
              className={
                role === "Faculty"
                  ? "sq-approval faculty"
                  : "sq-approval student"
              }
            >
              {role === "Faculty"
                ? "✓ Faculty bookings are automatically approved when the selected room and time are available."
                : "◷ Student bookings are submitted for Admin approval before they become confirmed."}
            </div>

            <div className="sq-schedule">
              <h3>Room Schedule</h3>
              <p>Existing bookings for {bookingDate}</p>

              {loadingRoomBookings ? (
                <span>Loading room schedule...</span>
              ) : roomBookings.length === 0 ? (
                <div className="sq-free">
                  ✓ No bookings for this date. The room is
                  available.
                </div>
              ) : (
                roomBookings.map((booking) => (
                  <div
                    className="sq-schedule-item"
                    key={booking._id}
                  >
                    <strong>
                      {formatTime(booking.startTime)} –{" "}
                      {formatTime(booking.endTime)}
                    </strong>

                    <span>
                      {booking.user?.fullName || "Reserved"}
                    </span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSubmitBooking}>
              <div className="sq-form-group">
                <label>Date</label>
                <input
                  type="date"
                  min={today}
                  max={maximumDate}
                  value={bookingDate}
                  onChange={(e) =>
                    handleBookingDateChange(e.target.value)
                  }
                  required
                />
              </div>

              <div className="sq-time-grid">
                <div className="sq-form-group">
                  <label>Start Time</label>
                  <input
                    type="time"
                    value={bookingStartTime}
                    onChange={(e) =>
                      setBookingStartTime(e.target.value)
                    }
                    required
                  />
                </div>

                <div className="sq-form-group">
                  <label>End Time</label>
                  <input
                    type="time"
                    value={bookingEndTime}
                    onChange={(e) =>
                      setBookingEndTime(e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="sq-form-group">
                <label>Purpose / Reason</label>
                <textarea
                  rows="4"
                  value={bookingPurpose}
                  onChange={(e) =>
                    setBookingPurpose(e.target.value)
                  }
                  placeholder="Why do you need this room?"
                  required
                />
              </div>

              <div className="sq-modal-actions">
                <button
                  type="button"
                  className="sq-secondary-button"
                  onClick={handleCancelBooking}
                  disabled={submittingBooking}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="sq-primary-button"
                  disabled={submittingBooking}
                >
                  {submittingBooking
                    ? "Booking..."
                    : "Book Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;