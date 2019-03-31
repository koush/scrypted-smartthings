const { inherits } = require('util');
const Capability = require('./capability');

function Switch() {
    Capability.apply(this, arguments);
}
inherits(Switch, Capability);

Switch.prototype.turnOn = function() {
    return this.command(Switch, 'on');
}

Switch.prototype.turnOff = function() {
    return this.command(Switch, 'off');
}

Switch.SmartThingsCapability = 'switch';
Switch.ScryptedInterface = 'OnOff';
Switch.Attributes = {
    "switch": function(state, value) {
        state.on = value === 'on'; 
    }
}

module.exports = Switch;
