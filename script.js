// script.js - Amigo Secreto
(() => {
  // Elements
  const nameInput = document.getElementById('nameInput');
  const addBtn = document.getElementById('addBtn');
  const playersList = document.getElementById('playersList');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');

  const setup = document.getElementById('setup');
  const turnScreen = document.getElementById('turnScreen');
  const secretScreen = document.getElementById('secretScreen');
  const endScreen = document.getElementById('endScreen');

  const currentGiver = document.getElementById('currentGiver');
  const toSecretBtn = document.getElementById('toSecretBtn');
  const backToListBtn = document.getElementById('backToListBtn');
  const remainingList = document.getElementById('remainingList');
  const remainingContainer = document.getElementById('remainingContainer');

  const giverReveal = document.getElementById('giverReveal');
  const recipientReveal = document.getElementById('recipientReveal');
  const nextBtn = document.getElementById('nextBtn');

  const showPairsBtn = document.getElementById('showPairsBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const pairsContainer = document.getElementById('pairsContainer');
  const pairsList = document.getElementById('pairsList');

  // State
  let players = [];
  let assignments = {}; // giver -> recipient
  let order = []; // order of givers
  let turnIndex = 0;

  // Helpers
  function renderPlayers() {
    playersList.innerHTML = '';
    players.forEach((p, i) => {
      const li = document.createElement('li');
      li.textContent = p;
      const rm = document.createElement('span');
      rm.textContent = '✖';
      rm.className = 'remove';
      rm.title = 'Eliminar';
      rm.onclick = () => {
        players.splice(i,1);
        renderPlayers();
        updateStartBtn();
      };
      li.appendChild(rm);
      playersList.appendChild(li);
    });
  }

  function updateStartBtn() {
    startBtn.disabled = players.length < 2;
  }

  // Add player
  function addPlayer(name) {
    name = (name || '').trim();
    if(!name) return;
    if(players.includes(name)){
      alert('Ya existe ese nombre. Usa uno distinto o añade apellido/emoticono 😊');
      return;
    }
    players.push(name);
    nameInput.value = '';
    renderPlayers();
    updateStartBtn();
  }

  addBtn.addEventListener('click', () => addPlayer(nameInput.value));
  nameInput.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') addPlayer(nameInput.value);
  });

  resetBtn.addEventListener('click', () => {
    if(!confirm('¿Reiniciar la lista de jugadores?')) return;
    players = [];
    assignments = {};
    order = [];
    turnIndex = 0;
    renderPlayers();
    updateStartBtn();
  });

  // Utilities: shuffle
  function shuffle(arr) {
    for(let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Generate a derangement (no one assigned to themselves).
  // For small n we reshuffle until valid — for reasonable party sizes this is fast.
  function generateDerangement(names) {
    if(names.length < 2) return null;
    let recipients = names.slice();
    let attempts = 0;
    while(true) {
      attempts++;
      shuffle(recipients);
      let ok = true;
      for(let i=0;i<names.length;i++){
        if(recipients[i] === names[i]) { ok = false; break; }
      }
      if(ok) {
        // map names[i] -> recipients[i]
        const map = {};
        for(let i=0;i<names.length;i++) map[names[i]] = recipients[i];
        return map;
      }
      // safety bail if super unlucky (practically impossible): reshuffle from scratch up to 5000 times
      if(attempts > 5000) {
        // fallback: try algorithmic pairing: rotate by 1
        const rotated = names.slice(1).concat(names[0]);
        const map = {};
        for(let i=0;i<names.length;i++) map[names[i]] = rotated[i];
        return map;
      }
    }
  }

  // Start game
  startBtn.addEventListener('click', () => {
    // Freeze players order - we'll randomize the order of givers for extra excitement
    const playersCopy = players.slice();
    shuffle(playersCopy); // who gives first etc.
    order = playersCopy;
    assignments = generateDerangement(playersCopy); // ensure no self assignment

    // If assignment generation used original order, but ensure recipients are among original players
    if(!assignments){
      alert('No se pudo generar asignaciones. Asegúrate de tener al menos 2 jugadores.');
      return;
    }

    // Start from first turn
    turnIndex = 0;
    showTurnScreen();
    switchScreen('turnScreen');
  });

  // Switch visible card
  function switchScreen(id) {
    [setup, turnScreen, secretScreen, endScreen].forEach(s => s.classList.remove('active'));
    const mapping = {
      'setup': setup,
      'turnScreen': turnScreen,
      'secretScreen': secretScreen,
      'endScreen': endScreen
    };
    mapping[id].classList.add('active');
  }

  // Show turn screen for current giver
  function showTurnScreen() {
    const giver = order[turnIndex];
    currentGiver.textContent = giver;
    // update remaining recipients list (those not revealed yet)
    const remaining = getRemainingRecipients();
    remainingList.innerHTML = '';
    remaining.forEach(r => {
      const li = document.createElement('li');
      li.textContent = r;
      remainingList.appendChild(li);
    });
    remainingContainer.style.display = remaining.length ? 'block' : 'none';
  }

  // Get recipients that haven't been revealed yet
  function getRemainingRecipients() {
    const revealed = Object.keys(assignments).filter(g => {
      // We'll track revealed by checking if we already advanced past that giver
      // But simpler: revealed recipients are those whose giver index < turnIndex
      return order.indexOf(g) < turnIndex;
    }).map(g => assignments[g]);
    const allRecipients = Object.values(assignments);
    return allRecipients.filter(r => !revealed.includes(r));
  }

  // Go to secret reveal
  toSecretBtn.addEventListener('click', () => {
    const giver = order[turnIndex];
    giverReveal.textContent = giver;
    // reveal their assigned recipient (but keep secret until this screen)
    const recipient = assignments[giver];
    // small fun formatting
    recipientReveal.textContent = `🎁 ${recipient} 🎉`;
    // show secret screen
    switchScreen('secretScreen');
  });

  // Back to list (optional)
  backToListBtn.addEventListener('click', () => {
    alert('Pista: Esta vista sólo muestra los nombres que aún pueden recibir. Sigue manteniendo el secreto 😉');
  });

  // Next after reveal
  nextBtn.addEventListener('click', () => {
    turnIndex++;
    if(turnIndex >= order.length) {
      // finished
      switchScreen('endScreen');
    } else {
      // Back to turn screen for next player
      showTurnScreen();
      switchScreen('turnScreen');
    }
  });

  // Show pairs (final summary)
  showPairsBtn.addEventListener('click', () => {
    pairsContainer.classList.remove('hidden');
    pairsList.innerHTML = '';
    // Show in the original players order for readability
    players.forEach(p => {
      const li = document.createElement('li');
      const rec = assignments[p] || assignments[order.find(o => o===p)] || assignments[p] // safety
      li.textContent = `${p} → ${assignments[p] ? assignments[p] : '—'}`;
      pairsList.appendChild(li);
    });
  });

  playAgainBtn.addEventListener('click', () => {
    // reset but keep names so they can reshuffle quickly
    assignments = {};
    order = [];
    turnIndex = 0;
    switchScreen('setup');
  });

  // Allow clicking space to add names quickly and small UX
  document.addEventListener('click', (e) => {
    // prevents accidental double-activations on mobile for the add button
  });

  // initial render
  renderPlayers();
  updateStartBtn();
})();
