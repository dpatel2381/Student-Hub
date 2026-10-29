
<?php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$timeout = 1800; // 30 minutes

if (!isset($_SESSION["user_id"])) {
    header("Location: login.html");
    exit;
}

if (
    isset($_SESSION["last_activity"]) &&
    time() - $_SESSION["last_activity"] > $timeout
) {
    session_unset();
    session_destroy();

    header("Location: login.html?expired=1");
    exit;
}

$_SESSION["last_activity"] = time();
