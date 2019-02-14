import axios from 'axios';

function SmartThings(token) {
    this.token = token;
}

SmartThings.prototype.getDefaultOptions = function() {
    return {
        headers: {
            'Authorization': `Bearer ${this.token}`
        }
    }
}

SmartThings.prototype.command = function(id, capability, command, args) {
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
    return axios.get('https://api.smartthings.com/v1/devices', this.getDefaultOptions())
}

export default SmartThings;