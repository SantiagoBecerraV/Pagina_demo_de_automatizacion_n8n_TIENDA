// ----- URLS DE WEBHOOKS N8N -----
const WEBHOOK_CREAR = "https://shining-marathon-pessimism.ngrok-free.dev/webhook/c69169a9-2571-4e65-b8d9-e732b6b93db9";

// ===== Elementos del DOM =====
const form = document.getElementById('pedidoForm');
const cantidadSelect = document.getElementById('cantidad');
const totalDisplay = document.getElementById('totalDisplay');
const statusMsg = document.getElementById('statusMsg');

// ===== Formatear precios en pesos colombianos =====
function formatearCOP(valor) {
  return valor.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  });
}

// ===== Obtener el precio del producto seleccionado =====
function obtenerPrecioSeleccionado() {
  const seleccionado = form.querySelector('input[name="producto"]:checked');
  if (!seleccionado) return 0;
  return Number(seleccionado.dataset.precio);
}

// ===== Recalcular el total cuando cambia el producto o la cantidad =====
function actualizarTotal() {
  const precio = obtenerPrecioSeleccionado();
  const cantidad = Number(cantidadSelect.value);
  const total = precio * cantidad;
  totalDisplay.textContent = formatearCOP(total);
  return total;
}

form.querySelectorAll('input[name="producto"]').forEach((radio) => {
  radio.addEventListener('change', actualizarTotal);
});
cantidadSelect.addEventListener('change', actualizarTotal);

// Inicializa el total en $0 al cargar
actualizarTotal();

// ===== Mostrar mensajes de estado al usuario =====
function mostrarEstado(texto, tipo) {
  statusMsg.textContent = texto;
  statusMsg.className = `status-msg ${tipo}`;
}

// ===== Validación manual de campos obligatorios =====
function validarCamposObligatorios() {
  const productoSeleccionado = form.querySelector('input[name="producto"]:checked');
  const camposTexto = ['nombre', 'correo', 'telefono', 'direccion'];
  const barrio = document.getElementById('barrio');

  if (!productoSeleccionado) {
    return 'Selecciona un producto del menú.';
  }

  for (const id of camposTexto) {
    const campo = document.getElementById(id);
    if (!campo.value.trim()) {
      campo.focus();
      return 'Todos los campos son obligatorios. Revisa los datos de entrega.';
    }
  }

  if (!barrio.value) {
    barrio.focus();
    return 'Selecciona tu barrio o zona de entrega.';
  }

  if (!cantidadSelect.value) {
    return 'Selecciona la cantidad.';
  }

  return null; // sin errores
}

// ===== Envío del formulario =====
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Validación nativa del navegador (required, type="email", pattern, etc.)
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Validación manual adicional (obligatoriedad reforzada)
  const errorValidacion = validarCamposObligatorios();
  if (errorValidacion) {
    mostrarEstado(errorValidacion, 'error');
    return;
  }

  const productoSeleccionado = form.querySelector('input[name="producto"]:checked');
  const total = actualizarTotal();

  // Cuerpo del pedido: coincide con los campos de la tabla "Pedidos"
  const pedido = {
    nombre_cliente: document.getElementById('nombre').value.trim(),
    correo: document.getElementById('correo').value.trim(),
    telefono: document.getElementById('telefono').value.trim(),
    direccion: document.getElementById('direccion').value.trim(),
    barrio: document.getElementById('barrio').value,
    producto: productoSeleccionado.value,
    cantidad: Number(cantidadSelect.value),
    total: total,
    fecha: new Date().toISOString(),
    estado: 'pendiente',
  };

  mostrarEstado('Enviando pedido...', 'loading');

  const submitBtn = form.querySelector('.submit-btn');
  submitBtn.disabled = true;

  try {
    const respuesta = await fetch(WEBHOOK_CREAR, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pedido),
    });

    if (!respuesta.ok) {
      throw new Error(`El servidor respondió con estado ${respuesta.status}`);
    }

    mostrarEstado('¡Pedido enviado! Te llegará la confirmación al correo.', 'ok');
    form.reset();
    actualizarTotal();
  } catch (error) {
    console.error('Error al enviar el pedido:', error);
    mostrarEstado('No se pudo enviar el pedido. Revisa que n8n esté activo y escuchando el Webhook.', 'error');
  } finally {
    submitBtn.disabled = false;
  }
});
