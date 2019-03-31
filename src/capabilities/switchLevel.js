const { inherits } = require('util');
const Capability = require('./capability');

function SwitchLevel() {
    Capability.apply(this, arguments);
}
inherits(SwitchLevel, Capability);

SwitchLevel.prototype.setLevel = function(level) {
    return this.command(SwitchLevel, 'setLevel', [
        level,
    ]);
}

SwitchLevel.SmartThingsCapability = 'switchLevel';
SwitchLevel.ScryptedInterface = 'Brightness';
SwitchLevel.Attributes = {
    level: function(state, value) {
        // everything is a string, parse it.
        try {
            state.brightness = !value ? 0 : parseInt(value);
        }
        catch (e) {
            state.brightness = 0;
        }
    }
}
module.exports = SwitchLevel;
