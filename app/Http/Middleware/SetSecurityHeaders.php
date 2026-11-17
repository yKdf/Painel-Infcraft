<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;

class SetSecurityHeaders
{
    private static array $headers = [
        'X-Frame-Options' => 'DENY',
        'X-Content-Type-Options' => 'nosniff',
        'X-XSS-Protection' => '1; mode=block',
        'Referrer-Policy' => 'no-referrer-when-downgrade',
    ];

    /**
     * Add safe defaults without overriding headers configured by the application
     * or reverse proxy.
     */
    public function handle(Request $request, \Closure $next): mixed
    {
        $response = $next($request);

        foreach (static::$headers as $key => $value) {
            if (!$response->headers->has($key)) {
                $response->headers->set($key, $value);
            }
        }

        return $response;
    }
}
