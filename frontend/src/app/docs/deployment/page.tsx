"use client";

import { ChevronRight, Server, GitBranch, Lock, Zap, Database, Cloud, Shield } from "lucide-react";

export default function DeploymentPage() {
    return (
        <div className="space-y-8 max-w-4xl">
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    Deployment <ChevronRight className="h-4 w-4" /> Guide
                </div>
                <h1 className="text-4xl font-bold text-gray-900">Deployment Guide</h1>
                <p className="text-xl text-gray-500">
                    Deploy JuiceQu to production using Docker Compose on a VPS.
                </p>
            </div>

            {/* Quick Overview */}
            <div className="rounded-xl border-2 border-blue-500 bg-blue-50 p-6">
                <h3 className="flex items-center gap-2 text-lg font-bold text-blue-800 mb-3">
                    <Cloud className="h-6 w-6" />
                    VPS Deployment with Docker
                </h3>
                <p className="text-blue-700 mb-4">
                    JuiceQu is designed to be deployed on a VPS (Virtual Private Server) using Docker Compose with automated CI/CD via GitHub Actions.
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                    <div className="bg-white rounded p-3">
                        <div className="text-2xl mb-1">🐳</div>
                        <div className="font-semibold text-blue-900">Docker Compose</div>
                        <div className="text-sm text-blue-700">Containerized services</div>
                    </div>
                    <div className="bg-white rounded p-3">
                        <div className="text-2xl mb-1">🚀</div>
                        <div className="font-semibold text-blue-900">GitHub Actions</div>
                        <div className="text-sm text-blue-700">Automated deployment</div>
                    </div>
                    <div className="bg-white rounded p-3">
                        <div className="text-2xl mb-1">🔒</div>
                        <div className="font-semibold text-blue-900">SSL/HTTPS</div>
                        <div className="text-sm text-blue-700">Secure with Certbot</div>
                    </div>
                </div>
            </div>

            {/* Prerequisites */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                        <Server className="h-5 w-5 text-purple-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">VPS Requirements</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Minimum Specifications</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• <strong>OS:</strong> Ubuntu 20.04/22.04 LTS</li>
                            <li>• <strong>RAM:</strong> 2GB minimum (4GB recommended)</li>
                            <li>• <strong>Storage:</strong> 20GB SSD</li>
                            <li>• <strong>CPU:</strong> 2 vCPUs</li>
                        </ul>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Required Software</h3>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Docker 20.10+</li>
                            <li>• Docker Compose v2</li>
                            <li>• Git</li>
                            <li>• Nginx (for reverse proxy)</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Initial Setup */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                        <Zap className="h-5 w-5 text-green-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Initial VPS Setup</h2>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">1. Install Docker & Docker Compose</h3>
                        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                            <pre>{`# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker \${USER}

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version`}</pre>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">2. Clone Repository</h3>
                        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                            <pre>{`# Clone project
git clone https://github.com/mycoderisyad/juicequ.git
cd juicequ

# Create .env file
cp .env.example .env
nano .env`}</pre>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">3. Configure Environment Variables</h3>
                        <div className="rounded border border-yellow-200 bg-yellow-50 p-3 mb-3">
                            <div className="font-semibold text-yellow-900 mb-1">⚠️ Important</div>
                            <div className="text-sm text-yellow-800">Set <code className="bg-white px-1 rounded">APP_ENV=production</code> in .env file</div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Critical settings for production:</strong></p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Strong <code className="bg-gray-200 px-1 rounded">SECRET_KEY</code> (generate with openssl)</li>
                                <li>PostgreSQL credentials</li>
                                <li>API keys (Kolosal AI, Gemini)</li>
                                <li>Frontend/backend URLs (use your domain)</li>
                                <li>CORS origins (whitelist your domain)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">4. Start Services</h3>
                        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                            <pre>{`# Start all services
docker compose up -d

# Run database migrations
docker compose exec backend alembic upgrade head

# Check status
docker compose ps`}</pre>
                        </div>
                    </div>
                </div>
            </section>

            {/* SSL Setup */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                        <Lock className="h-5 w-5 text-orange-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">SSL/HTTPS Setup</h2>
                </div>

                <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-5">
                    <h3 className="font-semibold text-orange-900 mb-3">Using Certbot for Free SSL</h3>
                    <div className="space-y-3">
                        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                            <pre>{`# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run`}</pre>
                        </div>
                        <div className="text-sm text-orange-800">
                            Certbot will automatically configure Nginx and set up auto-renewal.
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Nginx Reverse Proxy Configuration</h3>
                    <p className="text-sm text-gray-600 mb-3">Create <code className="bg-gray-200 px-1 rounded">/etc/nginx/sites-available/juicequ</code>:</p>
                    <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                        <pre>{`server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}`}</pre>
                    </div>
                </div>
            </section>

            {/* GitHub Actions */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                        <GitBranch className="h-5 w-5 text-indigo-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Automated Deployment (CI/CD)</h2>
                </div>

                <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-5">
                    <h3 className="font-semibold text-indigo-900 mb-3">GitHub Actions Setup</h3>
                    <p className="text-sm text-indigo-800 mb-4">
                        JuiceQu includes a GitHub Actions workflow that automatically deploys to your VPS when you push to the main branch.
                    </p>

                    <div className="bg-white rounded p-4 border border-indigo-100 mb-4">
                        <h4 className="font-semibold text-indigo-900 mb-2">Required GitHub Secrets</h4>
                        <p className="text-sm text-indigo-700 mb-2">Add these secrets in your GitHub repository settings:</p>
                        <ul className="text-sm text-indigo-800 space-y-1">
                            <li>• <code className="bg-indigo-100 px-1 rounded">VPS_HOST</code> - Your VPS IP address</li>
                            <li>• <code className="bg-indigo-100 px-1 rounded">VPS_USERNAME</code> - SSH username (usually root or ubuntu)</li>
                            <li>• <code className="bg-indigo-100 px-1 rounded">VPS_SSH_KEY</code> - Private SSH key for authentication</li>
                        </ul>
                    </div>

                    <div className="bg-white rounded p-4 border border-indigo-100">
                        <h4 className="font-semibold text-indigo-900 mb-2">Deployment Flow</h4>
                        <ol className="text-sm text-indigo-800 space-y-1">
                            <li>1. Push code to <code className="bg-indigo-100 px-1 rounded">main</code> branch</li>
                            <li>2. GitHub Actions runs tests</li>
                            <li>3. Builds Docker images</li>
                            <li>4. SSHs into VPS</li>
                            <li>5. Pulls latest code</li>
                            <li>6. Rebuilds and restarts containers</li>
                            <li>7. Runs database migrations</li>
                        </ol>
                    </div>
                </div>
            </section>

            {/* Maintenance */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Database className="h-5 w-5 text-gray-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Maintenance Commands</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">View Logs</h3>
                        <code className="text-xs bg-gray-900 text-green-400 p-2 rounded block">docker compose logs -f [service]</code>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Restart Services</h3>
                        <code className="text-xs bg-gray-900 text-green-400 p-2 rounded block">docker compose restart</code>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Database Backup</h3>
                        <code className="text-xs bg-gray-900 text-green-400 p-2 rounded block">docker compose exec postgres pg_dump</code>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">Clean Docker</h3>
                        <code className="text-xs bg-gray-900 text-green-400 p-2 rounded block">docker system prune -af</code>
                    </div>
                </div>
            </section>

            {/* Security */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                        <Shield className="h-5 w-5 text-red-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Security Checklist</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded p-4">
                        <h3 className="font-semibold text-red-900 mb-2">Essential Security</h3>
                        <ul className="text-sm text-red-800 space-y-1">
                            <li>✅ Use strong SECRET_KEY</li>
                            <li>✅ Enable SSL/HTTPS</li>
                            <li>✅ Configure firewall (UFW)</li>
                            <li>✅ Use environment variables</li>
                            <li>✅ Regular system updates</li>
                        </ul>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Best Practices</h3>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>✅ Disable root SSH login</li>
                            <li>✅ Use SSH keys (not passwords)</li>
                            <li>✅ Regular database backups</li>
                            <li>✅ Monitor logs for errors</li>
                            <li>✅ Rate limiting enabled</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs overflow-x-auto">
                    <pre>{`# Configure UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable`}</pre>
                </div>
            </section>

            {/* Monitoring */}
            <div className="rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
                <h3 className="text-xl font-bold mb-3">📊 Monitoring & Logs</h3>
                <p className="text-green-100 mb-3 text-sm">
                    Monitor your application health and performance:
                </p>
                <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div className="bg-white/10 rounded p-3">
                        <div className="font-semibold mb-1">Application Logs</div>
                        <code className="text-xs">docker compose logs -f</code>
                    </div>
                    <div className="bg-white/10 rounded p-3">
                        <div className="font-semibold mb-1">Resource Usage</div>
                        <code className="text-xs">docker stats</code>
                    </div>
                    <div className="bg-white/10 rounded p-3">
                        <div className="font-semibold mb-1">Health Check</div>
                        <code className="text-xs">curl http://localhost:8000/health</code>
                    </div>
                </div>
            </div>
        </div>
    );
}
