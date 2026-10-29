
<?php
function logAudit(mysqli $conn, string $action, string $details = ""): bool
{
    $userId = isset($_SESSION["user_id"])
        ? (int) $_SESSION["user_id"]
        : null;

    $stmt = $conn->prepare(
        "INSERT INTO audit_logs (user_id, action, details)
         VALUES (?, ?, ?)"
    );

    if (!$stmt) {
        error_log("Audit log preparation failed: " . $conn->error);
        return false;
    }

    $stmt->bind_param("iss", $userId, $action, $details);

    if (!$stmt->execute()) {
        error_log("Audit log insertion failed: " . $stmt->error);
        $stmt->close();
        return false;
    }

    $stmt->close();
    return true;
}
?>
