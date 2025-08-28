<?php

namespace Pterodactyl\Services\Eggs\Sharing;

use Ramsey\Uuid\Uuid;
use Illuminate\Support\Arr;
use Pterodactyl\Models\Egg;
use Pterodactyl\Models\Nest;
use Illuminate\Http\UploadedFile;
use Pterodactyl\Models\EggVariable;
use Illuminate\Database\ConnectionInterface;
use Pterodactyl\Services\Eggs\EggParserService;

class EggImporterService
{
    public function __construct(protected ConnectionInterface $connection, protected EggParserService $parser)
    {
    }

    /**
     * Take an uploaded JSON file and parse it into a new egg.
     *
     * @throws \Pterodactyl\Exceptions\Service\InvalidFileUploadException|\Throwable
     */
    public function handle(UploadedFile $file, int $nest): Egg
    {
        $parsed = $this->parser->handle($file);

        /** @var \Pterodactyl\Models\Nest $nest */
        $nest = Nest::query()->with('eggs', 'eggs.variables')->findOrFail($nest);

        return $this->connection->transaction(function () use ($nest, $parsed) {
            $egg = (new Egg())->forceFill([
                'uuid' => Uuid::uuid4()->toString(),
                'nest_id' => $nest->id,
                'author' => Arr::get($parsed, 'author'),
                'copy_script_from' => null,
            ]);

            $egg = $this->parser->fillFromParsed($egg, $parsed);
            $egg->save();

            foreach ($parsed['variables'] ?? [] as $variable) {
                // Filter only valid columns that exist in the egg_variables table
                $validColumns = ['name', 'description', 'env_variable', 'default_value', 'user_viewable', 'user_editable', 'rules'];
                $filteredVariable = array_intersect_key($variable, array_flip($validColumns));
                
                EggVariable::query()->forceCreate(array_merge($filteredVariable, ['egg_id' => $egg->id]));
            }

            return $egg;
        });
    }
}
