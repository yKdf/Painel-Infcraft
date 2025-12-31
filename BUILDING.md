# Guia de Desenvolvimento e Criação de Release - Pterodactyl Panel

Este guia descreve o processo completo de desenvolvimento e empacotamento do painel Pterodactyl com suporte a React, TypeScript, TailwindCSS e Webpack.

---

## 🧪 Ambiente de Desenvolvimento

### ✅ Requisitos

Antes de começar, certifique-se de ter instalado:

- [Node.js v14.x](https://nodejs.org/en/)
- [Yarn v1.x](https://classic.yarnpkg.com/lang/en/)
- [Go 1.17+](https://golang.org/)

---

### 📦 Instalar Dependências

Execute o seguinte comando para instalar as dependências do painel:

```bash
yarn install

composer install --no-dev --optimize-autoloader
```

---

### ⚙️ Servidor de Desenvolvimento (Painel)

Use os seguintes comandos para iniciar o ambiente de desenvolvimento do painel:

```bash
# Iniciar servidor backend (Laravel)
php artisan serve
```

```bash
# Compilar e observar mudanças nos assets (React/JS/CSS)
yarn run watch
```

Esse comando compila os assets e observa alterações nos arquivos. Ideal para uso enquanto programa.

---

## ⚡ Build de Produção

Quando finalizar o desenvolvimento e desejar compilar os arquivos otimizados para produção, execute:

```bash
yarn run build:production
```

Esse comando irá gerar os arquivos minificados e com hash em:

```
public/assets/
```

Estes arquivos são prontos para uso em produção.

---

## 📦 Criar o Release

Para empacotar o painel para distribuição (excluindo arquivos desnecessários), utilize:

```bash
sudo find . -type d -exec chmod 755 {} \;
sudo find . -type f -exec chmod 644 {} \;

tar --exclude-from=.releaseignore -czvf panel.tar.gz .

git tag v1.x.x

git push origin v1.x.x
```

---

## 💡 Dica: HMR (Hot Module Reloading)

Para desenvolvedores mais avançados, é possível ativar HMR para atualização automática dos componentes sem recarregar a página inteira:

```bash
PUBLIC_PATH=http://localhost:8080 yarn run serve --host localhost
```

Ajuste os valores de acordo com seu IP local ou ambiente Docker.

---

## ✅ Checklist para Publicação

1. [ ] Testar funcionalidades no ambiente local.
2. [ ] Executar `yarn run build:production`.
3. [ ] Garantir que os assets foram gerados corretamente em `public/assets/`.
4. [ ] Criar pacote `.tar.gz` com `tar --exclude-from=.releaseignore -czvf panel.tar.gz .`
5. [ ] Enviar `panel.tar.gz` para o servidor de destino ou repositório.

---

## 🛠 Comandos Úteis

```bash
# Limpar caches do Laravel
php artisan optimize:clear

# Reinstalar dependências
yarn install --force

# Verificar problemas de permissão
chown -R www-data:www-data storage bootstrap/cache
chmod -R 777 storage bootstrap/cache
```

---

## 🧠 Notas Finais

- Sempre rode `php artisan config:cache` após qualquer alteração nos arquivos `.env` ou config.
- Em ambientes de produção, nunca use `yarn run watch`. Use sempre `yarn run build:production`.

---

Desenvolvido por yKdf com base no projeto [Pterodactyl Panel](https://github.com/pterodactyl/panel).
