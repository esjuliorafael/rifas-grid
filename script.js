/* --- APP STATE --- */
let allRaffles = []; 
let currentRaffleIndex = null;
let currentRaffle = null;
let selectedIndices = new Set();

/* --- INITIALIZATION --- */
document.addEventListener('DOMContentLoaded', loadFromServer);

/* --- NAVIGATION --- */
function showView(viewName) {
    ['home', 'create', 'manage'].forEach(v => document.getElementById('view-'+v).classList.add('hidden'));
    document.getElementById('view-' + viewName).classList.remove('hidden');
    
    // Al volver al home, refrescar la lista
    if(viewName === 'home') renderHomeList();
}

/* --- BACKEND --- */
async function saveToServer() {
    // Sincronizar rifa actual con la lista antes de guardar
    if(currentRaffleIndex !== null && currentRaffle) {
        allRaffles[currentRaffleIndex] = currentRaffle;
    }

    try { 
        await fetch('backend.php', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(allRaffles) 
        }); 
    } catch(e) { console.error("Error guardando:", e); }
}

async function loadFromServer() {
    try {
        const res = await fetch('backend.php');
        let data = await res.json();
        
        // Migración: si es un objeto único viejo, convertirlo a array
        if(data && !Array.isArray(data) && data.tickets) {
            data = [data];
        }
        
        if(!data) data = [];

        allRaffles = data;
        renderHomeList();

    } catch(e) { 
        console.log("Error de carga:", e);
        allRaffles = [];
    }
}

/* --- HOME: LISTA DE RIFAS --- */
function renderHomeList() {
    const listDiv = document.getElementById('raffles-list');
    const container = document.getElementById('existing-raffles-container');
    listDiv.innerHTML = '';

    if(allRaffles.length > 0) {
        container.classList.remove('hidden');
        
        allRaffles.forEach((raffle, index) => {
            const total = raffle.tickets.length;
            const taken = raffle.tickets.filter(t => t.status !== 'available').length;
            const progress = Math.round((taken / total) * 100);

            const card = document.createElement('div');
            card.className = 'raffle-summary-card';
            card.innerHTML = `
                <div onclick="selectRaffle(${index})">
                    <h4 class="raffle-summary-title">${raffle.title}</h4>
                    <p class="raffle-summary-info">${total} boletos - $${raffle.cost} c/u</p>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <p class="progress-text">${progress}% Ocupado</p>
                </div>
                <button onclick="deleteRaffle(${index})" class="btn-delete-mini" title="Borrar Rifa">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
            listDiv.appendChild(card);
        });
    } else {
        container.classList.add('hidden');
    }
}

function selectRaffle(index) {
    currentRaffleIndex = index;
    currentRaffle = allRaffles[index];
    selectedIndices.clear();
    
    renderGrid();
    updateStats();
    showView('manage');
}

function deleteRaffle(index) {
    if(!confirm("¿Borrar esta rifa? No hay vuelta atrás.")) return;
    allRaffles.splice(index, 1);
    if(currentRaffleIndex === index) { currentRaffleIndex = null; currentRaffle = null; }
    saveToServer();
    renderHomeList();
}

/* --- CREAR RIFA --- */
function handleCreateRaffle(e) {
    e.preventDefault();
    const title = document.getElementById('r-title').value;
    const prizes = document.getElementById('r-prizes').value;
    const cost = parseInt(document.getElementById('r-cost').value);
    const quantity = parseInt(document.getElementById('r-quantity').value);
    const mode = document.querySelector('input[name="r-mode"]:checked').value;

    let extras = [];
    let startExtra = quantity + 1;
    for(let i = startExtra; i <= 99; i++) extras.push(i.toString().padStart(2, '0'));
    if(quantity !== 33) extras.push("00");

    if(mode === 'random') extras.sort(() => Math.random() - 0.5);

    let tickets = [];
    const chances = (quantity === 25) ? 3 : (quantity === 33) ? 2 : 1;

    for(let i = 1; i <= quantity; i++) {
        let tNum = i.toString().padStart(2, '0');
        let myExtras = [];
        for(let c = 0; c < chances; c++) if(extras.length) myExtras.push(extras.shift());
        if(mode === 'random') myExtras.sort();
        tickets.push({ number: tNum, extras: myExtras, status: 'available', client: '', phone: '' });
    }

    const newRaffle = { title, prizes, cost, tickets };
    allRaffles.push(newRaffle);
    selectRaffle(allRaffles.length - 1);
    saveToServer();
    e.target.reset();
}

/* --- EDITAR RIFA (NUEVO) --- */
function openEditModal() {
    document.getElementById('edit-title').value = currentRaffle.title;
    document.getElementById('edit-prizes').value = currentRaffle.prizes;
    document.getElementById('edit-cost').value = currentRaffle.cost;
    document.getElementById('modal-edit').classList.remove('hidden');
}

function saveEditRaffle() {
    const newTitle = document.getElementById('edit-title').value;
    const newPrizes = document.getElementById('edit-prizes').value;
    const newCost = parseInt(document.getElementById('edit-cost').value);

    if(!newTitle || !newCost) return alert("Título y Costo requeridos");

    currentRaffle.title = newTitle;
    currentRaffle.prizes = newPrizes;
    currentRaffle.cost = newCost;

    saveToServer();
    renderGrid();
    updateStats();
    closeModal('modal-edit');
}

/* --- RENDER GRID --- */
function renderGrid() {
    document.getElementById('m-title').innerText = currentRaffle.title;
    
    // Mostrar premios si el elemento existe (agregado en nueva estructura)
    const prizeEl = document.getElementById('m-prizes');
    if(prizeEl) prizeEl.innerText = currentRaffle.prizes;

    document.getElementById('m-cost-display').innerText = '$' + currentRaffle.cost;
    
    const container = document.getElementById('tickets-container');
    container.innerHTML = '';

    currentRaffle.tickets.forEach((t, index) => {
        const isSelected = selectedIndices.has(index);
        const card = document.createElement('div');
        
        let classes = 'ticket-card';
        if (t.status === 'reserved') classes += ' status-reserved';
        if (t.status === 'paid') classes += ' status-paid';
        if (isSelected) classes += ' selected';
        
        card.className = classes;
        card.onclick = () => toggleSelection(index);

        let icon = isSelected ? 'check_circle' : 'radio_button_unchecked';
        if (!isSelected && t.status === 'paid') icon = 'verified';
        if (!isSelected && t.status === 'reserved') icon = 'person';

        // Traducción
        let statusLabel = ''; 
        if (t.status === 'available') statusLabel = 'Disponible';
        if (t.status === 'reserved') statusLabel = 'Apartado';
        if (t.status === 'paid') statusLabel = 'Pagado';

        card.innerHTML = `
            <div class="flex" style="justify-content: space-between;">
                <span class="ticket-number">${t.number}</span>
                <span class="material-symbols-outlined" style="font-size: 28px; color: ${isSelected ? '#2563eb' : '#ccc'}">${icon}</span>
            </div>
            ${t.client ? `<div class="ticket-client">${t.client}</div>` : `<div class="ticket-status-text">${statusLabel}</div>`}
            <div style="margin-top: auto; border-top: 1px solid #eee; padding-top: 5px;">
                <small style="color: #999; font-size: 0.8rem;">OPORTUNIDADES</small><br>
                <strong style="color: #555;">${t.extras.join(', ')}</strong>
            </div>
        `;
        container.appendChild(card);
    });
    updateActionBar();
}

/* --- SELECCIÓN Y ACCIONES --- */
function toggleSelection(index) {
    if(selectedIndices.has(index)) selectedIndices.delete(index);
    else selectedIndices.add(index);
    renderGrid();
}
function clearSelection() { selectedIndices.clear(); renderGrid(); }

function updateActionBar() {
    const bar = document.getElementById('action-bar');
    if(selectedIndices.size > 0) {
        bar.classList.remove('hidden'); bar.classList.add('flex');
        document.getElementById('selected-count').innerText = selectedIndices.size;
    } else {
        bar.classList.add('hidden'); bar.classList.remove('flex');
    }
}

function openReserveModal() {
    if (selectedIndices.size === 0) return alert("Selecciona boletos");
    const nums = Array.from(selectedIndices).map(i => currentRaffle.tickets[i].number).join(', ');
    document.getElementById('modal-ticket-ids').innerText = nums;
    document.getElementById('input-name').value = '';
    document.getElementById('input-phone').value = '';
    document.getElementById('modal-reserve').classList.remove('hidden');
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function confirmReserve() {
    const name = document.getElementById('input-name').value;
    const phone = document.getElementById('input-phone').value;
    if(!name) return alert("Nombre obligatorio");
    
    let reservedData = { numbers: [], extras: [], total: 0, client: name };

    selectedIndices.forEach(index => {
        currentRaffle.tickets[index].status = 'reserved';
        currentRaffle.tickets[index].client = name;
        currentRaffle.tickets[index].phone = phone;
        reservedData.numbers.push(currentRaffle.tickets[index].number);
        reservedData.extras.push(...currentRaffle.tickets[index].extras);
        reservedData.total += currentRaffle.cost;
    });

    closeModal('modal-reserve');
    clearSelection();
    updateStats();
    renderGrid();
    saveToServer();

    drawTicket({ numbers: reservedData.numbers.join(', '), client: name, extras: reservedData.extras.join(' - '), total: reservedData.total });
    document.getElementById('modal-ticket').classList.remove('hidden');
}

function bulkUpdateStatus(status) {
    if(!confirm('¿Confirmar cambio de estado?')) return;
    selectedIndices.forEach(index => {
        currentRaffle.tickets[index].status = status;
        if(status === 'available') { currentRaffle.tickets[index].client = ''; currentRaffle.tickets[index].phone = ''; }
    });
    clearSelection();
    updateStats();
    renderGrid();
    saveToServer();
}

function updateStats() {
    const counts = { available: 0, reserved: 0, paid: 0 };
    currentRaffle.tickets.forEach(t => counts[t.status]++);
    document.getElementById('stat-avail').innerText = counts.available;
    document.getElementById('stat-reserved').innerText = counts.reserved;
    document.getElementById('stat-paid').innerText = counts.paid;
}

/* --- CANVAS --- */
function drawTicket(data) {
    const canvas = document.getElementById('ticket-canvas');
    const ctx = canvas.getContext('2d');
    
    // 1. Configuración de Alta Resolución
    canvas.width = 500; 
    canvas.height = 850;
    
    // Colores basados en tu imagen de referencia
    const colorFondo = "#e5e5e5";    // Gris claro de fondo
    const colorRojo = "#991b1b";     // Rojo oscuro (tipo Marizcal)
    const colorBlanco = "#ffffff";
    const colorTextoOscuro = "#1f2937";
    const colorTextoGris = "#6b7280";

    // 2. Fondo General
    ctx.fillStyle = colorFondo;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- ENCABEZADO SUPERIOR ---
    ctx.fillStyle = colorRojo; 
    ctx.font = "bold 30px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    // Usamos el nombre de la marca (puedes cambiar "RIFAS MARIZCAL" por lo que gustes)
    ctx.fillText("RIFAS MARIZCAL", canvas.width / 2, 60);

    // --- TARJETA ROJA (ESTADO Y MONTO) ---
    // Dibujamos el rectángulo rojo redondeado superior
    drawRoundedRect(ctx, 40, 90, 420, 220, 30);
    ctx.fillStyle = colorRojo;
    ctx.fill();

    // Icono de Check (Círculo blanco transparente + palomita)
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 150, 25, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.2)"; // Círculo semitransparente
    ctx.fill();
    // Dibujo simple de palomita
    ctx.beginPath();
    ctx.moveTo(238, 150); ctx.lineTo(248, 160); ctx.lineTo(265, 138);
    ctx.strokeStyle = "white"; ctx.lineWidth = 4; ctx.stroke();

    // Texto de Estado
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    // Detectamos si es apartado o pagado para cambiar el texto
    let statusText = "BOLETO APARTADO"; 
    // Si todos los boletos seleccionados están pagados, cambiamos el texto
    // (Esta lógica es visual, asume que 'data' viene del flujo de apartado, pero se ve bien)
    ctx.fillText(statusText, canvas.width / 2, 200);

    // Etiqueta MONTO
    ctx.font = "14px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText("MONTO", canvas.width / 2, 235);

    // Cantidad ($)
    ctx.font = "bold 60px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(`$${data.total}.00`, canvas.width / 2, 290);

    // --- TARJETA BLANCA (DETALLES) ---
    // Dibujamos el rectángulo blanco inferior
    drawRoundedRect(ctx, 40, 330, 420, 450, 30);
    ctx.fillStyle = colorBlanco;
    ctx.fill();

    // --- EFECTO DE RECORTE (LOS CÍRCULOS A LOS LADOS) ---
    // Esto crea el efecto de "ticket cortado" que se ve en la imagen
    const cutY = 650; // Altura donde va el corte
    ctx.globalCompositeOperation = 'destination-out'; // Modo "Borrador"
    
    // Círculo izquierdo
    ctx.beginPath();
    ctx.arc(40, cutY, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Círculo derecho
    ctx.beginPath();
    ctx.arc(460, cutY, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'source-over'; // Volver a modo normal

    // Línea punteada entre los cortes
    ctx.beginPath();
    ctx.setLineDash([10, 10]);
    ctx.moveTo(60, cutY);
    ctx.lineTo(440, cutY);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]); // Resetear

    // --- CONTENIDO DE LA TARJETA BLANCA ---
    ctx.textAlign = "left";
    let leftMargin = 80;

    // 1. Título de la Rifa
    ctx.fillStyle = "#9ca3af"; // Gris claro etiquetas
    ctx.font = "bold 12px Arial";
    ctx.fillText("RIFA NO. / TÍTULO", leftMargin, 380);

    ctx.fillStyle = colorTextoOscuro; // Texto oscuro
    ctx.font = "bold 20px Arial";
    // Ajuste de texto largo (simple)
    let titleText = currentRaffle.title.substring(0, 28); 
    if(currentRaffle.title.length > 28) titleText += "...";
    ctx.fillText(titleText.toUpperCase(), leftMargin, 410);
    ctx.font = "16px Arial";
    ctx.fillStyle = colorTextoOscuro;
    ctx.fillText(`BOLETO $${currentRaffle.cost} PESOS`, leftMargin, 435);

    // Línea separadora suave
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(leftMargin, 455, 340, 2);

    // 2. Participante
    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 12px Arial";
    ctx.fillText("PARTICIPANTE", leftMargin, 490);

    ctx.fillStyle = colorTextoOscuro;
    ctx.font = "bold 24px Arial";
    ctx.fillText(data.client.toUpperCase(), leftMargin, 525);

    // Línea separadora suave
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(leftMargin, 545, 340, 2);

    // 3. Boletos (Números Grandes)
    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 12px Arial";
    ctx.fillText("BOLETOS", leftMargin, 580);

    ctx.fillStyle = colorTextoOscuro;
    ctx.font = "bold 36px Arial";
    ctx.fillText(data.numbers, leftMargin, 625);

    // 4. Oportunidades (Debajo de la línea punteada)
    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 12px Arial";
    ctx.fillText("OPORTUNIDADES", leftMargin, 690);

    ctx.fillStyle = "#4b5563"; // Gris medio
    ctx.font = "20px monospace";
    // Dividir oportunidades si son muchas
    let ops = data.extras;
    if (ops.length > 25) ops = ops.substring(0, 25) + "...";
    ctx.fillText(ops, leftMargin, 720);

    // --- PIE DE PÁGINA ---
    ctx.textAlign = "center";
    ctx.fillStyle = "#9ca3af";
    ctx.font = "bold 14px Arial";
    ctx.fillText("GRACIAS POR SU APOYO", canvas.width / 2, 810);
}

// Función auxiliar para dibujar rectángulos redondeados perfectos
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

function downloadCanvas() {
    const link = document.createElement('a');
    link.download = `Ticket-Rifa.png`;
    link.href = document.getElementById('ticket-canvas').toDataURL();
    link.click();
}

function exportReportImage() {
    html2canvas(document.getElementById('tickets-container')).then(canvas => {
        const link = document.createElement('a');
        link.download = `Lista-${currentRaffle.title}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}