// Admin tool screen (plain DOM, no framework).
interface IssuedKey {
  no: number;
  id: string;
  key: string;
  createdAt: string;
}
interface Status {
  state: 'ok' | 'missing' | 'broken';
  detail?: string;
  fingerprint?: string;
  matchesApp?: boolean | null;
  expected?: string | null;
  createdAt?: string;
  protection?: 'os' | 'none';
  source?: 'created' | 'imported';
  file: string;
}
declare const keygen: {
  status(): Promise<Status>;
  create(): Promise<{ ok: boolean; error?: string }>;
  importBackup(): Promise<{ ok: boolean; error?: string }>;
  backup(): Promise<{ saved: boolean; path?: string; error?: string }>;
  issue(count: number): Promise<{ ok: boolean; keys?: IssuedKey[]; error?: string }>;
  copy(text: string): Promise<void>;
  exportKeys(kind: 'txt' | 'csv', keys: IssuedKey[]): Promise<{ saved: boolean; path?: string; error?: string }>;
};

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let issued: IssuedKey[] = [];
let keyOk = false;
let toastTimer = 0;

function toast(text: string) {
  const t = $('toast');
  t.textContent = text;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (t.hidden = true), 2600);
}

function button(label: string, onClick: () => void, cls = '') {
  const b = document.createElement('button');
  b.textContent = label;
  if (cls) b.className = cls;
  b.addEventListener('click', onClick);
  return b;
}

async function refresh() {
  const s = await keygen.status();
  keyOk = s.state === 'ok';
  const box = $('key-status');
  const acts = $('key-actions');
  acts.replaceChildren();
  box.className = '';
  if (s.state === 'ok') {
    const lines = [`지문 <b>${s.fingerprint}</b> · ${s.source === 'imported' ? '백업에서 불러옴' : '이 컴퓨터에서 만듦'} · ${s.createdAt?.slice(0, 10)}`];
    if (s.matchesApp === true) lines.push('<span class="good">배포용 NAME ATELIER와 맞는 서명 키입니다.</span>');
    else if (s.matchesApp === false) {
      box.className = 'warn';
      lines.push(`<span class="bad">주의: 이 서명 키로 만든 인증키는 지금 배포된 NAME ATELIER(지문 ${s.expected})에서 통하지 않습니다.</span> 원래 서명 키의 백업을 불러오세요.`);
    }
    lines.push(s.protection === 'os' ? '이 Windows 계정에서만 열 수 있게 암호화되어 저장되어 있습니다.' : '<span class="bad">이 컴퓨터에서 암호화 저장을 쓸 수 없어 평문으로 저장되어 있습니다.</span>');
    lines.push('<b>백업을 꼭 오프라인 두 곳에 보관하세요.</b> 백업 없이 이 컴퓨터를 잃으면 새 인증키를 만들 수 없습니다.');
    box.innerHTML = lines.map((l) => `<p>${l}</p>`).join('');
    acts.append(
      button('비밀키 백업 저장', async () => {
        const r = await keygen.backup();
        if (r.saved) toast(`백업을 저장했습니다: ${r.path}`);
        else if (r.error) toast(r.error);
      }, 'primary'),
      button('백업에서 불러오기(교체)', async () => {
        if (!confirm('지금 서명 키를 백업 파일의 키로 교체합니다. 지금 키는 같은 폴더에 따로 남겨 둡니다. 계속할까요?')) return;
        const r = await keygen.importBackup();
        if (r.ok) toast('백업에서 서명 키를 불러왔습니다');
        else if (r.error) toast(r.error);
        refresh();
      }),
    );
  } else {
    box.className = 'warn';
    box.innerHTML =
      s.state === 'missing'
        ? `<p><b>서명 키가 없습니다.</b> 처음 사용한다면 새로 만들고, 다른 컴퓨터에서 쓰던 키가 있다면 백업에서 불러오세요.</p>${s.expected ? `<p class="bad">배포된 NAME ATELIER는 지문 ${s.expected}인 서명 키를 기다립니다. 새로 만든 키로는 그 버전에서 통하는 인증키를 만들 수 없으니 반드시 그 키의 백업을 불러오세요.</p>` : ''}`
        : `<p><b>서명 키를 쓸 수 없습니다.</b> ${s.detail}</p><p>백업 파일에서 다시 불러오세요.</p>`;
    acts.append(
      button('백업에서 불러오기', async () => {
        const r = await keygen.importBackup();
        if (r.ok) toast('백업에서 서명 키를 불러왔습니다');
        else if (r.error) toast(r.error);
        refresh();
      }, 'primary'),
    );
    if (s.state === 'missing')
      acts.append(
        button('새 서명 키 만들기', async () => {
          if (s.expected && !confirm('새 서명 키로 만든 인증키는 이미 배포된 NAME ATELIER에서 통하지 않습니다. 그래도 새로 만들까요?')) return;
          const r = await keygen.create();
          if (!r.ok) {
            if (r.error) toast(r.error);
            return refresh();
          }
          await refresh();
          // A new key exists only on this computer until it is backed up, so ask for the backup right away.
          alert('새 서명 키를 만들었습니다. 이어서 백업 파일을 저장하세요. 이 백업이 없으면 키를 잃었을 때 복구할 수 없습니다.');
          const b = await keygen.backup();
          toast(b.saved ? `백업을 저장했습니다: ${b.path}` : '백업을 저장하지 않았습니다. 「비밀키 백업 저장」을 꼭 눌러 주세요.');
        }),
      );
  }
  $<HTMLButtonElement>('issue-btn').disabled = !keyOk;
}

function render() {
  const tbody = document.querySelector('#keys tbody')!;
  tbody.replaceChildren(
    ...issued.map((k) => {
      const tr = document.createElement('tr');
      for (const v of [String(k.no), k.id, k.key]) {
        const td = document.createElement('td');
        td.textContent = v;
        tr.append(td);
      }
      return tr;
    }),
  );
  for (const id of ['copy-btn', 'txt-btn', 'csv-btn']) $<HTMLButtonElement>(id).disabled = !issued.length;
  $('count-label').textContent = issued.length ? `${issued.length}개` : '';
}

$('issue-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const n = Number($<HTMLInputElement>('count').value);
  const r = await keygen.issue(n);
  const msg = $('issue-msg');
  if (!r.ok) {
    msg.textContent = r.error ?? '만들지 못했습니다.';
    msg.className = 'msg bad';
    return;
  }
  issued = r.keys!;
  msg.textContent = `인증키 ${issued.length}개를 만들었습니다. 이 목록은 저장하지 않으면 창을 닫을 때 사라집니다.`;
  msg.className = 'msg good';
  render();
});
$('copy-btn').addEventListener('click', async () => {
  await keygen.copy(issued.map((k) => k.key).join('\r\n'));
  toast(`인증키 ${issued.length}개를 복사했습니다`);
});
for (const kind of ['txt', 'csv'] as const)
  $(`${kind}-btn`).addEventListener('click', async () => {
    const r = await keygen.exportKeys(kind, issued);
    if (r.saved) toast(`${kind.toUpperCase()}로 저장했습니다: ${r.path}`);
    else if (r.error) toast(`저장하지 못했습니다 (${r.error})`);
  });

refresh();
