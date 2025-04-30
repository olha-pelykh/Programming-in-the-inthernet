<?php
require_once 'data/db.php';

class User
{
    public function findByLogin($login)
    {
        global $pdo;
        $stmt = $pdo->prepare("SELECT * FROM users WHERE login = :login LIMIT 1");
        $stmt->execute(['login' => $login]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
