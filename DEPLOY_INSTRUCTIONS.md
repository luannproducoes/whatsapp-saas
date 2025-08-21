# 📚 Instruções de Deploy - WhatsApp Clone

## 1️⃣ Criar Repositório no GitHub

### Opção A: Via GitHub Web
1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: `whatsapp-saas` (ou o nome que preferir)
3. Deixe como **Privado** (recomendado)
4. **NÃO** inicialize com README, .gitignore ou License
5. Clique em "Create repository"

### Opção B: Via GitHub CLI
```bash
gh repo create whatsapp-saas --private
```

## 2️⃣ Enviar Código para o GitHub

Execute estes comandos na pasta do projeto:

```bash
# Adicionar o remote do GitHub (substitua SEU_USUARIO pelo seu username)
git remote add origin https://github.com/SEU_USUARIO/whatsapp-saas.git

# Enviar o código
git branch -M main
git push -u origin main
```

Se estiver usando SSH:
```bash
git remote add origin git@github.com:SEU_USUARIO/whatsapp-saas.git
git push -u origin main
```

## 3️⃣ Configurar Secrets no GitHub (Opcional - para CI/CD)

Se quiser usar GitHub Actions para deploy automático:

1. Vá em Settings → Secrets and variables → Actions
2. Adicione os seguintes secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SUPABASE_ANON_KEY`
   - `HETZNER_IP` (IP do seu servidor)
   - `HETZNER_SSH_KEY` (chave SSH privada)

## 4️⃣ Deploy no Hetzner VPS

### Conectar ao servidor:
```bash
ssh root@SEU_IP_HETZNER
```

### Opção 1: Clone direto do GitHub (Recomendado)
```bash
# No servidor Hetzner
cd /opt
git clone https://github.com/SEU_USUARIO/whatsapp-saas.git
cd whatsapp-saas

# Copiar e configurar .env
cp .env.example .env
nano .env  # Adicione suas credenciais
```

### Opção 2: Usar o script de setup
```bash
# No servidor Hetzner
curl -O https://raw.githubusercontent.com/SEU_USUARIO/whatsapp-saas/main/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh
```

### Iniciar a aplicação:
```bash
cd /opt/whatsapp-saas
docker compose up -d
```

## 5️⃣ Configurar Domínio (Opcional)

### No seu provedor de DNS:
1. Adicione um registro A apontando para o IP do Hetzner
```
Tipo: A
Nome: @ (ou www)
Valor: SEU_IP_HETZNER
TTL: 3600
```

### No servidor, configure SSL:
```bash
# Instalar Certbot (se ainda não tiver)
apt install certbot python3-certbot-nginx -y

# Gerar certificado SSL
certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Renovação automática
certbot renew --dry-run
```

## 6️⃣ Comandos Úteis

### No servidor Hetzner:
```bash
# Ver logs
docker compose logs -f

# Reiniciar aplicação
docker compose restart

# Parar aplicação
docker compose down

# Atualizar aplicação
git pull
docker compose build
docker compose up -d

# Ver status
docker compose ps

# Limpar cache Docker
docker system prune -af
```

## 7️⃣ GitHub Actions (Deploy Automático) - OPCIONAL

Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Hetzner

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Hetzner
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HETZNER_IP }}
          username: root
          key: ${{ secrets.HETZNER_SSH_KEY }}
          script: |
            cd /opt/whatsapp-saas
            git pull origin main
            docker compose build
            docker compose up -d
            docker system prune -f
```

## 📝 Checklist Final

- [ ] Repositório criado no GitHub
- [ ] Código enviado para o GitHub
- [ ] Servidor Hetzner configurado
- [ ] Docker e Docker Compose instalados
- [ ] Projeto clonado no servidor
- [ ] Arquivo .env configurado com credenciais Supabase
- [ ] Aplicação rodando com `docker compose up -d`
- [ ] Domínio configurado (opcional)
- [ ] SSL instalado (opcional)

## 🔗 Links Úteis

- Supabase Dashboard: https://app.supabase.com
- GitHub: https://github.com/SEU_USUARIO/whatsapp-saas
- Aplicação: http://SEU_IP_HETZNER ou https://seu-dominio.com

## ⚠️ Importante

1. **Nunca commite o arquivo .env** - ele já está no .gitignore
2. Use sempre **Service Role Key** do Supabase, não a Anon Key para o backend
3. Faça backup regular das sessões do WhatsApp
4. Configure firewall no Hetzner (ufw)
5. Use senha forte para o servidor

## 🆘 Problemas Comuns

### Erro de permissão no Docker
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Porta já em uso
```bash
docker compose down
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Falta de memória
```bash
# Criar swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

---

**Pronto!** Siga estes passos e sua aplicação estará rodando no Hetzner! 🚀