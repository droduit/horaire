<?php 
// Mot de passe de la base de données.
define("DB_PASS", $_SERVER['HTTP_HOST'] == "localhost" ? "" : "your-remote-db-password"); 

/** Infos de connexion pour accéder à l'API */
define("API_CREDENTIALS", [
	"user" => "password"
]);
