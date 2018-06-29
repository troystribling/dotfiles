var symbols = [];

require("fs").readdirSync(__dirname + "/data").forEach(function(file) {
  symbols = symbols.concat(require(__dirname + "/data/" + file));
});

module.exports = symbols;
