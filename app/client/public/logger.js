// Gets the current Unix timestamp
function getCurrentUTCTimestamp(date) {
  return Math.floor((date || new Date()).getTime() / 1000);
}

// Gets the unix timestamp of the hour
// For a current time of 19:15, returns the timestamp of 19:00
function getCurrentUTCHourTimestamp() {
  const date = new Date();
  date.setUTCMinutes(0);
  date.setUTCSeconds(0);
  date.setUTCMilliseconds(0);
  return getCurrentUTCTimestamp(date);
}

const PULSE_API_ENDPOINT = "/api/v1/usage-pulse";

/**
 * Sends HTTP pulse to the server, when beaconAPI is not available.
 * Fire and forget.
 */
function sendHTTPPulse() {
  fetch(PULSE_API_ENDPOINT, {
    method: "POST",
    credentials: "same-origin",
  })
    .then(() => {
      // Fire and forget
    })
    .catch(() => {
      // Ignore errors; fire and forget
    });
}

/**
 * Sends a usage-pulse to the server using the Beacon API.
 * If the Beacon API is not available, falls back to a standard fetch.
 * Note: Only sends pulse when user is on "/app/" pages: editor and viewer.
 */
function sendPulse() {
  if (window.location.href.includes("/app/")) {
    navigator.sendBeacon(PULSE_API_ENDPOINT, "") || sendHTTPPulse();
  }
}

// Checks if the it is time to send another pulse
function shouldSendPulse() {
  const timestamp = getCurrentUTCTimestamp();
  return NEXT_LOGGING_HOUR < timestamp;
}

function addActivityListener() {
  window.document.body.addEventListener("pointerdown", punchIn);
}
function removeActivityListener() {
  window.document.body.removeEventListener("pointerdown", punchIn);
}

// Removes event listeners and adds them just in time for the next pulse
function scheduleNextPunchIn() {
  const timestamp = getCurrentUTCTimestamp();
  const startListentingIn = NEXT_LOGGING_HOUR - timestamp - 2;

  // If we don't have much time until TTL expires;
  // Don't bother removing listener
  if (startListentingIn <= 10) return;

  // Remove all listeners for now.
  removeActivityListener();

  // Add listeners 2 seconds before the next hour begins
  setTimeout(addActivityListener, startListentingIn * 1000);
}

LAST_LOGGED_HOUR = 0; // The last time we logged
NEXT_LOGGING_HOUR = 0; // The next time we should log

function punchIn() {
  if (!LAST_LOGGED_HOUR) {
    // When this is the first time we're logging
    LAST_LOGGED_HOUR = getCurrentUTCHourTimestamp();
    NEXT_LOGGING_HOUR = LAST_LOGGED_HOUR + 3600;
  } else {
    // Make sure it is time to send the pulse again
    if (!shouldSendPulse) return;
    LAST_LOGGED_HOUR = NEXT_LOGGING_HOUR;
    NEXT_LOGGING_HOUR = LAST_LOGGED_HOUR + 3600;
  }
  sendPulse();
  scheduleNextPunchIn();
}

window.addEventListener("DOMContentLoaded", punchIn);
