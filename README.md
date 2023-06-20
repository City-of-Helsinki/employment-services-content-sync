# NOTE: This application is no longer in use. Everything in this repository is currently deprecated.

# employment-services-content-sync

Syncs events from Linked Events to Drupal

## Related repositories
- [Drupal employment services](https://github.com/City-of-Helsinki/drupal-employment-services)
- [React UI](https://github.com/City-of-Helsinki/employment-services-ui)
## Local development flow

Content sync functions can be built and run with Docker. See `Dockerfile and docker-compose`.

Steps:
- Define `.env` in project root. Copy `.env.example` to `.env`.
- Run docker containers `docker-compose up -d`
- Update containers `docker-compose up -d --build`

Run with npm:

```
nvm use

# install dependencies
npm install

# start syncing
npm start
```
