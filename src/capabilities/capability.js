function Capability(client, id) {
    this.client = client;
    this.id = id;
    this.attributes = {};
}

Capability.prototype.command = function(capability, command, args) {
    return this.client.command(this.id, capability, command, args);
}

Capability.prototype.getAttribute = function(States, attribute) {
    return States[attribute](this.attributes[attribute], this.attributes);
}

module.exports = Capability;