<?php
session_start();

if (!isset($_SESSION['usuario'])) {
  header('Location: ' . basename(__DIR__) . '/../login.php');
  exit;
}
