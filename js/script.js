// Estado de la aplicación
const API_URL = 'http://localhost:3000';

// Obtener el menú desde el backend
async function cargarMenu() {
    try {
        const response = await fetch(`${API_URL}/menu`);
        if (!response.ok) throw new Error('Error al cargar el menú');
        menu = await response.json();
        actualizarTablaMenu();
    } catch (error) {
        console.error(error.message);
    }
}
// Funciones de utilidad
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');

    if (sectionId === 'estadisticas') {
        cargarTodasLasEstadisticas();
    }

    if (sectionId === 'ventasAnteriores') {
        actualizarTablaVentasAnteriores();
    }
}


function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
    if (modalId === 'ventaForm') {
        actualizarPlatosVenta();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Gestión del Menú
// Agregar un plato al menú
async function agregarPlato(evento) {
    evento.preventDefault();
    const form = evento.target;
    const plato = {
        nombre: form.nombre.value,
        categoria: form.categoria.value,
        precio: parseFloat(form.precio.value),
    };

    try {
        const response = await fetch(`${API_URL}/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(plato),
        });
        if (!response.ok) throw new Error('Error al agregar plato');
        const nuevoPlato = await response.json();
        menu.push(nuevoPlato);
        actualizarTablaMenu();
        closeModal('menuForm');
        form.reset();
    } catch (error) {
        console.error(error.message);
    }
}


// Eliminar un plato del menú
async function eliminarPlato(id) {
    try {
        const response = await fetch(`${API_URL}/menu/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Error al eliminar plato');
        menu = menu.filter(plato => plato.id !== id);
        actualizarTablaMenu();
    } catch (error) {
        console.error(error.message);
    }
}


// Actualizar la tabla del menú
function actualizarTablaMenu() {
    const tabla = document.getElementById('menuTable');
    tabla.innerHTML = menu.map(plato => `
        <tr>
            <td class="px-6 py-4">${plato.nombre}</td>
            <td class="px-6 py-4">${plato.categoria}</td>
            <td class="px-6 py-4">C$${plato.precio.toFixed(2)}</td>
            <td class="px-6 py-4">
                <button onclick="eliminarPlato(${plato.id})" class="text-red-600 hover:text-red-900">Eliminar</button>
            </td>
        </tr>
    `).join('');
}

// Gestión de Ventas
function agregarPlatoVenta() {
    const container = document.getElementById('platosContainer');
    const platoDiv = document.createElement('div');
    platoDiv.className = 'flex space-x-2';
    platoDiv.innerHTML = `
        <select class="flex-1 rounded-md border-gray-300 shadow-sm" required>
            ${menu.map(plato => `
                <option value="${plato.id}">${plato.nombre} - $${plato.precio.toFixed(2)}</option>
            `).join('')}
        </select>
        <input type="number" min="1" value="1" class="w-20 rounded-md border-gray-300 shadow-sm" required>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-600">X</button>
    `;
    container.appendChild(platoDiv);
}

function actualizarPlatosVenta() {
    const container = document.getElementById('platosContainer');
    container.innerHTML = '';
    agregarPlatoVenta();
}

// Registrar una venta en el backend
async function registrarVenta(evento) {
    evento.preventDefault();
    const form = evento.target;
    const platosContainer = document.getElementById('platosContainer');
    const platosVenta = Array.from(platosContainer.children).map(div => {
        const platoId = parseInt(div.querySelector('select').value);
        const cantidad = parseInt(div.querySelector('input').value);
        const plato = menu.find(p => p.id === platoId);
        return {
            platoId: plato.id,
            cantidad: cantidad,
            subtotal: plato.precio * cantidad,
        };
    });

    const venta = {
        mesa: parseInt(form.mesa.value),
        platos: platosVenta,
        total: platosVenta.reduce((sum, item) => sum + item.subtotal, 0),
    };

    try {
        const response = await fetch(`${API_URL}/ventas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(venta),
        });
        if (!response.ok) throw new Error('Error al registrar venta');
        await cargarVentas();
        closeModal('ventaForm');
        form.reset();
    } catch (error) {
        console.error(error.message);
    }
}
// Cargar ventas desde el backend
async function cargarVentas() {
    try {
        const response = await fetch(`${API_URL}/ventas`);
        if (!response.ok) throw new Error('Error al cargar ventas');
        ventas = await response.json();
        actualizarTablaVentas();
    } catch (error) {
        console.error(error.message);
    }
}

// Cargar ventas desde el backend
async function cargarVentas() {
    try {
        const response = await fetch(`${API_URL}/ventas`);
        if (!response.ok) throw new Error('Error al cargar ventas');
        ventas = await response.json();
        actualizarTablaVentas();
    } catch (error) {
        console.error(error.message);
    }
}



async function cargarTodasLasEstadisticas() {
    try {
        // Cargar estadísticas diarias
        const responseDiarias = await fetch(`${API_URL}/ventas`);
        if (!responseDiarias.ok) throw new Error('Error al cargar estadísticas diarias');
        ventas = await responseDiarias.json(); // Actualizamos la lista de ventas
        actualizarEstadisticasDiarias(); // Usamos la función centralizada para actualizar estadísticas

        // Cargar estadísticas mensuales
        const responseMensuales = await fetch(`${API_URL}/estadisticas/mensuales`);
        if (!responseMensuales.ok) throw new Error('Error al cargar estadísticas mensuales');
        const ventasMensuales = await responseMensuales.json();

        actualizarGraficaMensual(ventasMensuales);
    } catch (error) {
        console.error(error.message);
    }
}



function actualizarEstadisticasDiarias() {
    const hoy = new Date().toLocaleDateString();
    const ventasHoy = ventas.filter(v => 
        new Date(v.fecha).toLocaleDateString() === hoy
    );

    // Calcular total de ventas del día
    const totalVentasHoy = ventasHoy.reduce((sum, v) => sum + v.total, 0);
    document.getElementById('ventasHoy').textContent = `C$${totalVentasHoy.toFixed(2)}`;

    // Calcular platos más vendidos
    const platosVendidosHoy = {};
    ventasHoy.forEach(venta => {
        venta.platos.forEach(item => {
            const nombrePlato = item.plato.nombre;
            if (!platosVendidosHoy[nombrePlato]) {
                platosVendidosHoy[nombrePlato] = 0;
            }
            platosVendidosHoy[nombrePlato] += item.cantidad;
        });
    });

    const platosMasVendidos = Object.entries(platosVendidosHoy)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const listaPlatosMasVendidos = document.getElementById('platosMasVendidosHoy');
    listaPlatosMasVendidos.innerHTML = platosMasVendidos
        .map(([plato, cantidad]) => 
            `<li class="text-sm">${plato}: ${cantidad} unidades</li>`
        ).join('');

    // Actualizar gráfica diaria de platos
    actualizarGraficaDiariaPlatos(platosMasVendidos);
    actualizarGraficaConcurrenciaDiaria();
}


function actualizarGraficaMensual(ventasMensuales) {
    const ctx = document.getElementById('ventasMensualesChart').getContext('2d');
    const dias = ventasMensuales.map(v => v.dia);
    const totales = ventasMensuales.map(v => v.total);

    if (window.ventasMensualesChart) window.ventasMensualesChart.destroy(); // Destruir gráfica anterior

    window.ventasMensualesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dias,
            datasets: [{
                label: 'Ventas Diarias',
                data: totales,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.3,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `C$${value.toFixed(2)}`,
                    },
                },
            },
        },
    });
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos desde el backend
    cargarMenu();
    cargarVentas();

    // Configurar formularios
    document.getElementById('newDishForm').addEventListener('submit', agregarPlato);
    document.getElementById('newSaleForm').addEventListener('submit', registrarVenta);

    // Mostrar sección inicial
    showSection('menu');
});

function calcularVentasDiariasPorPlato() {
    const hoy = new Date().toLocaleDateString();
    const ventasHoy = ventas.filter(v => 
        new Date(v.fecha).toLocaleDateString() === hoy
    );

    const conteoPlatos = {};

    ventasHoy.forEach(venta => {
        venta.platos.forEach(item => {
            const nombrePlato = item.plato.nombre;
            if (!conteoPlatos[nombrePlato]) {
                conteoPlatos[nombrePlato] = 0;
            }
            conteoPlatos[nombrePlato] += item.cantidad;
        });
    });

    return conteoPlatos;
}
function actualizarGraficaDiariaPlatos(platosMasVendidos) {
    const ctx = document.getElementById('ventasDiariasPlatosChart').getContext('2d');
    const nombresPlatos = platosMasVendidos.map(([plato]) => plato);
    const cantidades = platosMasVendidos.map(([, cantidad]) => cantidad);

    if (window.platosChart) window.platosChart.destroy(); // Destruir gráfica anterior

    window.platosChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nombresPlatos,
            datasets: [{
                label: 'Unidades Vendidas',
                data: cantidades,
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true },
            }
        }
    });
}

function calcularVentasPorHora() {
    const hoy = new Date().toLocaleDateString();
    const ventasHoy = ventas.filter(v => 
        new Date(v.fecha).toLocaleDateString() === hoy
    );

    const ventasPorHora = Array(24).fill(0); // Array para cada hora (0 a 23)

    ventasHoy.forEach(venta => {
        const hora = new Date(venta.fecha).getHours();
        ventasPorHora[hora]++;
    });

    return ventasPorHora;
}
function actualizarGraficaConcurrenciaDiaria() {
    const ventasPorHora = Array(24).fill(0);
    const hoy = new Date().toLocaleDateString();
    const ventasHoy = ventas.filter(v => 
        new Date(v.fecha).toLocaleDateString() === hoy
    );

    ventasHoy.forEach(venta => {
        const hora = new Date(venta.fecha).getHours();
        ventasPorHora[hora]++;
    });

    const ctx = document.getElementById('concurrenciaDiariaChart').getContext('2d');
    const horas = Array.from({ length: 24 }, (_, i) => `${i}:00 - ${i + 1}:00`);

    if (window.concurrenciaChart) window.concurrenciaChart.destroy(); // Destruir gráfica anterior

    window.concurrenciaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: horas,
            datasets: [{
                label: 'Ventas por Hora',
                data: ventasPorHora,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true },
            }
        }
    });
}

function actualizarTablaVentasAnteriores() {
    // Ordenar las ventas por fecha (más recientes primero)
    const ventasOrdenadas = [...ventas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // Generar filas para la tabla
    const tabla = document.getElementById('ventasAnterioresTable');
    tabla.innerHTML = ventasOrdenadas.map(venta => `
        <tr>
            <td class="px-6 py-4">${new Date(venta.fecha).toLocaleDateString()}</td>
            <td class="px-6 py-4">${venta.hora}</td>
            <td class="px-6 py-4">Mesa ${venta.mesa}</td>
            <td class="px-6 py-4">$${venta.total.toFixed(2)}</td>
            <td class="px-6 py-4">
                ${venta.platos.map(item => 
                    `${item.cantidad}x ${item.plato.nombre} ($${item.subtotal.toFixed(2)})`
                ).join('<br>')}
            </td>
        </tr>
    `).join('');
}
// Mostrar/Ocultar el menú hamburguesa
document.getElementById('menuToggle').addEventListener('click', () => {
    const menus = document.getElementById('menus');

    // Alternar entre mostrar y ocultar el menú
    if (menus.classList.contains('hidden')) {
        menus.classList.remove('hidden');
        menus.classList.add('flex', 'animate-slide-down'); // Mostrar con animación
    } else {
        menus.classList.add('hidden'); // Ocultar
        menus.classList.remove('flex', 'animate-slide-down');
    }
});

// Cerrar el menú automáticamente al seleccionar una opción
document.querySelectorAll('#menus button').forEach(button => {
    button.addEventListener('click', () => {
        const menus = document.getElementById('menus');
        if (!menus.classList.contains('hidden')) {
            menus.classList.add('hidden'); // Ocultar menú
            menus.classList.remove('flex', 'animate-slide-down');
        }
    });
});


