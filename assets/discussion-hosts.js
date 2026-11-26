(() => {
  'use strict';

  if (window.DD_COMMUNITY_FEATURES?.discussionHosts !== true) return;

  const hosts = {
    investigator: 'The Investigator',
    scientist: 'The Scientist',
    historian: 'The Historian',
    sceptic: 'The Sceptic',
    explorer: 'The Explorer'
  };
  const isId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(value);
  const make = (tag, text, className) => {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  };
  const control = (label, action) => {
    const node = make('button', label, 'outline');
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  };
  const path = host => '/discussion-hosts#' + host;
  const dateLabel = value => new Date(value).toLocaleString();
  const timeLabel = minute => [Math.floor(minute / 60), minute % 60]
    .map(x => String(x).padStart(2, '0')).join(':');

  // Only the server determines what is an automated post. A user-written
  // display name, title or body can never produce an official badge.
  let pending = [];
  window.DDDiscussionHosts = Object.freeze({
    attach(target, row, rpc) {
      if (!isId(row?.id)) return;
      pending.push({target, id: row.id, date: row.created_at});
      if (pending.length !== 1) return;
      queueMicrotask(async () => {
        const batch = pending;
        pending = [];
        const ids = [...new Set(batch.map(item => item.id))];
        for (let offset = 0; offset < ids.length; offset += 30) {
          try {
            const verified = new Map((await rpc('dd_discussions_host_labels', {
              p_ids: ids.slice(offset, offset + 30)
            })).map(item => [item.id, item.host]));
            for (const item of batch) {
              const host = verified.get(item.id);
              if (!Object.hasOwn(hosts, host) || !item.target.isConnected) continue;
              const badge = make('a', hosts[host] + ' · Automated host', 'outline');
              badge.href = path(host);
              const tone = item.target.querySelector('.dd-forum-tone');
              item.target.replaceChildren(badge, make('small', dateLabel(item.date), 'muted'));
              if (tone) item.target.prepend(tone);
            }
          } catch {
            // The original post retains an explicit source-stamped disclosure.
          }
        }
      });
    }
  });

  const admin = document.getElementById('ddDiscussionHostAdmin');
  const config = window.DD_COMMUNITY_TEST_CONFIG;
  if (!admin || !config?.url || !window.supabase?.createClient) return;
  admin.hidden = false;
  const db = window.supabase.createClient(config.url, config.publishableKey, {
    auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: false}
  });
  const status = admin.querySelector('[role=status]');
  const queue = admin.querySelector('[data-host-queue]');
  let generation = 0;
  let busy = false;
  const message = value => { status.textContent = value; };
  async function owner() {
    const {data, error} = await db.auth.getUser();
    if (error || !data?.user?.id || data.user.is_anonymous) throw Error('Sign in with the site owner account.');
    return data.user.id;
  }
  async function rpc(name, args = {}) {
    const {data, error} = await db.rpc(name, args);
    if (error) throw Error(String(error.message || 'Request unavailable').slice(0, 180));
    return data;
  }
  async function call(action) {
    if (busy || !admin.open) return;
    busy = true;
    const stamp = generation;
    queue.inert = true;
    try {
      const before = await owner();
      if (stamp !== generation) return;
      if (action) await action();
      const data = await rpc('dd_host_admin_queue');
      if (stamp !== generation || (await owner()) !== before || !admin.open) return;
      render(data);
      message(action ? 'Change saved.' : 'Discussion Host queue loaded.');
    } catch (error) {
      if (stamp === generation) {
        if (!action) queue.replaceChildren();
        message(error.message);
      }
    } finally {
      busy = false;
      queue.inert = false;
      if (stamp !== generation && admin.open) void call();
    }
  }

  function field(label, input) {
    const wrapper = make('label');
    wrapper.append(make('span', label), input);
    return wrapper;
  }

  function postCard(post, sections) {
    const card = make('details', null, 'dd-forum-item');
    card.append(make('summary', 'Day ' + post.day + ' · ' + timeLabel(post.minute) + ' UTC · ' +
      post.state + ' · ' + post.title));
    card.append(make('p', hosts[post.host] + ' · Automated host'));
    card.append(make('p', post.body));
    if (post.source) {
      const source = make('a', 'Check source');
      source.href = post.source;
      card.append(source);
    }
    const actions = make('div', null, 'dd-forum-actions');
    if (post.state === 'draft') {
      actions.append(control('Approve post', () => call(() => rpc('dd_host_admin_post', {p_id: post.id, p_action: 'approve'}))));
    }
    if (['draft','approved'].includes(post.state)) {
      actions.append(control('Cancel post', () => {
        if (confirm('Cancel this scheduled post?')) void call(() => rpc('dd_host_admin_post', {p_id: post.id, p_action: 'cancel'}));
      }));
      const form = make('form');
      const title = make('input'); title.value = post.title; title.maxLength = 150; title.required = true;
      const body = make('textarea'); body.value = post.body; body.rows = 5; body.maxLength = 4700; body.required = true;
      const source = make('input'); source.type = 'url'; source.value = post.source || ''; source.maxLength = 1000;
      const section = make('select');
      for (const item of sections) section.add(new Option(item.title, item.key));
      section.value = post.section_key;
      section.required = true;
      const time = make('input'); time.type = 'time'; time.value = timeLabel(post.minute); time.required = true;
      const windows = [['06:00','11:59'],['12:00','16:59'],['17:00','23:00']];
      [time.min,time.max] = windows[post.slot - 1];
      const save = make('button', 'Save edits for review', 'outline');
      save.type = 'submit';
      form.append(field('Title',title), field('Post',body), field('Source URL',source),
        field('Discussion subject',section), field('Time (UTC)',time), save);
      form.addEventListener('submit', event => {
        event.preventDefault();
        const [hour, minute] = time.value.split(':').map(Number);
        void call(() => rpc('dd_host_admin_edit', {
          p_id: post.id, p_title: title.value, p_body: body.value, p_source: source.value,
          p_section: section.value, p_minute: hour * 60 + minute
        }));
      });
      const edit = make('details');
      edit.append(make('summary','Edit post and time'), form);
      card.append(edit);
    }
    if (post.state === 'published') {
      actions.append(control('Remove from Discussions', () => {
        if (confirm('Remove this automated post and hide its thread from public view?')) {
          void call(() => rpc('dd_host_admin_post', {p_id: post.id, p_action: 'remove'}));
        }
      }));
    }
    card.append(actions);
    return card;
  }

  function render(data) {
    if (!data?.trial || !Array.isArray(data.posts) || !Array.isArray(data.sections)) {
      throw Error('The server did not return a valid owner queue.');
    }
    const trial = data.trial;
    const summary = make('p', 'Trial: ' + (trial.paused ? 'paused' : 'running') +
      ' · Scheduler ' + (trial.enabled_by_operator ? 'enabled by operator' : 'locked') +
      ' · Day one: ' + (trial.starts_on || 'unscheduled'));
    const start = make('input'); start.type = 'date'; start.value = trial.starts_on || ''; start.required = true;
    const schedule = make('form');
    const apply = make('button', 'Set start date', 'outline'); apply.type = 'submit';
    apply.disabled = !trial.paused || data.posts.some(post => post.posted_at);
    schedule.append(field('Day one (UTC)', start), apply);
    schedule.addEventListener('submit', event => {
      event.preventDefault();
      void call(() => rpc('dd_host_admin_control', {p_action: 'schedule', p_day_one: start.value}));
    });
    const toggle = control(trial.paused ? 'Resume posting' : 'Pause posting', () => {
      if (trial.paused && !confirm('Allow scheduled posts to publish during this trial?')) return;
      void call(() => rpc('dd_host_admin_control', {p_action: trial.paused ? 'resume' : 'pause'}));
    });
    toggle.disabled = trial.paused && (!trial.enabled_by_operator || !trial.starts_on);
    const audit = make('details');
    audit.append(make('summary','Recent activity'));
    for (const row of data.audit || []) audit.append(make('p', dateLabel(row.occurred_at) + ' · ' + row.action));
    const posts = data.posts.map(post => postCard(post,data.sections));
    queue.replaceChildren(summary, schedule, toggle, audit, ...posts);
  }
  admin.addEventListener('toggle', () => {
    if (admin.open) void call();
    else {
      generation++;
      queue.replaceChildren();
    }
  });
  db.auth.onAuthStateChange(event => {
    if (!['SIGNED_OUT','SIGNED_IN','USER_UPDATED'].includes(event)) return;
    generation++;
    queue.replaceChildren();
    message('Open the dashboard again to verify access.');
    admin.open = false;
  });
})();
