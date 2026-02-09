<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class GoogleSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'services:google:enabled' => 'nullable|in:true,false,1,0,on,off',
            'services:google:client_id' => 'required_with:services:google:enabled|nullable|string',
            'services:google:client_secret' => 'required_with:services:google:enabled|nullable|string',
            'services:google:redirect' => 'nullable|string|url',
        ];
    }

    public function attributes(): array
    {
        return [
            'services:google:enabled' => 'Google SSO Enabled',
            'services:google:client_id' => 'Google Client ID',
            'services:google:client_secret' => 'Google Client Secret',
            'services:google:redirect' => 'Google Redirect URI',
        ];
    }
}
