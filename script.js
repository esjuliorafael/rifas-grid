/* -------------------------------------------------------------------------- */
/* ESTADO DE LA APLICACIÓN                               */
/* -------------------------------------------------------------------------- */
let allRaffles = []; 
let currentRaffleIndex = null;
let currentRaffle = null;
let selectedIndices = new Set();
let currentGeneratedImage = null; // Variable global para la imagen del ticket

/* -------------------------------------------------------------------------- */
/* INICIALIZACIÓN                               */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    loadFromServer();
    setupColorSync(); // NUEVO: Iniciar sincronización de colores
});

/* -------------------------------------------------------------------------- */
/* UTILIDAD: SINCRONIZACIÓN DE COLORES (TEXTO <-> PICKER) */
/* -------------------------------------------------------------------------- */
function setupColorSync() {
    // Par 1: Crear Rifa
    syncInputs('r-color', 'r-color-picker');
    // Par 2: Editar Rifa
    syncInputs('edit-color', 'edit-color-picker');
}

function syncInputs(textId, pickerId) {
    const textInput = document.getElementById(textId);
    const pickerInput = document.getElementById(pickerId);

    if (!textInput || !pickerInput) return;

    // Si cambio el texto -> Actualiza el picker (si es Hex válido)
    textInput.addEventListener('input', () => {
        const val = textInput.value;
        if (/^#[0-9A-F]{6}$/i.test(val)) {
            pickerInput.value = val;
        }
    });

    // Si cambio el picker -> Actualiza el texto
    pickerInput.addEventListener('input', () => {
        textInput.value = pickerInput.value;
    });
}

/* -------------------------------------------------------------------------- */
/* UTILIDAD: GESTIÓN DE TEMAS (COLORES Y LOGO) */
/* -------------------------------------------------------------------------- */
function applyTheme(colorHex, logoFileName) {
    const root = document.documentElement;

    // 1. Aplicar color principal
    const mainColor = colorHex || '#2563eb'; // Azul por defecto
    root.style.setProperty('--primary-color', mainColor);

    // 2. Generar y aplicar color suave (Light) automáticamente (opacidad 15%)
    const lightColor = hexToRgba(mainColor, 0.15); 
    root.style.setProperty('--primary-light', lightColor);

    // 3. Cambiar Logo
    const logoImg = document.querySelector('.custom-logo');
    if (logoImg) {
        // Si no hay logo definido, usa el por defecto 'Navajas Marizcal.png'
        logoImg.src = logoFileName || 'Navajas Marizcal.png';
        
        // Si el archivo no existe, fallback al original
        logoImg.onerror = () => { 
            if(logoImg.src.indexOf('Navajas Marizcal.png') === -1) {
                logoImg.src = 'Navajas Marizcal.png'; 
            }
        }; 
    }
}

// Helper para convertir HEX a RGBA con opacidad
function hexToRgba(hex, alpha) {
    let c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+alpha+')';
    }
    return '#eff6ff'; // Default si falla
}

/* -------------------------------------------------------------------------- */
/* NAVEGACIÓN                                  */
/* -------------------------------------------------------------------------- */
function showView(viewName) {
    ['home', 'create', 'manage'].forEach(v => {
        const el = document.getElementById('view-' + v);
        if(el) el.classList.add('hidden');
    });
    
    const target = document.getElementById('view-' + viewName);
    if(target) target.classList.remove('hidden');
    
    // Al volver al home, refrescar la lista y restaurar tema original
    if (viewName === 'home') {
        renderHomeList();
        applyTheme('#2563eb', 'Navajas Marizcal.png'); // Restaurar azul original
    }
}

/* -------------------------------------------------------------------------- */
/* BACKEND (Comunicación con PHP)                  */
/* -------------------------------------------------------------------------- */
async function saveToServer() {
    // Sincronizar rifa actual con la lista antes de guardar
    if (currentRaffleIndex !== null && currentRaffle) {
        allRaffles[currentRaffleIndex] = currentRaffle;
    }

    try { 
        await fetch('backend.php', { 
            method: 'POST', 
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(allRaffles) 
        }); 
    } catch(e) { 
        console.error("Error guardando:", e); 
    }
}

async function loadFromServer() {
    try {
        const res = await fetch('backend.php');
        let data = await res.json();
        
        // Migración: si es un objeto único viejo, convertirlo a array
        if (data && !Array.isArray(data) && data.tickets) {
            data = [data];
        }
        
        if (!data) data = [];

        allRaffles = data;
        renderHomeList();

    } catch(e) { 
        console.log("Error de carga:", e);
        allRaffles = [];
    }
}

/* -------------------------------------------------------------------------- */
/* VISTA HOME: LISTA DE RIFAS                      */
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

            // Usamos el color de la rifa para diferenciarla
            const rColor = raffle.themeColor || '#2563eb';

            const card = document.createElement('div');
            card.className = 'raffle-summary-card';
            // Borde izquierdo con el color de la rifa
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
    
    // --- APLICAR TEMA VISUAL ---
    applyTheme(currentRaffle.themeColor, currentRaffle.customLogo);
    
    renderGrid();
    updateStats();
    showView('manage');
}

function deleteRaffle(index) {
    if (!confirm("¿Borrar esta rifa? No hay vuelta atrás.")) return;
    
    allRaffles.splice(index, 1);
    
    if (currentRaffleIndex === index) { 
        currentRaffleIndex = null; 
        currentRaffle = null; 
    }
    
    saveToServer();
    renderHomeList();
}

/* -------------------------------------------------------------------------- */
/* CREAR RIFA                                  */
/* -------------------------------------------------------------------------- */
function handleCreateRaffle(e) {
    e.preventDefault();
    const title = document.getElementById('r-title').value;
    const prizes = document.getElementById('r-prizes').value;
    const cost = parseInt(document.getElementById('r-cost').value);
    const quantity = parseInt(document.getElementById('r-quantity').value);
    const mode = document.querySelector('input[name="r-mode"]:checked').value;

    // NUEVOS CAMPOS DE TEMA (Leemos del input de texto, que es el "master")
    const themeColor = document.getElementById('r-color').value;
    const customLogo = document.getElementById('r-logo').value.trim();

    // Generar oportunidades extra
    let extras = [];
    let startExtra = quantity + 1;
    for (let i = startExtra; i <= 99; i++) {
        extras.push(i.toString().padStart(2, '0'));
    }
    if (quantity !== 33) extras.push("00");

    // Mezclar si es aleatorio
    if (mode === 'random') {
        extras.sort(() => Math.random() - 0.5);
    }

    let tickets = [];
    const chances = (quantity === 25) ? 3 : (quantity === 33) ? 2 : 1;

    for (let i = 1; i <= quantity; i++) {
        let tNum = i.toString().padStart(2, '0');
        let myExtras = [];
        
        for (let c = 0; c < chances; c++) {
            if (extras.length) myExtras.push(extras.shift());
        }
        
        if (mode === 'random') myExtras.sort();
        
        tickets.push({ 
            number: tNum, 
            extras: myExtras, 
            status: 'available', 
            client: '', 
            phone: '' 
        });
    }

    const newRaffle = { 
        title, 
        prizes, 
        cost, 
        tickets,
        themeColor, // Guardamos color
        customLogo  // Guardamos logo
    };

    allRaffles.push(newRaffle);
    selectRaffle(allRaffles.length - 1);
    saveToServer();
    e.target.reset();
    
    // Resetear los colores al default en el formulario
    document.getElementById('r-color').value = '#2563eb';
    document.getElementById('r-color-picker').value = '#2563eb';
}

/* -------------------------------------------------------------------------- */
/* EDITAR RIFA                                 */
/* -------------------------------------------------------------------------- */
function openEditModal() {
    document.getElementById('edit-title').value = currentRaffle.title;
    document.getElementById('edit-prizes').value = currentRaffle.prizes;
    document.getElementById('edit-cost').value = currentRaffle.cost;

    // Cargar valores actuales de tema en AMBOS inputs
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

    // Capturar nuevos valores de tema (del input de texto)
    const newColor = document.getElementById('edit-color').value;
    const newLogo = document.getElementById('edit-logo').value.trim();

    if (!newTitle || !newCost) return alert("Título y Costo requeridos");

    currentRaffle.title = newTitle;
    currentRaffle.prizes = newPrizes;
    currentRaffle.cost = newCost;
    currentRaffle.themeColor = newColor;
    currentRaffle.customLogo = newLogo;

    // Aplicar cambios visuales inmediatamente
    applyTheme(newColor, newLogo);

    saveToServer();
    renderGrid();
    updateStats();
    closeModal('modal-edit');
}

/* -------------------------------------------------------------------------- */
/* RENDER GRID (GESTIÓN)                       */
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

        let statusLabel = ''; 
        if (t.status === 'available') statusLabel = 'Disponible';
        if (t.status === 'reserved') statusLabel = 'Apartado';
        if (t.status === 'paid') statusLabel = 'Pagado';

        // Estilo condicional para el icono seleccionado usando el color del tema
        const iconStyle = isSelected ? `color: var(--primary-color);` : (t.status === 'available' ? 'color: #ccc' : '');

        card.innerHTML = `
            <div class="flex" style="justify-content: space-between;">
                <span class="ticket-number">${t.number}</span>
                <span class="material-symbols-outlined" style="font-size: 28px; ${iconStyle}">${icon}</span>
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

/* -------------------------------------------------------------------------- */
/* SELECCIÓN Y ACCIONES (LÓGICA MEJORADA CON MODALES)  */
/* -------------------------------------------------------------------------- */

// --- 1. Variables Temporales ---
let pendingBulkStatus = null;
let pendingRelatedIndices = [];
let tempPaymentData = null; // Para confirmar pago

// --- 2. Funciones de Ayuda (Búsqueda) ---
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

        if (nameMatch || phoneMatch) {
            newMatches.push(index);
        }
    });
    return newMatches;
}

// --- 3. Función Principal de Acción ---
function bulkUpdateStatus(status) {
    if (selectedIndices.size === 0) return alert("Primero selecciona al menos un boleto.");

    const relatedIndices = findRelatedTickets();

    if (relatedIndices.length > 0) {
        // En lugar de confirm(), abrimos el Modal Cascada
        pendingBulkStatus = status;
        pendingRelatedIndices = relatedIndices;
        
        // --- LOGICA SINGULAR / PLURAL ---
        const count = relatedIndices.length;
        const pText = document.getElementById('cascade-text');
        
        if (pText) {
            if (count === 1) {
                pText.innerHTML = `El sistema detectó <strong style="color: var(--primary-color); font-size: 1.3rem;">otro boleto</strong> registrado con el mismo Cliente o Teléfono:`;
            } else {
                pText.innerHTML = `El sistema detectó otros <strong style="color: var(--primary-color); font-size: 1.3rem;">${count} boletos</strong> registrados con el mismo Cliente o Teléfono:`;
            }
        }

        // --- GENERAR FICHAS VISUALES ---
        const listDiv = document.getElementById('cascade-tickets-list');
        if (listDiv) {
            listDiv.innerHTML = '';
            relatedIndices.forEach(idx => {
                const tNum = currentRaffle.tickets[idx].number;
                const chip = document.createElement('span');
                chip.className = 'ticket-chip chip-gray';
                chip.innerText = tNum;
                chip.style.fontSize = '1rem'; 
                listDiv.appendChild(chip);
            });
        }
        
        document.getElementById('modal-cascade').classList.remove('hidden');
    } else {
        // Si no hay relacionados, ejecución directa
        executeBulkUpdate(status);
    }
}

// --- 4. Respuesta del Modal Cascada ---
function applyCascade(includeRelated) {
    if (includeRelated && pendingRelatedIndices.length > 0) {
        pendingRelatedIndices.forEach(idx => selectedIndices.add(idx));
        renderGrid(); 
    }
    
    closeModal('modal-cascade');
    
    // Pequeño delay
    setTimeout(() => {
        if (pendingBulkStatus) {
            executeBulkUpdate(pendingBulkStatus);
            pendingBulkStatus = null;
            pendingRelatedIndices = [];
        }
    }, 100);
}

// --- 5. Ejecución Real (Lógica de Negocio) ---
function executeBulkUpdate(status) {
    
    // CASO PAGAR (ABRIR MODAL DE CONFIRMACIÓN DE DINERO)
    if (status === 'paid') {
        let ticketData = { numbers: [], extras: [], total: 0, client: '' };
        let uniqueClients = new Set();

        selectedIndices.forEach(index => {
            const t = currentRaffle.tickets[index];
            if (t.client) {
                ticketData.client = t.client;
                uniqueClients.add(t.client);
            }
            ticketData.numbers.push(t.number);
            ticketData.extras.push(...t.extras);
            ticketData.total += currentRaffle.cost;
        });

        // Advertencia de múltiples clientes (dejamos confirm simple para este caso raro)
        if (uniqueClients.size > 1) {
            if(!confirm(`OJO: Estás pagando boletos de ${uniqueClients.size} clientes diferentes.\n¿Continuar?`)) return;
        }

        // Si es venta de mostrador sin nombre
        if (!ticketData.client) {
            const promptName = prompt("Ingresa el cliente para el ticket:", "Cliente Mostrador");
            if (promptName) ticketData.client = promptName;
            else return;
        }

        // --- MOSTRAR MODAL DE CONFIRMACIÓN DE COBRO ---
        tempPaymentData = ticketData;
        
        // Llenamos el modal
        safeSetText('conf-total', '$' + ticketData.total);
        safeSetText('conf-count', selectedIndices.size);
        safeSetText('conf-client', ticketData.client);
        
        // Mostramos modal
        document.getElementById('modal-confirm-pay').classList.remove('hidden');
        return; // Detenemos aquí esperando el click del usuario
    }

    // CASO GENÉRICO (LIBERAR / APARTAR)
    const actionName = status === 'available' ? 'LIBERAR' : 'APARTAR';
    if (!confirm(`¿Estás seguro de ${actionName} ${selectedIndices.size} boletos?`)) return;
    
    selectedIndices.forEach(index => {
        currentRaffle.tickets[index].status = status;
        if (status === 'available') { 
            currentRaffle.tickets[index].client = ''; 
            currentRaffle.tickets[index].phone = ''; 
        }
    });
    
    finalizeAction();
}

// --- 6. Finalización del Pago (Llamado desde el Modal Confirm Pay) ---
function finishPaymentAction() {
    closeModal('modal-confirm-pay');
    
    if (!tempPaymentData) return;

    // Ejecutar cambios en la "Base de Datos" local
    selectedIndices.forEach(index => {
        currentRaffle.tickets[index].status = 'paid';
        // Aseguramos que si no tenían nombre, se les ponga el del pagador
        if (!currentRaffle.tickets[index].client) {
            currentRaffle.tickets[index].client = tempPaymentData.client;
        }
    });

    finalizeActionAndGenerateTicket(tempPaymentData, 'paid');
    tempPaymentData = null; // Limpiar
}

// --- 7. Helpers de Finalización ---
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

/* -------------------------------------------------------------------------- */
/* UI UTILS                                    */
/* -------------------------------------------------------------------------- */
function toggleSelection(index) {
    if (selectedIndices.has(index)) selectedIndices.delete(index);
    else selectedIndices.add(index);
    renderGrid();
}

function clearSelection() { 
    selectedIndices.clear(); 
    renderGrid(); 
}

function updateActionBar() {
    const bar = document.getElementById('action-bar');
    if (!bar) return;

    if (selectedIndices.size > 0) {
        bar.classList.remove('hidden'); 
        bar.classList.add('flex');
        safeSetText('selected-count', selectedIndices.size);
    } else {
        bar.classList.add('hidden'); 
        bar.classList.remove('flex');
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

function closeModal(id) { 
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden'); 
}

function confirmReserve() {
    const name = document.getElementById('input-name').value;
    const phone = document.getElementById('input-phone').value;
    
    if (!name) return alert("Nombre obligatorio");
    
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

    // Generar Ticket Naranja (Pendiente)
    generateTicketImage({ 
        numbers: reservedData.numbers.join(', '), 
        client: name, 
        extras: reservedData.extras, 
        total: reservedData.total 
    }, 'pending');
}

function updateStats() {
    const counts = { available: 0, reserved: 0, paid: 0 };
    currentRaffle.tickets.forEach(t => counts[t.status]++);
    
    safeSetText('stat-avail', counts.available);
    safeSetText('stat-reserved', counts.reserved);
    safeSetText('stat-paid', counts.paid);
}

/* -------------------------------------------------------------------------- */
/* GENERACIÓN DE TICKET (HTML2CANVAS)                 */
/* -------------------------------------------------------------------------- */

async function generateTicketImage(data, type = 'pending') {
    // 1. Mostrar modal con mensaje de carga
    const imgContainer = document.getElementById('generated-ticket-img-container');
    if (imgContainer) imgContainer.innerHTML = '<div style="padding:40px;">Generando ticket, espera...</div>';
    
    const modal = document.getElementById('modal-ticket');
    if (modal) modal.classList.remove('hidden');
    
    // 2. Seleccionar Plantilla
    const templateId = type === 'paid' ? 'template-confirmed' : 'template-pending';
    const template = document.getElementById(templateId);
    
    if (!template) {
        alert("Error: No se encontró la plantilla del ticket en el HTML.");
        return;
    }

    // 3. Inyectar Datos según el tipo
    const dateStr = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });

    if (type === 'pending') {
        safeSetText('tpl-pen-cost', `$${data.total}.00`);
        safeSetText('tpl-pen-name', data.client || "Cliente");
        safeSetText('tpl-pen-date', dateStr);
        
        // Boletos (Chips Grises)
        const ticketsDiv = document.getElementById('tpl-pen-tickets');
        if (ticketsDiv) {
            ticketsDiv.innerHTML = '';
            // Convertir a array si viene como string
            const numList = typeof data.numbers === 'string' ? data.numbers.split(', ') : data.numbers;
            numList.forEach(num => {
                const span = document.createElement('span');
                span.className = 'ticket-chip chip-gray';
                span.innerText = num;
                ticketsDiv.appendChild(span);
            });
        }

    } else {
        // Confirmed (Pagado)
        const clientName = data.client || "Cliente";
        const initials = clientName.substring(0, 2).toUpperCase();
        
        safeSetText('tpl-conf-avatar', initials);
        safeSetText('tpl-conf-name', clientName);
        safeSetText('tpl-conf-amount', `$${data.total}.00`);
        
        safeSetText('tpl-conf-date', dateStr); 

        // Boletos (Chips Azules)
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

        // Oportunidades
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

    // 4. Pequeña pausa para asegurar renderizado del DOM antes de capturar
    await new Promise(resolve => setTimeout(resolve, 300));

    // 5. Generar Imagen con html2canvas
    try {
        const canvas = await html2canvas(template, {
            scale: 2, 
            backgroundColor: null, 
            logging: false,
            useCORS: true 
        });

        currentGeneratedImage = canvas.toDataURL("image/png");
        
        // 6. Mostrar imagen final
        const img = new Image();
        img.src = currentGeneratedImage;
        img.style.width = "100%";
        img.style.maxWidth = "340px"; // Ancho real del ticket
        img.style.borderRadius = "12px";
        img.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1)";
        
        if(imgContainer) {
            imgContainer.innerHTML = '';
            imgContainer.appendChild(img);
        }

    } catch (err) {
        console.error("Error generando ticket:", err);
        if(imgContainer) imgContainer.innerHTML = '<p style="color:red">Error al generar la imagen. Verifica la consola.</p>';
    }
}

function downloadGeneratedTicket() {
    if (!currentGeneratedImage) return;
    const link = document.createElement('a');
    link.download = `Ticket-${new Date().getTime()}.png`;
    link.href = currentGeneratedImage;
    link.click();
}

function exportReportImage() {
    const area = document.getElementById('capture-area');
    if(!area) return;

    html2canvas(area, {
        scale: 2
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `Lista-${currentRaffle.title}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

// FUNCION HELPER DE SEGURIDAD
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
}