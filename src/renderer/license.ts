// Key-entry screen shown before the main app. Talks only to window.atelier.license; the name engine is not loaded here.
import type { AtelierApi } from '../shared/types';

const api = (window as unknown as { atelier: AtelierApi }).atelier.license;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const key = $<HTMLTextAreaElement>('key');
const msg = $('msg');
const submit = $<HTMLButtonElement>('submit');

// Follow the system theme (the user's own theme setting can't be read before the app is licensed).
const dark = matchMedia('(prefers-color-scheme: dark)');
const applyTheme = () => document.documentElement.setAttribute('data-theme', dark.matches ? 'dark' : 'light');
applyTheme();
dark.addEventListener('change', applyTheme);

// Design assets are optional: without the wordmark files, show the text logo instead.
for (const img of Array.from(document.querySelectorAll<HTMLImageElement>('.brand img'))) {
  const fallback = () => {
    if (img.classList.contains('wordmark') && !document.querySelector('.wordmark-text')) {
      const t = document.createElement('span');
      t.className = 'wordmark-text';
      t.textContent = 'NAME ✦ ATELIER';
      img.replaceWith(t);
    } else img.remove();
  };
  if (img.complete && img.naturalWidth === 0) fallback();
  else img.addEventListener('error', fallback);
}

if (new URLSearchParams(location.search).get('reason') === 'corrupt') {
  const n = $('notice');
  n.textContent = '저장된 인증 정보를 확인할 수 없습니다. 인증키를 다시 입력해 주세요. 즐겨찾기와 설정은 그대로 남아 있습니다.';
  n.hidden = false;
}

function show(text: string, kind: 'bad' | 'good' | '' = 'bad') {
  msg.textContent = text;
  msg.className = `msg ${kind}`;
}

$('paste').addEventListener('click', async () => {
  const text = (await api.paste()).trim();
  if (!text) return show('클립보드에 붙여 넣을 내용이 없습니다. 인증키를 복사한 뒤 다시 눌러 주세요.');
  key.value = text;
  show('', '');
  key.focus();
});

key.addEventListener('input', () => msg.classList.contains('bad') && show('', ''));
// Enter submits; Shift+Enter still allows a line break in case someone pastes a multi-line key by hand.
key.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    $<HTMLFormElement>('form').requestSubmit();
  }
});

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  submit.disabled = true;
  try {
    const r = await api.activate(key.value);
    if (r.ok) {
      show('인증되었습니다. 작명 아틀리에를 엽니다…', 'good');
      key.disabled = true;
      return;
    }
    show(r.message ?? '인증하지 못했습니다.');
    key.focus();
    key.select();
  } finally {
    if (!key.disabled) submit.disabled = false;
  }
});
