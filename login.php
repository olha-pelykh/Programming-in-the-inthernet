<?php
require_once __DIR__ . '/app/core/Database.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $login = $_POST['login'] ?? '';
    $password = $_POST['password'] ?? '';

    $pdo = Database::connect();

    $stmt = $pdo->prepare("SELECT * FROM users WHERE login = :login LIMIT 1");
    $stmt->execute(['login' => $login]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && $password === $user['password']) {
        echo json_encode(["status" => "success", "message" => "успішно"]);
        
    } else {
        echo json_encode(["status" => "error", "message" => "Невірний логін або пароль"]);
    }
}
?>
