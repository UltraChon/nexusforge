/**
 * NexusForge - Game Story & Gameplay Node Editor
 * Motor de interacción de nodos visuales, conexiones SVG, sistema de fichas de personajes,
 * soporte multi-personaje por nodo, filtros de arco narrativo y exportación a imagen/JSON.
 */

(function () {
  'use strict';

  // --- ESTADO DE LA APLICACIÓN ---
  const state = {
    nodes: [],
    connections: [],
    characters: [],
    selectedNodeId: null,
    selectedCharacterId: null,
    activeCharacterFilter: null, // ID del personaje filtrado o null
    scale: 1,
    panX: 40,
    panY: 40,
    isPanning: false,
    panStart: { x: 0, y: 0 },
    draggedNodeId: null,
    dragOffset: { x: 0, y: 0 },
    connectingFromNodeId: null,
    connectingFromPortType: null,
  };

  // --- ELEMENTOS DEL DOM ---
  const canvasContainer = document.getElementById('canvas-container');
  const nodesLayer = document.getElementById('nodes-layer');
  const connectionsLayer = document.getElementById('connections-layer');
  const tempConnection = document.getElementById('temp-connection');
  const canvasGrid = document.getElementById('canvas-grid');
  const zoomDisplay = document.getElementById('zoom-level');

  // Filtros de Personajes en Lienzo
  const filterPillsList = document.getElementById('filter-pills-list');
  const btnClearFilter = document.getElementById('btn-clear-filter');
  const activeFilterBanner = document.getElementById('active-filter-banner');
  const activeFilterText = document.getElementById('active-filter-text');
  const btnFocusFilterNodes = document.getElementById('btn-focus-filter-nodes');
  const btnCloseFilterBanner = document.getElementById('btn-close-filter-banner');
  const characterCountBadge = document.getElementById('character-count-badge');

  // Inspector
  const inspectorPanel = document.getElementById('inspector-panel');
  const inspectorEmpty = document.getElementById('inspector-empty');
  const inspectorForm = document.getElementById('inspector-form');
  const inspectorTypeBadge = document.getElementById('inspector-type-badge');
  const inspectorTitleDisplay = document.getElementById('inspector-title-display');
  const editNodeIdInput = document.getElementById('edit-node-id');
  const editTitleInput = document.getElementById('edit-title');
  const editTypeSelect = document.getElementById('edit-type');
  const editStatusSelect = document.getElementById('edit-status');
  const nodeCharactersChips = document.getElementById('node-characters-chips');
  const selectAddCharacterToNode = document.getElementById('select-add-character-to-node');
  const btnQuickNewChar = document.getElementById('btn-quick-new-char');
  const editSynopsisInput = document.getElementById('edit-synopsis');
  const editMechanicInput = document.getElementById('edit-mechanic');
  const editObjectiveInput = document.getElementById('edit-objective');
  const editRewardInput = document.getElementById('edit-reward');
  const editTagsInput = document.getElementById('edit-tags');
  const editNotesInput = document.getElementById('edit-notes');
  const sectionStory = document.getElementById('section-story');
  const sectionGameplay = document.getElementById('section-gameplay');

  // Modal de Personajes
  const modalCharacters = document.getElementById('modal-characters');
  const btnOpenCharacters = document.getElementById('btn-open-characters');
  const btnCloseCharactersModal = document.getElementById('btn-close-characters-modal');
  const btnCreateCharacter = document.getElementById('btn-create-character');
  const inputSearchCharacter = document.getElementById('input-search-character');
  const characterItemsContainer = document.getElementById('character-items-container');
  const characterSheetEmpty = document.getElementById('character-sheet-empty');
  const characterSheetForm = document.getElementById('character-sheet-form');
  const charIdInput = document.getElementById('char-id');
  const charNameInput = document.getElementById('char-name');
  const charRoleSelect = document.getElementById('char-role');
  const charColorSelect = document.getElementById('char-color');
  const charAvatarInput = document.getElementById('char-avatar');
  const charAvatarPreview = document.getElementById('char-avatar-preview');
  const charMotivationInput = document.getElementById('char-motivation');
  const charArchetypeInput = document.getElementById('char-archetype');
  const charBioInput = document.getElementById('char-bio');
  const charParticipatingCount = document.getElementById('char-participating-count');
  const charParticipatingNodes = document.getElementById('char-participating-nodes');
  const btnFilterThisCharacter = document.getElementById('btn-filter-this-character');
  const btnDeleteCharacter = document.getElementById('btn-delete-character');

  // Modal de Exportación de Imagen
  const modalExport = document.getElementById('modal-export');
  const exportCanvasPreview = document.getElementById('export-canvas-preview');
  const exportScaleSelect = document.getElementById('export-scale');
  const btnDownloadImage = document.getElementById('btn-download-image');

  // Botones Nav
  const btnAddStory = document.getElementById('btn-add-story');
  const btnAddGameplay = document.getElementById('btn-add-gameplay');
  const btnAddCutscene = document.getElementById('btn-add-cutscene');
  const btnAddChoice = document.getElementById('btn-add-choice');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');
  const btnExportImage = document.getElementById('btn-export-image');
  const btnExportJson = document.getElementById('btn-export-json');
  const btnImportJson = document.getElementById('btn-import-json');
  const inputFileJson = document.getElementById('input-file-json');
  const btnClear = document.getElementById('btn-clear');
  const btnCloseInspector = document.getElementById('btn-close-inspector');
  const btnDuplicateNode = document.getElementById('btn-duplicate-node');
  const btnDeleteNode = document.getElementById('btn-delete-node');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnCancelModal = document.getElementById('btn-cancel-modal');

  // --- DATOS POR DEFECTO / DEMO ---
  const defaultCharacters = [
    {
      id: 'char-kaelen',
      name: 'Kaelen Sombradoble',
      role: 'Aliado',
      avatar: '🧝‍♀️',
      color: '#a855f7',
      motivation: 'Recuperar el artefacto prohibido y salvar a su orden oculta.',
      archetype: 'Pícara sigilosa, cínica pero inquebrantablemente leal.',
      bio: 'Antigua exploradora de la orden silente desterrada por desobedecer al Gran Concilio. Conoce los túneles subterráneos como la palma de su mano.'
    },
    {
      id: 'char-aria',
      name: 'Aria (Protagonista)',
      role: 'Protagonista',
      avatar: '🗡️',
      color: '#06b6d4',
      motivation: 'Descubrir el origen de la marca rúnica en su brazo y sobrevivir.',
      archetype: 'Guerrera ágil, pragmática y observadora.',
      bio: 'Llegó a la ciudadela tras la caída de las murallas del norte. Porta un medallón que reacciona a los templos antiguos.'
    },
    {
      id: 'char-narrador',
      name: 'El Narrador Ancestral',
      role: 'Mentor',
      avatar: '🧙‍♂️',
      color: '#f59e0b',
      motivation: 'Registrar el destino final del reino y advertir de la profecía.',
      archetype: 'Cronista místico y omnisciente.',
      bio: 'Una presencia espectral que habla a través de los ecos en los santuarios antiguos.'
    },
    {
      id: 'char-capitan',
      name: 'Capitán Valerius',
      role: 'Boss',
      avatar: '🦹',
      color: '#ef4444',
      motivation: 'Eliminar a cualquier intruso antes de que alcancen el palacio.',
      archetype: 'Comandante implacable de la guardia de élite.',
      bio: 'Veterano de la Guerra del Alba. Ha jurado su vida a la protección de las puertas selladas.'
    }
  ];

  const defaultProject = {
    nodes: [
      {
        id: 'node-1',
        title: 'Prólogo: Sombras en la Ciudadela',
        type: 'cutscene',
        status: 'ready',
        x: 100,
        y: 120,
        characters: ['El Narrador Ancestral'],
        speaker: 'El Narrador Ancestral',
        synopsis: 'Las campanas de la catedral tocan a medianoche mientras una figura encapuchada se infiltra por las murallas destruidas.',
        mechanic: '',
        objective: '',
        reward: '',
        tags: 'Prólogo, Cinemática Inicial',
        notes: 'Renderizar en tiempo real con música de ambientación tensa.'
      },
      {
        id: 'node-2',
        title: 'Decisión: Vía de Acceso',
        type: 'choice',
        status: 'ready',
        x: 480,
        y: 120,
        characters: ['Aria (Protagonista)', 'Kaelen Sombradoble'],
        speaker: 'Aria (Protagonista)',
        synopsis: 'Elegir si infiltrarse por las alcantarillas (Sigilo con Kaelen) o emboscar el patio principal (Combate directo).',
        mechanic: 'Bifurcación de Rama de Juego',
        objective: 'Tomar la decisión táctica',
        reward: 'Ruta A o Ruta B',
        tags: 'Decisión, Ramificación',
        notes: 'Afecta la percepción de los guardias en el Acto 2.'
      },
      {
        id: 'node-3',
        title: 'Infiltración en las Cloacas',
        type: 'gameplay',
        status: 'wip',
        x: 880,
        y: 40,
        characters: ['Aria (Protagonista)', 'Kaelen Sombradoble'],
        speaker: 'Kaelen Sombradoble',
        synopsis: 'Ruta sigilosa guiada por Kaelen evitando las patrullas acuáticas y los perros centinela.',
        mechanic: 'Sigilo y Ganzúas',
        objective: 'Llegar a la rejilla de ventilación sin activar la alarma general.',
        reward: 'Daga Silenciosa + Llave Maestra',
        tags: 'Gameplay, Sigilo, Nivel 1',
        notes: 'Colocar 3 guardias con linternas de cono de visión.'
      },
      {
        id: 'node-4',
        title: 'Asalto en el Patio Central',
        type: 'gameplay',
        status: 'wip',
        x: 880,
        y: 300,
        characters: ['Aria (Protagonista)', 'Capitán Valerius'],
        speaker: 'Capitán Valerius',
        synopsis: 'Combate intenso de Aria contra la guardia de élite y el Capitán Valerius frente a la puerta del palacio.',
        mechanic: 'Combate Cuerpo a Cuerpo & Parrys',
        objective: 'Derrotar a 2 escuderos y al Capitán Valerius.',
        reward: 'Escudo Blindado + 200 Oro',
        tags: 'Gameplay, Acción, Combate',
        notes: 'Asegurar buena respuesta del sistema de esquiva.'
      },
      {
        id: 'node-5',
        title: 'Encuentro con la Rebelde Kaelen',
        type: 'story',
        status: 'idea',
        x: 1300,
        y: 160,
        characters: ['Kaelen Sombradoble', 'Aria (Protagonista)'],
        speaker: 'Kaelen Sombradoble',
        synopsis: '"No pensé que llegarías tan lejos viva, Aria. Tenemos poco tiempo antes de que abran el portal prohibido."',
        mechanic: 'Diálogo con Opciones de Lore',
        objective: 'Obtener información sobre el artefacto',
        reward: 'Mapa del Templo Interior',
        tags: 'Diálogo Clave, Lore, Compañero',
        notes: 'Kaelen se une como acompañante temporal si tienes alta empatía.'
      }
    ],
    connections: [
      { from: 'node-1', to: 'node-2' },
      { from: 'node-2', to: 'node-3' },
      { from: 'node-2', to: 'node-4' },
      { from: 'node-3', to: 'node-5' },
      { from: 'node-4', to: 'node-5' }
    ]
  };

  // --- INICIALIZACIÓN ---
  function init() {
    loadFromLocalStorage();
    setupEventListeners();
    updateCanvasTransform();
    updateCharacterCountUI();
    renderCharacterFilterPills();
    renderAll();
  }

  // --- LOCALSTORAGE & PERSISTENCIA ---
  function saveToLocalStorage() {
    try {
      localStorage.setItem('nexusforge_nodes', JSON.stringify(state.nodes));
      localStorage.setItem('nexusforge_connections', JSON.stringify(state.connections));
      localStorage.setItem('nexusforge_characters', JSON.stringify(state.characters));
      const ind = document.getElementById('save-indicator');
      if (ind) {
        ind.style.opacity = '1';
        setTimeout(() => { ind.style.opacity = '0.85'; }, 1000);
      }
    } catch (e) {
      console.warn('Error guardando en LocalStorage:', e);
    }
  }

  function loadFromLocalStorage() {
    try {
      const savedNodes = localStorage.getItem('nexusforge_nodes');
      const savedConns = localStorage.getItem('nexusforge_connections');
      const savedChars = localStorage.getItem('nexusforge_characters');

      if (savedNodes && savedConns) {
        state.nodes = JSON.parse(savedNodes);
        state.connections = JSON.parse(savedConns);
        state.characters = savedChars ? JSON.parse(savedChars) : JSON.parse(JSON.stringify(defaultCharacters));
        
        // Migración: asegurar que cada nodo tenga un arreglo characters
        state.nodes.forEach(n => {
          if (!Array.isArray(n.characters)) {
            n.characters = n.speaker ? [n.speaker] : [];
          }
        });
        return;
      }
    } catch (e) {
      console.warn('Error cargando de LocalStorage, usando defaults:', e);
    }
    // Carga de ejemplo inicial
    state.nodes = JSON.parse(JSON.stringify(defaultProject.nodes));
    state.connections = JSON.parse(JSON.stringify(defaultProject.connections));
    state.characters = JSON.parse(JSON.stringify(defaultCharacters));
  }

  // --- GESTIÓN Y HELPERS DE PERSONAJES ---
  function getNodeCharacters(node) {
    if (!node) return [];
    if (Array.isArray(node.characters) && node.characters.length > 0) {
      return node.characters;
    }
    if (node.speaker && typeof node.speaker === 'string' && node.speaker.trim()) {
      return [node.speaker.trim()];
    }
    return [];
  }

  function updateCharacterCountUI() {
    if (characterCountBadge) {
      characterCountBadge.textContent = state.characters.length;
    }
  }

  function getCharacterByName(name) {
    if (!name) return null;
    return state.characters.find(c => c.name.trim().toLowerCase() === name.trim().toLowerCase());
  }

  function getCharacterById(id) {
    return state.characters.find(c => c.id === id);
  }

  function getNodesForCharacter(character) {
    if (!character) return [];
    const nameLower = character.name.toLowerCase();
    return state.nodes.filter(n => {
      const charList = getNodeCharacters(n);
      const hasChar = charList.some(name => name.toLowerCase() === nameLower);
      const synopsisMatch = n.synopsis && n.synopsis.toLowerCase().includes(nameLower);
      const titleMatch = n.title && n.title.toLowerCase().includes(nameLower);
      return hasChar || synopsisMatch || titleMatch;
    });
  }

  function renderCharacterFilterPills() {
    filterPillsList.innerHTML = '';

    state.characters.forEach(char => {
      const charNodes = getNodesForCharacter(char);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = `filter-pill ${state.activeCharacterFilter === char.id ? 'active' : ''}`;
      pill.style.setProperty('--char-color', char.color || '#818cf8');
      pill.style.setProperty('--char-glow', (char.color || '#818cf8') + '66');

      pill.innerHTML = `
        <span>${char.avatar || '👤'}</span>
        <span>${escapeHtml(char.name)}</span>
        <span class="pill-count">${charNodes.length}</span>
      `;

      pill.addEventListener('click', () => {
        if (state.activeCharacterFilter === char.id) {
          clearCharacterFilter();
        } else {
          applyCharacterFilter(char.id);
        }
      });

      filterPillsList.appendChild(pill);
    });

    if (state.activeCharacterFilter) {
      btnClearFilter.style.display = 'block';
    } else {
      btnClearFilter.style.display = 'none';
    }
  }

  function applyCharacterFilter(characterId) {
    state.activeCharacterFilter = characterId;
    const char = getCharacterById(characterId);

    if (!char) {
      clearCharacterFilter();
      return;
    }

    renderCharacterFilterPills();

    // Actualizar Banner
    const charNodes = getNodesForCharacter(char);
    activeFilterText.innerHTML = `Viendo arco de <b>${escapeHtml(char.name)}</b> (${charNodes.length} escenas)`;
    activeFilterBanner.style.display = 'flex';

    updateCanvasFilterClasses();

    if (charNodes.length > 0) {
      focusNodes(charNodes);
    }
  }

  function clearCharacterFilter() {
    state.activeCharacterFilter = null;
    activeFilterBanner.style.display = 'none';
    btnClearFilter.style.display = 'none';
    renderCharacterFilterPills();
    updateCanvasFilterClasses();
  }

  function updateCanvasFilterClasses() {
    if (!state.activeCharacterFilter) {
      document.querySelectorAll('.node-card').forEach(el => {
        el.classList.remove('dimmed-by-filter', 'highlighted-by-filter');
        el.style.removeProperty('--char-glow');
      });
      document.querySelectorAll('.connection-path').forEach(p => {
        p.classList.remove('dimmed-by-filter');
      });
      return;
    }

    const char = getCharacterById(state.activeCharacterFilter);
    if (!char) return;

    const charNodes = getNodesForCharacter(char);
    const charNodeIds = new Set(charNodes.map(n => n.id));

    state.nodes.forEach(node => {
      const nodeEl = document.getElementById(node.id);
      if (!nodeEl) return;

      if (charNodeIds.has(node.id)) {
        nodeEl.classList.remove('dimmed-by-filter');
        nodeEl.classList.add('highlighted-by-filter');
        nodeEl.style.setProperty('--char-glow', (char.color || '#a855f7') + '88');
      } else {
        nodeEl.classList.add('dimmed-by-filter');
        nodeEl.classList.remove('highlighted-by-filter');
        nodeEl.style.removeProperty('--char-glow');
      }
    });

    state.connections.forEach(conn => {
      const p = connectionsLayer.querySelector(`.connection-path[data-from="${conn.from}"][data-to="${conn.to}"]`);
      if (p) {
        if (charNodeIds.has(conn.from) && charNodeIds.has(conn.to)) {
          p.classList.remove('dimmed-by-filter');
        } else {
          p.classList.add('dimmed-by-filter');
        }
      }
    });
  }

  function focusNodes(nodesToFocus) {
    if (!nodesToFocus || nodesToFocus.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodesToFocus.forEach(n => {
      const el = document.getElementById(n.id);
      const h = el ? el.offsetHeight : 160;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 290);
      maxY = Math.max(maxY, n.y + h);
    });

    const rect = canvasContainer.getBoundingClientRect();
    const padding = 120;
    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;

    const scaleX = rect.width / contentW;
    const scaleY = rect.height / contentH;
    state.scale = Math.min(Math.max(0.4, Math.min(scaleX, scaleY)), 1.15);

    state.panX = (rect.width - (maxX + minX) * state.scale) / 2;
    state.panY = (rect.height - (maxY + minY) * state.scale) / 2;

    updateCanvasTransform();
  }

  // --- GESTIÓN DE CHIPS MULTI-PERSONAJE EN INSPECTOR ---
  function renderNodeCharactersManager(node) {
    if (!nodeCharactersChips || !selectAddCharacterToNode) return;
    nodeCharactersChips.innerHTML = '';
    const currentChars = getNodeCharacters(node);

    if (currentChars.length === 0) {
      nodeCharactersChips.innerHTML = `<span class="empty-chips-hint">Sin personajes asignados aún.</span>`;
    } else {
      currentChars.forEach(charName => {
        const matched = getCharacterByName(charName);
        const avatar = matched ? matched.avatar : '👤';
        const color = matched ? matched.color : '#818cf8';

        const chip = document.createElement('div');
        chip.className = 'node-char-chip';
        chip.style.setProperty('--char-color', color);
        chip.style.setProperty('--char-bg', color + '22');
        chip.style.setProperty('--char-glow', color + '44');

        chip.innerHTML = `
          <button type="button" class="char-chip-btn-link" title="Abrir ficha de ${escapeHtml(charName)}">
            <span>${avatar}</span>
            <span>${escapeHtml(charName)}</span>
          </button>
          <button type="button" class="char-chip-btn-remove" title="Quitar este personaje del nodo">✕</button>
        `;

        // Abrir ficha al hacer clic en el nombre
        chip.querySelector('.char-chip-btn-link').addEventListener('click', () => {
          if (matched) {
            openCharactersModal(matched.id);
          }
        });

        // Quitar de la escena
        chip.querySelector('.char-chip-btn-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          removeCharacterFromNode(node, charName);
        });

        nodeCharactersChips.appendChild(chip);
      });
    }

    // Selector para agregar más personajes
    selectAddCharacterToNode.innerHTML = `<option value="">+ Añadir personaje a la escena...</option>`;
    state.characters.forEach(c => {
      if (!currentChars.includes(c.name)) {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = `${c.avatar || '👤'} ${c.name} (${c.role})`;
        selectAddCharacterToNode.appendChild(opt);
      }
    });
  }

  function addCharacterToNode(node, charName) {
    if (!node.characters) {
      node.characters = getNodeCharacters(node);
    }
    if (!node.characters.includes(charName)) {
      node.characters.push(charName);
      node.speaker = node.characters[0] || '';
      saveToLocalStorage();
      renderAll();
      renderCharacterFilterPills();
      renderNodeCharactersManager(node);
    }
  }

  function removeCharacterFromNode(node, charName) {
    node.characters = getNodeCharacters(node).filter(c => c !== charName);
    node.speaker = node.characters[0] || '';
    saveToLocalStorage();
    renderAll();
    renderCharacterFilterPills();
    renderNodeCharactersManager(node);
  }

  // --- MODAL DE GESTIÓN DE PERSONAJES ---
  function openCharactersModal(preselectCharId) {
    modalCharacters.style.display = 'flex';
    renderCharactersList();

    if (preselectCharId) {
      selectCharacterInModal(preselectCharId);
    } else if (state.characters.length > 0) {
      selectCharacterInModal(state.characters[0].id);
    } else {
      showEmptyCharacterSheet();
    }
  }

  function closeCharactersModal() {
    modalCharacters.style.display = 'none';
  }

  function renderCharactersList(searchTerm = '') {
    characterItemsContainer.innerHTML = '';
    const term = searchTerm.trim().toLowerCase();

    const filtered = state.characters.filter(c => {
      return c.name.toLowerCase().includes(term) ||
             c.role.toLowerCase().includes(term) ||
             (c.archetype && c.archetype.toLowerCase().includes(term));
    });

    if (filtered.length === 0) {
      characterItemsContainer.innerHTML = `<div style="text-align: center; padding: 1.5rem; color: var(--text-dim); font-size: 0.8rem;">No se encontraron personajes.</div>`;
      return;
    }

    filtered.forEach(char => {
      const charNodes = getNodesForCharacter(char);
      const item = document.createElement('div');
      item.className = `character-item-card ${state.selectedCharacterId === char.id ? 'selected' : ''}`;
      item.innerHTML = `
        <div class="char-item-avatar" style="--char-border: ${char.color || '#6366f1'}">
          ${char.avatar || '👤'}
        </div>
        <div class="char-item-info">
          <div class="char-item-name">${escapeHtml(char.name)}</div>
          <div class="char-item-meta">
            <span class="char-role-tag">${escapeHtml(char.role || 'Personaje')}</span>
            <span class="char-scenes-badge">${charNodes.length} escenas</span>
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        selectCharacterInModal(char.id);
      });

      characterItemsContainer.appendChild(item);
    });
  }

  function selectCharacterInModal(charId) {
    state.selectedCharacterId = charId;
    const char = getCharacterById(charId);

    document.querySelectorAll('.character-item-card').forEach(el => {
      el.classList.remove('selected');
    });
    renderCharactersList(inputSearchCharacter.value);

    if (!char) {
      showEmptyCharacterSheet();
      return;
    }

    characterSheetEmpty.style.display = 'none';
    characterSheetForm.style.display = 'flex';

    charIdInput.value = char.id;
    charNameInput.value = char.name || '';
    charRoleSelect.value = char.role || 'Protagonista';
    charColorSelect.value = char.color || '#a855f7';
    charAvatarInput.value = char.avatar || '🧙‍♂️';
    charAvatarPreview.textContent = char.avatar || '🧙‍♂️';
    charAvatarPreview.style.borderColor = char.color || '#a855f7';
    charAvatarPreview.style.boxShadow = `0 0 20px ${(char.color || '#a855f7')}66`;
    charMotivationInput.value = char.motivation || '';
    charArchetypeInput.value = char.archetype || '';
    charBioInput.value = char.bio || '';

    renderParticipatingNodes(char);
  }

  function showEmptyCharacterSheet() {
    characterSheetEmpty.style.display = 'flex';
    characterSheetForm.style.display = 'none';
    state.selectedCharacterId = null;
  }

  function renderParticipatingNodes(character) {
    charParticipatingNodes.innerHTML = '';
    const nodes = getNodesForCharacter(character);

    charParticipatingCount.textContent = `${nodes.length} escena${nodes.length === 1 ? '' : 's'}`;

    if (nodes.length === 0) {
      charParticipatingNodes.innerHTML = `
        <div style="font-size: 0.78rem; color: var(--text-dim); padding: 0.5rem 0;">
          Este personaje aún no ha sido asignado a ningún nodo. Selecciónalo en el campo "Personajes en este Nodo" del Inspector para vincularlo.
        </div>
      `;
      return;
    }

    const typeIcons = { story: '📖', gameplay: '⚔️', cutscene: '🎬', choice: '🔀' };

    nodes.forEach(node => {
      const item = document.createElement('div');
      item.className = 'participating-node-item';
      item.innerHTML = `
        <div class="p-node-info">
          <span>${typeIcons[node.type] || '📌'}</span>
          <span class="p-node-title">${escapeHtml(node.title)}</span>
        </div>
        <span class="p-node-action-hint">Ir al nodo ➔</span>
      `;

      item.addEventListener('click', () => {
        closeCharactersModal();
        jumpToNode(node.id);
      });

      charParticipatingNodes.appendChild(item);
    });
  }

  function jumpToNode(nodeId) {
    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) return;

    selectNode(node.id);

    const rect = canvasContainer.getBoundingClientRect();
    state.panX = rect.width / 2 - (node.x + 145) * state.scale;
    state.panY = rect.height / 2 - (node.y + 80) * state.scale;

    updateCanvasTransform();
  }

  function createNewCharacter() {
    const newId = 'char-' + Date.now();
    const newChar = {
      id: newId,
      name: 'Nuevo Personaje ' + (state.characters.length + 1),
      role: 'Secundario',
      avatar: '🎭',
      color: '#a855f7',
      motivation: '',
      archetype: '',
      bio: ''
    };

    state.characters.push(newChar);
    saveToLocalStorage();
    updateCharacterCountUI();
    renderCharacterFilterPills();
    renderCharactersList();
    selectCharacterInModal(newId);
    charNameInput.focus();
    charNameInput.select();
  }

  function saveCharacterFromForm() {
    if (!state.selectedCharacterId) return;
    const char = getCharacterById(state.selectedCharacterId);
    if (!char) return;

    const oldName = char.name;
    const newName = charNameInput.value.trim() || 'Sin Nombre';

    char.name = newName;
    char.role = charRoleSelect.value;
    char.color = charColorSelect.value;
    char.avatar = charAvatarInput.value;
    char.motivation = charMotivationInput.value;
    char.archetype = charArchetypeInput.value;
    char.bio = charBioInput.value;

    charAvatarPreview.textContent = char.avatar;
    charAvatarPreview.style.borderColor = char.color;
    charAvatarPreview.style.boxShadow = `0 0 20px ${char.color}66`;

    if (oldName && oldName !== newName) {
      state.nodes.forEach(n => {
        if (Array.isArray(n.characters)) {
          n.characters = n.characters.map(c => c === oldName ? newName : c);
        }
        if (n.speaker === oldName) {
          n.speaker = newName;
        }
      });
    }

    saveToLocalStorage();
    updateCharacterCountUI();
    renderCharacterFilterPills();
    renderCharactersList(inputSearchCharacter.value);
    renderParticipatingNodes(char);
    renderNodes();

    if (state.selectedNodeId) {
      const currentNode = state.nodes.find(n => n.id === state.selectedNodeId);
      if (currentNode) {
        renderNodeCharactersManager(currentNode);
      }
    }
  }

  function deleteSelectedCharacter() {
    if (!state.selectedCharacterId) return;
    const char = getCharacterById(state.selectedCharacterId);
    if (!char) return;

    if (confirm(`¿Estás seguro de que deseas eliminar la ficha de "${char.name}"?`)) {
      state.characters = state.characters.filter(c => c.id !== char.id);

      // Desvincular de nodos
      state.nodes.forEach(n => {
        if (Array.isArray(n.characters)) {
          n.characters = n.characters.filter(c => c !== char.name);
        }
        if (n.speaker === char.name) {
          n.speaker = n.characters[0] || '';
        }
      });

      if (state.activeCharacterFilter === char.id) {
        clearCharacterFilter();
      }

      saveToLocalStorage();
      updateCharacterCountUI();
      renderCharacterFilterPills();
      renderCharactersList();
      showEmptyCharacterSheet();
      renderNodes();

      if (state.selectedNodeId) {
        const currentNode = state.nodes.find(n => n.id === state.selectedNodeId);
        if (currentNode) {
          renderNodeCharactersManager(currentNode);
        }
      }
    }
  }

  // --- TRANSFORMACIONES DEL LIENZO (ZOOM & PAN) ---
  function updateCanvasTransform() {
    const transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
    nodesLayer.style.transform = transform;
    connectionsLayer.style.transform = transform;
    canvasGrid.style.transform = transform;
    zoomDisplay.textContent = `${Math.round(state.scale * 100)}%`;
  }

  function zoom(delta, clientX, clientY) {
    const oldScale = state.scale;
    let newScale = oldScale + delta;
    newScale = Math.min(Math.max(0.3, newScale), 2.5);

    if (newScale === oldScale) return;

    if (clientX !== undefined && clientY !== undefined) {
      const rect = canvasContainer.getBoundingClientRect();
      const mouseX = clientX - rect.left;
      const mouseY = clientY - rect.top;

      state.panX = mouseX - ((mouseX - state.panX) * newScale) / oldScale;
      state.panY = mouseY - ((mouseY - state.panY) * newScale) / oldScale;
    }

    state.scale = newScale;
    updateCanvasTransform();
  }

  function resetView() {
    if (state.nodes.length === 0) {
      state.scale = 1;
      state.panX = 50;
      state.panY = 50;
      updateCanvasTransform();
      return;
    }

    focusNodes(state.nodes);
  }

  // --- RENDERIZADO DE NODOS ---
  function renderAll() {
    renderNodes();
    renderConnections();
    updateCanvasFilterClasses();
  }

  function renderNodes() {
    nodesLayer.innerHTML = '';
    state.nodes.forEach(node => {
      const nodeEl = createNodeElement(node);
      nodesLayer.appendChild(nodeEl);
    });
  }

  function createNodeElement(node) {
    const el = document.createElement('div');
    el.className = `node-card type-${node.type} ${state.selectedNodeId === node.id ? 'selected' : ''}`;
    el.id = node.id;
    el.style.left = `${node.x}px`;
    el.style.top = `${node.y}px`;

    const typeNames = {
      story: 'Historia',
      gameplay: 'Gameplay',
      cutscene: 'Cinemática',
      choice: 'Elección'
    };
    const typeIcons = {
      story: '📖',
      gameplay: '⚔️',
      cutscene: '🎬',
      choice: '🔀'
    };

    // Renderizar badges de todos los personajes del nodo
    const charList = getNodeCharacters(node);
    let charactersBadgesHtml = '';
    if (charList.length > 0) {
      charactersBadgesHtml = '<div class="node-characters-card-row">';
      charList.forEach(charName => {
        const matched = getCharacterByName(charName);
        const avatar = matched ? matched.avatar : '👤';
        const color = matched ? matched.color : '#818cf8';
        charactersBadgesHtml += `
          <div class="node-card-char-badge" style="--char-color: ${color}; --char-glow: ${color}44" title="${escapeHtml(charName)}">
            <span>${avatar}</span>
            <span>${escapeHtml(charName)}</span>
          </div>`;
      });
      charactersBadgesHtml += '</div>';
    }

    let previewHtml = '';
    if (node.type === 'story' || node.type === 'cutscene' || node.type === 'choice') {
      previewHtml += charactersBadgesHtml;
      previewHtml += `<div class="node-preview-text">${escapeHtml(node.synopsis || 'Sin guión aún...')}</div>`;
    } else if (node.type === 'gameplay') {
      if (charList.length > 0) {
        previewHtml += charactersBadgesHtml;
      }
      if (node.mechanic) {
        previewHtml += `<div class="node-speaker" style="color: var(--gameplay-color)">⚙️ ${escapeHtml(node.mechanic)}</div>`;
      }
      previewHtml += `<div class="node-preview-text"><b>Objetivo:</b> ${escapeHtml(node.objective || 'Definir objetivo de misión...')}</div>`;
      if (node.reward) {
        previewHtml += `<div class="node-preview-text" style="color: #6ee7b7">🎁 ${escapeHtml(node.reward)}</div>`;
      }
    }

    // Tags
    let tagsHtml = '';
    if (node.tags && node.tags.trim()) {
      const tagList = node.tags.split(',').map(t => t.trim()).filter(Boolean);
      tagsHtml = `<div class="node-meta-tags">${tagList.map(t => `<span class="meta-tag">${escapeHtml(t)}</span>`).join('')}</div>`;
    }

    el.innerHTML = `
      <div class="node-header">
        <div class="node-badge-row">
          <span class="node-type-icon">${typeIcons[node.type] || '📌'}</span>
          <span class="node-type-label">${typeNames[node.type] || 'Nodo'}</span>
        </div>
        <span class="node-status-dot status-${node.status || 'idea'}" title="Estado: ${node.status || 'idea'}"></span>
      </div>
      <div class="node-body">
        <h3 class="node-title">${escapeHtml(node.title || 'Sin Título')}</h3>
        ${previewHtml}
        ${tagsHtml}
      </div>
      <div class="node-ports-container">
        <div class="port port-input" data-node-id="${node.id}" data-port-type="input" title="Puerto de Entrada"></div>
        <div class="port port-output" data-node-id="${node.id}" data-port-type="output" title="Puerto de Salida (Conectar)"></div>
      </div>
    `;

    el.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('port')) return;
      if (e.button !== 0) return;

      e.stopPropagation();
      selectNode(node.id);

      state.draggedNodeId = node.id;
      const rect = canvasContainer.getBoundingClientRect();
      const mouseCanvasX = (e.clientX - rect.left - state.panX) / state.scale;
      const mouseCanvasY = (e.clientY - rect.top - state.panY) / state.scale;

      state.dragOffset.x = mouseCanvasX - node.x;
      state.dragOffset.y = mouseCanvasY - node.y;
    });

    return el;
  }

  // --- RENDERIZADO DE CONEXIONES SVG ---
  function renderConnections() {
    const oldPaths = connectionsLayer.querySelectorAll('.connection-path');
    oldPaths.forEach(p => p.remove());

    state.connections.forEach(conn => {
      const fromNode = state.nodes.find(n => n.id === conn.from);
      const toNode = state.nodes.find(n => n.id === conn.to);

      if (!fromNode || !toNode) return;

      const p1 = getNodePortPos(fromNode, 'output');
      const p2 = getNodePortPos(toNode, 'input');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', generateBezierPath(p1.x, p1.y, p2.x, p2.y));
      path.setAttribute('class', `connection-path ${fromNode.type}-wire`);
      path.setAttribute('data-from', conn.from);
      path.setAttribute('data-to', conn.to);

      const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      titleEl.textContent = `Conexión: ${fromNode.title} ➔ ${toNode.title}\n(Haz doble clic para desconectar)`;
      path.appendChild(titleEl);

      path.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        removeConnection(conn.from, conn.to);
      });

      connectionsLayer.appendChild(path);
    });
  }

  function getNodePortPos(node, portType) {
    const nodeEl = document.getElementById(node.id);
    const width = 290;
    const height = nodeEl ? nodeEl.offsetHeight : 150;

    if (portType === 'output') {
      return { x: node.x + width, y: node.y + height / 2 };
    } else {
      return { x: node.x, y: node.y + height / 2 };
    }
  }

  function generateBezierPath(x1, y1, x2, y2) {
    const dx = Math.max(Math.abs(x2 - x1) * 0.55, 60);
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
  }

  function addConnection(fromId, toId) {
    if (fromId === toId) return;
    const exists = state.connections.some(c => c.from === fromId && c.to === toId);
    if (!exists) {
      state.connections.push({ from: fromId, to: toId });
      saveToLocalStorage();
      renderConnections();
      updateCanvasFilterClasses();
    }
  }

  function removeConnection(fromId, toId) {
    state.connections = state.connections.filter(c => !(c.from === fromId && c.to === toId));
    saveToLocalStorage();
    renderConnections();
  }

  // --- SELECCIÓN E INSPECTOR ---
  function selectNode(nodeId) {
    state.selectedNodeId = nodeId;

    document.querySelectorAll('.node-card').forEach(el => {
      el.classList.toggle('selected', el.id === nodeId);
    });

    const node = state.nodes.find(n => n.id === nodeId);
    if (!node) {
      inspectorEmpty.style.display = 'flex';
      inspectorForm.style.display = 'none';
      inspectorTitleDisplay.textContent = 'Selecciona un nodo';
      inspectorTypeBadge.className = 'type-badge';
      inspectorTypeBadge.textContent = 'SIN SELECCIÓN';
      return;
    }

    inspectorEmpty.style.display = 'none';
    inspectorForm.style.display = 'flex';

    editNodeIdInput.value = node.id;
    editTitleInput.value = node.title || '';
    editTypeSelect.value = node.type || 'story';
    editStatusSelect.value = node.status || 'idea';

    // Rellenar gestor de chips multi-personaje
    renderNodeCharactersManager(node);

    editSynopsisInput.value = node.synopsis || '';
    editMechanicInput.value = node.mechanic || '';
    editObjectiveInput.value = node.objective || '';
    editRewardInput.value = node.reward || '';
    editTagsInput.value = node.tags || '';
    editNotesInput.value = node.notes || '';

    inspectorTitleDisplay.textContent = node.title || 'Sin Título';
    inspectorTypeBadge.className = `type-badge ${node.type}`;
    inspectorTypeBadge.textContent = node.type.toUpperCase();

    updateInspectorTypeSections(node.type);
  }

  function updateInspectorTypeSections(type) {
    if (type === 'story' || type === 'cutscene' || type === 'choice') {
      sectionStory.style.display = 'flex';
      sectionGameplay.style.display = 'none';
    } else if (type === 'gameplay') {
      sectionStory.style.display = 'none';
      sectionGameplay.style.display = 'flex';
    }
  }

  function updateSelectedNodeFromForm() {
    if (!state.selectedNodeId) return;
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (!node) return;

    node.title = editTitleInput.value;
    node.type = editTypeSelect.value;
    node.status = editStatusSelect.value;
    node.synopsis = editSynopsisInput.value;
    node.mechanic = editMechanicInput.value;
    node.objective = editObjectiveInput.value;
    node.reward = editRewardInput.value;
    node.tags = editTagsInput.value;
    node.notes = editNotesInput.value;

    inspectorTitleDisplay.textContent = node.title || 'Sin Título';
    inspectorTypeBadge.className = `type-badge ${node.type}`;
    inspectorTypeBadge.textContent = node.type.toUpperCase();
    updateInspectorTypeSections(node.type);

    saveToLocalStorage();
    renderAll();
    renderCharacterFilterPills();
  }

  // --- CREAR NUEVO NODO ---
  function addNewNode(type) {
    const id = 'node-' + Date.now();
    const rect = canvasContainer.getBoundingClientRect();

    const centerX = (-state.panX + rect.width / 2) / state.scale - 145;
    const centerY = (-state.panY + rect.height / 2) / state.scale - 80;

    const defaultTitles = {
      story: 'Nuevo Diálogo / Escena',
      gameplay: 'Nuevo Desafío de Gameplay',
      cutscene: 'Nueva Cinemática',
      choice: 'Nueva Elección de Jugador'
    };

    const initialChars = (state.characters.length > 0 && type === 'story') ? [state.characters[0].name] : [];

    const newNode = {
      id: id,
      title: defaultTitles[type] || 'Nuevo Nodo',
      type: type,
      status: 'wip',
      x: Math.round(centerX / 20) * 20,
      y: Math.round(centerY / 20) * 20,
      characters: initialChars,
      speaker: initialChars[0] || '',
      synopsis: '',
      mechanic: type === 'gameplay' ? 'Puzle / Combate' : '',
      objective: '',
      reward: '',
      tags: '',
      notes: ''
    };

    state.nodes.push(newNode);
    saveToLocalStorage();
    renderAll();
    renderCharacterFilterPills();
    selectNode(id);
  }

  function duplicateSelectedNode() {
    if (!state.selectedNodeId) return;
    const node = state.nodes.find(n => n.id === state.selectedNodeId);
    if (!node) return;

    const newId = 'node-' + Date.now();
    const cloned = JSON.parse(JSON.stringify(node));
    cloned.id = newId;
    cloned.title += ' (Copia)';
    cloned.x += 40;
    cloned.y += 40;

    state.nodes.push(cloned);
    saveToLocalStorage();
    renderAll();
    renderCharacterFilterPills();
    selectNode(newId);
  }

  function deleteSelectedNode() {
    if (!state.selectedNodeId) return;
    const id = state.selectedNodeId;

    state.nodes = state.nodes.filter(n => n.id !== id);
    state.connections = state.connections.filter(c => c.from !== id && c.to !== id);

    state.selectedNodeId = null;
    selectNode(null);
    saveToLocalStorage();
    renderAll();
    renderCharacterFilterPills();
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    btnAddStory.addEventListener('click', () => addNewNode('story'));
    btnAddGameplay.addEventListener('click', () => addNewNode('gameplay'));
    btnAddCutscene.addEventListener('click', () => addNewNode('cutscene'));
    btnAddChoice.addEventListener('click', () => addNewNode('choice'));

    btnZoomIn.addEventListener('click', () => zoom(0.15));
    btnZoomOut.addEventListener('click', () => zoom(-0.15));
    btnZoomReset.addEventListener('click', resetView);

    canvasContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      zoom(delta, e.clientX, e.clientY);
    }, { passive: false });

    canvasContainer.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('port')) {
        e.stopPropagation();
        const nodeId = e.target.getAttribute('data-node-id');
        const portType = e.target.getAttribute('data-port-type');

        if (portType === 'output') {
          state.connectingFromNodeId = nodeId;
          state.connectingFromPortType = 'output';
          e.target.classList.add('connecting-active');
        }
        return;
      }

      if (e.target === canvasContainer || e.target === canvasGrid || e.target === connectionsLayer) {
        selectNode(null);
        state.isPanning = true;
        state.panStart.x = e.clientX - state.panX;
        state.panStart.y = e.clientY - state.panY;
        canvasContainer.classList.add('panning');
      }
    });

    canvasContainer.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('mousemove', (e) => {
      const rect = canvasContainer.getBoundingClientRect();

      if (state.isPanning) {
        state.panX = e.clientX - state.panStart.x;
        state.panY = e.clientY - state.panStart.y;
        updateCanvasTransform();
        return;
      }

      if (state.draggedNodeId) {
        const node = state.nodes.find(n => n.id === state.draggedNodeId);
        if (node) {
          const mouseCanvasX = (e.clientX - rect.left - state.panX) / state.scale;
          const mouseCanvasY = (e.clientY - rect.top - state.panY) / state.scale;

          node.x = Math.round(mouseCanvasX - state.dragOffset.x);
          node.y = Math.round(mouseCanvasY - state.dragOffset.y);

          const nodeEl = document.getElementById(node.id);
          if (nodeEl) {
            nodeEl.style.left = `${node.x}px`;
            nodeEl.style.top = `${node.y}px`;
          }
          renderConnections();
        }
        return;
      }

      if (state.connectingFromNodeId) {
        const fromNode = state.nodes.find(n => n.id === state.connectingFromNodeId);
        if (fromNode) {
          const p1 = getNodePortPos(fromNode, 'output');
          const mouseCanvasX = (e.clientX - rect.left - state.panX) / state.scale;
          const mouseCanvasY = (e.clientY - rect.top - state.panY) / state.scale;

          tempConnection.setAttribute('d', generateBezierPath(p1.x, p1.y, mouseCanvasX, mouseCanvasY));
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (state.isPanning) {
        state.isPanning = false;
        canvasContainer.classList.remove('panning');
      }

      if (state.draggedNodeId) {
        state.draggedNodeId = null;
        saveToLocalStorage();
      }

      if (state.connectingFromNodeId) {
        const targetPort = document.elementFromPoint(e.clientX, e.clientY);
        if (targetPort && targetPort.classList.contains('port-input')) {
          const targetNodeId = targetPort.getAttribute('data-node-id');
          if (targetNodeId && targetNodeId !== state.connectingFromNodeId) {
            addConnection(state.connectingFromNodeId, targetNodeId);
          }
        }

        tempConnection.setAttribute('d', '');
        document.querySelectorAll('.port.connecting-active').forEach(p => p.classList.remove('connecting-active'));
        state.connectingFromNodeId = null;
        state.connectingFromPortType = null;
      }
    });

    // Inspector
    [
      editTitleInput, editTypeSelect, editStatusSelect,
      editSynopsisInput, editMechanicInput, editObjectiveInput,
      editRewardInput, editTagsInput, editNotesInput
    ].forEach(input => {
      input.addEventListener('input', updateSelectedNodeFromForm);
      input.addEventListener('change', updateSelectedNodeFromForm);
    });

    // Selector para añadir personaje al nodo
    selectAddCharacterToNode.addEventListener('change', () => {
      if (!state.selectedNodeId) return;
      const node = state.nodes.find(n => n.id === state.selectedNodeId);
      if (!node) return;
      const val = selectAddCharacterToNode.value;
      if (val) {
        addCharacterToNode(node, val);
      }
    });

    btnCloseInspector.addEventListener('click', () => selectNode(null));
    btnDuplicateNode.addEventListener('click', duplicateSelectedNode);
    btnDeleteNode.addEventListener('click', deleteSelectedNode);

    btnQuickNewChar.addEventListener('click', () => {
      openCharactersModal();
      createNewCharacter();
    });

    // Filtros de Lienzo
    btnClearFilter.addEventListener('click', clearCharacterFilter);
    btnCloseFilterBanner.addEventListener('click', clearCharacterFilter);
    btnFocusFilterNodes.addEventListener('click', () => {
      if (state.activeCharacterFilter) {
        const char = getCharacterById(state.activeCharacterFilter);
        if (char) {
          focusNodes(getNodesForCharacter(char));
        }
      }
    });

    // Modal de Personajes
    btnOpenCharacters.addEventListener('click', () => openCharactersModal());
    btnCloseCharactersModal.addEventListener('click', closeCharactersModal);
    btnCreateCharacter.addEventListener('click', createNewCharacter);
    btnDeleteCharacter.addEventListener('click', deleteSelectedCharacter);

    inputSearchCharacter.addEventListener('input', (e) => {
      renderCharactersList(e.target.value);
    });

    document.querySelectorAll('.btn-emoji-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const emoji = btn.getAttribute('data-emoji');
        charAvatarInput.value = emoji;
        charAvatarPreview.textContent = emoji;
        saveCharacterFromForm();
      });
    });

    [
      charNameInput, charRoleSelect, charColorSelect,
      charMotivationInput, charArchetypeInput, charBioInput
    ].forEach(input => {
      input.addEventListener('input', saveCharacterFromForm);
      input.addEventListener('change', saveCharacterFromForm);
    });

    btnFilterThisCharacter.addEventListener('click', () => {
      if (state.selectedCharacterId) {
        const id = state.selectedCharacterId;
        closeCharactersModal();
        applyCharacterFilter(id);
      }
    });

    // Limpiar Lienzo
    btnClear.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que deseas vaciar todos los nodos del lienzo?')) {
        state.nodes = [];
        state.connections = [];
        state.selectedNodeId = null;
        selectNode(null);
        clearCharacterFilter();
        saveToLocalStorage();
        renderAll();
      }
    });

    // JSON Export / Import
    btnExportJson.addEventListener('click', exportProjectAsJson);
    btnImportJson.addEventListener('click', () => inputFileJson.click());
    inputFileJson.addEventListener('change', importProjectFromJson);

    // Modal Exportar Imagen
    btnExportImage.addEventListener('click', openExportModal);
    btnModalClose.addEventListener('click', closeExportModal);
    btnCancelModal.addEventListener('click', closeExportModal);
    btnDownloadImage.addEventListener('click', downloadCanvasImage);
    exportScaleSelect.addEventListener('change', generateImagePreview);
    document.querySelectorAll('input[name="export-bg"], input[name="export-format"]').forEach(radio => {
      radio.addEventListener('change', generateImagePreview);
    });
  }

  // --- EXPORTAR E IMPORTAR JSON ---
  function exportProjectAsJson() {
    const data = {
      project: 'NexusForge Story & Gameplay Flow',
      version: '1.3',
      exportedAt: new Date().toISOString(),
      characters: state.characters,
      nodes: state.nodes,
      connections: state.connections
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexusforge_proyecto_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importProjectFromJson(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (Array.isArray(parsed.nodes) && Array.isArray(parsed.connections)) {
          state.nodes = parsed.nodes;
          state.connections = parsed.connections;
          if (Array.isArray(parsed.characters)) {
            state.characters = parsed.characters;
          }
          state.nodes.forEach(n => {
            if (!Array.isArray(n.characters)) {
              n.characters = n.speaker ? [n.speaker] : [];
            }
          });
          state.selectedNodeId = null;
          selectNode(null);
          clearCharacterFilter();
          saveToLocalStorage();
          updateCharacterCountUI();
          renderCharacterFilterPills();
          renderAll();
          resetView();
          alert('¡Proyecto cargado exitosamente!');
        } else {
          alert('El archivo JSON no tiene la estructura de nodos válida.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // --- MOTOR DE EXPORTACIÓN A IMAGEN (PNG / JPG) ---
  function openExportModal() {
    modalExport.style.display = 'flex';
    generateImagePreview();
  }

  function closeExportModal() {
    modalExport.style.display = 'none';
  }

  function computeBoundingBox() {
    if (state.nodes.length === 0) {
      return { x: 0, y: 0, w: 800, h: 600 };
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    state.nodes.forEach(n => {
      const nodeEl = document.getElementById(n.id);
      const h = nodeEl ? nodeEl.offsetHeight : 160;
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + 290);
      maxY = Math.max(maxY, n.y + h);
    });

    const padding = 60;
    return {
      x: minX - padding,
      y: minY - padding,
      w: maxX - minX + padding * 2,
      h: maxY - minY + padding * 2
    };
  }

  function renderToOffscreenCanvas(scaleMultiplier) {
    const bb = computeBoundingBox();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bb.w * scaleMultiplier);
    canvas.height = Math.round(bb.h * scaleMultiplier);
    const ctx = canvas.getContext('2d');

    const bgChoice = document.querySelector('input[name="export-bg"]:checked').value;

    if (bgChoice === 'dark') {
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      const gridSize = 24 * scaleMultiplier;
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2 * scaleMultiplier, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.scale(scaleMultiplier, scaleMultiplier);
    ctx.translate(-bb.x, -bb.y);

    // 1. Cables
    state.connections.forEach(conn => {
      const fromNode = state.nodes.find(n => n.id === conn.from);
      const toNode = state.nodes.find(n => n.id === conn.to);
      if (!fromNode || !toNode) return;

      const p1 = getNodePortPos(fromNode, 'output');
      const p2 = getNodePortPos(toNode, 'input');
      const dx = Math.max(Math.abs(p2.x - p1.x) * 0.55, 60);

      const wireColors = {
        story: '#a855f7',
        gameplay: '#10b981',
        cutscene: '#f59e0b',
        choice: '#ec4899'
      };
      const wireColor = wireColors[fromNode.type] || '#6366f1';

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.bezierCurveTo(p1.x + dx, p1.y, p2.x - dx, p2.y, p2.x, p2.y);
      ctx.strokeStyle = wireColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(midX, midY, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // 2. Nodos
    const typeBorderColors = {
      story: '#a855f7',
      gameplay: '#10b981',
      cutscene: '#f59e0b',
      choice: '#ec4899'
    };

    state.nodes.forEach(node => {
      const nodeEl = document.getElementById(node.id);
      const width = 290;
      const height = nodeEl ? nodeEl.offsetHeight : 160;

      ctx.save();

      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;

      drawRoundedRect(ctx, node.x, node.y, width, height, 12);
      ctx.fillStyle = '#111827';
      ctx.fill();

      ctx.shadowColor = 'transparent';

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(node.x, node.y, width, height, [12, 12, 0, 0]) : ctx.rect(node.x, node.y, width, 5);
      ctx.clip();
      ctx.fillStyle = typeBorderColors[node.type] || '#6366f1';
      ctx.fillRect(node.x, node.y, width, 4);
      ctx.restore();

      const typeLabel = node.type.toUpperCase();
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = typeBorderColors[node.type] || '#cbd5e1';
      ctx.fillText(typeLabel, node.x + 14, node.y + 24);

      const statusColors = { idea: '#94a3b8', wip: '#f59e0b', ready: '#10b981' };
      ctx.fillStyle = statusColors[node.status] || '#94a3b8';
      ctx.beginPath();
      ctx.arc(node.x + width - 18, node.y + 20, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(node.x, node.y + 34);
      ctx.lineTo(node.x + width, node.y + 34);
      ctx.stroke();

      // Título
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#f8fafc';
      wrapText(ctx, node.title || 'Sin Título', node.x + 14, node.y + 54, width - 28, 16, 2);

      // Personajes múltiples
      let currentY = node.y + 78;
      const chars = getNodeCharacters(node);
      if (chars.length > 0) {
        ctx.font = '600 11px sans-serif';
        const charNames = chars.map(c => {
          const m = getCharacterByName(c);
          return `${m ? m.avatar : '👤'} ${c}`;
        }).join(', ');
        ctx.fillStyle = '#c084fc';
        currentY = wrapText(ctx, charNames, node.x + 14, currentY, width - 28, 15, 2);
      } else if (node.mechanic) {
        ctx.font = '600 11px sans-serif';
        ctx.fillStyle = '#34d399';
        ctx.fillText(`⚙️ ${node.mechanic}`, node.x + 14, currentY);
        currentY += 16;
      }

      // Sinopsis u Objetivo
      const bodyText = node.synopsis || node.objective || '';
      if (bodyText) {
        ctx.font = '11px sans-serif';
        ctx.fillStyle = '#94a3b8';
        currentY = wrapText(ctx, bodyText, node.x + 14, currentY, width - 28, 15, 3) + 6;
      }

      if (node.reward) {
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText(`🎁 ${node.reward}`, node.x + 14, currentY);
      }

      // Puertos
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = typeBorderColors[node.type] || '#fff';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(node.x, node.y + height / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(node.x + width, node.y + height / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    });

    // Marca de Agua
    ctx.font = '600 11px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText('Creado con NexusForge Story & Gameplay Node Editor', bb.x + 20, bb.y + bb.h - 15);

    ctx.restore();
    return canvas;
  }

  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const words = text.split(' ');
    let line = '';
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
        lineCount++;
        if (maxLines && lineCount >= maxLines - 1) {
          line += '...';
          break;
        }
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
    return y + lineHeight;
  }

  function generateImagePreview() {
    const scale = parseFloat(exportScaleSelect.value) || 1;
    const offscreen = renderToOffscreenCanvas(scale);

    exportCanvasPreview.width = offscreen.width;
    exportCanvasPreview.height = offscreen.height;
    const pctx = exportCanvasPreview.getContext('2d');
    pctx.drawImage(offscreen, 0, 0);
  }

  function downloadCanvasImage() {
    const scale = parseFloat(exportScaleSelect.value) || 1.5;
    const format = document.querySelector('input[name="export-format"]:checked').value;
    const offscreen = renderToOffscreenCanvas(scale);

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpeg' ? 0.92 : undefined;
    const ext = format === 'jpeg' ? 'jpg' : 'png';

    const dataUrl = offscreen.toDataURL(mime, quality);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `nexusforge_diagrama_${Date.now()}.${ext}`;
    a.click();
    closeExportModal();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.addEventListener('DOMContentLoaded', init);
})();
