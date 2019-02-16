const { inherits } = require('util');
const Capability = require('./capability');

function ContactSensor() {
    Capability.apply(this, arguments);
}
inherits(ContactSensor, Capability);

ContactSensor.prototype.getState = function() {
    return this.getAttribute(ContactSensor, 'contact');
}

ContactSensor.SmartThingsCapability = 'contactSensor';
ContactSensor.ScryptedInterface = 'StateSensor';
ContactSensor.Attributes = {
    "contact": function(value) {
        return (value && value === 'open') ? 'Open' : 'Closed';
    }
}

module.exports = ContactSensor;
