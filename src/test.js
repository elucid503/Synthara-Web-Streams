const { GetVideo } = require('../dist/index.js');

async function Main() {

    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    console.time('GetVideo');

    const info = await GetVideo(url, true, { Host: "195.178.142.76", Port: 12323, UserPass: "14ae615cd92ce:160911818e" });
    
    console.timeEnd('GetVideo');
    
}

setTimeout(Main, 1000);
