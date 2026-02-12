<?php

namespace Pterodactyl\Http\Controllers\Auth;

use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Pterodactyl\Models\User;
use Illuminate\Auth\AuthManager;
use Illuminate\Support\Facades\Event;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Events\Auth\DirectLogin;
use Pterodactyl\Exceptions\DisplayException;
use Pterodactyl\Services\Auth\GoogleOAuthService;
use Pterodactyl\Services\Users\UserCreationService;

class GoogleLoginController extends AbstractLoginController
{
    private const SESSION_KEY = 'google_oauth_state';

    public function __construct(
        private GoogleOAuthService $googleOAuthService,
        private AuthManager $authManager,
        private UserCreationService $userCreationService
    )
    {
        parent::__construct();
    }

    public function redirect(Request $request)
    {
        if (!$this->googleOAuthService->isEnabled()) {
            return redirect('/auth/login?sso_error=' . urlencode('Google SSO is not enabled.'));
        }

        $state = Str::random(64);
        $request->session()->put(self::SESSION_KEY, [
            'state' => $state,
            'action' => 'login',
            'created_at' => CarbonImmutable::now()->timestamp,
        ]);

        return redirect()->away($this->googleOAuthService->getAuthorizationUrl($state));
    }

    public function callback(Request $request)
    {
        $details = $request->session()->pull(self::SESSION_KEY);
        if (!$this->hasValidState($details, (string) $request->query('state', ''))) {
            return $this->redirectWithError('/auth/login', 'Google authentication session expired. Please try again.');
        }

        if ($request->filled('error')) {
            return $this->redirectWithError('/auth/login', 'Google sign-in was cancelled or denied.');
        }

        $code = (string) $request->query('code', '');
        if ($code === '') {
            return $this->redirectWithError('/auth/login', 'Google did not provide an authorization code.');
        }

        try {
            $profile = $this->googleOAuthService->fetchUserProfile($code);
        } catch (DisplayException $exception) {
            return $this->redirectWithError('/auth/login', $exception->getMessage());
        }

        if (($details['action'] ?? 'login') === 'link') {
            return $this->handleAccountLinking($request, $details, $profile);
        }

        $user = $this->resolveUserForLogin($profile);
        if (is_null($user)) {
            return $this->redirectWithError('/auth/login', 'No account is linked to this Google account.');
        }

        if ($user->use_totp) {
            $request->session()->put('auth_confirmation_token', [
                'user_id' => $user->id,
                'token_value' => $token = Str::random(64),
                'expires_at' => CarbonImmutable::now()->addMinutes(5),
            ]);

            return redirect('/auth/login?sso_checkpoint=' . urlencode($token));
        }

        $request->session()->remove('auth_confirmation_token');
        $request->session()->regenerate();

        $this->authManager->guard()->login($user, true);
        Event::dispatch(new DirectLogin($user, true));

        return redirect()->intended('/');
    }

    private function hasValidState(mixed $details, string $state): bool
    {
        if (!is_array($details) || empty($details['state']) || empty($details['created_at'])) {
            return false;
        }

        if (!hash_equals((string) $details['state'], $state)) {
            return false;
        }

        return CarbonImmutable::createFromTimestamp((int) $details['created_at'])
            ->addMinutes(10)
            ->isAfter(CarbonImmutable::now());
    }

    /**
     * @param array{sub: string, email: string|null, email_verified: bool, given_name: string|null, family_name: string|null} $profile
     */
    private function handleAccountLinking(Request $request, array $details, array $profile)
    {
        /** @var \Pterodactyl\Models\User|null $user */
        $user = $this->authManager->guard()->user();
        if (is_null($user) || (int) ($details['user_id'] ?? 0) !== $user->id) {
            return $this->redirectWithError('/account', 'You must be logged in to link a Google account.');
        }

        $existing = User::query()->where('google_id', $profile['sub'])->first();
        if (!is_null($existing) && $existing->id !== $user->id) {
            return $this->redirectWithError('/account', 'This Google account is already linked to another user.');
        }

        $oldGoogleId = $user->google_id;
        $user->forceFill([
            'google_id' => $profile['sub'],
            'google_email' => $profile['email'],
        ])->save();

        Activity::event('user:account.google-linked')
            ->subject($user)
            ->property([
                'old_google_id' => $oldGoogleId,
                'new_google_id' => $profile['sub'],
                'google_email' => $profile['email'],
            ])
            ->log();

        return redirect('/account?sso_linked=1');
    }

    /**
     * @param array{sub: string, email: string|null, email_verified: bool, given_name: string|null, family_name: string|null} $profile
     */
    private function resolveUserForLogin(array $profile): ?User
    {
        $user = User::query()->where('google_id', $profile['sub'])->first();
        if (!is_null($user)) {
            return $user;
        }

        if (
            (bool) config('services.google.auto_link_by_email')
            && $profile['email_verified']
            && !empty($profile['email'])
        ) {
            /** @var \Pterodactyl\Models\User|null $user */
            $user = User::query()->where('email', $profile['email'])->first();
            if (!is_null($user) && empty($user->google_id)) {
                $user->forceFill([
                    'google_id' => $profile['sub'],
                    'google_email' => $profile['email'],
                ])->save();

                Activity::event('user:account.google-auto-linked')
                    ->subject($user)
                    ->property(['google_email' => $profile['email']])
                    ->log();

                return $user;
            }
        }

        if (
            (bool) config('services.google.auto_create_account')
            && $profile['email_verified']
            && !empty($profile['email'])
            && $this->googleOAuthService->isAllowedAutoCreateEmail($profile['email'])
        ) {
            return $this->createUserFromGoogleProfile($profile);
        }

        return null;
    }

    /**
     * @param array{sub: string, email: string|null, email_verified: bool, given_name: string|null, family_name: string|null} $profile
     */
    private function createUserFromGoogleProfile(array $profile): User
    {
        $user = $this->userCreationService->handle([
            'email' => $profile['email'],
            'username' => $this->generateUniqueUsername($profile['email']),
            'name_first' => $profile['given_name'] ?: 'Google',
            'name_last' => $profile['family_name'] ?: 'User',
            'password' => Str::random(64),
            'google_id' => $profile['sub'],
            'google_email' => $profile['email'],
            'language' => config('app.locale', 'en'),
        ]);

        Activity::event('user:account.google-auto-created')
            ->subject($user)
            ->property(['google_email' => $profile['email']])
            ->log();

        return $user;
    }

    private function generateUniqueUsername(string $email): string
    {
        $base = Str::of($email)
            ->before('@')
            ->lower()
            ->replaceMatches('/[^a-z0-9_\-]/', '');

        $base = $base->isEmpty() ? Str::random(10) : $base->substr(0, 40);

        $candidate = (string) $base;
        $attempt = 0;

        while (User::query()->where('username', $candidate)->exists()) {
            ++$attempt;
            $suffix = (string) random_int(1000, 9999);
            $candidate = Str::substr((string) $base, 0, max(1, 40 - strlen($suffix))) . $suffix;

            if ($attempt > 15) {
                $candidate = Str::lower(Str::random(12));
                break;
            }
        }

        return $candidate;
    }

    private function redirectWithError(string $path, string $message)
    {
        $separator = str_contains($path, '?') ? '&' : '?';

        return redirect($path . $separator . 'sso_error=' . urlencode($message));
    }
}
