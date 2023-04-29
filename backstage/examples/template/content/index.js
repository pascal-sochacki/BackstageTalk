const express = require('express');

const app = express();

app.get('/', (req, res) => {
    console.log("request")
    res.send('Successful response.');
});

app.listen(3000, () => console.log('Example app is listening on port 3000.'));
