[![Logo Image](https://cdn.infcraft.net/file/icon/Infcraft.svg)](https://infcraft.net)

# Painel Infcraft

Este painel foi **personalizado especialmente para refletir o estilo e preferências da Infcraft**, oferecendo uma experiência única aos seus usuários. Baseado no [Pterodactyl®](https://pterodactyl.io), um painel gratuito e de código aberto para gerenciamento de servidores de jogos, ele foi adaptado com uma interface visual e recursos que seguem o padrão visual e funcional que a comunidade Infcraft aprecia.

Construído com PHP, React e Go, o painel garante segurança ao executar todos os servidores de jogo em contêineres Docker isolados, mantendo uma interface bonita e intuitiva.

**Aqui, servidores de jogo são tratados com a qualidade que merecem.**

## Installation

Este guia irá atualizar seu painel para a versão mais recente baseada no Painel Infcraft.  
Você pode conferir a versão pelo nome da branch atual.

<details>
<summary>Upgrade PHP</summary>

Antes de prosseguir, certifique-se de que sua versão do PHP esteja atualizada para 8.2 ou superior. Siga os passos abaixo:

1. Atualize a lista de pacotes:
```bash
sudo apt update
```

2. Instale as dependências necessárias:
```bash
sudo apt install -y software-properties-common
```

3. Adicione o repositório do PHP:
```bash
sudo add-apt-repository ppa:ondrej/php
```

4. Atualize a lista de pacotes novamente:
```bash
sudo apt update
```

5. Instale o PHP 8.3:
```bash
sudo apt install -y php8.3
```

6. Verifique a versão do PHP:
```bash
php -v
```

</details>

## Enter Maintenance Mode

Antes de atualizar, coloque o painel em modo de manutenção para evitar erros inesperados aos usuários.

```bash
cd /var/www/painel-infcraft
php artisan down
```
## Download the panel

O primeiro passo é baixar os arquivos atualizados do painel Infcraft.

```bash
curl -L https://github.com/yKdf/Painel-Infcraft/releases/latest/download/panel.tar.gz | tar -xzv
```

Depois de baixar todos os arquivos, defina as permissões corretas para evitar problemas com o servidor web:

```bash
chmod -R 755 storage/* bootstrap/cache
```
## Update Dependencies

Atualize os componentes principais do painel:

```bash
composer install --no-dev --optimize-autoloader
```
## Clear Compiled Template Cache

Limpe o cache de templates compilados:

```bash
sudo php artisan optimize:clear
```
## Database Updates

Atualize o schema do banco de dados para a versão mais recente:

```bash
php artisan migrate --seed --force
```
## Set Permissions

Defina o dono correto dos arquivos para o usuário que roda seu servidor web (geralmente www-data):

```bash
# Se estiver usando NGINX ou Apache (não CentOS):
chown -R www-data:www-data /var/www/painel-infcraft/*

# Se estiver usando NGINX no CentOS:
chown -R nginx:nginx /var/www/painel-infcraft/*

# Se estiver usando Apache no CentOS:
chown -R apache:apache /var/www/painel-infcraft/*
```
## Restarting Queue Workers

Reinicie os workers da fila para garantir que o novo código seja carregado:

```bash
php artisan queue:restart
```
## Exit Maintenance Mode

Finalize saindo do modo de manutenção:

```bash
php artisan up
```
## Documentation

- [Panel Documentation](https://pterodactyl.io/panel/1.0/getting_started.html)
- [Wings Documentation](https://pterodactyl.io/wings/1.0/installing.html)
- [Community Guides](https://pterodactyl.io/community/about.html)
- [Obtenha ajuda adicional via Discord](https://discord.gg/pterodactyl)

## Star History

<a href="https://www.star-history.com/#yKdf/Painel-Infcraft&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=yKdf/Painel-Infcraft&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=yKdf/Painel-Infcraft&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=yKdf/Painel-Infcraft&type=date&legend=top-left" />
 </picture>
</a>

## License

Infcraft não é afiliado ao Pterodactyl® Panel ou seus contribuidores.

Pterodactyl code released under the MIT License.

Infcraft released under the [MIT License](./LICENSE.md).
