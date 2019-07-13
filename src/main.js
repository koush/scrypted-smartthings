import SmartThings from './smartthings';
import axios from 'axios';
import sdk from '@scrypted/sdk';
const { deviceManager, log } = sdk;

const token = localStorage.getItem('token');
if (!token || !token.length) {
    log.a(`No SmartThings "token" was provided in Plugin Settings. Create a personal access (request all permissions) token here: https://account.smartthings.com/tokens`);
    throw new Error();
}
log.clearAlerts();

const client = new SmartThings(token);

// create mappings between SmartThings Capabiltiies and Scrypted Interfaces
const Capabilities = {
}

// create conversion mappings between SmartThings Attributes and Scrypted Interface Properties,
// ie, switch to isOn, and level to brightness
const Attributes = {
}

function addCapability(constructor) {
    Capabilities[constructor.SmartThingsCapability] = {
        name: constructor.ScryptedInterface,
        prototype: constructor.prototype,
    }
    Object.keys(constructor.Attributes).map(attribute => {
        Attributes[attribute] = constructor;
    })
}

addCapability(require('./capabilities/switch'))
addCapability(require('./capabilities/switchLevel'))
addCapability(require('./capabilities/contactSensor'))
addCapability(require('./capabilities/motionSensor'))
addCapability(require('./capabilities/lock'))

const Capability = require('./capabilities/capability')
const { inherits } = require('util');

function SmartThingsDevice(client, item, info, capabilities) {
    Capability.call(this, client, info.nativeId);

    this.item = item;
    this.info = info;

    setImmediate(() => this.state = deviceManager.getDeviceState(info.nativeId));

    for (var capability of capabilities) {
        var iface = Capabilities[capability];
        if (iface) {
            Object.assign(this, Capabilities[capability].prototype);
        }
    }
}
inherits(SmartThingsDevice, Capability);

const ErrorSyncing = 'Error syncing. See log for details.';

function DeviceProvider() {
    this.refreshDevices();
}

DeviceProvider.prototype.refreshDevices = function() {
    this.devices = {};

    var rooms = {};

    client.groups()
    .then(response => {
        for (var group of response.data) {
            rooms[group.id] = group.name;
        }
        log.i(`rooms: ${JSON.stringify(rooms, null, 2)}`)
    })
    .catch(e => log.e(`error syncing rooms, ignoring ${e}`))
    .then(() => client.list())
    .then(response => {
        log.clearAlert(ErrorSyncing);

        var devices = [];
        var payload = {
            devices,
        };

        log.i(JSON.stringify(response.data.items, null, 2));

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

            var name = item.name;
            if (item.label && item.label.length)
                name = item.label;

            var info = {
                name: name,
                nativeId: item.deviceId,
                interfaces: interfaces,
                events: events,

                room: rooms[item.roomId],
            }
            log.i(`found: ${JSON.stringify(info)}`);
            this.devices[item.deviceId] = new SmartThingsDevice(client, item, info, capabilities);
            devices.push(info);
        }

        deviceManager.onDevicesChanged(payload);

        this.refresh();
    })
    .catch(e => {
        log.a(ErrorSyncing);
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

var appId = localStorage.getItem('appId');
var accessToken = localStorage.getItem('accessToken');

DeviceProvider.prototype.updateAll = function(deviceList) {
    for (var device of deviceList) {
        var std = this.getDevice(device.deviceid);
        if (std) {
            for (var attribute in device.attributes) {
                var attributeValue = device.attributes[attribute];
                var iface = Attributes[attribute];
                if (iface && iface.Attributes[attribute]) {
                    iface.Attributes[attribute](std.state, attributeValue);
                }
            }
        }
    }
}

DeviceProvider.prototype.refresh = function() {
    if (!appId || !accessToken) {
        log.a('Install the Scrypted Bridge Smartapp to receive device events from SmartThings: https://github.com/koush/scrypted.app/wiki/SmartThings-Bridge');
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
        localStorage.setItem('accessToken', req.headers['authorization']);
    }
    else if (accessToken != req.headers['authorization']) {
        res.send({
            code: 401,
        }, "Not Authorized");
        log.a('The Scrypted SmartApp sent a device update, but the accessToken was incorrect. If the SmartApp was reinstalled, you may need to clear the previous "accessToken" in Plugin Settings.')
        log.e(`expected: ${accessToken}, got ${req.headers['authorization']}`);
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
        localStorage.setItem('appId', body.app_id);
        // trigger a refresh to expose events.
        provider.refreshDevices();
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

    var iface = Attributes[body.attribute];
    if (iface && iface.Attributes[body.attribute]) {
        iface.Attributes[body.attribute](device.state, body.value);
    }

    res.send('ok!');
})

export default provider;