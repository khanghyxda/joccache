const express = require('express')
const request = require('request');
const path = require('path');
const fs = require('fs');
var http = require('http');
var https = require('https');

const app = express();
var port = normalizePort(process.env.PORT || '3000');

var cacheImg = {};

app.get('/', function (req, res) {
    res.send('Hello World!')
})

app.get('/reset', function (req, res) {
    cacheImg = {};
    deleteAllImg(__dirname + "/imgs/");
})

app.get('/image', function (req, res) {
    var url = req.query.url;
    var type = req.query.type;
    var filename = "";
    if (cacheImg[url + type] != undefined) {
        filename = cacheImg[url + type].filename;
        return res.sendFile(__dirname + "/imgs/" + filename)
    }
    filename = makeFilename() + "." + type;
    download(url, filename, function () {
        var filePath = __dirname + "/imgs/" + filename;
        var filesize = getFilesizeInBytes(filePath)
        if (filesize < 1000) {
            fs.unlinkSync(filePath);
            res.sendFile(__dirname + "/noimage.png");
        } else {
            var cache = {};
            cache.url = url;
            cache.type = type;
            cache.filename = filename;
            cacheImg[url + type] = cache;
            res.sendFile(filePath)
        }
    });
})

app.listen(port, () => console.log('Example app listening on port 3000!'))
createDir(__dirname + "/imgs/");
deleteAllImg(__dirname + "/imgs/");

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }

    return false;
}

function download(url, filename, callback, error) {
    https.get(url, function(response) {
        response.pipe(__dirname + "/imgs/" + filename)
        .on('close', callback)
        .on('error', function (e) { console.log(e) });
    });
};

function makeFilename() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 20; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function getFilesizeInBytes(filename) {
    var stats = fs.statSync(filename)
    var fileSizeInBytes = stats["size"]
    return fileSizeInBytes
}
function createDir(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    }
}
function deleteAllImg(directory) {
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(directory, file), err => {
                if (err) throw err;
            });
        }
    });
}