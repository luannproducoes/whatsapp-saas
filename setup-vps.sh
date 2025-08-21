#!/bin/bash

# Initial VPS Setup Script for Hetzner
# Run this on a fresh Ubuntu 22.04 server
# Usage: bash <(curl -s https://raw.githubusercontent.com/your-repo/setup-vps.sh)

set -e

echo "🔧 WhatsApp SaaS VPS Setup"
echo "=========================="

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo "📦 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt install docker-compose-plugin -y
else
    echo "Docker Compose already installed"
fi

# Install essential tools
echo "🛠 Installing essential tools..."
apt install -y git nginx certbot python3-certbot-nginx ufw fail2ban

# Configure firewall
echo "🔒 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 3001/tcp
ufw --force enable

# Configure swap (if needed)
echo "💾 Checking swap..."
if [ ! -f /swapfile ]; then
    echo "Creating 2GB swap file..."
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
else
    echo "Swap already configured"
fi

# Create app directory
echo "📁 Creating application directory..."
mkdir -p /opt/whatsapp-saas
cd /opt/whatsapp-saas

# Clone repository (replace with your repo)
echo "📥 Cloning repository..."
echo "Please enter your Git repository URL:"
read -r REPO_URL
git clone "$REPO_URL" . || echo "Skipping clone (directory not empty or no repo provided)"

# Create .env file
echo "📝 Creating .env file..."
if [ ! -f .env ]; then
    cat > .env << EOL
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key

# JWT Secret
JWT_SECRET=$(openssl rand -base64 32)

# Environment
NODE_ENV=production
FRONTEND_URL=http://$(curl -s ifconfig.me)

# Redis
REDIS_URL=redis://redis:6379
EOL
    echo "⚠️  Please edit /opt/whatsapp-saas/.env with your Supabase credentials"
else
    echo ".env file already exists"
fi

# Set up systemd service
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/whatsapp-saas.service << EOL
[Unit]
Description=WhatsApp SaaS Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/whatsapp-saas
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
ExecReload=/usr/bin/docker compose restart

[Install]
WantedBy=multi-user.target
EOL

systemctl daemon-reload
systemctl enable whatsapp-saas

# Create update script
echo "📝 Creating update script..."
cat > /opt/whatsapp-saas/update.sh << 'EOL'
#!/bin/bash
cd /opt/whatsapp-saas
git pull
docker compose build
docker compose down
docker compose up -d
docker system prune -f
EOL
chmod +x /opt/whatsapp-saas/update.sh

echo "✅ VPS Setup Complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit /opt/whatsapp-saas/.env with your Supabase credentials"
echo "2. Run: cd /opt/whatsapp-saas && docker compose up -d"
echo "3. Access your app at http://$(curl -s ifconfig.me)"
echo ""
echo "Optional: Set up SSL with: certbot --nginx -d your-domain.com"