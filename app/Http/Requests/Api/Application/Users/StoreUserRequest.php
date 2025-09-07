<?php

namespace Pterodactyl\Http\Requests\Api\Application\Users;

use Pterodactyl\Models\User;
use Pterodactyl\Services\Acl\Api\AdminAcl;
use Pterodactyl\Http\Requests\Api\Application\ApplicationApiRequest;

class StoreUserRequest extends ApplicationApiRequest
{
    protected ?string $resource = AdminAcl::RESOURCE_USERS;

    protected int $permission = AdminAcl::WRITE;

    /**
     * Return the validation rules for this request.
     */
    public function rules(array $rules = null): array
    {
        $rules = $rules ?? User::getRules();

        $response = collect($rules)->only([
            'external_id',
            'email',
            'username',
            'password',
            'language',
            'root_admin',
        ])->toArray();

        // Adicionar first_name e last_name como campos permitidos
        $response['first_name'] = 'sometimes|' . implode('|', $rules['name_first']);
        $response['last_name'] = 'sometimes|' . implode('|', $rules['name_last']);

        // Tornar username opcional
        $usernameRules = [];
        foreach ($rules['username'] as $rule) {
            if (is_object($rule)) {
                $usernameRules[] = $rule;
            } else {
                $usernameRules[] = $rule;
            }
        }
        $response['username'] = array_merge(['sometimes'], $usernameRules);

        return $response;
    }

    public function validated($key = null, $default = null): array
    {
        $data = parent::validated();

        // Só mapear se os campos estiverem presentes
        if (isset($data['first_name'])) {
            $data['name_first'] = $data['first_name'];
            unset($data['first_name']);
        }

        if (isset($data['last_name'])) {
            $data['name_last'] = $data['last_name'];
            unset($data['last_name']);
        }

        return $data;
    }

    /**
     * Rename some fields to be more user friendly.
     */
    public function attributes(): array
    {
        return [
            'external_id' => 'Third Party Identifier',
            'name_first' => 'First Name',
            'name_last' => 'Last Name',
            'root_admin' => 'Root Administrator Status',
        ];
    }
}
