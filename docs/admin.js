import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const config = window.CIDOO_SUPABASE_CONFIG || {};
const supabase = config.url && config.publishableKey ? createClient(config.url, config.publishableKey) : null;
const $ = selector => document.querySelector(selector);
const previewAnimations = new Map();
const reactionPreviews=new WeakMap();
setInterval(()=>{
  if(document.hidden)return;
  for(const [canvas,project] of previewAnimations){
    const colors=new Uint8Array(396);
    CidooHeartMath.paint(colors,new Uint8Array(project.sourceColors),performance.now()/1000,project);
    if(project.reactiveMode&&project.reactiveMode!=='off'){let demo=reactionPreviews.get(canvas);if(!demo){demo={engine:new CidooHeartMath.Reactions(),next:0,index:0};reactionPreviews.set(canvas,demo);}const now=performance.now()/1000;if(now>=demo.next){demo.engine.press([45,73,95,116][demo.index++%4],now);demo.next=now+1.8;}demo.engine.paint(colors,now,project,project.sourceColors);}
    CidooKeyboardPreview.draw(canvas,Array.from(colors));
  }
},125);
const copy = {
  ru: { back: 'Воркшоп', supabase: 'Supabase ↗', kicker: 'ПАНЕЛЬ МОДЕРАЦИИ', title: 'Проверь новые анимации.', lead: 'Одобренные работы появятся в публичной коллекции. Черновики и отклонённые заявки остаются скрыты.', loginTitle: 'Вход владельца', loginCopy: 'Используй аккаунт Supabase Auth, который добавлен в список администраторов.', email: 'Email', password: 'Пароль', login: 'Войти', queueKicker: 'ОЧЕРЕДЬ', queueTitle: 'Заявки на проверку', logout: 'Выйти', footer: 'CIDOO Workshop · панель модерации', backToWorkshop: 'Открыть воркшоп ↗', approve: 'Одобрить', reject: 'Отклонить', note: 'Комментарий для автора (необязательно)', empty: 'Новых заявок пока нет.', needAdmin: 'Вход выполнен, но этот аккаунт не добавлен в администраторы.', config: 'Supabase ещё не настроен.', failed: 'Не удалось загрузить заявки.', approved: 'Одобрено', rejected: 'Отклонено', pending: 'На проверке' },
  en: { back: 'Workshop', supabase: 'Supabase ↗', kicker: 'MODERATION DESK', title: 'Review new animations.', lead: 'Approved work appears in the public collection. Drafts and rejected submissions stay hidden.', loginTitle: 'Owner sign in', loginCopy: 'Use a Supabase Auth account that was added to the admin list.', email: 'Email', password: 'Password', login: 'Sign in', queueKicker: 'QUEUE', queueTitle: 'Submissions to review', logout: 'Sign out', footer: 'CIDOO Workshop · moderation desk', backToWorkshop: 'Open workshop ↗', approve: 'Approve', reject: 'Reject', note: 'Note for the author (optional)', empty: 'No new submissions yet.', needAdmin: 'You are signed in, but this account is not an admin.', config: 'Supabase is not configured yet.', failed: 'Could not load submissions.', approved: 'Approved', rejected: 'Rejected', pending: 'Pending' }
};
let language = localStorage.getItem('cidoo-landing-language') === 'en' ? 'en' : 'ru';
const t = key => copy[language][key];
function translate() {
  document.documentElement.lang = language;
  document.querySelectorAll('[data-i]').forEach(el => { if (copy[language][el.dataset.i]) el.innerHTML = copy[language][el.dataset.i]; });
  document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
}
function setStatus(target, message, error = false) { if (!target) return; target.textContent = message; target.classList.toggle('error', error); }
translate();
document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => { language = button.dataset.language === 'en' ? 'en' : 'ru'; localStorage.setItem('cidoo-landing-language', language); translate(); renderQueue(window.__CIDOO_SUBMISSIONS || []); }));

if (!supabase) {
  setStatus($('#login-status'), t('config'), true);
} else {
  const loginForm = $('#login-form');
  const createAccount=document.createElement('button');createAccount.type='button';createAccount.className='button';createAccount.textContent='Создать аккаунт владельца / Create owner account';loginForm.append(createAccount);
  createAccount.addEventListener('click',async()=>{if(!loginForm.reportValidity())return;createAccount.disabled=true;const {error}=await supabase.auth.signUp({email:loginForm.elements.email.value.trim(),password:loginForm.elements.password.value,options:{emailRedirectTo:location.origin+location.pathname}});createAccount.disabled=false;setStatus($('#login-status'),error?error.message:(language==='ru'?'Подтверди email по ссылке в письме, затем вернись сюда и войди.':'Confirm your email using the link, then return here and sign in.'),!!error);});
  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    setStatus($('#login-status'), '…');
    const { error } = await supabase.auth.signInWithPassword({ email: loginForm.elements.email.value.trim(), password: loginForm.elements.password.value });
    if (error) return setStatus($('#login-status'), error.message, true);
    await loadDesk();
  });
  $('#logout').addEventListener('click', async () => { await supabase.auth.signOut(); $('#desk').hidden = true; $('#login-panel').hidden = false; });
  supabase.auth.getSession().then(({ data }) => { if (data.session) loadDesk(); });
}

async function loadDesk() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;
  const { data: admin } = await supabase.from('workshop_admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!admin) return setStatus($('#login-status'), t('needAdmin'), true);
  $('#login-panel').hidden = true;
  $('#desk').hidden = false;
  setStatus($('#desk-status'), '');
  await refreshQueue();
}
async function refreshQueue() {
  const { data, error } = await supabase.from('workshop_submissions').select('id,name,description,author,tags,animation,status,review_note,created_at').order('created_at', { ascending: false });
  if (error) return setStatus($('#desk-status'), t('failed'), true);
  window.__CIDOO_SUBMISSIONS = data || [];
  renderQueue(window.__CIDOO_SUBMISSIONS);
}
function renderQueue(rows) {
  const holder = $('#submissions');
  if (!holder) return;
  holder.replaceChildren();
  previewAnimations.clear();
  const pending = rows.filter(row => row.status === 'pending');
  if (!pending.length) { holder.innerHTML = `<p class="empty-queue">${t('empty')}</p>`; return; }
  pending.forEach(row => {
    const card = document.createElement('article'); card.className = 'submission';
    const title = document.createElement('h3'); title.textContent = row.name;
    const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `${row.author} · ${new Date(row.created_at).toLocaleString()}`;
    const desc = document.createElement('p'); desc.className = 'description'; desc.textContent = row.description;
    const preview = document.createElement('div');preview.className='submission-preview';
    const canvas=document.createElement('canvas');canvas.width=760;canvas.height=240;canvas.setAttribute('aria-label',row.name);
    const caption=document.createElement('div');caption.className='preview-meta';caption.textContent=`● LIVE PREVIEW · ${row.animation?.frames?.length || 0} frames · Layer 2`;
    preview.append(canvas,caption);
    try{const project=CidooProject.validate(row.animation);previewAnimations.set(canvas,project);CidooKeyboardPreview.draw(canvas,project.frames[0]?.colors||project.sourceColors);}catch{caption.textContent=language==='ru'?'Не удалось показать этот JSON. Проверь файл в конструкторе.':'Cannot preview this JSON. Check it in the editor.';}
    const note = document.createElement('textarea'); note.rows = 2; note.placeholder = t('note');
    const actions = document.createElement('div'); actions.className = 'actions';
    const download = document.createElement('a'); download.className = 'button'; download.download = `${row.name.replace(/[^\p{L}\p{N}_-]+/gu, '-') || 'animation'}.json`; download.href = URL.createObjectURL(new Blob([JSON.stringify(row.animation, null, 2)], { type: 'application/json' })); download.textContent = 'JSON';
    const approve = document.createElement('button'); approve.className = 'approve'; approve.textContent = t('approve'); approve.addEventListener('click', () => moderate(row, 'approved', note.value));
    const reject = document.createElement('button'); reject.className = 'reject'; reject.textContent = t('reject'); reject.addEventListener('click', () => moderate(row, 'rejected', note.value));
    const open=document.createElement('a');open.className='button';open.href='studio.html';open.textContent=language==='ru'?'Открыть в конструкторе':'Open in editor';open.addEventListener('click',()=>localStorage.setItem('cidooStudio.studioDraft',JSON.stringify(row.animation)));
    actions.append(download,open, approve, reject); card.append(title, meta, desc, preview, note, actions); holder.append(card);
  });
}
async function moderate(row, status, note) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user; if (!user) return;
  const { error } = await supabase.from('workshop_submissions').update({ status, review_note: note.slice(0, 500), reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq('id', row.id);
  if (error) return setStatus($('#desk-status'), error.message, true);
  await refreshQueue();
}
