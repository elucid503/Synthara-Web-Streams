# youtube-dlsr
[![NPM Version](https://img.shields.io/npm/v/youtube-dlsr.svg?maxAge=3600)](https://www.npmjs.com/package/youtube-dlsr)
[![NPM Downloads](https://img.shields.io/npm/dt/youtube-dlsr.svg?maxAge=3600)](https://www.npmjs.com/package/youtube-dlsr)

### Installing
`npm install youtube-dlsr`

### GitHub
- [GitHub Repository](https://github.com/cjh980402/youtube-dlsr)

### Example
```js
const { download } = require('youtube-dlsr');
const { createWriteStream } = require('fs');

(async () => {
    // Write to file.
    const stream = await download('https://www.youtube.com/watch?v=G6Tv8eFu7zA');
    stream.pipe(createWriteStream('./G6Tv8eFu7zA.ogg'));
})();
```