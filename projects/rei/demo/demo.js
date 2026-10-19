// Standalone product demonstration. No account access, network calls, AI runtime,
// storage, desktop IPC, or imports from the user's real REI data.
const TODAY = '2026-10-19';
const e = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parseDate = value => new Date(`${value}T12:00:00`);
const iso = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const shift = (value, days) => {const date = parseDate(value); date.setDate(date.getDate()+days); return iso(date);};
const longDate = value => parseDate(value).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'});
const icons = {
  today:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
  tasks:'<circle cx="12" cy="12" r="9"/><path d="m7 12 3 3 7-7"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 2v6m8-6v6"/>',
  messages:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m3 6 9 7 9-7"/>',
  assistant:'<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>'
};
const messages = [
  {id:'groups',sender:'Course announcements',subject:'Your tutorial groups are ready',date:'19 Oct · 09:15',tag:'Important',body:'Hello everyone,\n\nYour tutorial groups are now listed in the course portal. Please check your assigned group before tutorials begin next week. Group submissions may include up to two students from the same tutorial group.\n\nThe course team',summary:'Check your assigned tutorial group before next week. Work with a partner from the same group.',quote:'Please check your assigned group before tutorials begin next week.'},
  {id:'room',sender:'Mathematics I',subject:'Thursday: a different room, same time',date:'19 Oct · 08:40',tag:'Important',body:'For Thursday, 22 October only, Mathematics I will meet in Room B204 instead of A101. The 10:00 start time stays the same. Next week we return to A101.',summary:'Thursday’s mathematics class moves to B204. The time stays 10:00, and the usual room returns next week.',quote:'For Thursday, 22 October only, Mathematics I will meet in Room B204 instead of A101.'},
  {id:'worksheet',sender:'Mathematics I',subject:'Worksheet 2 is available',date:'18 Oct · 16:20',tag:'Suggested task',body:'Worksheet 2 is available in the course portal. Please submit your solutions by Friday, 23 October at 12:00. You can discuss the problems during the next tutorial.',summary:'Submit Worksheet 2 by Friday, 23 October at 12:00.',quote:'Please submit your solutions by Friday, 23 October at 12:00.'},
  {id:'receipt',sender:'Course portal',subject:'Your worksheet submission was received',date:'18 Oct · 14:05',tag:'Routine',body:'Your submission for Worksheet 1 was received successfully. No further action is needed. This is an automated confirmation.',summary:'Worksheet 1 submission confirmed. No further action needed.',quote:'No further action is needed.'},
  {id:'newsletter',sender:'Campus newsletter',subject:'This week around campus',date:'18 Oct · 10:00',tag:'Routine',body:'This week: a photography exhibition, a campus walking tour, and the monthly alumni newsletter. Browse these optional activities whenever you have time.',summary:'Optional campus activities. Kept out of the important briefing.',quote:'Browse these optional activities whenever you have time.'}
];
const routines = [
  {id:'math',title:'Mathematics I',days:[1,4],time:'10:00',category:'School'},
  {id:'language',title:'Spanish class',days:[2],time:'08:00',category:'School'},
  {id:'computing',title:'Computing tutorial',days:[1],time:'14:00',category:'School'}
];
const seedTasks = () => [
  {id:'reading',title:'Read the next chapter',date:TODAY,time:'12:00',category:'School',done:false},
  {id:'group',title:'Check my tutorial group',date:'2026-10-20',time:'',category:'School',done:false},
  {id:'trip',title:'Trip to Frankfurt',date:'2026-10-21',time:'',category:'Personal',done:false}
];

export function mountDemo(doc, win) {
  let tasks, completed, summarized, approved, selected, month, filter, search, nextId;
  const screen = doc.querySelector('#screen');
  const navigation = doc.querySelector('#navigation');
  const editor = doc.querySelector('#editor');
  const form = doc.querySelector('#task-form');
  const messageDialog = doc.querySelector('#message-dialog');
  let toastTimer;
  function reset() {tasks=seedTasks();completed=new Set();summarized=false;approved=false;selected=TODAY;month='2026-10-01';filter='one-time';search='';nextId=0;}
  reset();
  const route = () => ['today','tasks','calendar','messages','assistant'].includes(win.location.hash.slice(1)) ? win.location.hash.slice(1) : 'today';
  const go = destination => {if(route()===destination) render();else win.location.hash=destination;};
  function toast(text) {win.clearTimeout(toastTimer);doc.querySelector('#notice').textContent=text;toastTimer=win.setTimeout(()=>{doc.querySelector('#notice').textContent='';},4000);}
  const heading = (title,subtitle,action='') => `<header class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${action}</header>`;
  const addButton = '<button class="primary" data-action="add">+ Add task</button>';
  const sourceButton = id => `<button class="secondary" data-message="${id}">View sample message ↗</button>`;
  function activities(date) {
    const weekday = parseDate(date).getDay();
    const scheduled = date < TODAY ? [] : routines.filter(r=>r.days.includes(weekday)).map(r=>({...r,id:`${r.id}:${date}`,date,kind:'Scheduled',done:completed.has(`${r.id}:${date}`)}));
    return [...scheduled,...tasks.filter(t=>t.date===date).map(t=>({...t,kind:'Task'}))];
  }
  function taskRow(task,extra='') {
    return `<div class="task-row ${task.done?'is-done':''}"><input class="check" type="checkbox" data-complete="${e(task.id)}" aria-label="Complete ${e(task.title)}" ${task.done?'checked':''}><div class="task-copy"><strong>${e(task.title)}</strong><small>${e(task.time||'All day')} · ${e(task.kind||'Task')}${extra}</small></div></div>`;
  }
  function todayView() {
    const start=shift(selected,-((parseDate(selected).getDay()+6)%7));
    const daily=activities(selected);
    const planned=daily.filter(t=>t.kind==='Task'&&t.time);
    const unplanned=daily.filter(t=>t.kind==='Task'&&!t.time);
    const entries=daily.filter(t=>t.time);
    const firstHour=Math.min(8,...entries.map(t=>Number(t.time.slice(0,2))));
    const lastHour=Math.max(20,...entries.map(t=>Math.min(24,Number(t.time.slice(0,2))+2)));
    return heading('Today',`${longDate(selected)} · Sample week`,addButton)+
      `<div class="week-strip"><button data-day="${shift(selected,-7)}" aria-label="Previous week">‹</button>${Array.from({length:7},(_,i)=>{const day=shift(start,i);return `<button class="day-button ${selected===day?'selected':''}" data-day="${day}" aria-pressed="${selected===day}"><small>${parseDate(day).toLocaleDateString('en-GB',{weekday:'short'})}</small><span>${parseDate(day).getDate()}</span></button>`;}).join('')}<button data-day="${shift(selected,7)}" aria-label="Next week">›</button><button data-action="today">Today</button></div>`+
      `<div class="today-grid"><div><section class="daily-review"><p class="eyebrow">Your study assistant</p><h2>Daily review</h2><p>5 sample messages · 3 important updates · 2 routine</p><ul class="review-summary"><li>Check your assigned tutorial group.</li><li>Thursday’s mathematics class is in Room B204.</li><li>Worksheet 2 is due Friday at 12:00.</li></ul><div class="review-bottom"><a href="#assistant">Open sample summary →</a><span>${approved?'Task added to your plan':'1 task waiting for review'}</span></div></section>
      <section class="task-section"><div class="section-heading"><h2>Planned for this day</h2><small>${planned.length} task${planned.length===1?'':'s'}</small></div>${planned.map(t=>taskRow(t)).join('')||'<p class="empty">No work blocks planned for this day.</p>'}</section>
      <section class="task-section"><div class="section-heading"><h2>Not planned yet</h2><a href="#tasks">All tasks →</a></div>${unplanned.map(t=>taskRow(t)).join('')||'<p class="empty">Nothing waiting here. A little room for your day.</p>'}</section>
      <details class="task-section"><summary>Upcoming tasks · next 6 days</summary>${tasks.filter(t=>t.date>selected&&t.date<=shift(selected,6)).map(t=>taskRow(t,` · ${e(longDate(t.date))}`)).join('')||'<p class="empty">No upcoming one-time tasks.</p>'}</details></div>
      <section class="timeline"><div class="timeline-header"><h2>Your day</h2><small>${parseDate(selected).getDate()} ${parseDate(selected).toLocaleDateString('en-GB',{month:'short'})}</small></div><p class="timeline-zone">Sample schedule · Europe/Berlin</p><div class="timeline-body">${Array.from({length:lastHour-firstHour+1},(_,i)=>`<div class="hour" style="top:${i*70}px">${String(i+firstHour).padStart(2,'0')}:00</div>`).join('')}${entries.map(t=>{const [hour,minute]=t.time.split(':').map(Number);return `<div class="timeline-entry ${t.done?'is-done':''}" style="top:${(hour-firstHour)*70+minute*70/60}px"><div class="timeline-meta">${e(t.time)} · ${e(t.kind)}</div><div class="timeline-title">${e(t.title)}</div><label><input class="check" type="checkbox" aria-label="Complete ${e(t.title)}" data-complete="${e(t.id)}" ${t.done?'checked':''}>${t.done?'Completed':'Complete'}</label></div>`;}).join('')}</div><p class="timeline-note">Classes and planned tasks share one timeline. Try checking one off.</p></section></div>`;
  }
  function tasksView() {
    return heading('Tasks','One-time work and repeating classes, each with their own space.',addButton)+`<div class="tabs" role="group" aria-label="Task type"><button data-filter="one-time" aria-pressed="${filter==='one-time'}">One-time · ${tasks.length}</button><button data-filter="scheduled" aria-pressed="${filter==='scheduled'}">Scheduled · ${routines.length}</button></div>${filter==='one-time'?tasks.map(t=>taskRow(t,` · ${e(longDate(t.date))}`)).join(''):routines.map(r=>`<div class="task-row"><div class="task-copy"><strong>${e(r.title)}</strong><small>Every ${r.days.map(d=>['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d]).join(' & ')} · ${r.time}</small></div></div>`).join('')}<p class="routine-note">Demo changes stay in this tab until you refresh or reset. In the desktop app, your plan is saved on your computer.</p>`;
  }
  function calendarView() {
    const first=parseDate(month), offset=(first.getDay()+6)%7, end=new Date(first.getFullYear(),first.getMonth()+1,0).getDate();
    const cells=Array.from({length:offset},()=>'<div class="calendar-day" aria-hidden="true"></div>');
    for(let i=1;i<=end;i++) {
      const date=`${month.slice(0,8)}${String(i).padStart(2,'0')}`, items=activities(date);
      const label=items.some(t=>t.category==='School')?'School':items.length?'Personal':'Free';
      cells.push(`<button class="calendar-day ${date===selected?'selected':''}" data-date="${date}" aria-label="${longDate(date)}: ${label}, ${items.length} activities" aria-pressed="${date===selected}"><span class="date-number ${date===TODAY?'today':''}">${i}</span><span class="day-label">${label}</span>${items.slice(0,2).map(t=>`<span class="day-item">${e(t.title)}</span>`).join('')}${items.length>2?`<small>+${items.length-2} more</small>`:''}</button>`);
    }
    const detail=activities(selected);
    return heading('Calendar','A little perspective on the month. Select a day to see its plan.',addButton)+`<div class="calendar-toolbar"><h2>${first.toLocaleDateString('en-GB',{month:'long',year:'numeric'})}</h2><div class="calendar-controls"><button data-month="-1" aria-label="Previous month">←</button><button data-action="today">Today</button><button data-month="1" aria-label="Next month">→</button></div></div><div class="calendar">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div class="weekday">${d}</div>`).join('')}${cells.join('')}</div><p class="timeline-note">Demo labels use sample activity categories, not live AI. “Free” means no saved demo activities.</p><section class="calendar-detail"><h2>${longDate(selected)}</h2>${detail.map(t=>taskRow(t)).join('')||'<p class="empty">No saved activities. There’s room for something new.</p>'}</section>`;
  }
  function messageRows() {
    return messages.filter(m=>`${m.sender} ${m.subject} ${m.body}`.toLowerCase().includes(search)).map(m=>`<button class="message-row" data-message="${m.id}"><span><small>${e(m.sender)}</small><span class="message-tag">${m.tag}</span></span><span><strong>${e(m.subject)}</strong><span class="message-preview">${e(m.summary)}</span></span><time><small>${m.date}</small></time></button>`).join('')||'<p class="empty">No sample messages match your search.</p>';
  }
  function messagesView() {
    return heading('Messages','Your messages, with important information a little easier to find.','<button class="primary" data-action="summarize">See sample summary ↗</button>')+`<p class="tour-hint">Try opening “Worksheet 2 is available”, then view its example summary and approve the proposed task.</p><div class="messages-toolbar"><span>5 sample messages</span><label>Search messages<input id="message-search" type="search" placeholder="Find a sender or subject…" value="${e(search)}"></label></div><div class="message-list" id="message-list">${messageRows()}</div><details class="source-footer"><summary>Email connection · Demo only</summary><p>These fictional messages are bundled with the demo. No mailbox is connected or checked here.</p><p>The desktop preview supports the HIZ university email connector. Other connections are not demonstrated.</p></details>`;
  }
  function assistantView() {
    if(!summarized) return heading('Assistant','Important updates, with the source beside every point.')+`<div class="prewritten"><strong>A sample briefing, ready to explore.</strong><p>In the desktop app, your chosen AI reads messages and prepares a briefing. Here, you can open a prewritten example. No model runs and no API credits are used.</p><button class="primary" data-action="summarize">Open sample briefing</button></div>`;
    return heading('Assistant','A clearer view of what matters, without opening every message.')+`<div class="briefing-heading"><span class="status-dot"></span><div><p><strong>Example briefing · 3 important updates</strong></p><small>Sample week, 19 October 2026 · Prewritten, no AI call</small></div></div><section class="briefing-section"><div class="section-heading"><h2>Important</h2><a href="#today">Your daily review →</a></div>${messages.filter(m=>m.tag!=='Routine').map(m=>`<article class="briefing-item"><h3>${e(m.subject)}</h3><p>${e(m.summary)}</p><small>${e(m.sender)} · ${m.date}</small><details class="quote"><summary>Source quote</summary><blockquote>${e(m.quote)}</blockquote></details><div class="briefing-actions">${sourceButton(m.id)}${m.id==='worksheet'?(approved?'<span>✓ Task approved · <a href="#tasks">View tasks</a></span>':'<button class="primary" data-action="approve">Approve proposed task</button>'):''}</div></article>`).join('')}<p class="routine-note">2 routine messages kept out of this briefing. They are still available in Messages.</p></section>`;
  }
  function render() {
    const current=route();
    navigation.innerHTML=Object.keys(icons).map(id=>`<a class="nav-item" href="#${id}" ${current===id?'aria-current="page"':''}><svg class="nav-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[id]}</svg>${id[0].toUpperCase()+id.slice(1)}</a>`).join('');
    screen.innerHTML=({today:todayView,tasks:tasksView,calendar:calendarView,messages:messagesView,assistant:assistantView}[current])();
    doc.title=`${current[0].toUpperCase()+current.slice(1)} · REI interactive demo`;
  }
  function showMessage(id) {
    const message=messages.find(m=>m.id===id);if(!message)return;
    doc.querySelector('#message-content').innerHTML=`<p class="eyebrow">Fictional demo message</p><h2 id="message-title">${e(message.subject)}</h2><small>${e(message.sender)} · ${message.date}</small><div class="message-body">${e(message.body)}</div><div class="message-summary"><strong>Sample summary</strong><p>${e(message.summary)}</p></div><button class="primary" data-action="summarize">Open sample briefing →</button>`;
    messageDialog.showModal();
  }
  function click(event) {
    const target=event.target.closest('button');if(!target)return;
    if(target.id==='reset-demo'){editor.close();messageDialog.close();reset();go('today');toast('Demo reset. Your sample week is ready.');return;}
    if(target.hasAttribute('data-close')){editor.close();return;}
    if(target.dataset.message){showMessage(target.dataset.message);return;}
    if(target.dataset.day){selected=target.dataset.day;render();return;}
    if(target.dataset.date){selected=target.dataset.date;render();return;}
    if(target.dataset.month){const date=parseDate(month);date.setMonth(date.getMonth()+Number(target.dataset.month));month=iso(date);selected=month;render();return;}
    if(target.dataset.filter){filter=target.dataset.filter;render();return;}
    switch(target.dataset.action) {
      case 'today':selected=TODAY;month='2026-10-01';render();break;
      case 'add':form.reset();form.elements.namedItem('date').value=selected;editor.showModal();form.elements.namedItem('title').focus();break;
      case 'summarize':summarized=true;messageDialog.close();go('assistant');break;
      case 'approve':if(!approved){tasks.push({id:'worksheet',title:'Submit Worksheet 2',date:'2026-10-23',time:'',category:'School',done:false});approved=true;render();toast('Task approved. Find it in Tasks and on Friday’s calendar.');}break;
    }
  }
  function change(event) {
    const id=event.target.dataset.complete;if(!id)return;
    const task=tasks.find(t=>t.id===id);
    if(task)task.done=event.target.checked;else if(event.target.checked)completed.add(id);else completed.delete(id);
    render();toast(event.target.checked?'Completed. A little more breathing room.':'Marked as not completed.');
  }
  function submit(event) {
    event.preventDefault();if(!form.reportValidity())return;
    const title=form.elements.namedItem('title').value.trim().slice(0,120),date=form.elements.namedItem('date').value,time=form.elements.namedItem('time').value;
    if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
    tasks.push({id:`added-${++nextId}`,title,date,time,category:'Personal',done:false});selected=date;month=`${date.slice(0,7)}-01`;editor.close();render();toast('Task added to your demo plan.');
  }
  doc.addEventListener('click',click);doc.addEventListener('change',change);form.addEventListener('submit',submit);
  doc.addEventListener('input',event=>{if(event.target.id==='message-search'){search=event.target.value.toLowerCase();doc.querySelector('#message-list').innerHTML=messageRows();}});
  win.addEventListener('hashchange',()=>{render();doc.querySelector('#main').focus({preventScroll:true});});
  render();
}

if(typeof document!=='undefined'&&document.querySelector('#screen'))mountDemo(document,window);
