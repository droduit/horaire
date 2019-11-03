<?php
abstract class AbstractController {
	
	abstract protected function validateInput($input);
	abstract protected function processRequest();

	protected function unprocessableEntityResponse() {
        $response['status_code'] = 'HTTP/1.1 422 Unprocessable Entity';
        $response['body'] = json_encode([
            'error' => 'Invalid input'
        ]);
        return $response;
    }

	protected function notFoundResponse() {
		$response['status_code'] = "HTTP/1.1 404 Not Found";
		$response['body'] = null;
		return $response;
	}
}