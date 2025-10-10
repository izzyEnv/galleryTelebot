const RouterOSClient = require('routeros-client').RouterOSClient;

const api = new RouterOSClient({
    host: "192.168.2.1",
    user: "admin",
    password: "123"
});

api.connect().then((client) => {
    // After connecting, the promise will return a client class so you can start using it

    // You can either use spaces like the winbox terminal or
    // use the way the api does like "/system/identity", either way is fine
    client.menu("/system/resource").getOnly().then((result) => {
        console.log(result); // Mikrotik
        api.close();
    }).catch((err) => {
        console.log(err); // Some error trying to get the identity
    });

}).catch((err) => {
    console.log(err);
    // Connection error
});