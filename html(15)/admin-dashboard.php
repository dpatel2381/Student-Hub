
<?php
require_once "auth.php";
require_once "db.php";

// Only admins can access this page.
if (($_SESSION["role"] ?? "") !== "admin") {
    http_response_code(403);
    exit("Access denied. Admin access is required.");
}

// Get live counts from the database.
$studentCount = 0;
$eventCount = 0;
$registrationCount = 0;

$studentResult = $conn->query("SELECT COUNT(*) AS total FROM students");
if ($studentResult) {
    $studentCount = (int) $studentResult->fetch_assoc()["total"];
}

$eventResult = $conn->query("SELECT COUNT(*) AS total FROM events");
if ($eventResult) {
    $eventCount = (int) $eventResult->fetch_assoc()["total"];
}

$registrationResult = $conn->query(
    "SELECT COUNT(*) AS total FROM registrations"
);
if ($registrationResult) {
    $registrationCount = (int) $registrationResult->fetch_assoc()["total"];
}

$adminName = htmlspecialchars(
    $_SESSION["name"] ?? "Admin",
    ENT_QUOTES,
    "UTF-8"
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard | StudentHub</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <nav aria-label="Main">
        <div class="logo-box">StudentHub</div>
        <div class="nav-links">
            <a href="dashboard.php">Overview</a>
            <a href="students.php">Manage Students</a>
            <a href="events.php">Manage Events</a>
            <a href="logout.php">Log Out</a>
        </div>
    </nav>

    <main>
        <div class="welcome-banner">
            <h2>Admin Dashboard</h2>
            <p>Welcome, <?= $adminName ?>! Here's your system overview.</p>
        </div>

        <div class="dash-grid">
            <section class="dash-card">
                <div class="dash-card-header">Total Students</div>
                <ul>
                    <li><?= $studentCount ?> student records</li>
                    <li><a href="students.php">Manage Students →</a></li>
                </ul>
            </section>

            <section class="dash-card">
                <div class="dash-card-header">Total Events</div>
                <ul>
                    <li><?= $eventCount ?> events</li>
                    <li><a href="events.php">Manage Events →</a></li>
                </ul>
            </section>

            <section class="dash-card">
                <div class="dash-card-header">Registrations</div>
                <ul>
                    <li><?= $registrationCount ?> registrations</li>
                </ul>
            </section>

            <section class="dash-card">
                <div class="dash-card-header">Administration</div>
                <ul>
                    <li><a href="dashboard.php">StudentHub Overview</a></li>
                    <li><a href="audit-logs.php">View Audit Logs</a></li>
                </ul>
            </section>
        </div>
    </main>

    <footer class="site-footer">
        StudentHub — Administration Panel
    </footer>
</body>
</html>
