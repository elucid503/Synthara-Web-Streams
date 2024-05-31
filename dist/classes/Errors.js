"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormatError = exports.UrlError = exports.YoutubeError = void 0;
class YoutubeError extends Error {
    constructor(message) {
        super(message);
        this.name = 'YoutubeError';
    }
}
exports.YoutubeError = YoutubeError;
class UrlError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UrlError';
        this.message || (this.message = 'An invalid url is provided.');
    }
}
exports.UrlError = UrlError;
class FormatError extends Error {
    constructor(message) {
        super(message);
        this.name = 'FormatError';
        this.message || (this.message = 'Cannot find suitable format for this download.');
    }
}
exports.FormatError = FormatError;
