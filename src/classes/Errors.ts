export class YoutubeError extends Error {
    name = 'YoutubeError';
    code = 'YOUTUBE_ERR';
    constructor(message?: string) {
        super(message);
    }
}

export class TokenError extends Error {
    name = 'TokenError';
    code = 'INVALID_TOKEN';
    constructor(message?: string) {
        super(message);
    }
}

export class UrlError extends Error {
    name = 'UrlError';
    code = 'INVALID_URL';
    constructor(message?: string) {
        super(message);
    }
}

export class FormatError extends Error {
    name = 'FormatError';
    code = 'NO_SUITABLE_FORMAT';
    constructor(message?: string) {
        super(message);
    }
}
