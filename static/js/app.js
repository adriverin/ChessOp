const audioBase = "https://cdn.jsdelivr.net/gh/lichess-org/lila@master/public/sound/standard/";
const sounds = {
    move: new Audio(audioBase + 'Move.mp3'),
    capture: new Audio(audioBase + 'Capture.mp3'),
    notify: new Audio(audioBase + 'GenericNotify.mp3'),
    finish: new Audio(audioBase + 'Victory.mp3')
};

function playSound(type) {
    const s = sounds[type].cloneNode();
    if(type==='move') s.volume=0.5;
    s.play().catch(()=>{});
}
document.body.addEventListener('click', ()=>{
    const s=new Audio(audioBase+'Move.mp3'); s.volume=0; s.play().catch(()=>{});
}, {once:true});

// ==========================================
// 2. STATE VARIABLES
// ==========================================
let game = new Chess();
let board = null;
let currentLine = [];
let moveIndex = 0;
let isPlayerTurn = true;
let selectedSquare = null;
let playerColor = 'w';
let currentVariationId = null;
let isRecallMode = false;
const startPieces = { p:8, n:2, b:2, r:2, q:1, k:1 };

async function fetchOpenings() {
    try {
        const res = await fetch('/api/openings/');
        const data = await res.json();
        window.database = data;
        renderMainMenu();
    } catch (err) {
        console.error("Error fetching openings", err);
    }
}

function renderMainMenu() {
    const container = document.getElementById('opening-list-container');
    container.innerHTML = '';
    
    if (!window.database) return;

    for (const [category, openings] of Object.entries(window.database)) {
        // Wrapper Block
        const block = document.createElement('div');
        block.className = 'category-block';

        // Header
        const header = document.createElement('div');
        header.className = 'category-header';
        header.innerText = category;
        block.appendChild(header);

        // Grid
        const grid = document.createElement('div');
        grid.className = 'opening-list';

        openings.forEach(op => {
            const card = document.createElement('div');
            card.className = 'opening-card';
            
            // Generate Tags HTML
            const tagsHtml = op.tags.map(t => `<span class="tag">${t}</span>`).join('');
            const lineText = op.variations.length === 1 ? 'Line' : 'Lines';

            card.innerHTML = `
                <div class="card-info">
                    <h3>${op.name}</h3>
                    <div class="card-tags">${tagsHtml}</div>
                </div>
                <div class="line-count ${op.variations.length>0?'has-lines':''}">${op.variations.length} ${lineText}</div>
            `;
            card.onclick = () => selectOpening(op);
            grid.appendChild(card);
        });

        block.appendChild(grid);
        container.appendChild(block);
    }
}

function selectOpening(op) {
    const container = document.getElementById('variation-list-container');
    container.innerHTML = '';
    document.getElementById('selected-opening-title').innerText = op.name;
    const pColor = op.tags.includes('Black') ? 'b' : 'w';
    
    if(op.variations.length===0) container.innerHTML='<p style="text-align:center; color:#666; width:100%;">Coming Soon</p>';
    else op.variations.forEach(v => {
        const div = document.createElement('div');
        div.className='opening-card'; 
        div.style.justifyContent='center';
        
        if (v.locked) {
            div.classList.add('locked');
            div.style.opacity = '0.6';
            div.innerHTML = `<h3>${v.name} <i class="fas fa-lock"></i></h3>`;
            div.onclick = () => alert("This variation is locked for free users. Upgrade to Premium!");
        } else {
            div.innerHTML=`<h3>${v.name}</h3>`;
            div.onclick = () => startTraining(v, pColor, op.name);
        }
        container.appendChild(div);
    });
    switchScreen('variation-menu');
}

function startTraining(variation, color, opName) {
    currentLine = variation.moves;
    playerColor = color;
    currentVariationId = variation.id;
    isRecallMode = false;
    document.getElementById('active-variation-title').innerText = `${opName}: ${variation.name}`;
    switchScreen('game-screen');
    setTimeout(() => { initGame(); board.resize(); }, 100);
}

async function completeTraining(id) {
    if (!id) return;
    try {
        const res = await fetch(`/api/complete/${id}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': CSRF_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        const data = await res.json();
        if (data.success) {
            console.log(data.message);
            addLogEntry({desc: data.message}, true);
        }
    } catch (err) {
        console.error("Error saving progress", err);
    }
}


function initGame() {
    game.reset();
    moveIndex = 0;
    selectedSquare = null;
    isPlayerTurn = (playerColor === 'w');
    
    document.getElementById('move-log').innerHTML = '<div class="log-entry" style="text-align:center; color:#666;">Game Start.</div>';
    updateCaptures();
    clearHighlights();
    $('#board').off('click');

    let config = {
        draggable: true,
        position: 'start',
        orientation: (playerColor === 'w') ? 'white' : 'black',
        onDragStart: onDragStart,
        onDrop: onDrop,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
    };
    if(board) board.destroy();
    board = Chessboard('board', config);
    $('#board').on('click', '.square-55d63', handleSquareClick);
    
    if (playerColor === 'b') setTimeout(makeOpponentMove, 800);
}

function handleSquareClick(evt) {
    if (!isPlayerTurn || game.game_over()) return;
    const classes = evt.currentTarget.className.split(' ');
    const square = classes.find(c => c.startsWith('square-')).replace('square-', '');
    const piece = game.get(square);
    const isOwn = piece && piece.color === game.turn();

    if (selectedSquare) {
        if (attemptMove(selectedSquare, square) === 'success') {
            selectedSquare = null; 
            clearHighlights();
            return;
        }
        if(isOwn) selectSquare(square);
        else { selectedSquare=null; clearHighlights(); }
    } else {
        if (isOwn) selectSquare(square);
    }
}

function selectSquare(sq) {
    selectedSquare = sq;
    clearHighlights();
    $(`.square-${sq}`).addClass('highlight-selected');
    game.moves({square:sq, verbose:true}).forEach(m => $(`.square-${m.to}`).addClass('highlight-dest'));
}

function onDragStart(source, piece) {
    if (game.game_over() || !isPlayerTurn) return false;
    if ((playerColor==='w' && piece.search(/^b/)!==-1) || (playerColor==='b' && piece.search(/^w/)!==-1)) return false;
    clearHighlights(); selectedSquare = null;
}

function onDrop(source, target) {
    if (attemptMove(source, target) === 'snapback') return 'snapback';
}

function attemptMove(source, target) {
    if (moveIndex >= currentLine.length) return 'snapback';
    const moveObj = { from: source, to: target, promotion: 'q' };
    const possibleMove = game.move(moveObj);
    
    if (possibleMove === null) return 'snapback';
    
    const expected = currentLine[moveIndex];
    if (possibleMove.san === expected.san) {
        board.position(game.fen());
        possibleMove.flags.includes('c') ? playSound('capture') : playSound('move');
        
        highlightMove(source, target);
        addLogEntry(expected, true);
        updateCaptures();
        clearHighlights(); 
        moveIndex++;
        
        if (moveIndex >= currentLine.length) {
            playSound('finish');
            addLogEntry({desc:"Training Complete!"}, true);
            if (!isRecallMode) completeTraining(currentVariationId);
        } else {
            // In recall mode, if we just played the correct move, maybe continue or stop?
            // "Recall Mode... asks the user for the next move."
            // Usually just one move? Or finish the line?
            // Let's assume finish the line.
            
            const nextIsWhite = (moveIndex % 2 === 0);
            if ((playerColor==='w' && !nextIsWhite) || (playerColor==='b' && nextIsWhite)) {
                isPlayerTurn = false;
                setTimeout(makeOpponentMove, 600);
            } else {
                isPlayerTurn = true;
            }
        }
        return 'success';
    } else {
        game.undo();
        playSound('notify');
        return 'snapback';
    }
}

function makeOpponentMove() {
    if (moveIndex >= currentLine.length) return;
    const step = currentLine[moveIndex];
    game.move(step.san);
    board.position(game.fen());
    step.san.includes('x') ? playSound('capture') : playSound('move');
    
    const history = game.history({verbose:true});
    const last = history[history.length-1];
    highlightMove(last.from, last.to);
    clearHighlights();
    addLogEntry(step, true);
    updateCaptures();
    moveIndex++;
    isPlayerTurn = true;
    
    // In Recall Mode, if it's now player's turn, we let them play.
}

function startRecall() {
    if (!currentLine || currentLine.length === 0) return;
    
    isRecallMode = true;
    game.reset();
    board.position('start');
    document.getElementById('move-log').innerHTML = '<div class="log-entry" style="text-align:center; color:#666;">Recall Mode Started</div>';
    
    // Find candidate moves where it is player's turn
    let candidates = [];
    for(let i=0; i<currentLine.length; i++) {
        const isWhiteMove = (i % 2 === 0);
        if ((playerColor === 'w' && isWhiteMove) || (playerColor === 'b' && !isWhiteMove)) {
            // Don't pick the very first move if we want some context, but 0 is valid.
            // Maybe prefer i > 0
            if (i > 0) candidates.push(i);
            else candidates.push(i); 
        }
    }
    
    // If we want to test "Recall", picking 0 means "What is the first move?". Valid.
    
    if (candidates.length === 0) {
        alert("Variation too short for recall mode.");
        isRecallMode = false;
        return;
    }
    
    const targetIndex = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Play moves up to targetIndex
    for(let i=0; i<targetIndex; i++) {
        const step = currentLine[i];
        game.move(step.san);
        addLogEntry(step, true);
    }
    board.position(game.fen());
    moveIndex = targetIndex;
    updateCaptures();
    clearHighlights();
    
    addLogEntry({desc: "Recall: What is the next move?"}, true);
    isPlayerTurn = true;
}

function addLogEntry(step, isCorrect) {
    const log = document.getElementById('move-log');
    const div = document.createElement('div');
    div.className = `log-entry ${isCorrect ? 'correct' : 'wrong'}`;
    const num = Math.floor(moveIndex/2) + 1;
    const dot = (moveIndex%2===0) ? '.' : '...';
    if(!step.san) div.innerHTML = step.desc; 
    else div.innerHTML = `<span style="font-weight:bold; color:#888;">${num}${dot} ${step.san}</span> <span class="log-desc">${step.desc||''}</span>`;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}

function updateCaptures() {
    const counts = { w: {...startPieces}, b: {...startPieces} };
    game.board().forEach(row => row.forEach(p => { if (p) counts[p.color][p.type]--; }));
    
    const getLost = (color) => {
        let lost = [];
        Object.keys(counts[color]).forEach(t => { for(let i=0; i<counts[color][t]; i++) lost.push(color+t.toUpperCase()); });
        return lost;
    };
    
    const topColor = playerColor==='w' ? 'w' : 'b'; // Opponent
    const botColor = playerColor==='w' ? 'b' : 'w'; // Player
    
    renderCaptureBar('captures-top', getLost(topColor));
    renderCaptureBar('captures-bottom', getLost(botColor));
}

function renderCaptureBar(id, pieces) {
    const el = document.getElementById(id); el.innerHTML = '';
    pieces.forEach(p => {
        const img=document.createElement('img'); img.src=`https://chessboardjs.com/img/chesspieces/wikipedia/${p}.png`;
        img.className='captured-piece'; el.appendChild(img);
    });
}

function highlightMove(source, target) {
    $('.square-55d63').removeClass('highlight-move');
    $(`.square-${source}`).addClass('highlight-move'); $(`.square-${target}`).addClass('highlight-move');
}
function clearHighlights() { $('.square-55d63').removeClass('highlight-hint-src highlight-hint-dest highlight-selected highlight-dest'); }
function switchScreen(id) { $('.screen').removeClass('active-screen'); $(`#${id}`).addClass('active-screen'); }
function showMainMenu() { switchScreen('main-menu'); }
function showVariationMenu() { switchScreen('variation-menu'); }

document.getElementById('reset-btn').addEventListener('click', initGame);
document.getElementById('recall-btn').addEventListener('click', startRecall);
document.getElementById('prev-btn').addEventListener('click', () => { if(moveIndex>0) { game.undo(); moveIndex--; board.position(game.fen()); updateCaptures(); }});
document.getElementById('next-btn').addEventListener('click', () => { if(moveIndex<currentLine.length) { const s=currentLine[moveIndex]; game.move(s.san); board.position(game.fen()); addLogEntry(s,true); moveIndex++; updateCaptures(); clearHighlights(); }});
document.getElementById('hint-btn').addEventListener('click', () => {
    if(moveIndex<currentLine.length) {
        const m = game.moves({verbose:true}).find(x=>x.san===currentLine[moveIndex].san);
        if(m) { clearHighlights(); $(`.square-${m.from}`).addClass('highlight-hint-src'); $(`.square-${m.to}`).addClass('highlight-hint-dest'); }
    }
});

fetchOpenings();
window.addEventListener('resize', ()=> board && board.resize());

