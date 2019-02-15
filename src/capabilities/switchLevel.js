const { inherits } = require('util');
const Capability = require('./capability');

function SwitchLevel() {
    Capability.apply(this, arguments);
}
inherits(SwitchLevel, Capability);

SwitchLevel.prototype.setLevel = function(level) {
    return this.command(SwitchLevel.SmartThingsCapability, 'setLevel', [
        level,
    ]);
}

SwitchLevel.prototype.getLevel = function() {
    return this.getAttribute(Switch.Attributes, 'level');
}

SwitchLevel.SmartThingsCapability = 'switchLevel';
SwitchLevel.ScryptedInterface = 'Brightness';
SwitchLevel.Attributes = {
    level: function(value) {
        return value; 
    }
}
module.exports = SwitchLevel;
