'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const loaderStart = html.indexOf('const disclosureClipSeed=');
const loaderEnd = html.indexOf('function pauseClips()', loaderStart);
assert(loaderStart >= 0 && loaderEnd > loaderStart);
const loader = html.slice(loaderStart, loaderEnd);
const snapshot = JSON.parse(fs.readFileSync(path.join(root, 'data/disclosure-clips.json'), 'utf8'));
const curated = JSON.parse(fs.readFileSync(path.join(root, 'data/curated-official-videos.json'), 'utf8'));
const bundledPath = 'data/disclosure-clips.json';
const remotePath = 'https://raw.githubusercontent.com/boydamo84-coder/disclosure-desk-preview/main/data/disclosure-clips.json';
const newClip = {...snapshot[0], id:'yt-00000000001', youtubeId:'00000000001',
  source:'https://www.youtube.com/watch?v=00000000001'};

async function run(hostname, remote, {bundled = snapshot, expire = false} = {}) {
  const calls = [];
  const shown = [];
  const fakeFetch = async (url, options) => {
    calls.push(url);
    if (url === remotePath) {
      assert.equal(options.credentials, 'omit');
      assert.equal(options.referrerPolicy, 'no-referrer');
      if (expire) {
        await new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () => reject(options.signal.reason), {once:true});
        });
      }
      return new Response(typeof remote === 'string' ? remote : JSON.stringify(remote),
        {status:remote === null ? 503 : 200});
    }
    const rows = url === bundledPath ? bundled : curated;
    return new Response(JSON.stringify(rows), {status:rows === null ? 404 : 200});
  };
  const context = vm.createContext({
    location:{hostname}, AbortController, fetch:fakeFetch, clearTimeout,
    setTimeout:expire ? callback => setTimeout(callback, 0) : setTimeout,
    safePublicUrl: value => {try {return new URL(value).protocol === 'https:';} catch {return false;}},
    $: () => ({classList:{contains:() => false}}),
    ddUpdateBadge: (name, ids) => { assert.equal(name, 'videos'); shown.push(...ids); },
    renderClips: () => calls.push('render'),
    ddOpenVideoTarget: () => calls.push('openVideoTarget')
  });
  const ids = await vm.runInContext(`${loader}\nloadDisclosureClips().then(()=>disclosureClips.map(clip=>clip.id))`, context);
  return {calls, shown, ids};
}

test('production uses the current collector and opens shared video targets after loading', async () => {
  const {calls, shown, ids} = await run('uapdisclosuredesk.com', [newClip, ...snapshot]);
  assert(calls.includes(remotePath));
  assert(!calls.includes(bundledPath));
  assert(ids.includes(newClip.id) && shown.includes(newClip.id));
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(calls.slice(-2), ['render', 'openVideoTarget']);
});

test('production uses the snapshot for unavailable, malformed, stale or duplicate feeds', async () => {
  const responses = [null, '{', [newClip], [snapshot[0], ...snapshot], [null, ...snapshot]];
  for (const response of responses) {
    const {calls, ids} = await run('www.uapdisclosuredesk.com', response);
    assert(calls.includes(remotePath) && calls.includes(bundledPath));
    assert(ids.includes(snapshot[0].id));
    assert(!ids.includes(newClip.id));
  }
});

test('a slow remote falls back and a missing snapshot still shows curated source records', async () => {
  const {calls, ids} = await run('uap-disclosure-desk.netlify.app', null, {bundled:null, expire:true});
  assert(calls.includes(bundledPath));
  assert(ids.includes(curated[0].id));
  assert(ids.includes('official'));
});

test('local and APK previews use the bundled catalogue without contacting GitHub', async () => {
  const {calls, ids} = await run('127.0.0.1', [newClip, ...snapshot]);
  assert(calls.includes(bundledPath));
  assert(!calls.includes(remotePath));
  assert(ids.includes(snapshot[0].id));
});
