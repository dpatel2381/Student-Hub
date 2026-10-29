
<?php
require_once "../auth.php";
require_once "../db.php";

header("Content-Type: application/json; charset=UTF-8");
header("Cache-Control: no-store");

if (($_SESSION["role"] ?? "") !== "admin") {
    http_response_code(403);
    echo json_encode([
        "success" => false,
        "message" => "Admin access is required."
    ]);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    http_response_code(405);
    header("Allow: GET");
    echo json_encode([
        "success" => false,
        "message" => "Only GET requests are supported by this endpoint."
    ]);
    exit;
}

try {
    $sql = "SELECT id, title, description, event_date, location, poster
            FROM events
            ORDER BY event_date ASC";

    $result = $conn->query($sql);
    $events = [];

    while ($row = $result->fetch_assoc()) {
        $events[] = $row;
    }

    echo json_encode([
        "success" => true,
        "count" => count($events),
        "data" => $events
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log("Events API failed: " . $e->getMessage());
    http_response_code(500);

    echo json_encode([
        "success" => false,
        "message" => "Unable to retrieve events."
    ]);
}
