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
        state.isEntryOpen = (value && value === 'open') ? 'Open' : 'Closed';
    }
}

module.exports = ContactSensor;
