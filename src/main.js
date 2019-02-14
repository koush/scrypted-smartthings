import axios from 'axios';

function smartThingsCommand(target, command, args) {
    const info = target.device.info;
    const capability = target.methodInfo.capability;
    axios.post(`https://api.smartthings.com/v1/devices/${info.id}/commands`, {
        "commands": [
            {
                "component": "main",
                "capability": capability,
                "command": command,
                "arguments": args || [],
            }
        ]
    },
    {
        headers: {
            'Authorization': `Bearer ${scriptSettings.getString('token')}`
        }
    })
    .then(response => {
        console.log(response.data);
    })
    .catch(e => {
        console.err(`wtf ${e}`);
    })
}

// SmartThings devices are not concrete types: it's not possible to determine ahead of time
// what combination of capabilties are supported.
// So, report the capabilities (aka scrypted interfaces) that are implemented,
// and use a Proxy to trap all method Scrypted calls and call the equivalent SmartThings
// command.
const Capabilities = {
    // Example: A SmartThings switch maps to a Scrypted OnOff.
    // "this" will be the SmartThingsDevice object.
    'switch': {
        name: 'OnOff',
        methods: {
            turnOn: function() {
                smartThingsCommand(this, 'on');
            },
            turnOff: function() {
                smartThingsCommand(this, 'off');
            },
            isOn: function() {
                return true;
            }
        }
    }
}

const InterfaceMethods = {};
Object.keys(Capabilities)
.map(capability => Object.keys(Capabilities[capability].methods).map(method => 
    InterfaceMethods[method] = {
        iface: Capabilities[capability].name,
        method: Capabilities[capability].methods[method],
        capability: capability,
    }
));

const ProxyHandler = {
    has: function(f, prop) {
        var methodInfo = InterfaceMethods[prop];
        return prop in f.target || (methodInfo && f.target.info.interfaces.indexOf(methodInfo.iface) != -1);
    },
    get: function(f, prop) {
        var methodInfo = InterfaceMethods[prop];
        if (!methodInfo || f.target.info.interfaces.indexOf(methodInfo.iface) == -1) {
            return f.target[prop];
        }

        // must bind with the target, so future invocation of this interface method
        // is not called with the Proxy "this".
        return methodInfo.method.bind({
            methodInfo: methodInfo,
            device: f.target,
        });
    },
    set: function(f, prop, value) {
        return f.target[prop] = value;
    }
};

function SmartThingsDevice(item, info) {
    this.item = item;
    this.info = info;

    function f() {
    };
    f.target = this;
    this.proxy = new Proxy(f, ProxyHandler);
}

function DeviceProvider() {
    this.devices = {};

    axios.get('https://api.smartthings.com/v1/devices', {
        headers: {
            'Authorization': `Bearer ${scriptSettings.getString('token')}`
        }
    })
    .then(response => {
        var devices = [];
        var payload = {
            devices,
        };
        // console.log(JSON.stringify(response.data.items));
        for (var item of response.data.items) {
            var interfaces = [];
            // wtf are components? are these multiinstance devices or something? why is it an array?!
            for (var component of item.components) {
                for (var capability of component.capabilities) {
                    var equivalentInterface = Capabilities[capability.id];
                    if (equivalentInterface) {
                        interfaces.push(equivalentInterface.name);
                    }
                }
            }

            if (!interfaces.length) {
                continue;
            }

            var info = {
                name: item.name,
                id: item.deviceId,
                interfaces: interfaces,
            }
            console.log(`found: ${JSON.stringify(info)}`);
            this.devices[item.deviceId] = new SmartThingsDevice(item, info);
            devices.push(info);
        }

        deviceManager.onDevicesChanged(payload);
    })
    .catch(e => {
        log.e(`error syncing devices ${e}`);
    })
}

DeviceProvider.prototype.getDevice = function(id) {
    return this.devices[id] && this.devices[id].proxy;
}


export default new DeviceProvider();