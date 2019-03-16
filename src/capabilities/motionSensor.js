const { inherits } = require('util');
const Capability = require('./capability');

function MotionSensor() {
    Capability.apply(this, arguments);
}
inherits(MotionSensor, Capability);

MotionSensor.prototype.getState = function() {
    return this.getAttribute(MotionSensor, 'motion');
}

MotionSensor.SmartThingsCapability = 'motionSensor';
MotionSensor.ScryptedInterface = 'BinarySensor';
MotionSensor.Attributes = {
    "motion": function(value) {
        return value === 'active';
    }
}

module.exports = MotionSensor;
