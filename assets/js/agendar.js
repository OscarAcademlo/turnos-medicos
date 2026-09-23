// ==========================================
// LÓGICA DEL WIZARD DE RESERVA (PÚBLICO)
// ==========================================

let wizardData = {
    medicoId: null,
    medicoNombre: null,
    especialidadNombre: null,
    coberturaId: null,
    coberturaNombre: null,
    planId: null,
    planNombre: null,
    fecha: null,
    hora: null
};

// Check if user is logged in to change the header button
auth.onAuthStateChanged((firebaseUser) => {
    const authSection = document.getElementById('header-auth-section');
    if (firebaseUser) {
        authSection.innerHTML = `
            <a href="dashboard.php" class="btn btn-outline-primary rounded-pill px-4 fw-semibold shadow-sm">
                <i class="bi bi-person-circle me-1"></i> Ir al Panel
            </a>
        `;
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const medicoId = urlParams.get('medico_id');
    
    if (medicoId) {
        iniciarWizardReserva(medicoId);
    } else {
        window.location.href = 'index.php'; // Volver si no hay médico
    }
});

function iniciarWizardReserva(medicoId) {
    wizardData.medicoId = medicoId;
    
    // Fetch de datos del médico para llenar la barra superior
    fetch(`backend/api/get_public_agenda.php?medico_id=${medicoId}`)
        .then(res => res.json())
        .then(data => {
            if(data.length > 0) {
                const med = data[0];
                const nombreCompleto = med.nombre + ' ' + med.apellido;
                const especialidadNombre = med.especialidades && med.especialidades.length > 0 
                    ? med.especialidades.map(e => e.nombre).join(', ') 
                    : 'Medicina General';
                    
                wizardData.medicoNombre = nombreCompleto;
                wizardData.especialidadNombre = especialidadNombre;
                
                document.getElementById('wizard-medico-nombre').textContent = nombreCompleto;
                document.getElementById('wizard-medico-nombre-q').textContent = nombreCompleto;
                document.getElementById('wizard-especialidad-nombre').textContent = especialidadNombre;
            } else {
                alert("Profesional no encontrado.");
                window.location.href = 'index.php';
            }
        })
        .catch(err => {
            console.error("Error cargando médico", err);
        });
}

// Para usar desde los botones HTML
window.wizardGoToStep2 = function() {
    document.getElementById('wizard-step-1').classList.add('d-none');
    document.getElementById('wizard-step-2').classList.remove('d-none');
    
    wizardCargarObrasSociales();
};

window.wizardCargarObrasSociales = function() {
    const container = document.getElementById('wizard-os-container');
    container.innerHTML = '<span class="text-muted">Cargando coberturas...</span>';
    
    fetch(`backend/api/get_public_agenda.php?medico_id=${wizardData.medicoId}`)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = '';
            if(!data[0].obras_sociales || data[0].obras_sociales.length === 0) {
                // Si el médico no tiene obras sociales asignadas, cargamos TODAS por defecto
                // para que el circuito pueda continuar y no se tranque.
                fetch('backend/api/crud_obras_sociales.php')
                    .then(res => res.json())
                    .then(todas => {
                        if (todas.length === 0) {
                            container.innerHTML = '<span class="text-muted">No hay obras sociales cargadas en el sistema.</span>';
                            return;
                        }
                        todas.forEach(os => {
                            const btn = document.createElement('button');
                            btn.className = 'pill-btn px-4 py-2';
                            btn.textContent = os.nombre;
                            btn.onclick = () => wizardSelectCobertura(os.id, os.nombre);
                            container.appendChild(btn);
                        });
                    });
                return;
            }
            
            // Si el médico SÍ tiene obras sociales específicas asignadas, mostrar esas:
            data[0].obras_sociales.forEach(os => {
                const btn = document.createElement('button');
                btn.className = 'pill-btn px-4 py-2';
                btn.textContent = os.nombre;
                btn.onclick = () => wizardSelectCobertura(os.obra_social_id, os.nombre);
                container.appendChild(btn);
            });
        })
        .catch(err => {
            console.error("Error cargando coberturas", err);
            container.innerHTML = '<span class="text-danger">Error al cargar coberturas.</span>';
        });
};

window.wizardSelectCobertura = function(id, nombre) {
    wizardData.coberturaId = id;
    wizardData.coberturaNombre = nombre;
    
    // Actualizar barra superior
    document.getElementById('wizard-cobertura-nombre').textContent = nombre;
    document.getElementById('wizard-cobertura-nombre').classList.remove('text-muted');
    document.getElementById('btn-cambiar-cobertura').classList.remove('d-none');
    
    document.getElementById('wizard-step-2').classList.add('d-none');
    
    if(id === 'particular') {
        wizardGoToStep4();
    } else {
        wizardCargarPlanes(id);
    }
};

window.wizardCargarPlanes = function(osId) {
    document.getElementById('wizard-step-3').classList.remove('d-none');
    const container = document.getElementById('wizard-planes-container');
    container.innerHTML = '<span class="text-muted">Cargando planes...</span>';
    
    fetch(`backend/api/get_planes_by_os.php?os_id=${osId}`)
        .then(res => res.json())
        .then(data => {
            container.innerHTML = '';
            if(!data.planes || data.planes.length === 0) {
                document.getElementById('wizard-step-3').classList.add('d-none');
                wizardGoToStep4();
                return;
            }
            data.planes.forEach(plan => {
                const btn = document.createElement('button');
                btn.className = 'pill-btn px-4 py-2';
                btn.textContent = plan.nombre;
                btn.onclick = () => {
                    wizardData.planId = plan.id;
                    wizardData.planNombre = plan.nombre;
                    document.getElementById('wizard-cobertura-nombre').textContent = `${wizardData.coberturaNombre} - ${plan.nombre}`;
                    document.getElementById('wizard-step-3').classList.add('d-none');
                    wizardGoToStep4();
                };
                container.appendChild(btn);
            });
        });
};

window.wizardGoToStep4 = function() {
    document.getElementById('wizard-step-4').classList.remove('d-none');
    wizardRenderCalendarioMock();
};

window.wizardRenderCalendarioMock = function() {
    const container = document.getElementById('wizard-dias-container');
    container.innerHTML = '';
    
    const hoy = new Date();
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const mesNombres = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    document.getElementById('wizard-mes-label').textContent = mesNombres[hoy.getMonth()];

    for(let i=1; i<=14; i++) {
        let d = new Date(hoy);
        d.setDate(hoy.getDate() + i);
        
        if(d.getDay() === 0) continue;
        
        let diaNombre = dias[d.getDay()];
        let diaNumero = d.getDate();
        let cupos = Math.floor(Math.random() * 10) + 1;
        
        const btn = document.createElement('button');
        btn.className = 'calendar-pill text-center';
        btn.innerHTML = `
            <div class="fw-bold">${diaNombre.toUpperCase()} ${diaNumero}</div>
            <div class="pill-slots">(${cupos} horarios)</div>
        `;
        
        btn.onclick = () => {
            document.querySelectorAll('#wizard-dias-container .calendar-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wizardData.fecha = d.toISOString().split('T')[0];
            wizardShowHorarios(cupos);
        };
        
        container.appendChild(btn);
    }
};

window.wizardShowHorarios = function(cupos) {
    const containerHorarios = document.getElementById('wizard-horarios-container');
    const list = document.getElementById('wizard-horarios-list');
    const btnConfirmar = document.getElementById('wizard-btn-confirmar');
    
    containerHorarios.classList.remove('d-none');
    list.innerHTML = '';
    btnConfirmar.classList.add('d-none');
    
    let baseHour = 9;
    for(let i=0; i<cupos; i++) {
        let hr = baseHour + Math.floor(i/2);
        let min = (i%2 === 0) ? '00' : '30';
        let timeStr = `${hr.toString().padStart(2, '0')}:${min}`;
        
        const btn = document.createElement('button');
        btn.className = 'pill-btn px-4 py-2';
        btn.textContent = timeStr;
        btn.onclick = () => {
            document.querySelectorAll('#wizard-horarios-list .pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wizardData.hora = timeStr;
            btnConfirmar.classList.remove('d-none');
        };
        list.appendChild(btn);
    }
};

// Botones de retroceso
document.getElementById('btn-cambiar-profesional').addEventListener('click', () => {
    window.location.href = 'index.php';
});

document.getElementById('btn-cambiar-cobertura').addEventListener('click', () => {
    document.getElementById('wizard-step-4').classList.add('d-none');
    document.getElementById('wizard-step-3').classList.add('d-none');
    document.getElementById('wizard-step-2').classList.remove('d-none');
    document.getElementById('wizard-cobertura-nombre').textContent = 'Seleccionar...';
    document.getElementById('wizard-cobertura-nombre').classList.add('text-muted');
    document.getElementById('btn-cambiar-cobertura').classList.add('d-none');
});

// Confirmar Turno
document.getElementById('wizard-btn-confirmar').addEventListener('click', () => {
    // Aquí es donde mandamos a Iniciar Sesión si no lo está.
    // Guardamos la información del turno en LocalStorage como turno "pendiente"
    localStorage.setItem('turno_pendiente', JSON.stringify(wizardData));
    
    const currentUser = auth.currentUser;
    if (currentUser) {
        // Ya está logueado
        alert(`¡Turno reservado exitosamente!\n\nMédico: ${wizardData.medicoNombre}\nEspecialidad: ${wizardData.especialidadNombre}\nFecha: ${wizardData.fecha}\nHora: ${wizardData.hora}\nCobertura: ${wizardData.coberturaNombre} ${wizardData.planNombre ? '- '+wizardData.planNombre : ''}`);
        localStorage.removeItem('turno_pendiente');
        window.location.href = 'dashboard.php';
    } else {
        // No está logueado, lo mandamos al login, y luego el login lo manda al dashboard que confirmará el turno.
        window.location.href = 'login.php?redirect=confirmar_turno';
    }
});
