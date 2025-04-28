<?php

require_once __DIR__ . '/../core/Database.php';

class Student
{
    public ?int $id;
    public string $group;
    public string $name;
    public string $surname;
    public string $gender;
    public string $birthday;
    public string $status;

    public function __construct(
        ?int $id,
        string $group,
        string $name,
        string $surname,
        string $gender,
        string $birthday,
        string $status
    ) {
        $this->id = $id;
        $this->group = $group;
        $this->name = $name;
        $this->surname = $surname;
        $this->gender = $gender;
        $this->birthday = $birthday;
        $this->status = $status;
    }

    public static function getAll(): array
    {
        $pdo = Database::connect();
        $stmt = $pdo->query("SELECT * FROM students");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function save($input): array
    {
        $pdo = Database::connect();

        if (is_array($input)) {
            $student = new Student(
                $input['id'] ?? null,
                $input['group'],
                $input['name'],
                $input['surname'],
                $input['gender'],
                $input['birthday'],
                $input['status']
            );
        } elseif ($input instanceof Student) {
            $student = $input;
        } else {
            throw new InvalidArgumentException('Invalid input');
        }

        if ($student->id !== null) {
            // Оновлення
            $stmt = $pdo->prepare("
                UPDATE students SET 
                    `group` = ?, 
                    name = ?, 
                    surname = ?, 
                    gender = ?, 
                    birthday = ?, 
                    status = ? 
                WHERE id = ?
            ");
            $stmt->execute([
                $student->group,
                $student->name,
                $student->surname,
                $student->gender,
                $student->birthday,
                $student->status,
                $student->id
            ]);
        } else {
            // Додавання
            $stmt = $pdo->prepare("
                INSERT INTO students (`group`, name, surname, gender, birthday, status) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $student->group,
                $student->name,
                $student->surname,
                $student->gender,
                $student->birthday,
                $student->status
            ]);
            $student->id = $pdo->lastInsertId();
        }

        return (array)$student;
    }

    public static function delete(int $id): bool
    {
        $pdo = Database::connect();
        $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
        $stmt->execute([$id]);
        return $stmt->rowCount() > 0;
    }
}


// require_once __DIR__ . '/../core/Database.php';

// class Student {
//     public $id;
//     public $group;
//     public $name;
//     public $surname;
//     public $gender;
//     public $birthday;
//     public $status;

//     public function __construct($id, $group, $name, $surname, $gender, $birthday, $status) {
//         $this->id = $id !== null ? (int)$id : null;
//         $this->group = $group;
//         $this->name = $name;
//         $this->surname = $surname;
//         $this->gender = $gender;
//         $this->birthday = $birthday;
//         $this->status = $status;
//     }

//     // Отримати всіх студентів з файлу
//     public static function getAll() {
//         $file = __DIR__ . '/../data/students.json';
//         if (!file_exists($file)) {
//             return [];
//         }
//         $data = file_get_contents($file);
//         return json_decode($data, true) ?? [];
//     }

//     // Записати всіх студентів у файл
//     private static function writeAll($students) {
//         file_put_contents(__DIR__ . '/../data/students.json', json_encode($students, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
//     }

//     // Згенерувати новий ID
//     private static function generateId($students) {
//         $maxId = 0;
//         foreach ($students as $s) {
//             if (isset($s['id']) && (int)$s['id'] > $maxId) {
//                 $maxId = (int)$s['id'];
//             }
//         }
//         return $maxId + 1;
//     }

//     // Зберегти (оновити або додати) студента
//     public static function save($input) {
//         // Якщо передано масив — конвертуємо в об'єкт Student
//         if (is_array($input)) {
//             $student = new Student(
//                 $input['id'] ?? null,
//                 $input['group'] ?? '',
//                 $input['name'] ?? '',
//                 $input['surname'] ?? '',
//                 $input['gender'] ?? '',
//                 $input['birthday'] ?? '',
//                 $input['status'] ?? ''
//             );
//         } elseif ($input instanceof Student) {
//             $student = $input;
//         } else {
//             throw new InvalidArgumentException('Invalid input data for saving student');
//         }

//         $students = self::getAll();
//         $found = false;

//         // Якщо є id — шукаємо для оновлення
//         if ($student->id !== null) {
//             foreach ($students as &$s) {
//                 if ((int)$s['id'] === (int)$student->id) {
//                     $s = (array) $student;
//                     $found = true;
//                     break;
//                 }
//             }
//         }

//         // Якщо не знайдено — додаємо нового
//         if (!$found) {
//             $student->id = self::generateId($students);
//             $students[] = (array) $student;
//         }

//         self::writeAll($students);
//         return (array) $student;
//     }
// }

