
<?php
require_once "db.php";

function e($value) {
    return htmlspecialchars(
        $value,
        ENT_QUOTES | ENT_SUBSTITUTE,
        "UTF-8"
    );
}

function showMessage($message) {
    echo "<!DOCTYPE html><html lang='en'><head>
    <meta charset='UTF-8'>
    <meta name='viewport' content='width=device-width, initial-scale=1'>
    <title>StudentHub Registration</title>
    <link rel='stylesheet' href='styles.css'>
    </head><body><main class='auth-shell'><section class='auth-card'>
    <h2>StudentHub Registration</h2><p>" . e($message) . "</p>
    <a href='register.html'>Back to Registration</a>
    </section></main></body></html>";
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    header("Location: register.html");
    exit;
}

$name = trim($_POST["fullname"] ?? "");
$email = trim($_POST["email"] ?? "");
$mobile = trim($_POST["mobile"] ?? "");
$studentid = trim($_POST["studentid"] ?? "");
$course = trim($_POST["course"] ?? "");
$year = $_POST["year"] ?? "";
$gender = $_POST["gender"] ?? "";
$password = $_POST["password"] ?? "";
$confirm = $_POST["confirm-password"] ?? "";

if (
    $name === "" || strlen($name) > 100 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($email) > 254 ||
    !preg_match('/^[6-9][0-9]{9}$/', $mobile) ||
    $studentid === "" || strlen($studentid) > 30 ||
    $course === "" || strlen($course) > 100 ||
    !in_array((string)$year, ["1","2","3","4","5"], true) ||
    !in_array($gender, ["Male","Female","Other"], true)
) {
    showMessage("Please check all your registration details.");
}

if (
    strlen($password) < 8 ||
    !preg_match('/[A-Z]/', $password) ||
    !preg_match('/[a-z]/', $password) ||
    !preg_match('/[0-9]/', $password) ||
    !preg_match('/[@$!%*?&]/', $password)
) {
    showMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
    );
}

if ($password !== $confirm) {
    showMessage("Passwords do not match.");
}

// Check duplicate email or student ID.
$check = $conn->prepare(
    "SELECT id FROM users WHERE email = ? OR studentid = ? LIMIT 1"
);
$check->bind_param("ss", $email, $studentid);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    $check->close();
    showMessage("That email or Student ID is already registered.");
}
$check->close();

// Store a hash, never the original password.
$hash = password_hash($password, PASSWORD_DEFAULT);

$conn->begin_transaction();

try {
    $stmt = $conn->prepare(
        "INSERT INTO users (name, email, password, role, studentid, gender)
         VALUES (?, ?, ?, 'student', ?, ?)"
    );
    $stmt->bind_param(
        "sssss", $name, $email, $hash, $studentid, $gender
    );
    $stmt->execute();
    $userId = $conn->insert_id;
    $stmt->close();

    $yearNumber = (int)$year;

    $student = $conn->prepare(
        "INSERT INTO students (user_id, course, year_of_study, mobile)
         VALUES (?, ?, ?, ?)"
    );
    $student->bind_param(
        "isis", $userId, $course, $yearNumber, $mobile
    );
    $student->execute();
    $student->close();

    $conn->commit();
    $conn->close();

    showMessage("Registration successful! Your account has been created. You can now go to the login page.");
} catch (Throwable $ex) {
    $conn->rollback();
    $conn->close();

    // Log technical details privately on the server, not to the visitor.
    error_log("StudentHub registration failed: " . $ex->getMessage());
    showMessage("Registration could not be completed. Please check your details or contact the administrator.");
}
?>
