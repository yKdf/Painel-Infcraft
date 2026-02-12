<?php

namespace Pterodactyl\Http\Requests\Admin\Settings;

use Pterodactyl\Http\Requests\Admin\AdminFormRequest;

class GoogleSsoSettingsFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'services:google:enabled' => 'required|in:true,false',
            'services:google:client_id' => 'required_if:services:google:enabled,true|nullable|string|max:191',
            'services:google:client_secret' => 'required_if:services:google:enabled,true|nullable|string|max:191',
            'services:google:auto_link_by_email' => 'required|in:true,false',
            'services:google:auto_create_account' => 'required|in:true,false',
            'services:google:allowed_domains' => 'nullable|string|max:2000',
        ];
    }

    public function attributes(): array
    {
        return [
            'services:google:enabled' => 'Google SSO Enabled',
            'services:google:client_id' => 'Google Client ID',
            'services:google:client_secret' => 'Google Client Secret',
            'services:google:auto_link_by_email' => 'Auto Link by Email',
            'services:google:auto_create_account' => 'Auto Create Account',
            'services:google:allowed_domains' => 'Allowed Domains',
        ];
    }
}
