import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';

const root = new URL('..', import.meta.url);

function readText(relativePath) {
  return readFileSync(new URL(relativePath, root), 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function userFacingLines(markdown) {
  const collected = [];
  let inChanges = false;
  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    if (/^##(?!#)\s+/.test(trimmed)) {
      if (inChanges) break;
      if (/^##(?!#)\s+What Changed\s*$/.test(trimmed)) inChanges = true;
      continue;
    }
    if (!inChanges) continue;
    if (/^([-*_])\1{2,}$/.test(trimmed)) continue;
    const heading = trimmed.match(/^(#{1,6})(?!#)(\s*)(.*)$/);
    if (heading) {
      collected.push(`${heading[1]} ${heading[3].trim()}`);
      continue;
    }
    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    if (bullet) {
      collected.push(`- ${bullet[1].trim()}`);
      continue;
    }
    collected.push(line.trimEnd());
  }
  while (collected.length > 0 && collected[0].trim() === '') collected.shift();
  while (collected.length > 0 && collected[collected.length - 1].trim() === '') collected.pop();
  const collapsed = [];
  let previousBlank = false;
  for (const entry of collected) {
    const blank = entry.trim() === '';
    if (blank && previousBlank) continue;
    collapsed.push(blank ? '' : entry);
    previousBlank = blank;
  }
  return collapsed;
}

export function buildChangelog(moduleTitle, notesDirectory = new URL('release-notes/', root)) {
  const versions = readdirSync(notesDirectory)
    .filter(name => /^RELEASE-NOTES-\d+\.\d+\.\d+\.md$/.test(name))
    .map(name => {
      const version = name.match(/^RELEASE-NOTES-(\d+\.\d+\.\d+)\.md$/)[1];
      return {version, name};
    })
    .sort((left, right) => {
      const a = left.version.split('.').map(Number);
      const b = right.version.split('.').map(Number);
      for (let index = 0; index < 3; index += 1) {
        if (a[index] !== b[index]) return b[index] - a[index];
      }
      return 0;
    });
  assert.ok(versions.length > 0, 'expected versioned release notes');
  const lines = [`# ${moduleTitle} Changelog`, ''];
  versions.forEach((entry, index) => {
    if (index > 0) lines.push('');
    lines.push(`## ${entry.version}`, '');
    lines.push(...userFacingLines(readText(`release-notes/${entry.name}`)));
  });
  return `${lines.join('\n')}\n`;
}

const manifest = JSON.parse(readText('module.json'));
const releaseConfig = JSON.parse(readText('release.config.json'));
const expected = buildChangelog(manifest.title);

test('CHANGELOG.md is the cumulative user-facing release history', () => {
  const changelog = readText('CHANGELOG.md');
  assert.equal(changelog, expected);
  assert.equal(changelog.startsWith(`# ${manifest.title} Changelog\n`), true);
  assert.equal(changelog.includes('\n---\n') || changelog.split('\n').includes('---'), false);
  for (const line of changelog.split('\n')) {
    if (/^#{1,6}/.test(line)) assert.match(line, /^#{1,6} \S/);
    if (/^\s*[-*+] /.test(line)) assert.match(line, /^- /);
  }
  const versions = changelog.split('\n').filter(line => /^## \d+\.\d+\.\d+$/.test(line)).map(line => line.slice(3));
  const expectedVersions = expected.split('\n').filter(line => /^## \d+\.\d+\.\d+$/.test(line)).map(line => line.slice(3));
  assert.deepEqual(versions, expectedVersions);
  const newest = versions[0].split('.').map(Number);
  const previous = versions[1].split('.').map(Number);
  assert.equal(newest.some((part, index) => part > previous[index]), true);
  assert.equal(changelog.includes('## Verification'), false);
  assert.equal(changelog.includes('## Validation'), false);
  assert.equal(changelog.includes('## Compatibility and verification'), false);
  assert.equal(changelog.includes('All 103 automated tests pass'), false);
  assert.match(changelog, /^- Requires Morelord Core 0\.5\.1 or later\./m);
});

test('release packaging requires the root changelog', () => {
  assert.equal(releaseConfig.requiredPaths.includes('CHANGELOG.md'), true);
  const releaseScript = readText('release.ps1');
  assert.match(releaseScript, /function Update-Changelog/);
  assert.match(releaseScript, /git add -- module\.json CHANGELOG\.md/);
  assert.match(releaseScript, /\[switch\]\$ValidateOnly/);
});
