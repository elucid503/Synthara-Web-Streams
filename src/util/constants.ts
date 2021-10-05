export enum ErrorCodes {
    UNKNOWN_TOKEN = 'An invalid token was found.',
    INVALID_URL = 'An invalid url is provided.',
    API_KEY_FAILED = 'Could not find api key in request.',
    CLIENT_VERSION_FAILED = 'Could not find client version in request.',
    NO_AVAILABLE_FORMAT = 'Could not find suitable format for this download.',
    PLAYLIST_LOAD_FAILED = 'Failed to load desired playlist.',
    SEARCH_FAILED = 'Failed to search for videos.'
}

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
