// Estado de la aplicación
let menu = JSON.parse(localStorage.getItem('menu')) || [];
let ventas = JSON.parse(localStorage.getItem('ventas')) || [];
let nextId = 1;

// Funciones de utilidad
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');

    if (sectionId === 'estadisticas') {
        actualizarEstadisticas();
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
function agregarPlato(evento) {
    evento.preventDefault();
    const form = evento.target;
    const plato = {
        id: nextId++,
        nombre: form.nombre.value,
        categoria: form.categoria.value,
        precio: parseFloat(form.precio.value)
    };
    menu.push(plato);
    localStorage.setItem('menu', JSON.stringify(menu));
    actualizarTablaMenu();
    closeModal('menuForm');
    form.reset();
}

function eliminarPlato(id) {
    menu = menu.filter(plato => plato.id !== id);
    localStorage.setItem('menu', JSON.stringify(menu));
    actualizarTablaMenu();
}

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

function registrarVenta(evento) {
    evento.preventDefault();
    const form = evento.target;
    const platosContainer = document.getElementById('platosContainer');
    const platosVenta = Array.from(platosContainer.children).map(div => {
        const platoId = parseInt(div.querySelector('select').value);
        const cantidad = parseInt(div.querySelector('input').value);
        const plato = menu.find(p => p.id === platoId);
        return {
            plato: plato,
            cantidad: cantidad,
            subtotal: plato.precio * cantidad
        };
    });

    const venta = {
        id: Date.now(),
        mesa: parseInt(form.mesa.value),
        platos: platosVenta,
        total: platosVenta.reduce((sum, item) => sum + item.subtotal, 0),
        fecha: new Date().toISOString(), // Ya guarda fecha y hora exacta
        hora: new Date().toLocaleTimeString() // Agrega la hora legible
    };
    

    ventas.push(venta);
    localStorage.setItem('ventas', JSON.stringify(ventas));
    actualizarTablaVentas();
    closeModal('ventaForm');
    form.reset();
}

function actualizarTablaVentas() {
    const tabla = document.getElementById('ventasTable');
    tabla.innerHTML = ventas.map(venta => `
        <tr>
            <td class="px-6 py-4">C$${venta.total.toFixed(2)}</td>
<td class="px-6 py-4">
    ${venta.platos.map(item => 
        `${item.cantidad}x ${item.plato.nombre} (C$${item.subtotal.toFixed(2)})`
    ).join('<br>')}
</td>

            <td class="px-6 py-4">$${venta.total.toFixed(2)}</td>
            <td class="px-6 py-4">${new Date(venta.fecha).toLocaleDateString()}</td>
            <td class="px-6 py-4">${venta.hora}</td> <!-- Nueva columna para hora -->
        </tr>
    `).join('');
}


// Estadísticas
function actualizarEstadisticas() {
actualizarEstadisticasDiarias();
actualizarGraficaMensual();
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
    actualizarGraficaDiariaPlatos();
    actualizarGraficaConcurrenciaDiaria();
}

function actualizarGraficaMensual() {
const mesActual = new Date().getMonth();
const añoActual = new Date().getFullYear();

// Preparar datos para el gráfico
const ventasPorDia = {};
for (let i = 1; i <= 31; i++) {
    ventasPorDia[i] = 0;
}

ventas.forEach(venta => {
    const fecha = new Date(venta.fecha);
    if (fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual) {
        const dia = fecha.getDate();
        ventasPorDia[dia] += venta.total;
    }
});

const ctx = document.getElementById('ventasMensualesChart').getContext('2d');

// Destruir gráfico anterior si existe
if (window.ventasChart) {
    window.ventasChart.destroy();
}

window.ventasChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Object.keys(ventasPorDia),
        datasets: [{
            label: 'Ventas Diarias',
            data: Object.values(ventasPorDia),
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return 'C$' + value.toFixed(2);
                    }
                }                
            }
        }
    }
});
}

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
// Inicializar tablas
actualizarTablaMenu();
actualizarTablaVentas();

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
function actualizarGraficaDiariaPlatos() {
    const conteoPlatos = calcularVentasDiariasPorPlato();
    const nombresPlatos = Object.keys(conteoPlatos);
    const cantidades = Object.values(conteoPlatos);

    const ctx = document.getElementById('ventasDiariasPlatosChart').getContext('2d');

    // Destruir gráfica anterior si existe
    if (window.platosChart) {
        window.platosChart.destroy();
    }

    // Crear nueva gráfica
    window.platosChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: nombresPlatos,
            datasets: [{
                label: 'Unidades Vendidas',
                data: cantidades,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
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
    const ventasPorHora = calcularVentasPorHora();
    const horas = Array.from({ length: 24 }, (_, i) => `${i}:00 - ${i + 1}:00`);

    const ctx = document.getElementById('concurrenciaDiariaChart').getContext('2d');

    // Destruir gráfica anterior si existe
    if (window.concurrenciaChart) {
        window.concurrenciaChart.destroy();
    }

    // Crear nueva gráfica
    window.concurrenciaChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: horas,
            datasets: [{
                label: 'Ventas por Hora',
                data: ventasPorHora,
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
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
document.getElementById('menuToggle').addEventListener('click', () => {
    const menu = document.getElementById('menus');

    // Alternar entre mostrar y ocultar el menú
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('flex', 'animate-slide-down'); // Mostrar con animación
    } else {
        menu.classList.add('hidden'); // Ocultar
        menu.classList.remove('flex', 'animate-slide-down');
    }
});

// Cerrar el menú automáticamente al seleccionar una opción
document.querySelectorAll('#menu button').forEach(button => {
    button.addEventListener('click', () => {
        const menu = document.getElementById('menus');
        if (!menu.classList.contains('hidden')) {
            menu.classList.add('hidden'); // Ocultar menú
            menu.classList.remove('flex', 'animate-slide-down');
        }
    });
});

