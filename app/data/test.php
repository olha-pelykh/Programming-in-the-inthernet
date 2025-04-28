<?php
$path = __DIR__ . '/data/test.json';

if (!is_dir(dirname($path))) {
    mkdir(dirname($path), 0777, true);
}


$testData = ['test' => 'working'];
if (file_put_contents($path, json_encode($testData, JSON_PRETTY_PRINT)) === false) {
    echo "Помилка запису у файл!";
} else {
    echo "Файл успішно створений за адресою $path!";
}