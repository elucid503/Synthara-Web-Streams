export class YoutubeError extends Error {
    name = 'YoutubeError';
    constructor(message?: string) {
        super(message);
    }
}

export class UrlError extends Error {
    name = 'UrlError';
    constructor(message?: string) {
        super(message);
        this.message ||= 'An invalid url is provided.';
    }
}

export class FormatError extends Error {
    name = 'FormatError';
    constructor(message?: string) {
        super(message);
        this.message ||= 'Cannot find suitable format for this download.';
    }
}
