<?php
die('Access denied!');
require_once __DIR__ . '../app/core/Router.php';
try{
    $router = new Router();
    $router->handleRequest();
} catch (Exception $e) {
    echo "Помилка підключення до бази даних: " . $e->getMessage();
    exit;
}

?>