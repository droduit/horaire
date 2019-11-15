<?php
declare(strict_types = 1);

require_once dirname(__FILE__).'/UserGateway.php';

class PushGateway {

	const TABLENAME = "push_subscriber";

	private $db = null;
	private $queries = null;

	public function __construct($db, $queries) {
		$this->db = $db;
		$this->queries = $queries;
	}

	public function get(Array $input) : ?Array {
        $stmt = "SELECT idSubscriber FROM ".self::TABLENAME." WHERE endpoint = ?";

		$subscription = $input['subscription'];

        if ($stmt = $this->db->prepare($stmt)) {
        	$stmt->bind_param("s", $subscription['endpoint']);
            $stmt->execute();
			$stmt_result = $stmt->get_result();
            $result = $stmt_result->fetch_assoc();
            $stmt->close();
            return $result;
        }
        return null;
    }

    public function insert(Array $input) : int {
    	$stmt = "INSERT INTO ".self::TABLENAME." (idUser, endpoint, authToken, publicKey) VALUES (".UserGateway::QUERY_GET_ID_FROM_CODE.", ?, ?, ?)";

		$subscription = $input['subscription'];

        if ($stmt = $this->db->prepare($stmt)) {
			$stmt->bind_param("ssss", $input['couplingCode'], $subscription['endpoint'], $subscription['keys']['auth'], $subscription['keys']['p256dh']);
			$stmt->execute();  
			return $this->db->insert_id; 
		}
		return 0;
    }

    public function update(Array $input) : int {
        $stmt = "UPDATE ".self::TABLENAME." SET authToken = ?, publicKey = ?, idUser = ".UserGateway::QUERY_GET_ID_FROM_CODE." WHERE endpoint = ?";

		$subscription = $input['subscription'];

        if ($stmt = $this->db->prepare($stmt)) {
			$stmt->bind_param("ssss", $subscription['keys']['auth'], $subscription['keys']['p256dh'], $input['couplingCode'], $subscription['endpoint']);
			$stmt->execute();  
			return $this->db->affected_rows;
		} 
		return 0;
    }

    public function delete(String $endpoint) : int {
        $stmt = "DELETE FROM ".self::TABLENAME." WHERE endpoint=?";

        if ($stmt = $this->db->prepare($stmt)) {
	        $stmt->bind_param("s", $endpoint);
	        $stmt->execute();
    		return $this->db->affected_rows;	
    	}
    	return 0;
    }

}