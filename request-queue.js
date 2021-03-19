var request = require('request');
var http = require('http');
var axios = require('axios');
var queue = [];
var active = false;

function check() {
   if (!active && queue.length > 0) {
      var f = queue.shift();
      f();
   }
}

http.createServer((request, response) => {
    var data = '';
    request.on('data', chunk => {
        data += chunk;
    });
    request.on('end', () => {
        try {
            var json = JSON.parse(data);
        } catch(e) {
            response.writeHead(200, '', {'Content-Type': 'text/plain'});
            response.end('');
        }
        
        queue.push(function() {
            if (json.url) {
                if (!json.method) {
                    if (json.data) json.method = 'post';
                    else json.method = 'get';
                } else json.method = json.method.toLowerCase();
                
                if (json.method == 'get') {
                    axios.get(json.url).then(function(data) {
                        console.log('GET', json.url);
                    }).catch(function() {
                        check();
                    }).then(function() {
                        check();
                    });
                } 
                else if (json.method == 'post') {
                    axios.post(json.url, json.data).then(function(data) {
                        console.log('POST', json.url, json.data);
                    }).catch(function() {
                        check();
                    }).then(function() {
                        check();
                    });
                }
                else console.log('Unknown method', json.method, 'in', json);
            } else console.log('I do not know what to do with', json);
            
        });
        check();
        
        response.writeHead(200, "OK", {'Content-Type': 'application/json'});
        response.end('{"status": "ok"}');
    })
}).listen(8182);
