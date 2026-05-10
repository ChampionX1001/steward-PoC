const MODES = {
  direct: { label: 'Direct', guidance: 'You can self-serve and grant standing permissions.' },
  pa: { label: 'PA-mediated', guidance: 'All actions route through PA approval rails by client scope.' },
  enterprise: { label: 'Enterprise', guidance: 'Admin-managed deployment with user self-serve guardrails.' },
};

function getDateAfterDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const state = {
  mode: 'pa',
  activeTab: 'board',
  currentScope: 'Ava Stone',
  selectedBoardId: 'b2',
  calendar: false,
  selectedFileId: null,
  selectedChatId: null,
  dragCardId: null,
  boards: [
    { id: 'b1', name: 'Ava Stone | Home', scope: 'Ava Stone', color: '#8f7bff', linkedBoards: ['b2'] },
    { id: 'b2', name: 'Ava Stone | Family', scope: 'Ava Stone', color: '#31d1b6', linkedBoards: ['b1'] },
    { id: 'b3', name: 'PA Ops', scope: 'PA Self', color: '#ff8e66', linkedBoards: [] },
  ],
  lists: [
    { id: 'l1', boardId: 'b2', title: 'Inbox', color: '#1f2235' },
    { id: 'l2', boardId: 'b2', title: 'In Progress', color: '#182733' },
    { id: 'l3', boardId: 'b2', title: 'Done', color: '#20262b' },
  ],
  cards: [
    {
      id: 'c1', listId: 'l1', title: 'Submit school form packet', description: 'Upload physical exam + allergy records.',
      steps: ['Collect forms', 'Attach records', 'Submit portal'], dueDate: getDateAfterDays(2), recurrence: 'None',
      labels: ['School', 'Admin'], priority: 'High', attachments: ['allergy-letter.pdf'], comments: ['Steward drafted checklist'],
      color: '#1f2235', hidden: false, thumbnail: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=60',
    },
    {
      id: 'c2', listId: 'l2', title: 'Negotiate internet bill', description: 'Ask for loyalty discount and remove rental fee.',
      steps: ['Gather statements', 'Call provider', 'Confirm adjustment'], dueDate: getDateAfterDays(1), recurrence: 'Monthly',
      labels: ['Finance'], priority: 'Medium', attachments: ['bill-may.pdf'], comments: ['Call window 9-11am'],
      color: '#22263c', hidden: false, thumbnail: '',
    },
    {
      id: 'c3', listId: 'l2', title: 'Private legal note', description: 'Keep this invisible to Steward actions.',
      steps: ['Internal review'], dueDate: '', recurrence: 'None', labels: ['Private'], priority: 'Low', attachments: [], comments: [],
      color: '#3a1f2f', hidden: true, thumbnail: '',
    },
  ],
  infoByScope: {
    'Ava Stone': {
      profile: ['DOB: 1989-02-14', 'Address: 51 Ridge Ave, SF', 'Emergency contact: Leo Stone'],
      health: ['Primary care: Dr. C. James', 'Insurance: BlueShield PPO'],
      finance: ['HSA provider: Fidelity', 'CPA: N. Patel'],
      family: ['Child: Emma Stone, grade 3'],
      subscriptions: ['Global Entry renewal due 2027-03'],
      media: ['insurance-card-front.jpg', 'drivers-license.pdf'],
      additional: ['Prefers aisle seats and morning flights.'],
    },
    'PA Self': {
      profile: ['Assistant: Jordan Lee'],
      health: [],
      finance: [],
      family: [],
      subscriptions: ['Client review cadence weekly'],
      media: [],
      additional: ['Uses delegated approvals only.'],
    },
  },
  filesByScope: {
    'Ava Stone': [
      { id: 'f1', name: 'insurance-card-front.jpg', folder: 'Medical', comments: ['OCR complete'] },
      { id: 'f2', name: 'bill-may.pdf', folder: 'Finance', comments: ['Dispute ready'] },
      { id: 'f3', name: 'allergy-letter.pdf', folder: 'School', comments: [] },
    ],
    'PA Self': [{ id: 'f4', name: 'weekly-client-roster.xlsx', folder: 'Operations', comments: ['Synced Monday'] }],
  },
  chats: [
    {
      id: 'ch1',
      name: 'Insurance follow-up',
      scope: 'Ava Stone',
      incognito: false,
      messages: [{ role: 'assistant', text: 'I can file the claim and draft your appeal letter.' }],
    },
  ],
};

const els = {
  tabs: document.getElementById('main-tabs'),
  panels: document.querySelectorAll('.panel'),
  title: document.getElementById('tab-title'),
  modeChip: document.getElementById('mode-chip'),
  modeGuidance: document.getElementById('mode-guidance'),
  scopeContainer: document.getElementById('scope-container'),
  boardControls: document.getElementById('board-controls'),
  boardView: document.getElementById('board-view'),
  calendarView: document.getElementById('calendar-view'),
  toggleCalendar: document.getElementById('toggle-calendar'),
  addList: document.getElementById('add-list'),
  addCard: document.getElementById('add-card'),
  boardLinking: document.getElementById('board-linking'),
  modeSelect: document.getElementById('mode-select'),
  themeToggle: document.getElementById('theme-toggle'),
  accentSelect: document.getElementById('accent-select'),
  animSpeed: document.getElementById('animation-speed'),
  infoLayout: document.getElementById('info-layout'),
  fileTree: document.getElementById('file-tree'),
  fileDetail: document.getElementById('file-detail'),
  addFolder: document.getElementById('add-folder'),
  uploadFile: document.getElementById('upload-file'),
  chatList: document.getElementById('chat-list'),
  newChat: document.getElementById('new-chat'),
  chatTitle: document.getElementById('chat-title'),
  chatContextNote: document.getElementById('chat-context-note'),
  chatMessages: document.getElementById('chat-messages'),
  chatInput: document.getElementById('chat-input'),
  sendChat: document.getElementById('send-chat'),
  incognitoToggle: document.getElementById('incognito-toggle'),
  cardModal: document.getElementById('card-modal'),
  cardForm: document.getElementById('card-form'),
  inputModal: document.getElementById('input-modal'),
  inputForm: document.getElementById('input-form'),
  inputTitle: document.getElementById('input-title'),
  inputLabel: document.getElementById('input-label'),
  inputValue: document.getElementById('input-value'),
  confirmModal: document.getElementById('confirm-modal'),
  confirmForm: document.getElementById('confirm-form'),
  confirmTitle: document.getElementById('confirm-title'),
  confirmMessage: document.getElementById('confirm-message'),
};

function generateId(prefix) {
  return `${prefix}${Math.random().toString(16).slice(2, 8)}`;
}

function activeBoard() {
  return state.boards.find((b) => b.id === state.selectedBoardId) || state.boards[0];
}

function listsForBoard(boardId) {
  return state.lists.filter((l) => l.boardId === boardId);
}

function cardsForList(listId) {
  return state.cards.filter((c) => c.listId === listId);
}

function activeChat() {
  return state.chats.find((c) => c.id === state.selectedChatId);
}

function modeScopes() {
  if (state.mode === 'pa') return ['Ava Stone', 'PA Self'];
  return ['Steward User'];
}

function normalizeForMode() {
  const scopes = modeScopes();
  if (!scopes.includes(state.currentScope)) state.currentScope = scopes[0];

  if (state.mode !== 'pa') {
    state.boards = state.boards.map((b) => ({ ...b, scope: 'Steward User' }));
    if (!state.infoByScope['Steward User']) {
      const sourceInfoScope = Object.keys(state.infoByScope).find((k) => k !== 'Steward User');
      if (sourceInfoScope) state.infoByScope['Steward User'] = structuredClone(state.infoByScope[sourceInfoScope]);
    }
    if (!state.filesByScope['Steward User']) {
      const sourceFileScope = Object.keys(state.filesByScope).find((k) => k !== 'Steward User');
      if (sourceFileScope) state.filesByScope['Steward User'] = structuredClone(state.filesByScope[sourceFileScope]);
    }
    state.chats = state.chats.map((c) => ({ ...c, scope: 'Steward User' }));
  }

  if (state.mode === 'pa') {
    if (!state.boards.some((b) => b.scope === 'PA Self')) {
      state.boards.push({ id: generateId('b'), name: 'PA Ops', scope: 'PA Self', color: '#ff8e66', linkedBoards: [] });
    }
    if (!state.infoByScope['Ava Stone']) state.infoByScope['Ava Stone'] = structuredClone(state.infoByScope['Steward User'] || {});
    if (!state.infoByScope['PA Self']) state.infoByScope['PA Self'] = { profile: ['Assistant profile'], health: [], finance: [], family: [], subscriptions: [], media: [], additional: [] };
    if (!state.filesByScope['Ava Stone']) state.filesByScope['Ava Stone'] = [];
    if (!state.filesByScope['PA Self']) state.filesByScope['PA Self'] = [];
  }

  if (!state.selectedBoardId || !state.boards.some((b) => b.id === state.selectedBoardId)) {
    state.selectedBoardId = state.boards[0]?.id;
  }
}

function renderScopeSelector() {
  const scopes = modeScopes();
  els.scopeContainer.innerHTML = '';
  const label = document.createElement('label');
  label.className = 'muted';
  label.textContent = state.mode === 'pa' ? 'Client scope:' : 'Profile scope:';
  const select = document.createElement('select');
  scopes.forEach((scope) => {
    const opt = document.createElement('option');
    opt.value = scope;
    opt.textContent = scope;
    select.appendChild(opt);
  });
  select.value = state.currentScope;
  select.onchange = () => {
    state.currentScope = select.value;
    const fallbackBoard = state.boards.find((b) => b.scope === state.currentScope);
    if (fallbackBoard) state.selectedBoardId = fallbackBoard.id;
    renderAll();
  };
  els.scopeContainer.append(label, select);
}

function renderTabs() {
  document.querySelectorAll('#main-tabs .tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
  });
  els.panels.forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${state.activeTab}`));
  const title = document.querySelector(`#main-tabs .tab[data-tab="${state.activeTab}"]`)?.textContent || '';
  els.title.textContent = title;
}

function renderMode() {
  els.modeSelect.innerHTML = '';
  Object.entries(MODES).forEach(([key, val]) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = val.label;
    els.modeSelect.appendChild(opt);
  });
  els.modeSelect.value = state.mode;
  els.modeChip.textContent = `${MODES[state.mode].label} mode`;
  els.modeGuidance.textContent = MODES[state.mode].guidance;
}

function renderBoardControls() {
  const boardOptions = state.boards.filter((b) => state.mode !== 'pa' || b.scope === state.currentScope);
  if (!boardOptions.length) {
    const b = { id: generateId('b'), name: `${state.currentScope} Board`, scope: state.currentScope, color: '#8f7bff', linkedBoards: [] };
    state.boards.push(b);
    state.selectedBoardId = b.id;
  }

  if (!boardOptions.some((b) => b.id === state.selectedBoardId)) state.selectedBoardId = boardOptions[0].id;

  const board = activeBoard();
  els.boardControls.innerHTML = '';

  const boardSelect = document.createElement('select');
  boardOptions.forEach((b) => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.name;
    boardSelect.appendChild(opt);
  });
  boardSelect.value = board.id;
  boardSelect.onchange = () => {
    state.selectedBoardId = boardSelect.value;
    renderAll();
  };

  const addBoard = document.createElement('button');
  addBoard.className = 'btn';
  addBoard.textContent = '+ Board';
  addBoard.onclick = async () => {
    const name = await askInput('New board', 'Board name');
    if (!name) return;
    const scope = state.mode === 'pa' ? state.currentScope : 'Steward User';
    const newBoard = { id: generateId('b'), name, scope, color: '#8f7bff', linkedBoards: [] };
    state.boards.push(newBoard);
    state.selectedBoardId = newBoard.id;
    state.lists.push({ id: generateId('l'), boardId: newBoard.id, title: 'Inbox', color: '#1f2235' });
    renderAll();
  };

  const linkSelect = document.createElement('select');
  linkSelect.innerHTML = '<option value="">Link memory to board...</option>';
  state.boards.filter((b) => b.id !== board.id).forEach((b) => {
    if (state.mode === 'pa' && b.scope !== board.scope) return;
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = b.name;
    linkSelect.appendChild(opt);
  });
  linkSelect.onchange = () => {
    const target = linkSelect.value;
    if (!target) return;
    const thisBoard = activeBoard();
    if (state.mode === 'pa' && state.boards.find((b) => b.id === target)?.scope !== thisBoard.scope) {
      flashNotice('In PA mode, board memory links cannot cross client boundaries.');
      return;
    }
    if (!thisBoard.linkedBoards.includes(target)) thisBoard.linkedBoards.push(target);
    renderAll();
  };

  const delBoard = document.createElement('button');
  delBoard.className = 'btn subtle';
  delBoard.textContent = 'Delete board';
  delBoard.onclick = async () => {
    const thisBoard = activeBoard();
    if (!thisBoard) return;
    const shouldDelete = await askConfirm('Delete board', `Delete board: ${thisBoard.name}?`);
    if (!shouldDelete) return;
    state.boards = state.boards.filter((b) => b.id !== thisBoard.id);
    state.lists = state.lists.filter((l) => l.boardId !== thisBoard.id);
    const validListIds = new Set(state.lists.map((l) => l.id));
    state.cards = state.cards.filter((c) => validListIds.has(c.listId));
    state.selectedBoardId = state.boards[0]?.id;
    renderAll();
  };

  els.boardControls.append('Board', boardSelect, addBoard, linkSelect, delBoard);

  const linkedNames = board.linkedBoards.map((id) => state.boards.find((b) => b.id === id)?.name).filter(Boolean);
  const text = linkedNames.length
    ? `Steward memory linked across: ${board.name} ↔ ${linkedNames.join(', ')}`
    : `No board memory links set for ${board.name}.`;
  els.boardLinking.textContent = text;
  els.boardLinking.classList.remove('hidden');
}

function cardTemplate(card) {
  const labels = card.labels.map((l) => `<span class="badge">${escapeHtml(l)}</span>`).join('');
  const priorityClass = `priority-${card.priority}`;
  return `
    <article class="card-item ${card.hidden ? 'invisible' : ''}" draggable="true" data-card-id="${card.id}" style="background:${card.color}">
      ${card.thumbnail ? `<img class="thumb" src="${card.thumbnail}" alt="thumbnail" />` : ''}
      <strong>${escapeHtml(card.title)}</strong>
      <small class="muted">${escapeHtml(card.description || 'No description')}</small>
      <div class="badges">
        <span class="badge ${priorityClass}">${card.priority}</span>
        ${card.dueDate ? `<span class="badge">Due ${card.dueDate}</span>` : ''}
        ${card.recurrence && card.recurrence !== 'None' ? `<span class="badge">${card.recurrence}</span>` : ''}
        ${card.hidden ? '<span class="badge">Invisible</span>' : ''}
      </div>
      <div class="badges">${labels}</div>
    </article>
  `;
}

function renderBoard() {
  const board = activeBoard();
  const lists = listsForBoard(board.id);
  if (!lists.length) state.lists.push({ id: generateId('l'), boardId: board.id, title: 'Inbox', color: '#1f2235' });

  if (state.calendar) {
    renderCalendar(board.id);
    els.calendarView.classList.remove('hidden');
    els.boardView.classList.add('hidden');
    return;
  }

  els.calendarView.classList.add('hidden');
  els.boardView.classList.remove('hidden');
  const html = listsForBoard(board.id).map((list) => {
    const cards = cardsForList(list.id).map(cardTemplate).join('');
    return `
      <section class="glass list" data-list-id="${list.id}" style="background:${list.color}">
        <header class="list-head">
          <div class="list-title">${escapeHtml(list.title)}</div>
          <div class="inline-actions">
            <input type="color" value="${list.color}" data-list-color="${list.id}" />
            <button class="btn subtle" data-del-list="${list.id}">✕</button>
          </div>
        </header>
        <div class="cards" data-drop-list="${list.id}">${cards}</div>
        <div class="inline-actions" style="padding:10px; border-top:1px solid var(--border)">
          <button class="btn subtle" data-add-card="${list.id}">+ Card</button>
        </div>
      </section>
    `;
  }).join('');
  els.boardView.innerHTML = html;

  els.boardView.querySelectorAll('[data-add-card]').forEach((b) => {
    b.onclick = () => openCardModal({ listId: b.dataset.addCard });
  });
  els.boardView.querySelectorAll('[data-del-list]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.delList;
      state.lists = state.lists.filter((l) => l.id !== id);
      state.cards = state.cards.filter((c) => c.listId !== id);
      renderBoard();
    };
  });
  els.boardView.querySelectorAll('[data-list-color]').forEach((input) => {
    input.oninput = () => {
      const list = state.lists.find((l) => l.id === input.dataset.listColor);
      if (list) list.color = input.value;
      renderBoard();
    };
  });

  els.boardView.querySelectorAll('.card-item').forEach((el) => {
    el.addEventListener('dragstart', () => { state.dragCardId = el.dataset.cardId; });
    el.addEventListener('dblclick', () => {
      const card = state.cards.find((c) => c.id === el.dataset.cardId);
      if (card) openCardModal(card);
    });
  });

  els.boardView.querySelectorAll('[data-drop-list]').forEach((dropZone) => {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const card = state.cards.find((c) => c.id === state.dragCardId);
      if (card) {
        card.listId = dropZone.dataset.dropList;
        renderBoard();
      }
    });
  });
}

function renderCalendar(boardId) {
  const cards = state.cards.filter((c) => {
    const list = state.lists.find((l) => l.id === c.listId);
    return list?.boardId === boardId && c.dueDate;
  });
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;

  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push('<div class="cal-cell"></div>');
  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayCards = cards.filter((c) => c.dueDate === d);
    cells.push(`<div class="cal-cell"><strong>${day}</strong>${dayCards.map((c) => `<div class="cal-item">${escapeHtml(c.title)}</div>`).join('')}</div>`);
  }

  els.calendarView.innerHTML = `<h3>${now.toLocaleString('default', { month: 'long' })} ${year}</h3><div class="calendar-grid">${cells.join('')}</div>`;
}

function renderInformation() {
  const info = state.infoByScope[state.currentScope] || {};
  const categories = [
    ['profile', 'Profile'],
    ['health', 'Health & Insurance'],
    ['finance', 'Finance & Tax'],
    ['family', 'Family'],
    ['subscriptions', 'Subscriptions'],
    ['media', 'Media & Attachments'],
    ['additional', 'Additional Info'],
  ];

  els.infoLayout.innerHTML = categories.map(([key, label]) => {
    const items = (info[key] || []).map((i) => `<li>${escapeHtml(i)}</li>`).join('') || '<li class="muted">No data yet</li>';
    return `<article class="glass info-card"><h3>${label}</h3><ul>${items}</ul><button class="btn subtle" data-add-info="${key}">+ Add</button></article>`;
  }).join('');

  els.infoLayout.querySelectorAll('[data-add-info]').forEach((btn) => {
    btn.onclick = async () => {
      const key = btn.dataset.addInfo;
      const entry = await askInput(`Add ${key} info`, 'Value');
      if (!entry) return;
      if (!state.infoByScope[state.currentScope]) state.infoByScope[state.currentScope] = {};
      if (!state.infoByScope[state.currentScope][key]) state.infoByScope[state.currentScope][key] = [];
      state.infoByScope[state.currentScope][key].push(entry);
      renderInformation();
    };
  });
}

function renderDrive() {
  const files = state.filesByScope[state.currentScope] || [];
  if (!files.length) {
    els.fileTree.innerHTML = '<p class="muted">No files yet.</p>';
    els.fileDetail.innerHTML = '<p class="muted">Upload files, task attachments sync here automatically.</p>';
    return;
  }
  if (!state.selectedFileId || !files.some((f) => f.id === state.selectedFileId)) state.selectedFileId = files[0].id;

  const folders = [...new Set(files.map((f) => f.folder))];
  els.fileTree.innerHTML = folders.map((folder) => {
    const items = files.filter((f) => f.folder === folder).map((f) => (
      `<div class="file-item ${f.id === state.selectedFileId ? 'active' : ''}" data-file-id="${f.id}"><span>${escapeHtml(f.name)}</span><small class="muted">${escapeHtml(folder)}</small></div>`
    )).join('');
    return `<h4>${escapeHtml(folder)}</h4>${items}`;
  }).join('');

  els.fileTree.querySelectorAll('[data-file-id]').forEach((item) => {
    item.onclick = () => {
      state.selectedFileId = item.dataset.fileId;
      renderDrive();
    };
  });

  const file = files.find((f) => f.id === state.selectedFileId);
  els.fileDetail.innerHTML = `
    <h3>${escapeHtml(file.name)}</h3>
    <p class="muted">Folder: ${escapeHtml(file.folder)}</p>
    <h4>Comments</h4>
    <div>${(file.comments || []).map((c) => `<div class="msg assistant">${escapeHtml(c)}</div>`).join('') || '<p class="muted">No comments.</p>'}</div>
    <div class="inline-actions">
      <input id="file-comment-input" placeholder="Add comment" />
      <button id="add-file-comment" class="btn">Add</button>
    </div>
  `;
  document.getElementById('add-file-comment').onclick = () => {
    const input = document.getElementById('file-comment-input');
    const text = input.value.trim();
    if (!text) return;
    file.comments = file.comments || [];
    file.comments.push(text);
    renderDrive();
  };
}

function renderChat() {
  const chats = state.chats.filter((c) => state.mode !== 'pa' || c.scope === state.currentScope);
  if (!chats.length) {
    state.selectedChatId = null;
  } else if (!state.selectedChatId || !chats.some((c) => c.id === state.selectedChatId)) {
    state.selectedChatId = chats[0].id;
  }

  els.chatList.innerHTML = chats.map((c) => (
    `<button class="chat-entry ${c.id === state.selectedChatId ? 'active' : ''}" data-chat-id="${c.id}">${escapeHtml(c.name)}${c.incognito ? ' 🕶️' : ''}</button>`
  )).join('');
  els.chatList.querySelectorAll('[data-chat-id]').forEach((btn) => {
    btn.onclick = () => {
      state.selectedChatId = btn.dataset.chatId;
      renderChat();
    };
  });

  const chat = activeChat();
  if (!chat) {
    els.chatTitle.textContent = 'No chat selected';
    els.chatContextNote.textContent = '';
    els.chatMessages.innerHTML = '<p class="muted">Create a chat to start.</p>';
    return;
  }

  els.chatTitle.textContent = chat.name;
  els.incognitoToggle.checked = !!chat.incognito;
  const note = chat.incognito
    ? 'Incognito: not saved, no Drive/Info/Task context; web context only.'
    : state.mode === 'pa'
      ? `Scoped to ${chat.scope} only. Multi-client context is blocked.`
      : 'Steward can use visible tasks, Drive files, and Information context.';
  els.chatContextNote.textContent = note;
  els.chatMessages.innerHTML = chat.messages.map((m) => `<div class="msg ${m.role === 'user' ? 'user' : 'assistant'}">${escapeHtml(m.text)}</div>`).join('');
}

function openCardModal(card = {}) {
  const listSelect = els.cardForm.elements.list;
  listSelect.innerHTML = '';
  listsForBoard(activeBoard().id).forEach((list) => {
    const opt = document.createElement('option');
    opt.value = list.id;
    opt.textContent = list.title;
    listSelect.appendChild(opt);
  });

  els.cardForm.dataset.cardId = card.id || '';
  els.cardForm.elements.title.value = card.title || '';
  els.cardForm.elements.list.value = card.listId || listsForBoard(activeBoard().id)[0]?.id || '';
  els.cardForm.elements.description.value = card.description || '';
  els.cardForm.elements.steps.value = (card.steps || []).join(', ');
  els.cardForm.elements.dueDate.value = card.dueDate || '';
  els.cardForm.elements.recurrence.value = card.recurrence || 'None';
  els.cardForm.elements.priority.value = card.priority || 'Medium';
  els.cardForm.elements.labels.value = (card.labels || []).join(', ');
  els.cardForm.elements.color.value = card.color || '#1f2235';
  els.cardForm.elements.thumbnail.value = card.thumbnail || '';
  els.cardForm.elements.attachments.value = (card.attachments || []).join(', ');
  els.cardForm.elements.comments.value = (card.comments || []).join(', ');
  els.cardForm.elements.hidden.checked = !!card.hidden;
  els.cardModal.showModal();
}

function splitCsv(value = '') {
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

function askInput(title, label) {
  return new Promise((resolve) => {
    els.inputTitle.textContent = title;
    els.inputLabel.firstChild.textContent = `${label} `;
    els.inputValue.value = '';
    const onClose = () => {
      els.inputModal.removeEventListener('close', onClose);
      const ok = els.inputModal.returnValue !== 'cancel';
      resolve(ok ? els.inputValue.value.trim() : '');
    };
    els.inputModal.addEventListener('close', onClose);
    els.inputModal.showModal();
    els.inputValue.focus();
  });
}

function askConfirm(title, message) {
  return new Promise((resolve) => {
    els.confirmTitle.textContent = title;
    els.confirmMessage.textContent = message;
    const onClose = () => {
      els.confirmModal.removeEventListener('close', onClose);
      resolve(els.confirmModal.returnValue !== 'cancel');
    };
    els.confirmModal.addEventListener('close', onClose);
    els.confirmModal.showModal();
  });
}

function flashNotice(message) {
  els.boardLinking.textContent = message;
  els.boardLinking.classList.remove('hidden');
  clearTimeout(flashNotice.timeoutId);
  flashNotice.timeoutId = setTimeout(() => renderBoardControls(), 2200);
}

function saveCardFromModal(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(els.cardForm).entries());
  const model = {
    id: els.cardForm.dataset.cardId || generateId('c'),
    listId: data.list,
    title: data.title,
    description: data.description,
    steps: splitCsv(data.steps),
    dueDate: data.dueDate,
    recurrence: data.recurrence,
    priority: data.priority,
    labels: splitCsv(data.labels),
    color: data.color,
    thumbnail: data.thumbnail,
    attachments: splitCsv(data.attachments),
    comments: splitCsv(data.comments),
    hidden: els.cardForm.elements.hidden.checked,
  };

  const idx = state.cards.findIndex((c) => c.id === model.id);
  if (idx > -1) state.cards[idx] = model;
  else state.cards.push(model);

  const fileBucket = state.filesByScope[state.currentScope] || (state.filesByScope[state.currentScope] = []);
  model.attachments.forEach((name) => {
    if (!fileBucket.some((f) => f.name === name)) {
      fileBucket.push({ id: generateId('f'), name, folder: 'Task Attachments', comments: [`Added from task: ${model.title}`] });
    }
  });

  els.cardModal.close();
  renderAll();
}

function escapeHtml(v = '') {
  const node = document.createElement('span');
  node.textContent = String(v);
  return node.innerHTML;
}

function renderAll() {
  normalizeForMode();
  renderTabs();
  renderMode();
  renderScopeSelector();
  renderBoardControls();
  renderBoard();
  renderInformation();
  renderDrive();
  renderChat();
}

function wireEvents() {
  els.tabs.addEventListener('click', (e) => {
    if (!e.target.matches('.tab')) return;
    state.activeTab = e.target.dataset.tab;
    renderTabs();
  });

  els.modeSelect.onchange = () => {
    state.mode = els.modeSelect.value;
    renderAll();
  };

  els.themeToggle.onclick = () => {
    const body = document.body;
    body.dataset.theme = body.dataset.theme === 'dark' ? 'light' : 'dark';
  };

  els.accentSelect.onchange = () => {
    document.body.dataset.accent = els.accentSelect.value;
  };
  els.animSpeed.onchange = () => {
    document.body.dataset.anim = els.animSpeed.value === 'fast' ? 'fast' : '';
  };

  els.toggleCalendar.onclick = () => {
    state.calendar = !state.calendar;
    els.toggleCalendar.textContent = state.calendar ? 'Board view' : 'Calendar view';
    renderBoard();
  };

  els.addList.onclick = async () => {
    const title = await askInput('New list', 'List name');
    if (!title) return;
    state.lists.push({ id: generateId('l'), boardId: activeBoard().id, title, color: '#1f2235' });
    renderBoard();
  };

  els.addCard.onclick = () => openCardModal({ listId: listsForBoard(activeBoard().id)[0]?.id });
  els.cardForm.addEventListener('submit', saveCardFromModal);

  els.addFolder.onclick = async () => {
    const folder = await askInput('New folder', 'Folder name');
    if (!folder) return;
    const files = state.filesByScope[state.currentScope] || (state.filesByScope[state.currentScope] = []);
    files.push({ id: generateId('f'), name: 'placeholder.txt', folder, comments: ['Created folder placeholder'] });
    renderDrive();
  };

  els.uploadFile.onchange = () => {
    const file = els.uploadFile.files?.[0];
    if (!file) return;
    const files = state.filesByScope[state.currentScope] || (state.filesByScope[state.currentScope] = []);
    files.push({ id: generateId('f'), name: file.name, folder: 'Uploads', comments: ['Uploaded by user'] });
    els.uploadFile.value = '';
    renderDrive();
  };

  els.newChat.onclick = async () => {
    const name = (await askInput('New chat', 'Chat name')) || 'New chat';
    const c = { id: generateId('ch'), name, scope: state.currentScope, incognito: false, messages: [] };
    state.chats.unshift(c);
    state.selectedChatId = c.id;
    renderChat();
  };

  els.incognitoToggle.onchange = () => {
    const c = activeChat();
    if (!c) return;
    c.incognito = els.incognitoToggle.checked;
    renderChat();
  };

  els.sendChat.onclick = () => {
    const text = els.chatInput.value.trim();
    const chat = activeChat();
    if (!text || !chat) return;
    chat.messages.push({ role: 'user', text });
    const response = chat.incognito
      ? 'Incognito mode enabled. I will use web context only and will not store this conversation.'
      : state.mode === 'pa'
        ? `Working within ${chat.scope} context only. I can act after your approval.`
        : 'Got it. I will use your board, drive, and info context and prepare actions for approval.';
    chat.messages.push({ role: 'assistant', text: response });
    if (chat.incognito) chat.messages = chat.messages.slice(-2);
    els.chatInput.value = '';
    renderChat();
  };
}

wireEvents();
renderAll();
