const BASE64_KEYS= 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
function encode(guild_str) {
  let testInput = guild_str;
  let testoutput = [];
  testoutput[0] = testInput[0];
  testoutput[1] = testInput[1];
  for (var i = 2, j = 2; i < 32; i += 3) {
    var l1 = testInput[i + 0];
    var l2 = testInput[i + 1];
    var l3 = testInput[i + 2];
    var n1 = parseInt(l1, 16);
    var n2 = parseInt(l2, 16);
    var n3 = parseInt(l3, 16);
    var lhs = n1 << 2 | n2 >> 2;
    var rhs = (n2 & 3) << 4 | (n3 & 0xF);
    testoutput[j++] = BASE64_KEYS[lhs];
    testoutput[j++] = BASE64_KEYS[rhs];
  }
  return testoutput.join("");
}
exports.encode = encode;
