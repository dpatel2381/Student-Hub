
<?php
require_once "../auth.php";
require_once "../db.php";

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");

function respond($status, $data) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (($_SESSION["role"] ?? "") !== "admin") {
    respond(403, ["success" => false, "message" => "Admin access required."]);
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Allow: POST");
    respond(405, ["success" => false, "message" => "Use POST."]);
}

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    respond(400, ["success" => false, "message" => "Invalid JSON body."]);
}

$id = filter_var($input["id"] ?? 0, FILTER_VALIDATE_INT);
$title = trim($input["title"] ?? "");
$description = trim($input["description"] ?? "");
$eventDate = trim($input["event_date"] ?? "");
$location = trim($input["location"] ?? "");

$date = DateTime::createFromFormat("Y-m-d\TH:i", $eventDate);
$dateErrors = DateTime::getLastErrors();

if ($title === "" || strlen($title) > 150 ||
    !$date ||
    ($dateErrors !== false &&
    ($dateErrors["warning_count"] > 0 || $dateErrors["error_count"] > 0)) ||
    $date->format("Y-m-d\TH:i") !== $eventDate) {
    respond(422, ["success" => false, "message" => "Enter a valid title and event date."]);
}

try {
    $formattedDate = $date->format("Y-m-d H:i:s");

    if ($id && $id > 0) {
        $stmt = $conn->prepare(
            "UPDATE events
             SET title = ?, description = ?, event_date = ?, location = ?
             WHERE id = ?"
        );
        $stmt->bind_param("ssssi", $title, $description, $formattedDate, $location, $id);
        $stmt->execute();

        if ($stmt->affected_rows === 0) {
            $check = $conn->prepare("SELECT id FROM events WHERE id = ?");
            $check->bind_param("i", $id);
            $check->execute();
            $exists = $check->get_result()->num_rows > 0;
            $check->close();
            $stmt->close();

            if (!$exists) {
                respond(404, ["success" => false, "message" => "Event not found."]);
            }
        } else {
            $stmt->close();
        }

        respond(200, ["success" => true, "message" => "Event updated."]);
    } else {
        $stmt = $conn->prepare(
            "INSERT INTO events (title, description, event_date, location)
             VALUES (?, ?, ?, ?)"
        );
        $stmt->bind_param("ssss", $title, $description, $formattedDate, $location);
        $stmt->execute();
        $newId = $conn->insert_id;
        $stmt->close();

        respond(201, [
            "success" => true,
            "message" => "Event created.",
            "id" => $newId
        ]);
    }
} catch (Throwable $e) {
    error_log("Save event API failed: " . $e->getMessage());
    respond(500, ["success" => false, "message" => "Could not save event."]);
}
