
<?php
require_once "auth.php";
require_once "db.php";

if (($_SESSION["role"] ?? "") !== "admin") {
    http_response_code(403);
    exit("Access denied. Admin access is required.");
}

$sql = "
    SELECT audit_logs.id, audit_logs.action,
           audit_logs.details, audit_logs.created_at,
           users.id AS account_id
    FROM audit_logs
    LEFT JOIN users ON users.id = audit_logs.user_id
    ORDER BY audit_logs.created_at DESC
    LIMIT 100
";

$result = $conn->query($sql);

if (!$result) {
    http_response_code(500);
    exit("Unable to load audit logs.");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Audit Logs | StudentHub</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<nav>
    <div class="logo-box">StudentHub</div>
    <div class="nav-links">
        <a href="admin-dashboard.php">Admin Dashboard</a>
        <a href="dashboard.php">Overview</a>
        <a href="logout.php">Log Out</a>
    </div>
</nav>

<main>
    <div class="welcome-banner">
        <h2>Audit Logs</h2>
        <p>Recent administrative actions in StudentHub.</p>
    </div>

    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Account ID</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Date and Time</th>
                </tr>
            </thead>
            <tbody>
            <?php if ($result->num_rows === 0): ?>
                <tr>
                    <td colspan="5">No audit records found.</td>
                </tr>
            <?php else: ?>
                <?php while ($row = $result->fetch_assoc()): ?>
                    <tr>
                        <td><?= (int) $row["id"] ?></td>
                        <td>
                            <?= $row["account_id"] === null
                                ? "Unknown"
                                : (int) $row["account_id"] ?>
                        </td>
                        <td><?= htmlspecialchars($row["action"], ENT_QUOTES, "UTF-8") ?></td>
                        <td><?= htmlspecialchars($row["details"] ?? "", ENT_QUOTES, "UTF-8") ?></td>
                        <td><?= htmlspecialchars($row["created_at"], ENT_QUOTES, "UTF-8") ?></td>
                    </tr>
                <?php endwhile; ?>
            <?php endif; ?>
            </tbody>
        </table>
    </div>
</main>

<footer class="site-footer">StudentHub — Audit Logs</footer>
</body>
</html>
