<?php

namespace Pterodactyl\Http\Controllers\Api\Client;

use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;
use Illuminate\Auth\AuthManager;
use Illuminate\Http\JsonResponse;
use Pterodactyl\Facades\Activity;
use Pterodactyl\Services\Users\UserUpdateService;
use Pterodactyl\Services\Auth\GoogleOAuthService;
use Pterodactyl\Transformers\Api\Client\AccountTransformer;
use Pterodactyl\Http\Requests\Api\Client\Account\GoogleAccountPasswordRequest;
use Pterodactyl\Http\Requests\Api\Client\Account\UpdateEmailRequest;
use Pterodactyl\Http\Requests\Api\Client\Account\UpdatePasswordRequest;

class AccountController extends ClientApiController
{
    /**
     * AccountController constructor.
     */
    public function __construct(
        private AuthManager $manager,
        private UserUpdateService $updateService,
        private GoogleOAuthService $googleOAuthService
    )
    {
        parent::__construct();
    }

    public function index(Request $request): array
    {
        return $this->fractal->item($request->user())
            ->transformWith($this->getTransformer(AccountTransformer::class))
            ->toArray();
    }

    /**
     * Update the authenticated user's email address.
     */
    public function updateEmail(UpdateEmailRequest $request): JsonResponse
    {
        $original = $request->user()->email;
        $this->updateService->handle($request->user(), $request->validated());

        if ($original !== $request->input('email')) {
            Activity::event('user:account.email-changed')
                ->property(['old' => $original, 'new' => $request->input('email')])
                ->log();
        }

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    /**
     * Update the authenticated user's password. All existing sessions will be logged
     * out immediately.
     *
     * @throws \Throwable
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $this->updateService->handle($request->user(), $request->validated());

        $guard = $this->manager->guard();
        // If you do not update the user in the session you'll end up working with a
        // cached copy of the user that does not include the updated password. Do this
        // to correctly store the new user details in the guard and allow the logout
        // other devices functionality to work.
        $guard->setUser($user);

        // This method doesn't exist in the stateless Sanctum world.
        if (method_exists($guard, 'logoutOtherDevices')) {
            $guard->logoutOtherDevices($request->input('password'));
        }

        Activity::event('user:account.password-changed')->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }

    public function googleLinkUrl(GoogleAccountPasswordRequest $request): array
    {
        if (!$this->googleOAuthService->isEnabled()) {
            return [
                'data' => [
                    'url' => null,
                    'enabled' => false,
                ],
            ];
        }

        $state = Str::random(64);
        $request->session()->put('google_oauth_state', [
            'state' => $state,
            'action' => 'link',
            'user_id' => $request->user()->id,
            'created_at' => now()->timestamp,
        ]);

        return [
            'data' => [
                'url' => $this->googleOAuthService->getAuthorizationUrl($state),
                'enabled' => true,
            ],
        ];
    }

    public function unlinkGoogle(GoogleAccountPasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $oldGoogleId = $user->google_id;

        $user->forceFill([
            'google_id' => null,
            'google_email' => null,
        ])->save();

        Activity::event('user:account.google-unlinked')
            ->subject($user)
            ->property(['old_google_id' => $oldGoogleId])
            ->log();

        return new JsonResponse([], Response::HTTP_NO_CONTENT);
    }
}
