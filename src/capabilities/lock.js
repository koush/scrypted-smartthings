const { inherits } = require('util');
const Capability = require('./capability');

function Lock() {
    Capability.apply(this, arguments);
}
inherits(Lock, Capability);

Lock.prototype.lock = function() {
    return this.command(Lock, 'lock');
}

Lock.prototype.unlock = function() {
    return this.command(Lock, 'unlock');
}

Lock.SmartThingsCapability = 'lock';
Lock.ScryptedInterface = 'Lock';
Lock.Attributes = {
    "lock": function(state, value) {
        state.lockState = value === 'locked' ? 'Locked' : 'Unlocked'; 
    }
}

module.exports = Lock;
