const { inherits } = require('util');
const Capability = require('./capability');

function MotionSensor() {
    Capability.apply(this, arguments);
}
inherits(MotionSensor, Capability);

MotionSensor.SmartThingsCapability = 'motionSensor';
MotionSensor.ScryptedInterface = 'MotionSensor';
MotionSensor.Attributes = {
    "motion": function(state, value) {
        state.motionDetected = value === 'active';
    }
}

module.exports = MotionSensor;
