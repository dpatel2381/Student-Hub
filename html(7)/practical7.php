
<?php
$message = "";
$messageType = "";
$name = "";
$email = "";
$subject = "";
$details = "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = trim($_POST["name"] ?? "");
    $email = trim($_POST["email"] ?? "");
    $subject = trim($_POST["subject"] ?? "");
    $details = trim($_POST["details"] ?? "");

    $errors = [];

    if ($name === "" || strlen($name) > 100) {
        $errors[] = "Enter a name (maximum 100 characters).";
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Enter a valid email address.";
    }

    if ($subject === "" || strlen($subject) > 150) {
        $errors[] = "Enter a subject (maximum 150 characters).";
    }

    if ($details === "" || strlen($details) > 3000) {
        $errors[] = "Enter your message (maximum 3000 characters).";
    }

    if (empty($errors)) {
        $dataDir = __DIR__ . "/data";
        $file = $dataDir . "/contacts.csv";

        if (!is_dir($dataDir) &&
            !mkdir($dataDir, 0755, true)) {
            $errors[] = "Unable to create the data folder.";
        } else {
            $handle = fopen($file, "a");

            if ($handle === false) {
                $errors[] = "Unable to save your message.";
            } else {
                if (flock($handle, LOCK_EX)) {
                    if (filesize($file) === 0) {
                        fputcsv($handle, [
                            "Date", "Name", "Email",
                            "Subject", "Message"
                        ]);
                    }

                    $saved = fputcsv($handle, [
                        date("Y-m-d H:i:s"),
                        $name,
                        $email,
                        $subject,
                        $details
                    ]);

                    fflush($handle);
                    flock($handle, LOCK_UN);

                    if ($saved !== false) {
                        $message = "Your message was submitted successfully!";
                        $messageType = "success";
                        $name = $email = $subject = $details = "";
                    } else {
                        $errors[] = "Unable to save your message.";
                    }
                } else {
                    $errors[] = "Unable to lock the data file.";
                }

                fclose($handle);
            }
        }
    }

    if (!empty($errors)) {
        $message = implode(" ", $errors);
        $messageType = "error";
    }
}

function e($value) {
    return htmlspecialchars(
        $value,
        ENT_QUOTES | ENT_SUBSTITUTE,
        "UTF-8"
    );
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>StudentHub - Contact Form</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f2f5fa;
            margin: 0;
            padding: 30px 15px;
        }
        .container {
            max-width: 600px;
            margin: auto;
            padding: 25px;
            background: white;
            border-radius: 12px;
        }
        label {
            display: block;
            margin-top: 15px;
            font-weight: bold;
        }
        input, textarea {
            box-sizing: border-box;
            width: 100%;
            padding: 11px;
            margin-top: 6px;
        }
        button {
            margin-top: 20px;
            padding: 12px 18px;
            background: #2457c5;
            color: white;
            border: 0;
            border-radius: 5px;
            cursor: pointer;
        }
        .success { color: #176b35; }
        .error { color: #b42318; }
    </style>
</head>
<body>
<div class="container">
    <h1>StudentHub Contact Form</h1>
    <p>Send a question or message to the StudentHub team.</p>

    <?php if ($message !== ""): ?>
        <p class="<?= e($messageType) ?>" role="status">
            <?= e($message) ?>
        </p>
    <?php endif; ?>

    <form method="POST" action="">
        <label for="name">Full name</label>
        <input id="name" name="name" type="text"
               maxlength="100" required
               value="<?= e($name) ?>">

        <label for="email">Email address</label>
        <input id="email" name="email" type="email"
               maxlength="254" required
               value="<?= e($email) ?>">

        <label for="subject">Subject</label>
        <input id="subject" name="subject" type="text"
               maxlength="150" required
               value="<?= e($subject) ?>">

        <label for="details">Message</label>
        <textarea id="details" name="details"
                  maxlength="3000" rows="5"
                  required><?= e($details) ?></textarea>

        <button type="submit">Submit Message</button>
    </form>

    <p><a href="index.html">Back to StudentHub Home</a></p>
</div>
</body>
</html>
