# Start Backend prod

## VPS

### Fail2Ban
```sh
sudo apt update
sudo apt install fail2ban -y


```

### Базовая настройка (jail.local)

Fail2Ban использует конфигурационные файлы в /etc/fail2ban/.
Основной файл — jail.conf, но его нельзя редактировать напрямую (он перезаписывается при обновлениях).

Создайте jail.local для своих настроек:
```sh
sudo cp /etc/fail2ban/jail.{conf,local}
sudo nano /etc/fail2ban/jail.local
```
Основные параметры (глобальные настройки):
```yaml
[DEFAULT]
# Блокировка на 1 час (3600 секунд)
bantime = 3600

# Макс. число попыток перед блокировкой
maxretry = 3

# Время, за которое считаются попытки (10 минут)
findtime = 10m

# Игнорировать IP (можно добавить свой)
ignoreip = 127.0.0.1/8 ::1
```
Настройка защиты SSH (по умолчанию включена)

```yaml
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = %(sshd_log)s
maxretry = 3
bantime = 1h
```
Перезапуск Fail2Ban

```sh
sudo systemctl restart fail2ban
```
Мониторьте логи
```bash
sudo tail -f /var/log/fail2ban.log
```


## Установка 
```bash
# Проверить права, если нет, то назначить 
sudo chown -R nodejs:nodejs /var/www/html
# Установить зависимости 
sudo -u nodejs npm install
#Выполнить миграции
sudo -u nodejs npx prisma generate

# Произвести тестовый запуск в режиме отладки 
sudo -u nodejs node /var/www/dist-backend/index.js --debug
# после удачного запуска на node запустить с помощь pm2
sudo -u nodejs pm2 delete backend
sudo -u nodejs npm run build
sudo -u nodejs pm2 start dist-backend/index.js --name backend

sudo -u nodejs pm2 stop backend
sudo -u nodejs pm2 start backend
sudo -u nodejs pm2 status backend
sudo -u nodejs pm2 save



```
До запуска нужно провести миграции для каждого экземпляра
```sh
sudo -u nodejs DATABASE_URL="postgresql://chosen:chosen@localhost:5432/chosen?schema=public" npx prisma migrate deploy
sudo -u nodejs DATABASE_URL="postgresql://omerta:omerta@localhost:5432/omerta?schema=public" npx prisma migrate deploy


```
```shell
psql "postgresql://chosen:chosen@localhost:5432/chosen"

sudo -u nodejs DATABASE_URL="postgresql://chosen:chosen@localhost:5432/chosen?schema=public" npx prisma migrate reset
sudo -u nodejs DATABASE_URL="postgresql://omerta:omerta@localhost:5432/omerta?schema=public" npx prisma migrate reset


```
После успешного завершения 
```shell
sudo -u nodejs pm2 start project1
sudo -u nodejs pm2 start project2
sudo -u nodejs pm2 save
```

```bash
sudo -u postgres psql
psql -U myuser -d mydatabase
```

```sql
CREATE DATABASE chosen; 
CREATE USER chosen WITH PASSWORD 'chosen'; 
GRANT ALL PRIVILEGES ON DATABASE chosen TO chosen; 
GRANT ALL ON SCHEMA public TO chosen; 
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO chosen;
ALTER USER chosen SUPERUSER;

\du
\l
\q
```

После модификации файлов нужно перезагрузить pm2. И файлы лучше редактировать когда они не заняты другим процессов.

```nginxconf
server {

	root /var/www/html;

	server_name nosashabou.beget.app www.nosashabou.beget.app;
  
      
location /omerta/assets/ {
    alias /var/www/html/dist-frontend-omerta/assets/;
    gzip_static on;
    expires 12h;
    add_header Cache-Control public;
}
    
location /chosen/assets/ {
    alias /var/www/html/dist-frontend-chosen/assets/;
    gzip_static on;
    expires 12h;
    add_header Cache-Control public;
}


location /omerta/ {
    try_files $uri /dist-frontend-omerta/index.html;
}
location /chosen/ {
    try_files $uri /dist-frontend-chosen/index.html;
}



		location /omerta/api/ {
		proxy_http_version 1.1;
		proxy_cache_bypass $http_upgrade;

		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;

		proxy_pass http://localhost:3001;
		rewrite ^/omerta/api(/.*)$ $1 break; # Удаление /api из пути
	}	
		location /chosen/api/ {
		proxy_http_version 1.1;
		proxy_cache_bypass $http_upgrade;

		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;

		proxy_pass http://localhost:3002;
		rewrite ^/chosen/api(/.*)$ $1 break; # Удаление /api из пути
	}



    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/nosashabou.beget.app/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/nosashabou.beget.app/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot


}
server {
    if ($host = www.nosashabou.beget.app) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


    if ($host = nosashabou.beget.app) {
        return 301 https://$host$request_uri;
    } # managed by Certbot


	listen 80;

	server_name nosashabou.beget.app www.nosashabou.beget.app;
    return 404; # managed by Certbot




}

```




