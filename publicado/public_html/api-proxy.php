<?php
/**
 * Proxy PHP para redirecionar requisições HTTPS para o backend HTTP
 * Resolve o problema de Mixed Content (HTTPS -> HTTP)
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Backend-URL, X-Backend-Method');
header('Content-Type: application/json');

// Tratar requisições OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// URL do backend
$BACKEND_BASE = 'http://46.224.47.128:3001';

// Obter URL do backend do header ou construir a partir do path
$backendUrl = null;
$method = $_SERVER['REQUEST_METHOD'];

// Se tiver header X-Backend-URL, usar ele
if (isset($_SERVER['HTTP_X_BACKEND_URL'])) {
    $backendUrl = $_SERVER['HTTP_X_BACKEND_URL'];
    if (isset($_SERVER['HTTP_X_BACKEND_METHOD'])) {
        $method = $_SERVER['HTTP_X_BACKEND_METHOD'];
    }
} else {
    // Construir URL a partir do path
    $path = $_SERVER['REQUEST_URI'];
    // Remover /api-proxy.php se estiver no início
    $path = preg_replace('#^/api-proxy\.php#', '', $path);
    // Se não começar com /api, adicionar
    if (substr($path, 0, 4) !== '/api') {
        $path = '/api' . $path;
    }
    $backendUrl = $BACKEND_BASE . $path;
    
    // Adicionar query string se existir
    if (!empty($_SERVER['QUERY_STRING'])) {
        $backendUrl .= '?' . $_SERVER['QUERY_STRING'];
    }
}

// Garantir que a URL seja HTTP (não HTTPS)
if (strpos($backendUrl, 'https://') === 0) {
    $backendUrl = str_replace('https://', 'http://', $backendUrl);
}

// Validar URL
if (filter_var($backendUrl, FILTER_VALIDATE_URL) === false) {
    http_response_code(400);
    echo json_encode([
        'error' => 'URL inválida',
        'url' => $backendUrl
    ]);
    exit;
}

// Preparar headers para enviar ao backend
$headers = [];
foreach (getallheaders() as $name => $value) {
    // Ignorar headers que não devem ser repassados
    if (strtolower($name) === 'host' || 
        strtolower($name) === 'connection' ||
        strtolower($name) === 'x-backend-url' ||
        strtolower($name) === 'x-backend-method') {
        continue;
    }
    $headers[] = "$name: $value";
}

// Obter body se existir
$body = file_get_contents('php://input');

// Inicializar cURL
$ch = curl_init($backendUrl);

// Configurações básicas
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

// Forçar HTTP/1.1 (evitar HTTP/2 que pode causar problemas)
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);

// Desabilitar compressão que pode causar problemas
curl_setopt($ch, CURLOPT_ENCODING, '');

// Configurar User-Agent
curl_setopt($ch, CURLOPT_USERAGENT, 'InstitutoBex-Proxy/1.0');

// IMPORTANTE: Como estamos usando HTTP (não HTTPS), desabilitar completamente SSL/TLS
// Isso evita que o cURL tente negociar SSL mesmo em conexões HTTP
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USE_SSL, CURLUSESSL_NONE); // Forçar sem SSL

// Desabilitar protocolos SSL/TLS para garantir que use apenas HTTP
curl_setopt($ch, CURLOPT_SSLVERSION, 0); // 0 = usar o padrão, mas sem forçar SSL

// Adicionar headers
if (!empty($headers)) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

// Adicionar body se existir
if (!empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Executar requisição
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$error = curl_error($ch);
$errno = curl_errno($ch);
curl_close($ch);

// Tratar erros
if ($error || $errno) {
    http_response_code(500);
    
    // Log do erro para debug (remover em produção se necessário)
    error_log("Proxy Error: $error (Code: $errno) - URL: $backendUrl");
    
    echo json_encode([
        'error' => 'Erro ao conectar com o backend',
        'message' => $error ? $error : 'Erro desconhecido',
        'code' => $errno,
        'url' => $backendUrl
    ]);
    exit;
}

// Se não retornou resposta válida
if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Erro ao obter resposta do backend',
        'message' => 'Resposta vazia ou inválida'
    ]);
    exit;
}

// Retornar resposta
http_response_code($httpCode);
if ($contentType) {
    header('Content-Type: ' . $contentType);
}
echo $response;

