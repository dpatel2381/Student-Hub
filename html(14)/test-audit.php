
<?php
require_once "auth.php";
require_once "db.php";
require_once "audit.php";

if (($_SESSION["role"] ?? "") !== "admin") {
    http_response_code(403);
    exit("Admin access required.");
}

if (logAudit($conn, "TEST_ACTION", "Testing StudentHub audit logs")) {
    echo "Audit log recorded successfully.";
} else {
    echo "Audit log could not be recorded. Check the PHP error log.";
}
?>
