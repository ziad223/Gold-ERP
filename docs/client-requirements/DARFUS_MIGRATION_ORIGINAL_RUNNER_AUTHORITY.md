# Original Migration Runner Authority

The original command is proven as `sequelize db:migrate`. `.sequelizerc` maps
the CLI to `src/config/config.js`, `src/models`, and `migrations`; the config
resolves environment through `src/config/database-env.js`. Container proof:
Sequelize CLI 6.6.5, ORM 6.37.8, Node 20.20.2.

`migrate-safe.js` is a separate manual Umzug/Sequelize guard and remains intact.

