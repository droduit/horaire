<?php
declare(strict_types = 1);

class UserGateway {

	const TABLENAME = "user";
	const QUERY_GET_ID_FROM_CODE = "(SELECT idUser FROM ".self::TABLENAME." WHERE BINARY couplingCode = ?)";

	private $db = null;
	private $queries = null;

	public function __construct($db, $queries) {
		$this->db = $db;
		$this->queries = $queries;
	}

	public function get(String $couplingCode) : ?Array {
        $stmt = "SELECT idUser, couplingCode, username, ipv4, dateCre, dateMod FROM ".self::TABLENAME." WHERE BINARY couplingCode = ?";

        if ($stmt = $this->db->prepare($stmt)) {
        	$stmt->bind_param("s", $couplingCode);
            $stmt->execute();
            //$stmt->bind_result($i);
			$stmt_result = $stmt->get_result();
            $result = $stmt_result->fetch_assoc();
            $stmt->close();
            return $result;
        }
        return null;
    }

    public function insert(Array $input) : int {
    	$stmt = "INSERT INTO ".self::TABLENAME." (couplingCode, username, ipv4, dateCre, dateMod) VALUES (?, ?, ?, now(), now())";

        if ($stmt = $this->db->prepare($stmt)) {
			$stmt->bind_param("sss", $input['couplingCode'], $input['username'], $input['ipv4']);
			$stmt->execute();  
			return $this->db->insert_id; 
		}
		return 0;
    }

    public function update(String $couplingCode, Array $input) : int {
		if (count($input) == 1 && isset($input['couplingCode'])) {
			$stmt = "UPDATE ".self::TABLENAME." SET couplingCode=?, dateMod = now() WHERE BINARY couplingCode = ?";
		} else {
        	$stmt = "UPDATE ".self::TABLENAME." SET username=?, ipv4 = ?, dateMod = now() WHERE BINARY couplingCode = ?";
		}

        if ($stmt = $this->db->prepare($stmt)) {
			if (count($input) == 1 && isset($input['couplingCode'])) {
				$stmt->bind_param("ss", $input['couplingCode'], $couplingCode);
			} else {
				$stmt->bind_param("sss", $input['username'], $input['ipv4'], $couplingCode);
			}
			$stmt->execute();  
			return $this->db->affected_rows;
		} 
		return 0;
    }

    public function delete(String $couplingCode) : int {
        $stmt = "DELETE FROM ".self::TABLENAME." WHERE BINARY couplingCode=?";

        if ($stmt = $this->db->prepare($stmt)) {
	        $stmt->bind_param("s", $couplingCode);
	        $stmt->execute();
    		return $this->db->affected_rows;	
    	}
    	return 0;
    }

}