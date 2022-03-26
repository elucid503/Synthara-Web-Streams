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
        this.message ||= 'An invalid token is found.';
    }
}

export class UrlError extends Error {
    name = 'UrlError';
    code = 'INVALID_URL';
    constructor(message?: string) {
        super(message);
        this.message ||= 'An invalid url is provided.';
    }
}

export class FormatError extends Error {
    name = 'FormatError';
    code = 'NO_SUITABLE_FORMAT';
    constructor(message?: string) {
        super(message);
        this.message ||= 'Cannot find suitable format for this download.';
    }
}
