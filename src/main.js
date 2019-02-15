import SmartThings from './smartthings';
import axios from 'axios';

const token = scriptSettings.getString('token');
if (!token || !token.length) {
    log.a(`No SmartThings "token" was provided in Plugin Settings. Create a personal access (request all permissions) token here: https://account.smartthings.com/tokens`);
    throw new Error();
}
log.clearAlerts();

const client = new SmartThings(token);

// create mappings between SmartThings Capabiltiies and Scrypted Interfaces
const Capabilities = {
}

// create mappings between SmartThings Attributes and Scrypted Interfaces
const Attributes = {
}

function addCapability(constructor) {
    Capabilities[constructor.SmartThingsCapability] = {
        name: constructor.ScryptedInterface,
        prototype: constructor.prototype,
    }
    Object.keys(constructor.Attributes).map(attribute => {
        Attributes[attribute] = constructor.ScryptedInterface;
    })
}

addCapability(require('./capabilities/switch'))
addCapability(require('./capabilities/switchLevel'))
addCapability(require('./capabilities/contactSensor'))

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

        console.log(JSON.stringify(response.data.items, null, 2));

        for (var item of response.data.items) {
            var capabilities = item.components.map(component => component.capabilities.map(c => c.id));
            capabilities = [].concat.apply([], capabilities);

            var interfaces = capabilities.map(id => Capabilities[id] && Capabilities[id].name).filter(iface => iface != null);
            if (!interfaces.length) {
                continue;
            }

            var events = [];
            if (appId && accessToken) {
                events = interfaces.slice();
            }
            else {
                interfaces.push('Refresh');
            }

            var info = {
                name: item.name,
                id: item.deviceId,
                interfaces: interfaces,
                events: events,
            }
            console.log(`found: ${JSON.stringify(info)}`);
            this.devices[item.deviceId] = new SmartThingsDevice(client, item, info, capabilities);
            devices.push(info);
        }

        deviceManager.onDevicesChanged(payload);

        this.refresh();
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

var appId = scriptSettings.getString('appId');
var accessToken = scriptSettings.getString('accessToken');

DeviceProvider.prototype.updateAll = function(deviceList) {
    for (var device of deviceList) {
        var std = this.getDevice(device.deviceid);
        if (std) {
            Object.assign(std.attributes, device.attributes);
        }
    }
}

DeviceProvider.prototype.refresh = function() {
    if (!appId || !accessToken) {
        log.a('Install the Scrypted Bridge Smartapp within SmartThings to receive device events.');
        // don't always nag?
        return;
    }

    axios.get(`https://graph.api.smartthings.com:443/api/smartapps/installations/${appId}/devices?access_token=${accessToken}`)
    .then(response => {
        log.i(JSON.stringify(response.data));
        this.updateAll(response.data.deviceList);
    })
    .catch(e => log.e(`error syncing ${e}`));
}

function checkToken(req, res) {
    if (!accessToken) {
        scriptSettings.putString('accessToken', req.headers['authorization']);
    }
    else if (accessToken != req.headers['authorization']) {
        res.send({
            code: 401,
        }, "Not Authorized");
        return false;
    }
    return true;
}

var provider = new DeviceProvider();

router.post('/public/initial', function(req, res) {
    if (!checkToken(req, res)) {
        return;
    }
    var body = JSON.parse(req.body);

    if (!appId || body.app_id != appId) {
        appId = body.app_id;
        scriptSettings.putString('appId', body.app_id);
    }
    log.i(req.body);
    provider.updateAll(body.deviceList);
    res.send('ok!');
})

router.post('/public/update', function(req, res) {
    if (!checkToken(req, res)) {
        return;
    }
    log.i(req.body);

    var body = JSON.parse(req.body);
    var id = body.device;
    var device = provider.getDevice(id);
    if (!device) {
        res.send({
            code: 400,
        }, "Bad Request")
        return;
    }

    device.attributes[body.attribute] = body.value;

    var iface = Attributes[body.attribute];
    if (iface) {
        deviceManager.onDeviceEvent(id, iface, body.value)
    }

    res.send('ok!');
})

export default provider;