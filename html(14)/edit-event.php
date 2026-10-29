
<?php
require_once "auth.php";
require_once "db.php";
require_once "audit.php";

if (($_SESSION["role"] ?? "") !== "admin") {
    http_response_code(403);
    exit("Access denied. Admin access is required.");
}

$id = filter_input(INPUT_GET, "id", FILTER_VALIDATE_INT);

if (!$id || $id < 1) {
    exit("Invalid event ID.");
}

$stmt = $conn->prepare("SELECT * FROM events WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$event = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$event) {
    exit("Event not found.");
}

$message = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $title = trim($_POST["title"] ?? "");
    $description = trim($_POST["description"] ?? "");
    $eventDate = trim($_POST["event_date"] ?? "");
    $location = trim($_POST["location"] ?? "");

    $date = DateTime::createFromFormat("Y-m-d\TH:i", $eventDate);
    $dateErrors = DateTime::getLastErrors();

    if ($title === "" || !$date ||
        ($dateErrors !== false &&
        ($dateErrors["warning_count"] > 0 || $dateErrors["error_count"] > 0)) ||
        $date->format("Y-m-d\TH:i") !== $eventDate) {
        $message = "Enter a valid title and event date.";
    } else {
        $posterName = $event["poster"];
        $savedPath = null;
        $oldPoster = null;

        try {
            if (isset($_FILES["poster"]) &&
                $_FILES["poster"]["error"] !== UPLOAD_ERR_NO_FILE) {

                if ($_FILES["poster"]["error"] !== UPLOAD_ERR_OK) {
                    throw new RuntimeException("Poster upload failed.");
                }

                if ($_FILES["poster"]["size"] > 2 * 1024 * 1024) {
                    throw new RuntimeException("Poster must be 2 MB or smaller.");
                }

                $tmp = $_FILES["poster"]["tmp_name"];
                $mime = (new finfo(FILEINFO_MIME_TYPE))->file($tmp);

                $allowed = [
                    "image/jpeg" => "jpg",
                    "image/png" => "png",
                    "image/webp" => "webp"
                ];

                if (!isset($allowed[$mime]) || getimagesize($tmp) === false) {
                    throw new RuntimeException(
                        "Use a valid JPG, PNG, or WEBP image."
                    );
                }

                $uploadDir = __DIR__ . "/uploads/event_posters/";

                if (!is_dir($uploadDir) &&
                    !mkdir($uploadDir, 0755, true)) {
                    throw new RuntimeException("Could not create poster folder.");
                }

                $posterName = bin2hex(random_bytes(16)) . "." . $allowed[$mime];
                $savedPath = $uploadDir . $posterName;

                if (!move_uploaded_file($tmp, $savedPath)) {
                    throw new RuntimeException("Could not save the poster.");
                }

                $oldPoster = $event["poster"];
            }

            $sql = "UPDATE events
                    SET title = ?, description = ?, event_date = ?,
                        location = ?, poster = ?
                    WHERE id = ?";

            $stmt = $conn->prepare($sql);
            $formattedDate = $date->format("Y-m-d H:i:s");
            $stmt->bind_param(
                "sssssi",
                $title,
                $description,
                $formattedDate,
                $location,
                $posterName,
                $id
            );
            $stmt->execute();
            logAudit($conn, "EDIT_EVENT", "Updated event ID: " . $id);
            
            $stmt->close();

            if ($oldPoster && basename($oldPoster) === $oldPoster) {
                $oldPath = __DIR__ . "/uploads/event_posters/" . $oldPoster;
                if (is_file($oldPath)) {
                    unlink($oldPath);
                }
            }

            header("Location: events.php");
            exit;

        } catch (Throwable $e) {
            if ($savedPath && is_file($savedPath)) {
                unlink($savedPath);
            }

            error_log("Edit event failed: " . $e->getMessage());
            $message = $e instanceof RuntimeException
                ? $e->getMessage()
                : "Could not update the event. Please try again.";
        }
    }
}

$displayDate = date(
    "Y-m-d\TH:i",
    strtotime($event["event_date"])
);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Edit Event - StudentHub</title>
    <link rel="stylesheet" href="styles.css">
    <style>
        .event-form {
            max-width: 650px;
            margin: 30px auto;
            padding: 25px;
            background: white;
            border-radius: 10px;
        }

        .event-form label {
            display: block;
            margin-top: 15px;
            font-weight: bold;
        }

        .event-form input,
        .event-form textarea {
            box-sizing: border-box;
            width: 100%;
            padding: 10px;
            margin-top: 6px;
        }

        .event-form button {
            margin-top: 20px;
        }

        .poster-preview {
            display: block;
            max-width: 220px;
            max-height: 160px;
            margin-top: 10px;
        }

        .message {
            color: #b00020;
        }
    </style>
</head>
<body>
<main class="event-form">
    <h1>Edit Event</h1>

    <?php if ($message !== ""): ?>
        <p class="message">
            <?= htmlspecialchars($message, ENT_QUOTES, "UTF-8") ?>
        </p>
    <?php endif; ?>

    <form method="POST" enctype="multipart/form-data">
        <label for="title">Event Title *</label>
        <input id="title" name="title" type="text" maxlength="150"
               required value="<?= htmlspecialchars(
                   $_POST["title"] ?? $event["title"],
                   ENT_QUOTES, "UTF-8"
               ) ?>">

        <label for="description">Description</label>
        <textarea id="description" name="description" rows="4"><?= htmlspecialchars(
            $_POST["description"] ?? $event["description"] ?? "",
            ENT_QUOTES, "UTF-8"
        ) ?></textarea>

        <label for="event_date">Event Date and Time *</label>
        <input id="event_date" name="event_date" type="datetime-local"
               required value="<?= htmlspecialchars(
                   $_POST["event_date"] ?? $displayDate,
                   ENT_QUOTES, "UTF-8"
               ) ?>">

        <label for="location">Location</label>
        <input id="location" name="location" type="text" maxlength="150"
               value="<?= htmlspecialchars(
                   $_POST["location"] ?? $event["location"] ?? "",
                   ENT_QUOTES, "UTF-8"
               ) ?>">

        <label for="poster">Replace Poster (optional, max 2 MB)</label>

        <?php if (!empty($event["poster"])): ?>
            <p>Current poster:</p>
            <img class="poster-preview"
                 src="uploads/event_posters/<?= rawurlencode(basename($event["poster"])) ?>"
                 alt="Current event poster">
        <?php endif; ?>

        <input id="poster" name="poster" type="file"
               accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">

        <button type="submit">Update Event</button>
        <a href="events.php">Cancel</a>
    </form>
</main>
</body>
</html>
