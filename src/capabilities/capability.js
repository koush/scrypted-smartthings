function Capability(client, id) {
    this.client = client;
    this.id = id;
}

Capability.prototype.command = function(capability, command, args) {
    return this.client.command(this.id, capability, command, args);
}

module.exports = Capability;