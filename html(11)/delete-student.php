
<?php
require_once "auth.php";
require_once "db.php";

if (!isset($_SESSION["role"]) || $_SESSION["role"] !== "admin") {
    http_response_code(403);
    exit("Access denied. Admin access is required.");
}

// Deletion must use POST, not a GET link.
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    exit("Invalid request. Use the delete form.");
}

$id = filter_input(INPUT_POST, "id", FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    header("Location: students.php?message=" . urlencode("Invalid student ID."));
    exit;
}

try {
    $conn->begin_transaction();

    // Find the linked user, but only delete regular student accounts.
    $find = $conn->prepare(
        "SELECT s.user_id
         FROM students s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.id = ? AND u.role = 'student'
         FOR UPDATE"
    );
    $find->bind_param("i", $id);
    $find->execute();
    $record = $find->get_result()->fetch_assoc();
    $find->close();

    if (!$record) {
        $conn->rollback();
        header("Location: students.php?message=" . urlencode("Student record not found."));
        exit;
    }

    $userId = (int)$record["user_id"];

    $deleteStudent = $conn->prepare(
        "DELETE FROM students WHERE id = ?"
    );
    $deleteStudent->bind_param("i", $id);
    $deleteStudent->execute();
    $deleteStudent->close();

    // Delete the linked user account as well.
    $deleteUser = $conn->prepare(
        "DELETE FROM users WHERE id = ? AND role = 'student'"
    );
    $deleteUser->bind_param("i", $userId);
    $deleteUser->execute();

    if ($deleteUser->affected_rows !== 1) {
        $deleteUser->close();
        throw new RuntimeException("The linked student account could not be deleted.");
    }
    $deleteUser->close();

    $conn->commit();

    header("Location: students.php?message=" . urlencode("Student deleted successfully."));
    exit;

} catch (Throwable $e) {
    $conn->rollback();
    error_log("Delete student failed: " . $e->getMessage());

    header("Location: students.php?message=" . urlencode("Unable to delete student. Check related database records."));
    exit;
}
