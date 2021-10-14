# youtube-dlsr
[![NPM Version](https://img.shields.io/npm/v/youtube-dlsr.svg?maxAge=3600)](https://www.npmjs.com/package/youtube-dlsr)
[![NPM Downloads](https://img.shields.io/npm/dt/youtube-dlsr.svg?maxAge=3600)](https://www.npmjs.com/package/youtube-dlsr)

## Installing
`npm install youtube-dlsr`

## GitHub
- [GitHub Repository](https://github.com/cjh980402/youtube-dlsr)

## Example
### Automatic format selection
```js
const { download, search } = require('youtube-dlsr');
const { createWriteStream } = require('fs');

(async () => {
    // Search video.
    const result = await search('no copyright music', { type: 'video' });
    // Get suitable stream for live video or music bots.
    const stream = await download(result[0].url);
    // Write to file.
    stream.pipe(createWriteStream('./auto_no_copyright_music.ogg'));
})();
```
### Manually format selection
```js
const { getVideoInfo, search } = require('youtube-dlsr');
const { createWriteStream } = require('fs');

(async () => {
    // Search video.
    const result = await search('no copyright music', { type: 'video' });
    // Get info of video.
    const video = await getVideoInfo(result[0].url);
    // Get stream of selected format.
    const stream = video.download(video.formats.find((f) => f.hasAudio));
    // Write to file.
    stream.pipe(createWriteStream('./manual_no_copyright_music.mp3'));
})();
```