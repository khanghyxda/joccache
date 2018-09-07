const express = require('express')
const path = require('path');
const fs = require('fs');
var http = require('http');
var https = require('https');
var dateFormat = require('dateformat');

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

app.get('/download', function (req, res) {
    var filename = "noimage.png";
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.download(__dirname + "/noimage.png", "noimage.png")
})

app.get('/image', function (req, res) {
    var url = req.query.url;
    var filename = "";
    if (cacheImg[url] != undefined) {
        filename = cacheImg[url].filename;
        var filePath = __dirname + "/imgs/" + filename;
        return res.sendFile(__dirname + "/imgs/" + filename)
    }
    filename = makeFilename();
    try {
        download(url, filename, function (extension) {
            filename = filename + "." + extension;
            var filePath = __dirname + "/imgs/" + filename;
            var filesize = getFilesizeInBytes(filePath);
            if (filesize < 200) {
                fs.unlinkSync(filePath);
                res.sendFile(__dirname + "/noimage.png");
            } else {
                var cache = {};
                cache.url = url;
                cache.filename = filename;
                cacheImg[url] = cache;
                res.setHeader('Cache-Control', 'public, max-age=3600');
                res.sendFile(filePath)
            }
        });
    } catch (error) {

    }
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

function download(url, filename, callback) {
    if(url.includes("https")) {
        https.get(url, function (response) {
            var extension = response.headers['content-type'].split('/')[1];
            response.pipe(fs.createWriteStream(__dirname + "/imgs/" + filename + "." + extension))
                .on('close', function () {
                    callback(extension);
                })
                .on('error', function (e) { console.log(e) });
        });
    } else {
        http.get(url, function (response) {
            var extension = response.headers['content-type'].split('/')[1];
            response.pipe(fs.createWriteStream(__dirname + "/imgs/" + filename + "." + extension))
                .on('close', function () {
                    callback(extension);
                })
                .on('error', function (e) { console.log(e) });
        });
    }
};

function makeFilename() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return dateFormat(new Date(), "yyyymmddHHMMss") + text;
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