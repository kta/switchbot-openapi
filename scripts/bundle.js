#!/usr/bin/env node

/**
 * Bundle all OpenAPI YAML files into a single openapi.yaml file
 * Uses @redocly/cli to combine referenced files and validate the output
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function bundle() {
  console.log('🔨 Bundling OpenAPI specification...');

  try {
    // Bundle all YAML files into single file
    const bundleCmd = 'redocly bundle src/main.yaml -o openapi.yaml';
    const { stdout: bundleOut, stderr: bundleErr } = await execAsync(bundleCmd);

    if (bundleOut) console.log(bundleOut);
    if (bundleErr) console.error(bundleErr);

    console.log('✅ Bundle created: openapi.yaml');

    // Validate the bundled file
    console.log('\n🔍 Validating OpenAPI specification...');
    const validateCmd = 'redocly lint openapi.yaml';
    const { stdout: validateOut, stderr: validateErr } = await execAsync(validateCmd);

    if (validateOut) console.log(validateOut);
    if (validateErr) console.error(validateErr);

    console.log('✅ Validation passed');

  } catch (error) {
    console.error('❌ Error during bundle/validation:');
    console.error(error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    process.exit(1);
  }
}

bundle();
