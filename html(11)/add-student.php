
<?php
require_once "auth.php";
require_once "db.php";

if (!isset($_SESSION["role"]) || $_SESSION["role"] !== "admin") {
    http_response_code(403);
    exit("Access denied. Admin access is required.");
}

$errors = [];
$name = "";
$email = "";
$studentid = "";
$gender = "";
$course = "";
$year = "";
$mobile = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = trim($_POST["name"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $studentid = trim($_POST["studentid"] ?? "");
    $gender = trim($_POST["gender"] ?? "");
    $course = trim($_POST["course"] ?? "");
    $year = trim($_POST["year"] ?? "");
    $mobile = trim($_POST["mobile"] ?? "");
    $password = $_POST["password"] ?? "";

    // Validate the submitted information.
    if ($name === "" || strlen($name) > 100) {
        $errors[] = "Enter a name of up to 100 characters.";
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL) ||
        strlen($email) > 254) {
        $errors[] = "Enter a valid email address.";
    }

    if ($studentid === "" || strlen($studentid) > 30) {
        $errors[] = "Enter a student ID of up to 30 characters.";
    }

    if ($course === "" || strlen($course) > 100) {
        $errors[] = "Enter a course of up to 100 characters.";
    }

    if (!ctype_digit($year) ||
        (int)$year < 1 || (int)$year > 5) {
        $errors[] = "Study year must be between 1 and 5.";
    }

    if ($mobile !== "" &&
        !preg_match('/^[0-9+\-\s]{7,20}$/', $mobile)) {
        $errors[] = "Enter a valid mobile number.";
    }

    if ($gender !== "" &&
        !in_array($gender, ["Male", "Female", "Other"], true)) {
        $errors[] = "Select a valid gender.";
    }

    if (strlen($password) < 8) {
        $errors[] = "Password must contain at least 8 characters.";
    }

    if (strlen($password) > 72) {
        $errors[] = "Password must not exceed 72 bytes.";
    }

    if (!$errors) {
        // Check for duplicate email or student ID.
        $check = $conn->prepare(
            "SELECT id FROM users
             WHERE email = ? OR studentid = ? LIMIT 1"
        );
        $check->bind_param("ss", $email, $studentid);
        $check->execute();
        $check->store_result();

        if ($check->num_rows > 0) {
            $errors[] = "That email or student ID is already registered.";
        }
        $check->close();
    }

    if (!$errors) {
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        try {
            $conn->begin_transaction();

            // Create a normal student account, never an admin account.
            $role = "student";

            $insertUser = $conn->prepare(
                "INSERT INTO users
                 (name, email, password, role, studentid, gender)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );

            $insertUser->bind_param(
                "ssssss",
                $name,
                $email,
                $hashedPassword,
                $role,
                $studentid,
                $gender
            );

            $insertUser->execute();
            $userId = $conn->insert_id;
            $insertUser->close();

            // Link the student details to the new user.
            $insertStudent = $conn->prepare(
                "INSERT INTO students
                 (user_id, course, year_of_study, mobile)
                 VALUES (?, ?, ?, ?)"
            );

            $studyYear = (int)$year;

            $insertStudent->bind_param(
                "isis",
                $userId,
                $course,
                $studyYear,
                $mobile
            );

            $insertStudent->execute();
            $insertStudent->close();

            $conn->commit();

            header(
                "Location: students.php?message=" .
                urlencode("Student added successfully.")
            );
            exit;

        } catch (Throwable $e) {
            $conn->rollback();
            error_log("Add student failed: " . $e->getMessage());
            $errors[] =
                "Unable to add the student. Check the database fields and try again.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Add Student | StudentHub</title>

    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f4f6f9;
            margin: 0;
            padding: 30px 15px;
            color: #222;
        }

        .container {
            max-width: 650px;
            margin: auto;
            background: white;
            padding: 25px;
            border-radius: 10px;
        }

        h1 { color: #263b80; }

        label {
            display: block;
            margin-top: 15px;
            font-weight: bold;
        }

        input, select {
            box-sizing: border-box;
            width: 100%;
            padding: 11px;
            margin-top: 6px;
            border: 1px solid #ccc;
            border-radius: 5px;
        }

        button, .button {
            display: inline-block;
            margin-top: 20px;
            padding: 11px 16px;
            background: #263b80;
            color: white;
            border: none;
            border-radius: 5px;
            text-decoration: none;
            cursor: pointer;
        }

        .errors {
            background: #ffe8e8;
            color: #8b0000;
            padding: 12px 30px;
            border-radius: 5px;
        }

        .hint {
            color: #555;
            font-size: 14px;
        }
    </style>
</head>

<body>
<div class="container">
    <h1>Add Student</h1>
    <p>Enter the student's account and academic details.</p>

    <?php if ($errors): ?>
        <div class="errors" role="alert">
            <ul>
                <?php foreach ($errors as $error): ?>
                    <li><?= htmlspecialchars($error, ENT_QUOTES, "UTF-8") ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <form method="POST" action="add-student.php">
        <label for="name">Full Name *</label>
        <input id="name" name="name" type="text"
               maxlength="100" required
               value="<?= htmlspecialchars($name, ENT_QUOTES, "UTF-8") ?>">

        <label for="email">Email *</label>
        <input id="email" name="email" type="email"
               maxlength="254" required
               value="<?= htmlspecialchars($email, ENT_QUOTES, "UTF-8") ?>">

        <label for="studentid">Student ID *</label>
        <input id="studentid" name="studentid" type="text"
               maxlength="30" required
               value="<?= htmlspecialchars($studentid, ENT_QUOTES, "UTF-8") ?>">

        <label for="gender">Gender</label>
        <select id="gender" name="gender">
            <option value="">Prefer not to say</option>
            <?php foreach (["Male", "Female", "Other"] as $option): ?>
                <option value="<?= $option ?>"
                    <?= $gender === $option ? "selected" : "" ?>>
                    <?= $option ?>
                </option>
            <?php endforeach; ?>
        </select>

        <label for="course">Course *</label>
        <input id="course" name="course" type="text"
               maxlength="100" required
               placeholder="e.g. Information Technology"
               value="<?= htmlspecialchars($course, ENT_QUOTES, "UTF-8") ?>">

        <label for="year">Year of Study *</label>
        <select id="year" name="year" required>
            <option value="">Select year</option>
            <?php for ($i = 1; $i <= 5; $i++): ?>
                <option value="<?= $i ?>"
                    <?= $year === (string)$i ? "selected" : "" ?>>
                    Year <?= $i ?>
                </option>
            <?php endfor; ?>
        </select>

        <label for="mobile">Mobile Number</label>
        <input id="mobile" name="mobile" type="tel"
               maxlength="20"
               value="<?= htmlspecialchars($mobile, ENT_QUOTES, "UTF-8") ?>">

        <label for="password">Initial Password *</label>
        <input id="password" name="password" type="password"
               minlength="8" maxlength="72" required
               autocomplete="new-password">
        <p class="hint">Use at least 8 characters. The password will be hashed before storage.</p>

        <button type="submit">Add Student</button>
        <a class="button" href="students.php">Cancel</a>
    </form>
</div>
</body>
</html>
