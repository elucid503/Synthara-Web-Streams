# youtube-dlsr
[![NPM Version](https://img.shields.io/npm/v/youtube-dlsr.svg?maxAge=3600)](https://www.npmjs.com/package/youtube-dlsr)
[![NPM Downloads](https://img.shields.io/npm/dt/youtube-dlsr.svg?maxAge=3600)](https://www.npmjs.com/package/youtube-dlsr)

## Table Of Contents
- [Installing](#installing)
- [Useful Links](#links)
- [Example Usage](#example)

### Links
- [GitHub Repository](https://github.com/cjh980402/youtube-dlsr)

### Installing
`npm install youtube-dlsr`

### Example
```js
const { downloadFromVideo, getVideoInfo } = require('youtube-dlsr');
const { createWriteStream } = require('fs');

(async () => {
    // Get the full song info.
    const video = await getVideoInfo('https://www.youtube.com/watch?v=G6Tv8eFu7zA');

    // Write to file.
    downloadFromVideo(video).pipe(createWriteStream('./test.ogg'));
})();
```