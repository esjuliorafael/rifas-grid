/* -------------------------------------------------------------------------- */
/* ESTADO DE LA APLICACIÓN                               */
/* -------------------------------------------------------------------------- */
let allRaffles = []; 
let currentRaffleIndex = null;
let currentRaffle = null;
let selectedIndices = new Set();
let currentGeneratedImage = null; 
let currentTicketFilename = "ticket.png"; 

/* -------------------------------------------------------------------------- */
/* INICIALIZACIÓN                               */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    loadFromServer();
    setupColorSync();
});

/* -------------------------------------------------------------------------- */
/* UTILIDAD: SINCRONIZACIÓN DE COLORES */
/* -------------------------------------------------------------------------- */
function setupColorSync() {
    syncInputs('r-color', 'r-color-picker');
    syncInputs('edit-color', 'edit-color-picker');
}

function syncInputs(textId, pickerId) {
    const textInput = document.getElementById(textId);
    const pickerInput = document.getElementById(pickerId);
    if (!textInput || !pickerInput) return;

    textInput.addEventListener('input', () => {
        const val = textInput.value;
        if (/^#[0-9A-F]{6}$/i.test(val)) pickerInput.value = val;
    });
    pickerInput.addEventListener('input', () => {
        textInput.value = pickerInput.value;
    });
}

function applyTheme(colorHex, logoFileName) {
    const root = document.documentElement;
    const mainColor = colorHex || '#2563eb';
    root.style.setProperty('--primary-color', mainColor);
    root.style.setProperty('--primary-light', hexToRgba(mainColor, 0.15));

    const logoImg = document.querySelector('.custom-logo');
    if (logoImg) {
        logoImg.src = logoFileName || 'Navajas Marizcal.png';
        logoImg.onerror = () => { 
            if(logoImg.src.indexOf('Navajas Marizcal.png') === -1) {
                logoImg.src = 'Navajas Marizcal.png'; 
            }
        }; 
    }
}

function hexToRgba(hex, alpha) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3) c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return '#eff6ff';
}

/* -------------------------------------------------------------------------- */
/* NAVEGACIÓN                                  */
/* -------------------------------------------------------------------------- */
function showView(viewName) {
    ['home', 'create', 'manage', 'orders'].forEach(v => {
        const el = document.getElementById('view-' + v);
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById('view-' + viewName);
    if(target) target.classList.remove('hidden');
    
    if (viewName === 'home') {
        renderHomeList();
        applyTheme('#2563eb', 'Navajas Marizcal.png');
    }
}

/* -------------------------------------------------------------------------- */
/* BACKEND                                         */
/* -------------------------------------------------------------------------- */
async function saveToServer() {
    if (currentRaffleIndex !== null && currentRaffle) {
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
        if (data && !Array.isArray(data) && data.tickets) data = [data];
        if (!data) data = [];
        allRaffles = data;
        renderHomeList();
    } catch(e) { 
        console.log("Error de carga:", e);
        allRaffles = [];
    }
}

/* -------------------------------------------------------------------------- */
/* RENDER HOME                                     */
/* -------------------------------------------------------------------------- */
function renderHomeList() {
    const listDiv = document.getElementById('raffles-list');
    const container = document.getElementById('existing-raffles-container');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    if (allRaffles.length > 0) {
        if(container) container.classList.remove('hidden');
        
        allRaffles.forEach((raffle, index) => {
            const total = raffle.tickets.length;
            const taken = raffle.tickets.filter(t => t.status !== 'available').length;
            const progress = Math.round((taken / total) * 100);
            const rColor = raffle.themeColor || '#2563eb';

            const card = document.createElement('div');
            card.className = 'raffle-summary-card';
            card.style.borderLeft = `5px solid ${rColor}`; 

            card.innerHTML = `
                <div onclick="selectRaffle(${index})">
                    <h4 class="raffle-summary-title">${raffle.title}</h4>
                    <p class="raffle-summary-info">${total} boletos - $${raffle.cost} c/u</p>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progress}%; background-color: ${rColor};"></div>
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
        if(container) container.classList.add('hidden');
    }
}

function selectRaffle(index) {
    currentRaffleIndex = index;
    currentRaffle = allRaffles[index];
    selectedIndices.clear();
    applyTheme(currentRaffle.themeColor, currentRaffle.customLogo);
    renderGrid();
    updateStats();
    showView('manage');
}

function deleteRaffle(index) {
    if (!confirm("¿Borrar esta rifa? No hay vuelta atrás.")) return;
    allRaffles.splice(index, 1);
    if (currentRaffleIndex === index) { currentRaffleIndex = null; currentRaffle = null; }
    saveToServer();
    renderHomeList();
}

/* -------------------------------------------------------------------------- */
/* CREAR / EDITAR (LÓGICA MATEMÁTICA CORREGIDA)    */
/* -------------------------------------------------------------------------- */
function handleCreateRaffle(e) {
    e.preventDefault();
    const title = document.getElementById('r-title').value;
    const prizes = document.getElementById('r-prizes').value;
    const cost = parseInt(document.getElementById('r-cost').value);
    const quantity = parseInt(document.getElementById('r-quantity').value);
    const mode = document.querySelector('input[name="r-mode"]:checked').value;
    const themeColor = document.getElementById('r-color').value;
    const customLogo = document.getElementById('r-logo').value.trim();

    let tickets = [];

    // --- PREPARACIÓN PARA MODO ALEATORIO (BOLSA DE NÚMEROS) ---
    let randomPool = [];
    if (mode === 'random') {
        if (quantity === 33) {
            // Rango 34-99 (Sin 00)
            for (let j = 34; j <= 99; j++) randomPool.push(j.toString().padStart(2, '0'));
        } else if (quantity === 25) {
            // Rango 26-99 + 00
            for (let j = 26; j <= 99; j++) randomPool.push(j.toString().padStart(2, '0'));
            randomPool.push("00");
        } else if (quantity === 50) {
            // Rango 51-99 + 00
            for (let j = 51; j <= 99; j++) randomPool.push(j.toString().padStart(2, '0'));
            randomPool.push("00");
        }
        // Mezclar la bolsa
        randomPool.sort(() => Math.random() - 0.5);
    }

    // --- GENERACIÓN DE BOLETOS ---
    for (let i = 1; i <= quantity; i++) {
        let tNum = i.toString().padStart(2, '0');
        let myExtras = [];

        if (mode === 'linear') {
            // --- LÓGICA LINEAL (MATEMÁTICA) ---
            if (quantity === 33) {
                // Saltos de 33. Ej: 1 -> 34 -> 67
                myExtras.push((i + 33).toString().padStart(2, '0'));
                myExtras.push((i + 66).toString().padStart(2, '0'));
            } 
            else if (quantity === 25) {
                // Saltos de 25. Ej: 1 -> 26 -> 51 -> 76. (100 = 00)
                let e1 = i + 25;
                let e2 = i + 50;
                let e3 = i + 75;
                
                myExtras.push(e1 === 100 ? "00" : e1.toString().padStart(2, '0'));
                myExtras.push(e2 === 100 ? "00" : e2.toString().padStart(2, '0'));
                myExtras.push(e3 === 100 ? "00" : e3.toString().padStart(2, '0'));
            } 
            else if (quantity === 50) {
                // Saltos de 50. Ej: 1 -> 51. (100 = 00)
                let e1 = i + 50;
                myExtras.push(e1 === 100 ? "00" : e1.toString().padStart(2, '0'));
            }
        } else {
            // --- LÓGICA ALEATORIA (SACAR DE LA BOLSA) ---
            const chances = (quantity === 25) ? 3 : (quantity === 33) ? 2 : 1;
            for (let c = 0; c < chances; c++) {
                if (randomPool.length > 0) {
                    myExtras.push(randomPool.shift());
                }
            }
            myExtras.sort(); // Ordenar visualmente (ej. 05, 88)
        }
        
        tickets.push({ 
            number: tNum, 
            extras: myExtras, 
            status: 'available', 
            client: '', 
            phone: '', 
            date: null 
        });
    }

    const newRaffle = { title, prizes, cost, tickets, themeColor, customLogo };
    allRaffles.push(newRaffle);
    selectRaffle(allRaffles.length - 1);
    saveToServer();
    e.target.reset();
    document.getElementById('r-color').value = '#2563eb';
    document.getElementById('r-color-picker').value = '#2563eb';
}

function openEditModal() {
    document.getElementById('edit-title').value = currentRaffle.title;
    document.getElementById('edit-prizes').value = currentRaffle.prizes;
    document.getElementById('edit-cost').value = currentRaffle.cost;
    
    const color = currentRaffle.themeColor || '#2563eb';
    document.getElementById('edit-color').value = color;
    document.getElementById('edit-color-picker').value = color;
    document.getElementById('edit-logo').value = currentRaffle.customLogo || '';
    
    document.getElementById('modal-edit').classList.remove('hidden');
}

function saveEditRaffle() {
    const newTitle = document.getElementById('edit-title').value;
    const newPrizes = document.getElementById('edit-prizes').value;
    const newCost = parseInt(document.getElementById('edit-cost').value);
    const newColor = document.getElementById('edit-color').value;
    const newLogo = document.getElementById('edit-logo').value.trim();

    if (!newTitle || !newCost) return alert("Título y Costo requeridos");

    currentRaffle.title = newTitle;
    currentRaffle.prizes = newPrizes;
    currentRaffle.cost = newCost;
    currentRaffle.themeColor = newColor;
    currentRaffle.customLogo = newLogo;

    applyTheme(newColor, newLogo);
    saveToServer();
    renderGrid();
    updateStats();
    closeModal('modal-edit');
}

/* -------------------------------------------------------------------------- */
/* RENDER GRID                                     */
/* -------------------------------------------------------------------------- */
function renderGrid() {
    safeSetText('m-title', currentRaffle.title);
    safeSetText('m-prizes', currentRaffle.prizes);
    safeSetText('m-cost-display', '$' + currentRaffle.cost);
    
    const container = document.getElementById('tickets-container');
    if(!container) return;
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
        let statusLabel = t.status === 'available' ? 'Disponible' : (t.status === 'reserved' ? 'Apartado' : 'Pagado');
        const iconStyle = isSelected ? `color: var(--primary-color);` : (t.status === 'available' ? 'color: #d7d7d7' : '');

        card.innerHTML = `
            <div class="flex" style="justify-content: space-between;">
                <span class="ticket-number">${t.number}</span>
                <span class="material-symbols-outlined" style="font-size: 28px; ${iconStyle}">${icon}</span>
            </div>
            ${t.client ? `<div class="ticket-client">${t.client}</div>` : `<div class="ticket-status-text">${statusLabel}</div>`}
            <div style="margin-top: auto; border-top: 1px solid #eee; padding-top: 5px;">
                <small style="color: #9a9a9a; font-size: 0.8rem;">OPORTUNIDADES</small><br>
                <strong style="color: #555;">${t.extras.join(', ')}</strong>
            </div>
        `;
        container.appendChild(card);
    });
    updateActionBar();
}

/* -------------------------------------------------------------------------- */
/* LÓGICA DE ACTUALIZACIÓN Y MODALES DE ACCIÓN       */
/* -------------------------------------------------------------------------- */
let pendingBulkStatus = null;
let pendingRelatedIndices = [];
let tempPaymentData = null;

function findRelatedTickets() {
    const owners = new Set();
    const phones = new Set();
    selectedIndices.forEach(index => {
        const t = currentRaffle.tickets[index];
        if (t.client) owners.add(t.client.trim().toLowerCase());
        if (t.phone) phones.add(t.phone.trim());
    });
    const newMatches = [];
    currentRaffle.tickets.forEach((t, index) => {
        if (selectedIndices.has(index)) return; 
        const nameMatch = t.client && owners.has(t.client.trim().toLowerCase());
        const phoneMatch = t.phone && phones.has(t.phone.trim());
        if (nameMatch || phoneMatch) newMatches.push(index);
    });
    return newMatches;
}

function bulkUpdateStatus(status) {
    if (selectedIndices.size === 0) return alert("Primero selecciona al menos un boleto.");
    const relatedIndices = findRelatedTickets();

    if (relatedIndices.length > 0) {
        pendingBulkStatus = status;
        pendingRelatedIndices = relatedIndices;
        
        const count = relatedIndices.length;
        const pText = document.getElementById('cascade-text');
        if (pText) {
            pText.innerHTML = count === 1 
                ? `El sistema detectó <strong style="color: var(--primary-color); font-size: 1.3rem;">otro boleto</strong> registrado con el mismo Cliente o Teléfono:`
                : `El sistema detectó otros <strong style="color: var(--primary-color); font-size: 1.3rem;">${count} boletos</strong> registrados con el mismo Cliente o Teléfono:`;
        }

        const listDiv = document.getElementById('cascade-tickets-list');
        if (listDiv) {
            listDiv.innerHTML = '';
            relatedIndices.forEach(idx => {
                const chip = document.createElement('span');
                chip.className = 'ticket-chip chip-gray';
                chip.innerText = currentRaffle.tickets[idx].number;
                chip.style.fontSize = '1rem'; 
                listDiv.appendChild(chip);
            });
        }
        document.getElementById('modal-cascade').classList.remove('hidden');
    } else {
        executeBulkUpdate(status);
    }
}

function applyCascade(includeRelated) {
    if (includeRelated && pendingRelatedIndices.length > 0) {
        pendingRelatedIndices.forEach(idx => selectedIndices.add(idx));
        renderGrid(); 
    }
    closeModal('modal-cascade');
    setTimeout(() => {
        if (pendingBulkStatus) {
            executeBulkUpdate(pendingBulkStatus);
            pendingBulkStatus = null;
            pendingRelatedIndices = [];
        }
    }, 100);
}

function executeBulkUpdate(status) {
    const now = new Date().toISOString();

    if (status === 'paid') {
        let ticketData = { numbers: [], extras: [], total: 0, client: '' };
        let uniqueClients = new Set();
        selectedIndices.forEach(index => {
            const t = currentRaffle.tickets[index];
            if (t.client) { ticketData.client = t.client; uniqueClients.add(t.client); }
            ticketData.numbers.push(t.number);
            ticketData.extras.push(...t.extras);
            ticketData.total += currentRaffle.cost;
        });
        if (uniqueClients.size > 1 && !confirm(`OJO: Estás pagando boletos de ${uniqueClients.size} clientes diferentes.\n¿Continuar?`)) return;
        if (!ticketData.client) {
            const promptName = prompt("Ingresa el cliente para el ticket:", "Cliente Mostrador");
            if (promptName) ticketData.client = promptName; else return;
        }
        tempPaymentData = ticketData;
        safeSetText('conf-total', '$' + ticketData.total);
        safeSetText('conf-count', selectedIndices.size);
        safeSetText('conf-client', ticketData.client);
        document.getElementById('modal-confirm-pay').classList.remove('hidden');
        return; 
    }

    const actionName = status === 'available' ? 'LIBERAR' : 'APARTAR';
    if (!confirm(`¿Estás seguro de ${actionName} ${selectedIndices.size} boletos?`)) return;
    
    selectedIndices.forEach(index => {
        currentRaffle.tickets[index].status = status;
        if (status === 'available') { 
            currentRaffle.tickets[index].client = ''; 
            currentRaffle.tickets[index].phone = ''; 
            currentRaffle.tickets[index].date = null; 
        } else if (status === 'reserved') {
            currentRaffle.tickets[index].date = now; 
        }
    });
    finalizeAction();
}

function finishPaymentAction() {
    closeModal('modal-confirm-pay');
    if (!tempPaymentData) return;
    
    const now = new Date().toISOString();
    selectedIndices.forEach(index => {
        currentRaffle.tickets[index].status = 'paid';
        if (!currentRaffle.tickets[index].client) currentRaffle.tickets[index].client = tempPaymentData.client;
        if (!currentRaffle.tickets[index].date) currentRaffle.tickets[index].date = now; 
    });
    finalizeActionAndGenerateTicket(tempPaymentData, 'paid');
    tempPaymentData = null; 
}

function finalizeAction() {
    clearSelection();
    updateStats();
    renderGrid();
    saveToServer();
}

function finalizeActionAndGenerateTicket(data, type) {
    finalizeAction();
    generateTicketImage({
        numbers: data.numbers.join(', '),
        client: data.client,
        extras: data.extras,
        total: data.total
    }, type);
}

function toggleSelection(index) {
    if (selectedIndices.has(index)) selectedIndices.delete(index);
    else selectedIndices.add(index);
    renderGrid();
}

function clearSelection() { selectedIndices.clear(); renderGrid(); }

function updateActionBar() {
    const bar = document.getElementById('action-bar');
    if (!bar) return;
    if (selectedIndices.size > 0) {
        bar.classList.remove('hidden'); bar.classList.add('flex');
        safeSetText('selected-count', selectedIndices.size);
    } else {
        bar.classList.add('hidden'); bar.classList.remove('flex');
    }
}

function openReserveModal() {
    if (selectedIndices.size === 0) return alert("Selecciona boletos");
    const nums = Array.from(selectedIndices).map(i => currentRaffle.tickets[i].number).join(', ');
    safeSetText('modal-ticket-ids', nums);
    document.getElementById('input-name').value = '';
    document.getElementById('input-phone').value = '';
    document.getElementById('modal-reserve').classList.remove('hidden');
}

function closeModal(id) { const el = document.getElementById(id); if(el) el.classList.add('hidden'); }

function confirmReserve() {
    const name = document.getElementById('input-name').value;
    const phone = document.getElementById('input-phone').value;
    if (!name) return alert("Nombre obligatorio");
    
    const now = new Date().toISOString(); 
    let reservedData = { numbers: [], extras: [], total: 0, client: name };
    selectedIndices.forEach(index => {
        currentRaffle.tickets[index].status = 'reserved';
        currentRaffle.tickets[index].client = name;
        currentRaffle.tickets[index].phone = phone;
        currentRaffle.tickets[index].date = now; 
        reservedData.numbers.push(currentRaffle.tickets[index].number);
        reservedData.extras.push(...currentRaffle.tickets[index].extras);
        reservedData.total += currentRaffle.cost;
    });
    closeModal('modal-reserve');
    clearSelection();
    updateStats();
    renderGrid();
    saveToServer();
    generateTicketImage({ numbers: reservedData.numbers.join(', '), client: name, extras: reservedData.extras, total: reservedData.total }, 'pending');
}

function updateStats() {
    const counts = { available: 0, reserved: 0, paid: 0 };
    currentRaffle.tickets.forEach(t => counts[t.status]++);
    safeSetText('stat-avail', counts.available);
    safeSetText('stat-reserved', counts.reserved);
    safeSetText('stat-paid', counts.paid);
}

/* -------------------------------------------------------------------------- */
/* VISTA DE PARTICIPANTES (ÓRDENES)                                           */
/* -------------------------------------------------------------------------- */
function renderOrdersView(filter = 'all') {
    showView('orders'); 
    const tbody = document.getElementById('orders-table-body');
    const noMsg = document.getElementById('no-orders-msg');
    tbody.innerHTML = '';

    const ordersMap = new Map();
    currentRaffle.tickets.forEach(t => {
        if (t.status === 'available') return; 
        const clientKey = (t.client || 'Sin Nombre').trim() + '|' + (t.phone || '');
        if (!ordersMap.has(clientKey)) {
            ordersMap.set(clientKey, {
                name: t.client || 'Sin Nombre',
                phone: t.phone || '',
                tickets: [],
                totalDebt: 0,
                status: 'paid', 
                lastDate: t.date || null
            });
        }
        const order = ordersMap.get(clientKey);
        order.tickets.push(t.number);
        if (t.status === 'reserved') {
            order.status = 'reserved';
            order.totalDebt += currentRaffle.cost;
        } else if (t.status === 'paid') {
            order.totalDebt += currentRaffle.cost; 
        }
        if (t.date && (!order.lastDate || new Date(t.date) > new Date(order.lastDate))) {
            order.lastDate = t.date;
        }
    });

    let orders = Array.from(ordersMap.values());
    orders.sort((a, b) => {
        if (a.status === 'reserved' && b.status === 'paid') return -1;
        if (a.status === 'paid' && b.status === 'reserved') return 1;
        const dateA = a.lastDate ? new Date(a.lastDate) : new Date(0);
        const dateB = b.lastDate ? new Date(b.lastDate) : new Date(0);
        return dateB - dateA;
    });

    if (filter === 'reserved') orders = orders.filter(o => o.status === 'reserved');

    if (orders.length === 0) {
        noMsg.classList.remove('hidden');
        return;
    }
    noMsg.classList.add('hidden');

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #f1f5f9';
        const dateStr = order.lastDate 
            ? new Date(order.lastDate).toLocaleDateString('es-MX', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})
            : 'N/D';
        const ticketsHtml = order.tickets.map(n => `<span class="ticket-chip chip-gray" style="font-size:0.8rem; padding:2px 6px;">${n}</span>`).join('');
        const isPending = order.status === 'reserved';
        const statusBadge = isPending 
            ? `<span style="background:#fefce8; color:#ca8a04; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.8rem;">PENDIENTE</span>`
            : `<span style="background:#f0fdf4; color:#16a34a; padding:4px 8px; border-radius:4px; font-weight:bold; font-size:0.8rem;">PAGADO</span>`;
        
        // Escapamos comillas simples para evitar errores en el HTML onClick
        const safeName = order.name.replace(/'/g, "\\'");
        const safePhone = (order.phone || '').replace(/'/g, "\\'");

        let actions = `<div style="display:flex; gap:5px; justify-content:center;">`;
        
        // Botón WhatsApp
        if (order.phone) {
            actions += `
                <button onclick="sendWhatsAppReminder('${safePhone}', '${safeName}', '${order.tickets.join(', ')}', ${order.totalDebt}, '${isPending ? 'debt' : 'thanks'}')" 
                    class="btn" style="background-color: #25D366; color: white; padding: 5px 10px; font-size: 0.8rem;" title="Enviar WhatsApp">
                    <span class="material-symbols-outlined" style="font-size: 18px;">send</span>
                </button>
            `;
        } else {
            actions += `<span style="color:#cbd5e1; font-size:0.8rem; display:flex; align-items:center;">Sin Tel</span>`;
        }

        // Botón Descargar Ticket (NUEVO)
        actions += `
            <button onclick="reprintTicket('${safeName}', '${safePhone}')" class="btn btn-primary" style="padding: 5px 10px; font-size: 0.8rem;" title="Ver Ticket">
                <span class="material-symbols-outlined" style="font-size: 18px;">confirmation_number</span>
            </button>
        `;
        
        actions += `</div>`;

        row.innerHTML = `
            <td style="padding: 12px;">
                <div style="font-weight:600; color:var(--text-dark);">${order.name}</div>
                <div style="font-size:0.85rem; color:#64748b;">${order.phone || '---'}</div>
            </td>
            <td style="padding: 12px; font-size:0.9rem; color:#64748b;">${dateStr}</td>
            <td style="padding: 12px;"><div style="display:flex; flex-wrap:wrap; gap:4px;">${ticketsHtml}</div></td>
            <td style="padding: 12px; font-weight:bold; color: ${isPending ? 'var(--danger-color)' : 'var(--success-color)'};">$${order.totalDebt}</td>
            <td style="padding: 12px;">${statusBadge}</td>
            <td style="padding: 12px; text-align:center;">${actions}</td>
        `;
        tbody.appendChild(row);
    });
}

// NUEVA FUNCIÓN MEJORADA: Busca por nombre y teléfono normalizados
function reprintTicket(name, phone) {
    // 1. Normalizamos los datos de búsqueda
    // Quitamos espacios extra y pasamos a minúsculas
    const searchName = name.trim().toLowerCase();
    
    // Dejamos SOLO números para el teléfono (super seguro contra espacios y guiones)
    const searchPhone = phone.replace(/\D/g, ''); 

    // 2. Filtrar boletos
    const userTickets = currentRaffle.tickets.filter(t => {
        const tName = (t.client || '').trim().toLowerCase();
        // Limpiamos también el teléfono de la base de datos
        const tPhone = (t.phone || '').replace(/\D/g, ''); 
        
        return tName === searchName && tPhone === searchPhone;
    });
    
    if (userTickets.length === 0) return alert("Error: No se encontraron boletos para este cliente.");

    // 2. Determinar estado
    const hasDebt = userTickets.some(t => t.status === 'reserved');
    const type = hasDebt ? 'pending' : 'paid';

    // 3. Datos del ticket
    const numbers = userTickets.map(t => t.number);
    const extras = userTickets.flatMap(t => t.extras); 
    const total = userTickets.length * currentRaffle.cost;

    const data = {
        numbers: numbers.join(', '),
        client: name, // Usamos el nombre original recibido para el display
        extras: extras,
        total: total
    };

    // 4. Generar
    generateTicketImage(data, type);
}

function sendWhatsAppReminder(phone, name, tickets, debt, type) {
    const cleanPhone = phone.replace(/\D/g, ''); 
    const finalPhone = cleanPhone.length === 10 ? '521' + cleanPhone : cleanPhone; 
    let message = '';
    if (type === 'debt') {
        message = `Hola *${name}*, te saludamos de Rifas Marizcal 👋.\n\nTe recordamos que tienes apartados los boletos: *${tickets}*.\nMonto pendiente: *$${debt}*.\n\nPor favor envíanos tu comprobante para asegurar tu participación. ¡Mucha suerte! 🍀`;
    } else {
        message = `Hola *${name}*, confirmamos que tus boletos *${tickets}* están 100% PAGADOS.\n\n¡Gracias por tu apoyo y mucha suerte en la rifa! 🎟️✨`;
    }
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

/* -------------------------------------------------------------------------- */
/* GENERACIÓN DE TICKET (HTML2CANVAS)                 */
/* -------------------------------------------------------------------------- */
async function generateTicketImage(data, type = 'pending') {
    const imgContainer = document.getElementById('generated-ticket-img-container');
    if (imgContainer) imgContainer.innerHTML = '<div style="padding:40px;">Generando ticket, espera...</div>';
    const modal = document.getElementById('modal-ticket');
    if (modal) modal.classList.remove('hidden');
    
    const templateId = type === 'paid' ? 'template-confirmed' : 'template-pending';
    const template = document.getElementById(templateId);
    if (!template) { alert("Error: Plantilla no encontrada."); return; }

    const dateStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });

    // CALCULAR NOMBRE DEL ARCHIVO PARA DESCARGA
    const statusLabel = type === 'paid' ? 'Pagado' : 'Apartado';
    const safeName = (data.client || "Cliente").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ ]/g, "").trim().replace(/\s+/g, "_");
    currentTicketFilename = `Ticket-${statusLabel}-${safeName}.png`;

    if (type === 'pending') {
        safeSetText('tpl-pen-cost', `$${data.total}.00`);
        safeSetText('tpl-pen-name', data.client || "Cliente");
        safeSetText('tpl-pen-date', dateStr);
        const ticketsDiv = document.getElementById('tpl-pen-tickets');
        if (ticketsDiv) {
            ticketsDiv.innerHTML = '';
            const numList = typeof data.numbers === 'string' ? data.numbers.split(', ') : data.numbers;
            numList.forEach(num => {
                const span = document.createElement('span');
                span.className = 'ticket-chip chip-gray';
                span.innerText = num;
                ticketsDiv.appendChild(span);
            });
        }
    } else {
        const clientName = data.client || "Cliente";
        const initials = clientName.substring(0, 2).toUpperCase();
        safeSetText('tpl-conf-avatar', initials);
        safeSetText('tpl-conf-name', clientName);
        safeSetText('tpl-conf-amount', `$${data.total}.00`);
        safeSetText('tpl-conf-date', dateStr); 
        const ticketsDiv = document.getElementById('tpl-conf-tickets');
        if (ticketsDiv) {
            ticketsDiv.innerHTML = '';
            const numList = typeof data.numbers === 'string' ? data.numbers.split(', ') : data.numbers;
            numList.forEach(num => {
                const div = document.createElement('div');
                div.className = 'ticket-chip chip-gray';
                div.innerText = num;
                ticketsDiv.appendChild(div);
            });
        }
        const oppsDiv = document.getElementById('tpl-conf-opps');
        if (oppsDiv) {
            oppsDiv.innerHTML = '';
            if(data.extras) {
                 const extrasArr = Array.isArray(data.extras) ? data.extras : (typeof data.extras === 'string' ? data.extras.split(' - ') : []);
                 extrasArr.forEach(op => {
                    const span = document.createElement('span');
                    span.className = 'opps-chip';
                    span.innerText = op;
                    oppsDiv.appendChild(span);
                 });
            }
        }
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
        const canvas = await html2canvas(template, { scale: 2, backgroundColor: null, logging: false, useCORS: true });
        currentGeneratedImage = canvas.toDataURL("image/png");
        const img = new Image();
        img.src = currentGeneratedImage;
        img.style.width = "100%";
        img.style.maxWidth = "340px";
        img.style.borderRadius = "12px";
        img.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        if(imgContainer) { imgContainer.innerHTML = ''; imgContainer.appendChild(img); }
    } catch (err) {
        console.error("Error generando ticket:", err);
        if(imgContainer) imgContainer.innerHTML = '<p style="color:red">Error al generar imagen.</p>';
    }
}

function downloadGeneratedTicket() {
    if (!currentGeneratedImage) return;
    const link = document.createElement('a');
    link.download = currentTicketFilename; // USAR NOMBRE PERSONALIZADO
    link.href = currentGeneratedImage;
    link.click();
}

function exportReportImage() {
    const area = document.getElementById('capture-area');
    if(!area) return;
    html2canvas(area, { scale: 2 }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Lista-${currentRaffle.title}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.innerText = text; }