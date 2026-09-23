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

    // Buscador de Coberturas
    const searchOs = document.getElementById('wizard-search-os');
    if (searchOs) {
        searchOs.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const btns = document.querySelectorAll('#wizard-os-container .os-card, #wizard-os-container .pill-btn');
            btns.forEach(btn => {
                if (btn.textContent.toLowerCase().includes(term)) {
                    btn.classList.remove('d-none');
                    btn.classList.add('d-flex'); // since os-card uses d-flex
                } else {
                    btn.classList.remove('d-flex');
                    btn.classList.add('d-none');
                }
            });
        });
    }

    // Buscador de Planes
    const searchPlan = document.getElementById('wizard-search-plan');
    if (searchPlan) {
        searchPlan.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            const btns = document.querySelectorAll('#wizard-planes-container .plan-card, #wizard-planes-container .pill-btn');
            btns.forEach(btn => {
                if (btn.textContent.toLowerCase().includes(term)) {
                    btn.classList.remove('d-none');
                    btn.classList.add('d-flex');
                } else {
                    btn.classList.remove('d-flex');
                    btn.classList.add('d-none');
                }
            });
        });
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

// Global to store grouped coverage plans
let groupedObrasSociales = {};

function agruparObrasSociales(lista) {
    const knownPrefixes = [
        "Swiss Medical Group", "Swiss Medical", 
        "OSDE", "Galeno", "Sancor Salud", "Sancor", 
        "Medife", "OMINT", "O.S.D.E.", "Accord Salud", 
        "IOMA", "PAMI", "ACA Salud", "Aca Salud", "OSECAC", "Jerarquicos Salud",
        "Luis Pasteur", "Medicus", "Prevencion Salud", "Bristol Medicine"
    ];
    
    let grupos = {};
    let resultado = [];
    
    lista.forEach(os => {
        let matchedPrefix = null;
        for (let prefix of knownPrefixes) {
            if (os.nombre.toLowerCase().startsWith(prefix.toLowerCase())) {
                matchedPrefix = prefix;
                break;
            }
        }
        
        if (matchedPrefix) {
            if (!grupos[matchedPrefix]) {
                grupos[matchedPrefix] = {
                    id: 'group_' + matchedPrefix,
                    nombre: matchedPrefix,
                    isGroup: true,
                    children: []
                };
                resultado.push(grupos[matchedPrefix]);
            }
            // Add as child
            let planName = os.nombre.substring(matchedPrefix.length).trim();
            if (planName.startsWith('-')) planName = planName.substring(1).trim();
            if (planName === '') planName = 'Plan General';
            
            grupos[matchedPrefix].children.push({
                id: os.id || os.obra_social_id,
                nombre: planName,
                fullName: os.nombre
            });
        } else {
            resultado.push({
                id: os.id || os.obra_social_id,
                nombre: os.nombre,
                isGroup: false,
                children: []
            });
        }
    });
    
    // Sort
    resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    return resultado;
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
            
            const renderGroupedObras = (lista, esFallback) => {
                const agrupadas = agruparObrasSociales(lista);
                groupedObrasSociales = {}; // Reset global map
                
                agrupadas.forEach(os => {
                    if (os.isGroup) {
                        groupedObrasSociales[os.id] = os.children;
                    }
                    const btn = document.createElement('button');
                    // Usar nuevo estilo visual
                    btn.className = 'os-card btn btn-light shadow-sm d-flex flex-column justify-content-center align-items-center p-3 text-center';
                    btn.style.width = '180px';
                    btn.style.height = '120px';
                    btn.style.borderRadius = '12px';
                    btn.style.border = '1px solid rgba(0,0,0,0.05)';
                    btn.style.transition = 'all 0.3s ease';
                    
                    btn.innerHTML = `<span class="fw-semibold text-primary mb-2">${os.nombre}</span>
                                     <small class="text-muted" style="font-size: 0.75rem;">
                                       ${os.isGroup ? os.children.length + ' planes' : 'Seleccionar'}
                                     </small>`;
                                     
                    btn.onmouseover = () => {
                        btn.classList.remove('btn-light');
                        btn.classList.add('btn-primary', 'text-white');
                        btn.querySelector('span').classList.remove('text-primary');
                        btn.querySelector('span').classList.add('text-white');
                        btn.querySelector('small').classList.remove('text-muted');
                        btn.querySelector('small').classList.add('text-white-50');
                        btn.style.transform = 'translateY(-3px)';
                        btn.style.boxShadow = '0 10px 20px rgba(13, 110, 253, 0.2)';
                    };
                    btn.onmouseout = () => {
                        btn.classList.add('btn-light');
                        btn.classList.remove('btn-primary', 'text-white');
                        btn.querySelector('span').classList.add('text-primary');
                        btn.querySelector('span').classList.remove('text-white');
                        btn.querySelector('small').classList.add('text-muted');
                        btn.querySelector('small').classList.remove('text-white-50');
                        btn.style.transform = 'translateY(0)';
                        btn.style.boxShadow = 'none';
                    };
                    
                    // Fix ID mapping when rendering specific items
                    const actualId = esFallback ? os.id : (os.obra_social_id || os.id);
                    btn.onclick = () => wizardSelectCobertura(actualId, os.nombre, os.isGroup);
                    container.appendChild(btn);
                });
            };

            if(!data[0].obras_sociales || data[0].obras_sociales.length === 0) {
                fetch('backend/api/crud_obras_sociales.php')
                    .then(res => res.json())
                    .then(todas => {
                        if (todas.length === 0) {
                            container.innerHTML = '<span class="text-muted">No hay obras sociales cargadas en el sistema.</span>';
                            return;
                        }
                        renderGroupedObras(todas, true);
                    });
                return;
            }
            
            renderGroupedObras(data[0].obras_sociales, false);
        })
        .catch(err => {
            console.error("Error cargando coberturas", err);
            container.innerHTML = '<span class="text-danger">Error al cargar coberturas.</span>';
        });
};

window.wizardSelectCobertura = function(id, nombre, isGroup = false) {
    wizardData.coberturaId = id;
    wizardData.coberturaNombre = nombre;
    wizardData.isGroup = isGroup;
    
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
    
    // Limpiar buscador si existe
    const searchPlan = document.getElementById('wizard-search-plan');
    if(searchPlan) searchPlan.value = '';
    
    const renderPlanes = (planesArray) => {
        container.innerHTML = '';
        if(!planesArray || planesArray.length === 0) {
            document.getElementById('wizard-step-3').classList.add('d-none');
            wizardGoToStep4();
            return;
        }
        planesArray.forEach(plan => {
            const btn = document.createElement('button');
            btn.className = 'plan-card btn btn-outline-primary px-4 py-3 m-2 d-flex align-items-center justify-content-center fw-semibold';
            btn.style.borderRadius = '50px';
            btn.style.minWidth = '200px';
            btn.textContent = plan.nombre;
            btn.onclick = () => {
                wizardData.planId = plan.id;
                // Si es del grupo extraído, el nombre puede ser corto. Usamos plan.nombre
                wizardData.planNombre = plan.nombre;
                document.getElementById('wizard-cobertura-nombre').textContent = `${wizardData.coberturaNombre} - ${plan.nombre}`;
                document.getElementById('wizard-step-3').classList.add('d-none');
                wizardGoToStep4();
            };
            container.appendChild(btn);
        });
    };

    // Si osId es un grupo virtual generado por nuestro JS
    if (wizardData.isGroup && groupedObrasSociales[osId]) {
        renderPlanes(groupedObrasSociales[osId]);
        return;
    }

    // Si no es un grupo virtual, usamos la tabla real de planes_obras_sociales
    fetch(`backend/api/get_planes.php?obra_social_id=${osId}`)
        .then(res => res.json())
        .then(data => {
            renderPlanes(data);
        })
        .catch(err => {
            console.error("Error cargando planes", err);
            document.getElementById('wizard-step-3').classList.add('d-none');
            wizardGoToStep4();
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
        btn.className = 'btn btn-outline-primary m-2 d-flex flex-column align-items-center justify-content-center shadow-sm';
        btn.style.width = '110px';
        btn.style.height = '110px';
        btn.style.borderRadius = '20px';
        btn.style.transition = 'all 0.3s ease';
        
        btn.innerHTML = `
            <span class="text-uppercase fw-bold text-muted mb-1" style="font-size:0.8rem">${diaNombre}</span>
            <span class="fs-2 fw-bolder mb-1">${diaNumero}</span>
            <small class="text-muted" style="font-size:0.7rem">${cupos} turnos</small>
        `;
        
        btn.onclick = () => {
            document.querySelectorAll('#wizard-dias-container .btn').forEach(b => {
                b.classList.remove('btn-primary', 'text-white');
                b.classList.add('btn-outline-primary');
                b.querySelectorAll('.text-muted').forEach(el => el.classList.remove('text-white-50'));
            });
            btn.classList.remove('btn-outline-primary');
            btn.classList.add('btn-primary', 'text-white');
            btn.querySelectorAll('.text-muted').forEach(el => el.classList.add('text-white-50'));
            
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
        btn.className = 'btn btn-outline-primary px-4 py-2 fw-bold shadow-sm';
        btn.style.borderRadius = '50px';
        btn.textContent = timeStr;
        btn.onclick = () => {
            document.querySelectorAll('#wizard-horarios-list .btn').forEach(b => b.classList.remove('active', 'btn-primary', 'text-white'));
            btn.classList.add('active', 'btn-primary', 'text-white');
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
