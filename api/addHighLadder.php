<?php
header("Content-type:text/html;charset=utf8");
header('Access-Control-Allow-Origin:https://neozl24.github.io');
require ("db_config.php");
//创建连接
$conn = new mysqli($mysql_server_name,$mysql_username,$mysql_password,$mysql_database);
mysqli_set_charset($conn,'utf8');
$sql = "insert into ladder (name,role,score,time) values ('$_POST[name]','$_POST[role]','$_POST[score]','$_POST[time]')";

if($conn -> query($sql) == TRUE){
    echo "insert success";
}else {
    echo "insert failed";
}
$conn -> close();
?>