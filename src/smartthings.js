import axios from 'axios';

function SmartThings(token) {
    this.token = token;
    // this.appId = appId;
    // this.accessToken = accessToken;
}

SmartThings.prototype.getDefaultOptions = function() {
    return {
        headers: {
            'Authorization': `Bearer ${this.token}`
        }
    }
}

SmartThings.prototype.status = function(id) {
    // if (!this.appId || !this.accessToken) {
    //     return Promise.reject('appId or accessToken not provided.');
    // }

    return axios.get(`https://api.smartthings.com/v1/devices/${id}/status`);
}

SmartThings.prototype.command = function(id, capability, command, args) {
    // if (!this.appId || !this.accessToken) {
    //     return Promise.reject('appId or accessToken not provided.');
    // }

    // return axios.post(`https://graph.api.smartthings.com:443/api/smartapps/installations/${this.appId}/${id}/command/${command}?access_token=${this.accessToken}`, command || {})
    return axios.post(`https://api.smartthings.com/v1/devices/${id}/commands`, {
        "commands": [
            {
                "component": "main",
                "capability": capability,
                "command": command,
                "arguments": args || [],
            }
        ]
    }, this.getDefaultOptions())
}

SmartThings.prototype.list = function() {
    // return axios.get(`https://graph.api.smartthings.com:443/api/smartapps/installations/${this.appId}/devices?access_token=${this.accessToken}`)

    return axios.get('https://api.smartthings.com/v1/devices', this.getDefaultOptions())
}

SmartThings.prototype.groups = function() {
    // legacy api? requires personal access token? unsure.
    // it's sharded, so and not everything is replicated. query it all.
    var promise = Promise.resolve([]);
    var ret = [];

    var urls = [
        'https://graph.api.smartthings.com/api/groups',
        'https://graph-na02-useast1.api.smartthings.com/api/groups',
        'https://graph-na04-useast2.api.smartthings.com/api/groups',
        'https://graph-eu01-euwest1.api.smartthings.com/api/groups',
    ];

    urls.forEach(url => {
        promise = promise.then(() => axios.get(url, this.getDefaultOptions()))
        .then(response => {
            ret = ret.concat(response.data)
        })
        .catch();
    })

    return promise.then(() => ({
        data: ret,
    }));
}

export default SmartThings;