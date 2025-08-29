<?php

namespace Pterodactyl\Models;

use Illuminate\Database\Eloquent\Model;

class SysLog extends Model
{
    protected $table = 'logs'; // tabela na base do Pterodactyl
    protected $fillable = ['usuario', 'computador', 'ip_publico'];
}
