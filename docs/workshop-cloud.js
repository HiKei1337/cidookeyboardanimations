import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const config = window.CIDOO_SUPABASE_CONFIG || {};
const form = document.querySelector('#submit-form');
const status = document.querySelector('#submit-status');

if (config.url && config.publishableKey) {
  const supabase = createClient(config.url, config.publishableKey);
  window.CIDOO_SUPABASE = supabase;

  const copy = {
    ru: {
      sending: 'Отправляем…',
      success: 'Готово. Анимация отправлена на проверку.',
      missing: 'Выбери JSON-файл из конструктора.',
      invalid: 'Нужен корректный JSON с массивом frames.',
      tooLarge: 'Файл слишком большой: максимум 512 КБ.',
      error: 'Не получилось отправить. Попробуй ещё раз.'
      ,fields: 'Название и ник — минимум 2 символа. Описание не должно быть пустым.',
      invalidData: 'Проверь поля и JSON: файл должен быть экспортирован из конструктора CIDOO.',
      unavailable: 'Сервис отправки сейчас недоступен. Данные сохранены в форме — попробуй позже.'
    },
    en: {
      sending: 'Sending…',
      success: 'Done. Your animation is waiting for review.',
      missing: 'Choose a JSON file exported from the editor.',
      invalid: 'The JSON must contain a valid frames array.',
      tooLarge: 'The file is too large: 512 KB maximum.',
      error: 'Could not send it. Please try again.'
      ,fields: 'Name and author must contain at least 2 characters. Description cannot be empty.',
      invalidData: 'Check the fields and JSON: export your file from the CIDOO editor.',
      unavailable: 'The submission service is unavailable. Your form is preserved — try again later.'
    }
  };

  const currentLanguage = () => document.documentElement.lang === 'en' ? 'en' : 'ru';
  const say = key => copy[currentLanguage()][key];
  const showStatus = (message, error = false) => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', error);
  };

  const toEntry = row => {
    const safeTags = Array.isArray(row.tags) && row.tags.length ? row.tags.filter(tag => ['calm', 'bright', 'motion'].includes(tag)) : ['motion'];
    return {
      id: `cloud-${row.id}`,
      cloud: true,
      icon: '✦',
      tags: safeTags,
      animation: row.animation,
      ru: { name: row.name, desc: `${row.description} · ${row.author}` },
      en: { name: row.name, desc: `${row.description} · ${row.author}` }
    };
  };

  async function loadApproved() {
    const { data, error } = await supabase
      .from('workshop_submissions')
      .select('id,name,description,author,tags,animation,created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('[CIDOO Workshop] Could not load community animations', error.message);
      return;
    }
    window.CIDOO_WORKSHOP?.addCloudEntries((data || []).map(toEntry));
  }

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const name=form.elements.name.value.trim(),author=form.elements.author.value.trim(),description=form.elements.description.value.trim();
    if(name.length<2||author.length<2||!description.length)return showStatus(say('fields'),true);
    const file = form.elements.animation.files[0];
    if (!file) return showStatus(say('missing'), true);
    if (file.size > 524288) return showStatus(say('tooLarge'), true);
    let animation;
    try {
      animation = JSON.parse(await file.text());
    } catch {
      return showStatus(say('invalid'), true);
    }
    try { animation=window.CidooProject.validate(animation); } catch { return showStatus(say('invalid'),true); }
    if (!animation || typeof animation !== 'object' || !Array.isArray(animation.frames) || animation.frames.length > 120) {
      return showStatus(say('invalid'), true);
    }
    button.disabled = true;
    showStatus(say('sending'));
    const tags = ['motion'];
    if (animation.effect === 'static') tags.splice(0, 1, 'calm');
    if (animation.effect === 'rainbow' || animation.effect === 'wave') tags.push('bright');
    const { error } = await supabase.from('workshop_submissions').insert({
      name,
      author,
      description,
      tags: [...new Set(tags)].slice(0, 4),
      animation
    });
    button.disabled = false;
    if (error) {
      console.error('[CIDOO Workshop] Submission failed', error);
      return showStatus(say(error.code==='23514'||error.code==='P0001'?'invalidData':error.code==='42501'?'unavailable':'error'), true);
    }
    form.reset();
    showStatus(say('success'));
  });

  loadApproved();
} else {
  console.warn('[CIDOO Workshop] Supabase is not configured yet.');
}
