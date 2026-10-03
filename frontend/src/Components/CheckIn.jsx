
import { useEffect, useState } from "react";

function CheckIn() {
  const [status, setStatus] = useState("loading");
  const [bookingData, setBookingData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkIn = async () => {
      try {
        // Get logged-in user's token
        const token =
          localStorage.getItem("token") ||
          sessionStorage.getItem("token");

        if (!token) {
          setStatus("error");
          setErrorMessage(
            "Please log in to SpaceIQ before checking in."
          );
          return;
        }

        // Get QR code ID from the URL
        const params = new URLSearchParams(window.location.search);
        const qrCodeId = params.get("qrCodeId");

        if (!qrCodeId) {
          setStatus("error");
          setErrorMessage("Invalid QR code.");
          return;
        }

        // Send QR code to backend
        const response = await fetch(
          "http://localhost:5000/api/bookings/check-in",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              qrCodeId,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          setBookingData(data);
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(
            data.message || "Check-in could not be completed."
          );
        }
      } catch (error) {
        console.error("Check-in error:", error);

        setStatus("error");
        setErrorMessage(
          "Unable to connect to SpaceIQ. Please try again."
        );
      }
    };

    checkIn();
  }, []);

  // Format booking time
  const formatTime = (time) => {
    if (!time) return "";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours));
    date.setMinutes(Number(minutes));

    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Go back to SpaceIQ
  const handleBack = () => {
    window.location.href = "/";
  };

  return (
    <div className="checkin-page">

      {/* HEADER */}

      <header className="checkin-header">
        <div className="checkin-logo">
          Space<span>IQ</span>
        </div>

        <div className="checkin-header-text">
          Intelligent Resource Booking & Availability Platform
        </div>
      </header>


      {/* MAIN CONTENT */}

      <main className="checkin-main">

        <div className="checkin-card">

          {/* LOADING */}

          {status === "loading" && (
            <div className="checkin-state">

              <div className="checkin-spinner"></div>

              <h1>Verifying Check-In</h1>

              <p>
                Please wait while SpaceIQ verifies your
                booking.
              </p>

            </div>
          )}


          {/* SUCCESS */}

          {status === "success" && (
            <div className="checkin-state">

              <div className="success-icon">
                ✓
              </div>

              <div className="success-label">
                CHECK-IN SUCCESSFUL
              </div>

              <h1>Welcome to your room!</h1>

              <p className="checkin-description">
                Your approved booking has been verified
                successfully.
              </p>


              {/* BOOKING DETAILS */}

              {bookingData && (
                <div className="booking-details">

                  <div className="detail-row">

                    <span className="detail-label">
                      Room
                    </span>

                    <span className="detail-value">
                      {bookingData.room?.roomNumber ||
                        "Room"}
                    </span>

                  </div>


                  <div className="detail-row">

                    <span className="detail-label">
                      Building
                    </span>

                    <span className="detail-value">
                      {bookingData.room?.building ||
                        "—"}
                    </span>

                  </div>


                  {bookingData.booking?.purpose && (
                    <div className="detail-row">

                      <span className="detail-label">
                        Purpose
                      </span>

                      <span className="detail-value">
                        {bookingData.booking.purpose}
                      </span>

                    </div>
                  )}


                  {bookingData.booking?.startTime &&
                    bookingData.booking?.endTime && (
                      <div className="detail-row">

                        <span className="detail-label">
                          Time
                        </span>

                        <span className="detail-value">
                          {formatTime(
                            bookingData.booking.startTime
                          )}{" "}
                          –{" "}
                          {formatTime(
                            bookingData.booking.endTime
                          )}
                        </span>

                      </div>
                    )}

                </div>
              )}


              <div className="verified-message">
                ✓ Your room access has been verified.
              </div>


              <button
                className="checkin-back-button"
                onClick={handleBack}
              >
                Back to SpaceIQ
              </button>

            </div>
          )}


          {/* ERROR */}

          {status === "error" && (
            <div className="checkin-state">

              <div className="error-icon">
                !
              </div>

              <div className="error-label">
                CHECK-IN NOT COMPLETED
              </div>

              <h1>Unable to Check In</h1>

              <p className="checkin-description">
                {errorMessage}
              </p>


              <div className="error-help">

                <strong>
                  Please make sure:
                </strong>

                <ul>
                  <li>
                    You are logged in to SpaceIQ.
                  </li>

                  <li>
                    You have an approved booking for
                    this room.
                  </li>

                  <li>
                    The current time is within your
                    booking period.
                  </li>

                  <li>
                    You are scanning the QR code for
                    your booked room.
                  </li>
                </ul>

              </div>


              <button
                className="checkin-back-button"
                onClick={handleBack}
              >
                Back to SpaceIQ
              </button>

            </div>
          )}

        </div>

      </main>


      {/* FOOTER */}

      <footer className="checkin-footer">
        SpaceIQ • Intelligent Resource Booking & Availability
      </footer>

    </div>
  );
}

export default CheckIn;

