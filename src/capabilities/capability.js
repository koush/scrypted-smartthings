function Capability(client, id) {
    this.client = client;
    this.id = id;
}

Capability.prototype.command = function(capability, command, args) {
    return this.client.command(this.id, capability, command, args)
    .then(response => console.log(response.data))
    .catch(e => console.log(e));
}

module.exports = Capability;