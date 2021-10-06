# youtube-dlsr
[![NPM Version](https://img.shields.io/npm/v/youtube-dlsr.svg?maxAge=3600)](https://www.npmjs.com/package/youtube-dlsr)
[![NPM Downloads](https://img.shields.io/npm/dt/youtube-dlsr.svg?maxAge=3600)](https://www.npmjs.com/package/youtube-dlsr)

### Installing
`npm install youtube-dlsr`

### GitHub
- [GitHub Repository](https://github.com/cjh980402/youtube-dlsr)

### Example
```js
const { download, search } = require('youtube-dlsr');
const { createWriteStream } = require('fs');

(async () => {
    // Search video.
    const result = await search('no copyright music', { type: 'video' });
    // Get stream of video.
    const stream = await download(result[0].url);
    // Write to file.
    stream.pipe(createWriteStream('./no_copyright_music.ogg'));
})();
```