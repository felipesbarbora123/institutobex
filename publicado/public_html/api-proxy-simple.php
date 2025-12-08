<?php
/**
 * Proxy PHP Simplificado - Versão que evita problemas de SSL
 * Esta versão usa file_get_contents ao invés de cURL quando possível
 */

// Headers CORS - Permitir origin específica
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
// Lista de origens permitidas
$allowedOrigins = ['https://institutobex.com', 'https://www.institutobex.com', 'http://localhost:3000'];
if (in_array($origin, $allowedOrigins) || $origin === '*') {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, HEAD');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Backend-URL, X-Backend-Method');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

// Tratar OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$BACKEND_BASE = 'http://46.224.47.128:3001';

// Obter URL do backend
$backendUrl = null;
$method = $_SERVER['REQUEST_METHOD'];

if (isset($_SERVER['HTTP_X_BACKEND_URL'])) {
    $backendUrl = $_SERVER['HTTP_X_BACKEND_URL'];
    if (isset($_SERVER['HTTP_X_BACKEND_METHOD'])) {
        $method = $_SERVER['HTTP_X_BACKEND_METHOD'];
    }
    // Log para debug
    error_log("Proxy: Usando X-Backend-URL: $backendUrl - Method: $method");
} else {
    $path = $_SERVER['REQUEST_URI'];
    // Remover /api-proxy-simple.php se estiver no início
    $path = preg_replace('#^/api-proxy-simple\.php#', '', $path);
    // Se não começar com /api, adicionar
    if (substr($path, 0, 4) !== '/api') {
        $path = '/api' . $path;
    }
    $backendUrl = $BACKEND_BASE . $path;
    if (!empty($_SERVER['QUERY_STRING'])) {
        $backendUrl .= '?' . $_SERVER['QUERY_STRING'];
    }
}

// Garantir HTTP
if (strpos($backendUrl, 'https://') === 0) {
    $backendUrl = str_replace('https://', 'http://', $backendUrl);
}

// Validar URL
if (filter_var($backendUrl, FILTER_VALIDATE_URL) === false) {
    http_response_code(400);
    echo json_encode(['error' => 'URL inválida', 'url' => $backendUrl]);
    exit;
}

// Preparar contexto HTTP
$body = file_get_contents('php://input');
$headers = [];

// Log para debug (apenas primeiros 200 caracteres do body)
$bodyPreview = strlen($body) > 0 ? substr($body, 0, 200) : '(vazio)';
error_log("Proxy: Method=$method, Body length=" . strlen($body) . ", Body preview=$bodyPreview");

// Log para debug
error_log("Proxy: Method=$method, Body length=" . strlen($body) . ", Body=" . substr($body, 0, 200));

// Preparar headers
if (function_exists('getallheaders')) {
    foreach (getallheaders() as $name => $value) {
        $lowerName = strtolower($name);
        if ($lowerName !== 'host' && 
            $lowerName !== 'connection' &&
            $lowerName !== 'x-backend-url' &&
            $lowerName !== 'x-backend-method') {
            $headers[] = "$name: $value";
        }
    }
}

// Adicionar Content-Type se não existir
$hasContentType = false;
foreach ($headers as $header) {
    if (stripos($header, 'Content-Type') !== false) {
        $hasContentType = true;
        break;
    }
}

// Sempre adicionar Content-Type para POST/PUT/PATCH se não existir
if (!$hasContentType && in_array($method, ['POST', 'PUT', 'PATCH']) && !empty($body)) {
    $headers[] = 'Content-Type: application/json';
} else if (!$hasContentType && in_array($method, ['POST', 'PUT', 'PATCH'])) {
    // Mesmo sem body, adicionar Content-Type para POST
    $headers[] = 'Content-Type: application/json';
}

// Sempre usar cURL se disponível (mais confiável)
$useCurl = function_exists('curl_init');

if ($useCurl && function_exists('curl_init')) {
    // Usar cURL
    $ch = curl_init($backendUrl);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60); // Aumentado para 60 segundos
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 30); // Aumentado para 30 segundos
    curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_NOBODY, ($method === 'HEAD'));
    
    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }
    
    // Enviar body para métodos que suportam (POST, PUT, PATCH)
    if (in_array($method, ['POST', 'PUT', 'PATCH']) && !empty($body)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
        error_log("Proxy cURL: Enviando body - Method: $method, Length: " . strlen($body) . ", Content: " . substr($body, 0, 100));
    } else if (in_array($method, ['POST', 'PUT', 'PATCH']) && empty($body)) {
        // Se for POST/PUT/PATCH mas não tiver body, pode ser que o body não foi lido corretamente
        error_log("Proxy cURL: AVISO - $method sem body! Tentando ler novamente...");
        // Tentar ler o body novamente
        $body = file_get_contents('php://input');
        if (!empty($body)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
            error_log("Proxy cURL: Body lido na segunda tentativa - Length: " . strlen($body));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    
    if ($error || $httpCode === 0) {
        curl_close($ch);
        http_response_code(500);
        $errorMsg = $error ? $error : 'Erro desconhecido ao conectar com o backend';
        
        // Mensagens de erro mais amigáveis
        $userMessage = $errorMsg;
        if ($errno === 28) { // CURL_TIMEOUT
            $userMessage = 'Timeout ao conectar com o servidor. O servidor pode estar sobrecarregado ou offline.';
        } else if ($errno === 7) { // CURL_COULDNT_CONNECT
            $userMessage = 'Não foi possível conectar com o servidor. Verifique se o servidor está online.';
        }
        
        error_log("Proxy Error: $errorMsg (Code: $errno) - URL: $backendUrl - Method: $method");
        echo json_encode([
            'error' => 'Erro ao conectar com o backend',
            'message' => $userMessage,
            'code' => $errno,
            'url' => $backendUrl,
            'method' => $method,
            'details' => $errorMsg
        ]);
        exit;
    }
    
    curl_close($ch);
    
    // Log da resposta do backend
    if ($httpCode >= 400) {
        error_log("Proxy: Backend retornou erro $httpCode para $backendUrl");
    }
    
    // Separar headers do body
    if ($method === 'HEAD') {
        // Para HEAD, retornar apenas headers
        http_response_code($httpCode);
        if ($contentType) {
            header('Content-Type: ' . $contentType);
        }
        echo '';
    } else {
        // Para outros métodos, separar headers do body
        $bodyOnly = substr($response, $headerSize);
        
        // Log da resposta do backend
        if ($httpCode >= 400) {
            error_log("Proxy: Backend retornou erro $httpCode - Body: " . substr($bodyOnly, 0, 500));
        }
        
        http_response_code($httpCode);
        if ($contentType) {
            header('Content-Type: ' . $contentType);
        } else {
            // Se não tiver Content-Type, assumir JSON
            header('Content-Type: application/json');
        }
        echo $bodyOnly;
    }
} else {
    // Usar file_get_contents (para GET e POST simples)
    $opts = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'content' => $body,
            'timeout' => 30,
            'ignore_errors' => true,
            'protocol_version' => '1.1'
        ]
    ];
    
    $opts['http']['verify_peer'] = false;
    $opts['http']['verify_peer_name'] = false;
    
    $context = stream_context_create($opts);
    $response = @file_get_contents($backendUrl, false, $context);
    
    $httpCode = 200;
    if (isset($http_response_header)) {
        foreach ($http_response_header as $header) {
            if (preg_match('/HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
                $httpCode = (int)$matches[1];
                break;
            }
        }
    }
    
    if ($response === false) {
        $error = error_get_last();
        http_response_code(500);
        echo json_encode([
            'error' => 'Erro ao conectar com o backend',
            'message' => $error ? $error['message'] : 'Erro desconhecido',
            'url' => $backendUrl
        ]);
        exit;
    }
    
    http_response_code($httpCode);
    echo $response;
}

