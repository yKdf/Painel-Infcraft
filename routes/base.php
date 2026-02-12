<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Base;
use Pterodactyl\Http\Controllers\Auth;
use Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication;
use Illuminate\Http\Request;

Route::get('/ip', function (Request $request) {
    return $request->getClientIp();
});

Route::get('/auth/google', [Auth\GoogleLoginController::class, 'redirect'])
    ->withoutMiddleware(['auth.session', RequireTwoFactorAuthentication::class])
    ->middleware('throttle:authentication')
    ->middleware('guest')
    ->name('auth.google.redirect');

Route::get('/auth/google/callback', [Auth\GoogleLoginController::class, 'callback'])
    ->withoutMiddleware(['auth.session', RequireTwoFactorAuthentication::class])
    ->middleware('throttle:authentication')
    ->name('auth.google.callback');


Route::get('/', [Base\IndexController::class, 'index'])->name('index')->fallback();
Route::get('/account', [Base\IndexController::class, 'index'])
    ->withoutMiddleware(RequireTwoFactorAuthentication::class)
    ->name('account');

Route::get('/locales/locale.json', Base\LocaleController::class)
    ->withoutMiddleware(['auth', RequireTwoFactorAuthentication::class])
    ->where('namespace', '.*');

Route::get('/{react}', [Base\IndexController::class, 'index'])
    ->where('react', '^(?!(\/)?(api|auth|admin|daemon)).+');
