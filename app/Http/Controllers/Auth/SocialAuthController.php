<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Pterodactyl\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Pterodactyl\Facades\Activity;
use Laravel\Socialite\Facades\Socialite;
use Pterodactyl\Http\Controllers\Controller;

class SocialAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect()
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback from Google.
     */
    public function callback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Exception $e) {
            return redirect()->route('auth.login')->withErrors(['error' => 'Failed to authenticate with Google.']);
        }

        // If user is already authenticated, link the account
        if (Auth::check()) {
            $user = Auth::user();
            $user->update([
                'google_id' => $googleUser->getId(),
                'google_email' => $googleUser->getEmail(),
            ]);
            return view('auth.popup-response', ['redirect' => 'close', 'success' => true]);
        }

        // 1. Check if user already linked
        $user = User::where('google_id', $googleUser->getId())->first();

        if ($user) {
            Auth::login($user, true);
            Activity::event('auth:login')->withRequestMetadata()->subject($user)->log();
            return view('auth.popup-response', ['redirect' => '/']);
        }

        // 2. Check if email exists
        $user = User::where('email', $googleUser->getEmail())->first();

        if ($user) {
            session([
                'link_google_user_id' => $user->id,
                'google_id' => $googleUser->getId(),
                'google_email' => $googleUser->getEmail()
            ]);

            return view('auth.popup-response', ['redirect' => route('auth.google.link')]);
        }

        // 3. Create new user
        $username = explode('@', $googleUser->getEmail())[0];
        // Simple collision check
        if (User::where('username', $username)->exists()) {
             $username .= Str::random(3);
        }

        // Ensure username is valid chars (Pterodactyl strictness?)
        // Username rule: alpha_dash. Google email might have dots.
        // Pterodactyl default regex allows alphanumeric, dash, underscore.
        // We should sanitize.
        $username = preg_replace('/[^a-zA-Z0-9_\-]/', '', $username);
        if (empty($username)) {
            $username = 'user' . Str::random(8);
        }

        // Check collision again after sanitization
        if (User::where('username', $username)->exists()) {
             $username .= Str::random(8);
        }

        $user = User::create([
            'email' => $googleUser->getEmail(),
            'username' => $username,
            'name_first' => $googleUser->user['given_name'] ?? $googleUser->getName(),
            'name_last' => $googleUser->user['family_name'] ?? '',
            'password' => Hash::make(Str::random(32)),
            'google_id' => $googleUser->getId(),
            'google_email' => $googleUser->getEmail(),
            'uuid' => Str::uuid()->toString(),
            'language' => 'en',
            'root_admin' => false,
            'use_totp' => false,
        ]);

        Auth::login($user, true);
        Activity::event('auth:login')->withRequestMetadata()->subject($user)->log();

        return view('auth.popup-response', ['redirect' => '/']);
    }

    /**
     * Show the account linking form.
     */
    public function showLinkRequestForm()
    {
        if (!session('link_google_user_id')) {
            return redirect()->route('auth.login');
        }
        return view('auth.google-link');
    }

    /**
     * Handle the account linking request.
     */
    public function link(Request $request)
    {
        $userId = session('link_google_user_id');
        if (!$userId) {
            return redirect()->route('auth.login');
        }

        $request->validate([
            'password' => 'required|string',
        ]);

        $user = User::findOrFail($userId);

        if (!Hash::check($request->password, $user->password)) {
            return back()->withErrors(['password' => 'The password provided is incorrect.']);
        }

        $user->update([
            'google_id' => session('google_id'),
            'google_email' => session('google_email'),
        ]);

        Auth::login($user, true);
        Activity::event('auth:login')->withRequestMetadata()->subject($user)->log();
        session()->forget(['link_google_user_id', 'google_id', 'google_email']);

        return redirect('/');
    }

    /**
     * Unlink Google account from authenticated user.
     */
    public function unlink(Request $request)
    {
        $user = $request->user();
        
        if (!$user->google_id) {
            return response()->json(['error' => 'No Google account linked.'], 400);
        }

        $user->update([
            'google_id' => null,
            'google_email' => null,
        ]);

        return response()->json(['success' => true]);
    }
}
