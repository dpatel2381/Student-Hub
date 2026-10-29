
<?php
require_once "auth.php";
require_once "db.php";

// Only admins can manage events
if (!isset($_SESSION["role"]) || $_SESSION["role"] !== "admin") {
    http_response_code(403);
    exit("Access denied. Admin access is required.");
}

$search = trim($_GET["search"] ?? "");

if ($search !== "") {
    $stmt = $conn->prepare(
        "SELECT id, title, description, event_date, location, poster
         FROM events
         WHERE title LIKE ? OR location LIKE ?
         ORDER BY event_date ASC"
    );

    $term = "%" . $search . "%";
    $stmt->bind_param("ss", $term, $term);
} else {
    $stmt = $conn->prepare(
        "SELECT id, title, description, event_date, location, poster
         FROM events
         ORDER BY event_date ASC"
    );
}

$stmt->execute();
$events = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Events - StudentHub</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .events-container {
            max-width: 1100px;
            margin: 30px auto;
            padding: 20px;
        }

        .event-card {
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 18px;
            margin: 15px 0;
            background: #fff;
        }

        .event-poster {
            max-width: 220px;
            max-height: 160px;
            object-fit: cover;
            display: block;
            margin: 10px 0;
        }

        .event-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .event-actions a,
        .add-event {
            display: inline-block;
            padding: 9px 14px;
            border-radius: 5px;
            text-decoration: none;
            background: #2457c5;
            color: white;
        }

        .search-form {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .search-form input {
            padding: 10px;
            min-width: 220px;
        }
    </style>
</head>
<body>

<div class="events-container">
    <h1>Manage Events</h1>

    <p>
        <a class="add-event" href="add-event.php">+ Add New Event</a>
    </p>

    <form class="search-form" method="GET" action="events.php">
        <input
            type="search"
            name="search"
            placeholder="Search by title or location"
            value="<?= htmlspecialchars($search, ENT_QUOTES, 'UTF-8') ?>"
        >
        <button type="submit">Search</button>
        <a href="events.php">Clear</a>
    </form>

    <?php if ($events->num_rows > 0): ?>
        <?php while ($event = $events->fetch_assoc()): ?>
            <div class="event-card">
                <h2>
                    <?= htmlspecialchars($event["title"], ENT_QUOTES, 'UTF-8') ?>
                </h2>

                <p>
                    <strong>Date:</strong>
                    <?= htmlspecialchars($event["event_date"], ENT_QUOTES, 'UTF-8') ?>
                </p>

                <p>
                    <strong>Location:</strong>
                    <?= htmlspecialchars($event["location"] ?? "Not specified", ENT_QUOTES, 'UTF-8') ?>
                </p>

                <p>
                    <?= nl2br(htmlspecialchars($event["description"] ?? "", ENT_QUOTES, 'UTF-8')) ?>
                </p>

                <?php if (!empty($event["poster"])): ?>
                    <img
                        class="event-poster"
                        src="uploads/event_posters/<?= rawurlencode(basename($event["poster"])) ?>"
                        alt="Event poster"
                    >
                <?php endif; ?>

                <div class="event-actions">
                    <a href="edit-event.php?id=<?= (int)$event["id"] ?>">Edit</a>

                    <form method="POST" action="delete-event.php"
                          onsubmit="return confirm('Delete this event?');">
                        <input type="hidden" name="id"
                               value="<?= (int)$event["id"] ?>">
                        <button type="submit">Delete</button>
                    </form>
                </div>
            </div>
        <?php endwhile; ?>
    <?php else: ?>
        <p>No events found. Add an event to get started.</p>
    <?php endif; ?>

    <?php $stmt->close(); ?>
</div>

</body>
</html>
