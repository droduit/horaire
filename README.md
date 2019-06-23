# Horaire
This Progressive Web App calculate your departure time according to your worktime, arrivals and departures.
It helps you maintain good habits with a positive hourly balance, or to raise a negative balance.
Push notifications are sent once your working time is over.
A service worker cache and fetch the cached files to provide an offline availability.

# Developers
## Install 
- [NodeJS](https://nodejs.org/)

Once NodeJS installed:
1. Install Gulp: `npm install gulp -g`
2. Open a terminal at the root of the project (containing the `package.json` file): `npm install`

### Config
- src/db_connect.php
- src/passwd.php
- Setup web push notifications: [Generate a public/private key pair](https://web-push-codelab.glitch.me/), then complete the file `src/keys.php` 

### GULP tasks
- Preprocess, minify and concatenate all css files in bundle.min.css : `gulp css`
- Concatenate, uglify and pack all javascript files as bundle.min.js : `gulp js`
- Re-generate the css/js files for production : `gulp build`
