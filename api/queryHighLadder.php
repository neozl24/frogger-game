<?php
header("Content-Type:application/json;charset=utf8");
header('Access-Control-Allow-Origin:https://neozl24.github.io');
/**
 * Created by IntelliJ IDEA.
 * User: zengb
 * Date: 2017/11/26
 * Time: 20:35
 */
require ("db_config.php");
//创建连接
$conn = new mysqli($mysql_server_name,$mysql_username,$mysql_password,$mysql_database);
mysqli_set_charset($conn,'utf8');
if($conn -> connect_error){
    die("Connection failed: ".$conn -> connect_error);
}

$sql = "SELECT * FROM ladder ORDER BY score DESC ";
$result = $conn -> query($sql);

$arr = array();

while($row = $result -> fetch_assoc()){
    $count = count($row);
    for($i=0;$i<$count;$i++){
        unset($row[$i]);
    }
    array_push($arr,$row);
}

echo json_encode($arr,JSON_UNESCAPED_UNICODE);
$result -> free();
$conn -> close();
?>
