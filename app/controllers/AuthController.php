<?php
require_once 'models/User.php';

class AuthController
{
    public function login()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $login = $_POST['login'] ?? '';
            $password = $_POST['password'] ?? '';

            $userModel = new User();
            $user = $userModel->findByLogin($login);

            if ($user && $user['password'] === $password) {
                echo "Авторизація пройшла успішно 🌟";
            } else {
                echo "Невірний логін або пароль 💔";
            }
        }
    }
}
