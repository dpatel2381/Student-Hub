
<?php
require_once "auth.php";
require_once "db.php";

// Only admins can manage student records.
if (!isset($_SESSION["role"]) || $_SESSION["role"] !== "admin") {
    http_response_code(403);
    exit("Access denied. Only administrators can manage students.");
}

$search = trim($_GET["search"] ?? "");
$course = trim($_GET["course"] ?? "");
$message = trim($_GET["message"] ?? "");

// Fetch available courses for the filter.
$courses = [];
$courseResult = $conn->query(
    "SELECT DISTINCT course FROM students ORDER BY course"
);

if ($courseResult) {
    while ($row = $courseResult->fetch_assoc()) {
        $courses[] = $row["course"];
    }
}

// Search by student name, email, or course.
$sql = "SELECT s.id, s.user_id, u.name, u.email,
               u.studentid, s.course, s.year_of_study, s.mobile
        FROM students s
        INNER JOIN users u ON s.user_id = u.id
        WHERE (u.name LIKE ? OR u.email LIKE ? OR s.course LIKE ?)";

if ($course !== "") {
    $sql .= " AND s.course = ?";
}

$sql .= " ORDER BY s.id DESC";

$stmt = $conn->prepare($sql);
$term = "%" . $search . "%";

if ($course !== "") {
    $stmt->bind_param("ssss", $term, $term, $term, $course);
} else {
    $stmt->bind_param("sss", $term, $term, $term);
}

$stmt->execute();
$result = $stmt->get_result();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Student Management | StudentHub</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 30px;
            background: #f4f6f9;
            color: #222;
        }
        .container {
            max-width: 1100px;
            margin: auto;
            background: white;
            padding: 24px;
            border-radius: 10px;
        }
        h1 { color: #263b80; }
        form { margin-bottom: 20px; }
        input, select, button, .button {
            padding: 10px;
            margin: 4px;
            border: 1px solid #ccc;
            border-radius: 5px;
        }
        button, .button {
            background: #263b80;
            color: white;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 18px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th { background: #263b80; color: white; }
        tr:nth-child(even) { background: #f5f5f5; }
        .message {
            background: #e5f7e8;
            padding: 12px;
            border-radius: 5px;
        }
        .table-wrap { overflow-x: auto; }
    </style>
</head>
<body>
<div class="container">
    <h1>Student Management</h1>
    <p>View, search, and filter StudentHub records.</p>

    <?php if ($message !== ""): ?>
        <p class="message">
            <?= htmlspecialchars($message, ENT_QUOTES, "UTF-8") ?>
        </p>
    <?php endif; ?>

    <p>
        <a class="button" href="add-student.php">+ Add Student</a>
        <a class="button" href="dashboard.php">Back to Dashboard</a>
    </p>

    <form method="GET" action="students.php">
        <input
            type="search"
            name="search"
            placeholder="Search name, email, or course"
            value="<?= htmlspecialchars($search, ENT_QUOTES, "UTF-8") ?>"
        >

        <select name="course">
            <option value="">All courses</option>
            <?php foreach ($courses as $item): ?>
                <option
                    value="<?= htmlspecialchars($item, ENT_QUOTES, "UTF-8") ?>"
                    <?= $course === $item ? "selected" : "" ?>
                >
                    <?= htmlspecialchars($item, ENT_QUOTES, "UTF-8") ?>
                </option>
            <?php endforeach; ?>
        </select>

        <button type="submit">Search / Filter</button>
        <a class="button" href="students.php">Clear</a>
    </form>

    <div class="table-wrap">
    <table>
        <thead>
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Student ID</th>
            <th>Course</th>
            <th>Year</th>
            <th>Mobile</th>
            <th>Actions</th>
        </tr>
        </thead>
        <tbody>
        <?php if ($result && $result->num_rows > 0): ?>
            <?php while ($student = $result->fetch_assoc()): ?>
                <tr>
                    <td><?= (int)$student["id"] ?></td>
                    <td><?= htmlspecialchars($student["name"], ENT_QUOTES, "UTF-8") ?></td>
                    <td><?= htmlspecialchars($student["email"], ENT_QUOTES, "UTF-8") ?></td>
                    <td><?= htmlspecialchars($student["studentid"] ?? "", ENT_QUOTES, "UTF-8") ?></td>
                    <td><?= htmlspecialchars($student["course"], ENT_QUOTES, "UTF-8") ?></td>
                    <td><?= (int)$student["year_of_study"] ?></td>
                    <td><?= htmlspecialchars($student["mobile"] ?? "", ENT_QUOTES, "UTF-8") ?></td>
                    <td>
                        <a href="edit-student.php?id=<?= (int)$student["id"] ?>">Edit</a>
                        |
                        <a
                            href="delete-student.php?id=<?= (int)$student["id"] ?>"
                            onclick="return confirm('Are you sure you want to delete this student record?');"
                        >Delete</a>
                    </td>
                </tr>
            <?php endwhile; ?>
        <?php else: ?>
            <tr>
                <td colspan="8">No student records found.</td>
            </tr>
        <?php endif; ?>
        </tbody>
    </table>
    </div>
</div>
</body>
</html>

<?php
$stmt->close();
?>
