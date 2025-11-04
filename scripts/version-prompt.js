#!/usr/bin/env node

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n📦 Version Increment for npm publish\n');

rl.question('Select version type (patch/minor/major) [patch]: ', (answer) => {
  const versionType = answer.trim().toLowerCase() || 'patch';

  if (!['patch', 'minor', 'major'].includes(versionType)) {
    console.error('❌ Invalid version type. Must be patch, minor, or major.');
    process.exit(1);
  }

  try {
    console.log(`\n🔄 Running: npm version ${versionType}\n`);
    execSync(`npm version ${versionType}`, { stdio: 'inherit' });
    console.log('\n✅ Version updated successfully!\n');

    console.log('📤 Pushing version commit to remote...\n');
    execSync('git push', { stdio: 'inherit' });
    console.log('\n🏷️  Pushing version tag to remote...\n');
    execSync('git push --tags', { stdio: 'inherit' });
    console.log('\n✅ Version and tag pushed successfully!\n');
  } catch (error) {
    console.error('\n❌ Failed to update version or push to remote');
    console.error('💡 You may need to manually push: git push && git push --tags\n');
    process.exit(1);
  }

  rl.close();
});
