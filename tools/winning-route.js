// The preserved D4 replay remains in its checkpoint. Verify the current revision.
require('node:child_process').execFileSync(process.execPath,
  [require('node:path').join(__dirname,'storm-playthrough.js')],{stdio:'inherit'});
