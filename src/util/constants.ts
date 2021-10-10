export const DEFAULT_CONTEXT = {
    client: {
        hl: 'en',
        utcOffsetMinutes: 0,
        gl: 'US',
        clientName: 'WEB',
        clientVersion: ''
    },
    user: {},
    request: {}
};

export const ErrorCodes = {
    INVALID_TOKEN: 'An invalid token was found.',
    INVALID_URL: 'An invalid url is provided.',
    API_KEY_FAILED: 'Could not find api key in request.',
    CLIENT_VERSION_FAILED: 'Could not find client version in request.',
    NO_SUITABLE_FORMAT: 'Could not find suitable format for this download.',
    PLAYLIST_LOAD_FAILED: 'Failed to load desired playlist.',
    SEARCH_FAILED: 'Failed to search for videos.'
} as const;

export const Regexes = {
    INNERTUBE_API_KEY: /"(?:INNERTUBE_API_KEY|innertubeApiKey)"\s*:\s*"(.+?)"/s,
    INNERTUBE_CLIENT_VERSION: /"(?:INNERTUBE_CONTEXT_CLIENT_VERSION|innertube_context_client_version)"\s*:\s*"(.+?)"/s,
    PLAYER_URL: /"(?:PLAYER_JS_URL|jsUrl)"\s*:\s*"(.+?)"/s,
    YOUTUBE_INITIAL_DATA: /var\s+ytInitialData\s*=\s*({.+?})\s*;/s,
    YOUTUBE_PLAYER_RESPONSE: /var\s+ytInitialPlayerResponse\s*=\s*({.+?})\s*;/s
} as const;
