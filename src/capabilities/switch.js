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
    return this.getAttribute(Switch.Attributes, 'switch');
}

Switch.SmartThingsCapability = 'switch';
Switch.ScryptedInterface = 'OnOff';
Switch.Attributes = {
    "switch": function(value) {
        return value && value === 'on'; 
    }
}

module.exports = Switch;
