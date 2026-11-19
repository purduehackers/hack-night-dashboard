# Hack Night Dashboard

## Development

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## External integrations

- Fetches events from [CMS] to get the current Hack Night's version.
- Fetches sessions from [CMS] to show session advertisements.
    - Uses Discord API with `DISCORD_BOT_TOKEN` to hydrate user IDs into names/avatars.
- Receives Discord feed over WebSocket from [api-v4].

[CMS]: https://github.com/purduehackers/cms
[api-v4]: https://github.com/purduehackers/api-v4
