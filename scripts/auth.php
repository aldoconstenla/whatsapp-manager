<?php
session_start();

if (!isset($_SESSION['usuario']) || !isset($_SESSION['empresa'])) {
  header('Location: ' . basename(__DIR__) . '/../login.php');
  exit;
}
