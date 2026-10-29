
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
$id = filter_var($input["id"] ?? null, FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    respond(400, ["success" => false, "message" => "Invalid event ID."]);
}

try {
    $stmt = $conn->prepare("DELETE FROM events WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    if ($stmt->affected_rows !== 1) {
        $stmt->close();
        respond(404, ["success" => false, "message" => "Event not found."]);
    }

    $stmt->close();

    respond(200, [
        "success" => true,
        "message" => "Event deleted successfully."
    ]);

} catch (Throwable $e) {
    error_log("Delete event API failed: " . $e->getMessage());
    respond(500, ["success" => false, "message" => "Could not delete event."]);
}
