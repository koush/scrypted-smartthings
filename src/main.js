import SmartThings from './smartthings';

const token = scriptSettings.getString('token');
if (!token || !token.length) {
    log.a(`No SmartThings "token" was provided in Plugin Settings. Create a personal access (request all permissions) token here: https://account.smartthings.com/tokens`);
    throw new Error();
}
log.clearAlerts();

const client = new SmartThings(token);

const Capabilities = {
}

function addCapability(constructor) {
    Capabilities[constructor.SmartThingsCapability] = {
        name: constructor.ScryptedInterface,
        prototype: constructor.prototype,
    }
}

addCapability(require('./capabilities/switch'))
addCapability(require('./capabilities/switchLevel'))

const Capability = require('./capabilities/capability')
const { inherits } = require('util');

function SmartThingsDevice(client, item, info, capabilities) {
    Capability.call(this, client, info.id);

    this.item = item;
    this.info = info;

    for (var capability of capabilities) {
        var iface = Capabilities[capability];
        if (iface) {
            Object.assign(this, Capabilities[capability].prototype);
        }
    }
}
inherits(SmartThingsDevice, Capability);

function DeviceProvider() {
    this.devices = {};

    client.list().then(response => {
        var devices = [];
        var payload = {
            devices,
        };
        console.log(JSON.stringify(response.data.items));
        for (var item of response.data.items) {
            var capabilities = item.components.map(component => component.capabilities.map(c => c.id));
            capabilities = [].concat.apply([], capabilities);

            var interfaces = capabilities.map(id => Capabilities[id] && Capabilities[id].name).filter(iface => iface != null);
            if (!interfaces.length) {
                continue;
            }

            var info = {
                name: item.name,
                id: item.deviceId,
                interfaces: interfaces,
            }
            console.log(`found: ${JSON.stringify(info)}`);
            this.devices[item.deviceId] = new SmartThingsDevice(client, item, info, capabilities);
            devices.push(info);
        }

        deviceManager.onDevicesChanged(payload);
    })
        .catch(e => {
            log.e(`error syncing devices ${e}`);
        })
}

DeviceProvider.prototype.getDevice = function (id) {
    return this.devices[id];
}

DeviceProvider.prototype.getEndpoint = function() {
    return "@scrypted/smartthings";
};

var Router = require('router')
var router = Router();

DeviceProvider.prototype.onRequest = function(req, res) {
    req.url = req.url.replace(req.rootPath, "");
    router(req, res, function() {
        res.send({
            code: 404,
        }, "Not Found")
    });
};

function checkToken(req, res) {
    var accessToken = scriptSettings.getString('accessToken');
    if (!accessToken) {
        scriptSettings.putString('accessToken', req.headers['authorization']);
    }
    else if (accessToken != req.headers['Authorization']) {
        res.send({
            code: 401,
        }, "Not Authorized");
        return false;
    }
    return true;
}

router.post('/public/initial', function(req, res) {
    if (!checkToken(req, res)) {
        return;
    }
    res.send('ok!');
})
router.post('/public/update', function(req, res) {
    if (!checkToken(req, res)) {
        return;
    }
    res.send('ok!');
})

  
export default new DeviceProvider();