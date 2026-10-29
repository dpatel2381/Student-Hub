
<?php
session_start();
require_once "db.php";

// Session timeout: 30 minutes of inactivity
$timeout = 1800;

if (isset($_SESSION["last_activity"]) &&
    time() - $_SESSION["last_activity"] > $timeout) {
    session_unset();
    session_destroy();
    session_start();
}

$_SESSION["last_activity"] = time();

$error = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $email = trim($_POST["email"] ?? "");
    $password = $_POST["password"] ?? "";

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) ||
        $password === "") {
        $error = "Enter a valid email and password.";
    } else {
        $stmt = $conn->prepare(
            "SELECT id, name, email, password, role
             FROM users WHERE email = ? LIMIT 1"
        );

        if (!$stmt) {
            $error = "Unable to process login right now.";
        } else {
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            $user = $result->fetch_assoc();
            $stmt->close();

            if ($user && password_verify(
                $password, $user["password"]
            )) {
                // Prevent session fixation
                session_regenerate_id(true);

                $_SESSION["user_id"] = $user["id"];
                $_SESSION["user_name"] = $user["name"];
                $_SESSION["user_email"] = $user["email"];
                $_SESSION["role"] = $user["role"] ?? "student";
                $_SESSION["last_activity"] = time();

                header("Location: dashboard.php");
                exit;
            } else {
                // Avoid revealing whether the email exists
                $error = "Invalid email or password.";
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>StudentHub Login</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <main>
        <h1>StudentHub Login</h1>

        <?php if ($error !== ""): ?>
            <p role="alert" style="color: #b00020;">
                <?= htmlspecialchars($error, ENT_QUOTES, "UTF-8") ?>
            </p>
        <?php endif; ?>

        <form action="login.php" method="POST">
            <label for="email">Email</label>
            <input type="email" id="email" name="email"
                   required autocomplete="username">

            <label for="password">Password</label>
            <input type="password" id="password" name="password"
                   required autocomplete="current-password">

            <button type="submit">Log In</button>
        </form>

        <p><a href="register.html">Create an account</a></p>
    </main>
</body>
</html>
