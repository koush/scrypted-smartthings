const { inherits } = require('util');
const Capability = require('./capability');

function Switch() {
    Capability.apply(this, arguments);
}
inherits(Switch, Capability);

Switch.prototype.turnOn = function() {
    return this.command(Switch.SmartThingsCapability, 'on');
}

Switch.prototype.turnOff = function() {
    return this.command(Switch.SmartThingsCapability, 'off');
}

Switch.prototype.isOn = function() {
    return true;
}

Switch.SmartThingsCapability = 'switch';
Switch.ScryptedInterface = 'OnOff';

module.exports = Switch;
