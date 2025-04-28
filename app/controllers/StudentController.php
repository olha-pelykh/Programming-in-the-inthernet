<?php
require_once __DIR__ . '/../models/Students.php';

class StudentController {

    public function getAll() {
        $students = Student::getAll();
        $this->sendResponse($students);
    }

    public function save() {
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (empty($input)) {
            $this->sendResponse(['error' => 'Invalid input'], 400);
            return;
        }

        // Валідація
        $requiredFields = ['group', 'name', 'surname', 'gender', 'birthday', 'status'];
        foreach ($requiredFields as $field) {
            if (empty($input[$field])) {
                $this->sendResponse(['error' => "Поле '{$field}' не може бути порожнім"], 400);
                return;
            }
        }

        if (mb_strlen($input['name']) < 2) {
            $this->sendResponse(['error' => 'Імʼя повинно містити щонайменше 2 символи'], 400);
            return;
        }

        if (mb_strlen($input['surname']) < 2) {
            $this->sendResponse(['error' => 'Прізвище повинно містити щонайменше 2 символи'], 400);
            return;
        }

        if (!in_array($input['gender'], ['male', 'female', 'other'])) {
            $this->sendResponse(['error' => 'Стать повинна бути "чоловік" або "жінка"'], 400);
            return;
        }

        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $input['birthday'])) {
            $this->sendResponse(['error' => 'Дата народження має бути у форматі РРРР-ММ-ДД'], 400);
            return;
        }

        $allowedStatuses = ['active', 'inactive'];
        if (!in_array(mb_strtolower($input['status']), $allowedStatuses)) {
            $this->sendResponse(['error' => 'Невірний статус. Дозволені: активний, відрахований, випускник'], 400);
            return;
        }

        if(isset($input['id']) && !is_numeric($input['id'])) {
            unset($input['id']);
        }

        $student = new Student(
            $input['id'] ?? null,
            $input['group'],
            $input['name'],
            $input['surname'],
            $input['gender'],
            $input['birthday'],
            $input['status']
        );

        $result = Student::save($student);
        //file_put_contents(__DIR__ . '/../data/students.json', json_encode($result, JSON_PRETTY_PRINT));
        $this->sendResponse($result);
    }

    private function sendResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
    }

    public function update($id) {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            $this->sendResponse(['error' => 'Invalid input'], 400);
            return;
        }
    
        // Додати ID до вхідних даних
        $input['id'] = $id;
    
        // Повторно використай всю ту саму валідацію, що й у save()
        $this->save(); // або перенеси логіку в окрему приватну функцію
    }

    public function delete($id) {
        $result = Student::delete($id);
        $this->sendResponse(['message' => $result ? 'Deleted' : 'Not found']);
    }
    
}


