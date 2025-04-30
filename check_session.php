<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user'])) {
    echo json_encode(['status' => 'active', 'username' => $_SESSION['user']]);
} else {
    echo json_encode(['status' => 'inactive']);
}