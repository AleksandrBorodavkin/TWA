### TODO
* По фиксить отображение аватара
* уведомление на тот случай, если место освободиться
* Валидация форм
* Глобальная обработка ошибок
* Добавить возможность редактировать событие
* ~~Добавить возможность дополнительного пользователя~~
* Добавить возможность архивировать события
* ~~Отображать организатора~~
* Экспорт события в формате .ics(сейчас не работает на мобильных устройствах)
* ~~Вместо username должно отображаться имя~~
* ~~Нажимая на участника попадаем к нему в личный чат~~
* ~~Добавить порядковые номера к участникам~~
* ~~Название мероприятий более жирный шрифт и время под темой~~
* ~~Добавить вывод статуса события~~
* ~~Возможность сворачивать форму~~

### Start Backend prod

```bash
#Установить зависимости 
sudo -u nodejs npm install
#Выполнить миграции
sudo -u nodejs npm prisma generate
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
```bash
sudo -u postgres psql
```
```SQL
CREATE USER myuser WITH PASSWORD 'mypassword' CREATEDB;
CREATE DATABASE mydatabase;
GRANT ALL PRIVILEGES ON DATABASE mydatabase TO myuser;

ALTER USER myuser CREATEDB;
ALTER USER myuser SUPERUSER;

\du
\l
\q
```

```bash
psql -U myuser -d mydatabase

```
После модификации файлов нужно перезагрузить pm2. И файлы лучше редактировать когда они не заняты другим процессов.





