<?php
class Router {
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = $_SERVER['REQUEST_URI'];

        if (str_starts_with($uri, '/Programming-in-the-inthernet/api/students')) {
            require_once __DIR__ . '/../controllers/StudentController.php';
            $controller = new StudentController();

            if ($method === 'GET') {
                $controller->getAll();
            } elseif ($method === 'POST') {
                $controller->save();
            } elseif ($method === 'PUT') {
                // Отримати ID з URI
                $parts = explode('/', $uri);
                $id = end($parts);
                if (is_numeric($id)) {
                    $controller->update((int)$id);
                } else {
                    $this->sendResponse(['error' => 'Invalid ID'], 400);
                }
            } elseif ($method === 'DELETE') {
                $parts = explode('/', $uri);
                $id = end($parts);
                if (is_numeric($id)) {
                    $controller->delete((int)$id);
                } else {
                    $this->sendResponse(['error' => 'Invalid ID'], 400);
                }
            }          
            else {
                $this->sendResponse(['error' => 'Method Not Allowed'], 405);
            }
        } elseif ($uri === '/login' && $method === 'POST') {
            require_once __DIR__ . '/../controllers/AuthController.php';
            $controller = new AuthController();
            $controller->login();

        } else {
            $this->sendResponse(['error' => 'Not Found'], 404);
        }
    }
    

    private function sendResponse($data, $status = 200) {
        http_response_code($status);
        header('Content-Type: application/json');
        echo json_encode($data);
    }
}
