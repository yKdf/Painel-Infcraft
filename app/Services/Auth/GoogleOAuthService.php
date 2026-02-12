<?php

namespace Pterodactyl\Services\Auth;

use GuzzleHttp\Client;
use Illuminate\Support\Arr;
use Pterodactyl\Exceptions\DisplayException;

class GoogleOAuthService
{
    public function __construct(private Client $client)
    {
    }

    public function isEnabled(): bool
    {
        return (bool) config('services.google.enabled')
            && !empty(config('services.google.client_id'))
            && !empty(config('services.google.client_secret'));
    }

    public function getAuthorizationUrl(string $state): string
    {
        $query = http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => $this->getRedirectUri(),
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'prompt' => 'select_account',
        ]);

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . $query;
    }

    /**
     * @return array{sub: string, email: string|null, email_verified: bool, given_name: string|null, family_name: string|null}
     *
     * @throws DisplayException
     */
    public function fetchUserProfile(string $code): array
    {
        try {
            $tokenResponse = $this->client->post('https://oauth2.googleapis.com/token', [
                'form_params' => [
                    'code' => $code,
                    'client_id' => config('services.google.client_id'),
                    'client_secret' => config('services.google.client_secret'),
                    'redirect_uri' => $this->getRedirectUri(),
                    'grant_type' => 'authorization_code',
                ],
                'timeout' => 10,
            ]);

            $tokenData = json_decode((string) $tokenResponse->getBody(), true, 512, JSON_THROW_ON_ERROR);
            $accessToken = Arr::get($tokenData, 'access_token');
            if (empty($accessToken)) {
                throw new DisplayException('Google did not return an access token.');
            }

            $profileResponse = $this->client->get('https://openidconnect.googleapis.com/v1/userinfo', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $accessToken,
                ],
                'timeout' => 10,
            ]);

            $profile = json_decode((string) $profileResponse->getBody(), true, 512, JSON_THROW_ON_ERROR);

            $googleId = Arr::get($profile, 'sub');
            if (empty($googleId)) {
                throw new DisplayException('Google did not return a valid account identifier.');
            }

            return [
                'sub' => $googleId,
                'email' => Arr::get($profile, 'email'),
                'email_verified' => (bool) Arr::get($profile, 'email_verified', false),
                'given_name' => Arr::get($profile, 'given_name'),
                'family_name' => Arr::get($profile, 'family_name'),
            ];
        } catch (DisplayException $exception) {
            throw $exception;
        } catch (\Throwable $exception) {
            throw new DisplayException('Google authentication could not be completed. Please try again.');
        }
    }

    public function getRedirectUri(): string
    {
        return config('services.google.redirect') ?: route('auth.google.callback');
    }

    public function isAllowedAutoCreateEmail(?string $email): bool
    {
        if (empty($email)) {
            return false;
        }

        $domains = (string) config('services.google.allowed_domains', '');
        if (trim($domains) === '') {
            return true;
        }

        $emailDomain = mb_strtolower((string) str($email)->afterLast('@'));
        if ($emailDomain === '') {
            return false;
        }

        $allowedDomains = collect(explode(',', $domains))
            ->map(fn (string $domain) => mb_strtolower(trim($domain)))
            ->filter()
            ->values();

        return $allowedDomains->contains($emailDomain);
    }
}
