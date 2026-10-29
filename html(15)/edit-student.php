
<?php
require_once "auth.php";
require_once "db.php";
require_once "audit.php";

if (!isset($_SESSION["role"]) || $_SESSION["role"] !== "admin") {
    http_response_code(403);
    exit("Access denied.");
}

$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);
if (!$id || $id < 1) {
    exit("Invalid student ID.");
}

$errors = [];

// Load the selected student.
$stmt = $conn->prepare(
    "SELECT s.id, s.user_id, u.name, u.email, u.studentid,
            u.gender, s.course, s.year_of_study, s.mobile
     FROM students s
     INNER JOIN users u ON s.user_id = u.id
     WHERE s.id = ?"
);
$stmt->bind_param("i", $id);
$stmt->execute();
$student = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$student) {
    exit("Student record not found.");
}

$name = $student["name"];
$email = $student["email"];
$studentid = $student["studentid"] ?? "";
$gender = $student["gender"] ?? "";
$course = $student["course"];
$year = (string)$student["year_of_study"];
$mobile = $student["mobile"] ?? "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = trim($_POST["name"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $studentid = trim($_POST["studentid"] ?? "");
    $gender = trim($_POST["gender"] ?? "");
    $course = trim($_POST["course"] ?? "");
    $year = trim($_POST["year"] ?? "");
    $mobile = trim($_POST["mobile"] ?? "");

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

    // Prevent duplicate email/student ID on another user.
    if (!$errors) {
        $check = $conn->prepare(
            "SELECT id FROM users
             WHERE (email = ? OR studentid = ?)
               AND id <> ?
             LIMIT 1"
        );
        $userId = (int)$student["user_id"];
        $check->bind_param("ssi", $email, $studentid, $userId);
        $check->execute();
        $check->store_result();

        if ($check->num_rows > 0) {
            $errors[] = "That email or student ID is already in use.";
        }
        $check->close();
    }

    if (!$errors) {
        try {
            $conn->begin_transaction();

            $userId = (int)$student["user_id"];

            $updateUser = $conn->prepare(
                "UPDATE users
                 SET name = ?, email = ?, studentid = ?, gender = ?
                 WHERE id = ? AND role = 'student'"
            );
            $updateUser->bind_param(
                "ssssi", $name, $email, $studentid, $gender, $userId
            );
            $updateUser->execute();

            if ($updateUser->affected_rows === 0) {
                // Zero affected rows can mean no change, so verify existence.
                $verify = $conn->prepare(
                    "SELECT id FROM users WHERE id = ? AND role = 'student'"
                );
                $verify->bind_param("i", $userId);
                $verify->execute();
                $verify->store_result();
                $exists = $verify->num_rows > 0;
                $verify->close();

                if (!$exists) {
                    throw new RuntimeException("Student account not found.");
                }
            }
            $updateUser->close();

            $updateStudent = $conn->prepare(
                "UPDATE students
                 SET course = ?, year_of_study = ?, mobile = ?
                 WHERE id = ?"
            );
            $studyYear = (int)$year;
            $updateStudent->bind_param(
                "sisi", $course, $studyYear, $mobile, $id
            );
            $updateStudent->execute();
            $updateStudent->close();

            $conn->commit();

            // Record the successful student update.
            logAudit(
                $conn,
                "EDIT_STUDENT",
                "Updated student: " . $name .
                " (Student ID: " . $studentid . ")"
            );

            header(
                "Location: students.php?message=" .
                urlencode("Student updated successfully.")
            );
            exit;
            
        } catch (Throwable $e) {
            $conn->rollback();
            error_log("Edit student failed: " . $e->getMessage());
            $errors[] = "Unable to update the student. Please try again.";
        }
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Student | StudentHub</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f4f6f9;
            padding: 30px 15px;
            color: #222;
        }
        .container {
            max-width: 650px;
            margin: auto;
            padding: 25px;
            background: white;
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
    </style>
</head>
<body>
<div class="container">
    <h1>Edit Student</h1>

    <?php if ($errors): ?>
        <div class="errors" role="alert">
            <ul>
                <?php foreach ($errors as $error): ?>
                    <li><?= htmlspecialchars($error, ENT_QUOTES, "UTF-8") ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
    <?php endif; ?>

    <form method="POST"
          action="edit-student.php?id=<?= (int)$id ?>">
        <label for="name">Full Name *</label>
        <input id="name" name="name" maxlength="100" required
               value="<?= htmlspecialchars($name, ENT_QUOTES, "UTF-8") ?>">

        <label for="email">Email *</label>
        <input id="email" name="email" type="email"
               maxlength="254" required
               value="<?= htmlspecialchars($email, ENT_QUOTES, "UTF-8") ?>">

        <label for="studentid">Student ID *</label>
        <input id="studentid" name="studentid" maxlength="30" required
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
        <input id="course" name="course" maxlength="100" required
               value="<?= htmlspecialchars($course, ENT_QUOTES, "UTF-8") ?>">

        <label for="year">Year of Study *</label>
        <select id="year" name="year" required>
            <?php for ($i = 1; $i <= 5; $i++): ?>
                <option value="<?= $i ?>"
                    <?= $year === (string)$i ? "selected" : "" ?>>
                    Year <?= $i ?>
                </option>
            <?php endfor; ?>
        </select>

        <label for="mobile">Mobile Number</label>
        <input id="mobile" name="mobile" type="tel" maxlength="20"
               value="<?= htmlspecialchars($mobile, ENT_QUOTES, "UTF-8") ?>">

        <button type="submit">Save Changes</button>
        <a class="button" href="students.php">Cancel</a>
    </form>
</div>
</body>
</html>
