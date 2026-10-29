
<?php
require_once "auth.php";
require_once "db.php";

if (($_SESSION["role"] ?? "") !== "admin") {
    http_response_code(403);
    exit("Access denied. Admin access is required.");
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    exit("Invalid request. Please use the Delete button.");
}

$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    header("Location: events.php");
    exit;
}

try {
    $stmt = $conn->prepare(
        "SELECT poster FROM events WHERE id = ?"
    );
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $event = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$event) {
        header("Location: events.php");
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM events WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $stmt->close();

    // Delete the poster file only after the database deletion succeeds.
    if (!empty($event["poster"]) &&
        basename($event["poster"]) === $event["poster"]) {

        $posterPath = __DIR__ . "/uploads/event_posters/" . $event["poster"];

        if (is_file($posterPath)) {
            unlink($posterPath);
        }
    }

    header("Location: events.php");
    exit;

} catch (Throwable $e) {
    error_log("Delete event failed: " . $e->getMessage());

    http_response_code(500);
    exit("Unable to delete the event. Please check the database.");
}
