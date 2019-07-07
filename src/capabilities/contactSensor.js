const { inherits } = require('util');
const Capability = require('./capability');

function ContactSensor() {
    Capability.apply(this, arguments);
}
inherits(ContactSensor, Capability);

ContactSensor.SmartThingsCapability = 'contactSensor';
ContactSensor.ScryptedInterface = 'EntrySensor';
ContactSensor.Attributes = {
    "contact": function(state, value) {
        // anything NOT closed is counted as open, just to be safe.
        state.entryOpen = value !== 'closed';
    }
}

module.exports = ContactSensor;
