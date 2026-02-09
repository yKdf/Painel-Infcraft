<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Illuminate\Http\Request;

Route::get('/ip', function (Request $request) {
    return $request->getClientIp();
});


Route::get('/', [Base\IndexController::class, 'index'])->name('index')->fallback();
Route::get('/account', [Base\IndexController::class, 'index'])
    ->withoutMiddleware(RequireTwoFactorAuthentication::class)
    ->name('account');

Route::post('/account/google/unlink', [\Pterodactyl\Http\Controllers\Auth\SocialAuthController::class, 'unlink'])
    ->name('account.google.unlink');

Route::get('/account/google/link', [\Pterodactyl\Http\Controllers\Auth\SocialAuthController::class, 'redirect'])
    ->name('account.google.link');

Route::get('/locales/locale.json', Base\LocaleController::class)
    ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class])
    ->where('namespace', '.*');

Route::get('/{react}', [Base\IndexController::class, 'index'])
    ->where('react', '^(?!(\/)?(api|auth|admin|daemon)).+');


